// src/admin/admin.service.ts

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, PaymentStatus } from '../bookings/booking.entity';
import { User } from '../users/user.entity';
import { Service } from '../services/service.entity';
import { Payment, PaymentStatus as StripePaymentStatus } from '../payments/payment.entity';
import { ChatMessage } from '../chat/chat-message.entity';
import { NotificationsService } from '../notifications/notification.service';

// Shared in-memory takeover store
// Imported by ai.controller.ts to check before calling Bella
export const takenOverSessions = new Set<string>();

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(ChatMessage)
    private readonly chatRepo: Repository<ChatMessage>,
    private readonly notifications: NotificationsService,
  ) {}

  // ── Dashboard Stats ───────────────────────────────────────────────────────

  async getStats() {
    const [total, pending, confirmed, cancelled, completed, totalClients] =
      await Promise.all([
        this.bookingRepo.count(),
        this.bookingRepo.count({ where: { status: 'pending' } }),
        this.bookingRepo.count({ where: { status: 'confirmed' } }),
        this.bookingRepo.count({ where: { status: 'cancelled' } }),
        this.bookingRepo.count({ where: { status: 'completed' } }),
        this.userRepo.count(),
      ]);

    const paidPayments = await this.paymentRepo.find({
      where: { status: StripePaymentStatus.PAID },
    });
    const totalRevenueCents = paidPayments.reduce((sum, p) => sum + (p.amountCents || 0), 0);
    const totalRevenue = (totalRevenueCents / 100).toFixed(2);
    const totalPayments = paidPayments.length;

    const aiBookings = await this.chatRepo.count({
      where: { action: 'CREATE_BOOKING_AND_PAYMENT' },
    });

    const recentBookings = await this.bookingRepo.find({
      order: { startAt: 'DESC' },
      take: 10,
      relations: ['service'],
    });

    return {
      totalBookings: total,
      pending,
      confirmed,
      cancelled,
      completed,
      totalClients,
      totalRevenue,
      totalPayments,
      aiBookings,
      recentBookings,
    };
  }

  // ── Revenue Details ───────────────────────────────────────────────────────

  async getRevenue() {
    const payments = await this.paymentRepo.find({
      where: { status: StripePaymentStatus.PAID },
      order: { createdAt: 'DESC' },
    });

    const totalCents = payments.reduce((sum, p) => sum + (p.amountCents || 0), 0);

    const byMonth: Record<string, number> = {};
    payments.forEach((p) => {
      const month = new Date(p.createdAt).toLocaleDateString('en-US', {
        month: 'short', year: 'numeric',
      });
      byMonth[month] = (byMonth[month] || 0) + p.amountCents;
    });

    return {
      totalRevenueCents: totalCents,
      totalRevenue: `$${(totalCents / 100).toFixed(2)}`,
      paymentCount: payments.length,
      byMonth: Object.entries(byMonth).map(([month, cents]) => ({
        month, revenue: `$${(cents / 100).toFixed(2)}`, cents,
      })),
      recentPayments: payments.slice(0, 20),
    };
  }

  // ── All Bookings ──────────────────────────────────────────────────────────

  async getAllBookings(status?: string, limit = 50, offset = 0) {
    const where = status ? { status } : {};
    const [bookings, total] = await this.bookingRepo.findAndCount({
      where,
      order: { startAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['service'],
    });
    return { bookings, total };
  }

  // ── Confirm Booking ───────────────────────────────────────────────────────

  async confirmBooking(id: number): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException(`Booking #${id} not found`);
    booking.status = 'confirmed';
    return this.bookingRepo.save(booking);
  }

  // ── Cancel Booking ────────────────────────────────────────────────────────

  async cancelBooking(id: number): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException(`Booking #${id} not found`);
    booking.status = 'cancelled';
    const saved = await this.bookingRepo.save(booking);
    await this.notifications.notifyCancelledBooking(saved);
    return saved;
  }

  // ── Mark Owing ────────────────────────────────────────────────────────────

  async markOwing(id: number, balanceCents: number): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException(`Booking #${id} not found`);
    booking.paymentStatus = PaymentStatus.OWING;
    booking.balanceCents = balanceCents;
    const saved = await this.bookingRepo.save(booking);
    await this.notifications.sendOwnerEmail(
      `Client Owing — Booking #${id}`,
      `${booking.clientName} has an outstanding balance of $${(balanceCents / 100).toFixed(2)}.`,
    );
    return saved;
  }

  // ── Mark Payment Completed ────────────────────────────────────────────────

  async markCompleted(id: number): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException(`Booking #${id} not found`);
    booking.paymentStatus = PaymentStatus.COMPLETED;
    booking.balanceCents = 0;
    const saved = await this.bookingRepo.save(booking);
    await this.notifications.sendOwnerEmail(
      `Payment Completed — Booking #${id}`,
      `${booking.clientName} has completed full payment for booking #${id}.`,
    );
    return saved;
  }

  // ── All Clients ───────────────────────────────────────────────────────────

  async getAllClients() {
    return this.userRepo.find({
      order: { createdAt: 'DESC' },
      select: ['id', 'email', 'firstName', 'lastName', 'phone', 'role', 'createdAt'],
    });
  }

  // ── Chat Monitor ──────────────────────────────────────────────────────────

  async getChatSessions() {
    const sessions = await this.chatRepo
      .createQueryBuilder('m')
      .select('m.session_id', 'sessionId')
      .addSelect('MAX(m.created_at)', 'lastActivity')
      .addSelect('MAX(m.client_name)', 'clientName') // MAX picks non-null value
      .addSelect('COUNT(m.id)', 'messageCount')
      .addSelect('BOOL_OR(m.flagged_for_takeover)', 'flagged')
      .addSelect('BOOL_OR(m.admin_taken_over)', 'takenOver')
      .groupBy('m.session_id') // group ONLY by sessionId — not client_name
      .orderBy('MAX(m.created_at)', 'DESC')
      .limit(50)
      .getRawMany();

    return sessions.map((s) => ({
      ...s,
      takenOver: s.takenOver || takenOverSessions.has(s.sessionId),
    }));
  }

  async getChatSession(sessionId: string) {
    return this.chatRepo.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  async flagSession(sessionId: string): Promise<{ message: string }> {
    await this.chatRepo
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ flaggedForTakeover: true })
      .where('session_id = :sessionId', { sessionId })
      .execute();
    return { message: `Session ${sessionId} flagged for admin takeover` };
  }

  // ── Chat Takeover ─────────────────────────────────────────────────────────

  // Admin takes over — Bella goes quiet for this session
  async takeoverSession(sessionId: string): Promise<{ sessionId: string; takenOver: boolean }> {
    takenOverSessions.add(sessionId);

    // Also mark in DB for persistence across restarts
    await this.chatRepo
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ adminTakenOver: true, flaggedForTakeover: false })
      .where('session_id = :sessionId', { sessionId })
      .execute();

    await this.notifications.sendOwnerEmail(
      `Chat Takeover — Session ${sessionId}`,
      `You have taken over chat session ${sessionId}. Bella will not respond until you release.`,
    );

    return { sessionId, takenOver: true };
  }

  // Admin releases — Bella resumes
  async releaseSession(sessionId: string): Promise<{ sessionId: string; takenOver: boolean }> {
    takenOverSessions.delete(sessionId);
    return { sessionId, takenOver: false };
  }

  // Admin sends a message directly into the client's chat session
  async sendAdminChatMessage(sessionId: string, message: string): Promise<ChatMessage> {
    const msg = this.chatRepo.create({
      sessionId,
      sender: 'admin' as any,
      message,
      reply: message,
      createdAt: new Date(),
    });
    return this.chatRepo.save(msg);
  }

  // ── Client polls this to get full session including admin messages ─────────
  async getClientSessionMessages(sessionId: string) {
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const msgs = await this.chatRepo.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
    return msgs.filter(m => new Date(m.createdAt) > cutoff);
  }

  // ── Clear ALL chat history (one-time cleanup) ─────────────────────────────
  async clearAllChatHistory(): Promise<{ deleted: number }> {
    const result = await this.chatRepo.createQueryBuilder()
      .delete().from(ChatMessage).execute();
    return { deleted: result.affected ?? 0 };
  }
  async cleanupOldMessages(): Promise<number> {
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const result = await this.chatRepo
      .createQueryBuilder()
      .delete()
      .from(ChatMessage)
      .where('created_at < :cutoff', { cutoff })
      .execute();
    const deleted = result.affected ?? 0;
    if (deleted > 0) this.logger.log(`Cleaned up ${deleted} chat messages older than 72 hours`);
    return deleted;
  }
}