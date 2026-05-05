"use client";

import React from "react";

import Topbar from "@/components/sales/Topbar";
import QuoteDetailsPage from "@/components/admin/quotes/QuoteDetailsPage";
import SalesQuoteEditAccessModal from "@/components/sales/quotes/SalesQuoteEditAccessModal";

type PageProps = {
  params: Promise<{
    quoteId: string;
  }>;
};

export default function SalesQuoteDetailsRoute({ params }: PageProps) {
  const { quoteId } = React.use(params);

  return (
    <QuoteDetailsPage
      quoteId={quoteId}
      baseHref="/sales/quotes"
      TopbarComponent={Topbar}
      EditAccessModalComponent={SalesQuoteEditAccessModal}
    />
  );
}
