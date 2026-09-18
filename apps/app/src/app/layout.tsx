import type { Metadata } from 'next';
import Script from 'next/script';
import { Assistant } from 'next/font/google';
import './global.css';
import { getThemeInitScript } from '@kodem/design-system/lib/theme-script';
import { AppCookieBanner } from '../components/app/app-cookie-banner';
import { AuthProvider } from '../providers/auth-provider';
import { ThemeProvider } from '../providers/theme-provider';

const assistant = Assistant({
  subsets: ['hebrew', 'latin'],
  variable: '--font-assistant',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kodem',
  description: 'מערכת ההפעלה של העסק',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={`${assistant.variable} font-sans`}>
        <Script id="kodem-theme-init" strategy="beforeInteractive">
          {getThemeInitScript()}
        </Script>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <AppCookieBanner />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
