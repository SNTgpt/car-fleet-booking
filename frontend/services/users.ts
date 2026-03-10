import api from './api';

export interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const usersService = {
  getAll: () =>
    api.get<UserRecord[]>('/users').then((r) => r.data),

  getOne: (id: number) =>
    api.get<UserRecord>(`/users/${id}`).then((r) => r.data),

  create: (data: { name: string; email: string; password: string; role?: string }) =>
    api.post<UserRecord>('/users', data).then((r) => r.data),

  update: (id: number, data: Partial<UserRecord & { password?: string }>) =>
    api.patch<UserRecord>(`/users/${id}`, data).then((r) => r.data),

  toggleActive: (id: number) =>
    api.patch<UserRecord>(`/users/${id}/toggle-active`).then((r) => r.data),
};
