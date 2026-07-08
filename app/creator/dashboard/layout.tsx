"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { CheckVerificationStatus, CheckCPStatus } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchAndCommitUserPermissions } from "@/lib/permissionsActions";
import {
  canAccessPortalPath,
  getFirstAllowedPortalPath,
  hasModulePermission,
  type PermissionsMap,
} from "@/lib/permissions";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import Sidebar from "@/components/creator-profile/Sidebar";

type CpStatusPayload = {
  success?: boolean;
  status?: string;
  message?: string;
  crew_member_id?: string | number;
};

type CpStatusResponse = CpStatusPayload & {
  data?: CpStatusPayload;
};

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = useSidebar();
  const { isDark } = useResolvedTheme();
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { logout, user } = useAuth();
  
  const { permissions, permissionsVersion } = useAppSelector((state) => ({
    permissions: state.auth.permissions,
    permissionsVersion: state.auth.permissionsVersion,
  }));
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Sync Permissions
  useEffect(() => {
    const userId = user?.id;
    if (!mounted || !userId) return;

    void fetchAndCommitUserPermissions(dispatch, userId, { broadcast: false });
  }, [user?.id, mounted, dispatch]);

  // Route Guard Checks
  useEffect(() => {
    if (!mounted || !permissions) return;

    if (!canAccessPortalPath(pathname, permissions)) {
      const fallbackPath = getFirstAllowedPortalPath("creator", permissions);
      if (fallbackPath && fallbackPath !== pathname) {
        router.replace(fallbackPath);
      }
    }
  }, [mounted, pathname, permissions, permissionsVersion, router]);

  // Global CP status check for all creator pages
  useEffect(() => {
    const checkCpStatus = async () => {
      try {
        const response = await CheckCPStatus();
        const statusResponse = response as CpStatusResponse;
        const data = statusResponse.data ?? statusResponse;

        if (data?.success === false || data?.status === "inactive") {
          toast.error(data?.message || "Your creator account is inactive.");
          logout();
          localStorage.clear();
          router.push("/login");
          return;
        }

        // Optional: keep crew_member_id in sync if backend returns it
        if (data?.crew_member_id) {
          const userStr = typeof window !== 'undefined' ? localStorage.getItem("revure_user") : null;
          const localUser = userStr ? JSON.parse(userStr) : null;
          if (localUser && localUser.crew_member_id !== data.crew_member_id) {
            const updatedUser = { ...localUser, crew_member_id: data.crew_member_id };
            localStorage.setItem("revure_user", JSON.stringify(updatedUser));
          }
        }
      } catch (err) {
        console.error("Check CP status error:", err);
      }
    };

    checkCpStatus();
  }, [pathname, logout, router]);

  return (
    <div className={`flex flex-1 overflow-hidden relative transition-colors duration-300 ${
      isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"
    }`}>
      {/* Desktop Panel View */}
      <div className="hidden lg:block h-full border-r border-transparent">
        <Sidebar permissionsVersion={permissionsVersion} />
      </div>

      {/* Mobile Drawer */}
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
              <Sidebar onClose={() => setIsOpen(false)} permissionsVersion={permissionsVersion} />
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

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const { isDark } = useResolvedTheme();

  return (
    <SidebarProvider>
      <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-[#0f0f0f] text-white" : "bg-[#F4F5F7] text-[#000000]"
      }`}>
        <LayoutContent>{children}</LayoutContent>
      </div>
    </SidebarProvider>
  );
}