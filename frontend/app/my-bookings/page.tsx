'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { bookingsService, Booking } from '@/services/bookings';
import toast from 'react-hot-toast';

export default function MyBookingsPage() {
  const queryClient = useQueryClient();

  const { data: bookings = [] } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingsService.getMy,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => bookingsService.cancel(id),
    onSuccess: () => {
      toast.success('Prenotazione annullata');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Errore');
    },
  });

  const columns = [
    {
      key: 'vehicle',
      header: 'Veicolo',
      render: (b: Booking) =>
        b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model} (${b.vehicle.plate})` : '-',
    },
    {
      key: 'startDatetime',
      header: 'Inizio',
      render: (b: Booking) => new Date(b.startDatetime).toLocaleString('it-IT'),
    },
    {
      key: 'endDatetime',
      header: 'Fine',
      render: (b: Booking) => new Date(b.endDatetime).toLocaleString('it-IT'),
    },
    { key: 'reason', header: 'Motivo' },
    {
      key: 'status',
      header: 'Stato',
      render: (b: Booking) => <StatusBadge status={b.status} />,
    },
    {
      key: 'actions',
      header: 'Azioni',
      render: (b: Booking) =>
        ['requested', 'approved'].includes(b.status) ? (
          <button
            onClick={() => cancelMutation.mutate(b.id)}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Annulla
          </button>
        ) : null,
    },
  ];

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Le mie prenotazioni</h1>
        <div className="card">
          <DataTable columns={columns} data={bookings} />
        </div>
      </main>
    </ProtectedRoute>
  );
}
