"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";

import Topbar from "@/components/admin/Topbar";
import AffiliateTransactionsHistory from "@/components/affiliate/AffiliateTransactionsHistory";
import AffiliateRaiseDisputeModal from "@/components/affiliate/AffiliateRaiseDisputeModal";
import { Button } from "@/src/components/landing/ui/button";

export default function AffiliateTransactionsPage() {
  const pathname = usePathname();
  const topbarPathname = pathname.replace(/^\/affiliate/, "") || pathname;
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [initialShootId, setInitialShootId] = useState<string | null>(null);
  const [transactionsRefreshKey, setTransactionsRefreshKey] = useState(0);

  const openDisputeModal = (bookingId?: string) => {
    setInitialShootId(bookingId || null);
    setIsDisputeModalOpen(true);
  };

  return (
    <>
      <Topbar
        pathname={topbarPathname}
        breadcrumbOverrides={{ transactions: "Payments" }}
        actions={
          <Button
            className="h-11 w-full rounded-lg bg-[#E8D1AB] px-4 text-sm text-black hover:bg-[#d9c08a] sm:w-auto lg:h-12 lg:px-5 lg:text-base"
            onClick={() => openDisputeModal()}
          >
            Raise New Dispute
          </Button>
        }
      />
      <AffiliateTransactionsHistory
        onRaiseDispute={openDisputeModal}
        refreshKey={transactionsRefreshKey}
      />
      <AffiliateRaiseDisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => {
          setIsDisputeModalOpen(false);
          setInitialShootId(null);
        }}
        initialShootId={initialShootId}
        onSubmitted={() => setTransactionsRefreshKey((current) => current + 1)}
      />
    </>
  );
}
