import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: {
    location?: string;
    category?: string;
    status?: string;
  }) {
    const where: any = {};
    if (filters?.location) where.location = filters.location;
    if (filters?.category) where.category = filters.category;
    if (filters?.status) where.status = filters.status;

    return this.prisma.vehicle.findMany({
      where,
      include: {
        bookings: {
          where: {
            status: { in: ['approved', 'requested'] },
            endDatetime: { gte: new Date() },
          },
          select: {
            id: true,
            startDatetime: true,
            endDatetime: true,
            status: true,
          },
        },
      },
      orderBy: { brand: 'asc' },
    });
  }

  async findOne(id: number) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { startDatetime: 'desc' },
        },
      },
    });
    if (!vehicle) throw new NotFoundException('Veicolo non trovato');
    return vehicle;
  }

  async create(dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({ data: dto });
  }

  async update(id: number, dto: UpdateVehicleDto) {
    await this.findOne(id);
    return this.prisma.vehicle.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.vehicle.delete({ where: { id } });
  }

  async getLocations() {
    const results = await this.prisma.vehicle.findMany({
      select: { location: true },
      distinct: ['location'],
      orderBy: { location: 'asc' },
    });
    return results.map((r) => r.location);
  }

  async getCategories() {
    const results = await this.prisma.vehicle.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return results.map((r) => r.category);
  }
}
