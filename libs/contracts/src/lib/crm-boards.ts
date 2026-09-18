import { Auditable } from './types';
import { WorkspaceId } from './ids';

export const CRM_BOARD_PRESET_IDS = [
  'sales',
  'help_desk',
  'customer_support',
  'orders',
] as const;

export type CrmBoardPresetId = (typeof CRM_BOARD_PRESET_IDS)[number];

export type CrmBoardSuggestedLink = 'lead' | 'contact' | 'task';

export interface CrmBoardPresetColumnDef {
  key: string;
  label: string;
}

export interface CrmBoardPresetDefinition {
  id: CrmBoardPresetId;
  label: string;
  columns: CrmBoardPresetColumnDef[];
  suggestedLinks: CrmBoardSuggestedLink[];
}

export const CRM_BOARD_PRESETS: readonly CrmBoardPresetDefinition[] = [
  {
    id: 'sales',
    label: 'מכירות',
    suggestedLinks: ['lead'],
    columns: [
      { key: 'new', label: 'חדש' },
      { key: 'contacted', label: 'נוצר קשר' },
      { key: 'qualified', label: 'מתאים' },
      { key: 'won', label: 'נסגר' },
      { key: 'lost', label: 'אבד' },
    ],
  },
  {
    id: 'help_desk',
    label: 'דלפק תמיכה',
    suggestedLinks: ['contact', 'task'],
    columns: [
      { key: 'open', label: 'פתוח' },
      { key: 'waiting', label: 'ממתין' },
      { key: 'in_progress', label: 'בטיפול' },
      { key: 'resolved', label: 'נפתר' },
    ],
  },
  {
    id: 'customer_support',
    label: 'שירות לקוחות',
    suggestedLinks: ['contact', 'task'],
    columns: [
      { key: 'new', label: 'חדש' },
      { key: 'investigating', label: 'בבדיקה' },
      { key: 'waiting_customer', label: 'ממתין ללקוח' },
      { key: 'closed', label: 'סגור' },
    ],
  },
  {
    id: 'orders',
    label: 'הזמנות',
    suggestedLinks: ['contact'],
    columns: [
      { key: 'received', label: 'התקבלה' },
      { key: 'processing', label: 'בעיבוד' },
      { key: 'shipped', label: 'נשלחה' },
      { key: 'delivered', label: 'נמסרה' },
    ],
  },
] as const;

export function getCrmBoardPreset(
  id: CrmBoardPresetId,
): CrmBoardPresetDefinition {
  const preset = CRM_BOARD_PRESETS.find((entry) => entry.id === id);
  if (!preset) {
    throw new Error(`Unknown CRM board preset: ${id}`);
  }
  return preset;
}

export interface CrmBoard extends Auditable {
  id: string;
  workspaceId: WorkspaceId;
  name: string;
  preset: CrmBoardPresetId;
  position: number;
}

export interface CrmBoardColumn extends Auditable {
  id: string;
  workspaceId: WorkspaceId;
  boardId: string;
  key: string;
  label: string;
  position: number;
}

export interface CrmBoardItem extends Auditable {
  id: string;
  workspaceId: WorkspaceId;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  position: number;
  leadId?: string;
  contactId?: string;
  taskId?: string;
}

export interface CrmBoardDetail extends CrmBoard {
  columns: CrmBoardColumn[];
  items: CrmBoardItem[];
}

export interface CreateCrmBoardInput {
  name: string;
  preset: CrmBoardPresetId;
}

export interface UpdateCrmBoardInput {
  name?: string;
  position?: number;
}

export interface CreateCrmBoardItemInput {
  title: string;
  description?: string;
  columnId?: string;
  leadId?: string;
  contactId?: string;
  taskId?: string;
}

export interface UpdateCrmBoardItemInput {
  title?: string;
  description?: string | null;
  columnId?: string;
  position?: number;
  leadId?: string | null;
  contactId?: string | null;
  taskId?: string | null;
}

export interface UpdateCrmBoardColumnInput {
  label?: string;
  position?: number;
}
