// lib/config.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const LOCAL_IP = '192.168.3.131';
const LOCAL_PORT = '3000';

// In a real device build or production, use the deployed backend
// In Expo Go / web dev, use local IP
const isDev = __DEV__;

export const API_BASE_URL = 'https://bellissimo-backend.onrender.com';

export const ENDPOINTS = {
  login:    `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  logout:   `${API_BASE_URL}/auth/logout`,
  refresh:  `${API_BASE_URL}/auth/refresh`,

  services: `${API_BASE_URL}/services`,

  bookings:   `${API_BASE_URL}/bookings`,
  myBookings: `${API_BASE_URL}/bookings/my-bookings`,

  gallery:       `${API_BASE_URL}/gallery`,
  galleryUpload: `${API_BASE_URL}/gallery/upload`,

  aiMessage: `${API_BASE_URL}/ai/message`,

  reviews:       `${API_BASE_URL}/reviews`,
  reviewStats:   `${API_BASE_URL}/reviews/stats`,
  reviewLike:    (id: number) => `${API_BASE_URL}/reviews/${id}/like`,
  reviewBooking: (id: number) => `${API_BASE_URL}/reviews/booking/${id}`,

  adminOwing:     (id: number) => `${API_BASE_URL}/admin/bookings/${id}/owing`,
  adminCompleted: (id: number) => `${API_BASE_URL}/admin/bookings/${id}/completed`,

  me:             `${API_BASE_URL}/users/me`,
  changePassword: `${API_BASE_URL}/users/me/password`,
  mePassword:     `${API_BASE_URL}/users/me/password`,
} as const;