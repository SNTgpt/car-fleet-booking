'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import BookingCalendar from '@/components/BookingCalendar';
import { bookingsService } from '@/services/bookings';
import { vehiclesService } from '@/services/vehicles';
import toast from 'react-hot-toast';

export default function BookingsPage() {
  const searchParams = useSearchParams();
  const preselectedVehicle = searchParams.get('vehicleId');
  const queryClient = useQueryClient();

  const [vehicleId, setVehicleId] = useState(preselectedVehicle || '');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (preselectedVehicle) setVehicleId(preselectedVehicle);
  }, [preselectedVehicle]);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesService.getAll(),
  });

  const { data: calendarBookings = [] } = useQuery({
    queryKey: ['calendar', vehicleId],
    queryFn: () => bookingsService.getCalendar(vehicleId ? parseInt(vehicleId) : undefined),
  });

  const createMutation = useMutation({
    mutationFn: bookingsService.create,
    onSuccess: () => {
      toast.success('Prenotazione inviata');
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      setStartDatetime('');
      setEndDatetime('');
      setReason('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Errore nella prenotazione');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !startDatetime || !endDatetime || !reason) {
      toast.error('Compila tutti i campi');
      return;
    }
    createMutation.mutate({
      vehicleId: parseInt(vehicleId),
      startDatetime,
      endDatetime,
      reason,
    });
  };

  const handleDateSelect = (start: string, end: string) => {
    setStartDatetime(start + 'T09:00');
    setEndDatetime(end + 'T18:00');
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Prenota un veicolo</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Nuova prenotazione</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Veicolo</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Seleziona veicolo</option>
                  {vehicles
                    .filter((v) => v.status === 'available')
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} - {v.plate} ({v.location})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inizio</label>
                <input
                  type="datetime-local"
                  value={startDatetime}
                  onChange={(e) => setStartDatetime(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fine</label>
                <input
                  type="datetime-local"
                  value={endDatetime}
                  onChange={(e) => setEndDatetime(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input-field"
                  rows={3}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn-primary w-full"
              >
                {createMutation.isPending ? 'Invio...' : 'Invia richiesta'}
              </button>
            </form>
          </div>

          <div className="card lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Calendario prenotazioni</h2>
            <BookingCalendar bookings={calendarBookings} onDateSelect={handleDateSelect} />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
