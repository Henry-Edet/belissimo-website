export declare enum MessageSender {
    USER = "user",
    AI = "ai",
    ADMIN = "admin"
}
export declare class ChatMessage {
    id: number;
    sessionId: string;
    clientName?: string;
    sender: MessageSender;
    message: string;
    reply?: string;
    flaggedForTakeover: boolean;
    adminTakenOver: boolean;
    action?: string;
    createdAt: Date;
}
