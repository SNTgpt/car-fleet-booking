'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import VehicleCard from '@/components/VehicleCard';
import { vehiclesService, Vehicle } from '@/services/vehicles';
import { useRouter } from 'next/navigation';

export default function VehiclesPage() {
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const router = useRouter();

  const params: Record<string, string> = {};
  if (location) params.location = location;
  if (category) params.category = category;

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => vehiclesService.getAll(params),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: vehiclesService.getLocations,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: vehiclesService.getCategories,
  });

  const handleBook = (vehicle: Vehicle) => {
    router.push(`/bookings?vehicleId=${vehicle.id}`);
  };

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Veicoli</h1>

        <div className="flex gap-4 mb-6">
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">Tutte le sedi</option>
            {locations.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">Tutte le categorie</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} onBook={handleBook} />
          ))}
        </div>
        {vehicles.length === 0 && (
          <p className="text-center text-gray-400 mt-12">Nessun veicolo trovato</p>
        )}
      </main>
    </ProtectedRoute>
  );
}
