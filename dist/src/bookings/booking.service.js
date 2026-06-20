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
var BookingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const booking_entity_1 = require("./booking.entity");
const service_entity_1 = require("../services/service.entity");
const notification_service_1 = require("../notifications/notification.service");
let BookingService = BookingService_1 = class BookingService {
    constructor(bookingRepository, serviceRepository, notifications) {
        this.bookingRepository = bookingRepository;
        this.serviceRepository = serviceRepository;
        this.notifications = notifications;
        this.logger = new common_1.Logger(BookingService_1.name);
    }
    async create(createBookingDto, userId) {
        console.log('📝 Creating booking:', createBookingDto);
        const { serviceId, clientName, clientPhone, startAt, subServiceName } = createBookingDto;
        if (!serviceId || !clientName || !clientPhone || !startAt) {
            throw new common_1.BadRequestException('All fields are required');
        }
        const start = new Date(startAt);
        if (isNaN(start.getTime())) {
            throw new common_1.BadRequestException('Invalid start date');
        }
        const service = await this.serviceRepository.findOne({ where: { id: serviceId } });
        if (!service)
            throw new common_1.NotFoundException('Service not found');
        const duration = service.durationMinutes || 120;
        const endAt = new Date(start.getTime() + duration * 60000);
        const overlaps = await this.bookingRepository
            .createQueryBuilder('b')
            .where('b."serviceId" = :serviceId', { serviceId })
            .andWhere('b.status != :cancelled', { cancelled: 'cancelled' })
            .andWhere('b."startAt" < :endAt AND b."endAt" > :startAt', { startAt: start, endAt })
            .getCount();
        if (overlaps > 0)
            throw new common_1.ConflictException('This time slot is already booked');
        const booking = this.bookingRepository.create({
            serviceId,
            clientName,
            clientPhone,
            startAt: start,
            endAt,
            status: 'pending',
            subServiceName,
            userId,
        });
        try {
            const saved = await this.bookingRepository.save(booking);
            console.log('✅ Booking created:', saved.id);
            await this.notifications.notifyNewBooking(saved);
            return saved;
        }
        catch (error) {
            if (error.code === '23P01') {
                throw new common_1.ConflictException('This time slot was just booked by another customer');
            }
            throw error;
        }
    }
    async findMyBookings(userId) {
        return this.bookingRepository.find({
            where: { userId },
            order: { startAt: 'DESC' },
            relations: ['service'],
        });
    }
    async findByClientPhone(clientPhone) {
        return this.bookingRepository.find({
            where: { clientPhone },
            order: { startAt: 'DESC' },
        });
    }
    async checkAvailability(serviceId, startAt, durationMinutes) {
        try {
            const service = await this.serviceRepository.findOne({ where: { id: serviceId } });
            if (!service)
                return { available: false, message: 'Service not found' };
            const duration = durationMinutes || service.durationMinutes || 120;
            const endAt = new Date(startAt.getTime() + duration * 60000);
            const overlapping = await this.bookingRepository
                .createQueryBuilder('booking')
                .where('booking."serviceId" = :serviceId', { serviceId })
                .andWhere('booking.status != :cancelled', { cancelled: 'cancelled' })
                .andWhere('booking."startAt" < :endAt AND booking."endAt" > :startAt', { startAt, endAt })
                .getCount();
            return overlapping > 0
                ? { available: false, message: 'Time slot is already booked' }
                : { available: true };
        }
        catch (error) {
            return { available: false, message: 'Error checking availability' };
        }
    }
    async findOne(id) {
        const booking = await this.bookingRepository.findOne({ where: { id } });
        if (!booking)
            throw new common_1.NotFoundException(`Booking ${id} not found`);
        return booking;
    }
    async cancelBooking(id) {
        const booking = await this.findOne(id);
        booking.status = 'cancelled';
        const saved = await this.bookingRepository.save(booking);
        await this.notifications.notifyCancelledBooking(saved);
        return saved;
    }
    async getStats() {
        const clientResult = await this.bookingRepository
            .createQueryBuilder('b')
            .select('COUNT(DISTINCT b."clientPhone")', 'count')
            .where('b.status != :cancelled', { cancelled: 'cancelled' })
            .getRawOne();
        const totalClients = parseInt(clientResult?.count || '0', 10);
        const totalBookings = await this.bookingRepository.count();
        const positiveBookings = await this.bookingRepository.count({
            where: [{ status: 'completed' }, { status: 'confirmed' }],
        });
        const satisfactionRate = totalBookings > 0
            ? Math.round((positiveBookings / totalBookings) * 100)
            : 98;
        return {
            totalClients,
            satisfactionRate,
            totalReviews: totalBookings,
        };
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = BookingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(1, (0, typeorm_1.InjectRepository)(service_entity_1.Service)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        notification_service_1.NotificationsService])
], BookingService);
//# sourceMappingURL=booking.service.js.map