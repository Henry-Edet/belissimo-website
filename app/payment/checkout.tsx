import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { API_BASE_URL } from '../config';
import { MotiView } from 'moti';

export default function CheckoutScreen() {
  const router = useRouter();
  const { bookingId, amountCents, clientName } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    const initPayment = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/payments/create-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: Number(bookingId),
            amountCents: Number(amountCents),
            clientName,
          }),
        });

        const data = await res.json();
        if (data.paymentUrl) setPaymentUrl(data.paymentUrl);
        else Alert.alert('Error', 'Could not create payment session.');
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to start payment.');
      } finally {
        setLoading(false);
      }
    };

    initPayment();
  }, []);

  const handlePayNow = async () => {
    if (paymentUrl) await Linking.openURL(paymentUrl);
  };

  return (
    <View style={styles.container}>
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 500 }}
        style={styles.card}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#D681A0" />
        ) : (
          <>
            <Text style={styles.title}>Confirm Your Booking</Text>
            <Text style={styles.subtitle}>Booking ID #{bookingId}</Text>
            <Text style={styles.amount}>₦{(Number(amountCents) / 100).toLocaleString()}</Text>

            <TouchableOpacity style={styles.button} onPress={handlePayNow}>
              <Text style={styles.buttonText}>Pay Now 💳</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F9' },
  card: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#3B1C1A', textAlign: 'center' },
  subtitle: { marginTop: 8, textAlign: 'center', color: '#7C6665' },
  amount: { fontSize: 26, fontWeight: '800', color: '#D681A0', textAlign: 'center', marginVertical: 16 },
  button: { backgroundColor: '#D681A0', borderRadius: 14, paddingVertical: 14 },
  buttonText: { textAlign: 'center', color: '#fff', fontWeight: '700', fontSize: 18 },
  cancel: { marginTop: 12 },
  cancelText: { textAlign: 'center', color: '#B04A75', fontWeight: '600' },
});
