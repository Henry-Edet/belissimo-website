"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const express = require("express");
const bodyParser = require("body-parser");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const expressApp = express();
    expressApp.post('/payments/webhook', bodyParser.raw({ type: 'application/json' }));
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressApp), { bodyParser: false });
    app.use(bodyParser.json({
        verify: (req, res, buf) => {
            req.rawBody = buf;
        },
    }));
    app.enableCors({ origin: '*' });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Bellissimo Hair Studio API')
        .setDescription('Complete API documentation for Bellissimo Hair Studio booking system')
        .setVersion('1.0')
        .addTag('auth', 'Authentication endpoints')
        .addTag('services', 'Hair services management')
        .addTag('bookings', 'Booking and appointment management')
        .addTag('payments', 'Payment processing')
        .addTag('users', 'User management')
        .addTag('gallery', 'Image gallery and uploads')
        .addTag('ai', 'AI chatbot assistant')
        .addTag('chat', 'Chat functionality')
        .addTag('notifications', 'Notification system')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'JWT', description: 'Enter JWT token', in: 'header' }, 'access-token')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'JWT', description: 'Enter refresh token', in: 'header' }, 'refresh-token')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document, {
        customSiteTitle: 'Bellissimo API Docs',
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
            docExpansion: 'none',
            filter: true,
        },
    });
    const port = process.env.PORT ?? 8080;
    await app.listen(port, '0.0.0.0');
    console.log('============================================');
    console.log(`🚀 Backend running on http://0.0.0.0:${port}`);
    console.log(`📚 API Docs: http://0.0.0.0:${port}/api`);
    console.log('============================================');
}
bootstrap();
//# sourceMappingURL=main.js.map