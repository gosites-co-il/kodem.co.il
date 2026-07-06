import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BookOpen,
  Brain,
  Building2,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Sparkles,
  Users,
} from 'lucide-react';
import { ROUTES } from '../../lib/constants';

export interface NavLinkItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavLinkItem[];
}

export const APP_NAV_SECTIONS: NavSection[] = [
  {
    id: 'modules',
    label: 'מודולים',
    items: [
      {
        title: 'CRM',
        description: 'ניהול לקוחות, לידים ומעקב מכירות',
        href: ROUTES.dashboard,
        icon: Users,
        badge: 'פעיל',
      },
      {
        title: 'כרטיס דיגיטלי',
        description: 'נוכחות דיגיטלית לעסק שלכם',
        href: '#',
        icon: Sparkles,
        badge: 'בקרוב',
      },
      {
        title: 'קמפיינים',
        description: 'תכנון והפעלת קמפיינים',
        href: '#',
        icon: MessageSquare,
        badge: 'בקרוב',
      },
    ],
  },
  {
    id: 'knowledge',
    label: 'ידע',
    items: [
      {
        title: 'תובנות',
        description: 'תובנות שמופקות מהמנועים',
        href: ROUTES.dashboard,
        icon: Brain,
      },
      {
        title: 'המלצות',
        description: 'צעדים מומלצים לצמיחה',
        href: ROUTES.dashboard,
        icon: BarChart3,
      },
      {
        title: 'פרופיל עסקי',
        description: 'הבסיס הידע של הסביבה',
        href: ROUTES.dashboard,
        icon: Building2,
      },
    ],
  },
  {
    id: 'resources',
    label: 'משאבים',
    items: [
      {
        title: 'מרכז עזרה',
        description: 'מדריכים ושאלות נפוצות',
        href: '#',
        icon: LifeBuoy,
      },
      {
        title: 'תיעוד',
        description: 'איך Kodem עובד',
        href: '#',
        icon: BookOpen,
      },
    ],
  },
];

export const PRIMARY_NAV_LINK = {
  label: 'דשבורד',
  href: ROUTES.dashboard,
  icon: LayoutDashboard,
};
