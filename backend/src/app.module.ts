import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { AuditModule } from './modules/audit/audit.module';
import { LdapModule } from './modules/ldap/ldap.module';
import { PrismaModule } from './common/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    VehiclesModule,
    BookingsModule,
    AuditModule,
    LdapModule,
  ],
})
export class AppModule {}
