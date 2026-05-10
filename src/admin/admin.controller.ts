// src/admin/admin.controller.ts

import {
  Controller, Get, Post, Patch, Param,
  Query, UseGuards, Body,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/role.decorator';
import { Role } from '../users/user.entity';

// ── PUBLIC routes — no auth required ─────────────────────────────────────────
// Clients poll this to receive admin messages in their chat screen
@Controller('admin/chat')
export class ChatClientController {
  constructor(private readonly adminService: AdminService) {}

  // GET /admin/chat/client/:sessionId
  // Called by the CLIENT every 5s to get admin messages — NO admin role needed
  @Get('client/:sessionId')
  getClientMessages(@Param('sessionId') sessionId: string) {
    return this.adminService.getClientSessionMessages(sessionId);
  }
}

// ── ADMIN-ONLY routes ─────────────────────────────────────────────────────────
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard ───────────────────────────────────────────────────────────────
  @Get('stats')
  getStats() { return this.adminService.getStats(); }

  @Get('revenue')
  getRevenue() { return this.adminService.getRevenue(); }

  // ── Bookings ────────────────────────────────────────────────────────────────
  @Get('bookings')
  getAllBookings(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.getAllBookings(
      status,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Patch('bookings/:id/confirm')
  confirmBooking(@Param('id') id: string) { return this.adminService.confirmBooking(parseInt(id)); }

  @Patch('bookings/:id/cancel')
  cancelBooking(@Param('id') id: string) { return this.adminService.cancelBooking(parseInt(id)); }

  @Patch('bookings/:id/owing')
  markOwing(@Param('id') id: string, @Body() body: { balanceCents: number }) {
    return this.adminService.markOwing(parseInt(id), body.balanceCents);
  }

  @Patch('bookings/:id/completed')
  markCompleted(@Param('id') id: string) { return this.adminService.markCompleted(parseInt(id)); }

  // ── Clients ─────────────────────────────────────────────────────────────────
  @Get('clients')
  getAllClients() { return this.adminService.getAllClients(); }

  // ── Chat (admin view) ───────────────────────────────────────────────────────
  @Get('chat/sessions')
  getChatSessions() { return this.adminService.getChatSessions(); }

  @Get('chat/sessions/:sessionId')
  getChatSession(@Param('sessionId') sessionId: string) {
    return this.adminService.getChatSession(sessionId);
  }

  @Patch('chat/sessions/:sessionId/flag')
  flagSession(@Param('sessionId') sessionId: string) { return this.adminService.flagSession(sessionId); }

  @Patch('chat/sessions/:sessionId/takeover')
  takeoverSession(@Param('sessionId') sessionId: string) { return this.adminService.takeoverSession(sessionId); }

  @Patch('chat/sessions/:sessionId/release')
  releaseSession(@Param('sessionId') sessionId: string) { return this.adminService.releaseSession(sessionId); }

  @Post('chat/sessions/:sessionId/send')
  sendAdminMessage(@Param('sessionId') sessionId: string, @Body() body: { message: string }) {
    return this.adminService.sendAdminChatMessage(sessionId, body.message);
  }

  // ── One-time cleanup ────────────────────────────────────────────────────────
  @Post('chat/clear')
  clearAllChat() { return this.adminService.clearAllChatHistory(); }
}