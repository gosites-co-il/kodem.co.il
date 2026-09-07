export type Permission =
  | 'workspace.settings.read'
  | 'workspace.settings.update'
  | 'workspace.members.read'
  | 'workspace.members.invite'
  | 'workspace.members.update'
  | 'workspace.members.remove'
  | 'workspace.billing.read'
  | 'workspace.billing.manage'
  | 'workspace.lifecycle.manage'
  | 'insights:read'
  | 'recommendations:read'
  | 'integrations:manage';
