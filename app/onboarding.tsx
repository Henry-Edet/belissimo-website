// app/onboarding.tsx
// Shown once on first launch — 4 slides + terms agreement gate
// Stored in AsyncStorage so it never shows again after completion

import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, Image, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W, height: H } = Dimensions.get('window');

export const ONBOARDING_KEY = 'bellissimo_onboarded';

const SLIDES = [
  {
    key: 'welcome',
    emoji: '✨',
    title: 'Welcome to\nBellissimo',
    subtitle: 'Hair Studio',
    body: 'Premium hair services designed to bring out your most beautiful self — every single visit.',
    gradient: ['#3B1C1A', '#7C5E60'] as const,
    accent: '#D6BFC1',
  },
  {
    key: 'services',
    emoji: '💇‍♀️',
    title: 'Expert\nStyling',
    subtitle: 'Wig Installation · Braids · Care',
    body: 'From flawless frontal installs to stunning knotless braids — our stylists are trained to perfection.',
    gradient: ['#2D1B1A', '#9D7A7D'] as const,
    accent: '#F0E6E8',
  },
  {
    key: 'bella',
    emoji: '🤖',
    title: 'Meet\nBella',
    subtitle: 'Your AI Receptionist',
    body: 'Book appointments, check prices, and get answers 24/7 — Bella is always here for you.',
    gradient: ['#1A2A3A', '#4A6FA5'] as const,
    accent: '#B8D4F0',
  },
  {
    key: 'terms',
    emoji: '🌸',
    title: 'One Last\nThing',
    subtitle: 'Terms & Privacy',
    body: 'Before you get started, please read and agree to our Terms of Service and Privacy Policy.',
    gradient: ['#1A2A1A', '#38A169'] as const,
    accent: '#9AE6B4',
    isTerms: true,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const isLast = currentIndex === SLIDES.length - 1;
  const slide = SLIDES[currentIndex];

  const goNext = () => {
    if (!isLast) {
      const next = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: next * W, animated: true });
      setCurrentIndex(next);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      const prev = currentIndex - 1;
      scrollRef.current?.scrollTo({ x: prev * W, animated: true });
      setCurrentIndex(prev);
    }
  };

  const handleGetStarted = async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/(tabs)');
    } catch {
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((sl, idx) => (
          <LinearGradient key={sl.key} colors={sl.gradient} style={s.slide}>
            {/* Logo top */}
            <View style={s.logoRow}>
              <Image
                source={require('../assets/images/logo.png')}
                style={s.logo}
                resizeMode="contain"
              />
              <Text style={s.logoText}>Bellissimo</Text>
            </View>

            {/* Emoji */}
            <MotiView
              key={`${sl.key}-emoji`}
              from={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: 100 }}
              style={s.emojiWrap}
            >
              <Text style={s.emoji}>{sl.emoji}</Text>
            </MotiView>

            {/* Text */}
            <MotiView
              key={`${sl.key}-text`}
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200, duration: 500 }}
              style={s.textWrap}
            >
              <Text style={s.title}>{sl.title}</Text>
              <Text style={[s.subtitle, { color: sl.accent }]}>{sl.subtitle}</Text>
              <Text style={s.body}>{sl.body}</Text>
            </MotiView>

            {/* Terms checkbox — only on last slide */}
            {sl.isTerms && (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 400 }}
                style={s.termsBox}
              >
                <TouchableOpacity style={s.checkRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.8}>
                  <View style={[s.checkbox, agreed && s.checkboxActive]}>
                    {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={s.checkLabel}>
                    I agree to the{' '}
                    <Text style={s.checkLink} onPress={() => router.push('/terms' as any)}>
                      Terms of Service
                    </Text>
                    {' '}and{' '}
                    <Text style={s.checkLink}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>

                {!agreed && (
                  <Text style={s.agreeHint}>Please agree to continue</Text>
                )}
              </MotiView>
            )}
          </LinearGradient>
        ))}
      </ScrollView>

      {/* Bottom controls — outside ScrollView so always visible */}
      <View style={s.controls}>
        {/* Dots */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[s.dot, i === currentIndex && s.dotActive]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={s.btnRow}>
          {/* Back */}
          {currentIndex > 0 ? (
            <TouchableOpacity style={s.backBtn} onPress={goPrev}>
              <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          ) : (
            <View style={s.backBtn} />
          )}

          {/* Next / Get Started */}
          {isLast ? (
            <TouchableOpacity
              style={[s.nextBtn, !agreed && s.nextBtnDisabled]}
              onPress={handleGetStarted}
              disabled={!agreed || loading}
              activeOpacity={0.85}
            >
              <Text style={s.nextBtnText}>
                {loading ? 'Loading...' : 'Get Started 🌸'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.nextBtn} onPress={goNext} activeOpacity={0.85}>
              <Text style={s.nextBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}
        </View>

        {/* Skip — hidden on last slide */}
        {!isLast && (
          <TouchableOpacity
            style={s.skipBtn}
            onPress={() => {
              const last = SLIDES.length - 1;
              scrollRef.current?.scrollTo({ x: last * W, animated: true });
              setCurrentIndex(last);
            }}
          >
            <Text style={s.skipText}>Skip to Terms →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#3B1C1A' },
  slide: { width: W, flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 32, paddingBottom: 20 },

  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  logo: { width: 36, height: 36, borderRadius: 18 },
  logoText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '300', letterSpacing: 2 },

  emojiWrap: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 40, alignSelf: 'center' },
  emoji: { fontSize: 56 },

  textWrap: { flex: 1 },
  title: { fontSize: 42, fontWeight: '300', color: '#fff', lineHeight: 48, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 },
  body: { fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 26 },

  termsBox: { marginTop: 24, marginBottom: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  checkboxActive: { backgroundColor: '#38A169', borderColor: '#38A169' },
  checkLabel: { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 22 },
  checkLink: { color: '#9AE6B4', textDecorationLine: 'underline', fontWeight: '600' },
  agreeHint: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8, marginLeft: 34 },

  controls: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 32, paddingTop: 20, paddingBottom: Platform.OS === 'ios' ? 44 : 28 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 24, backgroundColor: '#fff' },

  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#9D7A7D', borderRadius: 28, paddingVertical: 14, paddingHorizontal: 28 },
  nextBtnDisabled: { opacity: 0.35 },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  skipBtn: { alignSelf: 'center', marginTop: 16 },
  skipText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
});