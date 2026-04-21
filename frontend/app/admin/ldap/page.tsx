'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ldapService, { LdapConfigData } from '@/services/ldap';
import toast from 'react-hot-toast';

const defaultConfig: LdapConfigData = {
  enabled: false,
  serverUrl: '',
  bindDn: '',
  bindPassword: '',
  searchBase: '',
  searchFilter: '(sAMAccountName={{username}})',
  emailAttribute: 'mail',
  nameAttribute: 'displayName',
  defaultRole: 'user',
  syncEnabled: false,
  syncIntervalMin: 30,
  tlsRejectUnauthorized: true,
};

export default function AdminLdapPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LdapConfigData>(defaultConfig);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['ldap-config'],
    queryFn: ldapService.getConfig,
  });

  useEffect(() => {
    if (config) {
      setForm(config);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<LdapConfigData>) => ldapService.updateConfig(data),
    onSuccess: () => {
      toast.success('Configurazione salvata');
      queryClient.invalidateQueries({ queryKey: ['ldap-config'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Errore nel salvataggio'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await ldapService.testConnection(form);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Errore nel test');
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await ldapService.syncUsers();
      toast.success(`Sincronizzazione completata: ${result.created} creati, ${result.updated} aggiornati su ${result.total} utenti AD`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Errore nella sincronizzazione');
    } finally {
      setSyncing(false);
    }
  };

  const updateField = (field: keyof LdapConfigData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Active Directory / LDAP</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Abilitazione */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Integrazione Active Directory</h2>
              <p className="text-sm text-gray-500 mt-1">
                Abilita l&apos;autenticazione tramite Active Directory. Gli utenti locali continueranno a funzionare.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => updateField('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
            </label>
          </div>
        </div>

        {/* Connessione */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connessione Server</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Server URL</label>
              <input
                placeholder="ldap://DC19.snt-fi.it:389 o ldaps://DC19.snt-fi.it:636"
                value={form.serverUrl}
                onChange={(e) => updateField('serverUrl', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bind DN</label>
              <input
                placeholder="CN=Administrator,CN=Users,DC=snt-fi,DC=it"
                value={form.bindDn}
                onChange={(e) => updateField('bindDn', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bind Password</label>
              <input
                type="password"
                placeholder="Password dell'account di servizio"
                value={form.bindPassword}
                onChange={(e) => updateField('bindPassword', e.target.value)}
                className="input-field"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="tlsReject"
                checked={form.tlsRejectUnauthorized}
                onChange={(e) => updateField('tlsRejectUnauthorized', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="tlsReject" className="text-sm text-gray-700">
                Verifica certificato TLS (disabilitare solo per test)
              </label>
            </div>
          </div>
        </div>

        {/* Ricerca utenti */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ricerca Utenti</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Base DN (OU di ricerca)</label>
              <input
                placeholder="OU=UtentiDominio,DC=snt-fi,DC=it"
                value={form.searchBase}
                onChange={(e) => updateField('searchBase', e.target.value)}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Specifica la OU da cui cercare gli utenti. La ricerca include automaticamente tutte le sotto-OU.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtro di ricerca</label>
              <input
                placeholder="(sAMAccountName={{username}})"
                value={form.searchFilter}
                onChange={(e) => updateField('searchFilter', e.target.value)}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Usa <code className="bg-gray-100 px-1 rounded">{'{{username}}'}</code> come placeholder per lo username inserito dall&apos;utente
              </p>
            </div>
          </div>
        </div>

        {/* Mapping attributi */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mapping Attributi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attributo Email</label>
              <input
                placeholder="mail"
                value={form.emailAttribute}
                onChange={(e) => updateField('emailAttribute', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attributo Nome</label>
              <input
                placeholder="displayName"
                value={form.nameAttribute}
                onChange={(e) => updateField('nameAttribute', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo predefinito</label>
              <select
                value={form.defaultRole}
                onChange={(e) => updateField('defaultRole', e.target.value)}
                className="input-field"
              >
                <option value="user">Utente</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sincronizzazione */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sincronizzazione Automatica</h2>
          <div className="flex items-center gap-6 flex-wrap">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.syncEnabled}
                onChange={(e) => updateField('syncEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
              <span className="ml-3 text-sm font-medium text-gray-700">Abilita sincronizzazione periodica</span>
            </label>
            {form.syncEnabled && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Ogni</label>
                <input
                  type="number"
                  min={5}
                  max={1440}
                  value={form.syncIntervalMin}
                  onChange={(e) => updateField('syncIntervalMin', parseInt(e.target.value) || 30)}
                  className="input-field w-24 text-center"
                />
                <span className="text-sm text-gray-700">minuti</span>
              </div>
            )}
          </div>
          {form.syncEnabled && (
            <p className="text-xs text-gray-500 mt-2">
              Gli utenti da Active Directory verranno importati/aggiornati automaticamente ogni {form.syncIntervalMin} minuti.
            </p>
          )}
        </div>

        {/* Azioni */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Salvataggio...' : 'Salva configurazione'}
            </button>
            <button type="button" onClick={handleTest} className="btn-secondary" disabled={testing}>
              {testing ? 'Test in corso...' : 'Testa connessione'}
            </button>
            <button
              type="button"
              onClick={handleSync}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={syncing}
            >
              {syncing ? 'Sincronizzazione...' : 'Sincronizza ora'}
            </button>
          </div>
        </div>
      </form>

      {/* Info */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Come funziona</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Quando un utente accede, il sistema prova prima l&apos;autenticazione AD</li>
          <li>Se l&apos;utente non esiste in AD, viene autenticato con le credenziali locali</li>
          <li>Gli utenti AD vengono creati automaticamente al primo accesso</li>
          <li>Gli utenti locali esistenti non sono influenzati dall&apos;integrazione AD</li>
          <li>La sincronizzazione importa tutti gli utenti attivi da AD</li>
        </ul>
      </div>
    </div>
  );
}
