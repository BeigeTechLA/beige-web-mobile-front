"use client";

import Topbar from "@/components/admin/Topbar";
import QuotesDashboardPage from "@/components/admin/quotes/QuotesDashboardPage";

export default function AdminQuotesPage() {
  return <QuotesDashboardPage createHref="/admin/quotes/create" TopbarComponent={Topbar} />;
}
