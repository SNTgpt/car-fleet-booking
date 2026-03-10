'use client';

import { useQuery } from '@tanstack/react-query';
import DataTable from '@/components/DataTable';
import api from '@/services/api';

interface AuditLog {
  id: number;
  action: string;
  entity: string;
  entityId: number;
  metadata: any;
  createdAt: string;
  user: { id: number; name: string; email: string };
}

export default function AdminLogsPage() {
  const { data: logs = [] } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => api.get<AuditLog[]>('/audit').then((r) => r.data),
  });

  const columns = [
    { key: 'id', header: 'ID' },
    {
      key: 'createdAt', header: 'Data',
      render: (l: AuditLog) => new Date(l.createdAt).toLocaleString('it-IT'),
    },
    {
      key: 'user', header: 'Utente',
      render: (l: AuditLog) => l.user?.name || '-',
    },
    { key: 'action', header: 'Azione' },
    { key: 'entity', header: 'Entità' },
    { key: 'entityId', header: 'ID Entità' },
    {
      key: 'metadata', header: 'Dettagli',
      render: (l: AuditLog) => l.metadata ? (
        <pre className="text-xs text-gray-500 max-w-xs truncate">
          {JSON.stringify(l.metadata)}
        </pre>
      ) : '-',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Audit Log</h1>
      <div className="card">
        <DataTable columns={columns} data={logs} />
      </div>
    </div>
  );
}
