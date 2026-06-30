import type { Metadata } from 'next';
import './global.css';
import { AuthProvider } from '../providers/auth-provider';

export const metadata: Metadata = {
  title: 'Kodem',
  description: 'Engine-driven business intelligence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
