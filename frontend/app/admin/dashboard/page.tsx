'use client';

import { useQuery } from '@tanstack/react-query';
import { vehiclesService } from '@/services/vehicles';
import { bookingsService } from '@/services/bookings';
import { usersService } from '@/services/users';

export default function AdminDashboardPage() {
  const { data: vehicles = [] } = useQuery({
    queryKey: ['admin-vehicles'],
    queryFn: () => vehiclesService.getAll(),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => bookingsService.getAll(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: usersService.getAll,
  });

  const pending = bookings.filter((b) => b.status === 'requested').length;
  const active = bookings.filter((b) => b.status === 'approved').length;
  const available = vehicles.filter((v) => v.status === 'available').length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Amministrativa</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">Veicoli totali</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{vehicles.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Veicoli disponibili</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{available}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Prenotazioni in attesa</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{pending}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Prenotazioni attive</p>
          <p className="text-3xl font-bold text-primary-600 mt-1">{active}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Utenti registrati</h2>
          <p className="text-3xl font-bold text-gray-700">{users.length}</p>
          <p className="text-sm text-gray-500 mt-1">
            {users.filter((u) => u.isActive).length} attivi
          </p>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Prenotazioni totali</h2>
          <p className="text-3xl font-bold text-gray-700">{bookings.length}</p>
          <p className="text-sm text-gray-500 mt-1">
            {bookings.filter((b) => b.status === 'completed').length} completate
          </p>
        </div>
      </div>
    </div>
  );
}
