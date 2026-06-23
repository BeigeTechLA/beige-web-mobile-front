"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { usePathname } from "next/navigation";
import {
  ArrowUpToLine,
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { Button } from "@/src/components/landing/ui/button";
import DisputeMetricCards, {
  type DisputeMetricCard,
} from "@/components/admin/finances/DisputeMetricCards";
import DisputeHistoryList, {
  type DisputeHistoryItem,
} from "@/components/admin/finances/DisputeHistoryList";
import DottedDivider from "@/components/admin/DottedDivider";
import AddEditDisputeModal from "@/components/admin/finances/AddEditDisputeModal";
import DisputeDetailsModal, {
  type DisputeDetailsRecord,
} from "@/components/admin/finances/DisputeDetailsModal";
import { usePermissions } from "@/lib/hooks/usePermissions";

const disputeItems: DisputeHistoryItem[] = [
  {
    id: "DIS-001",
    shootId: "SH-004",
    invoiceId: "INV-004-B",
    category: "Quality Issue",
    description: "The final photos did not meet the agreed quality standards.",
    raisedBy: "Emily Johnson",
    raisedRole: "Client",
    raisedDate: "19-04-2026",
    disputedAmount: "$5,000",
    payoutHold: "$4,500",
    status: "Open",
  },
  {
    id: "DIS-002",
    shootId: "SH-005",
    invoiceId: "INV-005-A",
    category: "Payment Delay",
    description: "Payout has been delayed beyond the agreed timeline.",
    raisedBy: "Ryan Cooper",
    raisedRole: "Creator",
    raisedDate: "17-04-2026",
    disputedAmount: "$4,200",
    payoutHold: "$3,696",
    status: "In Review",
  },
  {
    id: "DIS-003",
    shootId: "SH-006",
    invoiceId: "INV-006-A",
    category: "Wrong Deliverable",
    description: "Received wrong edited files.",
    raisedBy: "Marcus Reid",
    raisedRole: "Client",
    raisedDate: "22-03-2026",
    disputedAmount: "$3,200",
    payoutHold: "$1,200",
    status: "Resolved",
  },
];

const disputeDetailsMap: Record<string, Omit<DisputeDetailsRecord, keyof DisputeHistoryItem>> = {
  "DIS-001": {
    createdAt: "2026-04-19",
    payoutNote: "On hold until resolved",
    timeline: [
      {
        title: "Dispute Created",
        by: "Emily Johnson",
        at: "2026-04-19 10:30",
        tone: "warning",
      },
      {
        title: "Under Review",
        by: "Support Team",
        at: "2026-04-19 14:20",
        tone: "review",
      },
    ],
    internalComments: [
      {
        author: "Emily Johnson",
        message: "The photos are blurry and not as discussed.",
        at: "2026-04-19 10:35",
      },
      {
        author: "Support Agent",
        message: "We are reviewing the original contract and deliverables.",
        at: "2026-04-19 14:25",
      },
    ],
  },
  "DIS-002": {
    createdAt: "2026-04-17",
    payoutNote: "Held while finance review is active",
    timeline: [
      {
        title: "Dispute Created",
        by: "Ryan Cooper",
        at: "2026-04-17 09:10",
        tone: "warning",
      },
      {
        title: "Finance Review Started",
        by: "Payments Team",
        at: "2026-04-17 11:45",
        tone: "review",
      },
    ],
    internalComments: [
      {
        author: "Ryan Cooper",
        message: "The payout has exceeded the promised timeline.",
        at: "2026-04-17 09:20",
      },
      {
        author: "Payments Team",
        message: "Bank transfer verification is in progress.",
        at: "2026-04-17 11:50",
      },
    ],
  },
  "DIS-003": {
    createdAt: "2026-03-22",
    payoutNote: "Released after resolution",
    timeline: [
      {
        title: "Dispute Created",
        by: "Marcus Reid",
        at: "2026-03-22 08:15",
        tone: "warning",
      },
      {
        title: "Resolved",
        by: "Support Team",
        at: "2026-03-24 16:10",
        tone: "resolved",
      },
    ],
    internalComments: [
      {
        author: "Marcus Reid",
        message: "The delivered files do not match the agreed selection.",
        at: "2026-03-22 08:20",
      },
      {
        author: "Support Team",
        message: "Updated files were shared and approved by the client.",
        at: "2026-03-24 16:15",
      },
    ],
  },
};

export default function AdminDisputesPage() {
  const pathname = usePathname();
  const { canCreate } = usePermissions("finances");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMetricId, setActiveMetricId] = useState("open");
  const [metricRange, setMetricRange] = useState("Month");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("Month");
  const [typeFilter, setTypeFilter] = useState("All");
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetailsRecord | null>(null);


  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [selectedDate, metricRange, searchQuery, statusFilter, monthFilter, typeFilter]);

  const { isDark } = useResolvedTheme();

  const CustomClockIcon = ({ size = 16 }) => (
    <img
      src="/images/socmed/Clock.svg"
      width={size}
      height={size}
      alt="video"
    />
  );
  const CustomDollarIcon = ({ size = 16 }) => (
    <img
      src="/images/socmed/Dollar.svg"
      width={size}
      height={size}
      alt="camera"
    />
  );
  const CustomCheckIcon = ({ size = 16 }) => (
    <img
      src="/images/misc/overviewicons/CheckCircle.svg"
      width={size}
      height={size}
      alt="video"
    />
  );
  const CustomCautionIcon = ({ size = 16 }) => (
    <img
      src="/images/misc/overviewicons/Caution.svg"
      width={size}
      height={size}
      alt="camera"
    />
  );

  const metrics: DisputeMetricCard[] = [
    {
      id: "open",
      label: "Open Disputes",
      value: "14",
      helperText: "3 shoots affected",
      icon: CustomCautionIcon,
    },
    {
      id: "review",
      label: "In Review",
      value: "04",
      helperText: "Pending resolution",
      icon: CustomClockIcon,
    },
    {
      id: "resolved",
      label: "Resolved (30d)",
      value: "25",
      helperText: "Last month",
      icon: CustomCheckIcon,
    },
    {
      id: "hold",
      label: "Impacted Payouts",
      value: "$9,396",
      helperText: "Total on hold",
      icon: CustomDollarIcon,
    },
  ];

  const filteredItems = useMemo(() => {
    return disputeItems.filter((item) => {
      const matchesSearch =
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.raisedBy.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      const matchesType = typeFilter === "All" || item.raisedRole === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [searchQuery, statusFilter, typeFilter]);

  const disputeShootOptions = useMemo(
    () => Array.from(new Set(disputeItems.map((item) => item.shootId))),
    []
  );

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <>
            <Button variant="outline"
              className={`rounded-lg h-12 px-4 lg:px-7 gap-2 transition-all ${isDark
                ? "bg-[#1A1A1A] border-white/10 text-white hover:bg-[#2C2C2C]"
                : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
                }`}>
              <ArrowUpToLine /> Export
            </Button>
            {canCreate && (
            <Button
              onClick={() => setIsDisputeModalOpen(true)}
              className="bg-[#E5D5B8] text-black h-12 px-4 lg:px-7 hover:bg-[#d9c59d]"
            >
              Add Dispute
            </Button>
            )}
          </>
        }
      />

      <div
        className="overflow-hidden p-4 pb-24 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex justify-between items-start lg:items-end gap-4">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
              Disputes
            </h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              Resolve disputes linked to Shoot and Invoice IDs
            </p>
          </div>
          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        <DisputeMetricCards
          metrics={metrics}
          activeId={activeMetricId}
          onSelect={setActiveMetricId}
          rangeValue={metricRange}
          onRangeChange={setMetricRange}
        />

        <DisputeHistoryList
          items={filteredItems}
          loading={loading}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          statusValue={statusFilter}
          onStatusChange={setStatusFilter}
          monthValue={monthFilter}
          onMonthChange={setMonthFilter}
          typeValue={typeFilter}
          onTypeChange={setTypeFilter}
          onViewDetails={(item) =>
            setSelectedDispute({
              ...item,
              ...disputeDetailsMap[item.id],
            })
          }
        />

        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={() => setIsDisputeModalOpen(true)}
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            Add Dispute
          </Button>
        </div>
      </div>

      <AddEditDisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        shootOptions={disputeShootOptions}
      />

      <DisputeDetailsModal
        isOpen={!!selectedDispute}
        onClose={() => setSelectedDispute(null)}
        dispute={selectedDispute}
      />
    </>
  );
}
