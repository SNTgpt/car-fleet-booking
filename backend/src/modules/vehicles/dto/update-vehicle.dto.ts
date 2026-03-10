import { IsString, IsOptional, IsInt, IsEnum, Min } from 'class-validator';

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  plate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  seats?: number;

  @IsOptional()
  @IsEnum(['available', 'maintenance', 'unavailable', 'booked'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
