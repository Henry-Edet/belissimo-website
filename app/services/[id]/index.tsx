// app/services/[id]/index.tsx
import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function ServiceRedirectScreen() {
  const { id } = useLocalSearchParams();
  
  // Redirect to the booking page with the service ID
  return <Redirect href={`/services/${id}/booking`} />;
}