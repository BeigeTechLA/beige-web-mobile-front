"use client";

import React from "react";
import QuoteVersionHistoryPage from "@/components/admin/quotes/history/QuoteVersionHistoryPage";

type PageProps = {
  params: Promise<{ quoteId: string }>;
};

export default function AdminQuoteVersionHistoryRoute({ params }: PageProps) {
  const { quoteId } = React.use(params);
  return <QuoteVersionHistoryPage quoteId={quoteId} />;
}
