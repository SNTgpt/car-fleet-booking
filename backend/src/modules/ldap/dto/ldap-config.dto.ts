import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateLdapConfigDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  createdAt?: any;

  @IsOptional()
  updatedAt?: any;
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  serverUrl?: string;

  @IsOptional()
  @IsString()
  bindDn?: string;

  @IsOptional()
  @IsString()
  bindPassword?: string;

  @IsOptional()
  @IsString()
  searchBase?: string;

  @IsOptional()
  @IsString()
  searchFilter?: string;

  @IsOptional()
  @IsString()
  emailAttribute?: string;

  @IsOptional()
  @IsString()
  nameAttribute?: string;

  @IsOptional()
  @IsEnum(Role)
  defaultRole?: Role;

  @IsOptional()
  @IsBoolean()
  syncEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  syncIntervalMin?: number;

  @IsOptional()
  @IsBoolean()
  tlsRejectUnauthorized?: boolean;
}
