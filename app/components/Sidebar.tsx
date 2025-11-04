'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarButton,
} from '@/components/ui/resizable-navbar';
import React from 'react';

const items = [
  { name: 'Dashboard', link: '/dashboard' },
  { name: 'Exams', link: '/exams' },
  { name: 'Questions', link: '/questions' },
  { name: 'Students', link: '/students' },
  { name: 'Results', link: '/results' },
  { name: 'Tanya AI', link: '/ai-chat' },
];

export default function Sidebar() {
  const router = useRouter();
  const { userData } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Navbar className="top-0">
      <NavBody className="px-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-900">Admin Panel</span>
          <span className="text-xs text-slate-600">SDN TUGU 1</span>
        </div>
        <NavItems
          items={items}
          onItemClick={() => setIsOpen(false)}
          className="justify-center"
        />
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-sm font-medium text-slate-900">{userData?.name}</span>
            <span className="text-xs text-slate-600">{userData?.email}</span>
          </div>
          <NavbarButton as="button" onClick={handleLogout} variant="secondary">
            Sign Out
          </NavbarButton>
        </div>
      </NavBody>

      <MobileNav className="px-4">
        <MobileNavHeader>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900">Admin Panel</span>
            <span className="text-xs text-slate-600">SDN TUGU 1</span>
          </div>
          <MobileNavToggle isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        </MobileNavHeader>
        <MobileNavMenu isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className="flex w-full flex-col gap-2">
            {items.map((item) => (
              <a
                key={item.name}
                href={item.link}
                onClick={() => setIsOpen(false)}
                className="px-2 py-2 rounded-md text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                {item.name}
              </a>
            ))}
          </div>
          <div className="mt-4 w-full border-t border-neutral-200 pt-4">
            <div className="mb-3">
              <p className="text-sm font-medium text-neutral-900">{userData?.name}</p>
              <p className="text-xs text-neutral-600">{userData?.email}</p>
            </div>
            <NavbarButton as="button" onClick={handleLogout} className="w-full">
              Sign Out
            </NavbarButton>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
