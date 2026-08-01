// app/auth.tsx

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, Image,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { login, register, isLoading } = useAuth();
  const { colors } = useTheme();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleBack = () => {
    if (navigation.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      Alert.alert('Required', 'Please enter your email address'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address'); return;
    }
    if (!trimmedPassword) {
      Alert.alert('Required', 'Please enter your password'); return;
    }
    if (trimmedPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters'); return;
    }
    if (mode === 'register') {
      if (!confirmPassword.trim()) {
        Alert.alert('Required', 'Please confirm your password'); return;
      }
      if (trimmedPassword !== confirmPassword.trim()) {
        Alert.alert('Mismatch', 'Passwords do not match'); return;
      }
    }
    try {
      if (mode === 'login') await login(trimmedEmail, trimmedPassword);
      else await register(trimmedEmail, trimmedPassword);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert(
        mode === 'login' ? 'Login Failed' : 'Registration Failed',
        err.message || 'Something went wrong. Please try again.'
      );
    }
  };

  const BROWN = colors.primary;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={[s.scroll, { backgroundColor: colors.bg }]}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={[BROWN, '#7C5E60', '#5B3034']} style={s.hero}>
          <TouchableOpacity style={s.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.85)" />
            <Text style={s.backBtnText}>Back</Text>
          </TouchableOpacity>
          <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 600 }} style={s.logoWrapper}>
            <Image source={require('../assets/images/logo.png')} style={s.logo} />
          </MotiView>
          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 200, duration: 500 }}>
            <Text style={s.heroTitle}>Bellissimo</Text>
            <Text style={s.heroSubtitle}>Hair Studio</Text>
          </MotiView>
        </LinearGradient>

        {/* Card */}
        <MotiView from={{ opacity: 0, translateY: 40 }} animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 300, duration: 500 }} style={[s.card, { backgroundColor: colors.card }]}>

          {/* Mode toggle */}
          <View style={[s.modeToggle, { backgroundColor: colors.bg }]}>
            <TouchableOpacity style={[s.modeBtn, mode === 'login' && { backgroundColor: BROWN }]} onPress={() => setMode('login')}>
              <Text style={[s.modeBtnText, { color: mode === 'login' ? '#fff' : colors.subText }]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.modeBtn, mode === 'register' && { backgroundColor: BROWN }]} onPress={() => setMode('register')}>
              <Text style={[s.modeBtnText, { color: mode === 'register' ? '#fff' : colors.subText }]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <Text style={[s.formTitle, { color: colors.text }]}>
            {mode === 'login' ? 'Welcome back 👋' : 'Join Bellissimo ✨'}
          </Text>
          <Text style={[s.formSub, { color: colors.subText }]}>
            {mode === 'login' ? 'Sign in to manage your appointments' : 'Create an account to start booking'}
          </Text>

          {/* Email */}
          <View style={s.fieldGroup}>
            <Text style={[s.fieldLabel, { color: colors.text }]}>Email address</Text>
            <View style={[s.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={18} color={colors.subText} style={s.inputIcon} />
              <TextInput style={[s.input, { color: colors.text }]} placeholder="your@email.com"
                placeholderTextColor={colors.subText} value={email} onChangeText={setEmail}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            </View>
          </View>

          {/* Password */}
          <View style={s.fieldGroup}>
            <Text style={[s.fieldLabel, { color: colors.text }]}>Password</Text>
            <View style={[s.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.subText} style={s.inputIcon} />
              <TextInput style={[s.input, s.inputFlex, { color: colors.text }]} placeholder="Min. 6 characters"
                placeholderTextColor={colors.subText} value={password} onChangeText={setPassword}
                secureTextEntry={!showPassword} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.subText} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm password */}
          {mode === 'register' && (
            <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ duration: 300 }}>
              <View style={s.fieldGroup}>
                <Text style={[s.fieldLabel, { color: colors.text }]}>Confirm password</Text>
                <View style={[s.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.subText} style={s.inputIcon} />
                  <TextInput style={[s.input, s.inputFlex, { color: colors.text }]} placeholder="Repeat password"
                    placeholderTextColor={colors.subText} value={confirmPassword} onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm} autoCapitalize="none" />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={s.eyeBtn}>
                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.subText} />
                  </TouchableOpacity>
                </View>
              </View>
            </MotiView>
          )}

          {/* Submit */}
          <TouchableOpacity style={[s.submitBtn, { backgroundColor: BROWN }, isLoading && s.submitDisabled]}
            onPress={handleSubmit} disabled={isLoading} activeOpacity={0.85}>
            {isLoading ? <ActivityIndicator color="#fff" /> : (
              <Text style={s.submitBtnText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1 },
  hero: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 50, alignItems: 'center', gap: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 8, gap: 6 },
  backBtnText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  logoWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  logo: { width: 80, height: 80, resizeMode: 'contain' },
  heroTitle: { fontSize: 36, fontWeight: '300', color: '#fff', textAlign: 'center', letterSpacing: 2 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', letterSpacing: 3, textTransform: 'uppercase' },
  card: { borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -24, padding: 28, paddingBottom: 48, flex: 1 },
  modeToggle: { flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 28 },
  modeBtn: { flex: 1, paddingVertical: 12, borderRadius: 13, alignItems: 'center' },
  modeBtnText: { fontSize: 15, fontWeight: '600' },
  formTitle: { fontSize: 24, fontWeight: '700', marginBottom: 6 },
  formSub: { fontSize: 14, marginBottom: 24, lineHeight: 20 },
  fieldGroup: { marginBottom: 18 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, height: 52 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  inputFlex: { flex: 1 },
  eyeBtn: { padding: 4 },
  submitBtn: { borderRadius: 16, height: 54, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  submitDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
});