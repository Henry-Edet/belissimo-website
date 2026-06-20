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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = exports.MessageSender = void 0;
const typeorm_1 = require("typeorm");
var MessageSender;
(function (MessageSender) {
    MessageSender["USER"] = "user";
    MessageSender["AI"] = "ai";
    MessageSender["ADMIN"] = "admin";
})(MessageSender || (exports.MessageSender = MessageSender = {}));
let ChatMessage = class ChatMessage {
};
exports.ChatMessage = ChatMessage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ChatMessage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_id' }),
    __metadata("design:type", String)
], ChatMessage.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_name', nullable: true }),
    __metadata("design:type", String)
], ChatMessage.prototype, "clientName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MessageSender, default: MessageSender.USER }),
    __metadata("design:type", String)
], ChatMessage.prototype, "sender", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ChatMessage.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ChatMessage.prototype, "reply", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'flagged_for_takeover', default: false }),
    __metadata("design:type", Boolean)
], ChatMessage.prototype, "flaggedForTakeover", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'admin_taken_over', default: false }),
    __metadata("design:type", Boolean)
], ChatMessage.prototype, "adminTakenOver", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ChatMessage.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ChatMessage.prototype, "createdAt", void 0);
exports.ChatMessage = ChatMessage = __decorate([
    (0, typeorm_1.Entity)('chat_message')
], ChatMessage);
//# sourceMappingURL=chat-message.entity.js.map