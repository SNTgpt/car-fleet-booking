'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsService, Booking } from '@/services/bookings';
import { vehiclesService } from '@/services/vehicles';
import { usersService } from '@/services/users';
import DataTable from '@/components/DataTable';
import toast from 'react-hot-toast';

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ date: '', vehicleId: '', userId: '', reason: '' });
  const [editing, setEditing] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({ startDatetime: '', endDatetime: '', reason: '' });

  const queryParams: Record<string, string> = {};
  if (filters.date) queryParams.date = filters.date;
  if (filters.vehicleId) queryParams.vehicleId = filters.vehicleId;
  if (filters.userId) queryParams.userId = filters.userId;
  if (filters.reason) queryParams.reason = filters.reason;

  const { data: bookings = [] } = useQuery({
    queryKey: ['admin-bookings', queryParams],
    queryFn: () => bookingsService.getAll(Object.keys(queryParams).length > 0 ? queryParams : undefined),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesService.getAll(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: usersService.getAll,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => bookingsService.update(id, data),
    onSuccess: () => {
      toast.success('Prenotazione aggiornata');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      setEditing(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Errore'),
  });

  const deleteMutation = useMutation({
    mutationFn: bookingsService.remove,
    onSuccess: () => {
      toast.success('Prenotazione eliminata');
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Errore'),
  });

  const startEdit = (b: Booking) => {
    setEditing(b);
    const startLocal = new Date(b.startDatetime);
    const endLocal = new Date(b.endDatetime);
    setEditForm({
      startDatetime: toLocalDatetimeString(startLocal),
      endDatetime: toLocalDatetimeString(endLocal),
      reason: b.reason,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    updateMutation.mutate({
      id: editing.id,
      data: {
        startDatetime: new Date(editForm.startDatetime).toISOString(),
        endDatetime: new Date(editForm.endDatetime).toISOString(),
        reason: editForm.reason,
      },
    });
  };

  const confirmDelete = (b: Booking) => {
    const desc = b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : `#${b.id}`;
    const date = new Date(b.startDatetime).toLocaleDateString('it-IT');
    if (window.confirm(`Eliminare la prenotazione di ${desc} del ${date}?`)) {
      deleteMutation.mutate(b.id);
    }
  };

  const clearFilters = () => setFilters({ date: '', vehicleId: '', userId: '', reason: '' });

  const columns = [
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
      render: (b: Booking) => new Date(b.startDatetime).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    },
    {
      key: 'endDatetime', header: 'Fine',
      render: (b: Booking) => new Date(b.endDatetime).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    },
    { key: 'reason', header: 'Motivo' },
    {
      key: 'actions', header: 'Azioni',
      render: (b: Booking) => (
        <div className="flex gap-2">
          <button onClick={() => startEdit(b)} className="text-primary-600 hover:underline text-sm">Modifica</button>
          <button onClick={() => confirmDelete(b)} className="text-red-600 hover:underline text-sm">Elimina</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestione Prenotazioni</h1>

      {/* Filtri */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Veicolo</label>
            <select
              value={filters.vehicleId}
              onChange={(e) => setFilters({ ...filters, vehicleId: e.target.value })}
              className="input-field"
            >
              <option value="">Tutti</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Utente</label>
            <select
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              className="input-field"
            >
              <option value="">Tutti</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <input
              type="text"
              placeholder="Cerca nel motivo..."
              value={filters.reason}
              onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
              className="input-field"
            />
          </div>
          <button onClick={clearFilters} className="btn-secondary h-10">Azzera filtri</button>
        </div>
      </div>

      {/* Form modifica */}
      {editing && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Modifica prenotazione — {editing.vehicle?.brand} {editing.vehicle?.model}
          </h2>
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inizio</label>
              <input
                type="datetime-local"
                value={editForm.startDatetime}
                onChange={(e) => setEditForm({ ...editForm, startDatetime: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fine</label>
              <input
                type="datetime-local"
                value={editForm.endDatetime}
                onChange={(e) => setEditForm({ ...editForm, endDatetime: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
              <input
                value={editForm.reason}
                onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>Salva</button>
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Annulla</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <p className="text-sm text-gray-500 mb-3">{bookings.length} prenotazioni trovate</p>
        <DataTable columns={columns} data={bookings} />
      </div>
    </div>
  );
}

function toLocalDatetimeString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
