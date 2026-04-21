'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import AgendaView from '@/components/AgendaView';

export default function AgendaPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <main className="max-w-full mx-auto px-4 py-6">
        <AgendaView />
      </main>
    </ProtectedRoute>
  );
}
