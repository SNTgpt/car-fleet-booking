import api from './api';

export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  plate: string;
  location: string;
  category: string;
  fuelType: string;
  seats: number;
  status: 'available' | 'maintenance' | 'unavailable' | 'booked';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  bookings?: any[];
}

export const vehiclesService = {
  getAll: (params?: Record<string, string>) =>
    api.get<Vehicle[]>('/vehicles', { params }).then((r) => r.data),

  getOne: (id: number) =>
    api.get<Vehicle>(`/vehicles/${id}`).then((r) => r.data),

  create: (data: Partial<Vehicle>) =>
    api.post<Vehicle>('/vehicles', data).then((r) => r.data),

  update: (id: number, data: Partial<Vehicle>) =>
    api.patch<Vehicle>(`/vehicles/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/vehicles/${id}`).then((r) => r.data),

  getLocations: () =>
    api.get<string[]>('/vehicles/locations').then((r) => r.data),

  getCategories: () =>
    api.get<string[]>('/vehicles/categories').then((r) => r.data),
};
