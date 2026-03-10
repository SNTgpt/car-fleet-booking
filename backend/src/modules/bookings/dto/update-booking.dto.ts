import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';

export class UpdateBookingDto {
  @IsOptional()
  @IsDateString()
  startDatetime?: string;

  @IsOptional()
  @IsDateString()
  endDatetime?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(['requested', 'approved', 'rejected', 'cancelled', 'completed'])
  status?: string;
}
