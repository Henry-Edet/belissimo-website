// app/(tabs)/gallery.tsx
// Hidden from tab bar — gallery content lives on the homepage cards
// This file must exist to prevent Expo Router from throwing a missing route error

import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth-context';

export default function GalleryTab() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect href="/auth" />;
  return <Redirect href="/profile" />;
}