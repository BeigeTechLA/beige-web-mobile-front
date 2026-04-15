"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import Topbar from "@/components/sales/Topbar";
import { InvoiceTable } from "@/components/admin/InvoiceTable";

const canAccessSalesInvoice = (user: Record<string, unknown> | null) => {
  if (!user) return false;

  return Number(user.user_type_id ?? user.userTypeId) === 7;
};

export default function SalesInvoicePage() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [canViewInvoice, setCanViewInvoice] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const storedUser = localStorage.getItem("revure_user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const hasAccess = canAccessSalesInvoice(parsedUser);

      setCanViewInvoice(hasAccess);

      if (!hasAccess) {
        router.replace("/sales/dashboard");
      }
    } catch (error) {
      console.error("Failed to read sales invoice access state", error);
      router.replace("/sales/dashboard");
    }
  }, [router]);

  const isDark = !mounted || theme === "dark";

  if (!mounted || !canViewInvoice) {
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
