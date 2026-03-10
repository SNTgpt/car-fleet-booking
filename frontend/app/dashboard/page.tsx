'use client';

import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { bookingsService } from '@/services/bookings';
import { vehiclesService } from '@/services/vehicles';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: myBookings = [] } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingsService.getMy,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesService.getAll(),
  });

  const activeBookings = myBookings.filter(
    (b) => b.status === 'approved' || b.status === 'requested',
  );
  const availableVehicles = vehicles.filter((v) => v.status === 'available');

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <p className="text-sm text-gray-500">Veicoli disponibili</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{availableVehicles.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Le mie prenotazioni attive</p>
            <p className="text-3xl font-bold text-primary-600 mt-1">{activeBookings.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Totale prenotazioni</p>
            <p className="text-3xl font-bold text-gray-700 mt-1">{myBookings.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Prenotazioni recenti</h2>
              <Link href="/my-bookings" className="text-sm text-primary-600 hover:underline">
                Vedi tutte
              </Link>
            </div>
            {activeBookings.length === 0 ? (
              <p className="text-gray-400 text-sm">Nessuna prenotazione attiva</p>
            ) : (
              <div className="space-y-3">
                {activeBookings.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">
                        {b.vehicle?.brand} {b.vehicle?.model}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(b.startDatetime).toLocaleDateString('it-IT')} -{' '}
                        {new Date(b.endDatetime).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Veicoli disponibili</h2>
              <Link href="/vehicles" className="text-sm text-primary-600 hover:underline">
                Vedi tutti
              </Link>
            </div>
            {availableVehicles.length === 0 ? (
              <p className="text-gray-400 text-sm">Nessun veicolo disponibile</p>
            ) : (
              <div className="space-y-3">
                {availableVehicles.slice(0, 5).map((v) => (
                  <div key={v.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{v.brand} {v.model}</p>
                      <p className="text-xs text-gray-500">{v.plate} - {v.location}</p>
                    </div>
                    <StatusBadge status={v.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
