// app/(tabs)/services.tsx
// This tab now redirects to the proper services screen
// which lives at app/services/index.tsx

import { Redirect } from 'expo-router';

export default function ServicesTab() {
  return <Redirect href="/services" />;
}