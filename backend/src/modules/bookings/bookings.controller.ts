import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('vehicleId') vehicleId?: string,
  ) {
    return this.bookingsService.findAll({
      status,
      vehicleId: vehicleId ? parseInt(vehicleId) : undefined,
    });
  }

  @Get('my')
  findMy(@CurrentUser('sub') userId: number) {
    return this.bookingsService.findByUser(userId);
  }

  @Get('calendar')
  getCalendar(@Query('vehicleId') vehicleId?: string) {
    return this.bookingsService.getCalendarEvents(
      vehicleId ? parseInt(vehicleId) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBookingDto, @CurrentUser('sub') userId: number) {
    return this.bookingsService.create(dto, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingDto,
    @CurrentUser('sub') userId: number,
    @CurrentUser('role') role: string,
  ) {
    return this.bookingsService.update(id, dto, userId, role);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
    @CurrentUser('role') role: string,
  ) {
    return this.bookingsService.cancel(id, userId, role);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.bookingsService.updateStatus(id, status);
  }
}
