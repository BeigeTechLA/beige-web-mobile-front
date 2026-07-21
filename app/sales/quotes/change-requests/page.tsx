"use client";

import React from "react";
import { useTheme } from "next-themes";

import Topbar from "@/components/sales/Topbar";
import QuoteChangeRequestsWorkspace from "@/components/quotes/QuoteChangeRequestsWorkspace";
import { useRequireModulePermission } from "@/lib/hooks/useRequireModulePermission";

export default function SalesQuoteChangeRequestsPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { allowed, isLoading } = useRequireModulePermission(
    "quotes",
    "edit",
    "/sales/quotes",
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";

  if (isLoading) {
    return (
      <div className={isDark ? "min-h-screen bg-[#101010]" : "min-h-screen bg-[#F4F5F7]"} />
    );
  }

  if (!allowed) {
    return null;
  }

  return (
    <QuoteChangeRequestsWorkspace
      TopbarComponent={Topbar}
      detailsHrefBase="/sales/quotes"
    />
  );
}
