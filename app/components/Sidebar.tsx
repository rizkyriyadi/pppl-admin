'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Exams', href: '/exams' },
  { name: 'Questions', href: '/questions' },
  { name: 'Students', href: '/students' },
  { name: 'Results', href: '/results' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userData } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-lg font-semibold text-slate-900">Admin Panel</h1>
        <p className="text-xs text-slate-600 mt-1">SDN PGS 1</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="mb-3">
          <p className="text-sm font-medium text-slate-900">{userData?.name}</p>
          <p className="text-xs text-slate-600">{userData?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50
                   rounded-md transition-colors text-left"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
