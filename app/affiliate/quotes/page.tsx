"use client";

import Topbar from "@/components/admin/Topbar";
import AffiliateQuotesTable from "@/components/affiliate/quotes/AffiliateQuotesTable";

export default function AffiliateQuotesPage() {
  return <AffiliateQuotesTable TopbarComponent={Topbar} />;
}
