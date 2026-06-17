"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Camera,
  FolderOpen,
  Menu,
  X,
  LogOut,
  Wallet,
  Settings,
  Calendar,
  User,
  MessageCircle,
  CalendarClock,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { CheckVerificationStatus, CheckCPStatus } from "@/lib/api";
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

export default function AffiliateLayout({ children }: { children: React.ReactNode; }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

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
    <div className="min-h-screen bg-[#0A0A0A] text-white flex overflow-hidden">
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar />
      </div>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#111] border-b border-white/10 px-4 h-16 flex items-center justify-between">
        <Link href="/" className="relative flex items-center">
          <Image src="https://d2jhn32fsulyac.cloudfront.net/assets/logos/beige_logo_vb.png" alt="BEIGE" width={100} height={20} />
          <span className="absolute right-0 -bottom-3 text-[8px] font-medium tracking-wide py-[1px] px-1 rounded-full text-white border border-white/40">Beta</span>
        </Link>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white">
          <Menu size={24} />
        </button>
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/80 z-50 lg:hidden backdrop-blur-sm" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed inset-y-0 left-0 z-50 w-64 bg-[#111] lg:hidden">
              <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-h-screen h-screen overflow-hidden">
        <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
