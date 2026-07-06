import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kodem — כניסה',
  description: 'מערכת ההפעלה של העסק',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
