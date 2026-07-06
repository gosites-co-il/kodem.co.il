'use client';

import { AppNavbar } from './app-navbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="app-surface min-h-screen">
      <AppNavbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 text-start sm:px-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
