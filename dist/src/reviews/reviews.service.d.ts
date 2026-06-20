import { Repository } from 'typeorm';
import { Review } from './review.entity';
export declare class ReviewsService {
    private readonly reviewRepo;
    constructor(reviewRepo: Repository<Review>);
    create(dto: {
        bookingId: number;
        userId?: number;
        clientName: string;
        rating: number;
        comment: string;
    }): Promise<Review>;
    findAll(): Promise<Review[]>;
    likeReview(id: number): Promise<Review>;
    getReviewForBooking(bookingId: number): Promise<Review | null>;
    hasReview(bookingId: number): Promise<boolean>;
    getStats(): Promise<{
        totalReviews: number;
        averageRating: number;
        satisfactionRate: number;
        happyClients: number;
    }>;
}
