"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ai_service_1 = require("./ai.service");
const ai_message_dto_1 = require("./ai-message.dto");
const admin_service_1 = require("../admin/admin.service");
const chat_message_entity_1 = require("../chat/chat-message.entity");
let AiController = class AiController {
    constructor(aiService, chatRepo) {
        this.aiService = aiService;
        this.chatRepo = chatRepo;
    }
    async handleMessage(body) {
        const userId = body.userId ?? 'anonymous';
        const clientName = body.clientName ?? null;
        const message = body.message ?? '';
        const wantsHuman = /\b(human|agent|person|real person|speak to someone|talk to someone|staff|manager|stylist|help me|urgent)\b/i.test(message);
        if (admin_service_1.takenOverSessions.has(userId)) {
            await this.chatRepo.save(this.chatRepo.create({
                sessionId: userId,
                clientName: clientName ?? undefined,
                sender: chat_message_entity_1.MessageSender.USER,
                message,
                flaggedForTakeover: true,
                adminTakenOver: true,
            }));
            return {
                reply: null,
                action: 'NONE',
                takenOver: true,
            };
        }
        const result = await this.aiService.handleMessageAndPersist(message, userId, clientName);
        if (wantsHuman) {
            await this.chatRepo
                .createQueryBuilder()
                .update(chat_message_entity_1.ChatMessage)
                .set({ flaggedForTakeover: true })
                .where('session_id = :userId', { userId })
                .execute();
            return {
                ...result,
                reply: "I completely understand! Let me connect you with one of our team members right away. 💛 Please hold on — a Bellissimo stylist will be with you shortly.",
                flaggedForAdmin: true,
            };
        }
        return result;
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('message'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_message_dto_1.UserMessageDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "handleMessage", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    __param(1, (0, typeorm_1.InjectRepository)(chat_message_entity_1.ChatMessage)),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        typeorm_2.Repository])
], AiController);
//# sourceMappingURL=ai.controller.js.map