import { IsInt, IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  vehicleId: number;

  @IsDateString()
  startDatetime: string;

  @IsDateString()
  endDatetime: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
