import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { status?: string; vehicleId?: number }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.vehicleId) where.vehicleId = filters.vehicleId;

    return this.prisma.booking.findMany({
      where,
      include: {
        vehicle: { select: { id: true, brand: true, model: true, plate: true, location: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startDatetime: 'desc' },
    });
  }

  async findByUser(userId: number) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        vehicle: { select: { id: true, brand: true, model: true, plate: true, location: true } },
      },
      orderBy: { startDatetime: 'desc' },
    });
  }

  async findOne(id: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        vehicle: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!booking) throw new NotFoundException('Prenotazione non trovata');
    return booking;
  }

  async create(dto: CreateBookingDto, userId: number) {
    await this.checkOverlap(dto.vehicleId, new Date(dto.startDatetime), new Date(dto.endDatetime));

    return this.prisma.booking.create({
      data: {
        vehicleId: dto.vehicleId,
        userId,
        startDatetime: new Date(dto.startDatetime),
        endDatetime: new Date(dto.endDatetime),
        reason: dto.reason,
        status: 'requested',
      },
      include: {
        vehicle: { select: { id: true, brand: true, model: true, plate: true } },
      },
    });
  }

  async update(id: number, dto: UpdateBookingDto, userId: number, role: string) {
    const booking = await this.findOne(id);

    if (role !== 'admin' && booking.userId !== userId) {
      throw new ForbiddenException('Non puoi modificare questa prenotazione');
    }

    if (role !== 'admin' && !['requested'].includes(booking.status)) {
      throw new ForbiddenException('Prenotazione non modificabile');
    }

    if (dto.startDatetime || dto.endDatetime) {
      const start = dto.startDatetime ? new Date(dto.startDatetime) : booking.startDatetime;
      const end = dto.endDatetime ? new Date(dto.endDatetime) : booking.endDatetime;
      await this.checkOverlap(booking.vehicleId, start, end, id);
    }

    const data: any = {};
    if (dto.startDatetime) data.startDatetime = new Date(dto.startDatetime);
    if (dto.endDatetime) data.endDatetime = new Date(dto.endDatetime);
    if (dto.reason) data.reason = dto.reason;
    if (dto.status) data.status = dto.status;

    return this.prisma.booking.update({
      where: { id },
      data,
      include: {
        vehicle: { select: { id: true, brand: true, model: true, plate: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async cancel(id: number, userId: number, role: string) {
    const booking = await this.findOne(id);

    if (role !== 'admin' && booking.userId !== userId) {
      throw new ForbiddenException('Non puoi annullare questa prenotazione');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  async updateStatus(id: number, status: string) {
    await this.findOne(id);
    return this.prisma.booking.update({
      where: { id },
      data: { status: status as any },
      include: {
        vehicle: { select: { id: true, brand: true, model: true, plate: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  private async checkOverlap(
    vehicleId: number,
    start: Date,
    end: Date,
    excludeId?: number,
  ) {
    const where: any = {
      vehicleId,
      status: { in: ['requested', 'approved'] },
      startDatetime: { lt: end },
      endDatetime: { gt: start },
    };
    if (excludeId) where.id = { not: excludeId };

    const overlap = await this.prisma.booking.findFirst({ where });
    if (overlap) {
      throw new ConflictException(
        'Il veicolo ha già una prenotazione in questo intervallo di tempo',
      );
    }
  }

  async getCalendarEvents(vehicleId?: number) {
    const where: any = {
      status: { in: ['requested', 'approved'] },
    };
    if (vehicleId) where.vehicleId = vehicleId;

    return this.prisma.booking.findMany({
      where,
      include: {
        vehicle: { select: { brand: true, model: true, plate: true } },
        user: { select: { name: true } },
      },
    });
  }
}
