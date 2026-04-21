import api from './api';

export interface LdapConfigData {
  id?: number;
  enabled: boolean;
  serverUrl: string;
  bindDn: string;
  bindPassword: string;
  searchBase: string;
  searchFilter: string;
  emailAttribute: string;
  nameAttribute: string;
  defaultRole: 'admin' | 'user';
  syncEnabled: boolean;
  syncIntervalMin: number;
  tlsRejectUnauthorized: boolean;
}

export interface TestResult {
  success: boolean;
  message: string;
}

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
}

const ldapService = {
  getConfig: async (): Promise<LdapConfigData | null> => {
    const { data } = await api.get('/ldap/config');
    return data;
  },

  updateConfig: async (config: Partial<LdapConfigData>): Promise<LdapConfigData> => {
    const { data } = await api.put('/ldap/config', config);
    return data;
  },

  testConnection: async (config: Partial<LdapConfigData>): Promise<TestResult> => {
    const { data } = await api.post('/ldap/test', config);
    return data;
  },

  syncUsers: async (): Promise<SyncResult> => {
    const { data } = await api.post('/ldap/sync');
    return data;
  },
};

export default ldapService;
