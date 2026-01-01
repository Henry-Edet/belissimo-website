import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PaymentSuccess() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Successful 🎉</Text>
      <Text style={styles.subtitle}>Your booking is confirmed.</Text>

      {bookingId ? (
        <Text style={styles.infoText}>Booking ID: {bookingId}</Text>
      ) : null}

      <TouchableOpacity style={styles.btn} onPress={() => router.push('/')}>
        <Text style={styles.btnText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#3B1C1A' },
  subtitle: { marginTop: 10, fontSize: 16, color: '#666' },
  infoText: { marginTop: 20, fontSize: 16, color: '#4A2A28' },
  btn: {
    marginTop: 40,
    backgroundColor: '#D681A0',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 18,
  },
  btnText: { color: 'white', fontWeight: '700', fontSize: 18 },
});
