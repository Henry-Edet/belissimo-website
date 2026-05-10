// app/modal.tsx
// Login & Register screen — replaces the Expo template placeholder

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Mail, Eye, EyeOff, X } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';

type Mode = 'login' | 'register';

export default function AuthModal() {
  const router = useRouter();
  const { login, register, isLoading } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    // ── Validation ─────────────────────────────────────────────────────────
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match');
      return;
    }

    // ── Submit ─────────────────────────────────────────────────────────────
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
      // On success — close modal and go back
      router.dismiss();
    } catch (err: any) {
      Alert.alert(
        mode === 'login' ? 'Login Failed' : 'Registration Failed',
        err.message || 'Something went wrong. Please try again.',
      );
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.dismiss()}>
          <X size={22} color="#7C6665" />
        </TouchableOpacity>

        {/* Brand */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 500 }}
          style={styles.brand}
        >
          <LinearGradient
            colors={['#B04A75', '#D681A0']}
            style={styles.brandIcon}
          >
            <Text style={styles.brandIconText}>B</Text>
          </LinearGradient>
          <Text style={styles.brandName}>Bellissimo</Text>
          <Text style={styles.brandTagline}>Hair Studio</Text>
        </MotiView>

        {/* Title */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100, duration: 500 }}
        >
          <Text style={styles.title}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'login'
              ? 'Sign in to manage your bookings'
              : 'Join us to book your appointments'}
          </Text>
        </MotiView>

        {/* Form */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200, duration: 500 }}
          style={styles.form}
        >
          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#B89FA1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#C9B8B9"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#B89FA1" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputWithAction]}
                placeholder="Min. 6 characters"
                placeholderTextColor="#C9B8B9"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword
                  ? <EyeOff size={18} color="#B89FA1" />
                  : <Eye size={18} color="#B89FA1" />
                }
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password — register only */}
          {mode === 'register' && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 80 }}
              transition={{ duration: 300 }}
            >
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirm password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={18} color="#B89FA1" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.inputWithAction]}
                    placeholder="Repeat password"
                    placeholderTextColor="#C9B8B9"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm
                      ? <EyeOff size={18} color="#B89FA1" />
                      : <Eye size={18} color="#B89FA1" />
                    }
                  </TouchableOpacity>
                </View>
              </View>
            </MotiView>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Switch mode */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === 'login'
                ? "Don't have an account? "
                : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={switchMode}>
              <Text style={styles.switchLink}>
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF8F9',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 40,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 8,
  },
  // ── Brand ──────────────────────────────────────────────────────────────────
  brand: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#B04A75',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  brandIconText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: 2,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '300',
    color: '#3B1C1A',
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 13,
    color: '#B04A75',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  // ── Title ──────────────────────────────────────────────────────────────────
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#3B1C1A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#B89FA1',
    marginBottom: 32,
    lineHeight: 22,
  },
  // ── Form ───────────────────────────────────────────────────────────────────
  form: {
    gap: 4,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B1C1A',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F0E6E8',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#3B1C1A',
  },
  inputWithAction: {
    paddingRight: 8,
  },
  eyeBtn: {
    padding: 4,
  },
  // ── Submit ─────────────────────────────────────────────────────────────────
  submitBtn: {
    backgroundColor: '#B04A75',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#B04A75',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // ── Switch ─────────────────────────────────────────────────────────────────
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  switchText: {
    fontSize: 14,
    color: '#B89FA1',
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B04A75',
  },
});