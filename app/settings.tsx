// app/settings.tsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Switch, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import * as Location from 'expo-location';
import { useTheme, ThemeMode, THEMES } from '@/lib/theme-context';

const LANGUAGES = [
  'English', 'French', 'Spanish', 'Arabic', 'Yoruba',
  'Igbo', 'Hausa', 'Pidgin', 'Portuguese', 'Swahili',
];

const APPEARANCES: ThemeMode[] = ['System', 'Light', 'Dark'];

export default function SettingsScreen() {
  const router = useRouter();
  const { mode, setMode, colors, language, setLanguage } = useTheme();

  const [calendarGranted, setCalendarGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [notifBellaChat, setNotifBellaChat] = useState(true);
  const [notifDebtAlert, setNotifDebtAlert] = useState(true);
  const [notifFullPayment, setNotifFullPayment] = useState(true);
  const [notifDeposit, setNotifDeposit] = useState(true);
  const [notifAppUpdate, setNotifAppUpdate] = useState(true);

  useEffect(() => {
    (async () => {
      const cal = await Calendar.getCalendarPermissionsAsync();
      setCalendarGranted(cal.granted);
      const loc = await Location.getForegroundPermissionsAsync();
      setLocationGranted(loc.granted);
    })();
  }, []);

  const handleCalendar = async (val: boolean) => {
    if (val) {
      const { granted } = await Calendar.requestCalendarPermissionsAsync();
      setCalendarGranted(granted);
      if (!granted) Alert.alert('Permission Denied', 'Enable calendar access in your phone Settings.');
    } else {
      setCalendarGranted(false);
    }
  };

  const handleLocation = async (val: boolean) => {
    if (val) {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(granted);
      if (!granted) Alert.alert('Permission Denied', 'Enable location access in your phone Settings.');
    } else {
      setLocationGranted(false);
    }
  };

  const c = colors;

  return (
    <ScrollView style={[s.container, { backgroundColor: c.bg }]} showsVerticalScrollIndicator={false}>
      <View style={[s.header, { backgroundColor: c.card, borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: c.text }]}>Settings</Text>
      </View>

      {/* PERMISSIONS */}
      <SectionCard title="Permissions" c={c}>
        <SettingRow icon="calendar-outline" label="Allow Google Calendar" subtitle="Add appointments automatically" c={c}>
          <Switch value={calendarGranted} onValueChange={handleCalendar} trackColor={{ false: c.border, true: c.primary }} thumbColor="#fff" />
        </SettingRow>
        <SettingRow icon="location-outline" label="Allow Location" subtitle="Show studio near you" c={c} last>
          <Switch value={locationGranted} onValueChange={handleLocation} trackColor={{ false: c.border, true: c.primary }} thumbColor="#fff" />
        </SettingRow>
      </SectionCard>

      {/* APPEARANCE */}
      <SectionCard title="Appearance" c={c}>
        <View style={s.segmentRow}>
          {APPEARANCES.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[s.segmentBtn, { borderColor: c.border }, mode === opt && { backgroundColor: c.primary, borderColor: c.primary }]}
              onPress={() => setMode(opt)}
            >
              <Ionicons
                name={opt === 'System' ? 'phone-portrait-outline' : opt === 'Light' ? 'sunny-outline' : 'moon-outline'}
                size={16}
                color={mode === opt ? c.primaryText : c.subText}
              />
              <Text style={[s.segmentText, { color: mode === opt ? c.primaryText : c.subText }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={[s.themeDesc, { color: c.subText }]}>
            {mode === 'System' && 'Warm brown tones — the Bellissimo signature palette'}
            {mode === 'Light' && 'Bright and clean — full light mode'}
            {mode === 'Dark' && 'Deep dark brown — easy on the eyes'}
          </Text>
        </View>
      </SectionCard>

      {/* LANGUAGE */}
      <SectionCard title="Speech Language" c={c}>
        <TouchableOpacity style={s.languageRow} onPress={() => setShowLanguages(!showLanguages)}>
          <Ionicons name="language-outline" size={20} color={c.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.languageLabel, { color: c.subText }]}>Default Language</Text>
            <Text style={[s.languageValue, { color: c.text }]}>{language}</Text>
          </View>
          <Ionicons name={showLanguages ? 'chevron-up' : 'chevron-down'} size={18} color={c.subText} />
        </TouchableOpacity>
        {showLanguages && (
          <View style={[s.languageList, { borderTopColor: c.border }]}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[s.languageItem, { borderBottomColor: c.border }]}
                onPress={() => { setLanguage(lang); setShowLanguages(false); }}
              >
                <Text style={[s.languageItemText, { color: c.text }, lang === language && { color: c.primary, fontWeight: '700' }]}>{lang}</Text>
                {lang === language && <Ionicons name="checkmark" size={16} color={c.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </SectionCard>

      {/* NOTIFICATIONS */}
      <SectionCard title="Notifications" c={c}>
        <SettingRow icon="chatbubble-ellipses-outline" label="Bella Chat" subtitle="Messages from Bella AI" c={c}>
          <Switch value={notifBellaChat} onValueChange={setNotifBellaChat} trackColor={{ false: c.border, true: c.primary }} thumbColor="#fff" />
        </SettingRow>
        <SettingRow icon="alert-circle-outline" label="Debt Alert" subtitle="Outstanding balance reminders" c={c}>
          <Switch value={notifDebtAlert} onValueChange={setNotifDebtAlert} trackColor={{ false: c.border, true: c.primary }} thumbColor="#fff" />
        </SettingRow>
        <SettingRow icon="card-outline" label="Full Payment Alert" subtitle="When full payment is received" c={c}>
          <Switch value={notifFullPayment} onValueChange={setNotifFullPayment} trackColor={{ false: c.border, true: c.primary }} thumbColor="#fff" />
        </SettingRow>
        <SettingRow icon="cash-outline" label="Deposit Alert" subtitle="When deposit is paid" c={c}>
          <Switch value={notifDeposit} onValueChange={setNotifDeposit} trackColor={{ false: c.border, true: c.primary }} thumbColor="#fff" />
        </SettingRow>
        <SettingRow icon="refresh-circle-outline" label="App Update" subtitle="New version available" c={c} last>
          <Switch value={notifAppUpdate} onValueChange={setNotifAppUpdate} trackColor={{ false: c.border, true: c.primary }} thumbColor="#fff" />
        </SettingRow>
      </SectionCard>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function SectionCard({ title, children, c }: { title: string; children: React.ReactNode; c: typeof THEMES.Light }) {
  return (
    <View style={s.section}>
      <Text style={[s.sectionTitle, { color: c.subText }]}>{title}</Text>
      <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>{children}</View>
    </View>
  );
}

function SettingRow({ icon, label, subtitle, children, c, last }: {
  icon: any; label: string; subtitle: string; children: React.ReactNode;
  c: typeof THEMES.Light; last?: boolean;
}) {
  return (
    <View style={[s.settingRow, !last && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
      <View style={[s.settingIconBox, { backgroundColor: `${c.primary}20` }]}>
        <Ionicons name={icon} size={18} color={c.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.settingLabel, { color: c.text }]}>{label}</Text>
        <Text style={[s.settingSubtitle, { color: c.subText }]}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  card: { borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  settingIconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  settingLabel: { fontSize: 15, fontWeight: '600' },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  themeDesc: { fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  segmentRow: { flexDirection: 'row', padding: 12, gap: 8 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  segmentText: { fontSize: 13, fontWeight: '600' },
  languageRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  languageLabel: { fontSize: 13, marginBottom: 2 },
  languageValue: { fontSize: 15, fontWeight: '600' },
  languageList: { borderTopWidth: 1 },
  languageItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1 },
  languageItemText: { fontSize: 15 },
});