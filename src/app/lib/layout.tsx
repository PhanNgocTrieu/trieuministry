'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth(); // Retrieve admin state

  const tabs = [
    { name: 'Thư viện sách', href: '/lib/lib-man' },
    // Only show 'Sách đang mượn' tab to admins
    ...(isAdmin ? [{ name: 'Sách đang mượn', href: '/lib/borrowed-lib' }] : []),
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Quản lý thư viện</h1>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
