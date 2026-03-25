"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import Topbar from "@/components/admin/Topbar";
import EditUserPermissions from "@/components/admin/roles-permissions/EditUserPermissions";

export default function EditRole() {
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
      {/* Topbar */}
      <Topbar pathname={pathname} />

      <div
        className={`overflow-hidden min-h-screen font-sans transition-colors ${
          isDark ? "bg-[#0a0a0a] text-white" : "bg-[#F4F5F7] text-black"
        }`}
      >
        
        {/* Main content */}
        <div className="p-4 lg:px-10 lg:py-9">

          {/* Back button */}
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className={`flex items-center gap-2 mb-5 p-0 h-auto hover:bg-transparent transition-colors ${
              isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"
            }`}
          >
            <ArrowLeft size={24} />
            <span className="text-sm font-medium">Back</span>
          </Button>

          

          {/* Form */}
          <EditUserPermissions />
        </div>
      </div>
    </>
  );
}