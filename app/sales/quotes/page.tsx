"use client";

import Topbar from "@/components/sales/Topbar";
import QuotesDashboardPage from "@/components/admin/quotes/QuotesDashboardPage";

export default function SalesQuotesPage() {
  return <QuotesDashboardPage createHref="/sales/quotes/create" TopbarComponent={Topbar} />;
}
