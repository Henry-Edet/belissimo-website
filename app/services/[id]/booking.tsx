import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { API_BASE_URL } from '../../../lib/config';
import { SERVICES, SubService } from '../../../lib/data/services';

// Define a type for sub-service with unique ID
interface SubServiceWithUniqueId extends SubService {
  uniqueId: string;
  originalId: string;
  backendServiceId: string;
}

// Define a type for main service with unique sub-service IDs
interface MainServiceWithUniqueIds {
  id: string;
  title: string;
  description: string;
  image: any;
  subservices: SubServiceWithUniqueId[];
  backendServiceId?: string;
}

export default function BookingScreen() {
  const { id: mainServiceId, subServiceId, subServiceName, price } = useLocalSearchParams();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMainService, setSelectedMainService] = useState<string>(mainServiceId as string || 'installation');
  const [selectedSubService, setSelectedSubService] = useState<string>('');
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [backendServices, setBackendServices] = useState<any[]>([]);
  const [uniqueServices, setUniqueServices] = useState<Record<string, MainServiceWithUniqueIds>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [showBookingSection, setShowBookingSection] = useState(false);

  const times = [
    '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM',
    '03:00 PM', '04:00 PM', '05:00 PM',
  ];

  // Fetch backend services and map them to frontend services
  useEffect(() => {
    fetchServicesAndMap();
  }, []);

  const fetchServicesAndMap = async () => {
    try {
      setLoadingData(true);
      
      const backendResponse = await fetch(`${API_BASE_URL}/services`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (backendResponse.ok) {
        const backendServicesData = await backendResponse.json();
        setBackendServices(backendServicesData);
        console.log('✅ Backend services loaded:', backendServicesData);
        
        const mappedServices = mapServicesToBackend(SERVICES, backendServicesData);
        setUniqueServices(mappedServices);
      } else {
        console.warn('⚠ Could not fetch backend services, using mock data');
        const mockServices = createUniqueServices(SERVICES, []);
        setUniqueServices(mockServices);
      }
    } catch (error) {
      console.error('❌ Error fetching services:', error);
      const mockServices = createUniqueServices(SERVICES, []);
      setUniqueServices(mockServices);
    } finally {
      setLoadingData(false);
    }
  };

  // Function to map frontend services to backend services
  const mapServicesToBackend = (
    frontendServices: typeof SERVICES, 
    backendServices: any[]
  ): Record<string, MainServiceWithUniqueIds> => {
    const result: Record<string, MainServiceWithUniqueIds> = {};
    
    // Create a mapping of service names to backend IDs with flexible matching
    const serviceNameToBackendId: Record<string, string> = {};
    
    backendServices.forEach(service => {
      const serviceName = service.name.toLowerCase().trim();
      serviceNameToBackendId[serviceName] = service.id;
      
      // Also create variations for matching
      if (serviceName.includes('wash')) {
        serviceNameToBackendId['wash & care'] = service.id;
        serviceNameToBackendId['wash and care'] = service.id;
      }
      if (serviceName.includes('braid')) {
        serviceNameToBackendId['braids'] = service.id;
      }
      if (serviceName.includes('installation') || serviceName.includes('wig')) {
        serviceNameToBackendId['wig installation & styling'] = service.id;
        serviceNameToBackendId['installation'] = service.id;
      }
    });
    
    console.log('🔍 Service name mappings:', serviceNameToBackendId);
    
    Object.keys(frontendServices).forEach(mainServiceId => {
      const mainService = frontendServices[mainServiceId];
      
      // Try to find matching backend service for this main service
      const mainServiceName = mainService.title.toLowerCase().trim();
      let mainServiceBackendId = serviceNameToBackendId[mainServiceName];
      
      // If not found, try partial matches
      if (!mainServiceBackendId) {
        // Check for partial matches
        Object.keys(serviceNameToBackendId).forEach(backendName => {
          if (mainServiceName.includes(backendName) || backendName.includes(mainServiceName)) {
            mainServiceBackendId = serviceNameToBackendId[backendName];
            console.log(`🔗 Partial match found: ${mainServiceName} -> ${backendName}`);
          }
        });
      }
      
      if (!mainServiceBackendId) {
        console.warn(`⚠ No backend service found for: ${mainService.title}`);
        // Use first available backend service as fallback
        mainServiceBackendId = backendServices.length > 0 ? backendServices[0].id : 'fallback-id';
      } else {
        console.log(`✅ Matched: ${mainService.title} -> ${mainServiceBackendId.substring(0, 8)}...`);
      }
      
      const idCounts: Record<string, number> = {};
      
      const uniqueSubservices = mainService.subservices.map((subService, index) => {
        idCounts[subService.id] = (idCounts[subService.id] || 0) + 1;
        const count = idCounts[subService.id];
        
        return {
          ...subService,
          uniqueId: `${mainServiceId}-${subService.id}-${count}`,
          originalId: subService.id,
          backendServiceId: mainServiceBackendId,
        };
      });
      
      result[mainServiceId] = {
        ...mainService,
        subservices: uniqueSubservices,
        backendServiceId: mainServiceBackendId,
      };
    });
    
    return result;
  };

  // Function to create unique services when backend is not available
  const createUniqueServices = (
    frontendServices: typeof SERVICES,
    backendServices: any[]
  ): Record<string, MainServiceWithUniqueIds> => {
    const result: Record<string, MainServiceWithUniqueIds> = {};
    
    const fallbackBackendId = backendServices.length > 0 ? backendServices[0].id : 'fallback-id';
    
    Object.keys(frontendServices).forEach((mainServiceId, mainIndex) => {
      const mainService = frontendServices[mainServiceId];
      
      const idCounts: Record<string, number> = {};
      
      const uniqueSubservices = mainService.subservices.map((subService, index) => {
        idCounts[subService.id] = (idCounts[subService.id] || 0) + 1;
        const count = idCounts[subService.id];
        
        return {
          ...subService,
          uniqueId: `${mainServiceId}-${subService.id}-${count}`,
          originalId: subService.id,
          backendServiceId: fallbackBackendId,
        };
      });
      
      result[mainServiceId] = {
        ...mainService,
        subservices: uniqueSubservices,
        backendServiceId: fallbackBackendId,
      };
    });
    
    return result;
  };

  // Get available main services
  const mainServices = Object.values(uniqueServices);

  // Get subservices for selected main service
  const currentSubServices = uniqueServices[selectedMainService]?.subservices || [];

  // Initialize selected sub-service
  useEffect(() => {
    if (subServiceId && currentSubServices.length > 0) {
      const foundSubService = currentSubServices.find(s => s.originalId === subServiceId);
      if (foundSubService) {
        setSelectedSubService(foundSubService.uniqueId);
      }
    }
    
    if (currentSubServices.length > 0 && !selectedSubService) {
      setSelectedSubService(currentSubServices[0].uniqueId);
    }
  }, [selectedMainService, subServiceId, currentSubServices]);

  // Get selected sub-service details
  const selectedSubServiceDetails = currentSubServices.find(s => s.uniqueId === selectedSubService);

  // Get the backend service ID for the selected main service
  const selectedMainServiceBackendId = uniqueServices[selectedMainService]?.backendServiceId;

  // Get current main service details for the hero section
  const currentMainService = uniqueServices[selectedMainService];

  // Fetch existing bookings for the selected date
  const fetchExistingBookings = async (date: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings?date=${date}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setExistingBookings(data);
        console.log('📅 Existing bookings loaded:', data.length, 'bookings');
      }
    } catch (error) {
      console.error('Error fetching existing bookings:', error);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchExistingBookings(selectedDate);
    } else {
      setExistingBookings([]);
    }
  }, [selectedDate]);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // Enhanced: Check if a time slot is already booked for the selected sub-service
  const isTimeSlotBooked = (time: string) => {
    if (!selectedDate || !selectedSubServiceDetails || !selectedMainServiceBackendId || existingBookings.length === 0) {
      return false;
    }

    const [hour, minutePart] = time.split(':');
    const minute = minutePart.slice(0, 2);
    const period = minutePart.slice(3).trim();

    let hour24 = parseInt(hour);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;

    const slotStartAt = `${selectedDate}T${hour24.toString().padStart(2, '0')}:${minute}:00`;
    const slotDate = new Date(slotStartAt);
    const slotEndDate = new Date(slotDate.getTime() + (selectedSubServiceDetails?.durationMinutes || 120) * 60000);

    // Check for overlapping bookings for the SAME sub-service name
    return existingBookings.some(booking => {
      // Check if booking is for the same main service
      if (booking.serviceId !== selectedMainServiceBackendId) {
        return false;
      }

      // Check if booking has the same sub-service name (exact match)
      // This prevents double booking of the exact same service type
      if (booking.subServiceName && booking.subServiceName === selectedSubServiceDetails.name) {
        const bookingStart = new Date(booking.startAt);
        const bookingEnd = new Date(bookingStart.getTime() + (booking.durationMinutes || 120) * 60000);

        // Check for time overlap
        const overlap = slotDate < bookingEnd && slotEndDate > bookingStart;
        return overlap;
      }
      
      return false;
    });
  };

  // Check if a time slot is fully booked (max capacity reached)
  const isTimeSlotFullyBooked = (time: string) => {
    if (!selectedDate || existingBookings.length === 0) {
      return false;
    }

    const [hour, minutePart] = time.split(':');
    const minute = minutePart.slice(0, 2);
    const period = minutePart.slice(3).trim();

    let hour24 = parseInt(hour);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;

    const slotStartAt = `${selectedDate}T${hour24.toString().padStart(2, '0')}:${minute}:00`;
    const slotDate = new Date(slotStartAt);
    const slotEndDate = new Date(slotDate.getTime() + (selectedSubServiceDetails?.durationMinutes || 120) * 60000);

    // Count ALL bookings in this time slot for the same main service
    const overlappingBookings = existingBookings.filter(booking => {
      if (booking.serviceId !== selectedMainServiceBackendId) {
        return false;
      }

      const bookingStart = new Date(booking.startAt);
      const bookingEnd = new Date(bookingStart.getTime() + (booking.durationMinutes || 120) * 60000);

      // Check for time overlap
      return slotDate < bookingEnd && slotEndDate > bookingStart;
    });

    // Maximum total bookings per time slot for this main service
    const maxCapacity = 3; // You can adjust this based on your business needs
    return overlappingBookings.length >= maxCapacity;
  };

  // Enhanced availability check with better concurrency control
  const checkAvailability = async () => {
  if (!selectedDate || !selectedTime) {
    showAlert('Required', 'Please select both date and time first');
    return;
  }

  if (!selectedSubServiceDetails) {
    showAlert('Service Required', 'Please select a sub-service first');
    return;
  }

  if (!selectedMainServiceBackendId) {
    showAlert('Configuration Error', 'Service configuration error. Please contact support.');
    return;
  }

  setLoading(true);
  setAvailability(null);

  try {
    const [hour, minutePart] = selectedTime.split(':');
    const minute = minutePart.slice(0, 2);
    const period = minutePart.slice(3).trim();

    let hour24 = parseInt(hour, 10);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;

    const startAt =
      `${selectedDate}T${hour24.toString().padStart(2, '0')}:${minute}:00`;

    // ✅ CORRECT BACKEND ROUTE
    const endpoint = `${API_BASE_URL}/bookings/availability/check`;

    // ✅ SEND durationMinutes (THIS FIXES THE 500)
    const url =
      `${endpoint}?serviceId=${encodeURIComponent(selectedMainServiceBackendId)}` +
      `&startAt=${encodeURIComponent(startAt)}` +
      `&durationMinutes=${encodeURIComponent(
        selectedSubServiceDetails.durationMinutes
      )}`;

    console.log('🔄 Availability check URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('❌ Backend error:', responseText);
      showAlert('Error', 'Server could not check availability. Please try again.');
      setAvailability(null);
      return;
    }

    const data = JSON.parse(responseText);

    if (typeof data.available === 'boolean') {
      setAvailability(data.available);
      showAlert(
        data.available ? '✅ Available!' : '⛔ Unavailable',
        data.available
          ? 'This slot is free. You can proceed to payment.'
          : 'This time slot is no longer available. Please select another time.'
      );
    } else {
      showAlert('Error', 'Unexpected response from server.');
      setAvailability(null);
    }
  } catch (err: any) {
    console.error('❌ Availability check failed:', err);
    showAlert('Error', 'Could not check availability. Please try again.');
    setAvailability(null);
  } finally {
    setLoading(false);
  }
};

  const proceedToPayment = () => {
    if (availability === null) {
      showAlert('Check Required', 'Please check availability first');
      return;
    }

    if (!availability) {
      showAlert('Unavailable', 'This time is unavailable. Please pick another slot.');
      return;
    }

    if (!selectedSubServiceDetails) {
      showAlert('Error', 'Please select a sub-service');
      return;
    }

    if (!selectedMainServiceBackendId) {
      showAlert('Error', 'Service configuration error');
      return;
    }

    // IMPORTANT: Create a temporary lock on this time slot
    // This prevents race conditions where two users might book the same slot
    const bookingLock = {
      serviceId: selectedMainServiceBackendId,
      subServiceName: selectedSubServiceDetails.name,
      date: selectedDate,
      time: selectedTime,
      startAt: `${selectedDate}T${selectedTime}`,
      timestamp: Date.now()
    };
    
    // Store in session storage (expires when tab closes)
    if (Platform.OS === 'web') {
      sessionStorage.setItem('bookingLock', JSON.stringify(bookingLock));
    }

    router.push({
      pathname: `/payment/checkout`,
      params: {
        serviceId: selectedMainServiceBackendId,
        mainServiceId: selectedMainService,
        subServiceName: selectedSubServiceDetails.name,
        price: selectedSubServiceDetails.price.toString(),
        durationMinutes: selectedSubServiceDetails.durationMinutes.toString(),
        date: selectedDate,
        time: selectedTime,
        subServiceOriginalId: selectedSubServiceDetails.originalId,
        subServiceUniqueId: selectedSubServiceDetails.uniqueId,
        // Add a unique booking token to prevent duplicate submissions
        bookingToken: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      },
    });
  };

  const handleContinueToBooking = () => {
    if (!selectedSubService) {
      showAlert('Selection Required', 'Please select a style first');
      return;
    }
    setShowBookingSection(true);
  };

  // If loading data
  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B04A75" />
        <Text style={styles.loadingText}>Loading services...</Text>
      </View>
    );
  }

  // If no main services available
  if (mainServices.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>No Services Available</Text>
        <Text style={styles.errorText}>
          There are no services available for booking at the moment.
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section with Image */}
      {currentMainService?.image && (
        <Image source={currentMainService.image} style={styles.heroImage} />
      )}

      {/* Service Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.serviceTitle}>{currentMainService?.title}</Text>
        <Text style={styles.serviceDescription}>{currentMainService?.description}</Text>

        {/* Sub-Service Selection */}
        <Text style={styles.sectionTitle}>Choose Your Style</Text>
        
        <View style={styles.subServicesGrid}>
          {currentSubServices.map((subService) => (
            <TouchableOpacity
              key={subService.uniqueId}
              style={[
                styles.subServiceCard,
                selectedSubService === subService.uniqueId && styles.subServiceCardActive
              ]}
              onPress={() => {
                setSelectedSubService(subService.uniqueId);
                setAvailability(null);
              }}
            >
              <Text style={[
                styles.subServiceName,
                selectedSubService === subService.uniqueId && styles.subServiceNameActive
              ]}>
                {subService.name}
              </Text>
              <Text style={styles.subServicePrice}>
                ${(subService.price / 100).toFixed(2)}
              </Text>
              <Text style={styles.subServiceDuration}>
                {subService.durationMinutes} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        {!showBookingSection && (
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinueToBooking}
            disabled={!selectedSubService}
          >
            <Text style={styles.continueButtonText}>
              {selectedSubService ? 'Continue to Booking' : 'Select a Style First'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Booking Section (Shows after style selection) */}
      {showBookingSection && selectedSubServiceDetails && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 500 }}
        >
          <View style={styles.bookingSection}>
            <Text style={styles.bookingTitle}>Booking Details</Text>
            
            {/* Selected Service Summary */}
            <View style={styles.selectionSummary}>
              <Text style={styles.summaryHeading}>Selected Service</Text>
              <Text style={styles.summaryText}>
                {currentMainService?.title} → {selectedSubServiceDetails.name}
              </Text>
              <Text style={styles.summaryText}>
                Duration: {selectedSubServiceDetails.durationMinutes} minutes
              </Text>
              <Text style={styles.summaryText}>
                Price: ${(selectedSubServiceDetails.price / 100).toFixed(2)}
              </Text>
            </View>

            {/* Date Selection */}
            <Text style={styles.sectionTitle}>Select a Date</Text>
            <View style={styles.calendarContainer}>
              <Calendar
                onDayPress={(day) => {
                  setSelectedDate(day.dateString);
                  setAvailability(null);
                }}
                markedDates={
                  selectedDate ? { [selectedDate]: { selected: true, selectedColor: '#D681A0' } } : {}
                }
                theme={{
                  todayTextColor: '#B04A75',
                  arrowColor: '#B04A75',
                  selectedDayBackgroundColor: '#D681A0',
                  selectedDayTextColor: '#ffffff',
                }}
                minDate={new Date().toISOString().split('T')[0]}
              />
            </View>

            {/* Time Selection */}
            <Text style={styles.sectionTitle}>Select a Time</Text>
            <View style={styles.timeGrid}>
              {times.map((time) => {
                const isBooked = isTimeSlotBooked(time);
                const isFullyBooked = isTimeSlotFullyBooked(time);
                const isDisabled = isBooked || isFullyBooked;
                
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlot,
                      selectedTime === time && styles.timeSlotActive,
                      isDisabled && styles.timeSlotBooked,
                    ]}
                    onPress={() => {
                      if (!isDisabled) {
                        setSelectedTime(time);
                        setAvailability(null);
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <Text style={[
                      styles.timeText,
                      selectedTime === time && styles.timeTextActive,
                      isDisabled && styles.timeTextBooked,
                    ]}>
                      {time}
                    </Text>
                    {isBooked && (
                      <Text style={styles.bookedBadge}>Booked</Text>
                    )}
                    {isFullyBooked && !isBooked && (
                      <Text style={styles.fullBadge}>Full</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time Slot Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#F8E6EB' }]} />
                <Text style={styles.legendText}>Available</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#D681A0' }]} />
                <Text style={styles.legendText}>Selected</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#ffcccc' }]} />
                <Text style={styles.legendText}>Booked/Full</Text>
              </View>
            </View>

            {/* Availability Check */}
            {selectedDate && selectedTime && (
              <View style={styles.availabilitySection}>
                {availability !== null && (
                  <View style={styles.availabilityResult}>
                    <Text style={[
                      styles.availabilityText, 
                      availability ? styles.availableText : styles.unavailableText
                    ]}>
                      {availability ? '✅ Available' : '❌ Unavailable'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.checkButton, loading && styles.checkButtonDisabled]} 
                  onPress={checkAvailability} 
                  disabled={loading}
                >
                  <Text style={styles.checkButtonText}>
                    {loading ? 'Checking...' : 'Check Availability'}
                  </Text>
                </TouchableOpacity>

                {availability === true && (
                  <TouchableOpacity
                    style={styles.proceedButton}
                    onPress={proceedToPayment}
                    disabled={loading}
                  >
                    <Text style={styles.proceedButtonText}>
                      Proceed to Payment
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </MotiView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF8F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F9',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#3B1C1A',
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3B1C1A',
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: '#B04A75',
    borderRadius: 18,
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 30,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  heroImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  serviceTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3B1C1A',
    marginBottom: 12,
  },
  serviceDescription: {
    fontSize: 16,
    color: '#7C6665',
    lineHeight: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B1C1A',
    marginBottom: 16,
    marginTop: 8,
  },
  subServicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  subServiceCard: {
    width: '48%',
    backgroundColor: '#F8E6EB',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  subServiceCardActive: {
    backgroundColor: '#D681A0',
    borderColor: '#B04A75',
    transform: [{ scale: 1.02 }],
  },
  subServiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B1C1A',
    marginBottom: 6,
  },
  subServiceNameActive: {
    color: '#fff',
    fontWeight: '700',
  },
  subServicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B1C1A',
    marginBottom: 4,
  },
  subServiceDuration: {
    fontSize: 12,
    color: '#666',
  },
  continueButton: {
    backgroundColor: '#B04A75',
    borderRadius: 25,
    paddingVertical: 18,
    marginTop: 16,
    shadowColor: '#B04A75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 18,
  },
  bookingSection: {
    backgroundColor: '#F9F9F9',
    borderRadius: 25,
    padding: 24,
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 30,
  },
  bookingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3B1C1A',
    marginBottom: 20,
    textAlign: 'center',
  },
  selectionSummary: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#B04A75',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 15,
    color: '#3B1C1A',
    marginBottom: 6,
    fontWeight: '500',
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeSlot: {
    width: '30%',
    paddingVertical: 14,
    backgroundColor: '#F8E6EB',
    borderRadius: 14,
    marginVertical: 8,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timeSlotActive: {
    backgroundColor: '#D681A0',
    transform: [{ scale: 1.05 }],
    shadowColor: '#D681A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  timeSlotBooked: {
    backgroundColor: '#ffcccc',
    opacity: 0.6,
  },
  timeText: { 
    color: '#3B1C1A', 
    fontWeight: '600',
    fontSize: 15,
  },
  timeTextActive: { 
    color: '#fff',
    fontWeight: '700',
  },
  timeTextBooked: {
    color: '#666',
    textDecorationLine: 'line-through',
  },
  bookedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 9,
    color: 'red',
    fontWeight: 'bold',
    backgroundColor: 'white',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  fullBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 9,
    color: 'orange',
    fontWeight: 'bold',
    backgroundColor: 'white',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    marginBottom: 24,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  availabilitySection: {
    marginTop: 8,
  },
  availabilityResult: {
    alignItems: 'center',
    marginBottom: 20,
  },
  availabilityText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  availableText: {
    color: 'green',
  },
  unavailableText: {
    color: 'red',
  },
  checkButton: {
    backgroundColor: '#B04A75',
    borderRadius: 25,
    paddingVertical: 18,
    marginBottom: 16,
    shadowColor: '#B04A75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkButtonDisabled: {
    backgroundColor: '#d8b0c1',
    opacity: 0.7,
  },
  checkButtonText: { 
    color: '#fff', 
    textAlign: 'center', 
    fontWeight: '700',
    fontSize: 18,
  },
  proceedButton: {
    backgroundColor: '#D681A0',
    borderRadius: 25,
    paddingVertical: 18,
    shadowColor: '#D681A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  proceedButtonText: { 
    color: '#fff', 
    textAlign: 'center', 
    fontWeight: '700',
    fontSize: 18,
  },
});