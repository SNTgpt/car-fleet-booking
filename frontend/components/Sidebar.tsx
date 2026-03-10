'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/vehicles', label: 'Veicoli' },
  { href: '/admin/bookings', label: 'Prenotazioni' },
  { href: '/admin/users', label: 'Utenti' },
  { href: '/admin/logs', label: 'Audit Log' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6">
        <Link href="/admin/dashboard" className="text-xl font-bold text-white">
          CarFleet Admin
        </Link>
      </div>
      <nav className="flex-1 px-4">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-4 py-3 rounded-lg mb-1 transition-colors ${
              pathname === link.href
                ? 'bg-primary-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <Link href="/dashboard" className="block text-sm text-gray-400 hover:text-white mb-2 px-4">
          Torna al portale
        </Link>
        <button
          onClick={() => { logout(); router.push('/login'); }}
          className="block text-sm text-red-400 hover:text-red-300 px-4"
        >
          Esci
        </button>
      </div>
    </aside>
  );
}
