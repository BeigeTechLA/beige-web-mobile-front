"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes"; // Integrated theme hook

import Sidebar from "@/components/admin/Sidebar";
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchAndCommitUserPermissions } from '@/lib/permissionsActions';
import { canAccessPortalPath, getFirstAllowedPortalPath } from '@/lib/permissions';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = useSidebar();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  // Default to dark logic as per instructions
  const isDark = !mounted || theme === "dark";

  return (
    <div className={`flex flex-1 min-h-0 overflow-hidden relative transition-colors duration-300 ${
      isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"
    }`}>
      <div className="hidden lg:block h-full border-r border-transparent">
        <Sidebar />
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed top-0 left-0 bottom-0 w-[280px] z-[80] lg:hidden"
            >
              <Sidebar onClose={() => setIsOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, permissions, permissionsVersion } = useAppSelector((state) => state.auth);
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isResolvingInitialRoute, setIsResolvingInitialRoute] = useState(true);
  const shouldGateInitialAdminRoute = pathname === "/admin" || pathname === "/admin/dashboard";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const userId = user?.id;
    if (!mounted) return;

    if (!shouldGateInitialAdminRoute) {
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
        const fallbackPath = getFirstAllowedPortalPath("admin", latestPermissions);
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
  }, [user?.id, mounted, dispatch, pathname, permissions, router, shouldGateInitialAdminRoute]);

  useEffect(() => {
    if (!mounted || !permissions) return;

    if (!canAccessPortalPath(pathname, permissions)) {
      const fallbackPath = getFirstAllowedPortalPath("admin", permissions);
      if (fallbackPath && fallbackPath !== pathname) {
        router.replace(fallbackPath);
      }
    }
  }, [mounted, pathname, permissions, permissionsVersion, router]);

  const isDark = !mounted || theme === "dark";

  return (
    <SidebarProvider>
      {/* Root container handles base text and background colors */}
      <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${
        isDark 
          ? "bg-[#101010] text-white" 
          : "bg-[#F4F5F7] text-[#000000]"
      }`}>
        {isResolvingInitialRoute && shouldGateInitialAdminRoute ? null : (
          <LayoutContent>{children}</LayoutContent>
        )}
      </div>
    </SidebarProvider>
  );
}
