"use client";

import { basePermissions } from "@/components/admin/roles-permissions/data";
import {
  type PermissionColumnKey,
  type PermissionMatrixRow,
} from "@/components/admin/roles-permissions/types";

type PermissionModuleRecord = {
  module_key?: string | null;
  actions?: string[] | null;
};

type RolePermissionsMap = Record<string, Partial<Record<PermissionColumnKey, boolean>> | string[]>;

const ALL_ACTIONS: PermissionColumnKey[] = ["view", "create", "edit", "delete"];

const getAllowedActions = (row: PermissionMatrixRow) =>
  row.allowedActions?.length ? row.allowedActions : ALL_ACTIONS;

const getAllowedActionsFromRecord = (
  value: Partial<Record<PermissionColumnKey, boolean>> | string[] | undefined,
) => {
  if (Array.isArray(value)) {
    return ALL_ACTIONS.filter((action) => value.includes(action));
  }

  if (!value || typeof value !== "object") {
    return ALL_ACTIONS;
  }

  return ALL_ACTIONS.filter((action) => Boolean(value[action]));
};

export const normalizeModuleKeyToRowId = (moduleKey: string | null | undefined) =>
  String(moduleKey || "").replace(/_/g, "-");

export const normalizeRowIdToModuleKey = (rowId: string | null | undefined) =>
  String(rowId || "").replace(/-/g, "_");

export const formatModuleLabel = (moduleKey: string | null | undefined) =>
  String(moduleKey || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const buildPermissionRows = (
  modules: PermissionModuleRecord[] = [],
): PermissionMatrixRow[] => {
  if (!modules.length) {
    return basePermissions.map((row) => ({
      ...row,
      access: { ...row.access },
    }));
  }

  return modules
    .filter((module) => Boolean(module?.module_key))
    .map((module) => {
      const moduleKey = String(module.module_key || "");
      const supportedActions = new Set(Array.isArray(module.actions) ? module.actions : []);
      const allowedActions = ALL_ACTIONS.filter((action) => supportedActions.has(action));
      const access = ALL_ACTIONS.reduce<Record<PermissionColumnKey, boolean>>(
        (acc, action) => {
          acc[action] = false;
          return acc;
        },
        { view: false, create: false, edit: false, delete: false },
      );

      return {
        id: normalizeModuleKeyToRowId(moduleKey),
        label: formatModuleLabel(moduleKey),
        selected: false,
        access,
        allowedActions: allowedActions.length ? allowedActions : undefined,
      };
    });
};

export const buildPermissionRowsFromMap = (
  permissions: RolePermissionsMap = {},
  moduleLabels: Record<string, string> = {},
  moduleActions: Record<string, PermissionColumnKey[]> = {},
): PermissionMatrixRow[] => {
  const entries = Object.entries(permissions);

  if (!entries.length) {
    return basePermissions.map((row) => ({
      ...row,
      access: { ...row.access },
    }));
  }

  return entries.map(([moduleKey, actionsValue]) => {
    const rowId = normalizeModuleKeyToRowId(moduleKey);
    const access = ALL_ACTIONS.reduce<Record<PermissionColumnKey, boolean>>(
      (acc, action) => {
        if (Array.isArray(actionsValue)) {
          acc[action] = actionsValue.includes(action);
        } else if (actionsValue && typeof actionsValue === "object") {
          acc[action] = Boolean(actionsValue[action]);
        } else {
          acc[action] = false;
        }
        return acc;
      },
      { view: false, create: false, edit: false, delete: false },
    );
    const allowedActions = moduleActions[moduleKey]?.length
      ? moduleActions[moduleKey]
      : ALL_ACTIONS;

    return {
      id: rowId,
      label: moduleLabels[moduleKey] || formatModuleLabel(moduleKey),
      selected: allowedActions.every((action) => access[action]),
      access,
      allowedActions: allowedActions.length ? allowedActions : undefined,
    };
  });
};

export const applyPermissionsToRows = (
  rows: PermissionMatrixRow[],
  permissions: RolePermissionsMap = {},
): PermissionMatrixRow[] =>
  rows.map((row) => {
    const permissionValue = permissions[normalizeRowIdToModuleKey(row.id)];

    const access = { ...row.access };

    if (Array.isArray(permissionValue)) {
      ALL_ACTIONS.forEach((action) => {
        access[action] = permissionValue.includes(action);
      });
    } else if (permissionValue && typeof permissionValue === "object") {
      ALL_ACTIONS.forEach((action) => {
        access[action] = Boolean(permissionValue[action]);
      });
    }

    return {
      ...row,
      access,
      selected: getAllowedActions(row).every((action) => access[action]),
    };
  });

export const extractPermissionsFromRows = (rows: PermissionMatrixRow[]) => {
  const permissions: Record<string, PermissionColumnKey[]> = {};

  rows.forEach((row) => {
    const actions = ALL_ACTIONS.filter((action) => row.access[action]);
    if (actions.length) {
      permissions[normalizeRowIdToModuleKey(row.id)] = actions;
    }
  });

  return permissions;
};

export const extractPermissionStateFromRows = (rows: PermissionMatrixRow[]) => {
  const permissions: Record<string, Record<PermissionColumnKey, boolean>> = {};

  rows.forEach((row) => {
    permissions[normalizeRowIdToModuleKey(row.id)] = {
      view: Boolean(row.access.view),
      create: Boolean(row.access.create),
      edit: Boolean(row.access.edit),
      delete: Boolean(row.access.delete),
    };
  });

  return permissions;
};
