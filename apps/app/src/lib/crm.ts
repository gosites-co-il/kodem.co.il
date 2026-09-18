import type {
  Contact,
  CreateContactInput,
  CreateLeadInput,
  CreateTaskInput,
  CrmBoard,
  CrmBoardDetail,
  CrmBoardItem,
  CrmBoardPresetDefinition,
  CrmBoardPresetId,
  Lead,
  LeadStatus,
  Task,
  TaskStatus,
  UpdateContactInput,
  UpdateLeadInput,
  UpdateTaskInput,
} from '@kodem/contracts';

export type CrmOverviewResponse = {
  counts: {
    leads: number;
    contacts: number;
    openTasks: number;
    boards: number;
  };
  recentLeads: Lead[];
  recentTasks: Task[];
  recentBoards: CrmBoard[];
};

export const CRM_LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'חדש',
  contacted: 'נוצר קשר',
  qualified: 'מתאים',
  lost: 'אבד',
};

export const CRM_TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'ממתין',
  in_progress: 'בתהליך',
  completed: 'הושלם',
};

export const CRM_PRESET_LABELS: Record<CrmBoardPresetId, string> = {
  sales: 'מכירות',
  help_desk: 'דלפק תמיכה',
  customer_support: 'שירות לקוחות',
  orders: 'הזמנות',
};

export type {
  Contact,
  CreateContactInput,
  CreateLeadInput,
  CreateTaskInput,
  CrmBoard,
  CrmBoardDetail,
  CrmBoardItem,
  CrmBoardPresetDefinition,
  CrmBoardPresetId,
  Lead,
  LeadStatus,
  Task,
  TaskStatus,
  UpdateContactInput,
  UpdateLeadInput,
  UpdateTaskInput,
};
