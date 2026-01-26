// app/payments/confirmation.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Calendar, Clock, CreditCard, User, Phone } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function ConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId: string;
    amount: string;
    serviceName: string;
    date: string;
    time: string;
    clientName: string;
    clientPhone: string;
  }>();

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <MotiView
          from={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 600 }}
          style={styles.successCard}
        >
          <View style={styles.successIcon}>
            <Check size={40} color="#fff" />
          </View>
          
          <Text style={styles.successTitle}>Booking Confirmed! 🎉</Text>
          <Text style={styles.successMessage}>
            Your appointment has been booked successfully. We look forward to seeing you!
          </Text>
          
          <View style={styles.bookingDetails}>
            <Text style={styles.detailTitle}>Booking Details</Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <CreditCard size={18} color="#B04A75" />
              </View>
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Booking ID</Text>
                <Text style={styles.detailValue}>{params.bookingId || 'BK-003'}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Calendar size={18} color="#B04A75" />
              </View>
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>
                  {formatDate(params.date || '2026-01-31')} • {params.time || '11:00 AM'}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Clock size={18} color="#B04A75" />
              </View>
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Service</Text>
                <Text style={styles.detailValue}>{params.serviceName || 'Closure Install'}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <User size={18} color="#B04A75" />
              </View>
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Your Name</Text>
                <Text style={styles.detailValue}>{params.clientName || 'Tabor'}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Phone size={18} color="#B04A75" />
              </View>
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>{params.clientPhone || '08077050956'}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <CreditCard size={18} color="#38A169" />
              </View>
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Deposit Paid</Text>
                <Text style={[styles.detailValue, styles.amount]}>
                  ₦{parseInt(params.amount || '7500').toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>What's Next?</Text>
            <Text style={styles.instructionsText}>
              1. You'll receive a confirmation SMS shortly{'\n'}
              2. Arrive 10 minutes before your appointment{'\n'}
              3. Bring any reference materials for your style{'\n'}
              4. Remaining balance to be paid at the salon
            </Text>
          </View>
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/')}
            >
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
  style={styles.primaryButton}
  onPress={() => router.push('/(tabs)')}  // Changed from '/' to '/(tabs)'
>
  <Text style={styles.primaryButtonText}>Back to Home</Text>
    </TouchableOpacity>

    <TouchableOpacity
    style={styles.secondaryButton}
    onPress={() => router.push('/(tabs)/bookings')}  // Changed from '/bookings' to '/(tabs)/bookings'
    >
    <Text style={styles.secondaryButtonText}>View My Bookings</Text>
    </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F9',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#38A169',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    marginBottom: 30,
    lineHeight: 24,
  },
  bookingDetails: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B1C1A',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8E6EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#7C6665',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B1C1A',
  },
  amount: {
    color: '#38A169',
    fontWeight: '700',
  },
  instructions: {
    width: '100%',
    backgroundColor: '#E8EFF9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B1C1A',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#4A6FA5',
    lineHeight: 22,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#B04A75',
    borderRadius: 25,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 25,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#B04A75',
  },
  secondaryButtonText: {
    color: '#B04A75',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});