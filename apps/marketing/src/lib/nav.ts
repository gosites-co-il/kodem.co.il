export type NavItem = {
  href: string;
  label: string;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: '/product', label: 'המוצר' },
  { href: '/how-it-works', label: 'איך זה עובד' },
  { href: '/pricing', label: 'מחירים' },
  { href: '/resources', label: 'ידע' },
  { href: '/about', label: 'עלינו' },
];

export const FOOTER_NAV = {
  product: [
    { href: '/product', label: 'יכולות' },
    { href: '/how-it-works', label: 'הקמה ב־30 דקות' },
    { href: '/pricing', label: 'מחירון' },
    { href: '/#loss-calculator', label: 'מחשבון הפסדים' },
  ],
  company: [
    { href: '/about', label: 'אודות' },
    { href: '/contact', label: 'צור קשר' },
    { href: '/resources', label: 'מרכז ידע' },
  ],
  legal: [
    { href: '/privacy', label: 'מדיניות פרטיות' },
    { href: '/terms', label: 'תנאי שימוש' },
  ],
} as const;
