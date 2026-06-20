import { Repository } from 'typeorm';
import { AiService } from './ai.service';
import { UserMessageDto } from './ai-message.dto';
import { ChatMessage } from '../chat/chat-message.entity';
export declare class AiController {
    private readonly aiService;
    private readonly chatRepo;
    constructor(aiService: AiService, chatRepo: Repository<ChatMessage>);
    handleMessage(body: UserMessageDto): Promise<{
        reply: string;
        action: string;
        bookingId?: undefined;
        amountCents?: undefined;
        awaitingPaymentMethod?: undefined;
    } | {
        reply: string;
        action: string;
        bookingId: any;
        amountCents: number;
        awaitingPaymentMethod: boolean;
    } | {
        reply: string;
        action: string;
        bookingId: any;
        amountCents?: undefined;
        awaitingPaymentMethod?: undefined;
    } | {
        reply: null;
        action: string;
        takenOver: boolean;
    } | {
        reply: string;
        flaggedForAdmin: boolean;
        action: string;
        bookingId?: undefined;
        amountCents?: undefined;
        awaitingPaymentMethod?: undefined;
        takenOver?: undefined;
    } | {
        reply: string;
        flaggedForAdmin: boolean;
        action: string;
        bookingId: any;
        amountCents: number;
        awaitingPaymentMethod: boolean;
        takenOver?: undefined;
    } | {
        reply: string;
        flaggedForAdmin: boolean;
        action: string;
        bookingId: any;
        amountCents?: undefined;
        awaitingPaymentMethod?: undefined;
        takenOver?: undefined;
    }>;
}
