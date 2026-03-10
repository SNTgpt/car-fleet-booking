'use client';

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  unavailable: 'bg-red-100 text-red-800',
  booked: 'bg-blue-100 text-blue-800',
  requested: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  completed: 'bg-blue-100 text-blue-800',
};

const statusLabels: Record<string, string> = {
  available: 'Disponibile',
  maintenance: 'In manutenzione',
  unavailable: 'Non disponibile',
  booked: 'Prenotato',
  requested: 'Richiesta',
  approved: 'Approvata',
  rejected: 'Rifiutata',
  cancelled: 'Annullata',
  completed: 'Completata',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusColors[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {statusLabels[status] || status}
    </span>
  );
}
