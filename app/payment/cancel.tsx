import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function CancelScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>❌</Text>
      <Text style={styles.title}>Payment Cancelled</Text>
      <Text style={styles.message}>Your booking has not been confirmed.</Text>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F9' },
  icon: { fontSize: 90 },
  title: { fontSize: 24, fontWeight: '700', color: '#3B1C1A', marginTop: 16 },
  message: { color: '#7C6665', marginTop: 8 },
  link: { marginTop: 20, fontWeight: '600', color: '#D681A0' },
});
