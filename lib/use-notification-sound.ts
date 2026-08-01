// lib/use-notification-sound.ts

import { useCallback } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_URLS: Record<string, string> = {
  default: 'https://www.soundjay.com/buttons/sounds/button-3.mp3',
  chime:   'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
  bell:    'https://www.soundjay.com/bells/sounds/bell-small-03.mp3',
  ping:    'https://www.soundjay.com/buttons/sounds/button-09.mp3',
  soft:    'https://www.soundjay.com/buttons/sounds/button-21.mp3',
};

export function useNotificationSound() {
  const playSound = useCallback(async (notifKey: string) => {
    // Always vibrate regardless of sound setting — guaranteed feedback
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    try {
      // Read settings
      const enabledRaw = await AsyncStorage.getItem('notif_enabled');
      const enabled: Record<string, boolean> = enabledRaw ? JSON.parse(enabledRaw) : {};
      // Default to enabled if not set
      if (enabled[notifKey] === false) return;

      const soundsRaw = await AsyncStorage.getItem('notif_sounds');
      const sounds: Record<string, string> = soundsRaw ? JSON.parse(soundsRaw) : {};
      // Default sound if not configured yet
      const selectedSound = sounds[notifKey] ?? 'default';

      if (selectedSound === 'none') return;

      const url = SOUND_URLS[selectedSound] ?? SOUND_URLS['default'];

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, volume: 1.0 },
      );

      // Auto-unload after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch (err) {
      // Sound failed — haptic already fired above so user still gets feedback
      console.log('Sound play failed:', err);
    }
  }, []);

  return { playSound };
}