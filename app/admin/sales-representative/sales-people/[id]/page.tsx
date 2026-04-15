"use client";

import React, { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import Topbar from "@/components/admin/Topbar";
import SalesRepStatusDetailsView from "@/components/admin/sales-representative/SalesRepStatusDetailsView";

export default function AdminSalesPersonDetailsPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const salesRepId = params?.id ?? "";

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          "sales-people": "Sales People",
          [salesRepId]: "Details",
        }}
      />

      <div className={`min-h-screen pb-30 p-4 lg:p-6 lg:px-10 lg:py-9 transition-colors duration-300 ${isDark ? "bg-transparent" : "bg-[#F3F4F6]"}`}>
        <SalesRepStatusDetailsView
          salesRepId={salesRepId}
          isDark={isDark}
          onBack={() => router.push("/admin/sales-representative/sales-people")}
        />
      </div>
    </>
  );
}
