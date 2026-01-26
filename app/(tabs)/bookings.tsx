// app/bookings.tsx (simple version)
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock, CreditCard, Check, X } from 'lucide-react-native';
import { API_BASE_URL } from '../../lib/config';

interface Booking {
  id: number;
  serviceName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  amount: number;
}

export default function BookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      // You'll need to create this endpoint
      const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#38A169';
      case 'pending': return '#D69E2E';
      case 'cancelled': return '#E53E3E';
      case 'completed': return '#4A6FA5';
      default: return '#7C6665';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B04A75" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>Manage your appointments</Text>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color="#D681A0" />
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptyText}>
            Book your first appointment to see it here
          </Text>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => router.push('/services')}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        bookings.map((booking) => (
          <TouchableOpacity key={booking.id} style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Text style={styles.bookingId}>Booking #{booking.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                <Text style={styles.statusText}>{booking.status}</Text>
              </View>
            </View>
            
            <Text style={styles.serviceName}>{booking.serviceName}</Text>
            
            <View style={styles.bookingDetails}>
              <View style={styles.detailItem}>
                <Calendar size={16} color="#7C6665" />
                <Text style={styles.detailText}>{booking.date}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Clock size={16} color="#7C6665" />
                <Text style={styles.detailText}>{booking.time}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <CreditCard size={16} color="#7C6665" />
                <Text style={styles.detailText}>₦{booking.amount.toLocaleString()}</Text>
              </View>
            </View>
            
            <View style={styles.bookingActions}>
              {booking.status === 'pending' && (
                <>
                  <TouchableOpacity style={styles.confirmButton}>
                    <Check size={16} color="#fff" />
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton}>
                    <X size={16} color="#E53E3E" />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 20, color: '#7C6665' },
  header: { padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#3B1C1A' },
  headerSubtitle: { fontSize: 16, color: '#7C6665', marginTop: 4 },
  emptyState: { alignItems: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#3B1C1A', marginTop: 20 },
  emptyText: { fontSize: 16, color: '#7C6665', textAlign: 'center', marginTop: 8, lineHeight: 24 },
  bookButton: { backgroundColor: '#B04A75', borderRadius: 25, paddingVertical: 14, paddingHorizontal: 30, marginTop: 24 },
  bookButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  bookingCard: { backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 16, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bookingId: { fontSize: 14, fontWeight: '600', color: '#7C6665' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  serviceName: { fontSize: 18, fontWeight: '700', color: '#3B1C1A', marginBottom: 16 },
  bookingDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 14, color: '#7C6665', marginLeft: 6 },
  bookingActions: { flexDirection: 'row', gap: 12 },
  confirmButton: { flex: 1, backgroundColor: '#38A169', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 6 },
  confirmButtonText: { color: '#fff', fontWeight: '600' },
  cancelButton: { flex: 1, backgroundColor: '#FED7D7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 6 },
  cancelButtonText: { color: '#E53E3E', fontWeight: '600' },
});