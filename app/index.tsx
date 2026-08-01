// app/index.tsx
// Entry point — checks if onboarding is complete before routing
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_KEY } from './onboarding';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((val) => setOnboarded(!!val))
      .catch(() => setOnboarded(false))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    // Show the app's brand colour while we check — no flash
    return <View style={{ flex: 1, backgroundColor: '#3B1C1A' }} />;
  }

  return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
}