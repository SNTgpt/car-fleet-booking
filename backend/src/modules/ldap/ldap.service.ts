import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UpdateLdapConfigDto } from './dto/ldap-config.dto';
import { LdapConfig, Role } from '@prisma/client';
import * as ldap from 'ldapjs';
import * as bcrypt from 'bcryptjs';

interface LdapUser {
  username: string;
  email: string;
  name: string;
}

@Injectable()
export class LdapService implements OnModuleInit {
  private readonly logger = new Logger(LdapService.name);
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.scheduleSyncTimer();
  }

  async scheduleSyncTimer() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    const config = await this.getConfig();
    if (!config?.enabled || !config?.syncEnabled) return;

    const intervalMs = (config.syncIntervalMin || 30) * 60 * 1000;
    this.logger.log(`Sincronizzazione AD programmata ogni ${config.syncIntervalMin || 30} minuti`);

    this.syncTimer = setInterval(async () => {
      await this.handleScheduledSync();
    }, intervalMs);
  }

  private async handleScheduledSync() {
    const config = await this.getConfig();
    if (!config?.enabled || !config?.syncEnabled) return;

    this.logger.log('Sincronizzazione AD programmata avviata...');
    try {
      const result = await this.syncUsers();
      this.logger.log(`Sincronizzazione AD completata: ${result.created} creati, ${result.updated} aggiornati su ${result.total} utenti`);
    } catch (error) {
      this.logger.error(`Sincronizzazione AD fallita: ${error.message}`);
    }
  }

  async getConfig(): Promise<LdapConfig | null> {
    return this.prisma.ldapConfig.findUnique({ where: { id: 1 } });
  }

  async upsertConfig(dto: UpdateLdapConfigDto): Promise<LdapConfig> {
    const existing = await this.prisma.ldapConfig.findUnique({ where: { id: 1 } });

    let result: LdapConfig;
    if (existing) {
      result = await this.prisma.ldapConfig.update({
        where: { id: 1 },
        data: dto,
      });
    } else {
      result = await this.prisma.ldapConfig.create({
        data: {
          id: 1,
          serverUrl: dto.serverUrl || '',
          bindDn: dto.bindDn || '',
          bindPassword: dto.bindPassword || '',
          searchBase: dto.searchBase || '',
          searchFilter: dto.searchFilter || '(sAMAccountName={{username}})',
          emailAttribute: dto.emailAttribute || 'mail',
          nameAttribute: dto.nameAttribute || 'displayName',
          defaultRole: dto.defaultRole || 'user',
          enabled: dto.enabled ?? false,
          syncEnabled: dto.syncEnabled ?? false,
          syncIntervalMin: dto.syncIntervalMin ?? 30,
          tlsRejectUnauthorized: dto.tlsRejectUnauthorized ?? true,
        },
      });
    }

    // Reschedule sync timer with new settings
    await this.scheduleSyncTimer();
    return result;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig();
    if (!config) {
      return { success: false, message: 'Configurazione LDAP non trovata' };
    }

    try {
      const client = this.createClient(config);
      await this.bindClient(client, config.bindDn, config.bindPassword);
      client.unbind();
      return { success: true, message: 'Connessione riuscita' };
    } catch (error) {
      return { success: false, message: `Errore: ${error.message}` };
    }
  }

  async testConnectionWith(params: Partial<LdapConfig>): Promise<{ success: boolean; message: string }> {
    // Merge with saved config if exists, so masked password is resolved
    const saved = await this.getConfig();
    const serverUrl = params.serverUrl || saved?.serverUrl;
    const bindDn = params.bindDn || saved?.bindDn;
    const bindPassword = (params.bindPassword && params.bindPassword !== '********')
      ? params.bindPassword
      : saved?.bindPassword;
    const tlsRejectUnauthorized = params.tlsRejectUnauthorized ?? saved?.tlsRejectUnauthorized ?? true;

    if (!serverUrl || !bindDn || !bindPassword) {
      return { success: false, message: 'Server URL, Bind DN e Bind Password sono obbligatori' };
    }

    try {
      const client = ldap.createClient({
        url: serverUrl,
        tlsOptions: { rejectUnauthorized: tlsRejectUnauthorized },
        connectTimeout: 10000,
      });
      await this.bindClient(client, bindDn, bindPassword);
      client.unbind();
      return { success: true, message: 'Connessione riuscita' };
    } catch (error) {
      return { success: false, message: `Errore: ${error.message}` };
    }
  }

  async authenticate(username: string, password: string): Promise<LdapUser | null> {
    const config = await this.getConfig();
    if (!config?.enabled) return null;

    let client: ldap.Client;
    try {
      client = this.createClient(config);
      await this.bindClient(client, config.bindDn, config.bindPassword);
    } catch (error) {
      this.logger.error(`LDAP bind failed: ${error.message}`);
      return null;
    }

    try {
      const searchFilter = config.searchFilter.replace('{{username}}', username);

      const entries = await this.searchUsers(client, config.searchBase, searchFilter);
      if (entries.length === 0) {
        client.unbind();
        return null;
      }

      const userEntry = entries[0];

      // Use userPrincipalName (user@domain) for AD bind, fall back to DN
      const bindId = userEntry.userPrincipalName || userEntry.dn;
      this.logger.debug(`LDAP user found: ${userEntry.dn}, binding with: ${bindId}`);

      // Verify user's password by binding with their credentials
      const userClient = this.createClient(config);
      try {
        await this.bindClient(userClient, bindId, password);
        userClient.unbind();
      } catch {
        client.unbind();
        return null;
      }

      client.unbind();

      return {
        username: username,
        email: userEntry[config.emailAttribute] || userEntry.userPrincipalName || `${username}@local`,
        name: userEntry[config.nameAttribute] || username,
      };
    } catch (error) {
      this.logger.error(`LDAP auth error: ${error.message}`);
      try { client.unbind(); } catch {}
      return null;
    }
  }

  async syncUsers(): Promise<{ created: number; updated: number; total: number }> {
    const config = await this.getConfig();
    if (!config?.enabled) {
      return { created: 0, updated: 0, total: 0 };
    }

    let client: ldap.Client;
    try {
      client = this.createClient(config);
      await this.bindClient(client, config.bindDn, config.bindPassword);
    } catch (error) {
      this.logger.error(`LDAP sync bind failed: ${error.message}`);
      throw error;
    }

    try {
      // Search for all users (objectClass=user for AD)
      const entries = await this.searchUsers(
        client,
        config.searchBase,
        '(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))',
      );

      client.unbind();

      let created = 0;
      let updated = 0;
      const placeholderPassword = await bcrypt.hash('ldap-managed-' + Date.now(), 10);

      for (const entry of entries) {
        const username = entry.sAMAccountName || entry.uid || '';
        const email = entry[config.emailAttribute] || '';
        const name = entry[config.nameAttribute] || username;

        if (!username || !email) continue;

        const existing = await this.prisma.user.findFirst({
          where: {
            OR: [{ username }, { email }],
          },
        });

        if (existing) {
          if (existing.authSource === 'ldap') {
            await this.prisma.user.update({
              where: { id: existing.id },
              data: { name, email, username },
            });
            updated++;
          }
        } else {
          await this.prisma.user.create({
            data: {
              username,
              email,
              name,
              password: placeholderPassword,
              role: config.defaultRole,
              authSource: 'ldap',
              isActive: true,
            },
          });
          created++;
        }
      }

      return { created, updated, total: entries.length };
    } catch (error) {
      try { client.unbind(); } catch {}
      throw error;
    }
  }

  private createClient(config: LdapConfig): ldap.Client {
    return ldap.createClient({
      url: config.serverUrl,
      tlsOptions: {
        rejectUnauthorized: config.tlsRejectUnauthorized,
      },
      connectTimeout: 10000,
    });
  }

  private bindClient(client: ldap.Client, dn: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      client.bind(dn, password, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private searchUsers(
    client: ldap.Client,
    base: string,
    filter: string,
  ): Promise<Record<string, any>[]> {
    return new Promise((resolve, reject) => {
      const opts: ldap.SearchOptions = {
        filter,
        scope: 'sub',
        attributes: ['dn', 'sAMAccountName', 'uid', 'mail', 'displayName', 'cn', 'givenName', 'sn', 'userPrincipalName'],
      };

      client.search(base, opts, (err, res) => {
        if (err) return reject(err);

        const entries: Record<string, any>[] = [];
        res.on('searchEntry', (entry) => {
          const obj: Record<string, any> = { dn: entry.dn.toString() };
          for (const attr of entry.attributes) {
            obj[attr.type] = attr.values.length === 1 ? attr.values[0] : attr.values;
          }
          entries.push(obj);
        });
        res.on('error', (err) => reject(err));
        res.on('end', () => resolve(entries));
      });
    });
  }
}
