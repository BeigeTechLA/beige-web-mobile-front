"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import Topbar from "@/components/admin/Topbar";
import { CreditPointsSettings } from "@/components/admin/finances/CreditPointsSettings";

export default function CreditPointsSettingsPage() {
  const { theme } = useTheme();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";

  return (
    <>
    <Topbar pathname={pathname} title="Credit Points Settings" />
      <div
        className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div>
          <h1
            className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${
              isDark ? "text-white" : "text-[#000]"
            }`}
          >
            New User Sign up Credits
          </h1>

          <p
            className={`text-xs lg:text-sm transition-colors duration-100 ${
              isDark ? "text-white/70" : "text-[#000000B2]"
            }`}
          >
            Credits apply only to users who sign up during the selected date range while this setting is enabled.
          </p>
        </div>

        <CreditPointsSettings isDark={isDark} />
      </div>
    </>
  );
}