"use client";

import Topbar from "@/components/admin/Topbar";
import QuoteChangeRequestsWorkspace from "@/components/quotes/QuoteChangeRequestsWorkspace";

export default function AdminQuoteChangeRequestsPage() {
  return (
    <QuoteChangeRequestsWorkspace
      TopbarComponent={Topbar}
      detailsHrefBase="/admin/quotes"
    />
  );
}
