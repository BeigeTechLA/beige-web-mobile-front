"use client";

import React from "react";
import QuoteVersionSummary from "@/components/admin/quotes/QuoteVersionSummary";

type PageProps = {
  params: Promise<{
    quoteId: string;
  }>;
};

export default function AdminQuoteSummaryRoute({ params }: PageProps) {
  const { quoteId } = React.use(params);

  return (
    <QuoteVersionSummary
      quoteId={quoteId}
    />
  );
}
