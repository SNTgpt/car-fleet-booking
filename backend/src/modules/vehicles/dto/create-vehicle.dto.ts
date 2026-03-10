import { IsString, IsNotEmpty, IsInt, IsOptional, IsEnum, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  fuelType: string;

  @IsInt()
  @Min(1)
  seats: number;

  @IsOptional()
  @IsEnum(['available', 'maintenance', 'unavailable', 'booked'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
