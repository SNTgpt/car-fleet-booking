import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(userId: number, action: string, entity: string, entityId: number, metadata?: any) {
    return this.prisma.auditLog.create({
      data: { userId, action, entity, entityId, metadata },
    });
  }

  async findAll(filters?: { entity?: string; userId?: number }) {
    const where: any = {};
    if (filters?.entity) where.entity = filters.entity;
    if (filters?.userId) where.userId = filters.userId;

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
