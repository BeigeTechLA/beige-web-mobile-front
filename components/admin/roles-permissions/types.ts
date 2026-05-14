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
  role: string;
  created: string;
  updated: string;
  status: PermissionStatus;
  badge: string;
  badgeTone: string;
};

export type PermissionColumnKey = "view" | "create" | "edit" | "delete";

export type PermissionMatrixRow = {
  id: string;
  label: string;
  selected: boolean;
  access: Record<PermissionColumnKey, boolean>;
};
