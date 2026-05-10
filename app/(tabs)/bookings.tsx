// app/(tabs)/bookings.tsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock, X } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { ENDPOINTS, API_BASE_URL } from '@/lib/config';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import ReviewModal from '@/components/ReviewModal';

interface Booking {
  id: number;
  serviceId: string;
  service?: { name: string };
  subServiceName?: string;
  startAt: string;
  endAt: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  clientName: string;
  paymentStatus?: 'none' | 'deposit_paid' | 'owing' | 'completed';
  balanceCents?: number;
}

interface Review {
  id: number;
  bookingId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

const formatBooking = (b: Booking) => {
  const start = new Date(b.startAt);
  return {
    ...b,
    serviceName: b.subServiceName || b.service?.name || 'Appointment',
    date: start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    time: start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
};

const STATUS_CONFIG = {
  confirmed: { color: '#38A169', bg: '#F0FFF4', label: 'Confirmed' },
  pending:   { color: '#D69E2E', bg: '#FFFFF0', label: 'Pending' },
  cancelled: { color: '#E53E3E', bg: '#FFF5F5', label: 'Cancelled' },
  completed: { color: '#9D7A7D', bg: '#F5EDE8', label: 'Completed' },
};

export default function BookingsScreen() {
  const router = useRouter();
  const { getAuthHeaders, isAuthenticated, user } = useAuth();
  const { colors } = useTheme();
  const isClient = isAuthenticated && user?.role !== 'admin';

  const [bookings, setBookings] = useState<ReturnType<typeof formatBooking>[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Record<number, Review>>({});
  // Review modal state
  const [reviewModal, setReviewModal] = useState<{ visible: boolean; bookingId: number; serviceName: string } | null>(null);

  const isOwing = bookings.some(b => b.paymentStatus === 'owing');

  useEffect(() => {
    if (isAuthenticated) fetchBookings();
    else setLoading(false);
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    try {
      const res = await fetch(ENDPOINTS.myBookings, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map(formatBooking);
        setBookings(formatted);
        // Fetch reviews for all bookings
        fetchReviews(formatted.map((b: any) => b.id));
      }
    } catch (e) {
      console.error('Error fetching bookings:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (bookingIds: number[]) => {
    const reviewMap: Record<number, Review> = {};
    await Promise.all(bookingIds.map(async (id) => {
      try {
        const res = await fetch(`${API_BASE_URL}/reviews/booking/${id}`);
        if (res.ok) {
          const data = await res.json();
          // data is boolean (hasReview) or the review object depending on backend
          if (data && typeof data === 'object' && data.id) {
            reviewMap[id] = data;
          }
        }
      } catch {}
    }));
    setReviews(reviewMap);
  };

  const cancelBooking = async (id: number) => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${ENDPOINTS.bookings}/${id}/cancel`, { method: 'PATCH', headers: getAuthHeaders() });
            fetchBookings();
          } catch { Alert.alert('Error', 'Could not cancel. Try again.'); }
        },
      },
    ]);
  };

  // ── Guest view ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={[styles.guestContainer, { backgroundColor: colors.bg }]}>
        <Ionicons name="lock-closed-outline" size={64} color={colors.subText} />
        <Text style={[styles.guestTitle, { color: colors.text }]}>Sign in to view your bookings</Text>
        <Text style={[styles.guestSubtitle, { color: colors.subText }]}>
          Create an account or sign in to manage your appointments
        </Text>
        <TouchableOpacity
          style={[styles.signInBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/auth')}
        >
          <Text style={[styles.signInBtnText, { color: colors.primaryText }]}>Sign In or Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.subText }]}>Loading your bookings…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Bookings</Text>
          <Text style={[styles.headerSubtitle, { color: colors.subText }]}>Manage your appointments</Text>
        </View>
        <TouchableOpacity
          style={[styles.newBookingBtn, { backgroundColor: colors.primary },
            isOwing && styles.newBookingBtnDisabled]}
          onPress={() => {
            // Issue 1b: Block access if owing — also block via services/landing
            if (isOwing) {
              Alert.alert('Outstanding Balance', 'Please clear your outstanding balance before making a new booking.');
              return;
            }
            router.push('/services');
          }}
        >
          <Text style={[styles.newBookingBtnText, { color: colors.primaryText }]}>+ Book</Text>
        </TouchableOpacity>
      </View>

      {/* Owing banner */}
      {isOwing && (
        <View style={styles.owingBanner}>
          <Ionicons name="alert-circle" size={20} color="#fff" />
          <Text style={styles.owingBannerText}>
            You have an outstanding balance. Please pay to regain full access.
          </Text>
        </View>
      )}

      {bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color={colors.subText} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No bookings yet</Text>
          <Text style={[styles.emptyText, { color: colors.subText }]}>Book your first appointment to see it here</Text>
          <TouchableOpacity
            style={[styles.bookButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/services')}
          >
            <Text style={[styles.bookButtonText, { color: colors.primaryText }]}>Book Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {bookings.map((booking) => {
            const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
            const existingReview = reviews[booking.id];
            return (
              <View key={booking.id} style={[
                styles.bookingCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                booking.paymentStatus === 'owing' && styles.bookingCardOwing,
              ]}>
                {/* Header row */}
                <View style={styles.bookingHeader}>
                  <Text style={[styles.bookingId, { color: colors.subText }]}>#{booking.id}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    {booking.paymentStatus === 'owing' && (
                      <View style={styles.owingPill}>
                        <Text style={styles.owingPillText}>
                          Owing ${((booking.balanceCents ?? 0) / 100).toFixed(2)}
                        </Text>
                      </View>
                    )}
                    {booking.paymentStatus === 'completed' && (
                      <View style={styles.paidPill}>
                        <Text style={styles.paidPillText}>Paid ✓</Text>
                      </View>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.serviceName, { color: colors.text }]}>{booking.serviceName}</Text>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailItem}>
                    <Calendar size={15} color={colors.subText} />
                    <Text style={[styles.detailText, { color: colors.subText }]}>{booking.date}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Clock size={15} color={colors.subText} />
                    <Text style={[styles.detailText, { color: colors.subText }]}>{booking.time}</Text>
                  </View>
                </View>

                {/* Review section on the card */}
                {existingReview ? (
                  <View style={[styles.reviewSection, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                    <View style={styles.reviewStars}>
                      {[1,2,3,4,5].map(i => (
                        <Ionicons key={i} name={i <= existingReview.rating ? 'star' : 'star-outline'} size={14} color="#FFD700" />
                      ))}
                      <Text style={[styles.reviewRatingText, { color: colors.subText }]}> {existingReview.rating}/5</Text>
                    </View>
                    <Text style={[styles.reviewComment, { color: colors.text }]} numberOfLines={2}>
                      "{existingReview.comment}"
                    </Text>
                  </View>
                ) : (booking.status === 'confirmed' || booking.status === 'completed') ? (
                  <TouchableOpacity
                    style={[styles.leaveReviewBtn, { borderColor: colors.primary }]}
                    onPress={() => setReviewModal({
                      visible: true,
                      bookingId: booking.id,
                      serviceName: booking.serviceName,
                    })}
                  >
                    <Ionicons name="star-outline" size={15} color={colors.primary} />
                    <Text style={[styles.leaveReviewText, { color: colors.primary }]}>Leave a Review</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Cancel button */}
                {booking.status === 'pending' && (
                  <TouchableOpacity style={styles.cancelButton} onPress={() => cancelBooking(booking.id)}>
                    <X size={15} color="#E53E3E" />
                    <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                  </TouchableOpacity>
                )}

                {/* Pay balance — goes to checkout with all payment options */}
                {booking.paymentStatus === 'owing' && (
                  <TouchableOpacity
                    style={styles.payBalanceButton}
                    onPress={() => router.push({
                      pathname: '/payment/checkout',
                      params: {
                        bookingId: String(booking.id),
                        amountCents: String(booking.balanceCents ?? 0),
                        serviceName: booking.serviceName,
                        isBalancePayment: 'true',
                      },
                    } as any)}
                  >
                    <Ionicons name="card-outline" size={15} color="#fff" />
                    <Text style={styles.payBalanceText}>
                      Pay Balance ${((booking.balanceCents ?? 0) / 100).toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Review modal — triggered from booking card */}
      {reviewModal && (
        <ReviewModal
          visible={reviewModal.visible}
          bookingId={reviewModal.bookingId}
          clientName={user?.email?.split('@')[0] ?? 'Client'}
          serviceName={reviewModal.serviceName}
          onCompleted={() => { setReviewModal(null); fetchBookings(); }}
          onClose={() => setReviewModal(null)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 15 },
  guestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  guestTitle: { fontSize: 22, fontWeight: '700', marginTop: 20, marginBottom: 10, textAlign: 'center' },
  guestSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  signInBtn: { borderRadius: 25, paddingVertical: 16, paddingHorizontal: 36 },
  signInBtnText: { fontSize: 16, fontWeight: '700' },
  header: { padding: 20, paddingTop: 60, borderBottomWidth: 1, marginBottom: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '700' },
  headerSubtitle: { fontSize: 15, marginTop: 4 },
  newBookingBtn: { borderRadius: 20, paddingVertical: 10, paddingHorizontal: 18 },
  newBookingBtnText: { fontWeight: '700', fontSize: 15 },
  newBookingBtnDisabled: { opacity: 0.4 },
  owingBanner: { backgroundColor: '#E53E3E', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  owingBannerText: { color: '#fff', fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
  owingPill: { backgroundColor: '#FFF5F5', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#FED7D7' },
  owingPillText: { color: '#E53E3E', fontSize: 11, fontWeight: '700' },
  paidPill: { backgroundColor: '#F0FFF4', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#9AE6B4' },
  paidPillText: { color: '#38A169', fontSize: 11, fontWeight: '700' },
  bookingCardOwing: { borderColor: '#FED7D7', borderWidth: 2 },
  list: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 16 },
  emptyState: { alignItems: 'center', padding: 40, marginTop: 60 },
  emptyTitle: { fontSize: 22, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  bookButton: { borderRadius: 25, paddingVertical: 14, paddingHorizontal: 36 },
  bookButtonText: { fontWeight: '700', fontSize: 16 },
  bookingCard: { borderRadius: 20, padding: 20, borderWidth: 1 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bookingId: { fontSize: 13, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  serviceName: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  bookingDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13 },
  cancelButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#FED7D7', backgroundColor: '#FFF5F5' },
  cancelButtonText: { color: '#E53E3E', fontWeight: '600', fontSize: 14 },
  payBalanceButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E53E3E', borderRadius: 12, paddingVertical: 13, marginTop: 12 },
  payBalanceText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Review section on card
  reviewSection: { borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1 },
  reviewStars: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  reviewRatingText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  reviewComment: { fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
  leaveReviewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1.5, paddingVertical: 10, marginTop: 12 },
  leaveReviewText: { fontSize: 14, fontWeight: '600' },
});