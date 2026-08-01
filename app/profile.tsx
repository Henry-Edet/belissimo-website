// app/profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { ENDPOINTS } from '@/lib/config';

const BROWN = '#8B5E5E';

interface UserProfile {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  createdAt: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout, getAuthHeaders } = useAuth();
  const { colors } = useTheme();
  const BROWN = colors.primary;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // For Your Eyes Only — admin only
  const [showEyesOnly, setShowEyesOnly] = useState(false);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAuthenticated) fetchProfile();
    else setLoading(false);
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(ENDPOINTS.me, { headers: getAuthHeaders() });
      if (res.ok) {
        const data: UserProfile = await res.json();
        setProfile(data);
        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setPhone(data.phone ?? '');
      } else if (res.status === 401) {
        // Token expired — use auth user data as fallback so profile doesn't show dashes
        if (user) {
          const fallback = { email: user.email, role: user.role } as UserProfile;
          setProfile(fallback);
        }
      }
    } catch (e) {
      // Network error — use auth user data as fallback
      if (user) {
        const fallback = { email: user.email, role: user.role } as UserProfile;
        setProfile(fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(ENDPOINTS.me, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ firstName, lastName, phone }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setEditMode(false);
        Alert.alert('Saved', 'Your profile has been updated.');
      } else {
        Alert.alert('Error', 'Could not save profile. Try again.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Too Short', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch(ENDPOINTS.mePassword, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        Alert.alert('Done', 'Password changed successfully.');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message ?? 'Could not change password.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Check your connection.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Ionicons name="person-circle-outline" size={80} color="#D6BFC1" />
        <Text style={styles.guestTitle}>You're not signed in</Text>
        <Text style={styles.guestSubtitle}>Sign in to view and manage your profile</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/modal')}>
          <Text style={styles.signInBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={BROWN} />
      </View>
    );
  }

  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') 
    || profile?.email?.split('@')[0] 
    || user?.email?.split('@')[0] 
    || 'Profile';
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <LinearHeader />

      {/* ── Avatar + Name ── */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 500 }}
        style={styles.avatarSection}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || '?'}</Text>
        </View>
        <Text style={styles.displayName}>{displayName}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{profile?.role ?? 'client'}</Text>
        </View>
      </MotiView>

      {/* ── Profile Info Card ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          {!editMode && (
            <TouchableOpacity onPress={() => setEditMode(true)} style={styles.editBtn}>
              <Ionicons name="pencil-outline" size={16} color={BROWN} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {editMode ? (
          <View style={styles.editForm}>
            <Field label="First Name">
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                autoCapitalize="words"
              />
            </Field>
            <Field label="Last Name">
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                autoCapitalize="words"
              />
            </Field>
            <Field label="Phone">
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 234 567 8900"
                keyboardType="phone-pad"
              />
            </Field>
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setEditMode(false);
                  setFirstName(profile?.firstName ?? '');
                  setLastName(profile?.lastName ?? '');
                  setPhone(profile?.phone ?? '');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>Save Changes</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <InfoRow icon="person-outline" label="Name" value={displayName} />
            <InfoRow icon="mail-outline" label="Email" value={profile?.email ?? '—'} />
            <InfoRow icon="call-outline" label="Phone" value={profile?.phone ?? 'Not set'} />
            <InfoRow
              icon="calendar-outline"
              label="Member since"
              value={profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : '—'}
            />
          </View>
        )}
      </View>

      {/* ── Quick Actions ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>

        {!isAdmin && (
          <ActionRow
            icon="calendar"
            label="My Bookings"
            onPress={() => router.push('/(tabs)/bookings')}
          />
        )}

        {isAdmin && (
          <>
            <ActionRow
              icon="heart"
              label="For Your Eyes Only 💛"
              onPress={() => setShowEyesOnly(!showEyesOnly)}
              chevron
            />
            {showEyesOnly && (
              <MotiView
                from={{ opacity: 0, translateY: -8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18 }}
                style={styles.eyesOnlyCard}
              >
                <Text style={styles.eyesOnlyText}>
                  {"Hey! so i've been thinking of how not to make this lengthy but also not too short to pass the message. I am proud of you! I wish nothing but the best for you. Have the best life has to offer."}
                </Text>
                <Text style={styles.eyesOnlySign}>{"---for the last time...BEST BUD🫂"}</Text>
              </MotiView>
            )}
          </>
        )}

        <ActionRow
          icon="lock-closed-outline"
          label="Change Password"
          onPress={() => setShowPasswordForm(!showPasswordForm)}
          chevron
        />

        {/* Password form inline */}
        {showPasswordForm && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={styles.passwordForm}
          >
            <Field label="Current Password">
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Enter current password"
              />
            </Field>
            <Field label="New Password">
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Min. 6 characters"
              />
            </Field>
            <Field label="Confirm New Password">
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Repeat new password"
              />
            </Field>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleChangePassword}
              disabled={changingPassword}
            >
              {changingPassword
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Update Password</Text>
              }
            </TouchableOpacity>
          </MotiView>
        )}
      </View>

      {/* ── Sign Out ── */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="#E53E3E" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── Small helper components ────────────────────────────────────────────────

function LinearHeader() {
  return (
    <View style={styles.headerBg}>
      <Text style={styles.headerTitle}>My Profile</Text>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={16} color={BROWN} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({ icon, label, onPress, chevron }: { icon: any; label: string; onPress: () => void; chevron?: boolean }) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={16} color={BROWN} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#D6BFC1" />
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF5F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#FAF5F6' },
  // Header
  headerBg: {
    backgroundColor: BROWN,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 80,
    paddingHorizontal: 24,
  },
  headerTitle: { fontSize: 28, fontWeight: '300', color: '#fff', letterSpacing: 0.5 },
  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BROWN,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: BROWN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  displayName: { fontSize: 22, fontWeight: '700', color: '#3B1C1A', marginTop: 12 },
  email: { fontSize: 14, color: '#B89FA1', marginTop: 4 },
  roleBadge: { backgroundColor: `${BROWN}15`, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, marginTop: 8 },
  roleText: { fontSize: 12, color: BROWN, fontWeight: '600', textTransform: 'capitalize' },
  // Card
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#3B1C1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#3B1C1A', marginBottom: 16 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { fontSize: 14, color: BROWN, fontWeight: '600' },
  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0E6E8' },
  infoIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${BROWN}15`, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#B89FA1', marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#3B1C1A' },
  // Action rows
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0E6E8' },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#3B1C1A', marginLeft: 14 },
  // Edit form
  editForm: { gap: 4 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#3B1C1A', marginBottom: 6 },
  input: { backgroundColor: '#FFF8F9', borderRadius: 12, padding: 13, fontSize: 15, color: '#3B1C1A', borderWidth: 1, borderColor: '#F0E6E8' },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, borderWidth: 1.5, borderColor: '#F0E6E8', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#B89FA1' },
  saveBtn: { flex: 1, backgroundColor: BROWN, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  // Password form
  passwordForm: { marginTop: 12, gap: 4 },
  // For Your Eyes Only
  eyesOnlyCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#D69E2E',
  },
  eyesOnlyText: {
    fontSize: 15,
    color: '#3B1C1A',
    lineHeight: 26,
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  eyesOnlySign: {
    fontSize: 14,
    color: '#9D7A7D',
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'right',
  },
  // Sign out
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginBottom: 8, paddingVertical: 16, borderRadius: 20, borderWidth: 1.5, borderColor: '#FED7D7', backgroundColor: '#FFF5F5', gap: 8 },
  signOutText: { fontSize: 16, fontWeight: '700', color: '#E53E3E' },
  // Guest
  guestTitle: { fontSize: 22, fontWeight: '700', color: '#3B1C1A', marginTop: 16, marginBottom: 8 },
  guestSubtitle: { fontSize: 15, color: '#B89FA1', textAlign: 'center', marginBottom: 24 },
  signInBtn: { backgroundColor: BROWN, borderRadius: 25, paddingVertical: 14, paddingHorizontal: 40 },
  signInBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});