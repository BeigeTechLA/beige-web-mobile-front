import QuotePreviewPageShell from "@/components/quotes/QuotePreviewPageShell";
import QuotePreviewStandaloneHeader from "@/components/quotes/QuotePreviewStandaloneHeader";

export default function QuotePreviewPage() {
  return (
    <QuotePreviewPageShell
      TopbarComponent={QuotePreviewStandaloneHeader}
      fallbackHref="/"
      showActionButtons={false}
      showBackButton={false}
      showIntroHeader={false}
      quoteDetailMode="public"
    />
  );
}
