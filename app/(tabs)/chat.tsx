// app/(tabs)/chat.tsx
// - Per-user message persistence via AsyncStorage (keyed by userId)
// - 72hr message TTL matching backend cleanup
// - Polls for admin messages every 5s and shows them in chat
// - Sends clientName so admin sees real names in session list

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS, API_BASE_URL } from '@/lib/config';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';

interface Message {
  id: number | string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: number;
}

const TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

const WELCOME: Message = {
  id: 'welcome',
  sender: 'bot',
  text: "Hi! I'm Bella 💁🏽‍♀️✨ — Bellissimo's AI assistant. How can I help you today?",
  timestamp: Date.now(),
};

export default function ChatScreen() {
  const { getAuthHeaders, user } = useAuth();
  const { colors } = useTheme();

  // Each logged-in user gets their own storage key
  // Guests share 'guest' — fine since they have no account
  const userId = user?.id ? `user_${user.id}` : 'guest';
  const storageKey = `bellissimo_chat_${userId}`;

  // Full name for admin to see in session list
  const clientName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Client'
    : null;

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Track which admin message IDs we've already added to avoid duplicates
  const shownAdminIds = useRef<Set<string>>(new Set());

  // ── Load persisted messages on mount ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const parsed: Message[] = JSON.parse(raw);
          const fresh = parsed.filter(m => Date.now() - m.timestamp < TTL_MS);
          if (fresh.length > 0) {
            setMessages(fresh);
            // Restore known admin IDs so we don't re-add them on poll
            fresh
              .filter(m => String(m.id).startsWith('admin-'))
              .forEach(m => shownAdminIds.current.add(String(m.id)));
          } else {
            // All messages expired — reset to welcome
            await AsyncStorage.setItem(storageKey, JSON.stringify([WELCOME]));
          }
        }
      } catch {}
      setHydrated(true);
    })();
  }, [storageKey]);

  // ── Persist on every change (after hydration) ─────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(messages)).catch(() => {});
  }, [messages, hydrated, storageKey]);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    if (hydrated) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, hydrated]);

  // ── Poll for admin messages every 5s ─────────────────────────────────────
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        // No auth needed — this endpoint is public
        const res = await fetch(`${API_BASE_URL}/admin/chat/client/${userId}`);
        if (!res.ok) return;

        const data: any[] = await res.json();
        const adminRows = data.filter(m => m.sender === 'admin');
        if (adminRows.length === 0) return;

        const newMsgs: Message[] = [];
        for (const m of adminRows) {
          const key = `admin-${m.id}`;
          if (shownAdminIds.current.has(key)) continue;
          shownAdminIds.current.add(key);
          newMsgs.push({
            id: key,
            sender: 'bot',
            text: `💬 Bellissimo Team: ${m.message}`,
            timestamp: new Date(m.createdAt).getTime(),
          });
        }

        if (newMsgs.length > 0) {
          setMessages(prev => [...prev, ...newMsgs]);
        }
      } catch {}
    }, 5000);

    return () => clearInterval(poll);
  }, [userId]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const text = input.trim();
    setInput('');

    const userMsg: Message = { id: Date.now(), sender: 'user', text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(ENDPOINTS.aiMessage, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: text,
          userId,
          clientName, // admin sees this name in the session list
        }),
      });

      const data = await res.json();

      const botMsg: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.reply ?? "Hmm, I didn't catch that. Could you say it again?",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);

      if (data.action === 'CREATE_BOOKING_AND_PAYMENT' && data.paymentUrl) {
        setMessages(prev => [...prev, {
          id: Date.now() + 2,
          sender: 'bot',
          text: `Here is your payment link:\n${data.paymentUrl}`,
          timestamp: Date.now(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        sender: 'bot',
        text: "Network error. Please check your connection and try again.",
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarEmoji}>💁🏽‍♀️</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>
        <View>
          <Text style={[styles.headerName, { color: colors.text }]}>Bella</Text>
          <Text style={[styles.headerSub, { color: colors.subText }]}>Bellissimo AI Assistant · Online</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={[
            styles.bubble,
            msg.sender === 'user'
              ? [styles.userBubble, { backgroundColor: colors.primary }]
              : [styles.botBubble, { backgroundColor: colors.card, borderColor: colors.border }],
          ]}>
            <Text style={[
              styles.bubbleText,
              msg.sender === 'user'
                ? { color: colors.primaryText }
                : { color: colors.text },
            ]}>
              {msg.text}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={styles.typing}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.typingText, { color: colors.primary }]}>Bella is typing…</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          placeholder="Ask Bella anything…"
          placeholderTextColor={colors.subText}
          style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary }, (!input.trim() || loading) && { opacity: 0.4 }]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Text style={[styles.sendBtnText, { color: colors.primaryText }]}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16, borderBottomWidth: 1, gap: 12 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 22 },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#38A169', borderWidth: 2, borderColor: '#fff' },
  headerName: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 1 },
  chatContent: { padding: 16, gap: 8, paddingBottom: 16 },
  bubble: { maxWidth: '82%', padding: 13, borderRadius: 18, marginVertical: 3 },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  botBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, alignSelf: 'flex-start' },
  typingText: { fontSize: 13, fontStyle: 'italic' },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, alignItems: 'flex-end', gap: 10 },
  input: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1, maxHeight: 120 },
  sendBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
  sendBtnText: { fontWeight: '700', fontSize: 15 },
});