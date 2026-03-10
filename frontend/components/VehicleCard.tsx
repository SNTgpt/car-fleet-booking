'use client';

import { Vehicle } from '@/services/vehicles';
import StatusBadge from './StatusBadge';

interface Props {
  vehicle: Vehicle;
  onBook?: (vehicle: Vehicle) => void;
}

export default function VehicleCard({ vehicle, onBook }: Props) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {vehicle.brand} {vehicle.model}
          </h3>
          <p className="text-sm text-gray-500">{vehicle.plate}</p>
        </div>
        <StatusBadge status={vehicle.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
        <div>Sede: <span className="font-medium">{vehicle.location}</span></div>
        <div>Categoria: <span className="font-medium">{vehicle.category}</span></div>
        <div>Carburante: <span className="font-medium">{vehicle.fuelType}</span></div>
        <div>Posti: <span className="font-medium">{vehicle.seats}</span></div>
      </div>
      {vehicle.notes && (
        <p className="text-xs text-gray-500 mb-3">{vehicle.notes}</p>
      )}
      {onBook && vehicle.status === 'available' && (
        <button onClick={() => onBook(vehicle)} className="btn-primary w-full text-sm">
          Prenota
        </button>
      )}
    </div>
  );
}
