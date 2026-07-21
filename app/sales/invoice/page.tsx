"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import Topbar from "@/components/sales/Topbar";
import { InvoiceTable } from "@/components/admin/InvoiceTable";
import { useRequireModulePermission } from "@/lib/hooks/useRequireModulePermission";

export default function SalesInvoicePage() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const { allowed, isLoading: isPermissionLoading } = useRequireModulePermission(
    "invoices",
    "view",
    "/sales/dashboard",
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  if (!mounted || isPermissionLoading || !allowed) {
    return null;
  }

  return (
    <>
      <Topbar pathname={pathname} />

      <div
        className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex justify-between items-start lg:items-end">
          <div>
            <h1
              className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${
                isDark ? "text-white" : "text-[#000]"
              }`}
            >
              Invoice History
            </h1>
            <p
              className={`text-xs lg:text-sm transition-colors duration-100 ${
                isDark ? "text-white/70" : "text-[#000000B2]"
              }`}
            >
              Keep track of your billing history.
            </p>
          </div>
        </div>

        <InvoiceTable />
      </div>
    </>
  );
}
