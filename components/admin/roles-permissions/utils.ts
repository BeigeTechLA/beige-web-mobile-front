"use client";

import { basePermissions } from "@/components/admin/roles-permissions/data";
import { ADMIN_PERMISSION_MENU_HIERARCHY } from "@/lib/permissions/menuHierarchy";
import {
  type PermissionColumnKey,
  type PermissionMatrixRow,
} from "@/components/admin/roles-permissions/types";

type PermissionActionRecord = string | { action_key?: string };

type PermissionModuleRecord = {
  module_key: string;
  actions: PermissionActionRecord[];
};

type RolePermissionsMap = Record<
  string,
  Partial<Record<PermissionColumnKey, boolean>> | string[]
>;

export const ALL_PERMISSION_ACTIONS: PermissionColumnKey[] = [
  "view",
  "create",
  "edit",
  "delete",
];

export const normalizeModuleKeyToRowId = (moduleKey: string) =>
  moduleKey.replace(/_/g, "-");

export const normalizeRowIdToModuleKey = (rowId: string) =>
  rowId.replace(/-/g, "_");

const MODULE_LABEL_ACRONYMS = new Set(["cp"]);

export const formatModuleLabel = (moduleKey: string) =>
  moduleKey
    .split("_")
    .filter(Boolean)
    .map((part) => {
      const normalized = part.trim();
      if (!normalized) return "";
      if (MODULE_LABEL_ACRONYMS.has(normalized.toLowerCase())) {
        return normalized.toUpperCase();
      }
      if (/^[A-Z0-9]+$/.test(normalized)) {
        return normalized;
      }
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .filter(Boolean)
    .join(" ");

const getAllowedActions = (row: PermissionMatrixRow) =>
  row.allowedActions?.length ? row.allowedActions : ALL_PERMISSION_ACTIONS;

const getModuleActions = (module: PermissionModuleRecord) =>
  module.actions
    .map((action) =>
      typeof action === "string" ? action : action.action_key,
    )
    .filter((action): action is PermissionColumnKey =>
      ALL_PERMISSION_ACTIONS.includes(action as PermissionColumnKey),
    );

const createAccess = (allowedActions: PermissionColumnKey[]) =>
  ALL_PERMISSION_ACTIONS.reduce<Record<PermissionColumnKey, boolean>>(
    (access, action) => {
      access[action] = allowedActions.includes(action) ? false : false;
      return access;
    },
    { view: false, create: false, edit: false, delete: false },
  );

const createRow = (
  module: PermissionModuleRecord,
  label = formatModuleLabel(module.module_key),
): PermissionMatrixRow => {
  const allowedActions = getModuleActions(module);
  return {
    id: normalizeModuleKeyToRowId(module.module_key),
    label,
    selected: false,
    allowedActions,
    access: createAccess(allowedActions),
  };
};

export const buildPermissionRows = (
  modules: PermissionModuleRecord[] = [],
  scope?: string,
): PermissionMatrixRow[] => {
  if (!modules.length) {
    return basePermissions.map((row) => ({
      ...row,
      access: { ...row.access },
    }));
  }

  if (scope !== "admin") return modules.map((module) => createRow(module));

  const modulesByKey = new Map(
    modules.map((module) => [module.module_key, module]),
  );
  const groupedChildKeys = new Set(
    Object.values(ADMIN_PERMISSION_MENU_HIERARCHY).flatMap(
      (group) => group.children,
    ),
  );
  const rows: PermissionMatrixRow[] = [];

  modules.forEach((module) => {
    const hierarchy = ADMIN_PERMISSION_MENU_HIERARCHY[module.module_key];

    if (hierarchy) {
      const parent = createRow(module, hierarchy.label);
      parent.children = hierarchy.children
        .map((childKey) => modulesByKey.get(childKey))
        .filter((child): child is PermissionModuleRecord => Boolean(child))
        .map((child) => createRow(child));
      parent.checkState = computeParentCheckState(parent.children);
      parent.isExpanded = false;
      parent.selected = parent.checkState === "checked";
      rows.push(parent);
      return;
    }

    if (!groupedChildKeys.has(module.module_key)) rows.push(createRow(module));
  });

  return rows;
};

const applyPermissionValue = (
  row: PermissionMatrixRow,
  permissionValue: RolePermissionsMap[string],
) => {
  const access = { ...row.access };

  if (Array.isArray(permissionValue)) {
    ALL_PERMISSION_ACTIONS.forEach((action) => {
      access[action] = permissionValue.includes(action);
    });
  } else if (permissionValue && typeof permissionValue === "object") {
    ALL_PERMISSION_ACTIONS.forEach((action) => {
      access[action] = Boolean(permissionValue[action]);
    });
  }

  return access;
};

const isRowFullySelected = (row: PermissionMatrixRow) =>
  getAllowedActions(row).every((action) => Boolean(row.access[action]));

export const computeParentCheckState = (
  children: PermissionMatrixRow[],
): "checked" | "unchecked" | "indeterminate" => {
  if (!children.length) return "unchecked";

  const everyChildFullyChecked = children.every((child) =>
    getAllowedActions(child).every((action) => Boolean(child.access[action])),
  );
  const noChildHasAccess = children.every((child) =>
    getAllowedActions(child).every((action) => !child.access[action]),
  );

  if (everyChildFullyChecked) return "checked";
  if (noChildHasAccess) return "unchecked";
  return "indeterminate";
};

const applyPermissionsToRow = (
  row: PermissionMatrixRow,
  permissions: RolePermissionsMap,
): PermissionMatrixRow => {
  const moduleKey = normalizeRowIdToModuleKey(row.id);
  const access = applyPermissionValue(row, permissions[moduleKey]);

  if (!row.children) {
    return {
      ...row,
      access,
      selected: isRowFullySelected({ ...row, access }),
    };
  }

  const children = row.children.map((child) =>
    applyPermissionsToRow(child, permissions),
  );
  const checkState = computeParentCheckState(children);
  const expectedParentValue = checkState === "checked";
  const parentHasMismatch = getAllowedActions(row).some(
    (action) => Boolean(access[action]) !== expectedParentValue,
  );

  if (parentHasMismatch && typeof console !== "undefined") {
    console.warn(
      `[permissions] Parent permission mismatch for ${moduleKey}; trusting child permissions.`,
    );
  }

  return {
    ...row,
    access,
    children,
    checkState,
    selected: checkState === "checked",
    isExpanded: checkState !== "unchecked",
  };
};

export const applyPermissionsToRows = (
  rows: PermissionMatrixRow[],
  permissions: RolePermissionsMap = {},
): PermissionMatrixRow[] => rows.map((row) => applyPermissionsToRow(row, permissions));

const getMirroredParentAccess = (
  row: PermissionMatrixRow,
): Record<PermissionColumnKey, boolean> => {
  const isChecked = row.checkState === "checked";
  return ALL_PERMISSION_ACTIONS.reduce<Record<PermissionColumnKey, boolean>>(
    (access, action) => {
      access[action] = getAllowedActions(row).includes(action) && isChecked;
      return access;
    },
    { view: false, create: false, edit: false, delete: false },
  );
};

const collectPermissionRows = (
  rows: PermissionMatrixRow[],
  includeEmpty: boolean,
) => {
  const permissions: Record<string, PermissionColumnKey[]> = {};

  rows.forEach((row) => {
    const moduleKey = normalizeRowIdToModuleKey(row.id);
    const actions = row.children
      ? ALL_PERMISSION_ACTIONS.filter((action) =>
          getMirroredParentAccess(row)[action],
        )
      : ALL_PERMISSION_ACTIONS.filter((action) => row.access[action]);

    if (includeEmpty || actions.length) permissions[moduleKey] = actions;

    if (row.children) {
      Object.assign(permissions, collectPermissionRows(row.children, includeEmpty));
    }
  });

  return permissions;
};

export const extractPermissionsFromRows = (rows: PermissionMatrixRow[]) =>
  collectPermissionRows(rows, true);

const collectPermissionState = (
  rows: PermissionMatrixRow[],
  permissions: Record<string, Record<PermissionColumnKey, boolean>>,
) => {
  rows.forEach((row) => {
    const moduleKey = normalizeRowIdToModuleKey(row.id);
    const access = row.children ? getMirroredParentAccess(row) : row.access;
    permissions[moduleKey] = {
      view: Boolean(access.view),
      create: Boolean(access.create),
      edit: Boolean(access.edit),
      delete: Boolean(access.delete),
    };

    if (row.children) collectPermissionState(row.children, permissions);
  });

  return permissions;
};

export const extractPermissionStateFromRows = (rows: PermissionMatrixRow[]) =>
  collectPermissionState(rows, {});
