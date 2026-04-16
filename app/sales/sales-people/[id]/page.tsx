"use client";

import React, { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import Topbar from "@/components/sales/Topbar";
import SalesRepStatusDetailsView from "@/components/admin/sales-representative/SalesRepStatusDetailsView";

const canAccessSalesPeoplePage = (user: Record<string, unknown> | null) => {
  if (!user) return false;

  return Number(user.user_type_id ?? user.userTypeId) === 7;
};

export default function SalesSalesPersonDetailsPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [canViewPage, setCanViewPage] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const storedUser = localStorage.getItem("revure_user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const hasAccess = canAccessSalesPeoplePage(parsedUser);

      setCanViewPage(hasAccess);

      if (!hasAccess) {
        router.replace("/sales/dashboard");
      }
    } catch (error) {
      console.error("Failed to read sales people detail page access state", error);
      router.replace("/sales/dashboard");
    }
  }, [router]);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const salesRepId = params?.id ?? "";

  if (!mounted || !canViewPage) {
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
          onBack={() => router.push("/sales/sales-people")}
        />
      </div>
    </>
  );
}
