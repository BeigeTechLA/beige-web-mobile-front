export type RoleMember = {
  id: string;
  label: string;
  tone: string;
  avatarSrc?: string;
  isCountBadge?: boolean;
};

export type RoleCardData = {
  id: string;
  roleId?: number;
  name: string;
  usersLabel: string;
  description: string;
  members: RoleMember[];
};

export type PermissionStatus = "Active" | "In-Active";

export type PermissionUser = {
  id: number;
  name: string;
  subtitle: string;
  role_id: number | null;
  role: string;
  created: string;
  updated: string;
  status: PermissionStatus;
  badge: string;
  badgeTone: string;
  archive_history?: Array<{
    history_id: number;
    action: string;
    performed_by_name: string | null;
    performed_by_role: string | null;
    reason: string | null;
    created_at: string | null;
  }>;
  last_archive_event?: {
    history_id: number;
    action: string;
    performed_by_name: string | null;
    performed_by_role: string | null;
    reason: string | null;
    created_at: string | null;
  } | null;
  deleted_by_name?: string | null;
  deleted_at?: string | null;
};

export type PermissionColumnKey = "view" | "create" | "edit" | "delete";

export type PermissionMatrixRow = {
  id: string;
  label: string;
  selected: boolean;
  access: Record<PermissionColumnKey, boolean>;
  allowedActions?: PermissionColumnKey[];
};
