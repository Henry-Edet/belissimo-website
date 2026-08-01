// app/(tabs)/index.tsx

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView, StyleSheet,
  Dimensions, NativeScrollEvent, NativeSyntheticEvent, Modal,
  FlatList, ActivityIndicator, Pressable, TextInput, Linking,
  Animated, Platform, Alert,
} from 'react-native';
import { MotiView } from 'moti';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Video, ResizeMode } from 'expo-av';
import { API_BASE_URL } from '@/lib/config';
import MobileMenu from '@/components/MobileMenu';
import { useAuth } from '@/lib/auth-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;
const IS_MOBILE = SCREEN_WIDTH < 768;
// Responsive card width — takes 75% of screen width, capped at 300px
const CARD_WIDTH = Math.min(Math.round(SCREEN_WIDTH * 0.75), 300);
const CARD_SPACING = 20;
const CARD_FULL_WIDTH = CARD_WIDTH + CARD_SPACING;

// ─── Searchable services ──────────────────────────────────────────────────────
const ALL_SERVICES = [
  { name: 'Frontal Install',             category: 'Wig Installation', route: '/services/installation' },
  { name: 'Closure Install',             category: 'Wig Installation', route: '/services/installation' },
  { name: 'Wig Revamp',                  category: 'Wig Installation', route: '/services/installation' },
  { name: 'Wig Customization',           category: 'Wig Installation', route: '/services/installation' },
  { name: 'Lace Refill',                 category: 'Wig Installation', route: '/services/installation' },
  { name: 'Frontal Ponytail',            category: 'Wig Installation', route: '/services/installation' },
  { name: 'Traditional Sew-in',          category: 'Wig Installation', route: '/services/installation' },
  { name: 'Frontal Sew-in',              category: 'Wig Installation', route: '/services/installation' },
  { name: 'Closure Sew-in',              category: 'Wig Installation', route: '/services/installation' },
  { name: 'Wigging (Glueless)',          category: 'Wig Installation', route: '/services/installation' },
  { name: 'Knotless Braids',             category: 'Braids & Cornrows', route: '/services/braids' },
  { name: 'French Curls',                category: 'Braids & Cornrows', route: '/services/braids' },
  { name: 'Boho Braids',                 category: 'Braids & Cornrows', route: '/services/braids' },
  { name: 'Fulani Braids',               category: 'Braids & Cornrows', route: '/services/braids' },
  { name: 'Cornrows with Extensions',    category: 'Braids & Cornrows', route: '/services/braids' },
  { name: 'Ponytail',                    category: 'Braids & Cornrows', route: '/services/braids' },
  { name: 'Wash Only',                   category: 'Wash & Care', route: '/services/wash' },
  { name: 'Full Care (Wash + Treatment)', category: 'Wash & Care', route: '/services/wash' },
];

// Local fallback images — used when no custom image uploaded to S3
const LOCAL_IMAGES: Record<string, any> = {
  installation: require('../../assets/images/installation.jpg'),
  braids:       require('../../assets/images/braids.jpg'),
  wash:         require('../../assets/images/washingHair.jpg'),
};
const PLACEHOLDER_IMAGE = require('../../assets/images/logo.png');

// Accent colours cycle for new services
const SERVICE_COLORS = ['#B89FA1', '#C9A8A5', '#D6BFC1', '#9D7A7D', '#7C5E60'];

// Maps a backend service to a card-renderable shape
function mapBackendService(s: any, index: number) {
  const nameLower = s.name?.toLowerCase() ?? '';
  const localKey = nameLower.includes('install') || nameLower.includes('wig')
    ? 'installation'
    : nameLower.includes('braid') || nameLower.includes('corn')
    ? 'braids'
    : nameLower.includes('wash') || nameLower.includes('care')
    ? 'wash'
    : null;

  return {
    id: s.id,
    title: s.name,
    subtitle: s.description?.split('.')[0] ?? s.name,
    description: '', // avoid showing description twice (subtitle already shows it)
    price: `From $${((s.priceCents ?? 0) / 100).toFixed(0)}`,
    priceCents: s.priceCents ?? 0,
    durationMinutes: s.durationMinutes ?? 60,
    tag: s.tag ?? '',
    // If admin uploaded an S3 image use it, else use matching local image or placeholder
    image: s.imageUrl
      ? { uri: s.imageUrl }
      : localKey
      ? LOCAL_IMAGES[localKey]
      : PLACEHOLDER_IMAGE,
    route: localKey ? `/services/${localKey}` : '/services',
    color: SERVICE_COLORS[index % SERVICE_COLORS.length],
  };
}

const TESTIMONIALS = [
  { id: 1, name: 'Chiamaka', text: "Best wig installation I've ever had! The quality is exceptional. I walked out feeling like a completely different person — every detail was perfect.", rating: 5, date: '2 days ago', likes: 12 },
  { id: 2, name: 'Tolu', text: 'Professional and timely service. My braids look absolutely amazing! The stylist listened to exactly what I wanted and delivered beyond my expectations.', rating: 5, date: '1 week ago', likes: 8 },
  { id: 3, name: 'Zainab', text: 'The wash and care treatment completely revived my hair. It feels so healthy and soft now. I highly recommend Bellissimo to anyone looking for premium hair care.', rating: 4, date: '2 weeks ago', likes: 5 },
  { id: 4, name: 'Adaeze', text: 'Absolutely stunning work! My frontal installation looks so natural. Everyone keeps asking who did my hair. Bellissimo never disappoints!', rating: 5, date: '3 weeks ago', likes: 19 },
  { id: 5, name: 'Fatima', text: 'The knotless braids lasted so long and looked immaculate from day one. The attention to detail is unmatched. Will always come back!', rating: 5, date: '1 month ago', likes: 14 },
];

// ─── Gallery Modal ────────────────────────────────────────────────────────────
// Inline video player for lightbox
function VideoPlayer({ uri }: { uri: string }) {
  const { width: W } = Dimensions.get('window');
  return (
    <Video
      source={{ uri }}
      style={{ width: W, height: W * 0.75 }}
      resizeMode={ResizeMode.CONTAIN}
      useNativeControls
      shouldPlay
    />
  );
}

const FOLDER_LABELS: Record<string, string> = {
  premium_quality:  'Premium Quality',
  before_after:     'Before & After',
  expert_stylists:  'Expert Stylists',
  hygiene_first:    'Hygiene First',
};

function GalleryModal({ visible, folder, onClose }: { visible: boolean; folder: string; onClose: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    if (visible) fetchGallery(folder);
  }, [visible, folder]);

  const fetchGallery = async (f: string) => {
    try {
      setLoading(true);
      setItems([]);
      const res = await fetch(`${API_BASE_URL}/gallery/folder/${f}`);
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : (data.items ?? []));
      } else {
        // Fallback — try general gallery endpoint with folder filter
        const res2 = await fetch(`${API_BASE_URL}/gallery?folder=${f}&limit=50`);
        if (res2.ok) {
          const data2 = await res2.json();
          setItems(Array.isArray(data2) ? data2 : (data2.items ?? []));
        }
      }
    } catch { setItems([]); } finally { setLoading(false); }
  };

  const imgSize = (SCREEN_WIDTH - 48) / 2;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={modal.container}>
        <View style={modal.header}>
          <Text style={modal.title}>{FOLDER_LABELS[folder] ?? 'Our Work'}</Text>
          <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
            <Ionicons name="close" size={24} color="#3B1C1A" />
          </TouchableOpacity>
        </View>

        {loading
          ? <View style={modal.center}><ActivityIndicator size="large" color="#B04A75" /></View>
          : items.length === 0
            ? <View style={modal.center}>
                <Ionicons name="images-outline" size={64} color="#D6BFC1" />
                <Text style={modal.emptyTitle}>No photos yet</Text>
                <Text style={{ fontSize: 14, color: '#B89FA1', marginTop: 6 }}>Check back soon!</Text>
              </View>
            : <>
                <FlatList
                  data={items}
                  numColumns={2}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={modal.grid}
                  columnWrapperStyle={{ gap: 8 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => setSelected(item)} activeOpacity={0.85}>
                      <View style={{ width: imgSize, height: imgSize, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F0E6E8' }}>
                        <Image source={{ uri: item.thumbnailUrl || item.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        {item.type === 'video' && (
                          <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                            <Ionicons name="play-circle" size={36} color="#fff" />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                />

                {/* Lightbox */}
                <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
                  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity
                      style={{ position: 'absolute', top: 56, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}
                      onPress={() => setSelected(null)}
                    >
                      <Ionicons name="close" size={22} color="#fff" />
                    </TouchableOpacity>
                    {selected?.type === 'video'
                      ? <VideoPlayer uri={selected.url} />
                      : <Image source={{ uri: selected?.url }} style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.1 }} resizeMode="contain" />
                    }
                    {selected?.caption && (
                      <Text style={{
                        color: '#fff',
                        fontSize: selected?.folder === 'expert_stylists' ? 18 : 14,
                        fontWeight: selected?.folder === 'expert_stylists' ? '700' : '400',
                        marginTop: 16,
                        paddingHorizontal: 24,
                        textAlign: 'center',
                      }}>
                        {selected?.folder === 'expert_stylists' ? `👤 ${selected.caption}` : selected.caption}
                      </Text>
                    )}
                  </View>
                </Modal>
              </>
        }
      </View>
    </Modal>
  );
}

// ─── Coming Soon Modal ────────────────────────────────────────────────────────
function ComingSoonModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={modal.overlay} onPress={onClose}>
        <Pressable>
          <MotiView from={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 18 }} style={modal.sheet}>
            <View style={modal.comingSoonIcon}><Text style={{ fontSize: 48 }}>✂️</Text></View>
            <Text style={modal.comingSoonTitle}>Meet Our Stylists</Text>
            <Text style={modal.comingSoonSubtitle}>Coming Soon</Text>
            <Text style={modal.comingSoonText}>We're putting together profiles for each of our talented stylists. Check back soon!</Text>
            <TouchableOpacity style={modal.comingSoonBtn} onPress={onClose}><Text style={modal.comingSoonBtnText}>Got it</Text></TouchableOpacity>
          </MotiView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Reviews Modal (See More) ─────────────────────────────────────────────────
function ReviewsModal({ visible, onClose, liveReviews }: { visible: boolean; onClose: () => void; liveReviews: any[] }) {
  const displayReviews = liveReviews.length > 0 ? liveReviews : TESTIMONIALS;
  const [localLikes, setLocalLikes] = useState<Record<number, { count: number; liked: boolean }>>({});

  useEffect(() => {
    const map: Record<number, { count: number; liked: boolean }> = {};
    displayReviews.forEach((t: any, i: number) => {
      map[t.id ?? i] = { count: t.likes ?? 0, liked: false };
    });
    setLocalLikes(map);
  }, [liveReviews]);

  const toggleLike = async (id: number) => {
    setLocalLikes(prev => ({
      ...prev,
      [id]: { count: prev[id]?.liked ? prev[id].count - 1 : (prev[id]?.count ?? 0) + 1, liked: !prev[id]?.liked }
    }));
    if (liveReviews.length > 0) {
      try { await fetch(`${API_BASE_URL}/reviews/${id}/like`, { method: 'PATCH' }); } catch {}
    }
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Ionicons key={i} name={i < rating ? 'star' : 'star-outline'} size={14} color="#FFD700" style={{ marginRight: 1 }} />
    ));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={modal.container}>
        <View style={modal.header}>
          <Text style={modal.title}>Client Stories</Text>
          <TouchableOpacity onPress={onClose} style={modal.closeBtn}><Ionicons name="close" size={24} color="#3B1C1A" /></TouchableOpacity>
        </View>
        {displayReviews.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
            <Text style={{ color: '#B89FA1', fontSize: 15 }}>No reviews yet — be the first!</Text>
          </View>
        ) : (
          <FlatList
            data={displayReviews}
            keyExtractor={(t, i) => String(t.id ?? i)}
            contentContainerStyle={{ padding: 16, gap: 14 }}
            renderItem={({ item: t, index }) => {
              const tid = t.id ?? index;
              const name = t.clientName ?? t.name ?? 'Client';
              const text = t.comment ?? t.text ?? '';
              const rating = t.rating ?? 5;
              const date = t.createdAt
                ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : (t.date ?? '');
              const likeData = localLikes[tid] ?? { count: t.likes ?? 0, liked: false };
              return (
                <View style={modal.reviewCard}>
                  <View style={modal.reviewHeader}>
                    <View style={modal.reviewAvatar}><Text style={modal.reviewAvatarText}>{name.charAt(0).toUpperCase()}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={modal.reviewName}>{name}</Text>
                      <Text style={modal.reviewDate}>{date}</Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>{renderStars(rating)}</View>
                  </View>
                  <Text style={modal.reviewText}>{text}</Text>
                  <TouchableOpacity style={modal.likeRow} onPress={() => toggleLike(tid)} activeOpacity={0.7}>
                    <Ionicons name={likeData.liked ? 'heart' : 'heart-outline'} size={18} color={likeData.liked ? '#E53E3E' : '#B89FA1'} />
                    <Text style={[modal.likeCount, likeData.liked && { color: '#E53E3E' }]}>
                      {likeData.count} {likeData.count === 1 ? 'like' : 'likes'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, getAuthHeaders } = useAuth();
  const [isOwing, setIsOwing] = useState(false);
  const [liveServices, setLiveServices] = useState<ReturnType<typeof mapBackendService>[]>([]);
  const [liveReviews, setLiveReviews] = useState<any[]>([]);
  const scrollRef = useRef<ScrollView | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchWidth = useRef(new Animated.Value(44)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const [stats, setStats] = useState({ happyClients: '0', satisfaction: '0%', reviews: '0' });
  const [likes, setLikes] = useState<Record<number, { count: number; liked: boolean }>>(
    Object.fromEntries(TESTIMONIALS.map((t) => [t.id, { count: t.likes, liked: false }]))
  );
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [galleryModalVisible, setGalleryModalVisible] = useState(false);
  const [galleryFolder, setGalleryFolder] = useState('premium_quality');
  const [comingSoonVisible, setComingSoonVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);

  const WHATSAPP = '+905428783359';
  const openWhatsApp = () => Linking.openURL(`https://wa.me/${WHATSAPP}`);
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);

  const searchInputRef = useRef<TextInput>(null);

  // Search expand/collapse animation
  const expandSearch = () => {
    setSearchExpanded(true);
    Animated.parallel([
      Animated.spring(searchWidth, { toValue: 200, useNativeDriver: false }),
      Animated.spring(logoScale, { toValue: 0.6, useNativeDriver: true }),
    ]).start(() => searchInputRef.current?.focus());
  };

  const collapseSearch = () => {
    setSearchQuery('');
    setSearchExpanded(false);
    Animated.parallel([
      Animated.spring(searchWidth, { toValue: 44, useNativeDriver: false }),
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  // Search results
  const searchResults = searchQuery.length > 0
    ? ALL_SERVICES.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/reviews/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats({
            happyClients: data.happyClients > 0 ? `${data.happyClients}+` : '0',
            satisfaction: data.satisfactionRate > 0 ? `${data.satisfactionRate}%` : '0%',
            reviews: data.totalReviews > 0 ? `${data.totalReviews}` : '0',
          });
        }
      } catch {}
    };

    const fetchOwingStatus = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await fetch(`${API_BASE_URL}/bookings/my-bookings`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const bookings = data.bookings ?? data ?? [];
          setIsOwing(bookings.some((b: any) => b.paymentStatus === 'owing'));
        }
      } catch {}
    };

    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/reviews`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) setLiveReviews(data);
        }
      } catch {}
    };

    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/services`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setLiveServices(data.map(mapBackendService));
          }
        }
      } catch {}
    };

    fetchStats();
    fetchOwingStatus();
    fetchReviews();
    fetchServices();
  }, [isAuthenticated]);

  // Re-check owing status every time home screen is focused
  // This catches admin marking owing while client is in the app
  useFocusEffect(
    React.useCallback(() => {
      if (!isAuthenticated) return;
      fetch(`${API_BASE_URL}/bookings/my-bookings`, { headers: getAuthHeaders() })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            const bookings = data.bookings ?? data ?? [];
            setIsOwing(bookings.some((b: any) => b.paymentStatus === 'owing'));
          }
        })
        .catch(() => {});
    }, [isAuthenticated])
  );

  const toggleLike = (id: number) => {
    setLikes((prev) => ({ ...prev, [id]: { count: prev[id].liked ? prev[id].count - 1 : prev[id].count + 1, liked: !prev[id].liked } }));
  };

  const toggleExpanded = (id: number) => setExpandedId((prev) => (prev === id ? null : id));

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % (liveServices.length || 1);
      setCurrentIndex(nextIndex);
      scrollRef.current?.scrollTo({ x: nextIndex * CARD_FULL_WIDTH, animated: true });
    }, 4000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / CARD_FULL_WIDTH);
    if (index !== currentIndex) setCurrentIndex(index);
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <Ionicons key={i} name={i < rating ? 'star' : 'star-outline'} size={14} color="#FFD700" style={{ marginRight: 2 }} />
    ));

  const handleFeaturePress = (label: string) => {
    switch (label) {
      case 'Before & After':   setGalleryFolder('before_after');    setGalleryModalVisible(true); break;
      case 'Premium Quality': setGalleryFolder('premium_quality'); setGalleryModalVisible(true); break;
      case 'Expert Stylists': setGalleryFolder('expert_stylists'); setGalleryModalVisible(true); break;
      case 'Hygiene First':   setGalleryFolder('hygiene_first');   setGalleryModalVisible(true); break;
    }
  };

  const FEATURES = [
    { icon: 'emoji-events' as const,        label: 'Premium Quality', color: '#C9A8A5' },
    { icon: 'schedule' as const,            label: 'Before & After',   color: '#B89FA1' },
    { icon: 'people' as const,              label: 'Expert Stylists', color: '#9D7A7D' },
    { icon: 'health-and-safety' as const,   label: 'Hygiene First',   color: '#7C5E60' },
  ];

  // Fix 1 & 3: replaced outer Pressable with View — fixes scroll blocking
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── HERO ── */}
        <View style={styles.heroContainer}>
          <Image source={require('../../assets/images/hero-wig.jpg')} style={styles.heroBackground} resizeMode="cover" />
          <View style={styles.heroOverlay} />

          {/* Top bar */}
          <View style={styles.topBar}>
            {IS_MOBILE && (
              <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} style={styles.hamburgerButton}>
                <Ionicons name={menuOpen ? 'close' : 'menu'} size={28} color="#FFF" />
              </TouchableOpacity>
            )}
            <View style={styles.topBarRight}>
              {/* Animated search — circle that expands */}
              <Animated.View style={[styles.searchContainer, { width: searchWidth }]}>
                {searchExpanded ? (
                  <View style={styles.searchExpanded}>
                    <Ionicons name="search" size={16} color="rgba(255,255,255,0.8)" />
                    <TextInput
                      ref={searchInputRef}
                      style={styles.searchInput}
                      placeholder="Search services..."
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      returnKeyType="search"
                      onSubmitEditing={() => {
                        if (searchQuery.trim()) { router.push('/services' as any); collapseSearch(); }
                      }}
                    />
                    <TouchableOpacity onPress={collapseSearch}>
                      <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.searchCircle} onPress={expandSearch}>
                    <Ionicons name="search" size={20} color="#FFF" />
                  </TouchableOpacity>
                )}
              </Animated.View>

              {/* Logo — shrinks when search expands */}
              <Animated.Image
                source={require('../../assets/images/logo.png')}
                style={[styles.logo, { transform: [{ scale: logoScale }] }]}
              />
            </View>
          </View>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <View style={styles.searchDropdown}>
              {searchResults.map((item, i) => (
                <TouchableOpacity
                  key={`${item.name}-${i}`}
                  style={[styles.searchResult, i < searchResults.length - 1 && styles.searchResultBorder]}
                  onPress={() => { collapseSearch(); router.push(item.route as any); }}
                >
                  <Ionicons name="cut-outline" size={14} color="#B04A75" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchResultName}>{item.name}</Text>
                    <Text style={styles.searchResultCat}>{item.category}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#D6BFC1" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {IS_TABLET && (
            <BlurView intensity={30} tint="dark" style={styles.navBar}>
              <View style={styles.navLinks}>
                {['About', 'Services', 'Bookings', 'Contact'].map((item) => (
                  <TouchableOpacity key={item} onPress={() => {
                    if (item === 'About') { setAboutVisible(true); return; }
                    if (item === 'Contact') { openWhatsApp(); return; }
                    router.push(`/${item.toLowerCase()}` as any);
                  }} style={styles.navLink}>
                    <Text style={styles.navLinkText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </BlurView>
          )}

          <MotiView from={{ opacity: 0, translateY: 30 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 800 }} style={styles.heroContent}>
            <Text style={styles.heroTitle}>Bellissimo Hair Studio</Text>
            {IS_TABLET ? (
              <>
                <Text style={styles.heroSubtitle}>Where elegance meets exceptional hair artistry</Text>
                <Text style={styles.heroDescription}>Premium wig installation, braiding, and hair care services tailored to enhance your natural beauty</Text>
              </>
            ) : (
              <Text style={styles.heroSubtitleMobile}>Premium Hair Services</Text>
            )}
            <View style={styles.heroStats}>
              {[[stats.happyClients, 'Happy Clients'], [stats.satisfaction, 'Satisfaction'], [stats.reviews, 'Reviews']].map(([num, label], i) => (
                <React.Fragment key={label}>
                  {i > 0 && <View style={styles.statDivider} />}
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{num}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </MotiView>
        </View>

        {/* ── FEATURES ── */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why Choose Bellissimo</Text>
          <Text style={styles.sectionSubtitle}>Excellence in every strand, perfection in every style</Text>
          <View style={styles.spacing} />
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature) => (
              <TouchableOpacity key={feature.label} style={styles.featureColumn} onPress={() => handleFeaturePress(feature.label)} activeOpacity={0.85}>
                <View style={styles.featureCard}>
                  <View style={[styles.featureIconContainer, { backgroundColor: feature.color }]}>
                    <MaterialIcons name={feature.icon} size={28} color="#FFF" />
                  </View>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                  <Text style={styles.featureHint}>
                    {feature.label === 'Premium Quality' && 'View our work →'}
                    {feature.label === 'Before & After'   && 'View our work →'}
                    {feature.label === 'Expert Stylists' && 'View our work →'}
                    {feature.label === 'Hygiene First'   && 'View our work →'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── SERVICES CAROUSEL ── */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Our Signature Services</Text>
          <Text style={styles.sectionSubtitle}>Curated excellence for every hair need</Text>
          <View style={styles.spacing} />
          <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_FULL_WIDTH} decelerationRate={0.85}
            onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={styles.carouselContent}>
            {liveServices.map((service, index) => {
              const isActive = index === currentIndex;
              return (
                <TouchableOpacity key={service.id} onPress={() => {
                  if (isOwing) {
                    Alert.alert('Outstanding Balance', 'Please clear your outstanding balance before booking a new service.');
                    return;
                  }
                  router.push(service.route as any);
                }} activeOpacity={0.9}>
                  <MotiView style={[styles.serviceCard, { borderColor: isActive ? service.color : '#F0E6E8' }]}
                    from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: isActive ? 1 : 0.97 }}
                    transition={{ delay: 150 + index * 80 }}>
                    <Image source={service.image} style={styles.cardImage} />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.cardOverlay} />
                    <View style={styles.cardContent}>
                      <View>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardTitle} numberOfLines={2}>{service.title}</Text>
                          <Text style={styles.cardPrice}>{service.price}</Text>
                        </View>
                        <Text style={styles.cardSubtitle} numberOfLines={3}>{service.subtitle}</Text>
                      </View>
                      <TouchableOpacity style={[styles.bookServiceBtn, { backgroundColor: service.color }]}
                        onPress={() => {
                          if (isOwing) {
                            Alert.alert('Outstanding Balance', 'Please clear your outstanding balance before booking.');
                            return;
                          }
                          router.push(service.route as any);
                        }}>
                        <Text style={styles.bookServiceText}>Book Service</Text>
                        <MaterialIcons name="arrow-forward" size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </MotiView>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.indicators}>
            {liveServices.map((_, index) => (
              <View key={index} style={[styles.indicator, index === currentIndex && styles.indicatorActive]} />
            ))}
          </View>
        </View>

        {/* ── TESTIMONIALS — shows real reviews from API ── */}
        <View style={styles.testimonialsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Client Stories</Text>
              <Text style={styles.sectionSubtitle}>What our clients say about us</Text>
            </View>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => setReviewsModalVisible(true)}>
              <Text style={styles.viewAllText}>See More</Text>
              <Ionicons name="chevron-forward" size={15} color="#B04A75" />
            </TouchableOpacity>
          </View>
          <View style={styles.spacing} />
          {(liveReviews.length > 0 ? liveReviews : TESTIMONIALS).length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: '#B89FA1', fontSize: 14 }}>No reviews yet — be the first!</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.testimonialsScroll}>
              {(liveReviews.length > 0 ? liveReviews : TESTIMONIALS).slice(0, 5).map((t: any, index: number) => {
                const tid = t.id ?? index;
                const name = t.clientName ?? t.name ?? 'Client';
                const text = t.comment ?? t.text ?? '';
                const rating = t.rating ?? 5;
                const date = t.createdAt
                  ? new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : (t.date ?? '');
                const likeCount = t.likes ?? 0;
                const PREVIEW_LENGTH = 80;
                const isLong = text.length > PREVIEW_LENGTH;
                const isExpanded = expandedId === tid;
                const displayText = isExpanded || !isLong ? text : `${text.slice(0, PREVIEW_LENGTH)}…`;
                return (
                  <View key={tid} style={styles.testimonialCard}>
                    <View style={styles.testimonialHeader}>
                      <View style={styles.avatar}><Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text></View>
                      <View style={styles.testimonialInfo}>
                        <Text style={styles.testimonialName}>{name}</Text>
                        <Text style={styles.testimonialDate}>{date}</Text>
                      </View>
                      <View style={styles.rating}>{renderStars(rating)}</View>
                    </View>
                    <Text style={styles.testimonialText}>{displayText}</Text>
                    {isLong && (
                      <TouchableOpacity onPress={() => toggleExpanded(tid)} style={styles.readMoreBtn}>
                        <Text style={styles.readMoreText}>{isExpanded ? 'Show less' : 'Read more'}</Text>
                        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={13} color="#B04A75" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.likeRow}
                      onPress={async () => {
                        try {
                          await fetch(`${API_BASE_URL}/reviews/${tid}/like`, { method: 'PATCH' });
                          setLiveReviews(prev => prev.map(r => r.id === tid ? { ...r, likes: (r.likes ?? 0) + 1 } : r));
                        } catch {}
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="heart-outline" size={18} color="#B89FA1" />
                      <Text style={styles.likeCount}>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ── CTA ── */}
        <LinearGradient colors={['#D6BFC1', '#B89FA1', '#9D7A7D']} style={styles.ctaSection}>
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 300 }}>
            <Text style={styles.ctaTitle}>Ready for Your Transformation?</Text>
            <Text style={styles.ctaSubtitle}>Book your appointment today and experience the Bellissimo difference</Text>
            <View style={[styles.ctaButtons, IS_MOBILE && styles.ctaButtonsMobile]}>
              <TouchableOpacity style={styles.primaryCta} onPress={() => {
                if (isOwing) {
                  Alert.alert('Outstanding Balance', 'Please clear your outstanding balance before booking a new service.', [{ text: 'OK' }]);
                  return;
                }
                router.push('/services');
              }}>
                <Text style={styles.primaryCtaText}>Book Appointment</Text>
                <MaterialIcons name="calendar-today" size={20} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryCta} onPress={openWhatsApp}>
                <Text style={styles.secondaryCtaText}>Contact Us</Text>
                <MaterialIcons name="chat" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </MotiView>
        </LinearGradient>

        {/* Fix 5: Footer */}
        <View style={styles.footer}>
          <View style={styles.footerTop}>
            <Image source={require('../../assets/images/logo.png')} style={styles.footerLogo} />
            <Text style={styles.footerCopy}>© 2026 Bellissimo Inc.</Text>
          </View>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => router.push('/terms' as any)}><Text style={styles.footerLink}>Terms</Text></TouchableOpacity>
            <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.termsfeed.com/live/a0405335-52a1-404c-a92e-4a3a448dc3df')}><Text style={styles.footerLink}>Privacy Policy</Text></TouchableOpacity>
            <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity onPress={() => router.push('/profile' as any)}><Text style={styles.footerLink}>Security</Text></TouchableOpacity>
            {/* <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity><Text style={styles.footerLink}>Status</Text></TouchableOpacity> */}
            {/* <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity><Text style={styles.footerLink}>Community</Text></TouchableOpacity> */}
          </View>
          <View style={styles.footerLinks2}>
            {/* <TouchableOpacity><Text style={styles.footerLink}>Manage cookies</Text></TouchableOpacity> */}
            {/* <Text style={styles.footerDot}>·</Text> */}
            <TouchableOpacity><Text style={styles.footerLink}>Do not share my personal information</Text></TouchableOpacity>
          </View>
        </View>

        {/* Modals */}
        <GalleryModal visible={galleryModalVisible} folder={galleryFolder} onClose={() => setGalleryModalVisible(false)} />
        <ComingSoonModal visible={comingSoonVisible} onClose={() => setComingSoonVisible(false)} />

        {/* About Us Modal */}
        <Modal visible={aboutVisible} transparent animationType="fade" onRequestClose={() => setAboutVisible(false)}>
          <Pressable style={modal.overlay} onPress={() => setAboutVisible(false)}>
            <Pressable style={modal.card}>
              <View style={modal.comingSoonIcon}>
                <Text style={{ fontSize: 48 }}>💇‍♀️</Text>
              </View>
              <Text style={modal.comingSoonTitle}>About Bellissimo</Text>
              <Text style={[modal.comingSoonText, { textAlign: 'center', lineHeight: 22 }]}>
                Bellissimo Hair Studio is a premium hair salon dedicated to bringing out your best look. We specialise in wig installation, braiding, and complete hair care treatments — combining artistry with professionalism.{'\n\n'}
                Every client receives personalised attention in a warm, welcoming environment. Our stylists are trained to listen, advise, and deliver results that exceed expectations.{'\n\n'}
                📍 Visit us or book online — we can't wait to serve you.
              </Text>
              <TouchableOpacity style={[modal.comingSoonBtn, { marginBottom: 10 }]} onPress={openWhatsApp}>
                <Text style={modal.comingSoonBtnText}>Chat on WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAboutVisible(false)}>
                <Text style={{ color: '#B89FA1', fontSize: 14, textAlign: 'center' }}>Close</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
        <ReviewsModal visible={reviewsModalVisible} onClose={() => setReviewsModalVisible(false)} liveReviews={liveReviews} />
        <MobileMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      </ScrollView>
    </View>
  );
}

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0E6E8' },
  title: { fontSize: 22, fontWeight: '700', color: '#3B1C1A' },
  closeBtn: { padding: 8, backgroundColor: '#F5F5F5', borderRadius: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#3B1C1A', marginTop: 16 },
  grid: { padding: 16, gap: 8 },
  gridImage: { borderRadius: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  card: { width: '100%', maxWidth: 340, backgroundColor: '#FFF', borderRadius: 28, padding: 28, alignItems: 'center' },
  sheet: { backgroundColor: '#fff', borderRadius: 28, padding: 32, alignItems: 'center', width: '100%', maxWidth: 340 },
  comingSoonIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FFF0F6', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  comingSoonTitle: { fontSize: 24, fontWeight: '800', color: '#3B1C1A', marginBottom: 4, textAlign: 'center' },
  comingSoonSubtitle: { fontSize: 16, fontWeight: '600', color: '#B04A75', marginBottom: 16, textAlign: 'center' },
  comingSoonText: { fontSize: 14, color: '#7C6665', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  comingSoonBtn: { backgroundColor: '#B04A75', borderRadius: 25, paddingVertical: 14, paddingHorizontal: 40 },
  comingSoonBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  reviewCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F0E6E8' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  reviewAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D6BFC1', justifyContent: 'center', alignItems: 'center' },
  reviewAvatarText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  reviewName: { fontSize: 15, fontWeight: '700', color: '#3B1C1A' },
  reviewDate: { fontSize: 12, color: '#B89FA1', marginTop: 2 },
  reviewText: { fontSize: 14, color: '#5B3034', lineHeight: 22, fontStyle: 'italic', marginBottom: 10 },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeCount: { fontSize: 13, color: '#B89FA1', fontWeight: '500' },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF5F6' },
  heroContainer: { height: SCREEN_HEIGHT * 0.65, position: 'relative' },
  heroBackground: { position: 'absolute', width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(91,48,52,0.5)' },
  topBar: { position: 'absolute', top: 44, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 },
  hamburgerButton: { padding: 10 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 'auto' },
  // Search circle → expanded
  searchContainer: { height: 44, justifyContent: 'center', overflow: 'hidden' },
  searchCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  searchExpanded: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 22, paddingHorizontal: 12, height: 44, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  searchInput: { flex: 1, fontSize: 13, color: '#FFF', paddingVertical: 0 },
  // Search dropdown
  searchDropdown: { position: 'absolute', top: 100, right: 16, width: 260, backgroundColor: '#fff', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 20, zIndex: 50, overflow: 'hidden' },
  searchResult: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  searchResultBorder: { borderBottomWidth: 1, borderBottomColor: '#F0E6E8' },
  searchResultName: { fontSize: 13, fontWeight: '600', color: '#3B1C1A' },
  searchResultCat: { fontSize: 11, color: '#B89FA1', marginTop: 1 },
  // Logo — bigger
  logo: { width: 80, height: 80, resizeMode: 'contain' },
  navBar: { position: 'absolute', top: 180, left: 20, right: 20, borderRadius: 25, padding: 15, zIndex: 20, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)' },
  navLinks: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  navLink: { paddingHorizontal: 15, paddingVertical: 8 },
  navLinkText: { color: '#FFF', fontSize: 15, fontWeight: '500', letterSpacing: 0.5 },
  heroContent: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 20 },
  heroTitle: { fontSize: 36, fontWeight: '300', color: '#FFF', textAlign: 'center', letterSpacing: 1, marginBottom: 12, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  heroSubtitle: { fontSize: 18, color: '#F8E6EB', textAlign: 'center', marginBottom: 16, fontWeight: '400', lineHeight: 26 },
  heroSubtitleMobile: { fontSize: 16, color: '#F8E6EB', textAlign: 'center', marginBottom: 20, fontWeight: '400', lineHeight: 22 },
  heroDescription: { fontSize: 15, color: '#E8D1D6', textAlign: 'center', lineHeight: 22, marginBottom: 30, maxWidth: 500 },
  heroStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 20, gap: 30 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#F8E6EB', opacity: 0.9 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  featuresSection: { paddingHorizontal: 24, paddingVertical: 50, backgroundColor: '#FFF' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 28, fontWeight: '300', color: '#3B1C1A', marginBottom: 8 },
  sectionSubtitle: { fontSize: 16, color: '#7C6665', fontWeight: '400' },
  spacing: { height: 30, marginBottom: 20 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginHorizontal: -10 },
  featureColumn: { width: '50%', paddingHorizontal: 10, paddingVertical: 10 },
  featureCard: { backgroundColor: '#FAF5F6', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#F0E6E8', height: 180, justifyContent: 'center' },
  featureIconContainer: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  featureLabel: { fontSize: 16, fontWeight: '600', color: '#3B1C1A', textAlign: 'center', marginBottom: 6 },
  featureHint: { fontSize: 12, color: '#B04A75', textAlign: 'center', fontWeight: '500' },
  servicesSection: { paddingVertical: 50, backgroundColor: '#FAF5F6', paddingHorizontal: 24 },
  carouselContent: { paddingBottom: 40 },
  serviceCard: { width: CARD_WIDTH, minHeight: 420, backgroundColor: '#FFF', borderRadius: 24, marginRight: CARD_SPACING, overflow: 'hidden', borderWidth: 2, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
  cardImage: { width: '100%', height: 160 },
  cardOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },
  cardContent: { padding: 20, flex: 1, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: '#3B1C1A', flex: 1 },
  cardPrice: { fontSize: 16, fontWeight: '700', color: '#B04A75', marginLeft: 10 },
  cardSubtitle: { fontSize: 14, color: '#7C6665', marginBottom: 12, fontWeight: '500' },
  cardDescription: { fontSize: 13, color: '#8F6F73', lineHeight: 20, marginBottom: 20 },
  bookServiceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  bookServiceText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  indicators: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 20 },
  indicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E8D1D6' },
  indicatorActive: { width: 24, backgroundColor: '#B04A75' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText: { color: '#B04A75', fontWeight: '600', fontSize: 14 },
  testimonialsSection: { paddingHorizontal: 24, paddingVertical: 50, backgroundColor: '#FFF' },
  testimonialsScroll: { marginHorizontal: -24, paddingHorizontal: 24 },
  testimonialCard: { width: SCREEN_WIDTH * 0.8, backgroundColor: '#FAF5F6', borderRadius: 20, padding: 24, marginRight: 16, borderWidth: 1, borderColor: '#F0E6E8' },
  testimonialHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#D6BFC1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: '600', color: '#FFF' },
  testimonialInfo: { flex: 1 },
  testimonialName: { fontSize: 16, fontWeight: '600', color: '#3B1C1A', marginBottom: 2 },
  testimonialDate: { fontSize: 12, color: '#8F6F73' },
  rating: { flexDirection: 'row' },
  testimonialText: { fontSize: 15, color: '#5B3034', lineHeight: 22, fontStyle: 'italic', marginBottom: 8 },
  readMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 12 },
  readMoreText: { fontSize: 13, color: '#B04A75', fontWeight: '600' },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  likeCount: { fontSize: 13, color: '#B89FA1', fontWeight: '500' },
  likeCountActive: { color: '#E53E3E' },
  ctaSection: { paddingHorizontal: 24, paddingVertical: 60, alignItems: 'center' },
  ctaTitle: { fontSize: 32, fontWeight: '300', color: '#3B1C1A', textAlign: 'center', marginBottom: 16 },
  ctaSubtitle: { fontSize: 18, color: '#5B3034', textAlign: 'center', marginBottom: 40, lineHeight: 26, maxWidth: 500 },
  ctaButtons: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
  ctaButtonsMobile: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  primaryCta: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#B04A75', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 25, gap: 10, justifyContent: 'center' },
  primaryCtaText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  secondaryCta: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59,28,26,0.1)', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(59,28,26,0.2)', gap: 10, justifyContent: 'center' },
  secondaryCtaText: { color: '#3B1C1A', fontWeight: '600', fontSize: 16 },
  // Footer — consistent brown
  footer: { backgroundColor: '#9D7A7D', paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center' },
  footerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  footerLogo: { width: 40, height: 40, resizeMode: 'contain', tintColor: '#FFF8F9' },
  footerCopy: { fontSize: 13, color: '#FFF8F9', fontWeight: '500' },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 8 },
  footerLinks2: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  footerLink: { fontSize: 12, color: '#F0E6E8', textDecorationLine: 'underline' },
  footerDot: { fontSize: 12, color: '#D6BFC1' },
});