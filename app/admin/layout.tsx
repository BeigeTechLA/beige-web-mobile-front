"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import PortalLayoutShell from "@/components/common/PortalLayoutShell";
import { fetchEffectiveUserPermissions } from "@/lib/effective-permissions";
import { canAccessPortalPath, getFirstAllowedPortalPath } from "@/lib/permissions";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setPermissions } from "@/lib/redux/features/auth/authSlice";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, permissions } = useAppSelector((state) => state.auth);
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fetchPermissions = async () => {
      const userId = user?.id;

      if (userId) {
        try {
          const { effectivePermissions } = await fetchEffectiveUserPermissions(userId);
          dispatch(setPermissions(effectivePermissions));
        } catch (error) {
          console.error("AdminLayout: Error fetching permissions:", error);
        }
      }
    };

    if (mounted) {
      void fetchPermissions();
    }
  }, [user?.id, pathname, mounted, dispatch]);

  useEffect(() => {
    if (!mounted || !permissions) return;

    if (!canAccessPortalPath(pathname, permissions)) {
      const fallbackPath = getFirstAllowedPortalPath("admin", permissions);
      if (fallbackPath && fallbackPath !== pathname) {
        router.replace(fallbackPath);
      }
    }
  }, [mounted, pathname, permissions, router]);

  return <PortalLayoutShell portal="admin">{children}</PortalLayoutShell>;
}
