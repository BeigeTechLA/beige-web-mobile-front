"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import PortalLayoutShell from "@/components/common/PortalLayoutShell";
import { syncEffectiveUserPermissions } from "@/lib/effective-permissions";
import { getFirstAllowedPortalPath } from "@/lib/permissions";
import { canAccessPortalPath } from "@/lib/portal-routing";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";

export default function ProdManagerLayout({ children }: { children: React.ReactNode }) {
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
          await syncEffectiveUserPermissions(userId, dispatch);
        } catch (error) {
          console.error("ProdManagerLayout: Error fetching permissions:", error);
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
      const fallbackPath = getFirstAllowedPortalPath("production-manager", permissions);
      if (fallbackPath && fallbackPath !== pathname) {
        router.replace(fallbackPath);
      }
    }
  }, [mounted, pathname, permissions, router]);

  return <PortalLayoutShell portal="production-manager">{children}</PortalLayoutShell>;
}
