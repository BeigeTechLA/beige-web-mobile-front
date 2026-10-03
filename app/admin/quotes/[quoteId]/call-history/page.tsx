"use client";

import React from "react";
import QuoteCallHistoryPage from "@/components/admin/quotes/history/QuoteCallHistoryPage";

type PageProps = {
  params: Promise<{ quoteId: string }>;
};

export default function AdminQuoteCallHistoryRoute({ params }: PageProps) {
  const { quoteId } = React.use(params);
  return <QuoteCallHistoryPage quoteId={quoteId} />;
}
