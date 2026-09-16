import QuoteAnalyticsDetailPage from "@/components/admin/quote-analytics/QuoteAnalyticsDetailPage";
export default async function AdminQuoteAnalyticsDetailRoute({ params }: { params: Promise<{ quoteId: string }> }) { const { quoteId } = await params; return <QuoteAnalyticsDetailPage quoteId={quoteId} />; }
