'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Booking } from '@/services/bookings';

interface Props {
  bookings: Booking[];
  onDateSelect?: (start: string, end: string) => void;
}

const statusColor: Record<string, string> = {
  requested: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  cancelled: '#6b7280',
  completed: '#3b82f6',
};

export default function BookingCalendar({ bookings, onDateSelect }: Props) {
  const events = bookings.map((b) => ({
    id: String(b.id),
    title: b.vehicle
      ? `${b.vehicle.brand} ${b.vehicle.model} - ${b.user?.name || ''}`
      : b.reason,
    start: b.startDatetime,
    end: b.endDatetime,
    backgroundColor: statusColor[b.status] || '#6b7280',
    borderColor: statusColor[b.status] || '#6b7280',
  }));

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek',
      }}
      events={events}
      selectable={!!onDateSelect}
      select={(info) => onDateSelect?.(info.startStr, info.endStr)}
      height="auto"
      locale="it"
    />
  );
}
