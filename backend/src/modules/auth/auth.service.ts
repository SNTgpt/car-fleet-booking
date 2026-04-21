import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma.service';
import { LdapService } from '../ldap/ldap.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private ldapService: LdapService,
  ) {}

  async login(dto: LoginDto) {
    // Try LDAP authentication first
    const ldapUser = await this.ldapService.authenticate(dto.username, dto.password);

    if (ldapUser) {
      // LDAP auth succeeded — find or create local user
      let user = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      if (user) {
        // Update name/email from AD if changed
        if (user.authSource === 'ldap') {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { name: ldapUser.name, email: ldapUser.email },
          });
        }
      } else {
        // Auto-create user from LDAP
        const config = await this.ldapService.getConfig();
        user = await this.prisma.user.create({
          data: {
            username: ldapUser.username,
            email: ldapUser.email,
            name: ldapUser.name,
            password: await bcrypt.hash('ldap-managed-' + Date.now(), 10),
            role: config?.defaultRole || 'user',
            authSource: 'ldap',
            isActive: true,
          },
        });
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Utente disabilitato');
      }

      return this.generateToken(user);
    }

    // Fall back to local authentication
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    // For LDAP users, don't allow local password login
    if (user.authSource === 'ldap') {
      throw new UnauthorizedException('Autenticazione tramite Active Directory non riuscita');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Credenziali non valide');
    }

    return this.generateToken(user);
  }

  private generateToken(user: { id: number; name: string; username: string; email: string; role: string }) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
