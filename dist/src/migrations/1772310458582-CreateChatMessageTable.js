"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateChatMessageTable1772310458582 = void 0;
class CreateChatMessageTable1772310458582 {
    constructor() {
        this.name = 'CreateChatMessageTable1772310458582';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "chat_message" (
        "id" SERIAL NOT NULL,
        "session_id" varchar NOT NULL,
        "client_name" varchar,
        "sender" varchar NOT NULL DEFAULT 'user',
        "message" text NOT NULL,
        "reply" text,
        "flagged_for_takeover" boolean NOT NULL DEFAULT false,
        "admin_taken_over" boolean NOT NULL DEFAULT false,
        "action" varchar,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_message" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_chat_message_session"
      ON "chat_message" ("session_id")
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "chat_message"`);
    }
}
exports.CreateChatMessageTable1772310458582 = CreateChatMessageTable1772310458582;
//# sourceMappingURL=1772310458582-CreateChatMessageTable.js.map