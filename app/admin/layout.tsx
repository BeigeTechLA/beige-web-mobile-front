"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes"; // Integrated theme hook

import Sidebar from "@/components/admin/Sidebar";
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { adminApi } from '@/lib/api';
import { setPermissions } from '@/lib/redux/features/auth/authSlice';

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
  const { user, permissions } = useAppSelector((state) => state.auth);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fetchPermissions = async () => {
      // Try to get role ID from various possible fields
      const effectiveRoleId = user?.role_id || user?.user_type_id || user?.userTypeId;
      
      console.log("AdminLayout: User object:", user);
      console.log("AdminLayout: Effective Role ID:", effectiveRoleId);

      // Only fetch if we have a role ID and permissions aren't already loaded
      if (effectiveRoleId && !permissions) {
        console.log("AdminLayout: Fetching permissions for ID:", effectiveRoleId);
        try {
          const response = await adminApi.getRoleById(effectiveRoleId);
          console.log("AdminLayout: Permissions API Response:", response);
          if (response?.success && response.data?.permissions) {
            dispatch(setPermissions(response.data.permissions));
          }
        } catch (error) {
          console.error("AdminLayout: Error fetching permissions:", error);
        }
      } else if (!effectiveRoleId && user) {
        console.warn("AdminLayout: No role ID or user type ID found in user object!");
      }
    };

    if (mounted) {
      fetchPermissions();
    }
  }, [user, permissions, mounted, dispatch]);

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
