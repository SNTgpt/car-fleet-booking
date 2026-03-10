'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsService, Booking } from '@/services/bookings';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import toast from 'react-hot-toast';

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();

  const { data: bookings = [] } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => bookingsService.getAll(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      bookingsService.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Stato aggiornato');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Errore'),
  });

  const columns = [
    { key: 'id', header: 'ID' },
    {
      key: 'vehicle', header: 'Veicolo',
      render: (b: Booking) => b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model} (${b.vehicle.plate})` : '-',
    },
    {
      key: 'user', header: 'Utente',
      render: (b: Booking) => b.user?.name || '-',
    },
    {
      key: 'startDatetime', header: 'Inizio',
      render: (b: Booking) => new Date(b.startDatetime).toLocaleString('it-IT'),
    },
    {
      key: 'endDatetime', header: 'Fine',
      render: (b: Booking) => new Date(b.endDatetime).toLocaleString('it-IT'),
    },
    { key: 'reason', header: 'Motivo' },
    {
      key: 'status', header: 'Stato',
      render: (b: Booking) => <StatusBadge status={b.status} />,
    },
    {
      key: 'actions', header: 'Azioni',
      render: (b: Booking) => (
        <div className="flex gap-2 flex-wrap">
          {b.status === 'requested' && (
            <>
              <button
                onClick={() => statusMutation.mutate({ id: b.id, status: 'approved' })}
                className="text-green-600 hover:underline text-sm font-medium"
              >
                Approva
              </button>
              <button
                onClick={() => statusMutation.mutate({ id: b.id, status: 'rejected' })}
                className="text-red-600 hover:underline text-sm font-medium"
              >
                Rifiuta
              </button>
            </>
          )}
          {b.status === 'approved' && (
            <>
              <button
                onClick={() => statusMutation.mutate({ id: b.id, status: 'completed' })}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                Completa
              </button>
              <button
                onClick={() => statusMutation.mutate({ id: b.id, status: 'cancelled' })}
                className="text-red-600 hover:underline text-sm font-medium"
              >
                Annulla
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestione Prenotazioni</h1>
      <div className="card">
        <DataTable columns={columns} data={bookings} />
      </div>
    </div>
  );
}
