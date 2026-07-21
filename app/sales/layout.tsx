"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import SalesSidebar from "@/components/sales/Sidebar";
import { useTheme } from "next-themes"; // Integrated theme hook

import { SalesStatusProvider, useSalesStatus } from '@/context/SalesStatusContext';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { isSalesRouteAllowedWhileInactive } from '@/lib/sales-status';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchAndCommitUserPermissions } from '@/lib/permissionsActions';
import { canAccessPortalPath, getFirstAllowedPortalPath } from '@/lib/permissions';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, setIsOpen } = useSidebar();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const shouldGateInitialSalesRoute = pathname === "/sales" || pathname === "/sales/dashboard";
  const {
    isManagedUser,
    isSalesAvailable,
    isLoading: isSalesStatusLoading,
  } = useSalesStatus();
  
  const hasShownInactiveRedirectRef = React.useRef(false);
  const dispatch = useAppDispatch();
  const { user, permissions, permissionsVersion } = useAppSelector((state) => state.auth);

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const userId = user?.id;
    if (!mounted || !userId || shouldGateInitialSalesRoute) return;

    void fetchAndCommitUserPermissions(dispatch, userId, { broadcast: false });
  }, [user?.id, mounted, dispatch, shouldGateInitialSalesRoute]);

  // Default to dark logic as per instructions
  const isDark = !mounted || theme === "dark";
  const isAllowedWhileInactive = isSalesRouteAllowedWhileInactive(pathname);
  const shouldBlockCurrentRoute =
    isManagedUser &&
    !isSalesStatusLoading &&
    !isSalesAvailable &&
    !isAllowedWhileInactive;

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
  }, [mounted, pathname, permissions, permissionsVersion, router, shouldBlockCurrentRoute]);

  return (
    <div className={`flex flex-1 overflow-hidden relative transition-colors duration-300 ${
      isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"
    }`}>
      <div className="hidden lg:block h-full border-r border-transparent">
        <SalesSidebar />
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] z-[80] lg:hidden"
            >
              <SalesSidebar onClose={() => setIsOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {shouldBlockCurrentRoute ? null : children}
      </main>
    </div>
  );
}

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isResolvingInitialRoute, setIsResolvingInitialRoute] = useState(true);
  const pathname = usePathname();
  const shouldGateInitialSalesRoute = pathname === "/sales" || pathname === "/sales/dashboard";
  const dispatch = useAppDispatch();
  const { user, permissions } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const userId = user?.id;
    if (!mounted) return;

    if (!shouldGateInitialSalesRoute) {
      setIsResolvingInitialRoute(false);
      return;
    }

    if (!userId) {
      setIsResolvingInitialRoute(false);
      return;
    }

    let isCancelled = false;
    setIsResolvingInitialRoute(true);

    const resolveInitialRoute = async () => {
      const latestPermissions =
        permissions ?? (await fetchAndCommitUserPermissions(dispatch, userId, { broadcast: false }));

      if (isCancelled) return;

      if (!canAccessPortalPath(pathname, latestPermissions)) {
        const fallbackPath = getFirstAllowedPortalPath("sales", latestPermissions);
        if (fallbackPath && fallbackPath !== pathname) {
          router.replace(fallbackPath);
          return;
        }
      }

      setIsResolvingInitialRoute(false);
    };

    void resolveInitialRoute();

    return () => {
      isCancelled = true;
    };
  }, [user?.id, mounted, dispatch, pathname, permissions, router, shouldGateInitialSalesRoute]);

  const isDark = !mounted || theme === "dark";

  return (
    <SidebarProvider>
      <SalesStatusProvider>
        {/* Root container handles base text and background colors */}
        <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${
          isDark 
            ? "bg-[#0f0f0f] text-white" 
            : "bg-[#F4F5F7] text-[#000000]"
        }`}>
          {isResolvingInitialRoute && shouldGateInitialSalesRoute ? null : <LayoutContent>{children}</LayoutContent>}
        </div>
      </SalesStatusProvider>
    </SidebarProvider>
  );
}
