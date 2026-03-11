import { PrismaClient, Role, VehicleStatus, BookingStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  const userHash = await bcrypt.hash('password123', 10);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@example.com',
      password: hash,
      role: Role.admin,
      isActive: true,
    },
  });

  // Demo users
  const user1 = await prisma.user.upsert({
    where: { email: 'mario.rossi@example.com' },
    update: {},
    create: {
      name: 'Mario Rossi',
      email: 'mario.rossi@example.com',
      password: userHash,
      role: Role.user,
      isActive: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'laura.bianchi@example.com' },
    update: {},
    create: {
      name: 'Laura Bianchi',
      email: 'laura.bianchi@example.com',
      password: userHash,
      role: Role.user,
      isActive: true,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'paolo.verdi@example.com' },
    update: {},
    create: {
      name: 'Paolo Verdi',
      email: 'paolo.verdi@example.com',
      password: userHash,
      role: Role.user,
      isActive: true,
    },
  });

  // Vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { plate: 'AB123CD' },
      update: {},
      create: {
        brand: 'Fiat',
        model: '500e',
        plate: 'AB123CD',
        location: 'Milano',
        category: 'Citycar',
        fuelType: 'Elettrica',
        seats: 4,
        status: VehicleStatus.available,
        notes: 'Veicolo elettrico, autonomia ~300km',
      },
    }),
    prisma.vehicle.upsert({
      where: { plate: 'EF456GH' },
      update: {},
      create: {
        brand: 'Volkswagen',
        model: 'Passat',
        plate: 'EF456GH',
        location: 'Roma',
        category: 'Berlina',
        fuelType: 'Diesel',
        seats: 5,
        status: VehicleStatus.available,
      },
    }),
    prisma.vehicle.upsert({
      where: { plate: 'IL789MN' },
      update: {},
      create: {
        brand: 'Toyota',
        model: 'Yaris Cross',
        plate: 'IL789MN',
        location: 'Milano',
        category: 'SUV',
        fuelType: 'Ibrida',
        seats: 5,
        status: VehicleStatus.available,
      },
    }),
    prisma.vehicle.upsert({
      where: { plate: 'OP012QR' },
      update: {},
      create: {
        brand: 'BMW',
        model: 'Serie 3',
        plate: 'OP012QR',
        location: 'Torino',
        category: 'Berlina',
        fuelType: 'Benzina',
        seats: 5,
        status: VehicleStatus.maintenance,
        notes: 'In manutenzione fino al 15/04',
      },
    }),
    prisma.vehicle.upsert({
      where: { plate: 'ST345UV' },
      update: {},
      create: {
        brand: 'Mercedes',
        model: 'Vito',
        plate: 'ST345UV',
        location: 'Roma',
        category: 'Van',
        fuelType: 'Diesel',
        seats: 9,
        status: VehicleStatus.available,
        notes: 'Trasporto gruppi',
      },
    }),
  ]);

  // Bookings
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekEnd = new Date(nextWeek);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 1);

  await prisma.booking.createMany({
    data: [
      {
        vehicleId: vehicles[0].id,
        userId: user1.id,
        startDatetime: tomorrow,
        endDatetime: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000),
        reason: 'Visita cliente a Bergamo',
        status: BookingStatus.approved,
      },
      {
        vehicleId: vehicles[1].id,
        userId: user2.id,
        startDatetime: nextWeek,
        endDatetime: nextWeekEnd,
        reason: 'Trasferta ufficio Napoli',
        status: BookingStatus.requested,
      },
      {
        vehicleId: vehicles[2].id,
        userId: user3.id,
        startDatetime: now,
        endDatetime: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        reason: 'Consegna materiale sede Monza',
        status: BookingStatus.completed,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
