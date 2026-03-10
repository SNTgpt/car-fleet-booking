'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesService, Vehicle } from '@/services/vehicles';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import toast from 'react-hot-toast';

export default function AdminVehiclesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({
    brand: '', model: '', plate: '', location: '', category: '',
    fuelType: '', seats: 4, status: 'available', notes: '',
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['admin-vehicles'],
    queryFn: () => vehiclesService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      editing ? vehiclesService.update(editing.id, data) : vehiclesService.create(data),
    onSuccess: () => {
      toast.success(editing ? 'Veicolo aggiornato' : 'Veicolo creato');
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Errore'),
  });

  const deleteMutation = useMutation({
    mutationFn: vehiclesService.delete,
    onSuccess: () => {
      toast.success('Veicolo eliminato');
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Errore'),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ brand: '', model: '', plate: '', location: '', category: '', fuelType: '', seats: 4, status: 'available', notes: '' });
  };

  const editVehicle = (v: Vehicle) => {
    setEditing(v);
    setForm({
      brand: v.brand, model: v.model, plate: v.plate, location: v.location,
      category: v.category, fuelType: v.fuelType, seats: v.seats, status: v.status, notes: v.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...form, seats: Number(form.seats) });
  };

  const columns = [
    { key: 'brand', header: 'Marca' },
    { key: 'model', header: 'Modello' },
    { key: 'plate', header: 'Targa' },
    { key: 'location', header: 'Sede' },
    { key: 'category', header: 'Categoria' },
    { key: 'fuelType', header: 'Carburante' },
    { key: 'seats', header: 'Posti' },
    { key: 'status', header: 'Stato', render: (v: Vehicle) => <StatusBadge status={v.status} /> },
    {
      key: 'actions', header: 'Azioni',
      render: (v: Vehicle) => (
        <div className="flex gap-2">
          <button onClick={() => editVehicle(v)} className="text-primary-600 hover:underline text-sm">Modifica</button>
          <button onClick={() => deleteMutation.mutate(v.id)} className="text-red-600 hover:underline text-sm">Elimina</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestione Veicoli</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          Nuovo veicolo
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editing ? 'Modifica veicolo' : 'Nuovo veicolo'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Marca" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input-field" required />
            <input placeholder="Modello" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="input-field" required />
            <input placeholder="Targa" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} className="input-field" required />
            <input placeholder="Sede" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" required />
            <input placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field" required />
            <input placeholder="Carburante" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })} className="input-field" required />
            <input type="number" placeholder="Posti" value={form.seats} onChange={(e) => setForm({ ...form, seats: parseInt(e.target.value) })} className="input-field" min={1} required />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
              <option value="available">Disponibile</option>
              <option value="maintenance">In manutenzione</option>
              <option value="unavailable">Non disponibile</option>
            </select>
            <input placeholder="Note" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" />
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? 'Salva' : 'Crea'}</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Annulla</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <DataTable columns={columns} data={vehicles} />
      </div>
    </div>
  );
}
