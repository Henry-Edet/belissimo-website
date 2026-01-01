import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PaymentWebView() {
  const router = useRouter();
  const { url, bookingId } = useLocalSearchParams<{ url?: string; bookingId?: string }>();

  if (!url) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: String(url) }}
      style={{ flex: 1 }}
      onNavigationStateChange={(navState) => {
        const currentUrl = navState.url || '';

        if (currentUrl.includes('success')) {
          router.replace({
            pathname: '/payment/success',
            params: { bookingId: bookingId ?? '' },
          });
        }

        if (currentUrl.includes('cancel')) {
          router.back();
        }
      }}
    />
  );
}
