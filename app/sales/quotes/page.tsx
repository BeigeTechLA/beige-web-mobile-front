"use client";

import Topbar from "@/components/sales/Topbar";
import QuotesDashboardPage from "@/components/admin/quotes/QuotesDashboardPage";
import SalesQuoteEditAccessModal from "@/components/sales/quotes/SalesQuoteEditAccessModal";

export default function SalesQuotesPage() {
  return (
    <QuotesDashboardPage
      createHref="/sales/quotes/create"
      TopbarComponent={Topbar}
      EditAccessModalComponent={SalesQuoteEditAccessModal}
    />
  );
}
