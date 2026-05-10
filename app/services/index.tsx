// app/services/index.tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ScrollView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { API_BASE_URL } from '@/lib/config';

const SERVICES = [
  { id: 'installation', title: 'Wig Installation & Styling', subtitle: 'Frontals, closures, ponytails, revamps', price: 'From $250', duration: '2 hrs', image: require('../../assets/images/installation.jpg'), accent: '#B89FA1', tag: 'Most Popular' },
  { id: 'braids', title: 'Braids & Cornrows', subtitle: 'Knotless, boho, fulani, cornrows', price: 'From $300', duration: '4 hrs', image: require('../../assets/images/braids.jpg'), accent: '#C9A8A5', tag: 'Trending' },
  { id: 'wash', title: 'Wash & Care', subtitle: 'Wash, condition, treatment & drying', price: 'From $50', duration: '1 hr', image: require('../../assets/images/washingHair.jpg'), accent: '#D6BFC1', tag: 'Quick Service' },
];

export default function ServicesIndexScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isAuthenticated, getAuthHeaders } = useAuth();
  const [isOwing, setIsOwing] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/bookings/my-bookings`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const bookings = data.bookings ?? data ?? [];
          setIsOwing(bookings.some((b: any) => b.paymentStatus === 'owing'));
        }
      } catch {}
    })();
  }, [isAuthenticated]);

  const handleBack = () => {
    router.replace('/(tabs)');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>

      {/* Owing banner */}
      {isOwing && (
        <View style={styles.owingBanner}>
          <Ionicons name="alert-circle" size={18} color="#fff" />
          <Text style={styles.owingBannerText}>You have an outstanding balance. Please pay before booking a new service.</Text>
        </View>
      )}
          <Text style={styles.headerLabel}>Bellissimo Hair Studio</Text>
          <Text style={styles.headerTitle}>Our Services</Text>
        </View>
      </View>

      <Text style={styles.headerSubtitle}>
        Select a category to explore styles and book your appointment
      </Text>

      {/* ── Cards ── */}
      {SERVICES.map((service, idx) => (
        <MotiView
          key={service.id}
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200 + idx * 120, duration: 500 }}
        >
          <TouchableOpacity activeOpacity={0.92} onPress={() => router.push(`/services/${service.id}` as any)}>
            <View style={styles.card}>
              <Image source={service.image} style={styles.cardImage} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={styles.cardGradient} />
              <View style={[styles.tag, { backgroundColor: service.accent }]}>
                <Text style={styles.tagText}>{service.tag}</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{service.title}</Text>
                  <Text style={styles.cardPrice}>{service.price}</Text>
                </View>
                <Text style={styles.cardSubtitle}>{service.subtitle}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="schedule" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.metaText}>{service.duration}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.bookBtn, { backgroundColor: isOwing ? '#B89FA1' : service.accent }]}
                    onPress={() => {
                      if (isOwing) {
                        Alert.alert('Outstanding Balance', 'Please clear your outstanding balance before booking.');
                        return;
                      }
                      router.push(`/services/${service.id}` as any);
                    }}
                  >
                    <Text style={styles.bookBtnText}>{isOwing ? 'Balance Owing' : 'Book Now'}</Text>
                    <MaterialIcons name={isOwing ? 'lock' : 'arrow-forward'} size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </MotiView>
      ))}

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <MaterialIcons name="info-outline" size={16} color="#B89FA1" />
        <Text style={styles.footerText}>All prices are starting rates. Final price depends on style selected.</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF5F6' },
  content: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 8,
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  headerText: { flex: 1 },
  headerLabel: { fontSize: 12, fontWeight: '600', color: '#B04A75', letterSpacing: 1.5, textTransform: 'uppercase' },
  headerTitle: { fontSize: 26, fontWeight: '300', color: '#3B1C1A', marginTop: 2 },
  headerSubtitle: { fontSize: 14, color: '#7C6665', lineHeight: 20, paddingHorizontal: 20, marginBottom: 20 },
  card: { marginHorizontal: 20, marginBottom: 20, borderRadius: 24, overflow: 'hidden', height: 260, position: 'relative', shadowColor: '#3B1C1A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover', position: 'absolute' },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' },
  tag: { position: 'absolute', top: 16, left: 16, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  cardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#fff', flex: 1, marginRight: 8 },
  cardPrice: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 14 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  bookBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 5 },
  bookBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  owingBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#E74C3C', borderRadius: 12 },
  owingBannerText: { flex: 1, fontSize: 13, color: '#fff', fontWeight: '500', lineHeight: 18 },
  footer: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 24, marginTop: 4 },
  footerText: { flex: 1, fontSize: 13, color: '#B89FA1', lineHeight: 18 },
});