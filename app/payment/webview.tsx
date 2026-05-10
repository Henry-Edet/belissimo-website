// app/payment/webview.tsx
// Fixed: redirects to /payment/confirmation (not /payment/success which doesn't exist)

import React from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export default function PaymentWebView() {
  const router = useRouter();
  const { url, bookingId, serviceName, date, time, clientName, amount, isBalancePayment } =
    useLocalSearchParams<{
      url?: string;
      bookingId?: string;
      serviceName?: string;
      date?: string;
      time?: string;
      clientName?: string;
      amount?: string;
      isBalancePayment?: string;
    }>();

  // ── No URL guard ──────────────────────────────────────────────────────────
  if (!url) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Payment Link Missing</Text>
        <Text style={styles.errorText}>
          Could not load the payment page. Please try again.
        </Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#3B1C1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Payment</Text>
        <View style={styles.headerRight} />
      </View>

      {/* WebView */}
      <WebView
        source={{ uri: String(url) }}
        style={styles.webview}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#B04A75" />
            <Text style={styles.loadingText}>Loading payment page…</Text>
          </View>
        )}
        onNavigationStateChange={(navState) => {
          const currentUrl = navState.url || '';

          // ✅ Fixed: redirect to /payment/confirmation (not /payment/success)
          if (
            currentUrl.includes('success') ||
            currentUrl.includes('confirmed') ||
            currentUrl.includes('callback')
          ) {
            router.replace({
              pathname: '/payment/confirmation',
              params: {
                bookingId: bookingId ?? '',
                amount: amount ?? '0',
                serviceName: serviceName ?? '',
                date: date ?? '',
                time: time ?? '',
                clientName: clientName ?? '',
                isBalancePayment: isBalancePayment ?? 'false',
              },
            });
          }

          if (currentUrl.includes('cancel') || currentUrl.includes('failed')) {
            router.replace('/payment/cancel');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6E8',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3B1C1A',
  },
  headerRight: {
    width: 38,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#B89FA1',
  },
  // ── Error State ────────────────────────────────────────────────────────────
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFF8F9',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3B1C1A',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#7C6665',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  errorBtn: {
    backgroundColor: '#B04A75',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },
  errorBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});