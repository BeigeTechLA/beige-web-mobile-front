"use client";

import { basePermissions } from "@/components/admin/roles-permissions/data";
import {
  type PermissionColumnKey,
  type PermissionMatrixRow,
} from "@/components/admin/roles-permissions/types";

type PermissionModuleRecord = {
  module_key: string;
  actions: string[];
};

type RolePermissionsMap = Record<string, Partial<Record<PermissionColumnKey, boolean>> | string[]>;

const ALL_ACTIONS: PermissionColumnKey[] = ["view", "create", "edit", "delete"];

const getAllowedActions = (row: PermissionMatrixRow) =>
  row.allowedActions?.length ? row.allowedActions : ALL_ACTIONS;

export const normalizeModuleKeyToRowId = (moduleKey: string) =>
  moduleKey.replace(/_/g, "-");

export const normalizeRowIdToModuleKey = (rowId: string) =>
  rowId.replace(/-/g, "_");

export const formatModuleLabel = (moduleKey: string) =>
  moduleKey
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

  return modules.map((module) => {
    const supportedActions = new Set(module.actions);
    const allowedActions = ALL_ACTIONS.filter((action) => supportedActions.has(action));
    const access = ALL_ACTIONS.reduce<Record<PermissionColumnKey, boolean>>(
      (acc, action) => {
        acc[action] = false;
        return acc;
      },
      { view: false, create: false, edit: false, delete: false },
    );

    return {
      id: normalizeModuleKeyToRowId(module.module_key),
      label: formatModuleLabel(module.module_key),
      selected: false,
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
