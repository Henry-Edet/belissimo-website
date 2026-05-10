// app/terms.tsx
// Terms & Conditions — Bellissimo Hair Studio

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const TERMS = [
  {
    title: '1. Booking & Appointments',
    content: `All appointments must be booked in advance through the Bellissimo app. Walk-in appointments are subject to availability and cannot be guaranteed.\n\nWe reserve the right to decline service at our discretion, including but not limited to concerns about scalp health, hair condition, or inappropriate conduct.`,
  },
  {
    title: '2. Deposits & Payments',
    content: `A non-refundable deposit is required to confirm all bookings. The deposit amount varies by service (typically 30% of the total service cost) and will be clearly displayed at checkout.\n\nThe remaining balance is due at the time of your appointment. We accept card payments and bank transfers. Cash may be accepted at the stylist's discretion.\n\nFull payment is required before leaving the salon. Failure to pay may result in a ban from future bookings.`,
  },
  {
    title: '3. Cancellations & Rescheduling',
    content: `Cancellations made more than 48 hours before the appointment will receive a credit toward a future booking. Deposits are non-refundable regardless of cancellation time.\n\nCancellations made less than 48 hours before the appointment will forfeit the deposit and may incur an additional cancellation fee.\n\nNo-shows (failure to arrive without prior notice) will be charged 50% of the full service cost and may result in a temporary or permanent booking suspension.\n\nRescheduling is permitted up to 24 hours before your appointment at no additional charge. Same-day rescheduling is at the stylist's discretion.`,
  },
  {
    title: '4. Late Arrivals',
    content: `We allow a grace period of 15 minutes. Arrivals beyond 15 minutes late may result in a shortened service (with no price reduction), rescheduling, or cancellation at the stylist's discretion.\n\nRepeated late arrivals may result in additional fees or refusal of future bookings.`,
  },
  {
    title: '5. Hair & Scalp Health',
    content: `Bellissimo Hair Studio is not responsible for damage resulting from pre-existing hair or scalp conditions, including breakage, thinning, or sensitivity to products.\n\nClients are responsible for disclosing any known allergies, scalp conditions, or sensitivities prior to their appointment. Failure to disclose may void any liability on our part.\n\nWe reserve the right to refuse or modify services if we determine that proceeding could cause harm to the client's hair or scalp.`,
  },
  {
    title: '6. Products & Allergies',
    content: `We use professional-grade, salon-approved products. Patch tests are available upon request and must be requested at least 48 hours before your appointment.\n\nIf you experience an allergic reaction during or after your service, please notify us immediately. We are not liable for reactions resulting from undisclosed sensitivities or at-home product use.`,
  },
  {
    title: '7. Children & Guests',
    content: `Children under 12 must be accompanied by an adult at all times. In the interest of safety and comfort for all clients, we ask that you limit accompanying guests to one person per appointment.\n\nWe are not liable for accidents involving unaccompanied children on our premises.`,
  },
  {
    title: '8. Photography & Privacy',
    content: `Bellissimo Hair Studio may photograph or video your completed style for promotional purposes (social media, website, marketing). You will be asked for explicit consent before any photography.\n\nYou may opt out at any time. Declining photography will not affect the quality of your service.\n\nYour personal data (name, phone, email) is collected solely for booking purposes and is never sold to third parties. See our Privacy Policy for full details.`,
  },
  {
    title: '9. Behaviour & Conduct',
    content: `We are committed to providing a safe, welcoming environment for all clients and staff. Abusive, threatening, or disrespectful behaviour will not be tolerated and will result in immediate termination of service and a permanent ban.\n\nThis includes behaviour in person, over the phone, and via the app (messages to Bella or support).`,
  },
  {
    title: '10. Liability',
    content: `Bellissimo Hair Studio's liability is limited to the cost of the service provided. We are not liable for loss of personal belongings, indirect damages, or any consequential loss arising from our services.\n\nBy booking with us, you agree that any disputes will first be addressed through direct communication with our team before any legal proceedings are initiated.`,
  },
  {
    title: '11. Changes to These Terms',
    content: `We reserve the right to update these Terms & Conditions at any time. Continued use of the Bellissimo app following any changes constitutes acceptance of the revised terms.\n\nSignificant changes will be communicated via the app and email.`,
  },
  {
    title: '12. Contact',
    content: `For questions about these terms, contact us through the app or email us at the address provided on our profile page.\n\nThese Terms & Conditions are governed by applicable law and were last updated in 2026.`,
  },
];

export default function TermsScreen() {
  const router = useRouter();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#3B1C1A" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Terms & Conditions</Text>
          <Text style={s.headerSub}>Bellissimo Hair Studio · Last updated 2026</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.intro}>
          Please read these Terms & Conditions carefully before booking any service with Bellissimo Hair Studio. By making a booking, you agree to be bound by these terms.
        </Text>

        {TERMS.map((section) => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <Text style={s.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={s.footer}>
          <Text style={s.footerText}>© 2026 Bellissimo Inc. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F9' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0E6E8',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#3B1C1A' },
  headerSub: { fontSize: 12, color: '#B89FA1', marginTop: 2 },
  content: { padding: 20, paddingBottom: 60 },
  intro: { fontSize: 15, color: '#5B3034', lineHeight: 24, marginBottom: 24, padding: 16, backgroundColor: '#FFF0F6', borderRadius: 14, borderLeftWidth: 3, borderLeftColor: '#B04A75' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#3B1C1A', marginBottom: 10 },
  sectionContent: { fontSize: 14, color: '#5B3034', lineHeight: 24 },
  footer: { marginTop: 16, alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F0E6E8' },
  footerText: { fontSize: 12, color: '#B89FA1' },
});