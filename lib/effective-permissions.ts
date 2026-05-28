"use client";

import { adminApi } from "@/lib/api";
import {
  normalizePermissionsPayload,
  type PermissionsMap,
} from "@/lib/permissions";

type EffectivePermissionsResult = {
  effectivePermissions: PermissionsMap;
  customPermissions: PermissionsMap;
  rolePermissions: PermissionsMap;
  hasCustomPermissions: boolean;
};

export const mergePermissionMaps = (
  rolePermissions: PermissionsMap | null | undefined,
  customPermissions: PermissionsMap | null | undefined,
): PermissionsMap => {
  const normalizedRolePermissions = normalizePermissionsPayload(rolePermissions ?? {});
  const normalizedCustomPermissions = normalizePermissionsPayload(customPermissions ?? {});

  return {
    ...normalizedRolePermissions,
    ...normalizedCustomPermissions,
  };
};

export const fetchEffectiveUserPermissions = async (
  userId: number | string,
): Promise<EffectivePermissionsResult> => {
  const [userRoleDetailsResponse, customPermissionsResponse] = await Promise.all([
    adminApi.getUserRoleDetails(userId),
    adminApi.getUserPermissions(userId),
  ]);

  const roleId = userRoleDetailsResponse?.data?.role?.role_id;
  let rolePermissions = normalizePermissionsPayload(
    userRoleDetailsResponse?.data?.permissions ?? {},
  );

  if (roleId) {
    try {
      const roleResponse = await adminApi.getRoleById(roleId);
      if (roleResponse?.success && roleResponse?.data?.permissions) {
        rolePermissions = normalizePermissionsPayload(roleResponse.data.permissions);
      }
    } catch (error) {
      console.error("Failed to fetch role permissions:", error);
    }
  }

  const customPermissions = normalizePermissionsPayload(
    customPermissionsResponse?.data ?? {},
  );

  return {
    rolePermissions,
    customPermissions,
    hasCustomPermissions: Object.keys(customPermissions).length > 0,
    effectivePermissions: mergePermissionMaps(rolePermissions, customPermissions),
  };
};
