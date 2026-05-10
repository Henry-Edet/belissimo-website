// app/payment/cancel.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, useNavigation} from 'expo-router';
import { MotiView } from 'moti';
import { XCircle, ArrowLeft, Calendar } from 'lucide-react-native';

export default function CancelScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)'); // safe fallback
    }
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
        <ArrowLeft size={22} color="#7C6665" />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Icon */}
        <MotiView
          from={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18 }}
          style={styles.iconWrapper}
        >
          <View style={styles.iconCircle}>
            <XCircle size={52} color="#E53E3E" strokeWidth={1.5} />
          </View>
        </MotiView>

        {/* Text */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200, duration: 500 }}
        >
          <Text style={styles.title}>Payment Cancelled</Text>
          <Text style={styles.subtitle}>
            Your booking has not been confirmed. No charges were made.
          </Text>
        </MotiView>

        {/* Info box */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 350, duration: 500 }}
          style={styles.infoBox}
        >
          <Text style={styles.infoTitle}>What would you like to do?</Text>
          <Text style={styles.infoText}>
            You can try again with a different payment method, choose another time slot, or come back later.
          </Text>
        </MotiView>

        {/* Buttons */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 500 }}
          style={styles.buttons}
        >
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/services')}
            activeOpacity={0.85}
          >
            <Calendar size={18} color="#B04A75" />
            <Text style={styles.secondaryBtnText}>Choose Another Time</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/')}
            style={styles.ghostBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.ghostBtnText}>Go to Home</Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F9',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 40,
  },
  // ── Icon ──────────────────────────────────────────────────────────────────
  iconWrapper: {
    marginBottom: 28,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FED7D7',
  },
  // ── Text ──────────────────────────────────────────────────────────────────
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3B1C1A',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#7C6665',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 300,
  },
  // ── Info Box ───────────────────────────────────────────────────────────────
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#F0E6E8',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3B1C1A',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#7C6665',
    lineHeight: 21,
  },
  // ── Buttons ────────────────────────────────────────────────────────────────
  buttons: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#B04A75',
    borderRadius: 25,
    paddingVertical: 17,
    shadowColor: '#B04A75',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryBtn: {
    borderRadius: 25,
    paddingVertical: 17,
    borderWidth: 2,
    borderColor: '#B04A75',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    color: '#B04A75',
    fontSize: 17,
    fontWeight: '700',
  },
  ghostBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostBtnText: {
    fontSize: 15,
    color: '#B89FA1',
    fontWeight: '600',
  },
});