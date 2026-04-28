"use client";

import React from "react";

import Topbar from "@/components/admin/Topbar";
import AffiliateQuoteDetailsPage from "@/components/affiliate/quotes/AffiliateQuoteDetailsPage";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function AffiliateQuoteDetailsRoute({ params }: PageProps) {
  const { id } = React.use(params);

  return (
    <AffiliateQuoteDetailsPage
      quoteId={id}
      baseHref="/affiliate/quotes"
      TopbarComponent={Topbar}
    />
  );
}
