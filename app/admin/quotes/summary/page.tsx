"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";

import Topbar from "@/components/admin/Topbar";
import QuotePreviewModal from "@/components/admin/quotes/QuotePreviewModal";
import QuoteSummaryContent from "@/components/admin/quotes/QuoteSummaryContent";
import { Button } from "@/components/ui/button";
import {
  ADMIN_QUOTE_SUMMARY_STORAGE_KEY,
  buildPreviewQuoteFromSummary,
  readQuoteSummarySnapshot,
  type QuoteSummarySnapshot,
} from "@/lib/quoteSummary";

export default function QuoteSummaryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [snapshot, setSnapshot] = React.useState<QuoteSummarySnapshot | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  React.useEffect(() => {
    setSnapshot(readQuoteSummarySnapshot(ADMIN_QUOTE_SUMMARY_STORAGE_KEY));
  }, []);

  const handlePreviewOpen = () => {
    if (!snapshot) {
      return;
    }

    setIsPreviewOpen(true);
  };

  return (
    <div className="relative overflow-hidden">
      <Topbar
        pathname={pathname}
        actions={
          <Button
            type="button"
            onClick={handlePreviewOpen}
            disabled={!snapshot}
            className="bg-[#E5D5B8] text-black hover:bg-[#d7c7aa] disabled:opacity-60"
          >
            Preview Quote
          </Button>
        }
      />

      <QuoteSummaryContent
        snapshot={snapshot}
        onPreview={handlePreviewOpen}
        previewDisabled={!snapshot}
        emptyStateAction={() => router.push("/admin/quotes/create")}
      />

      <QuotePreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        quote={snapshot ? buildPreviewQuoteFromSummary(snapshot) : null}
      />
    </div>
  );
}
