import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    create(body: {
        bookingId: number;
        clientName: string;
        rating: number;
        comment: string;
    }, req: any): Promise<import("./review.entity").Review>;
    findAll(): Promise<import("./review.entity").Review[]>;
    getStats(): Promise<{
        totalReviews: number;
        averageRating: number;
        satisfactionRate: number;
        happyClients: number;
    }>;
    getReviewForBooking(id: string): Promise<import("./review.entity").Review | null>;
    likeReview(id: string): Promise<import("./review.entity").Review>;
}
