"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";

import Sidebar from "@/components/production-manager/Sidebar";
import Topbar from '@/components/production-manager/Topbar';
import { useTheme } from "next-themes"; // Integrated theme hook

import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchAndCommitUserPermissions } from '@/lib/permissionsActions';
import { canAccessPortalPath, getFirstAllowedPortalPath } from '@/lib/permissions';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  // Default to dark logic as per instructions
  const isDark = !mounted || theme === "dark";

  return (
    <div className={`flex flex-1 overflow-hidden relative transition-colors duration-300 ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"
      }`}>
      {/* <Topbar pathname={pathname} onMenuClick={() => setMobileOpen(true)} /> */}

      {/* <div className="flex flex-1 overflow-hidden relative"> */}
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full border-r border-transparent">
        <Sidebar />
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
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
              <Sidebar onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {children}
      </main>
    </div>
    // {/* </div> */}
  );
}

export default function ProdManagerLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { user, permissions, permissionsVersion } = useAppSelector((state) => state.auth);
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const userId = user?.id;
    if (!mounted || !userId) return;

    void fetchAndCommitUserPermissions(dispatch, userId, { broadcast: false });
  }, [user?.id, mounted, dispatch]);

  useEffect(() => {
    if (!mounted || !permissions) return;

    if (!canAccessPortalPath(pathname, permissions)) {
      const fallbackPath = getFirstAllowedPortalPath("production-manager", permissions);
      if (fallbackPath && fallbackPath !== pathname) {
        router.replace(fallbackPath);
      }
    }
  }, [mounted, pathname, permissions, permissionsVersion, router]);

  const isDark = !mounted || theme === "dark";

  return (
    <SidebarProvider>
      {/* Root container handles base text and background colors */}
      <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${isDark
          ? "bg-[#0f0f0f] text-white"
          : "bg-[#F4F5F7] text-[#000000]"
        }`}>
        <LayoutContent>{children}</LayoutContent>
      </div>
    </SidebarProvider>
  );
}
