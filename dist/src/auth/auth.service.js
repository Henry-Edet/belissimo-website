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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const bcrypt = require("bcryptjs");
const jwt_1 = require("@nestjs/jwt");
const user_entity_1 = require("../users/user.entity");
let AuthService = class AuthService {
    constructor(userRepo, jwt) {
        this.userRepo = userRepo;
        this.jwt = jwt;
    }
    async register(email, password, role = user_entity_1.Role.CLIENT) {
        const exists = await this.userRepo.findOne({ where: { email } });
        if (exists)
            throw new common_1.ForbiddenException('Email already taken');
        const passwordHash = await bcrypt.hash(password, 10);
        const user = this.userRepo.create({ email, passwordHash, role });
        await this.userRepo.save(user);
        return { message: 'User created', email };
    }
    async login(email, password) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const tokens = await this.generateTokens(user);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }
    async generateTokens(user) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = await this.jwt.signAsync(payload, {
            expiresIn: '15m',
            secret: process.env.JWT_ACCESS_SECRET,
        });
        const refreshToken = await this.jwt.signAsync(payload, {
            expiresIn: '7d',
            secret: process.env.JWT_REFRESH_SECRET,
        });
        return { accessToken, refreshToken };
    }
    async updateRefreshToken(userId, refreshToken) {
        const hash = await bcrypt.hash(refreshToken, 10);
        await this.userRepo.update(userId, { refreshTokenHash: hash });
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user || !user.refresh_token_hash)
            throw new common_1.ForbiddenException('Access Denied');
        const valid = await bcrypt.compare(refreshToken, user.refresh_token_hash);
        if (!valid)
            throw new common_1.ForbiddenException('Access Denied');
        const tokens = await this.generateTokens(user);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }
    async logout(userId) {
        await this.userRepo.update(userId, { refreshTokenHash: undefined });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map