"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";

import PortalSidebar from "@/components/common/PortalSidebar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import type { PortalKey } from "@/lib/portal-sidebar-config";

type SalesSidebarState = {
  isManagedUser: boolean;
  isSalesAvailable: boolean;
  isSalesStatusLoading: boolean;
  isRouteAllowedWhileInactive: (link?: string) => boolean;
};

type PortalLayoutShellProps = {
  portal: PortalKey;
  children: React.ReactNode;
  hideChildren?: boolean;
  salesState?: SalesSidebarState;
};

function LayoutContent({ portal, children, hideChildren = false, salesState }: PortalLayoutShellProps) {
  const { isOpen, setIsOpen } = useSidebar();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  return (
    <div className={`flex flex-1 overflow-hidden relative transition-colors duration-300 ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
      <div className="hidden lg:block h-full border-r border-transparent">
        <PortalSidebar portal={portal} salesState={salesState} />
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] z-[80] lg:hidden"
            >
              <PortalSidebar portal={portal} onClose={() => setIsOpen(false)} salesState={salesState} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto custom-scrollbar">{hideChildren ? null : children}</main>
    </div>
  );
}

export default function PortalLayoutShell(props: PortalLayoutShellProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  return (
    <SidebarProvider>
      <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${isDark ? "bg-[#0f0f0f] text-white" : "bg-[#F4F5F7] text-[#000000]"}`}>
        <LayoutContent {...props} />
      </div>
    </SidebarProvider>
  );
}
