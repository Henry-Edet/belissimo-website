// src/reviews/reviews.controller.ts
import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtOptionalGuard } from '../auth/jwt-optional.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // POST /reviews — submit a review (auth optional — guests can review too)
  @Post()
  @UseGuards(JwtOptionalGuard)
  create(@Body() body: {
    bookingId: number;
    clientName: string;
    rating: number;
    comment: string;
  }, @Request() req: any) {
    return this.reviewsService.create({
      ...body,
      userId: req.user?.sub,
    });
  }

  // GET /reviews — all reviews for landing page
  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  // GET /reviews/stats — satisfaction stats for landing page
  @Get('stats')
  getStats() {
    return this.reviewsService.getStats();
  }

  // GET /reviews/booking/:id — return review for booking (or null)
  @Get('booking/:id')
  getReviewForBooking(@Param('id') id: string) {
    return this.reviewsService.getReviewForBooking(Number(id));
  }

  // PATCH /reviews/:id/like — like a review
  @Patch(':id/like')
  likeReview(@Param('id') id: string) {
    return this.reviewsService.likeReview(Number(id));
  }
}