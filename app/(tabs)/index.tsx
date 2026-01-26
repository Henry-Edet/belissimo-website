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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { IconProps } from '@expo/vector-icons/build/createIconSet';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Simple check for mobile vs tablet
const IS_TABLET = SCREEN_WIDTH >= 768;
const IS_MOBILE = SCREEN_WIDTH < 768;

const CARD_WIDTH = 260;
const CARD_SPACING = 20;
const CARD_FULL_WIDTH = CARD_WIDTH + CARD_SPACING;

const SERVICES = [
  {
    id: 'installation',
    title: 'Wig Installation',
    subtitle: 'Frontals, closures, ponytails',
    description: 'Professional wig installation with natural-looking results',
    price: 'From ₦35,000',
    image: require('../../assets/images/installation.jpg'),
    route: '/services/installation',
    color: '#B89FA1',
  },
  {
    id: 'braids',
    title: 'Braids & Cornrows',
    subtitle: 'Knotless, boho, cornrows',
    description: 'Trendy braiding styles with premium extensions',
    price: 'From ₦40,000',
    image: require('../../assets/images/braids.jpg'),
    route: '/services/braids',
    color: '#C9A8A5',
  },
  {
    id: 'wash',
    title: 'Wash & Care',
    subtitle: 'Wash, condition, treat',
    description: 'Complete hair care treatment and styling',
    price: 'From ₦15,000',
    image: require('../../assets/images/washingHair.jpg'),
    route: '/services/wash',
    color: '#D6BFC1',
  },
];

const FEATURES: {icon: keyof typeof MaterialIcons.glyphMap, label: string, color: string}[] = [
  { icon: 'emoji-events', label: 'Premium Quality', color: '#C9A8A5' },
  { icon: 'schedule', label: 'Quick Service', color: '#B89FA1' },
  { icon: 'people', label: 'Expert Stylists', color: '#9D7A7D' },
  { icon: 'health-and-safety', label: 'Hygiene First', color: '#7C5E60' },
];

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Chiamaka',
    text: 'Best wig installation I\'ve ever had! The quality is exceptional.',
    rating: 5,
    date: '2 days ago',
  },
  {
    id: 2,
    name: 'Tolu',
    text: 'Professional and timely service. My braids look amazing!',
    rating: 5,
    date: '1 week ago',
  },
  {
    id: 3,
    name: 'Zainab',
    text: 'The wash and care treatment revived my hair. Highly recommend!',
    rating: 4,
    date: '2 weeks ago',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Ionicons
        key={i}
        name={i < rating ? 'star' : 'star-outline'}
        size={14}
        color="#FFD700"
        style={{ marginRight: 2 }}
      />
    ));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HERO SECTION */}
      <View style={styles.heroContainer}>
        {/* Background Image */}
        <Image
          source={require('../../assets/images/hero-wig.jpg')}
          style={styles.heroBackground}
          resizeMode="cover"
        />
        
        {/* Dark overlay */}
        <View style={styles.heroOverlay} />
        
        {/* TOP BAR WITH LOGO AND NAVIGATION */}
        <View style={styles.topBar}>
          {/* Hamburger Menu for mobile only */}
          {IS_MOBILE && (
            <TouchableOpacity
              style={styles.hamburgerButton}
              onPress={() => setMenuOpen(!menuOpen)}
            >
              <Ionicons name="menu" size={28} color="#FFF" />
            </TouchableOpacity>
          )}

          {/* Logo - Always on right */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logo}
            />
          </View>

          {/* Search Icon - All screens, small size */}
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* NAVIGATION BAR - Tablet only (visible) */}
        {IS_TABLET && (
          <BlurView intensity={30} tint="dark" style={styles.navBar}>
            <View style={styles.navLinks}>
              <TouchableOpacity
                onPress={() => router.push('/about')}
                style={styles.navLink}
              >
                <Text style={styles.navLinkText}>About</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/services')}
                style={styles.navLink}
              >
                <Text style={styles.navLinkText}>Services</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/bookings')}
                style={styles.navLink}
              >
                <Text style={styles.navLinkText}>Bookings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/contact')}
                style={styles.navLink}
              >
                <Text style={styles.navLinkText}>Contact</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        )}

        {/* Mobile Menu Dropdown with animation */}
        {IS_MOBILE && menuOpen && (
          <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: -20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            style={styles.mobileMenu}
          >
            <TouchableOpacity
              onPress={() => {
                router.push('/about');
                setMenuOpen(false);
              }}
              style={styles.mobileMenuItem}
            >
              <Text style={styles.mobileMenuText}>About</Text>
              <Ionicons name="chevron-forward" size={18} color="#7C6665" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                router.push('/services');
                setMenuOpen(false);
              }}
              style={styles.mobileMenuItem}
            >
              <Text style={styles.mobileMenuText}>Services</Text>
              <Ionicons name="chevron-forward" size={18} color="#7C6665" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                router.push('/bookings');
                setMenuOpen(false);
              }}
              style={styles.mobileMenuItem}
            >
              <Text style={styles.mobileMenuText}>Bookings</Text>
              <Ionicons name="chevron-forward" size={18} color="#7C6665" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                router.push('/contact');
                setMenuOpen(false);
              }}
              style={styles.mobileMenuItem}
            >
              <Text style={styles.mobileMenuText}>Contact</Text>
              <Ionicons name="chevron-forward" size={18} color="#7C6665" />
            </TouchableOpacity>
          </MotiView>
        )}

        {/* HERO CONTENT - Full text on tablet, minimal on mobile */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 800 }}
          style={styles.heroContent}
        >
          <Text style={styles.heroTitle}>Bellissimo Hair Studio</Text>
          
          {/* Show full text only on tablets */}
          {IS_TABLET ? (
            <>
              <Text style={styles.heroSubtitle}>
                Where elegance meets exceptional hair artistry
              </Text>
              <Text style={styles.heroDescription}>
                Premium wig installation, braiding, and hair care services 
                tailored to enhance your natural beauty
              </Text>
            </>
          ) : (
            /* Minimal tagline for mobile */
            <Text style={styles.heroSubtitleMobile}>
              Premium Hair Services
            </Text>
          )}
          
          <View style={styles.heroStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Happy Clients</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>98%</Text>
              <Text style={styles.statLabel}>Satisfaction</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5★</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </MotiView>
      </View>

      {/* FEATURES SECTION */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Why Choose Bellissimo</Text>
        <Text style={styles.sectionSubtitle}>
          Excellence in every strand, perfection in every style
        </Text>
        
        <View style={styles.spacing} />
        
        {/* Features Grid - Original arrangement */}
        <View style={styles.featuresGrid}>
          {FEATURES.map((feature, index) => (
            <View key={feature.label} style={styles.featureColumn}>
              <View style={styles.featureCard}>
                <View
                  style={[
                    styles.featureIconContainer,
                    { backgroundColor: feature.color },
                  ]}
                >
                  <MaterialIcons name={feature.icon} size={28} color="#FFF" />
                </View>
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* SERVICES CAROUSEL - Original sizing */}
      <View style={styles.servicesSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Our Signature Services</Text>
            <Text style={styles.sectionSubtitle}>Curated excellence for every hair need</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => router.push('/services')}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#B04A75" />
          </TouchableOpacity>
        </View>

        <View style={styles.spacing} />

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
                key={service.id}
                onPress={() => router.push(service.route)}
                activeOpacity={0.9}
              >
                <MotiView
                  style={[
                    styles.serviceCard,
                    {
                      borderColor: isActive ? service.color : '#F0E6E8',
                      transform: [{ scale: isActive ? 1 : 0.97 }],
                    },
                  ]}
                  from={{ opacity: 0, scale: 0.9, translateY: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isActive ? 1 : 0.97, 
                    translateY: 0 
                  }}
                  transition={{ delay: 150 + index * 80 }}
                >
                  <Image source={service.image} style={styles.cardImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.cardOverlay}
                  />
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{service.title}</Text>
                      <Text style={styles.cardPrice}>{service.price}</Text>
                    </View>
                    <Text style={styles.cardSubtitle}>{service.subtitle}</Text>
                    <Text style={styles.cardDescription}>
                      {service.description}
                    </Text>
                    <TouchableOpacity
                      style={[styles.bookServiceBtn, { backgroundColor: service.color }]}
                      onPress={() => router.push(service.route)}
                    >
                      <Text style={styles.bookServiceText}>Book Service</Text>
                      <MaterialIcons name="arrow-forward" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </MotiView>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* CAROUSEL INDICATORS */}
        <View style={styles.indicators}>
          {SERVICES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* TESTIMONIALS SECTION */}
      <View style={styles.testimonialsSection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Client Stories</Text>
            <Text style={styles.sectionSubtitle}>What our clients say about us</Text>
          </View>
          <TouchableOpacity style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>See More</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacing} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.testimonialsScroll}>
          {TESTIMONIALS.map((testimonial) => (
            <View key={testimonial.id} style={styles.testimonialCard}>
              <View style={styles.testimonialHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {testimonial.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.testimonialInfo}>
                  <Text style={styles.testimonialName}>{testimonial.name}</Text>
                  <Text style={styles.testimonialDate}>{testimonial.date}</Text>
                </View>
                <View style={styles.rating}>{renderStars(testimonial.rating)}</View>
              </View>
              <Text style={styles.testimonialText}>{testimonial.text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* CTA SECTION - Original button arrangement */}
      <LinearGradient
        colors={['#D6BFC1', '#B89FA1', '#9D7A7D']}
        style={styles.ctaSection}
      >
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 300 }}
        >
          <Text style={styles.ctaTitle}>Ready for Your Transformation?</Text>
          <Text style={styles.ctaSubtitle}>
            Book your appointment today and experience the Bellissimo difference
          </Text>
          <View style={styles.ctaButtons}>
            <TouchableOpacity
              style={styles.primaryCta}
              onPress={() => router.push('/services')}
            >
              <Text style={styles.primaryCtaText}>Book Appointment</Text>
              <MaterialIcons name="calendar-today" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryCta}
              onPress={() => router.push('/contact')}
            >
              <Text style={styles.secondaryCtaText}>Contact Us</Text>
              <MaterialIcons name="chat" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </MotiView>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5F6',
  },
  // HERO SECTION
  heroContainer: {
    height: SCREEN_HEIGHT * 0.65,
    position: 'relative',
  },
  heroBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(91, 48, 52, 0.5)',
  },
  // TOP BAR
  topBar: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 30,
  },
  hamburgerButton: {
    padding: 10,
  },
  searchButton: {
    position: 'absolute',
    right: 120,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
  },
  logoContainer: {
    marginLeft: 'auto',
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  // NAVIGATION - Tablet only
  navBar: {
    position: 'absolute',
    top: 180,
    left: 20,
    right: 20,
    borderRadius: 25,
    padding: 15,
    zIndex: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  navLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navLink: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  navLinkText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  // MOBILE MENU with animation
  mobileMenu: {
    position: 'absolute',
    top: 80,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    padding: 15,
    zIndex: 40,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  mobileMenuItem: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobileMenuText: {
    color: '#3B1C1A',
    fontSize: 16,
    fontWeight: '500',
  },
  // HERO CONTENT
  heroContent: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '300',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#F8E6EB',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '400',
    lineHeight: 26,
  },
  heroSubtitleMobile: {
    fontSize: 16,
    color: '#F8E6EB',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '400',
    lineHeight: 22,
  },
  heroDescription: {
    fontSize: 15,
    color: '#E8D1D6',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    maxWidth: 500,
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    gap: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#F8E6EB',
    opacity: 0.9,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  // FEATURES SECTION
  featuresSection: {
    paddingHorizontal: 24,
    paddingVertical: 50,
    backgroundColor: '#FFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#3B1C1A',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#7C6665',
    fontWeight: '400',
  },
  spacing: {
    height: 30,
    marginBottom: 20,
  },
  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -10,
  },
  featureColumn: {
    width: '50%',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  featureCard: {
    backgroundColor: '#FAF5F6',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E6E8',
    height: 180,
    justifyContent: 'center',
  },
  featureIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B1C1A',
    textAlign: 'center',
  },
  // SERVICES SECTION - Original sizing
  servicesSection: {
    paddingVertical: 50,
    backgroundColor: '#FAF5F6',
    paddingHorizontal: 24,
  },
  carouselContent: {
    paddingBottom: 40,
  },
  serviceCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginRight: CARD_SPACING,
    overflow: 'hidden',
    borderWidth: 2,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3B1C1A',
    flex: 1,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B04A75',
    marginLeft: 10,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#7C6665',
    marginBottom: 12,
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 13,
    color: '#8F6F73',
    lineHeight: 20,
    marginBottom: 20,
  },
  bookServiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  bookServiceText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8D1D6',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#B04A75',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewAllText: {
    color: '#B04A75',
    fontWeight: '600',
    fontSize: 15,
  },
  // TESTIMONIALS SECTION
  testimonialsSection: {
    paddingHorizontal: 24,
    paddingVertical: 50,
    backgroundColor: '#FFF',
  },
  testimonialsScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  testimonialCard: {
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: '#FAF5F6',
    borderRadius: 20,
    padding: 24,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#F0E6E8',
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D6BFC1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
  },
  testimonialInfo: {
    flex: 1,
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B1C1A',
    marginBottom: 2,
  },
  testimonialDate: {
    fontSize: 12,
    color: '#8F6F73',
  },
  rating: {
    flexDirection: 'row',
  },
  testimonialText: {
    fontSize: 15,
    color: '#5B3034',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  // CTA SECTION - Original arrangement
  ctaSection: {
    paddingHorizontal: 24,
    paddingVertical: 60,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: '#3B1C1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaSubtitle: {
    fontSize: 18,
    color: '#5B3034',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
    maxWidth: 500,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B04A75',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    gap: 10,
    minWidth: 200,
    justifyContent: 'center',
  },
  primaryCtaText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 28, 26, 0.1)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(59, 28, 26, 0.2)',
    gap: 10,
    minWidth: 200,
    justifyContent: 'center',
  },
  secondaryCtaText: {
    color: '#3B1C1A',
    fontWeight: '600',
    fontSize: 16,
  },
});