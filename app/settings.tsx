// app/settings.tsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Switch, Platform, Alert, Modal, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { useTheme, ThemeMode, THEMES } from '@/lib/theme-context';

const LANGUAGES = [
  'English', 'French', 'Spanish', 'Arabic', 'Yoruba',
  'Igbo', 'Hausa', 'Pidgin', 'Portuguese', 'Swahili',
];

const APPEARANCES: ThemeMode[] = ['System', 'Light', 'Dark'];

const SOUNDS = [
  { label: 'Default',   value: 'default' },
  { label: 'Chime',     value: 'chime'   },
  { label: 'Bell',      value: 'bell'    },
  { label: 'Ping',      value: 'ping'    },
  { label: 'Soft Ding', value: 'soft'    },
  { label: 'None',      value: 'none'    },
];

const SOUND_URLS: Record<string, string> = {
  default: 'https://www.soundjay.com/buttons/sounds/button-3.mp3',
  chime:   'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
  bell:    'https://www.soundjay.com/bells/sounds/bell-small-03.mp3',
  ping:    'https://www.soundjay.com/buttons/sounds/button-09.mp3',
  soft:    'https://www.soundjay.com/buttons/sounds/button-21.mp3',
};

const NOTIF_TYPES = [
  { key: 'bellaChat',    label: 'Bella Chat',          icon: 'chatbubble-ellipses-outline' as const, subtitle: 'Messages from Bella AI'          },
  { key: 'debtAlert',   label: 'Debt Alert',           icon: 'alert-circle-outline' as const,        subtitle: 'Outstanding balance reminders'   },
  { key: 'fullPayment', label: 'Full Payment Alert',   icon: 'card-outline' as const,                subtitle: 'When full payment is received'   },
  { key: 'deposit',     label: 'Deposit Alert',        icon: 'cash-outline' as const,                subtitle: 'When deposit is paid'            },
  { key: 'appUpdate',   label: 'App Update',           icon: 'refresh-circle-outline' as const,      subtitle: 'New version available'           },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { mode, setMode, colors } = useTheme();
  const c = colors as typeof THEMES.Light;

  const [calendarGranted, setCalendarGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  const [notifEnabled, setNotifEnabled] = useState<Record<string, boolean>>({
    bellaChat: true, debtAlert: true, fullPayment: true, deposit: true, appUpdate: true,
  });
  const [notifSounds, setNotifSounds] = useState<Record<string, string>>({
    bellaChat: 'default', debtAlert: 'bell', fullPayment: 'chime', deposit: 'ping', appUpdate: 'soft',
  });
  const [soundPickerFor, setSoundPickerFor] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const cal = await Calendar.getCalendarPermissionsAsync();
      setCalendarGranted(cal.granted);
      const loc = await Location.getForegroundPermissionsAsync();
      setLocationGranted(loc.granted);
      try {
        const savedSounds = await AsyncStorage.getItem('notif_sounds');
        if (savedSounds) setNotifSounds(JSON.parse(savedSounds));
        const savedEnabled = await AsyncStorage.getItem('notif_enabled');
        if (savedEnabled) setNotifEnabled(JSON.parse(savedEnabled));
      } catch {}
    })();
  }, []);

  const toggleNotif = async (key: string, val: boolean) => {
    const updated = { ...notifEnabled, [key]: val };
    setNotifEnabled(updated);
    await AsyncStorage.setItem('notif_enabled', JSON.stringify(updated));
  };

  const selectSound = async (key: string, soundValue: string) => {
    const updated = { ...notifSounds, [key]: soundValue };
    setNotifSounds(updated);
    await AsyncStorage.setItem('notif_sounds', JSON.stringify(updated));
    setSoundPickerFor(null);
    // Preview the sound
    if (soundValue !== 'none' && SOUND_URLS[soundValue]) {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: SOUND_URLS[soundValue] });
        await sound.playAsync();
        setTimeout(() => sound.unloadAsync(), 3000);
      } catch {}
    }
  };

  const handleCalendar = async (val: boolean) => {
    if (val) {
      const { granted } = await Calendar.requestCalendarPermissionsAsync();
      setCalendarGranted(granted);
      if (!granted) Alert.alert('Permission Denied', 'Enable calendar access in Settings.');
    } else setCalendarGranted(false);
  };

  const handleLocation = async (val: boolean) => {
    if (val) {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(granted);
      if (!granted) Alert.alert('Permission Denied', 'Enable location access in Settings.');
    } else setLocationGranted(false);
  };

  const currentSoundLabel = (key: string) =>
    SOUNDS.find(s => s.value === notifSounds[key])?.label ?? 'Default';

  return (
    <ScrollView style={[s.container, { backgroundColor: c.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: c.text }]}>Settings</Text>
      </View>

      {/* APPEARANCE */}
      <SectionCard title="Appearance" c={c}>
        {APPEARANCES.map((a, i) => (
          <SettingRow key={a} icon="color-palette-outline" label={a}
            subtitle={a === 'System' ? 'Follows your device theme' : a === 'Light' ? 'Always bright' : 'Always dark'}
            c={c} last={i === APPEARANCES.length - 1}>
            <TouchableOpacity onPress={() => setMode(a)}
              style={[s.radioBtn, { borderColor: c.primary }, mode === a && { backgroundColor: c.primary }]}>
              {mode === a && <Ionicons name="checkmark" size={14} color="#fff" />}
            </TouchableOpacity>
          </SettingRow>
        ))}
      </SectionCard>

      {/* PERMISSIONS */}
      <SectionCard title="Permissions" c={c}>
        <SettingRow icon="calendar-outline" label="Calendar" subtitle="Allow booking reminders" c={c}>
          <Switch value={calendarGranted} onValueChange={handleCalendar} trackColor={{ false: c.border, true: c.primary }} thumbColor="#fff" />
        </SettingRow>
        <SettingRow icon="location-outline" label="Location" subtitle="Improve local suggestions" c={c} last>
          <Switch value={locationGranted} onValueChange={handleLocation} trackColor={{ false: c.border, true: c.primary }} thumbColor="#fff" />
        </SettingRow>
      </SectionCard>

      {/* NOTIFICATIONS + SOUNDS */}
      <SectionCard title="Notifications & Sounds" c={c}>
        <Text style={[s.sectionHint, { color: c.subText }]}>
          Toggle alerts on/off and pick a sound for each notification type.
        </Text>
        {NOTIF_TYPES.map((n, i) => (
          <View key={n.key} style={[s.notifRow, i < NOTIF_TYPES.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
            <View style={[s.settingIconBox, { backgroundColor: `${c.primary}20` }]}>
              <Ionicons name={n.icon} size={18} color={c.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.settingLabel, { color: c.text }]}>{n.label}</Text>
              <Text style={[s.settingSubtitle, { color: c.subText }]}>{n.subtitle}</Text>
              {/* Sound picker trigger */}
              {notifEnabled[n.key] && (
                <TouchableOpacity
                  style={[s.soundPicker, { borderColor: c.border }]}
                  onPress={() => setSoundPickerFor(n.key)}
                >
                  <Ionicons name="musical-note-outline" size={13} color={c.primary} />
                  <Text style={[s.soundPickerText, { color: c.primary }]}>
                    {currentSoundLabel(n.key)}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={c.subText} />
                </TouchableOpacity>
              )}
            </View>
            <Switch
              value={notifEnabled[n.key]}
              onValueChange={(val) => toggleNotif(n.key, val)}
              trackColor={{ false: c.border, true: c.primary }}
              thumbColor="#fff"
            />
          </View>
        ))}
      </SectionCard>

      <View style={{ height: 48 }} />

      {/* Sound picker modal */}
      <Modal visible={!!soundPickerFor} transparent animationType="slide" onRequestClose={() => setSoundPickerFor(null)}>
        <Pressable style={s.modalOverlay} onPress={() => setSoundPickerFor(null)}>
          <Pressable style={[s.modalCard, { backgroundColor: c.card }]}>
            <Text style={[s.modalTitle, { color: c.text }]}>
              Choose Sound — {NOTIF_TYPES.find(n => n.key === soundPickerFor)?.label}
            </Text>
            <Text style={[s.modalSub, { color: c.subText }]}>Tap to preview</Text>
            {SOUNDS.map(sound => (
              <TouchableOpacity
                key={sound.value}
                style={[s.soundOption, { borderBottomColor: c.border },
                  notifSounds[soundPickerFor ?? ''] === sound.value && { backgroundColor: `${c.primary}15` }
                ]}
                onPress={() => soundPickerFor && selectSound(soundPickerFor, sound.value)}
              >
                <Ionicons
                  name={sound.value === 'none' ? 'volume-mute-outline' : 'musical-note-outline'}
                  size={18} color={c.primary}
                />
                <Text style={[s.soundOptionText, { color: c.text }]}>{sound.label}</Text>
                {notifSounds[soundPickerFor ?? ''] === sound.value && (
                  <Ionicons name="checkmark-circle" size={20} color={c.primary} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[s.modalClose, { backgroundColor: c.primary }]}
              onPress={() => setSoundPickerFor(null)}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
  sectionHint: { fontSize: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  card: { borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  notifRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  settingIconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  settingLabel: { fontSize: 15, fontWeight: '600' },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  soundPicker: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  soundPickerText: { fontSize: 12, fontWeight: '600' },
  radioBtn: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  langBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  langBtnText: { fontSize: 13, fontWeight: '600' },
  langList: { borderTopWidth: 1 },
  langOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  langOptionText: { fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  modalSub: { fontSize: 13, marginBottom: 16 },
  soundOption: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1 },
  soundOptionText: { flex: 1, fontSize: 15, fontWeight: '600' },
  modalClose: { borderRadius: 25, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  themeDesc: { fontSize: 12, fontStyle: 'italic', marginTop: 4 },
});