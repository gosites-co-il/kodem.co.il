import { PRODUCT_MODULES, modulePath } from './modules';

export type NavItem = {
  href: string;
  label: string;
  children?: NavItem[];
};

export const PRODUCT_NAV: NavItem[] = [
  { href: '/product', label: 'סקירת המוצר' },
  ...PRODUCT_MODULES.filter((mod) => mod.id !== 'integrations').map((mod) => ({
    href: modulePath(mod.id),
    label: mod.eyebrow,
  })),
  { href: '/integrations', label: 'אינטגרציות' },
];

export const PRIMARY_NAV: NavItem[] = [
  { href: '/product', label: 'המוצר', children: PRODUCT_NAV },
  { href: '/how-it-works', label: 'איך זה עובד' },
  { href: '/pricing', label: 'מחירים' },
  { href: '/resources', label: 'ידע' },
  { href: '/about', label: 'עלינו' },
];

export const FOOTER_NAV = {
  product: [
    { href: '/product', label: 'יכולות' },
    { href: '/product/crm', label: 'CRM' },
    { href: '/product/automations', label: 'אוטומציות' },
    { href: '/integrations', label: 'אינטגרציות' },
    { href: '/how-it-works', label: 'הקמה ב־30 דקות' },
    { href: '/pricing', label: 'מחירון' },
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

export function isNavActive(currentPath: string, href: string): boolean {
  const path = currentPath.replace(/\/$/, '') || '/';
  const target = href.replace(/\/$/, '') || '/';
  return path === target;
}

export function isNavSectionActive(currentPath: string, item: NavItem): boolean {
  if (isNavActive(currentPath, item.href)) return true;
  return item.children?.some((child) => isNavActive(currentPath, child.href)) ?? false;
}
