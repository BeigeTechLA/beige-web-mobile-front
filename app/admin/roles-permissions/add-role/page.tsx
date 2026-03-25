"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import Topbar from "@/components/admin/Topbar";
import AddRoleForm from "@/components/admin/roles-permissions/AddFormRole";

export default function AddRole() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";

  return (
    <>
      {/* ── Topbar ── */}
      <Topbar pathname={pathname} />

      <div
        className={`overflow-hidden min-h-screen font-sans transition-colors ${
          isDark ? "bg-[#0a0a0a] text-white" : "bg-[#F4F5F7] text-black"
        }`}
      >
        

        {/* ── Main content area ── */}
        <div className="p-6 lg:px-10 lg:py-8">

          {/* Back button */}
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className={`flex items-center gap-2 mb-6 p-0 h-auto hover:bg-transparent transition-colors ${
              isDark
                ? "text-white hover:text-white/70"
                : "text-black hover:text-black/60"
            }`}
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back</span>
          </Button>

          {/* ── Page header — plain text on background, no card/box ── */}
          <div className="mb-8">
            <h1
              className={`text-2xl lg:text-[32px] font-bold mb-2 ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              Add Role
            </h1>
            <p
              className={`text-sm leading-relaxed max-w-2xl ${
                isDark ? "text-white/50" : "text-black/50"
              }`}
            >
              Create roles to manage permissions and control what users can
              access on the platform.
            </p>
          </div>

          {/* ── Form ── */}
          <AddRoleForm />
        </div>
      </div>
    </>
  );
}