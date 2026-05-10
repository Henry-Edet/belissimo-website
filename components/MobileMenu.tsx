// components/MobileMenu.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Dimensions, Linking } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.72;

interface Props { visible: boolean; onClose: () => void; }

// Fix: use discriminated union type so TypeScript knows which fields exist
type NavItem = { label: string; icon: any; route: string; url?: never };
type UrlItem = { label: string; icon: any; url: string; route?: never };
type MenuItem = NavItem | UrlItem;

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',     icon: 'home-outline',               route: '/(tabs)'          },
  { label: 'Services', icon: 'cut-outline',                route: '/services'         },
  { label: 'Bookings', icon: 'calendar-outline',           route: '/(tabs)/bookings'  },
  { label: 'Chat',     icon: 'chatbubble-ellipses-outline', route: '/(tabs)/chat'     },
];

const SETTINGS_ITEMS: MenuItem[] = [
  { label: 'Settings',           icon: 'settings-outline',          route: '/settings' },
  { label: 'Privacy Policy',     icon: 'shield-checkmark-outline',  url: 'https://www.privacypolicygenerator.info/' },
  { label: 'Terms & Conditions', icon: 'document-text-outline',     route: '/terms'    },
];

export default function MobileMenu({ visible, onClose }: Props) {
  const router = useRouter();

  const handlePress = (item: MenuItem) => {
    onClose();
    setTimeout(() => {
      if (item.url) {
        Linking.openURL(item.url);
      } else if (item.route) {
        router.push(item.route as any);
      }
    }, 200);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <MotiView
          from={{ translateX: -DRAWER_WIDTH }}
          animate={{ translateX: 0 }}
          exit={{ translateX: -DRAWER_WIDTH }}
          transition={{ type: 'timing', duration: 260 }}
          style={styles.drawer}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={{ flex: 1 }}>
            <View style={styles.drawerHeader}>
              <View style={styles.brandRow}>
                <View style={styles.brandDot} />
                <View>
                  <Text style={styles.brandName}>Bellissimo</Text>
                  <Text style={styles.brandSub}>Hair Studio</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#7C6665" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.navList}>
              {NAV_ITEMS.map((item) => (
                <TouchableOpacity key={item.label} style={styles.navItem} onPress={() => handlePress(item)} activeOpacity={0.7}>
                  <View style={styles.navIconBox}>
                    <Ionicons name={item.icon} size={20} color="#B04A75" />
                  </View>
                  <Text style={styles.navLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#D6BFC1" />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>Settings & Legal</Text>
            <View style={styles.navList}>
              {SETTINGS_ITEMS.map((item) => (
                <TouchableOpacity key={item.label} style={styles.navItem} onPress={() => handlePress(item)} activeOpacity={0.7}>
                  <View style={[styles.navIconBox, { backgroundColor: '#F0EBF5' }]}>
                    <Ionicons name={item.icon} size={20} color="#7C5E60" />
                  </View>
                  <Text style={styles.navLabel}>{item.label}</Text>
                  <Ionicons name={item.url ? 'open-outline' : 'chevron-forward'} size={16} color="#D6BFC1" />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.drawerFooter}>
              <Text style={styles.footerText}>© 2026 Bellissimo Hair Studio</Text>
              <Text style={styles.footerSub}>Premium Hair Services</Text>
            </View>
          </Pressable>
        </MotiView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', flexDirection: 'row' },
  drawer: { width: DRAWER_WIDTH, height: SCREEN_HEIGHT, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 8, height: 0 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 20 },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#B04A75' },
  brandName: { fontSize: 18, fontWeight: '700', color: '#3B1C1A', letterSpacing: 0.5 },
  brandSub: { fontSize: 11, color: '#B04A75', letterSpacing: 1.5, textTransform: 'uppercase' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F0F0', justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#F0E6E8', marginHorizontal: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#B89FA1', letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 28, paddingTop: 16, paddingBottom: 4 },
  navList: { paddingVertical: 8, paddingHorizontal: 16 },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 12, borderRadius: 14, marginVertical: 2, gap: 14 },
  navIconBox: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF0F6', justifyContent: 'center', alignItems: 'center' },
  navLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#3B1C1A' },
  drawerFooter: { padding: 24, marginTop: 'auto' },
  footerText: { fontSize: 13, color: '#B89FA1', fontWeight: '500' },
  footerSub: { fontSize: 12, color: '#D6BFC1', marginTop: 4 },
});