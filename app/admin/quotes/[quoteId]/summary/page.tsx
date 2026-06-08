"use client";

import React, { useState, useEffect } from "react";
import QuoteVersionSummary from "@/components/admin/quotes/QuoteVersionSummary";
import { useTheme } from "next-themes";

type PageProps = {
  params: Promise<{
    quoteId: string;
  }>;
};

export default function AdminQuoteSummaryRoute({ params }: PageProps) {
  const { quoteId } = React.use(params);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";

  return (
    <QuoteVersionSummary
      quoteId={quoteId}
      isDark={isDark}
    />
  );
}
