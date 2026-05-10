// app/(tabs)/_layout.tsx

import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity, Text, Platform } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { useAuth } from '@/lib/auth-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme-context';

export default function TabLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const isAdmin  = user?.role === 'admin';
  const isClient = isAuthenticated && !isAdmin;

  // Dynamic header styles that respond to theme
  const headerStyle = {
    backgroundColor: colors.card,
    shadowColor: 'transparent',
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopWidth: 0,
          elevation: 12,
          paddingBottom: insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 8 : 4,
          paddingTop: 8,
          height: (Platform.OS === 'ios' ? 50 : 56) + (insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 8 : 4),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          href: isClient ? undefined : null,
          tabBarIcon: ({ color }) => <Ionicons name="chatbubble-ellipses-outline" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          href: isClient ? undefined : null,
          tabBarIcon: ({ color }) => <Ionicons name="cut-outline" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Account',
          href: isAdmin ? null : undefined,
          headerShown: isClient,
          headerStyle,
          headerTintColor: colors.text,
          headerRight: () =>
            isClient ? (
              <TouchableOpacity
                style={{ marginRight: 16, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}
                onPress={() => logout()}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>Sign Out</Text>
              </TouchableOpacity>
            ) : null,
          headerTitle: () =>
            isClient ? (
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                  Hi, {user?.email?.split('@')[0]} 👋
                </Text>
                <Text style={{ fontSize: 11, color: colors.primary, marginTop: 1 }}>
                  Tap to view profile
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>Account</Text>
            ),
          tabBarIcon: ({ color }) => <Ionicons name="person-circle-outline" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="gallery"
        options={{
          href: null, // hidden from tab bar — gallery is on homepage cards
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          title: 'Dashboard',
          href: isAdmin ? undefined : null,
          headerShown: isAdmin,
          headerStyle,
          headerTintColor: colors.text,
          headerTitle: () => (
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>Admin Dashboard</Text>
          ),
          headerRight: () =>
            isAdmin ? (
              <TouchableOpacity
                style={{ marginRight: 16, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}
                onPress={() => router.push('/profile')}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>My Profile</Text>
              </TouchableOpacity>
            ) : null,
          tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}