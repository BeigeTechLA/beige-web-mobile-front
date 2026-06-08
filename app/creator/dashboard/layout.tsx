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
        <Sidebar pathname={pathname} />
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
              <Sidebar pathname={pathname} onClose={() => setIsSidebarOpen(false)} />
              <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 p-2 text-white/60"><X size={20} /></button>
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

function Sidebar({ pathname, onClose }: { pathname: string; onClose?: () => void; }) {
  const { logout, user } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const handleLogout = useCallback(() => { logout(); localStorage.clear(); onClose?.(); }, [logout, onClose]);

  // LOGIC TO SYNC SIDEBAR LOCKS AND CHECK STATUS
  useEffect(() => {
    const syncStatus = async () => {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem("revure_user") : null;
      const localUser = userStr ? JSON.parse(userStr) : null;
      const crewId = user?.crew_member_id || localUser?.crew_member_id;

      if (!crewId) return;

      try {
        // Check if CP is still active/not deleted
        const statusResponse = await CheckCPStatus();
        if (statusResponse && (statusResponse.error || statusResponse.success === false || statusResponse.is_deleted)) {
          // If the API indicates the CP is not found or error (meaning deleted/inactive)
          handleLogout();
          return;
        }

        const response = await CheckVerificationStatus({ crew_member_id: crewId });
        if (response && !response.error && response.data?.data) {
          const status = Number(response.data.data.is_crew_verified);
          setIsVerified(status === 1);

          // Keep storage in sync
          const updatedUser = { ...localUser, is_crew_verified: status };
          localStorage.setItem("revure_user", JSON.stringify(updatedUser));
        }
      } catch (err) {
        console.error("Sidebar sync error", err);
      }
    };
    syncStatus();
  }, [handleLogout, pathname, user]);
  const isActive = (path: string) => pathname === path;

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) => {
    const active = isActive(href);
    // Allow key account/file access pages even when verification is pending or rejected.
    const isPublic =
      href === "/creator/dashboard" ||
      href === "/creator/dashboard/profile" ||
      href === "/creator/dashboard/file-manager";
    const locked = !isVerified && !isPublic;

    if (locked) {
      return (
        <div className="flex items-center w-full gap-3 px-3 py-3 rounded-lg font-medium text-white/20 cursor-not-allowed opacity-50">
          <Icon size={20} />
          <span>{label}</span>
        </div>
      );
    }

    return (
      <Link href={href} onClick={onClose} className={`flex items-center w-full gap-3 px-3 py-3 rounded-lg font-medium transition-colors ${active ? "bg-[#E8D1AB]/10 text-[#E8D1AB]" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
        <Icon size={20} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#111] border-r border-white/10 w-64">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="relative flex items-center w-fit">
          <Image src="https://d2jhn32fsulyac.cloudfront.net/assets/logos/beige_logo_vb.png" alt="BEIGE" width={158} height={32} />
        </Link>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1">
        <NavLink href="/creator/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavLink href="/creator/dashboard/request" icon={Camera} label="Request & Shoots" />
        <NavLink href="/creator/dashboard/file-manager" icon={FolderOpen} label="File Manager" />
        <NavLink href="/creator/dashboard/meetings" icon={CalendarClock} label="Meetings" />
        <NavLink href="/creator/dashboard/messages" icon={MessageCircle} label="Messages" />
        <NavLink href="/creator/dashboard/affiliate" icon={LayoutDashboard} label="Affiliate" />
        <NavLink href="/creator/dashboard/availability" icon={Calendar} label="Availability" />
        <NavLink href="/creator/dashboard/profile" icon={User} label="Profile" />

        <button className="flex items-center w-full gap-3 px-3 py-3 rounded-lg text-white/60 cursor-not-allowed opacity-50"><Wallet size={20} /><span>Payouts (Soon)</span></button>
        <button className="flex items-center w-full gap-3 px-3 py-3 rounded-lg text-white/60 cursor-not-allowed opacity-50"><Settings size={20} /><span>Settings (Soon)</span></button>
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-[#E8D1AB] text-black font-bold flex items-center justify-center">{user?.name?.[0] || "A"}</div>
          <div className="flex-1 overflow-hidden"><p className="text-sm font-medium truncate">{user?.name}</p><p className="text-xs text-white/40 truncate">{user?.email}</p></div>
        </div>
        <button onClick={handleLogout} className="flex items-center w-full gap-2 px-3 py-2 text-red-400 hover:bg-red-400/10 transition-colors text-sm">
          <LogOut size={16} /><span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
