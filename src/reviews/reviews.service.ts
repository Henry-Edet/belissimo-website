// src/reviews/reviews.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
  ) {}

  async create(dto: {
    bookingId: number;
    userId?: number;
    clientName: string;
    rating: number;
    comment: string;
  }): Promise<Review> {
    if (dto.rating < 1 || dto.rating > 5) throw new BadRequestException('Rating must be between 1 and 5');
    if (!dto.comment?.trim()) throw new BadRequestException('Comment is required');
    const existing = await this.reviewRepo.findOne({ where: { bookingId: dto.bookingId } });
    if (existing) throw new BadRequestException('You have already reviewed this booking');
    const review = this.reviewRepo.create(dto);
    return this.reviewRepo.save(review);
  }

  async findAll(): Promise<Review[]> {
    return this.reviewRepo.find({ order: { createdAt: 'DESC' } });
  }

  async likeReview(id: number): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new BadRequestException('Review not found');
    review.likes += 1;
    return this.reviewRepo.save(review);
  }

  // Return full review for a booking (null if none)
  async getReviewForBooking(bookingId: number): Promise<Review | null> {
    return this.reviewRepo.findOne({ where: { bookingId } }) ?? null;
  }

  async hasReview(bookingId: number): Promise<boolean> {
    const review = await this.reviewRepo.findOne({ where: { bookingId } });
    return !!review;
  }

  // Stats — satisfaction only meaningful with >= 3 reviews
  async getStats() {
    const reviews = await this.reviewRepo.find();
    if (reviews.length === 0) {
      return { totalReviews: 0, averageRating: 0, satisfactionRate: 0, happyClients: 0 };
    }
    const total = reviews.length;
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
    const happy = reviews.filter(r => r.rating >= 4).length;
    const satisfactionRate = total >= 3 ? Math.round((happy / total) * 100) : 0;
    return {
      totalReviews: total,
      averageRating: Math.round(avg * 10) / 10,
      satisfactionRate,
      happyClients: happy,
    };
  }
}