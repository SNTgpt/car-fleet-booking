import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { AuditModule } from './modules/audit/audit.module';
import { PrismaModule } from './common/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    BookingsModule,
    AuditModule,
  ],
})
export class AppModule {}
