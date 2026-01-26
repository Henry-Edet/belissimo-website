// app/payments/checkout.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { 
  ArrowLeft, 
  CreditCard, 
  Smartphone, 
  Shield, 
  Check,
  Lock,
  User,
  Phone,
  Calendar,
  Clock
} from 'lucide-react-native';
import { API_BASE_URL } from '../../lib/config';

// Define TypeScript interfaces
interface BookingDetails {
  id: string;
  serviceName: string;
  date: string;
  time: string;
  duration: string;
  price: number;
  deposit: number;
  backendServiceId: string;
  mainServiceId: string;
  subServiceId: string;
}

interface CardDetails {
  number: string;
  expiry: string;
  cvv: string;
  name: string;
}

interface PaymentMethod {
  id: 'card' | 'transfer';
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

interface UserDetails {
  name: string;
  phone: string;
  email: string;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    serviceId: string;
    mainServiceId: string;
    subServiceName: string;
    price: string;
    durationMinutes: string;
    date: string;
    time: string;
    subServiceOriginalId: string;
    subServiceUniqueId: string;
    bookingToken: string;
  }>();
  
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'transfer'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: '',
    phone: '',
    email: '',
  });

  // Extract booking details from params with proper typing
  const bookingDetails: BookingDetails = {
    id: `BK-${Date.now().toString().slice(-6)}`,
    serviceName: params.subServiceName || 'Wig Installation & Styling',
    date: params.date || '2026-01-29',
    time: params.time || '09:00 AM',
    duration: params.durationMinutes || '120',
    price: parseInt(params.price || '25000'),
    deposit: Math.round(parseInt(params.price || '25000') * 0.3),
    backendServiceId: params.serviceId || '',
    mainServiceId: params.mainServiceId || '',
    subServiceId: params.subServiceOriginalId || '',
  };

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      color: '#4A6FA5',
      bgColor: '#E8EFF9',
    },
    {
      id: 'transfer',
      name: 'Bank Transfer',
      icon: Smartphone,
      color: '#38A169',
      bgColor: '#E6F6EC',
    },
  ];

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic validation for Nigerian phone numbers
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const handlePayment = async (): Promise<void> => {
    // Validate user details
    if (!userDetails.name.trim()) {
      Alert.alert('Required', 'Please enter your full name');
      return;
    }

    if (!userDetails.phone.trim()) {
      Alert.alert('Required', 'Please enter your phone number');
      return;
    }

    if (!validatePhoneNumber(userDetails.phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid Nigerian phone number (e.g., 08077050957)');
      return;
    }

    // Validate terms
    if (!acceptedTerms) {
      Alert.alert('Terms Required', 'Please accept the cancellation policy to proceed');
      return;
    }

    // Validate card details if using card
    if (selectedMethod === 'card') {
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name) {
        Alert.alert('Incomplete Details', 'Please fill all card details');
        return;
      }
      
      if (cardDetails.number.replace(/\s/g, '').length < 16) {
        Alert.alert('Invalid Card', 'Please enter a valid card number');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // Format the date and time for the backend
      const [hour, minutePart] = bookingDetails.time.split(':');
      const minute = minutePart.slice(0, 2);
      const period = minutePart.slice(3).trim();

      let hour24 = parseInt(hour, 10);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;

      const startAt = `${bookingDetails.date}T${hour24.toString().padStart(2, '0')}:${minute}:00`;

      console.log('📝 Creating booking with:', {
        serviceId: bookingDetails.backendServiceId,
        startAt,
        clientName: userDetails.name,
        clientPhone: userDetails.phone,
        subServiceName: bookingDetails.serviceName,
      });

      // 1. Create the booking in your backend
      const bookingResponse = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          serviceId: bookingDetails.backendServiceId,
          clientName: userDetails.name,
          clientPhone: userDetails.phone,
          startAt,
          subServiceName: bookingDetails.serviceName,
        }),
      });

      if (!bookingResponse.ok) {
        const errorText = await bookingResponse.text();
        console.error('❌ Booking creation failed:', errorText);
        
        if (bookingResponse.status === 409) {
          throw new Error('This time slot was just booked by someone else. Please choose another time.');
        } else if (bookingResponse.status === 400) {
          throw new Error('Invalid booking details. Please check your information.');
        } else {
          throw new Error(`Server error: ${bookingResponse.status}`);
        }
      }

      const booking = await bookingResponse.json();
      console.log('✅ Booking created:', booking);

      // 2. Simulate payment processing
      console.log('💳 Processing payment...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIsProcessing(false);
      setIsSuccess(true);
      
      // Redirect to confirmation after delay
      setTimeout(() => {
      router.push({
        pathname: '/payments/confirmation',
        params: {
          bookingId: booking.id || bookingDetails.id,
          amount: bookingDetails.deposit.toString(),
          serviceName: bookingDetails.serviceName,
          date: bookingDetails.date,
          time: bookingDetails.time,
          clientName: userDetails.name,
          clientPhone: userDetails.phone,
        }
      });
      }, 7000);
      
    } catch (error: any) {
      setIsProcessing(false);
      Alert.alert(
        'Payment Failed', 
        error.message || 'Could not process payment. Please try again.'
      );
      console.error('❌ Payment error:', error);
    }
  };

  const handleBack = (): void => {
    router.back();
  };

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <MotiView
          from={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 600 }}
          style={styles.successContent}
        >
          <View style={styles.successIcon}>
            <Check size={40} color="#fff" />
          </View>
          
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successMessage}>
            Your deposit has been processed. Your booking is now confirmed.
          </Text>
          
          <View style={styles.bookingSummary}>
            <Text style={styles.summaryLabel}>Booking ID</Text>
            <Text style={styles.bookingId}>{bookingDetails.id}</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>{bookingDetails.serviceName}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date & Time</Text>
              <Text style={styles.summaryValue}>
                {formatDate(bookingDetails.date)} • {bookingDetails.time}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount Paid</Text>
              <Text style={styles.amountPaid}>
                ₦{bookingDetails.deposit.toLocaleString()}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.dashboardButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#3B1C1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={styles.securityBadge}>
          <Shield size={16} color="#4A6FA5" />
          <Text style={styles.securityText}>Secure</Text>
        </View>
      </View>

      {/* Booking Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Booking Summary</Text>
        
        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Calendar size={18} color="#7C6665" />
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(bookingDetails.date)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Clock size={18} color="#7C6665" />
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{bookingDetails.time}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <CreditCard size={18} color="#7C6665" />
            <Text style={styles.detailLabel}>Service:</Text>
            <Text style={styles.detailValue}>{bookingDetails.serviceName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Clock size={18} color="#7C6665" />
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{bookingDetails.duration} minutes</Text>
          </View>
        </View>
      </View>

      {/* User Details Form - ADDED THIS SECTION */}
      <View style={styles.userDetailsCard}>
        <Text style={styles.sectionTitle}>Your Details</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={userDetails.name}
            onChangeText={(text) => setUserDetails({...userDetails, name: text})}
            autoCapitalize="words"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="08077050957"
            value={userDetails.phone}
            onChangeText={(text) => setUserDetails({...userDetails, phone: text})}
            keyboardType="phone-pad"
            maxLength={11}
          />
          <Text style={styles.inputHint}>Enter 11-digit Nigerian number</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            value={userDetails.email}
            onChangeText={(text) => setUserDetails({...userDetails, email: text})}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Payment Methods */}
      <View style={styles.methodsCard}>
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        
        <View style={styles.methodsContainer}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodButton,
                selectedMethod === method.id && styles.methodButtonActive,
                { backgroundColor: method.bgColor }
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View style={styles.methodIconContainer}>
                <method.icon size={24} color={method.color} />
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>{method.name}</Text>
                <Text style={styles.methodDescription}>
                  {method.id === 'card' ? 'Visa, Mastercard, Verve' : 'Bank transfer or USSD'}
                </Text>
              </View>
              {selectedMethod === method.id && (
                <View style={styles.selectedIndicator}>
                  <View style={styles.selectedDot} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Card Form */}
        {selectedMethod === 'card' && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.cardForm}
          >
            <Text style={styles.formTitle}>Card Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                value={cardDetails.number}
                onChangeText={(text) => setCardDetails({...cardDetails, number: text})}
                keyboardType="numeric"
                maxLength={19}
              />
            </View>
            
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  value={cardDetails.expiry}
                  onChangeText={(text) => setCardDetails({...cardDetails, expiry: text})}
                  maxLength={5}
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  value={cardDetails.cvv}
                  onChangeText={(text) => setCardDetails({...cardDetails, cvv: text})}
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={cardDetails.name}
                onChangeText={(text) => setCardDetails({...cardDetails, name: text})}
              />
            </View>
          </MotiView>
        )}

        {/* Transfer Details */}
        {selectedMethod === 'transfer' && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.transferDetails}
          >
            <Text style={styles.formTitle}>Bank Transfer Details</Text>
            
            <View style={styles.transferInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bank Name</Text>
                <Text style={styles.infoValue}>Bellissimo Beauty Bank</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account Number</Text>
                <Text style={[styles.infoValue, styles.accountNumber]}>1234567890</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account Name</Text>
                <Text style={styles.infoValue}>Bellissimo Hair Studio</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Amount</Text>
                <Text style={styles.amountValue}>₦{bookingDetails.deposit.toLocaleString()}</Text>
              </View>
            </View>
            
            <Text style={styles.transferNote}>
              Use your booking ID <Text style={styles.boldText}>{bookingDetails.id}</Text> as payment reference
            </Text>
          </MotiView>
        )}
      </View>

      {/* Order Summary */}
      <View style={styles.orderCard}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        
        <View style={styles.orderDetails}>
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Service Fee</Text>
            <Text style={styles.orderValue}>₦{bookingDetails.price.toLocaleString()}</Text>
          </View>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Deposit (30%)</Text>
            <Text style={styles.orderValue}>₦{bookingDetails.deposit.toLocaleString()}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Due Now</Text>
            <Text style={styles.totalAmount}>₦{bookingDetails.deposit.toLocaleString()}</Text>
          </View>
          
          <Text style={styles.remainingText}>
            Remaining ₦{(bookingDetails.price - bookingDetails.deposit).toLocaleString()} to be paid at salon
          </Text>
        </View>

        {/* Terms - FIXED CHECKBOX */}
        <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={styles.termsCheckbox}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms && <Check size={12} color="#fff" />}
            </View>
            <Text style={styles.termsText}>
              I agree to Bellissimo's cancellation policy: Free cancellation up to 24 hours before appointment. Deposit is non-refundable for no-shows.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pay Button - FIXED WITH TERMS VALIDATION */}
        <TouchableOpacity
          style={[
            styles.payButton, 
            isProcessing && styles.payButtonDisabled,
            (!acceptedTerms || !userDetails.name || !userDetails.phone) && styles.payButtonDisabled
          ]}
          onPress={handlePayment}
          disabled={isProcessing || !acceptedTerms || !userDetails.name || !userDetails.phone}
        >
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.payButtonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.payButtonText}>
              {!acceptedTerms ? 'Accept Terms to Pay' : 
               !userDetails.name || !userDetails.phone ? 'Complete Your Details' : 
               `Pay ₦${bookingDetails.deposit.toLocaleString()} Deposit`}
            </Text>
          )}
        </TouchableOpacity>

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Lock size={14} color="#7C6665" />
          <Text style={styles.securityInfoText}>
            Payment secured • Your data is protected
          </Text>
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.supportCard}>
        <Text style={styles.supportTitle}>Need Help?</Text>
        <Text style={styles.supportText}>
          Our team is here to assist you with your payment
        </Text>
        
        <View style={styles.contactInfo}>
          <TouchableOpacity style={styles.contactItem}>
            <Phone size={16} color="#4A6FA5" />
            <Text style={styles.contactText}>+234 807 705 0957</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactItem}>
            <User size={16} color="#4A6FA5" />
            <Text style={styles.contactText}>support@bellissimo.com</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Updated styles with new additions
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F9',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#FFF8F9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#38A169',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3B1C1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#7C6665',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  bookingSummary: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7C6665',
    marginBottom: 4,
  },
  bookingId: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B1C1A',
    marginBottom: 20,
    fontFamily: 'monospace',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B1C1A',
    flex: 1,
    marginLeft: 8,
  },
  amountPaid: {
    fontSize: 18,
    fontWeight: '700',
    color: '#38A169',
  },
  dashboardButton: {
    backgroundColor: '#B04A75',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
  },
  dashboardButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B1C1A',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EFF9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  securityText: {
    fontSize: 12,
    color: '#4A6FA5',
    fontWeight: '600',
    marginLeft: 4,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B1C1A',
    marginBottom: 16,
  },
  bookingDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7C6665',
    marginLeft: 12,
    marginRight: 8,
    width: 60,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B1C1A',
    flex: 1,
  },
  // New User Details Styles
  userDetailsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B1C1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#3B1C1A',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  inputHint: {
    fontSize: 12,
    color: '#7C6665',
    marginTop: 4,
    marginLeft: 4,
  },
  methodsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  methodsContainer: {
    marginBottom: 20,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodButtonActive: {
    borderColor: '#4A6FA5',
    transform: [{ scale: 1.02 }],
  },
  methodIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B1C1A',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 13,
    color: '#7C6665',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4A6FA5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4A6FA5',
  },
  cardForm: {
    marginTop: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B1C1A',
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  transferDetails: {
    marginTop: 20,
  },
  transferInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7C6665',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B1C1A',
  },
  accountNumber: {
    fontFamily: 'monospace',
    fontSize: 16,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#38A169',
  },
  transferNote: {
    fontSize: 14,
    color: '#7C6665',
    textAlign: 'center',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '700',
    color: '#3B1C1A',
  },
  orderCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  orderDetails: {
    marginBottom: 24,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderLabel: {
    fontSize: 15,
    color: '#7C6665',
  },
  orderValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B1C1A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B1C1A',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#38A169',
  },
  remainingText: {
    fontSize: 14,
    color: '#7C6665',
    textAlign: 'center',
    marginTop: 8,
  },
  termsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4A6FA5',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#B04A75',
    borderColor: '#B04A75',
  },
  termsText: {
    fontSize: 14,
    color: '#7C6665',
    flex: 1,
    lineHeight: 20,
  },
  payButton: {
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
  payButtonDisabled: {
    backgroundColor: '#d8b0c1',
    opacity: 0.7,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityInfoText: {
    fontSize: 13,
    color: '#7C6665',
    marginLeft: 8,
  },
  supportCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B1C1A',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#7C6665',
    marginBottom: 20,
  },
  contactInfo: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 15,
    color: '#4A6FA5',
    fontWeight: '600',
    marginLeft: 12,
  },
});