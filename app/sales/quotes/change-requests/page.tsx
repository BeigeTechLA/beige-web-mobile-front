"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import Topbar from "@/components/sales/Topbar";
import QuoteChangeRequestsWorkspace from "@/components/quotes/QuoteChangeRequestsWorkspace";
import { useAuth } from "@/lib/hooks/useAuth";

const isSalesAdminInvoiceUser = (user: Record<string, unknown> | null | undefined) => {
  if (!user) return false;

  const userTypeId = user.user_type_id ?? user.userTypeId;
  const roleValue = user.role ?? user.userRole;
  const normalizedRole = String(roleValue ?? "").trim().toLowerCase();

  return userTypeId === 7 && normalizedRole === "sales_admin";
};

export default function SalesQuoteChangeRequestsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";
  const isSalesAdmin = isSalesAdminInvoiceUser(user as Record<string, unknown> | null | undefined);

  React.useEffect(() => {
    if (!isLoading && user && !isSalesAdmin) {
      router.replace("/sales/quotes");
    }
  }, [isLoading, isSalesAdmin, router, user]);

  if (isLoading) {
    return (
      <div className={isDark ? "min-h-screen bg-[#101010]" : "min-h-screen bg-[#F4F5F7]"} />
    );
  }

  if (!isSalesAdmin) {
    return null;
  }

  return (
    <QuoteChangeRequestsWorkspace
      TopbarComponent={Topbar}
      title="Quote Change Request"
      description="Sales-admin review queue for quote updates that require approval before invoice refresh."
      detailsHrefBase="/sales/quotes"
    />
  );
}
