// app/(tabs)/admin.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Platform,
  Modal, Pressable, TextInput, KeyboardAvoidingView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { API_BASE_URL } from '@/lib/config';

// Shared takeover set — mirrors backend in-memory store for UI state
const takenOverSessions = new Set<string>();

interface Stats {
  totalBookings: number; pending: number; confirmed: number;
  cancelled: number; completed: number; totalClients: number;
  totalRevenue: string; totalPayments: number; aiBookings: number;
  recentBookings: AdminBooking[];
}
interface AdminBooking {
  id: number; clientName: string; clientPhone: string;
  status: string; startAt: string; subServiceName?: string;
  service?: { name: string };
  paymentStatus?: string; balanceCents?: number;
}
interface ChatSession {
  sessionId: string; clientName: string; lastActivity: string;
  messageCount: number; flagged: boolean; takenOver: boolean;
}
interface ChatMsg {
  id: number; sender: string; message: string;
  reply?: string; action?: string; createdAt: string;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  return (
    <View style={[s.statCard, { borderLeftColor: color }]}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {sub && <Text style={s.statSub}>{sub}</Text>}
    </View>
  );
}

// ─── BookingRow ───────────────────────────────────────────────────────────────
function BookingRow({ b, onConfirm, onCancel, onOwing, onMarkPaid }: {
  b: AdminBooking; onConfirm: (id: number) => void; onCancel: (id: number) => void;
  onOwing: (id: number) => void; onMarkPaid: (id: number) => void;
}) {
  const start = new Date(b.startAt);
  const date = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const service = b.subServiceName || b.service?.name || 'Appointment';
  const colorMap: Record<string, string> = { pending: '#D69E2E', confirmed: '#38A169', cancelled: '#E53E3E', completed: '#9D7A7D' };
  const color = colorMap[b.status] ?? '#666';

  return (
    <View style={s.bookingRow}>
      <View style={s.rowTop}>
        <Text style={s.rowName}>{b.clientName}</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {b.paymentStatus === 'owing' && <View style={[s.pill, { backgroundColor: '#FFF5F5' }]}><Text style={[s.pillText, { color: '#E53E3E' }]}>Owing</Text></View>}
          {b.paymentStatus === 'completed' && <View style={[s.pill, { backgroundColor: '#F0FFF4' }]}><Text style={[s.pillText, { color: '#38A169' }]}>Paid ✓</Text></View>}
          <View style={[s.pill, { backgroundColor: `${color}20` }]}><Text style={[s.pillText, { color }]}>{b.status}</Text></View>
        </View>
      </View>
      <Text style={s.rowService}>{service}</Text>
      <Text style={s.rowDate}>{date} at {time}</Text>
      <Text style={s.rowPhone}>{b.clientPhone}</Text>
      {b.paymentStatus === 'owing' && b.balanceCents ? (
        <Text style={s.owingAmount}>Outstanding: ${(b.balanceCents / 100).toFixed(2)}</Text>
      ) : null}
      {b.status === 'pending' && (
        <View style={s.rowActions}>
          <TouchableOpacity style={s.confirmBtn} onPress={() => onConfirm(b.id)}>
            <Ionicons name="checkmark" size={14} color="#fff" /><Text style={s.confirmText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={() => onCancel(b.id)}>
            <Ionicons name="close" size={14} color="#E53E3E" /><Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      {(b.status === 'confirmed' || b.status === 'completed') && b.paymentStatus !== 'completed' && (
        <View style={s.rowActions}>
          <TouchableOpacity style={s.owingBtn} onPress={() => onOwing(b.id)}>
            <Ionicons name="alert-circle-outline" size={14} color="#D69E2E" /><Text style={s.owingText}>Mark Owing</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.paidBtn} onPress={() => onMarkPaid(b.id)}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#38A169" /><Text style={s.paidText}>Payment Complete</Text>
          </TouchableOpacity>
        </View>
      )}
      {b.paymentStatus === 'completed' && (
        <View style={s.paidConfirmed}>
          <Ionicons name="checkmark-circle" size={16} color="#38A169" />
          <Text style={s.paidConfirmedText}>Full payment confirmed — account active</Text>
        </View>
      )}
    </View>
  );
}

// The 4 branded upload sections
const UPLOAD_FOLDERS = [
  { key: 'premium_quality', label: 'Premium Quality', icon: 'diamond-outline' as const, color: '#9D7A7D' },
  { key: 'expert_stylists', label: 'Expert Stylists', icon: 'ribbon-outline' as const,  color: '#38A169' },
  { key: 'hygiene_first',   label: 'Hygiene First',   icon: 'shield-checkmark-outline' as const, color: '#4A6FA5' },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AdminScreen() {
  const { user, getAuthHeaders, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';
  const scrollRef = useRef<ScrollView>(null);

  const [tab, setTab] = useState<'dashboard' | 'bookings' | 'payments' | 'chat' | 'gallery'>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [paymentNotifications, setPaymentNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [filter, setFilter] = useState('all');
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMsg[]>([]);
  const [adminInput, setAdminInput] = useState('');
  const [sendingAdmin, setSendingAdmin] = useState(false);
  const [takenOver, setTakenOver] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [owingModalVisible, setOwingModalVisible] = useState(false);
  const [owingBookingId, setOwingBookingId] = useState<number | null>(null);
  const [owingAmount, setOwingAmount] = useState('');
  const [owingSubmitting, setOwingSubmitting] = useState(false);

  // Gallery state
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedUploadFolder, setSelectedUploadFolder] = useState<string>('premium_quality');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/stats`, { headers: getAuthHeaders() });
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  const fetchBookings = async (status = 'all') => {
    setBookingsLoading(true);
    try {
      const q = status !== 'all' ? `?status=${status}` : '';
      const res = await fetch(`${API_BASE_URL}/admin/bookings${q}`, { headers: getAuthHeaders() });
      if (res.ok) { const d = await res.json(); setBookings(d.bookings ?? []); }
    } catch {} finally { setBookingsLoading(false); }
  };

  const fetchSessions = async () => {
    setChatLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/chat/sessions`, { headers: getAuthHeaders() });
      if (res.ok) setSessions(await res.json());
    } catch {} finally { setChatLoading(false); }
  };

  const fetchSession = async (sessionId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/chat/sessions/${sessionId}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSessionMessages(Array.isArray(data) ? data : (data.messages ?? []));
      }
    } catch {}
  };

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/payments/notifications`, { headers: getAuthHeaders() });
      if (res.ok) setPaymentNotifications(await res.json());
    } catch {} finally { setNotifLoading(false); }
  };

  const fetchGallery = async () => {
    setGalleryLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/gallery?limit=50`);
      if (res.ok) { const d = await res.json(); setGalleryItems(d.items ?? []); }
    } catch {} finally { setGalleryLoading(false); }
  };

  const handleUpload = async () => {
    try {
      const { launchImageLibraryAsync, MediaTypeOptions, requestMediaLibraryPermissionsAsync } =
        await import('expo-image-picker');

      const { status } = await requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library in Settings.');
        return;
      }

      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.All, // images AND videos
        allowsEditing: false,
        quality: 0.85,
        videoMaxDuration: 300, // 5 minutes max
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setUploading(true);

      const formData = new FormData();
      const filename = asset.fileName ?? asset.uri.split('/').pop() ?? 'upload';
      // Determine correct mime type
      let mimeType: string;
      if (asset.type === 'video') {
        // iOS uses .mov which is video/quicktime
        mimeType = filename.endsWith('.mov') ? 'video/quicktime' : 'video/mp4';
      } else {
        mimeType = 'image/jpeg';
      }

      formData.append('file', {
        uri: asset.uri,
        name: filename,
        type: mimeType,
      } as any);

      formData.append('folder', selectedUploadFolder);
      formData.append('isPublic', 'true');

      const allHeaders = getAuthHeaders();
      const authToken = allHeaders['Authorization'];

      if (!authToken) {
        Alert.alert('Session Expired', 'Please log out and log back in.');
        setUploading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/gallery/upload`, {
        method: 'POST',
        headers: { Authorization: authToken },
        body: formData,
      });

      if (res.ok) {
        Alert.alert('✅ Uploaded', `Added to "${UPLOAD_FOLDERS.find(f => f.key === selectedUploadFolder)?.label}" successfully.`);
        fetchGallery();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Upload Failed', err.message ?? `Error ${res.status}. Please try again.`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteGalleryItem = (id: string) => {
    Alert.alert('Delete', 'Remove this photo/video from the gallery?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await fetch(`${API_BASE_URL}/gallery/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        setGalleryItems(prev => prev.filter(i => i.id !== id));
      }},
    ]);
  };

  const loadAll = async () => {
    await Promise.all([fetchStats(), fetchBookings(filter), fetchSessions(), fetchNotifications()]);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) loadAll(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [filter]);

  // ── Booking actions ────────────────────────────────────────────────────────
  const handleConfirm = (id: number) => {
    Alert.alert('Confirm Booking', `Confirm booking #${id}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: async () => {
        await fetch(`${API_BASE_URL}/admin/bookings/${id}/confirm`, { method: 'PATCH', headers: getAuthHeaders() });
        fetchBookings(filter); fetchStats();
      }},
    ]);
  };

  const handleCancel = (id: number) => {
    Alert.alert('Cancel Booking', `Cancel booking #${id}?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        await fetch(`${API_BASE_URL}/admin/bookings/${id}/cancel`, { method: 'PATCH', headers: getAuthHeaders() });
        fetchBookings(filter); fetchStats();
      }},
    ]);
  };

  const handleOwing = (id: number) => { setOwingBookingId(id); setOwingAmount(''); setOwingModalVisible(true); };

  const submitOwing = async () => {
    const dollars = parseFloat(owingAmount);
    if (isNaN(dollars) || dollars <= 0) { Alert.alert('Invalid amount', 'Enter a valid dollar amount.'); return; }
    setOwingSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/bookings/${owingBookingId}/owing`, {
        method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ balanceCents: Math.round(dollars * 100) }),
      });
      if (res.ok) { setOwingModalVisible(false); fetchBookings(filter); fetchStats(); }
      else Alert.alert('Error', 'Failed to mark as owing.');
    } catch { Alert.alert('Error', 'Network error.'); }
    finally { setOwingSubmitting(false); }
  };

  const handleMarkPaid = (id: number) => {
    Alert.alert('Mark Payment Complete', `Confirm full payment for booking #${id}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Mark Paid', onPress: async () => {
        const res = await fetch(`${API_BASE_URL}/admin/bookings/${id}/completed`, { method: 'PATCH', headers: getAuthHeaders() });
        if (res.ok) { fetchBookings(filter); fetchStats(); }
      }},
    ]);
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!isAuthenticated || !isAdmin) {
    return (
      <View style={s.centered}>
        <Ionicons name="lock-closed-outline" size={64} color="#D6BFC1" />
        <Text style={s.guestTitle}>Admin Access Only</Text>
      </View>
    );
  }

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#9D7A7D" /></View>;

  const FILTERS = ['all', 'pending', 'confirmed', 'cancelled', 'completed'];
  const pendingCount = paymentNotifications.filter(n => n.status === 'pending').length;

  // ── CHAT SESSION VIEW — rendered as full screen outside ScrollView ─────────
  if (tab === 'chat' && selectedSession) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF5F6' }}>
        {/* Tab bar stays visible */}
        <View style={s.tabRow}>
          {(['dashboard', 'bookings', 'payments', 'chat', 'gallery'] as const).map((t) => {
            const icons = { dashboard: 'grid-outline', bookings: 'calendar-outline', payments: 'cash-outline', chat: 'chatbubbles-outline', gallery: 'images-outline' } as const;
            return (
              <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnActive]}
                onPress={() => { setTab(t); }}>
                <Ionicons name={icons[t]} size={18} color={tab === t ? '#9D7A7D' : '#B89FA1'} />
                <Text style={[s.tabBtnText, tab === t && s.tabBtnTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Chat header */}
        <View style={s.chatHeader}>
          <TouchableOpacity style={s.backBtn} onPress={() => { setSelectedSession(null); setSessionMessages([]); setTakenOver(false); }}>
            <Ionicons name="arrow-back" size={18} color="#9D7A7D" />
            <Text style={s.backBtnText}>Inbox</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <View style={[s.takeoverPill, takenOver && s.takeoverPillActive]}>
            <Text style={[s.takeoverPillText, takenOver && { color: '#fff' }]}>
              {takenOver ? '👩‍💼 You' : '🤖 Bella'}
            </Text>
          </View>
          <TouchableOpacity style={[s.takeoverBtn, takenOver && s.releaseBtn]}
            onPress={async () => {
              const endpoint = takenOver ? 'release' : 'takeover';
              await fetch(`${API_BASE_URL}/admin/chat/sessions/${selectedSession}/${endpoint}`,
                { method: 'PATCH', headers: getAuthHeaders() });
              if (takenOver) takenOverSessions.delete(selectedSession);
              else takenOverSessions.add(selectedSession);
              setTakenOver(!takenOver);
            }}>
            <Text style={[s.takeoverBtnText, takenOver && { color: '#E53E3E' }]}>
              {takenOver ? 'Release' : 'Take Over'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => fetchSession(selectedSession)} style={{ padding: 8 }}>
            <Ionicons name="refresh" size={18} color="#9D7A7D" />
          </TouchableOpacity>
        </View>

        {/* Messages — fills remaining space */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 12, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          ref={(ref) => {
            if (ref && sessionMessages.length > 0) {
              setTimeout(() => ref.scrollToEnd({ animated: false }), 50);
            }
          }}
        >
          {sessionMessages.length === 0
            ? <Text style={[s.empty, { marginTop: 40 }]}>No messages in this session</Text>
            : sessionMessages.map((m) => (
                <View key={m.id}>
                  {/* Client message — always on the left */}
                  {m.sender === 'user' && (
                    <View style={s.bubbleRowLeft}>
                      <Text style={s.bubbleSender}>👤 Client</Text>
                      <View style={[s.bubble, s.bubbleUser]}>
                        <Text style={s.bubbleText}>{m.message}</Text>
                      </View>
                      <Text style={s.bubbleTime}>
                        {new Date(m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  )}
                  {/* Bella's reply to that message — right side */}
                  {m.sender === 'user' && m.reply && (
                    <View style={s.bubbleRowRight}>
                      <Text style={s.bubbleSender}>🤖 Bella</Text>
                      <View style={[s.bubble, s.bubbleBot]}>
                        <Text style={[s.bubbleText, { color: '#fff' }]}>{m.reply}</Text>
                      </View>
                      <Text style={s.bubbleTime}>
                        {new Date(m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  )}
                  {/* Admin message — right side in purple */}
                  {m.sender === 'admin' && (
                    <View style={s.bubbleRowRight}>
                      <Text style={s.bubbleSender}>👩‍💼 You (Admin)</Text>
                      <View style={[s.bubble, s.bubbleAdmin]}>
                        <Text style={[s.bubbleText, { color: '#fff' }]}>{m.message}</Text>
                      </View>
                      <Text style={s.bubbleTime}>
                        {new Date(m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  )}
                </View>
              ))
          }
        </ScrollView>

        {/* Input bar — only when taken over, sticks above keyboard */}
        {takenOver && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          >
            <View style={s.adminInputRow}>
              <TextInput
                style={s.adminInput}
                placeholder="Type a message to the client..."
                placeholderTextColor="#B89FA1"
                value={adminInput}
                onChangeText={setAdminInput}
                multiline
                maxLength={500}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[s.adminSendBtn, (!adminInput.trim() || sendingAdmin) && { opacity: 0.4 }]}
                disabled={!adminInput.trim() || sendingAdmin}
                onPress={async () => {
                  const msg = adminInput.trim();
                  if (!msg || sendingAdmin) return;
                  // Clear input BEFORE the async call to prevent double-send
                  setAdminInput('');
                  setSendingAdmin(true);
                  try {
                    await fetch(`${API_BASE_URL}/admin/chat/sessions/${selectedSession}/send`, {
                      method: 'POST', headers: getAuthHeaders(),
                      body: JSON.stringify({ message: msg }),
                    });
                    // Fetch from DB — single source of truth
                    await fetchSession(selectedSession);
                  } catch {
                    Alert.alert('Error', 'Message failed to send.');
                  }
                  setSendingAdmin(false);
                }}>
                {sendingAdmin ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    );
  }

  // ── MAIN LAYOUT — ScrollView for all other tabs ───────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#FAF5F6' }}>
      {/* Tab bar */}
      <View style={s.tabRow}>
        {(['dashboard', 'bookings', 'payments', 'chat', 'gallery'] as const).map((t) => {
          const icons = { dashboard: 'grid-outline', bookings: 'calendar-outline', payments: 'cash-outline', chat: 'chatbubbles-outline', gallery: 'images-outline' } as const;
          return (
            <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabBtnActive]}
              onPress={() => { setTab(t); if (t === 'bookings') fetchBookings(filter); if (t === 'payments') fetchNotifications(); if (t === 'chat') fetchSessions(); if (t === 'gallery') fetchGallery(); }}>
              <View style={{ position: 'relative' }}>
                <Ionicons name={icons[t]} size={18} color={tab === t ? '#9D7A7D' : '#B89FA1'} />
                {t === 'payments' && pendingCount > 0 && (
                  <View style={s.notifBadge}><Text style={s.notifBadgeText}>{pendingCount}</Text></View>
                )}
              </View>
              <Text style={[s.tabBtnText, tab === t && s.tabBtnTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9D7A7D" />}>

        {/* DASHBOARD */}
        {tab === 'dashboard' && stats && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Overview</Text>
            <View style={s.statsGrid}>
              <StatCard label="Total Bookings" value={stats.totalBookings} color="#9D7A7D" />
              <StatCard label="Pending" value={stats.pending} color="#D69E2E" />
              <StatCard label="Confirmed" value={stats.confirmed} color="#38A169" />
              <StatCard label="Cancelled" value={stats.cancelled} color="#E53E3E" />
              <StatCard label="Completed" value={stats.completed} color="#B89FA1" />
              <StatCard label="Total Clients" value={stats.totalClients} color="#7C5E60" />
              <StatCard label="Revenue" value={`$${stats.totalRevenue}`} color="#38A169" sub={`${stats.totalPayments} payments`} />
              <StatCard label="AI Bookings" value={stats.aiBookings} color="#9D7A7D" sub="via Bella" />
            </View>
            <Text style={[s.sectionTitle, { marginTop: 24 }]}>Recent Bookings</Text>
            {stats.recentBookings?.map((b) => (
              <BookingRow key={b.id} b={b} onConfirm={handleConfirm} onCancel={handleCancel} onOwing={handleOwing} onMarkPaid={handleMarkPaid} />
            ))}
          </View>
        )}

        {/* BOOKINGS */}
        {tab === 'bookings' && (
          <View style={s.section}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
              {FILTERS.map((f) => (
                <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterBtnActive]}
                  onPress={() => { setFilter(f); fetchBookings(f); }}>
                  <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {bookingsLoading ? <ActivityIndicator color="#9D7A7D" style={{ marginTop: 32 }} />
              : bookings.length === 0 ? <Text style={s.empty}>No bookings found</Text>
              : bookings.map((b) => (
                  <BookingRow key={b.id} b={b} onConfirm={handleConfirm} onCancel={handleCancel} onOwing={handleOwing} onMarkPaid={handleMarkPaid} />
                ))
            }
          </View>
        )}

        {/* PAYMENTS */}
        {tab === 'payments' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Balance Payment Confirmations</Text>
            <Text style={s.sectionSub}>Balance payments via card, bank transfer, or crypto. Verify before confirming.</Text>
            {notifLoading ? <ActivityIndicator color="#9D7A7D" style={{ marginTop: 32 }} />
              : paymentNotifications.length === 0
                ? <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Ionicons name="checkmark-circle-outline" size={48} color="#B89FA1" />
                    <Text style={s.empty}>No payment notifications yet</Text>
                  </View>
                : paymentNotifications.map((n) => (
                    <View key={n.id} style={[s.notifCard,
                      n.status === 'confirmed' && { borderLeftColor: '#38A169', borderLeftWidth: 4 },
                      n.status === 'rejected' && { borderLeftColor: '#E53E3E', borderLeftWidth: 4 },
                      n.status === 'pending' && { borderLeftColor: '#D69E2E', borderLeftWidth: 4 },
                    ]}>
                      <View style={s.notifHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.notifName}>{n.clientName}</Text>
                          <Text style={s.notifMeta}>
                            {n.paymentMethod === 'bank_transfer' ? '🏦 Bank Transfer'
                              : n.paymentMethod === 'card' ? '💳 Card (Stripe)'
                              : '₿ Crypto'} · Booking #{n.bookingId}
                          </Text>
                          <Text style={s.notifDate}>{new Date(n.createdAt).toLocaleString()}</Text>
                        </View>
                        <View style={[s.notifStatusPill, {
                          backgroundColor: n.status === 'confirmed' ? '#F0FFF4' : n.status === 'rejected' ? '#FFF5F5' : '#FFFFF0',
                        }]}>
                          <Text style={[s.notifStatusText, {
                            color: n.status === 'confirmed' ? '#38A169' : n.status === 'rejected' ? '#E53E3E' : '#D69E2E',
                          }]}>{n.status.toUpperCase()}</Text>
                        </View>
                      </View>
                      <View style={s.notifAmountRow}>
                        <Text style={s.notifAmountLabel}>Amount</Text>
                        <Text style={s.notifAmount}>${(n.amountCents / 100).toFixed(2)}</Text>
                      </View>
                      {n.reference && <View style={s.notifRefRow}><Text style={s.notifRefLabel}>Ref</Text><Text style={s.notifRef}>{n.reference}</Text></View>}
                      {n.adminNote && <Text style={s.notifNote}>Note: {n.adminNote}</Text>}
                      {n.status === 'pending' && (
                        <View style={s.rowActions}>
                          <TouchableOpacity style={s.confirmBtn} onPress={() => {
                            Alert.alert('Confirm Payment', `Received $${(n.amountCents / 100).toFixed(2)} from ${n.clientName}?`, [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Yes, Confirm', onPress: async () => {
                                await fetch(`${API_BASE_URL}/payments/notifications/${n.id}/confirm`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ adminNote: 'Verified by admin' }) });
                                fetchNotifications(); fetchStats();
                              }},
                            ]);
                          }}>
                            <Ionicons name="checkmark" size={14} color="#fff" /><Text style={s.confirmText}>Confirm & Release</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={s.cancelBtn} onPress={() => {
                            Alert.alert('Reject', 'Account stays locked.', [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Reject', style: 'destructive', onPress: async () => {
                                await fetch(`${API_BASE_URL}/payments/notifications/${n.id}/reject`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ adminNote: 'Not found. Re-submit.' }) });
                                fetchNotifications();
                              }},
                            ]);
                          }}>
                            <Ionicons name="close" size={14} color="#E53E3E" /><Text style={s.cancelText}>Not Received</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))
            }
          </View>
        )}

        {/* CHAT — session list */}
        {tab === 'chat' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Conversations</Text>
            <Text style={s.sectionSub}>Tap to open. Take over to reply — Bella handles the rest automatically.</Text>
            {chatLoading ? <ActivityIndicator color="#9D7A7D" style={{ marginTop: 32 }} />
              : sessions.length === 0
                ? <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <Ionicons name="chatbubbles-outline" size={48} color="#D6BFC1" />
                    <Text style={[s.empty, { marginTop: 12 }]}>No conversations yet</Text>
                  </View>
                : sessions.map((sess) => (
                    <TouchableOpacity key={sess.sessionId}
                      style={[s.sessionRow, sess.takenOver && { borderLeftColor: '#9D7A7D', borderLeftWidth: 3 }]}
                      onPress={() => { setSelectedSession(sess.sessionId); fetchSession(sess.sessionId); setTakenOver(takenOverSessions.has(sess.sessionId)); }}>
                      <View style={[s.sessionAvatar, sess.takenOver && { backgroundColor: '#9D7A7D' }]}>
                        <Text style={s.sessionAvatarText}>{(sess.clientName || 'G').charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.sessionName}>{sess.clientName || 'Guest'}</Text>
                        <Text style={s.sessionMeta}>{sess.messageCount} msgs · {new Date(sess.lastActivity).toLocaleDateString()}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <View style={[s.pill, sess.takenOver ? { backgroundColor: '#F5EDE8' } : { backgroundColor: '#F0FFF4' }]}>
                          <Text style={[s.pillText, { color: sess.takenOver ? '#9D7A7D' : '#38A169' }]}>
                            {sess.takenOver ? '👩‍💼 You' : '🤖 Bella'}
                          </Text>
                        </View>
                        {sess.flagged && <View style={s.flagBadge}><Text style={s.flagText}>⚑</Text></View>}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#D6BFC1" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  ))
            }
          </View>
        )}

        {tab === 'gallery' && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Gallery Manager</Text>
            <Text style={s.sectionSub}>{galleryItems.length} items · visible to all clients</Text>

            {/* Folder picker — choose where to upload */}
            <Text style={[s.sectionTitle, { fontSize: 14, marginTop: 4, marginBottom: 10 }]}>
              Upload to section:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {UPLOAD_FOLDERS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    s.folderBtn,
                    selectedUploadFolder === f.key && { backgroundColor: f.color, borderColor: f.color },
                  ]}
                  onPress={() => setSelectedUploadFolder(f.key)}
                >
                  <Ionicons name={f.icon} size={14} color={selectedUploadFolder === f.key ? '#fff' : f.color} />
                  <Text style={[s.folderBtnText, selectedUploadFolder === f.key && { color: '#fff' }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Upload button */}
            <TouchableOpacity
              style={[s.uploadBtn, uploading && { opacity: 0.5 }]}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                    <Text style={s.uploadBtnText}>
                      Add Photo/Video to {UPLOAD_FOLDERS.find(f => f.key === selectedUploadFolder)?.label}
                    </Text>
                  </>
              }
            </TouchableOpacity>

            <View style={s.dividerLine} />

            {/* Gallery grid */}
            {galleryLoading
              ? <ActivityIndicator color="#9D7A7D" style={{ marginTop: 32 }} />
              : galleryItems.length === 0
                ? <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                    <Ionicons name="images-outline" size={56} color="#D6BFC1" />
                    <Text style={[s.empty, { marginTop: 12 }]}>No photos yet</Text>
                    <Text style={{ fontSize: 13, color: '#B89FA1', marginTop: 4 }}>Pick a section above and tap upload</Text>
                  </View>
                : <View style={s.galleryGrid}>
                    {galleryItems.map((item) => (
                      <View key={item.id} style={s.galleryThumb}>
                        <Image source={{ uri: item.thumbnailUrl || item.url }} style={s.galleryThumbImage} resizeMode="cover" />
                        {item.type === 'video' && (
                          <View style={s.videoIcon}><Ionicons name="play-circle" size={24} color="#fff" /></View>
                        )}
                        {/* Folder badge */}
                        <View style={s.folderBadge}>
                          <Text style={s.folderBadgeText}>
                            {UPLOAD_FOLDERS.find(f => f.key === item.folder)?.label?.split(' ')[0] ?? item.folder}
                          </Text>
                        </View>
                        <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteGalleryItem(item.id)}>
                          <Ionicons name="trash-outline" size={14} color="#fff" />
                        </TouchableOpacity>
                        {item.caption && (
                          <View style={s.thumbCaption}>
                            <Text style={s.thumbCaptionText} numberOfLines={1}>{item.caption}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
            }
          </View>
        )}
      </ScrollView>

      {/* Owing modal */}
      <Modal visible={owingModalVisible} transparent animationType="fade" onRequestClose={() => setOwingModalVisible(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setOwingModalVisible(false)}>
          <Pressable style={s.modalCard}>
            <Text style={s.modalTitle}>Mark as Owing</Text>
            <Text style={s.modalSub}>Enter the outstanding balance in dollars</Text>
            <TextInput style={s.modalInput} placeholder="e.g. 150" placeholderTextColor="#B89FA1"
              keyboardType="decimal-pad" value={owingAmount} onChangeText={setOwingAmount} autoFocus />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setOwingModalVisible(false)}>
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={submitOwing} disabled={owingSubmitting}>
                {owingSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.modalConfirmText}>Mark Owing</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  guestTitle: { fontSize: 20, fontWeight: '700', color: '#3B1C1A', marginTop: 16 },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0E6E8' },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', gap: 3 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#9D7A7D' },
  tabBtnText: { fontSize: 11, fontWeight: '600', color: '#B89FA1' },
  tabBtnTextActive: { color: '#9D7A7D' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#3B1C1A', marginBottom: 8 },
  sectionSub: { fontSize: 13, color: '#B89FA1', marginBottom: 16, lineHeight: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderLeftWidth: 4, width: '47%', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statValue: { fontSize: 26, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#B89FA1', fontWeight: '600' },
  statSub: { fontSize: 11, color: '#D6BFC1', marginTop: 2 },
  filterRow: { marginBottom: 14 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0E6E8', marginRight: 8 },
  filterBtnActive: { backgroundColor: '#9D7A7D' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#7C5E60' },
  filterTextActive: { color: '#fff' },
  bookingRow: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rowName: { fontSize: 15, fontWeight: '700', color: '#3B1C1A' },
  rowService: { fontSize: 13, color: '#7C6665', marginBottom: 3 },
  rowDate: { fontSize: 12, color: '#B89FA1' },
  rowPhone: { fontSize: 12, color: '#B89FA1', marginTop: 2 },
  owingAmount: { fontSize: 13, fontWeight: '700', color: '#E53E3E', marginTop: 4 },
  pill: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 11, fontWeight: '700' },
  rowActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  confirmBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#38A169', borderRadius: 10, paddingVertical: 9, gap: 4 },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  cancelBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF5F5', borderRadius: 10, paddingVertical: 9, gap: 4, borderWidth: 1, borderColor: '#FED7D7' },
  cancelText: { color: '#E53E3E', fontWeight: '700', fontSize: 12 },
  owingBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFF0', borderRadius: 10, paddingVertical: 9, gap: 4, borderWidth: 1, borderColor: '#F6E05E' },
  owingText: { color: '#D69E2E', fontWeight: '700', fontSize: 12 },
  paidBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FFF4', borderRadius: 10, paddingVertical: 9, gap: 4, borderWidth: 1, borderColor: '#9AE6B4' },
  paidText: { color: '#38A169', fontWeight: '700', fontSize: 12 },
  paidConfirmed: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FFF4', borderRadius: 10, padding: 8, marginTop: 10 },
  paidConfirmedText: { color: '#38A169', fontWeight: '600', fontSize: 12 },
  empty: { textAlign: 'center', color: '#B89FA1', fontSize: 15 },
  // Chat inbox
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0E6E8', gap: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backBtnText: { color: '#9D7A7D', fontWeight: '600', fontSize: 14 },
  takeoverPill: { backgroundColor: '#F0FFF4', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  takeoverPillActive: { backgroundColor: '#9D7A7D' },
  takeoverPillText: { fontSize: 12, fontWeight: '700', color: '#38A169' },
  takeoverBtn: { backgroundColor: '#9D7A7D', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  releaseBtn: { backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FED7D7' },
  takeoverBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  // Chat messages
  chatMessages: { flex: 1, backgroundColor: '#FAF5F6' },
  bubbleRowLeft: { alignItems: 'flex-start', marginBottom: 12 },
  bubbleRowRight: { alignItems: 'flex-end', marginBottom: 12 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12 },
  bubbleUser: { backgroundColor: '#F0E6E8' },
  bubbleAdmin: { backgroundColor: '#9D7A7D' },
  bubbleBot: { backgroundColor: '#38A169' },
  bubbleSender: { fontSize: 11, color: '#B89FA1', marginBottom: 4 },
  bubbleText: { fontSize: 14, color: '#3B1C1A', lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: '#B89FA1', marginTop: 4 },
  adminInputRow: { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0E6E8', alignItems: 'flex-end' },
  adminInput: { flex: 1, backgroundColor: '#FAF5F6', borderRadius: 20, borderWidth: 1, borderColor: '#F0E6E8', paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#3B1C1A', maxHeight: 120, minHeight: 44 },
  adminSendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#9D7A7D', justifyContent: 'center', alignItems: 'center' },
  // Session list
  sessionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, gap: 12 },
  sessionAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D6BFC1', justifyContent: 'center', alignItems: 'center' },
  sessionAvatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  sessionName: { fontSize: 15, fontWeight: '700', color: '#3B1C1A' },
  sessionMeta: { fontSize: 12, color: '#B89FA1', marginTop: 2 },
  flagBadge: { backgroundColor: '#FFF5F5', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  flagText: { fontSize: 11, fontWeight: '700', color: '#E53E3E' },
  // Payments
  notifBadge: { position: 'absolute', top: -4, right: -6, backgroundColor: '#E53E3E', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  notifCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  notifName: { fontSize: 15, fontWeight: '700', color: '#3B1C1A' },
  notifMeta: { fontSize: 12, color: '#7C6665', marginTop: 2 },
  notifDate: { fontSize: 11, color: '#B89FA1', marginTop: 2 },
  notifStatusPill: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  notifStatusText: { fontSize: 11, fontWeight: '800' },
  notifAmountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAF5F6', borderRadius: 10, padding: 10, marginBottom: 8 },
  notifAmountLabel: { fontSize: 13, color: '#B89FA1', fontWeight: '600' },
  notifAmount: { fontSize: 18, fontWeight: '700', color: '#3B1C1A' },
  notifRefRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  notifRefLabel: { fontSize: 12, color: '#B89FA1' },
  notifRef: { fontSize: 12, fontWeight: '600', color: '#3B1C1A', flex: 1 },
  notifNote: { fontSize: 12, color: '#D69E2E', fontStyle: 'italic', marginBottom: 8 },
  folderBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#D6BFC1', paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, backgroundColor: '#fff' },
  folderBtnText: { fontSize: 12, fontWeight: '700', color: '#7C5E60' },
  dividerLine: { height: 1, backgroundColor: '#F0E6E8', marginVertical: 16 },
  folderBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  folderBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#9D7A7D', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center' },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galleryThumb: { width: '47.5%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F0E6E8', position: 'relative' },
  galleryThumbImage: { width: '100%', height: '100%' },
  videoIcon: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.18)' },
  deleteBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(229,57,53,0.85)', borderRadius: 14, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  thumbCaption: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', padding: 5 },
  thumbCaptionText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  // Owing modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '100%', maxWidth: 340 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#3B1C1A', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#B89FA1', marginBottom: 20 },
  modalInput: { borderWidth: 1.5, borderColor: '#F0E6E8', borderRadius: 14, padding: 14, fontSize: 20, fontWeight: '700', color: '#3B1C1A', marginBottom: 20, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, borderWidth: 1.5, borderColor: '#F0E6E8', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#B89FA1' },
  modalConfirm: { flex: 1, backgroundColor: '#D69E2E', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});