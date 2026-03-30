"use client";

import QuotePreviewPageShell from "@/components/admin/quotes/QuotePreviewPageShell";
import Topbar from "@/components/sales/Topbar";
import { SALES_QUOTE_SUMMARY_STORAGE_KEY } from "@/lib/quoteSummary";

export default function QuotePreviewPage() {
  return (
    <QuotePreviewPageShell
      TopbarComponent={Topbar}
      baseHref="/sales/quotes"
      createHref="/sales/quotes/create"
      summaryStorageKey={SALES_QUOTE_SUMMARY_STORAGE_KEY}
    />
  );
}
