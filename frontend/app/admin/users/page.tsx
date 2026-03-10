'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService, UserRecord } from '@/services/users';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: usersService.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      editing ? usersService.update(editing.id, data) : usersService.create(data),
    onSuccess: () => {
      toast.success(editing ? 'Utente aggiornato' : 'Utente creato');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Errore'),
  });

  const toggleMutation = useMutation({
    mutationFn: usersService.toggleActive,
    onSuccess: () => {
      toast.success('Stato utente aggiornato');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'user' });
  };

  const editUser = (u: UserRecord) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { name: form.name, email: form.email, role: form.role };
    if (form.password) data.password = form.password;
    if (!editing) data.password = form.password;
    saveMutation.mutate(data);
  };

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Nome' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Ruolo', render: (u: UserRecord) => (
      <span className={`font-medium ${u.role === 'admin' ? 'text-primary-600' : 'text-gray-600'}`}>
        {u.role === 'admin' ? 'Admin' : 'Utente'}
      </span>
    )},
    {
      key: 'isActive', header: 'Stato',
      render: (u: UserRecord) => (
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {u.isActive ? 'Attivo' : 'Disattivato'}
        </span>
      ),
    },
    {
      key: 'actions', header: 'Azioni',
      render: (u: UserRecord) => (
        <div className="flex gap-2">
          <button onClick={() => editUser(u)} className="text-primary-600 hover:underline text-sm">Modifica</button>
          <button onClick={() => toggleMutation.mutate(u.id)} className="text-yellow-600 hover:underline text-sm">
            {u.isActive ? 'Disattiva' : 'Attiva'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestione Utenti</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          Nuovo utente
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Modifica utente' : 'Nuovo utente'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" required />
            <input type="password" placeholder={editing ? 'Nuova password (opzionale)' : 'Password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" required={!editing} />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
              <option value="user">Utente</option>
              <option value="admin">Admin</option>
            </select>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? 'Salva' : 'Crea'}</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Annulla</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <DataTable columns={columns} data={users} />
      </div>
    </div>
  );
}
