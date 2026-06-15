"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchAndCommitUserPermissions } from "@/lib/permissionsActions";
import { subscribeToPermissionsUpdates } from "@/lib/permissionsRefresh";

/**
 * Global listener that refetches permissions when another tab (or the same tab)
 * broadcasts a permissions update. Mounted once at the app root.
 */
export function PermissionsSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    const refreshPermissions = async () => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      try {
        await fetchAndCommitUserPermissions(dispatch, userId, {
          broadcast: false,
        });
      } finally {
        isFetchingRef.current = false;
      }
    };

    return subscribeToPermissionsUpdates(refreshPermissions);
  }, [dispatch, userId]);

  return <>{children}</>;
}
