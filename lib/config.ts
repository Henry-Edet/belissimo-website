// lib/config.ts
// Central config — change YOUR_IP once and it updates everywhere

import Constants from 'expo-constants';

// ─── Your Mac's local IP on WiFi ─────────────────────────────────────────────
// Run `ipconfig getifaddr en0` in your terminal to get this
// Change this whenever your network changes
const LOCAL_IP = '192.168.3.131';
const LOCAL_PORT = '3000';

// ─── Environment detection ────────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';

// ─── API Base URL ─────────────────────────────────────────────────────────────
// • Development (USB/WiFi): http://YOUR_IP:3000
// • Production: your deployed backend URL
export const API_BASE_URL = isProduction
  ? 'https://your-production-api.com'   // 🔁 replace when you deploy
  : `http://${LOCAL_IP}:${LOCAL_PORT}`;

// ─── Individual endpoint helpers (optional but convenient) ───────────────────
export const ENDPOINTS = {
  // Auth
  login:    `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  logout:   `${API_BASE_URL}/auth/logout`,
  refresh:  `${API_BASE_URL}/auth/refresh`,

  // Services
  services: `${API_BASE_URL}/services`,

  // Bookings
  bookings:    `${API_BASE_URL}/bookings`,
  myBookings:  `${API_BASE_URL}/bookings/my-bookings`,

  // Gallery
  gallery:       `${API_BASE_URL}/gallery`,
  galleryUpload: `${API_BASE_URL}/gallery/upload`,

  // AI Chat
  aiMessage: `${API_BASE_URL}/ai/message`,

  // Reviews
  reviews:       `${API_BASE_URL}/reviews`,
  reviewStats:   `${API_BASE_URL}/reviews/stats`,
  reviewLike:    (id: number) => `${API_BASE_URL}/reviews/${id}/like`,
  reviewBooking: (id: number) => `${API_BASE_URL}/reviews/booking/${id}`,

  // Admin payment actions
  adminOwing:     (id: number) => `${API_BASE_URL}/admin/bookings/${id}/owing`,
  adminCompleted: (id: number) => `${API_BASE_URL}/admin/bookings/${id}/completed`,
  mePassword:     `${API_BASE_URL}/users/me/password`,

  // User profile
  me:             `${API_BASE_URL}/users/me`,
  changePassword: `${API_BASE_URL}/users/me/password`,
} as const;