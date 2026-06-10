"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import PortalLayoutShell from "@/components/common/PortalLayoutShell";
import { SalesStatusProvider, useSalesStatus } from "@/context/SalesStatusContext";
import { syncEffectiveUserPermissions } from "@/lib/effective-permissions";
import { getFirstAllowedPortalPath } from "@/lib/permissions";
import { canAccessPortalPath } from "@/lib/portal-routing";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { isSalesRouteAllowedWhileInactive } from "@/lib/sales-status";

function SalesLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hasShownInactiveRedirectRef = useRef(false);
  const dispatch = useAppDispatch();
  const { user, permissions } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const {
    isManagedUser,
    isSalesAvailable,
    isLoading: isSalesStatusLoading,
  } = useSalesStatus();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fetchPermissions = async () => {
      const userId = user?.id;
      if (userId) {
        try {
          await syncEffectiveUserPermissions(userId, dispatch);
        } catch (error) {
          console.error("SalesLayout: Error fetching permissions:", error);
        }
      }
    };

    if (mounted) {
      void fetchPermissions();
    }
  }, [user?.id, pathname, mounted, dispatch]);

  const shouldBlockCurrentRoute =
    isManagedUser &&
    !isSalesStatusLoading &&
    !isSalesAvailable &&
    !isSalesRouteAllowedWhileInactive(pathname);

  useEffect(() => {
    if (!shouldBlockCurrentRoute) {
      hasShownInactiveRedirectRef.current = false;
      return;
    }

    if (!hasShownInactiveRedirectRef.current) {
      toast.error("Your sales status is inactive. Set it to active to access details.");
      hasShownInactiveRedirectRef.current = true;
    }

    router.replace("/sales/dashboard");
  }, [router, shouldBlockCurrentRoute]);

  useEffect(() => {
    if (!mounted || !permissions || shouldBlockCurrentRoute) return;

    if (!canAccessPortalPath(pathname, permissions)) {
      const fallbackPath = getFirstAllowedPortalPath("sales", permissions);
      if (fallbackPath && fallbackPath !== pathname) {
        router.replace(fallbackPath);
      }
    }
  }, [mounted, pathname, permissions, router, shouldBlockCurrentRoute]);

  return (
    <PortalLayoutShell
      portal="sales"
      hideChildren={shouldBlockCurrentRoute}
      salesState={{
        isManagedUser,
        isSalesAvailable,
        isSalesStatusLoading,
        isRouteAllowedWhileInactive: isSalesRouteAllowedWhileInactive,
      }}
    >
      {children}
    </PortalLayoutShell>
  );
}

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <SalesStatusProvider>
      <SalesLayoutContent>{children}</SalesLayoutContent>
    </SalesStatusProvider>
  );
}
