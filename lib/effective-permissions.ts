"use client";

import Cookies from "js-cookie";
import { adminApi } from "@/lib/api";
import {
  normalizePermissionsPayload,
  type PermissionsMap,
} from "@/lib/permissions";
import { setPermissions } from "@/lib/redux/features/auth/authSlice";
import type { AppDispatch } from "@/lib/redux/store";
import { getPortalFromPermissionsOrRoutes } from "@/lib/auth-routing";

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
  const mergedPermissions: PermissionsMap = { ...normalizedRolePermissions };

  Object.entries(normalizedCustomPermissions).forEach(([moduleKey, actions]) => {
    mergedPermissions[moduleKey] = {
      ...(mergedPermissions[moduleKey] ?? {}),
      ...actions,
    };
  });

  return mergedPermissions;
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
  const effectivePermissions = mergePermissionMaps(rolePermissions, customPermissions);

  return {
    rolePermissions,
    customPermissions,
    hasCustomPermissions: Object.keys(customPermissions).length > 0,
    effectivePermissions,
  };
};

export const syncEffectiveUserPermissions = async (
  userId: number | string,
  dispatch: AppDispatch,
) => {
  const { effectivePermissions } = await fetchEffectiveUserPermissions(userId);
  dispatch(setPermissions(effectivePermissions));

  const portal = getPortalFromPermissionsOrRoutes(effectivePermissions);
  if (portal) {
    Cookies.set("revure_portal", portal, { expires: 7 });
  } else {
    Cookies.remove("revure_portal");
  }

  return effectivePermissions;
};
