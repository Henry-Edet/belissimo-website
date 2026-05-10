// components/ReviewModal.tsx
// Pops up before full payment — compulsory rating + comment

import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/lib/config';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';

interface Props {
  visible: boolean;
  bookingId: number;
  clientName: string;
  serviceName: string;
  onCompleted: () => void; // called when review submitted — proceed to payment
  onClose: () => void;
}

export default function ReviewModal({ visible, bookingId, clientName, serviceName, onCompleted, onClose }: Props) {
  const { getAuthHeaders } = useAuth();
  const { colors } = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating required', 'Please select a star rating before continuing.');
      return;
    }
    if (comment.trim().length < 10) {
      Alert.alert('Comment required', 'Please write at least a short comment (10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ bookingId, clientName, rating, comment }),
      });

      if (res.ok || res.status === 400) {
        // 400 means already reviewed — still let them proceed
        onCompleted();
      } else {
        Alert.alert('Error', 'Could not submit review. Please try again.');
      }
    } catch {
      // Network error — still let them proceed
      onCompleted();
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = () => (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={40}
            color={star <= rating ? '#FFD700' : colors.border}
            style={{ marginHorizontal: 4 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Rate Your Experience</Text>
            <Text style={[styles.headerSub, { color: colors.subText }]}>{serviceName}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Prompt */}
          <Text style={[styles.prompt, { color: colors.text }]}>
            Before completing your payment, please share your experience. Your review helps other clients and keeps Bellissimo improving! 💛
          </Text>

          {/* Star rating */}
          <Text style={[styles.label, { color: colors.text }]}>Your Rating</Text>
          <StarRating />
          {rating > 0 && (
            <Text style={[styles.ratingLabel, { color: colors.primary }]}>{ratingLabels[rating]}</Text>
          )}

          {/* Comment */}
          <Text style={[styles.label, { color: colors.text }]}>Your Review</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholder="How was your appointment? What did you love?"
            placeholderTextColor={colors.subText}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.subText }]}>{comment.length} chars</Text>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }, submitting && styles.disabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color={colors.primaryText} />
              : <Text style={[styles.submitText, { color: colors.primaryText }]}>Submit & Continue to Payment</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={onCompleted}>
            <Text style={[styles.skipText, { color: colors.subText }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 14, marginTop: 4 },
  content: { padding: 24 },
  prompt: { fontSize: 15, lineHeight: 24, marginBottom: 28 },
  label: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  stars: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  ratingLabel: { textAlign: 'center', fontSize: 16, fontWeight: '700', marginBottom: 24 },
  input: { borderRadius: 14, borderWidth: 1.5, padding: 14, fontSize: 15, minHeight: 120, marginBottom: 6 },
  charCount: { fontSize: 12, textAlign: 'right', marginBottom: 24 },
  submitBtn: { borderRadius: 16, height: 54, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  disabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 14 },
});