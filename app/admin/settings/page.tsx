"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import Topbar from "@/components/admin/Topbar";
import { CreditPointsSettings } from "@/components/admin/finances/CreditPointsSettings";

export default function Settings() {
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
        className="overflow-x-hidden overflow-y-visible p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <CreditPointsSettings isDark={isDark} />
      </div>
    </>
  );
}
