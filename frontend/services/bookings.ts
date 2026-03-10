import api from './api';

export interface Booking {
  id: number;
  vehicleId: number;
  userId: number;
  startDatetime: string;
  endDatetime: string;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  createdAt: string;
  vehicle?: {
    id: number;
    brand: string;
    model: string;
    plate: string;
    location: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreateBookingPayload {
  vehicleId: number;
  startDatetime: string;
  endDatetime: string;
  reason: string;
}

export const bookingsService = {
  getAll: (params?: Record<string, string>) =>
    api.get<Booking[]>('/bookings', { params }).then((r) => r.data),

  getMy: () =>
    api.get<Booking[]>('/bookings/my').then((r) => r.data),

  getOne: (id: number) =>
    api.get<Booking>(`/bookings/${id}`).then((r) => r.data),

  create: (data: CreateBookingPayload) =>
    api.post<Booking>('/bookings', data).then((r) => r.data),

  update: (id: number, data: Partial<Booking>) =>
    api.patch<Booking>(`/bookings/${id}`, data).then((r) => r.data),

  cancel: (id: number) =>
    api.patch<Booking>(`/bookings/${id}/cancel`).then((r) => r.data),

  updateStatus: (id: number, status: string) =>
    api.patch(`/bookings/${id}/status`, { status }).then((r) => r.data),

  getCalendar: (vehicleId?: number) =>
    api.get<Booking[]>('/bookings/calendar', {
      params: vehicleId ? { vehicleId } : {},
    }).then((r) => r.data),
};
