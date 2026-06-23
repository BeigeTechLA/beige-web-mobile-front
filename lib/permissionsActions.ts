import type { AppDispatch } from "./redux/store";
import { setPermissions } from "./redux/features/auth/authSlice";
import { adminApi } from "./api";
import {
  normalizePermissionsPayload,
  type PermissionsMap,
} from "./permissions";
import { broadcastPermissionsUpdated } from "./permissionsRefresh";

type CommitOptions = {
  /** When false, skips localStorage / cross-tab broadcast. Defaults to true. */
  broadcast?: boolean;
};

/**
 * Persist permissions in Redux + cookie and optionally notify other tabs.
 */
export const commitPermissionsUpdate = (
  dispatch: AppDispatch,
  permissions: PermissionsMap,
  options?: CommitOptions,
) => {
  dispatch(setPermissions(permissions));

  if (options?.broadcast !== false) {
    broadcastPermissionsUpdated();
  }
};

/**
 * Fetch the latest permissions for a user and commit them to Redux.
 */
export const fetchAndCommitUserPermissions = async (
  dispatch: AppDispatch,
  userId: string | number,
  options?: CommitOptions,
): Promise<PermissionsMap | null> => {
  try {
    const response = await adminApi.getUserPermissions(userId);

    if (response?.success && response.data) {
      const normalized = normalizePermissionsPayload(response.data);
      commitPermissionsUpdate(dispatch, normalized, options);
      return normalized;
    }
  } catch (error) {
    console.error("Failed to fetch user permissions:", error);
  }

  return null;
};
