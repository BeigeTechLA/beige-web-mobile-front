"use client";

import QuotePreviewPageShell from "@/components/admin/quotes/QuotePreviewPageShell";
import Topbar from "@/components/admin/Topbar";
import { ADMIN_QUOTE_SUMMARY_STORAGE_KEY } from "@/lib/quoteSummary";

export default function QuotePreviewPage() {
  return (
    <QuotePreviewPageShell
      TopbarComponent={Topbar}
      baseHref="/admin/quotes"
      createHref="/admin/quotes/create"
      summaryStorageKey={ADMIN_QUOTE_SUMMARY_STORAGE_KEY}
    />
  );
}
