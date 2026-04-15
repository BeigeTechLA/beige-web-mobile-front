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

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, setIsOpen } = useSidebar();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const hasShownInactiveRedirectRef = React.useRef(false);
  const {
    isManagedUser,
    isSalesAvailable,
    isLoading: isSalesStatusLoading,
  } = useSalesStatus();

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

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

  useEffect(() => setMounted(true), []);

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
          <LayoutContent>{children}</LayoutContent>
        </div>
      </SalesStatusProvider>
    </SidebarProvider>
  );
}
