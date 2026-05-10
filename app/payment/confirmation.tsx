// app/payment/confirmation.tsx

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Calendar, Clock, Hash, User, CreditCard } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import ReviewModal from '@/components/ReviewModal';
import { useAuth } from '@/lib/auth-context';
import { API_BASE_URL } from '@/lib/config';

export default function ConfirmationScreen() {
  const router = useRouter();
  const { user, getAuthHeaders, isAuthenticated } = useAuth();
  const isClient = !user || user.role === 'client';

  const params = useLocalSearchParams<{
    bookingId: string;
    amount: string;
    serviceName: string;
    date: string;
    time: string;
    clientName: string;
    isBalancePayment?: string;
  }>();

  const isBalancePayment = params.isBalancePayment === 'true';
  const amountCents = parseInt(params.amount || '0', 10);

  // Review modal — only for clients on deposit payments
  const [reviewModalVisible, setReviewModalVisible] = useState(isClient && !isBalancePayment);
  const [reviewDone, setReviewDone] = useState(!isClient || isBalancePayment);

  // Notify admin state — for Stripe balance payments
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return dateString; }
  };

  const amountDollars = (amountCents / 100).toFixed(2);

  const handleReviewCompleted = () => {
    setReviewModalVisible(false);
    setReviewDone(true);
  };

  const handleNotifyAdmin = async () => {
    if (!params.bookingId) return;
    setNotifying(true);
    try {
      await fetch(`${API_BASE_URL}/payments/notify-stripe-balance`, {
        method: 'POST',
        headers: isAuthenticated
          ? getAuthHeaders()
          : { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          bookingId: parseInt(params.bookingId),
          clientName: params.clientName || user?.email?.split('@')[0] || 'Client',
          amountCents,
        }),
      });
      setNotified(true);
      Alert.alert(
        '✅ Admin Notified',
        'The admin has been notified of your balance payment. Your account will be released once verified.',
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert('Error', 'Could not notify admin. Please contact support directly.');
    } finally {
      setNotifying(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Review modal — only for deposit payments by clients */}
      {params.bookingId && isClient && !isBalancePayment && (
        <ReviewModal
          visible={reviewModalVisible}
          bookingId={parseInt(params.bookingId, 10)}
          clientName={params.clientName ?? 'Client'}
          serviceName={params.serviceName ?? 'Service'}
          onCompleted={handleReviewCompleted}
          onClose={handleReviewCompleted}
        />
      )}

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={isBalancePayment ? ['#38A169', '#2D8A5A', '#1A5E3A'] : ['#9D7A7D', '#7C5E60', '#5B3034']}
          style={styles.hero}
        >
          <MotiView from={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 200 }} style={styles.checkCircle}>
            <Check size={40} color="#fff" strokeWidth={3} />
          </MotiView>
          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 400 }}>
            <Text style={styles.heroTitle}>
              {isBalancePayment ? 'Balance Paid! 🎉' : 'Booking Confirmed!'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {isBalancePayment
                ? 'Your outstanding balance has been paid'
                : reviewDone ? 'Thank you for your review 💛' : 'Your appointment is all set'}
            </Text>
          </MotiView>
        </LinearGradient>

        {/* Booking details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isBalancePayment ? 'Payment Details' : 'Booking Details'}
          </Text>
          <DetailRow icon={<Hash size={18} color="#9D7A7D" />} label="Booking ID" value={`#${params.bookingId}`} />
          <DetailRow icon={<User size={18} color="#9D7A7D" />} label="Name" value={params.clientName ?? '—'} />
          <DetailRow icon={<CreditCard size={18} color="#9D7A7D" />} label="Service" value={params.serviceName ?? '—'} />
          {!isBalancePayment && (
            <>
              <DetailRow icon={<Calendar size={18} color="#9D7A7D" />} label="Date" value={formatDate(params.date)} />
              <DetailRow icon={<Clock size={18} color="#9D7A7D" />} label="Time" value={params.time ?? '—'} />
            </>
          )}
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>
              {isBalancePayment ? 'Balance Paid' : 'Deposit Paid'}
            </Text>
            <Text style={[styles.amountValue, isBalancePayment && { color: '#38A169' }]}>
              ${amountDollars}
            </Text>
          </View>
        </View>

        {/* Notify admin — shown for Stripe balance payments */}
        {isBalancePayment && (
          <View style={styles.notifyCard}>
            <View style={styles.notifyHeader}>
              <Ionicons name="information-circle" size={22} color="#9D7A7D" />
              <Text style={styles.notifyTitle}>One More Step</Text>
            </View>
            <Text style={styles.notifyText}>
              Your Stripe payment is complete. Tap below to notify the admin so they can verify and release your account.
            </Text>
            {notified ? (
              <View style={styles.notifiedBox}>
                <Ionicons name="checkmark-circle" size={20} color="#38A169" />
                <Text style={styles.notifiedText}>Admin has been notified ✅</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.notifyBtn, notifying && { opacity: 0.6 }]}
                onPress={handleNotifyAdmin}
                disabled={notifying}
              >
                {notifying
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <Ionicons name="notifications-outline" size={18} color="#fff" />
                      <Text style={styles.notifyBtnText}>Notify Admin of Payment</Text>
                    </>
                }
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* What's next */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {isBalancePayment ? 'Your Account' : "What's Next?"}
          </Text>
          <Text style={styles.infoText}>
            {isBalancePayment
              ? '• Admin will verify your payment\n• Your account will be fully released\n• Booking status will update to Completed\n• Thank you for choosing Bellissimo! 💛'
              : '• Your stylist will confirm your appointment shortly\n• The remaining balance is due at the salon\n• You will receive a reminder before your appointment\n• Contact us via Chat if you need to reschedule'
            }
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(tabs)/bookings')}>
          <Text style={styles.secondaryBtnText}>View My Bookings</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF5F6' },
  hero: { paddingTop: Platform.OS === 'ios' ? 80 : 60, paddingBottom: 50, alignItems: 'center', gap: 20 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  heroTitle: { fontSize: 28, fontWeight: '700', color: '#fff', textAlign: 'center' },
  heroSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 6 },
  card: { backgroundColor: '#fff', margin: 20, marginBottom: 0, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#3B1C1A', marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0E6E8', gap: 14 },
  detailIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5EDE8', justifyContent: 'center', alignItems: 'center' },
  detailLabel: { fontSize: 12, color: '#B89FA1', marginBottom: 2 },
  detailValue: { fontSize: 15, fontWeight: '600', color: '#3B1C1A' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, marginTop: 4 },
  amountLabel: { fontSize: 16, fontWeight: '700', color: '#3B1C1A' },
  amountValue: { fontSize: 24, fontWeight: '800', color: '#9D7A7D' },
  // Notify admin card (for Stripe balance)
  notifyCard: { backgroundColor: '#fff', margin: 20, marginBottom: 0, borderRadius: 20, padding: 20, borderWidth: 2, borderColor: '#F0E6E8' },
  notifyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  notifyTitle: { fontSize: 16, fontWeight: '700', color: '#3B1C1A' },
  notifyText: { fontSize: 14, color: '#7C6665', lineHeight: 22, marginBottom: 16 },
  notifyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#9D7A7D', borderRadius: 25, paddingVertical: 14 },
  notifyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  notifiedBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FFF4', borderRadius: 14, padding: 12 },
  notifiedText: { fontSize: 14, fontWeight: '600', color: '#38A169' },
  infoCard: { backgroundColor: '#F5EDE8', margin: 20, marginBottom: 0, borderRadius: 16, padding: 18 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: '#3B1C1A', marginBottom: 10 },
  infoText: { fontSize: 14, color: '#5B3034', lineHeight: 24 },
  primaryBtn: { margin: 20, marginBottom: 0, backgroundColor: '#9D7A7D', borderRadius: 16, height: 54, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { margin: 20, marginTop: 12, borderWidth: 1.5, borderColor: '#9D7A7D', borderRadius: 16, height: 54, justifyContent: 'center', alignItems: 'center' },
  secondaryBtnText: { color: '#9D7A7D', fontSize: 16, fontWeight: '600' },
});