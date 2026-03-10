'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-bold text-primary-700">
            CarFleet
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-primary-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/vehicles" className="text-gray-600 hover:text-primary-600 transition-colors">
              Veicoli
            </Link>
            <Link href="/bookings" className="text-gray-600 hover:text-primary-600 transition-colors">
              Prenota
            </Link>
            <Link href="/my-bookings" className="text-gray-600 hover:text-primary-600 transition-colors">
              Le mie prenotazioni
            </Link>
            {user.role === 'admin' && (
              <Link href="/admin/dashboard" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
                Area Admin
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.name}</span>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700">
            Esci
          </button>
        </div>
      </div>
    </nav>
  );
}
