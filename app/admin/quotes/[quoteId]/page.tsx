"use client";

import React from "react";

import Topbar from "@/components/admin/Topbar";
import QuoteDetailsPage from "@/components/admin/quotes/QuoteDetailsPage";

type PageProps = {
  params: Promise<{
    quoteId: string;
  }>;
};

export default function AdminQuoteDetailsRoute({ params }: PageProps) {
  const { quoteId } = React.use(params);

  return (
    <QuoteDetailsPage
      quoteId={quoteId}
      baseHref="/admin/quotes"
      TopbarComponent={Topbar}
    />
  );
}