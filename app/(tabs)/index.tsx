import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { MotiView, MotiImage } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts } from 'expo-font';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 220;
const CARD_SPACING = 16;
const CARD_FULL_WIDTH = CARD_WIDTH + CARD_SPACING;

const SERVICES = [
  {
    key: 'installation',
    title: 'Wig Installation',
    subtitle: 'Frontals, closures, ponytails',
    image: require('../../assets/images/installation.jpg'),
    route: '/services/installation',
  },
  {
    key: 'braids',
    title: 'Braids',
    subtitle: 'Knotless, boho, cornrows',
    image: require('../../assets/images/braids.jpg'),
    route: '/services/braids',
  },
  {
    key: 'wash',
    title: 'Wash & Care',
    subtitle: 'Wash, condition, treat',
    image: require('../../assets/images/washingHair.jpg'),
    route: '/services/wash',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    MomoSignature: require('../../assets/fonts/MomoSignature-Regular.ttf'),
  });

  const scrollRef = useRef<ScrollView | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide carousel
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % SERVICES.length;
      setCurrentIndex(nextIndex);

      scrollRef.current?.scrollTo({
        x: nextIndex * CARD_FULL_WIDTH,
        animated: true,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / CARD_FULL_WIDTH);
    if (index !== currentIndex) setCurrentIndex(index);
  };

  if (!fontsLoaded) {
    // You can swap this for a loader if you like
    return null;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HERO SECTION */}
      <View style={styles.heroWrapper}>
        {/* Background image */}
        <MotiImage
          source={require('../../assets/images/hero-wig.jpg')}
          style={styles.heroBackground}
          from={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 800 }}
        />

        {/* Rose nude overlay */}
        <View style={styles.heroShade} />

        {/* HEADER BAR */}
        <View style={styles.headerRow}>
          {/* Logo alone on the left */}
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
          />

          {/* Center menu */}
          <View style={styles.headerMenu}>
            <TouchableOpacity onPress={() => router.push('/about')}>
              <Text style={styles.headerMenuText}>About Us</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/faqs')}
              style={{ marginLeft: 18 }}
            >
              <Text style={styles.headerMenuText}>FAQs</Text>
            </TouchableOpacity>
          </View>

          {/* Right icons */}
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="search" size={18} color="#FFEFF3" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconButton, { marginLeft: 10 }]}>
              <Ionicons name="notifications-outline" size={22} color="#FFEFF3" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tagline at bottom of hero */}
        <View style={styles.heroTaglineWrapper}>
          <Text style={styles.heroTagline}>
            Effortless wigs, braids & care.
          </Text>
        </View>
      </View>

      {/* SECTION TITLE */}
      <Text style={styles.sectionTitle}>Our Services</Text>

      {/* AUTO-SLIDING SERVICE CAROUSEL */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_FULL_WIDTH}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.carouselContent}
      >
        {SERVICES.map((service, index) => {
          const isActive = index === currentIndex;

          return (
            <TouchableOpacity
              key={service.key}
              onPress={() => router.push(service.route)}
              activeOpacity={0.9}
            >
              <MotiView
                style={[
                  styles.serviceCard,
                  {
                    transform: [{ scale: isActive ? 1 : 0.95 }],
                    opacity: isActive ? 1 : 0.7,
                  },
                ]}
                from={{ opacity: 0, scale: 0.9, translateY: 20 }}
                animate={{ opacity: 1, scale: isActive ? 1 : 0.95, translateY: 0 }}
                transition={{ delay: 150 + index * 80 }}
              >
                <Image source={service.image} style={styles.cardImage} />
                <Text style={styles.cardTitle}>{service.title}</Text>
                <Text style={styles.cardSubtitle}>{service.subtitle}</Text>
              </MotiView>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Rose nude background
  container: {
    flex: 1,
    backgroundColor: '#F9ECEE', // soft rose nude
  },

  /* HERO SECTION */
  heroWrapper: {
    height: 360,
    width: '100%',
    position: 'relative',
  },

  heroBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  heroShade: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(54, 15, 21, 0.45)', // deep wine tint over image
  },

  headerRow: {
    paddingTop: 40,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logo: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
  },

  headerMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    justifyContent: 'center',
  },

  headerMenuText: {
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#FFEFF3',
    fontWeight: '600',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,239,243,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,239,243,0.12)',
  },

  heroTaglineWrapper: {
    position: 'absolute',
    bottom: 22,
    width: '100%',
    alignItems: 'center',
  },

  heroTagline: {
    fontFamily: 'MomoSignature',
    fontSize: 24,
    color: '#FFEFF3',
    fontStyle: 'italic',
  },

  /* SECTION TITLE */
  sectionTitle: {
    alignSelf: 'center',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 18,
    color: '#5B3034', // muted wine
  },

  /* CAROUSEL */
  carouselContent: {
    paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
    paddingBottom: 28,
  },

  serviceCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: CARD_SPACING,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  cardImage: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },

  cardTitle: {
    paddingHorizontal: 12,
    paddingTop: 10,
    fontWeight: '700',
    fontSize: 16,
    color: '#3E2326',
  },

  cardSubtitle: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 2,
    fontSize: 13,
    color: '#8F6F73',
  },
});
