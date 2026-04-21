'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsService, Booking } from '@/services/bookings';
import { vehiclesService, Vehicle } from '@/services/vehicles';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

// Parse datetime from DB as local time (DB stores without timezone)
function parseLocalDate(dt: string): Date {
  return new Date(dt.replace('Z', ''));
}

// Format local date to ISO string without timezone shift
function toLocalISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const TIME_SLOTS: string[] = [];
for (let h = 7; h <= 20; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 20) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const MONTHS_IT = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
];
const DAYS_FULL_IT = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];

function formatDateIT(date: Date): string {
  return `${DAYS_FULL_IT[date.getDay()]} ${date.getDate()} ${MONTHS_IT[date.getMonth()]} ${date.getFullYear()}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function getMonthDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  requested: { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-900' },
  approved: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-900' },
  completed: { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-900' },
  rejected: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800' },
  cancelled: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600' },
};

interface BookingModalProps {
  vehicle: Vehicle;
  date: Date;
  startTime: string;
  onClose: () => void;
  onSubmit: (data: { vehicleId: number; startDatetime: string; endDatetime: string; reason: string }) => void;
  submitting: boolean;
}

function BookingModal({ vehicle, date, startTime, onClose, onSubmit, submitting }: BookingModalProps) {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const [start, setStart] = useState(startTime);
  const [end, setEnd] = useState(() => {
    const [h, m] = startTime.split(':').map(Number);
    const endH = h + 1;
    return endH <= 20 ? `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}` : '20:00';
  });
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr2 = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    onSubmit({
      vehicleId: vehicle.id,
      startDatetime: `${dateStr2}T${start}:00`,
      endDatetime: `${dateStr2}T${end}:00`,
      reason,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-1">Nuova prenotazione</h3>
        <p className="text-sm text-gray-500 mb-4">
          {vehicle.brand} {vehicle.model} ({vehicle.plate}) &mdash; {dateStr}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ora inizio</label>
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="input-field" required min="07:00" max="20:00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ora fine</label>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="input-field" required min="07:00" max="20:00" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="input-field" rows={3} required placeholder="es. Visita cliente a Bergamo" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Invio...' : 'Prenota'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annulla</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AgendaView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [bookingModal, setBookingModal] = useState<{ vehicle: Vehicle; startTime: string } | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({ start: '', end: '', reason: '' });

  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesService.getAll(),
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['calendar-bookings', dateStr],
    queryFn: () => bookingsService.getCalendar(),
  });

  const availableVehicles = vehicles.filter((v) => v.status !== 'unavailable' && v.status !== 'dismissed');

  const dayBookings = useMemo(() => {
    return allBookings.filter((b) => {
      if (b.status === 'rejected' || b.status === 'cancelled') return false;
      const start = parseLocalDate(b.startDatetime);
      const end = parseLocalDate(b.endDatetime);
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);
      return start <= dayEnd && end >= dayStart;
    });
  }, [allBookings, selectedDate]);

  const getBookingAtSlot = (vehicleId: number, slotTime: string): Booking | null => {
    const [h, m] = slotTime.split(':').map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(h, m, 0, 0);

    return dayBookings.find((b) => {
      if (b.vehicleId !== vehicleId) return false;
      const bStart = parseLocalDate(b.startDatetime);
      const bEnd = parseLocalDate(b.endDatetime);
      return slotStart >= bStart && slotStart < bEnd;
    }) || null;
  };

  const getBookingSlotSpan = (booking: Booking, slotTime: string): number => {
    const bStart = parseLocalDate(booking.startDatetime);
    const bEnd = parseLocalDate(booking.endDatetime);
    const [h, m] = slotTime.split(':').map(Number);
    const slotDate = new Date(selectedDate);
    slotDate.setHours(h, m, 0, 0);

    if (slotDate.getTime() !== Math.max(bStart.getTime(), new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 7, 0).getTime()) &&
        !(bStart.getHours() === h && bStart.getMinutes() === m)) {
      return 0;
    }

    let count = 0;
    const current = new Date(slotDate);
    while (current < bEnd && (current.getHours() < 20 || (current.getHours() === 20 && current.getMinutes() === 0))) {
      count++;
      current.setMinutes(current.getMinutes() + 30);
    }
    return count;
  };

  const isFirstSlotOfBooking = (booking: Booking, slotTime: string): boolean => {
    const bStart = parseLocalDate(booking.startDatetime);
    const [h, m] = slotTime.split(':').map(Number);
    const dayMinStart = new Date(selectedDate);
    dayMinStart.setHours(7, 0, 0, 0);
    if (bStart < dayMinStart) {
      return h === 7 && m === 0;
    }
    return bStart.getHours() === h && bStart.getMinutes() === m;
  };

  const createMutation = useMutation({
    mutationFn: bookingsService.create,
    onSuccess: () => {
      toast.success('Prenotazione creata');
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
      setBookingModal(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Errore nella prenotazione'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => bookingsService.update(id, data),
    onSuccess: () => {
      toast.success('Prenotazione aggiornata');
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
      setEditingBooking(null);
      setSelectedBooking(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Errore'),
  });

  const deleteMutation = useMutation({
    mutationFn: bookingsService.remove,
    onSuccess: () => {
      toast.success('Prenotazione eliminata');
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] });
      setSelectedBooking(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Errore'),
  });

  const openEdit = (b: Booking) => {
    const s = parseLocalDate(b.startDatetime);
    const e = parseLocalDate(b.endDatetime);
    setEditForm({
      start: `${String(s.getHours()).padStart(2,'0')}:${String(s.getMinutes()).padStart(2,'0')}`,
      end: `${String(e.getHours()).padStart(2,'0')}:${String(e.getMinutes()).padStart(2,'0')}`,
      reason: b.reason,
    });
    setEditingBooking(b);
    setSelectedBooking(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    const dateStr2 = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
    updateMutation.mutate({
      id: editingBooking.id,
      data: {
        startDatetime: `${dateStr2}T${editForm.start}:00`,
        endDatetime: `${dateStr2}T${editForm.end}:00`,
        reason: editForm.reason,
      },
    });
  };

  const confirmDelete = (b: Booking) => {
    if (window.confirm('Eliminare questa prenotazione?')) {
      deleteMutation.mutate(b.id);
    }
  };

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
    if (d.getMonth() !== calMonth || d.getFullYear() !== calYear) {
      setCalMonth(d.getMonth());
      setCalYear(d.getFullYear());
    }
  };

  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
    if (d.getMonth() !== calMonth || d.getFullYear() !== calYear) {
      setCalMonth(d.getMonth());
      setCalYear(d.getFullYear());
    }
  };

  const selectDay = (day: number) => {
    setSelectedDate(new Date(calYear, calMonth, day));
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const today = new Date();
  const monthDays = getMonthDays(calYear, calMonth);

  const grid = useMemo(() => {
    const cells: Record<string, { type: 'booking-start'; booking: Booking; span: number } | { type: 'booking-cont' } | { type: 'empty' }> = {};
    const consumed = new Set<string>();

    for (const v of availableVehicles) {
      for (let si = 0; si < TIME_SLOTS.length; si++) {
        const slot = TIME_SLOTS[si];
        const key = `${v.id}-${si}`;
        if (consumed.has(key)) {
          cells[key] = { type: 'booking-cont' };
          continue;
        }
        const booking = getBookingAtSlot(v.id, slot);
        if (booking && isFirstSlotOfBooking(booking, slot)) {
          const span = getBookingSlotSpan(booking, slot);
          cells[key] = { type: 'booking-start', booking, span };
          for (let s = 1; s < span && si + s < TIME_SLOTS.length; s++) {
            consumed.add(`${v.id}-${si + s}`);
          }
        } else if (booking) {
          cells[key] = { type: 'booking-cont' };
        } else {
          cells[key] = { type: 'empty' };
        }
      }
    }
    return cells;
  }, [dayBookings, availableVehicles, selectedDate]);

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main agenda area */}
        <div className="flex-1 min-w-0">
          {/* Day navigation */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button onClick={prevDay} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Giorno precedente">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900 capitalize">{formatDateIT(selectedDate)}</h1>
            <button onClick={nextDay} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Giorno successivo">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Schedule grid */}
          <div className="card overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px] table-fixed">
              <colgroup>
                <col className="w-16" />
                {availableVehicles.map((_, i) => (
                  <col key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff7ed' }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th className="p-2 text-sm font-semibold border border-gray-300 bg-gray-700 text-white w-16">Ora</th>
                  {availableVehicles.map((v, i) => {
                    const headerBg = i % 2 === 0 ? 'bg-primary-700' : 'bg-amber-700';
                    const borderColor = i % 2 === 0 ? 'border-primary-600' : 'border-amber-600';
                    const subtextColor = i % 2 === 0 ? 'text-primary-200' : 'text-amber-200';
                    return (
                      <th key={v.id} className={`p-2 text-sm font-semibold border ${borderColor} ${headerBg} text-white`}>
                        <div>{v.brand} {v.model}</div>
                        <div className={`font-normal text-xs ${subtextColor}`}>{v.plate}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot, slotIdx) => {
                  const isHour = slot.endsWith(':00');
                  return (
                    <tr key={slot} className={isHour ? 'bg-amber-50/50' : 'bg-white'}>
                      <td className={`px-2 py-1 text-xs font-semibold text-gray-600 border border-gray-200 text-center ${isHour ? 'bg-amber-50' : ''}`}>
                        {slot}
                      </td>
                      {availableVehicles.map((v, vi) => {
                        const cell = grid[`${v.id}-${slotIdx}`];
                        if (!cell || cell.type === 'booking-cont') return null;
                        const colBorder = vi < availableVehicles.length - 1 ? 'border-r-2 border-r-gray-300' : '';

                        if (cell.type === 'booking-start') {
                          const { booking, span } = cell;
                          const colors = STATUS_COLORS[booking.status] || STATUS_COLORS.requested;
                          return (
                            <td
                              key={v.id}
                              rowSpan={span}
                              onClick={() => setSelectedBooking(booking)}
                              className={`border border-gray-200 ${colBorder} px-2 py-1 ${colors.bg} ${colors.border} border-l-4 cursor-pointer hover:opacity-80`}
                            >
                              <div className={`text-xs font-semibold ${colors.text}`}>
                                {booking.user?.name || 'Utente'}
                              </div>
                              <div className={`text-xs ${colors.text} opacity-75`}>
                                {booking.reason}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {parseLocalDate(booking.startDatetime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                {' - '}
                                {parseLocalDate(booking.endDatetime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={v.id}
                            className={`border border-gray-200 ${colBorder} hover:bg-primary-50 cursor-pointer transition-colors`}
                            onClick={() => setBookingModal({ vehicle: v, startTime: slot })}
                            title={`Prenota ${v.brand} ${v.model} alle ${slot}`}
                          >
                            <div className="text-center text-gray-300 hover:text-primary-500 text-sm">+</div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-100 border border-amber-400" /> In attesa
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-100 border border-blue-400" /> Approvata
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-100 border border-green-400" /> Completata
            </div>
          </div>
        </div>

        {/* Mini calendar sidebar */}
        <div className="lg:w-72 shrink-0">
          <div className="card sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="text-primary-600 hover:text-primary-800 font-bold text-sm">&lt;&lt;&lt;</button>
              <span className="font-bold text-gray-800 capitalize">
                {MONTHS_IT[calMonth]} {calYear}
              </span>
              <button onClick={nextMonth} className="text-primary-600 hover:text-primary-800 font-bold text-sm">&gt;&gt;&gt;</button>
            </div>

            <div className="grid grid-cols-7 text-center text-xs font-bold mb-1">
              {['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'].map((d) => (
                <div key={d} className={`py-1 ${d === 'Sa' || d === 'Do' ? 'text-orange-500' : 'text-primary-700'}`}>
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 text-center text-sm">
              {monthDays.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />;

                const thisDate = new Date(calYear, calMonth, day);
                const isToday = isSameDay(thisDate, today);
                const isSelected = isSameDay(thisDate, selectedDate);
                const isWeekend = thisDate.getDay() === 0 || thisDate.getDay() === 6;

                return (
                  <button
                    key={day}
                    onClick={() => selectDay(day)}
                    className={`py-1 rounded transition-colors text-sm
                      ${isSelected ? 'bg-primary-600 text-white font-bold' : ''}
                      ${isToday && !isSelected ? 'bg-orange-500 text-white font-bold' : ''}
                      ${!isSelected && !isToday && isWeekend ? 'text-orange-500 hover:bg-orange-50' : ''}
                      ${!isSelected && !isToday && !isWeekend ? 'text-gray-700 hover:bg-primary-50' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  const t = new Date();
                  setSelectedDate(t);
                  setCalMonth(t.getMonth());
                  setCalYear(t.getFullYear());
                }}
                className="btn-primary w-full text-sm"
              >
                Oggi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking modal - new */}
      {bookingModal && (
        <BookingModal
          vehicle={bookingModal.vehicle}
          date={selectedDate}
          startTime={bookingModal.startTime}
          onClose={() => setBookingModal(null)}
          onSubmit={(data) => createMutation.mutate(data)}
          submitting={createMutation.isPending}
        />
      )}

      {/* Booking detail popup */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-3">Dettaglio prenotazione</h3>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="font-medium text-gray-500">Utente:</span> {selectedBooking.user?.name || 'N/D'}</p>
              <p><span className="font-medium text-gray-500">Motivo:</span> {selectedBooking.reason}</p>
              <p><span className="font-medium text-gray-500">Inizio:</span> {parseLocalDate(selectedBooking.startDatetime).toLocaleString('it-IT')}</p>
              <p><span className="font-medium text-gray-500">Fine:</span> {parseLocalDate(selectedBooking.endDatetime).toLocaleString('it-IT')}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => openEdit(selectedBooking)} className="btn-primary flex-1 text-sm">Modifica</button>
              <button onClick={() => confirmDelete(selectedBooking)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex-1 text-sm">Elimina</button>
              <button onClick={() => setSelectedBooking(null)} className="btn-secondary flex-1 text-sm">Chiudi</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit booking modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingBooking(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1">Modifica prenotazione</h3>
            <p className="text-sm text-gray-500 mb-4">{editingBooking.user?.name}</p>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ora inizio</label>
                  <input type="time" value={editForm.start} onChange={(e) => setEditForm({...editForm, start: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ora fine</label>
                  <input type="time" value={editForm.end} onChange={(e) => setEditForm({...editForm, end: e.target.value})} className="input-field" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <textarea value={editForm.reason} onChange={(e) => setEditForm({...editForm, reason: e.target.value})} className="input-field" rows={3} required />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex-1">
                  {updateMutation.isPending ? 'Salvataggio...' : 'Salva'}
                </button>
                <button type="button" onClick={() => setEditingBooking(null)} className="btn-secondary flex-1">Annulla</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
