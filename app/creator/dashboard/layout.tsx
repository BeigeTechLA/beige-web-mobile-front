"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Camera,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function AffiliateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar pathname={pathname} />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#111] border-b border-white/10 px-4 h-16 flex items-center justify-between">
        <span className="text-xl font-bold tracking-widest text-[#E8D1AB]">
          BEIGE
        </span>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-white"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 z-50 lg:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-[#111] lg:hidden"
            >
              <Sidebar pathname={pathname} onClose={() => setIsSidebarOpen(false)} />
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Page Content */}
      <div className="flex-1 flex flex-col min-h-screen h-screen overflow-hidden">
        <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ---------------- SIDEBAR ---------------- */

function Sidebar({
  pathname,
  onClose,
}: {
  pathname: string;
  onClose?: () => void;
}) {
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex flex-col h-full bg-[#111] border-r border-white/10 w-64">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2"
        >
          <span className="text-2xl font-bold tracking-widest text-[#E8D1AB]">
            BEIGE
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <Link
          href="/creator/dashboard/request"
          onClick={onClose}
          className={`flex items-center w-full gap-3 px-3 py-3 rounded-lg font-medium transition-colors
            ${
              isActive("/creator/dashboard/request")
                ? "bg-[#E8D1AB]/10 text-[#E8D1AB]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }
          `}
        >
          <Camera size={20} />
          <span>Request & Shoots</span>
        </Link>

        <Link
          href="/creator/dashboard"
          onClick={onClose}
          className={`flex items-center w-full gap-3 px-3 py-3 rounded-lg font-medium transition-colors
            ${
              isActive("/creator/dashboard")
                ? "bg-[#E8D1AB]/10 text-[#E8D1AB]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }
          `}
        >
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </Link>

      </div>

      {/* User & Logout */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E8D1AB] to-[#C4A470] flex items-center justify-center text-black font-bold text-sm">
            {user?.name?.[0] || "A"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">
              {user?.name || "Affiliate"}
            </p>
            <p className="text-xs text-white/40 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center w-full gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors text-sm"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
