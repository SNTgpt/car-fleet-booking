import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { LdapService } from './ldap.service';
import { UpdateLdapConfigDto } from './dto/ldap-config.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('ldap')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class LdapController {
  constructor(private readonly ldapService: LdapService) {}

  @Get('config')
  async getConfig() {
    const config = await this.ldapService.getConfig();
    if (!config) return null;
    // Never return the bind password to the frontend
    return { ...config, bindPassword: config.bindPassword ? '********' : '' };
  }

  @Put('config')
  async updateConfig(@Body() dto: UpdateLdapConfigDto) {
    // If password is masked, don't update it
    if (dto.bindPassword === '********') {
      delete dto.bindPassword;
    }
    return this.ldapService.upsertConfig(dto);
  }

  @Post('test')
  async testConnection(@Body() dto: UpdateLdapConfigDto) {
    return this.ldapService.testConnectionWith(dto);
  }

  @Post('sync')
  async syncUsers() {
    return this.ldapService.syncUsers();
  }
}
