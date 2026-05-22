"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes"; // Integrated theme hook

import Sidebar from "@/components/admin/Sidebar";
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { adminApi } from '@/lib/api';
import { setPermissions } from '@/lib/redux/features/auth/authSlice';
import { normalizePermissionsPayload } from '@/lib/permissions';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = useSidebar();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  // Default to dark logic as per instructions
  const isDark = !mounted || theme === "dark";

  return (
    <div className={`flex flex-1 overflow-hidden relative transition-colors duration-300 ${
      isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"
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
  const { user } = useAppSelector((state) => state.auth);
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fetchPermissions = async () => {
      const userId = user?.id;
      
      console.log("AdminLayout: User object:", user);
      console.log("AdminLayout: User ID:", userId);

      // Fetch permissions on mount and on route change
      if (userId) {
        console.log("AdminLayout: Fetching permissions for User ID:", userId);
        try {
          const response = await adminApi.getUserPermissions(userId);
          console.log("AdminLayout: Permissions API Response:", response);
          if (response?.success && response.data) {
            dispatch(setPermissions(normalizePermissionsPayload(response.data)));
          }
        } catch (error) {
          console.error("AdminLayout: Error fetching permissions:", error);
        }
      } else if (!userId && user) {
        console.warn("AdminLayout: No user ID found in user object!");
      }
    };

    if (mounted) {
      fetchPermissions();
    }
  }, [user?.id, pathname, mounted, dispatch]);

  const isDark = !mounted || theme === "dark";

  return (
    <SidebarProvider>
      {/* Root container handles base text and background colors */}
      <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${
        isDark 
          ? "bg-[#0f0f0f] text-white" 
          : "bg-[#F4F5F7] text-[#000000]"
      }`}>
        <LayoutContent>{children}</LayoutContent>
      </div>
    </SidebarProvider>
  );
}
