'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  VideoCameraIcon,
  RectangleStackIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setIsSigningOut(true);
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sign out');
      }

      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const navigation = [
    { name: 'Create', href: '/dashboard', icon: VideoCameraIcon },
    { name: 'Library', href: '/dashboard/library', icon: RectangleStackIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col fixed top-0 left-0 h-screen">
      {/* Logo area */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-900">Clipwave</span>
        </div>
      </div>

      {/* Navigation items */}
      <div className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-soft'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Sign out */}
      <div className="p-3 border-t border-slate-200">
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span className="font-medium">{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </nav>
  );
}
