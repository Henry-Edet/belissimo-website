// app/payment/checkout.tsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Platform, ActivityIndicator, TextInput, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { ArrowLeft, CreditCard, Smartphone, Shield, Check, Lock, Calendar, Clock } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL, ENDPOINTS } from '@/lib/config';
import { useAuth } from '@/lib/auth-context';

// ── Constants — replace with real values before going live ───────────────────
const WHATSAPP_NUMBER = '+905428783359'; // admin WhatsApp
const WHATSAPP_DISPLAY = '+90 542 878 33 59';
const BANK_DETAILS = {
  bank: 'GTBank (Guaranty Trust Bank)',
  accountName: 'Bellissimo Hair Studio',
  accountNumber: '0123456789', // ← replace with real GTBank account number
};
const CRYPTO_WALLETS = [
  { label: 'USDT (BEP-20 / Binance Smart Chain)', address: 'YOUR_BEP20_USDT_ADDRESS_HERE' },
  { label: 'USDT (TRC-20 / TRON)', address: 'YOUR_TRC20_USDT_ADDRESS_HERE' },
  { label: 'Bitcoin (BTC)', address: 'YOUR_BTC_ADDRESS_HERE' },
  { label: 'Ethereum (ETH)', address: 'YOUR_ETH_ADDRESS_HERE' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return dateString; }
};

const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return cleaned.length >= 7 && cleaned.length <= 15 && /^\+?\d+$/.test(cleaned);
};

interface UserDetails { name: string; phone: string; email: string; }

export default function CheckoutScreen() {
  const router = useRouter();
  const { getAuthHeaders, isAuthenticated } = useAuth();

  const params = useLocalSearchParams<{
    bookingId: string;
    serviceName: string;
    serviceId: string;
    mainServiceId: string;
    subServiceName: string;
    price: string;
    durationMinutes: string;
    date: string;
    time: string;
    subServiceOriginalId: string;
    amountCents: string;
    isBalancePayment: string;
  }>();

  const [selectedMethod, setSelectedMethod] = useState<'card' | 'transfer' | 'crypto'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [notifyDone, setNotifyDone] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails>({ name: '', phone: '', email: '' });

  const isBalancePayment = params.isBalancePayment === 'true';
  const balanceCents = parseInt(params.amountCents || '0', 10);
  const priceInCents = parseInt(params.price || '35000');
  const depositInCents = Math.round(priceInCents * 0.3);
  const amountDueNow = isBalancePayment ? balanceCents : depositInCents;
  const amountLabel = isBalancePayment ? 'Outstanding Balance' : 'Deposit (30%)';
  const bookingId = params.bookingId ? parseInt(params.bookingId) : null;

  const serviceName = params.serviceName || params.subServiceName || 'Hair Service';
  const serviceId = params.serviceId || '';
  const duration = params.durationMinutes || '120';

  // Auto-fill from profile
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const res = await fetch(ENDPOINTS.me, { headers: getAuthHeaders() });
        if (res.ok) {
          const profile = await res.json();
          setUserDetails({
            name: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || '',
            phone: profile.phone || '',
            email: profile.email || '',
          });
        }
      } catch {}
    })();
  }, [isAuthenticated]);

  const buildStartAt = (): string | null => {
    if (!params.time || !params.time.includes(':')) return null;
    const [hour, minutePart] = params.time.split(':');
    const minute = (minutePart ?? '00').slice(0, 2);
    const period = (minutePart ?? '').slice(3).trim();
    let hour24 = parseInt(hour, 10);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;
    return `${params.date}T${hour24.toString().padStart(2, '0')}:${minute}:00`;
  };

  const authHeaders = isAuthenticated
    ? getAuthHeaders()
    : { 'Content-Type': 'application/json', Accept: 'application/json' };

  // ── Create booking (for non-balance payments) ─────────────────────────────
  const createBooking = async (): Promise<number | null> => {
    if (isBalancePayment && bookingId) return bookingId;
    const startAt = buildStartAt();
    if (!startAt) { Alert.alert('Error', 'Invalid appointment time.'); return null; }
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({
        serviceId, clientName: userDetails.name,
        clientPhone: userDetails.phone, startAt,
        endAt: new Date(new Date(startAt).getTime() + parseInt(duration) * 60000).toISOString(),
        subServiceName: serviceName,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(res.status === 409 ? 'Time slot already booked. Please choose another time.' : `Booking error: ${txt}`);
    }
    const data = await res.json();
    return data.id;
  };

  // ── Notify admin of manual payment ────────────────────────────────────────
  const notifyAdmin = async (method: 'bank_transfer' | 'crypto', bkId: number) => {
    // Only send notification for balance payments — deposits never go to Payments tab
    if (!isBalancePayment) return;
    try {
      await fetch(`${API_BASE_URL}/payments/notify`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({
          bookingId: bkId,
          clientName: userDetails.name || 'Client',
          clientPhone: userDetails.phone,
          amountCents: amountDueNow,
          paymentMethod: method,
          isBalancePayment: true,
        }),
      });
    } catch {}
  };

  // ── Open WhatsApp ─────────────────────────────────────────────────────────
  const openWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hi, I'm ${userDetails.name || 'a client'} and I've just sent ${amountLabel} of ${formatPrice(amountDueNow)} for my Bellissimo booking${bookingId ? ` #${bookingId}` : ''}. Please find proof of payment attached.`
    );
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${msg}`);
  };

  // ── Handle Stripe (card) ──────────────────────────────────────────────────
  const handleStripePayment = async () => {
    if (!userDetails.name.trim()) { Alert.alert('Required', 'Please enter your full name'); return; }
    setIsProcessing(true);
    try {
      let bkId: number | null = null;

      if (isBalancePayment) {
        bkId = bookingId;
      } else {
        bkId = await createBooking();
      }

      if (!bkId) { setIsProcessing(false); return; }

      const endpoint = isBalancePayment
        ? `${API_BASE_URL}/payments/balance-session`
        : `${API_BASE_URL}/payments/create-session`;

      const res = await fetch(endpoint, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ bookingId: bkId }),
      });

      if (!res.ok) {
        Alert.alert('Error', 'Could not create payment session. Please try again.');
        setIsProcessing(false);
        return;
      }

      const data = await res.json();
      if (data.url) {
        router.push({
          pathname: '/payment/webview',
          params: {
            url: data.url,
            bookingId: String(bkId),
            serviceName,
            date: params.date || '',
            time: params.time || '',
            clientName: userDetails.name,
            amount: amountDueNow.toString(),
            isBalancePayment: isBalancePayment ? 'true' : 'false',
          },
        } as any);
      } else {
        Alert.alert('Error', 'No payment URL received. Please contact support.');
      }
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Handle manual notify (bank / crypto) ─────────────────────────────────
  const handleManualNotify = async (method: 'bank_transfer' | 'crypto') => {
    if (!userDetails.name.trim()) { Alert.alert('Required', 'Please enter your name first'); return; }
    setIsProcessing(true);
    try {
      let bkId: number | null = bookingId;
      if (!isBalancePayment) bkId = await createBooking();
      if (!bkId) { setIsProcessing(false); return; }
      await notifyAdmin(method, bkId);
      setNotifyDone(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not notify admin. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Notify success screen ─────────────────────────────────────────────────
  if (notifyDone) {
    return (
      <View style={s.successContainer}>
        <MotiView from={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 600 }} style={s.successContent}>
          <View style={s.successIcon}><Ionicons name="checkmark-circle" size={56} color="#fff" /></View>
          <Text style={s.successTitle}>
            {isBalancePayment ? 'Admin Notified! ✅' : 'Booking Created! ✅'}
          </Text>
          <Text style={s.successMessage}>
            {isBalancePayment
              ? 'Your balance payment notification has been sent. The admin will verify and release your account within 24 hours.'
              : 'Your booking is created. Please transfer your deposit and send proof on WhatsApp. Your appointment is reserved once the admin confirms.'}
          </Text>
          <TouchableOpacity style={s.doneBtn} onPress={() => router.replace('/(tabs)/bookings')}>
            <Text style={s.doneBtnText}>View My Bookings</Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    );
  }

  // ── Main screen ───────────────────────────────────────────────────────────
  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#3B1C1A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {isBalancePayment ? 'Pay Outstanding Balance' : 'Book & Pay Deposit'}
        </Text>
        <View style={s.securityBadge}>
          <Shield size={15} color="#9D7A7D" />
          <Text style={s.securityText}>Secure</Text>
        </View>
      </View>

      {/* Order summary */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Summary</Text>
        <View style={s.summaryRow}><Text style={s.summaryLabel}>Service</Text><Text style={s.summaryValue}>{serviceName}</Text></View>
        {!isBalancePayment && (
          <>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Date</Text><Text style={s.summaryValue}>{formatDate(params.date || '')}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Time</Text><Text style={s.summaryValue}>{params.time || '—'}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Full Price</Text><Text style={s.summaryValue}>{formatPrice(priceInCents)}</Text></View>
          </>
        )}
        <View style={s.divider} />
        {isBalancePayment ? (
          <>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Deposit</Text><Text style={[s.summaryValue, { color: '#38A169' }]}>Already paid ✓</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Outstanding Balance</Text><Text style={[s.summaryValue, { color: '#E53E3E', fontWeight: '800' }]}>{formatPrice(balanceCents)}</Text></View>
          </>
        ) : (
          <>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Deposit Required (30%)</Text><Text style={[s.summaryValue, { color: '#9D7A7D', fontWeight: '800' }]}>{formatPrice(depositInCents)}</Text></View>
            <Text style={s.remainingNote}>Remaining {formatPrice(priceInCents - depositInCents)} paid at salon after service</Text>
          </>
        )}
        <View style={[s.amountDueBox, { borderColor: isBalancePayment ? '#FED7D7' : '#D4BEB8' }]}>
          <Text style={s.amountDueLabel}>{isBalancePayment ? 'Balance Due' : 'Pay Now'}</Text>
          <Text style={[s.amountDueValue, { color: isBalancePayment ? '#E53E3E' : '#9D7A7D' }]}>{formatPrice(amountDueNow)}</Text>
        </View>
      </View>

      {/* Your details */}
      <View style={s.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={s.cardTitle}>Your Details</Text>
          {isAuthenticated && <View style={s.prefillBadge}><Text style={s.prefillText}>✓ Pre-filled</Text></View>}
        </View>
        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Full Name *</Text>
          <TextInput style={s.input} placeholder="Enter your full name" value={userDetails.name}
            onChangeText={(t) => setUserDetails({ ...userDetails, name: t })} autoCapitalize="words" />
        </View>
        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Phone Number</Text>
          <TextInput style={s.input} placeholder="+234 800 000 0000" value={userDetails.phone}
            onChangeText={(t) => setUserDetails({ ...userDetails, phone: t })} keyboardType="phone-pad" />
        </View>
      </View>

      {/* Payment method selector */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Payment Method</Text>
        {([
          { id: 'card', label: 'Card Payment', sub: 'Visa, Mastercard — via Stripe', icon: 'card-outline', color: '#4A6FA5', bg: '#EEF2FB' },
          { id: 'transfer', label: 'Bank Transfer', sub: 'GTBank — local Nigerian transfer', icon: 'business-outline', color: '#38A169', bg: '#EEF9F2' },
          { id: 'crypto', label: 'Crypto Transfer', sub: 'USDT, BTC, ETH — any network', icon: 'logo-bitcoin', color: '#D69E2E', bg: '#FEF9EE' },
        ] as const).map((m) => (
          <TouchableOpacity key={m.id}
            style={[s.methodBtn, { backgroundColor: m.bg }, selectedMethod === m.id && s.methodBtnActive]}
            onPress={() => setSelectedMethod(m.id)}>
            <View style={[s.methodIconBox, { backgroundColor: selectedMethod === m.id ? m.color : `${m.color}25` }]}>
              <Ionicons name={m.icon} size={20} color={selectedMethod === m.id ? '#fff' : m.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.methodLabel, selectedMethod === m.id && { color: m.color }]}>{m.label}</Text>
              <Text style={s.methodSub}>{m.sub}</Text>
            </View>
            <View style={[s.radioOuter, selectedMethod === m.id && { borderColor: m.color }]}>
              {selectedMethod === m.id && <View style={[s.radioInner, { backgroundColor: m.color }]} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── CARD PAYMENT ── */}
      {selectedMethod === 'card' && (
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} style={s.card}>
          <Text style={s.cardTitle}>Pay via Stripe</Text>
          <Text style={s.methodNote}>
            You'll be redirected to Stripe's secure checkout page to enter your card details and complete the payment.
          </Text>
          <View style={s.stripeLogos}>
            <Ionicons name="lock-closed" size={14} color="#9D7A7D" />
            <Text style={s.stripeNote}>256-bit SSL encryption · Powered by Stripe</Text>
          </View>
          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: '#4A6FA5' }, (!userDetails.name.trim() || isProcessing) && s.btnDisabled]}
            onPress={handleStripePayment}
            disabled={!userDetails.name.trim() || isProcessing}
          >
            {isProcessing
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="card-outline" size={18} color="#fff" />
                  <Text style={s.primaryBtnText}>
                    {isBalancePayment ? `Pay Balance ${formatPrice(amountDueNow)} via Stripe` : `Pay Deposit ${formatPrice(amountDueNow)} via Stripe`}
                  </Text>
                </>
            }
          </TouchableOpacity>
        </MotiView>
      )}

      {/* ── BANK TRANSFER ── */}
      {selectedMethod === 'transfer' && (
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} style={s.card}>
          <Text style={s.cardTitle}>GTBank Transfer Details</Text>
          <Text style={s.methodNote}>
            Transfer exactly <Text style={{ fontWeight: '800', color: '#3B1C1A' }}>{formatPrice(amountDueNow)}</Text> to the account below using your banking app.
          </Text>

          <View style={s.detailsBox}>
            <DetailRow label="Bank" value={BANK_DETAILS.bank} />
            <DetailRow label="Account Name" value={BANK_DETAILS.accountName} />
            <DetailRow label="Account Number" value={BANK_DETAILS.accountNumber} copyable />
            <DetailRow label="Amount" value={formatPrice(amountDueNow)} highlight />
          </View>

          {/* WhatsApp proof */}
          <View style={s.whatsappBox}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            <View style={{ flex: 1 }}>
              <Text style={s.whatsappTitle}>Send Proof of Payment</Text>
              <Text style={s.whatsappSub}>After transferring, send your receipt/screenshot to:</Text>
              <Text style={s.whatsappNumber}>{WHATSAPP_DISPLAY}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.whatsappBtn} onPress={openWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={s.whatsappBtnText}>Open WhatsApp to Send Proof</Text>
          </TouchableOpacity>

          {/* Notify admin */}
          <View style={s.notifyDivider}>
            <View style={s.notifyDividerLine} />
            <Text style={s.notifyDividerText}>After sending proof on WhatsApp</Text>
            <View style={s.notifyDividerLine} />
          </View>
          <TouchableOpacity
            style={[s.notifyBtn, (!userDetails.name.trim() || isProcessing) && s.btnDisabled]}
            onPress={() => handleManualNotify('bank_transfer')}
            disabled={!userDetails.name.trim() || isProcessing}
          >
            {isProcessing
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="notifications-outline" size={18} color="#fff" />
                  <Text style={s.notifyBtnText}>
                    {isBalancePayment ? "I've Sent Balance Proof — Notify Admin" : "I've Sent Deposit Proof — Confirm Booking"}
                  </Text>
                </>
            }
          </TouchableOpacity>
          <Text style={s.notifyCaption}>
            {isBalancePayment
              ? 'Only tap after sending proof on WhatsApp. Admin will verify and release your account within 24 hours.'
              : 'Only tap after sending deposit proof on WhatsApp. Admin will confirm your booking.'}
          </Text>
        </MotiView>
      )}

      {/* ── CRYPTO ── */}
      {selectedMethod === 'crypto' && (
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} style={s.card}>
          <Text style={s.cardTitle}>Crypto Wallet Addresses</Text>
          <Text style={s.methodNote}>
            Send exactly <Text style={{ fontWeight: '800', color: '#3B1C1A' }}>{formatPrice(amountDueNow)}</Text> worth of crypto to any of the addresses below.
          </Text>

          <View style={s.detailsBox}>
            {CRYPTO_WALLETS.map((w) => (
              <View key={w.label} style={s.cryptoRow}>
                <Text style={s.cryptoLabel}>{w.label}</Text>
                <Text style={s.cryptoAddress} numberOfLines={1} ellipsizeMode="middle">{w.address}</Text>
              </View>
            ))}
          </View>

          {/* WhatsApp proof */}
          <View style={s.whatsappBox}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            <View style={{ flex: 1 }}>
              <Text style={s.whatsappTitle}>Send Transaction Hash</Text>
              <Text style={s.whatsappSub}>After sending, share your transaction hash/screenshot to:</Text>
              <Text style={s.whatsappNumber}>{WHATSAPP_DISPLAY}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.whatsappBtn} onPress={openWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={s.whatsappBtnText}>Open WhatsApp to Send Proof</Text>
          </TouchableOpacity>

          {/* Notify admin */}
          <View style={s.notifyDivider}>
            <View style={s.notifyDividerLine} />
            <Text style={s.notifyDividerText}>After sending proof on WhatsApp</Text>
            <View style={s.notifyDividerLine} />
          </View>
          <TouchableOpacity
            style={[s.notifyBtn, (!userDetails.name.trim() || isProcessing) && s.btnDisabled]}
            onPress={() => handleManualNotify('crypto')}
            disabled={!userDetails.name.trim() || isProcessing}
          >
            {isProcessing
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="notifications-outline" size={18} color="#fff" />
                  <Text style={s.notifyBtnText}>
                    {isBalancePayment ? "I've Sent Balance Proof — Notify Admin" : "I've Sent Deposit Proof — Confirm Booking"}
                  </Text>
                </>
            }
          </TouchableOpacity>
          <Text style={s.notifyCaption}>
            {isBalancePayment
              ? 'Only tap after sending your transaction hash on WhatsApp. Admin will verify and release your account within 24 hours.'
              : 'Only tap after sending your transaction hash on WhatsApp. Admin will confirm your booking.'}
          </Text>
        </MotiView>
      )}

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}

// ── Detail row helper ─────────────────────────────────────────────────────────
function DetailRow({ label, value, copyable, highlight }: { label: string; value: string; copyable?: boolean; highlight?: boolean }) {
  return (
    <View style={dr.row}>
      <Text style={dr.label}>{label}</Text>
      <Text style={[dr.value, highlight && dr.highlight]}>{value}</Text>
    </View>
  );
}

const dr = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0E6E8' },
  label: { fontSize: 13, color: '#B89FA1', fontWeight: '600' },
  value: { fontSize: 14, fontWeight: '700', color: '#3B1C1A', flex: 1, textAlign: 'right' },
  highlight: { color: '#9D7A7D', fontSize: 18 },
});

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF5F6' },
  successContainer: { flex: 1, backgroundColor: '#FAF5F6', justifyContent: 'center', alignItems: 'center', padding: 32 },
  successContent: { alignItems: 'center', width: '100%', maxWidth: 380 },
  successIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#38A169', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#3B1C1A', textAlign: 'center', marginBottom: 12 },
  successMessage: { fontSize: 15, color: '#7C6665', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  doneBtn: { backgroundColor: '#9D7A7D', borderRadius: 25, paddingVertical: 16, paddingHorizontal: 40 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0E6E8' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#3B1C1A', flex: 1, textAlign: 'center' },
  securityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F5EDE8', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  securityText: { fontSize: 12, color: '#9D7A7D', fontWeight: '600' },
  card: { backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#3B1C1A', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: '#B89FA1' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#3B1C1A' },
  divider: { height: 1, backgroundColor: '#F0E6E8', marginVertical: 12 },
  remainingNote: { fontSize: 12, color: '#B89FA1', textAlign: 'center', marginBottom: 12, fontStyle: 'italic' },
  amountDueBox: { borderWidth: 2, borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  amountDueLabel: { fontSize: 15, fontWeight: '700', color: '#3B1C1A' },
  amountDueValue: { fontSize: 26, fontWeight: '800' },
  prefillBadge: { backgroundColor: '#F0FFF4', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#9AE6B4' },
  prefillText: { fontSize: 12, color: '#38A169', fontWeight: '600' },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#3B1C1A', marginBottom: 6 },
  input: { backgroundColor: '#FAF5F6', borderRadius: 12, padding: 13, fontSize: 15, color: '#3B1C1A', borderWidth: 1, borderColor: '#F0E6E8' },
  methodBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  methodBtnActive: { borderColor: '#9D7A7D' },
  methodIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  methodLabel: { fontSize: 15, fontWeight: '700', color: '#3B1C1A' },
  methodSub: { fontSize: 12, color: '#B89FA1', marginTop: 2 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D6BFC1', justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  methodNote: { fontSize: 14, color: '#7C6665', lineHeight: 22, marginBottom: 16 },
  detailsBox: { backgroundColor: '#FAF5F6', borderRadius: 14, padding: 14, marginBottom: 16 },
  stripeLogos: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20, justifyContent: 'center' },
  stripeNote: { fontSize: 12, color: '#9D7A7D' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 25, paddingVertical: 16 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.45 },
  whatsappBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#F0FFF4', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#9AE6B4' },
  whatsappTitle: { fontSize: 14, fontWeight: '700', color: '#3B1C1A', marginBottom: 2 },
  whatsappSub: { fontSize: 12, color: '#7C6665', lineHeight: 18 },
  whatsappNumber: { fontSize: 16, fontWeight: '800', color: '#25D366', marginTop: 4 },
  whatsappBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#25D366', borderRadius: 25, paddingVertical: 13, marginBottom: 20 },
  whatsappBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  notifyDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  notifyDividerLine: { flex: 1, height: 1, backgroundColor: '#F0E6E8' },
  notifyDividerText: { fontSize: 11, color: '#B89FA1', textAlign: 'center' },
  notifyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#9D7A7D', borderRadius: 25, paddingVertical: 15, marginBottom: 10 },
  notifyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  notifyCaption: { fontSize: 12, color: '#B89FA1', textAlign: 'center', lineHeight: 18 },
  cryptoRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0E6E8' },
  cryptoLabel: { fontSize: 12, color: '#9D7A7D', fontWeight: '600', marginBottom: 4 },
  cryptoAddress: { fontSize: 13, fontWeight: '700', color: '#3B1C1A', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});