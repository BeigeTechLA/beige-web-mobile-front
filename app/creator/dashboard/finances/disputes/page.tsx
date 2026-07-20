"use client";

import React, { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CircleCheck,
  CircleDollarSign,
  Download,
  FileText,
  MessageSquare,
  BadgeDollarSign,
  Search,
  Send,
  Upload,
  X,
} from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Status = "Paid" | "Disputed" | "Processing" | "Pending";

type DisputeItem = {
  title: string;
  bookingId: string;
  payoutDate: string;
  amount: string;
  status: Status;
  expanded?: boolean;
};

type MetricItem = {
  id: string;
  label: string;
  value: string;
  growth: number;
  icon: React.ElementType;
};

const items: DisputeItem[] = [
  {
    title: "Corporate Headshots Session",
    bookingId: "BK-001",
    payoutDate: "28-04-2026",
    amount: "$2,200",
    status: "Paid",
    expanded: true,
  },
  {
    title: "Wedding Photography Package",
    bookingId: "BK-002",
    payoutDate: "20-04-2026",
    amount: "$5,104",
    status: "Disputed",
  },
  {
    title: "Product Photography - E-commerce",
    bookingId: "BK-003",
    payoutDate: "20-04-2026",
    amount: "$1,056",
    status: "Processing",
  },
  {
    title: "Real Estate Virtual Tour",
    bookingId: "BK-004",
    payoutDate: "26-03-2026",
    amount: "$2,816",
    status: "Pending",
  },
  {
    title: "Event Coverage - Conference",
    bookingId: "BK-005",
    payoutDate: "20-03-2026",
    amount: "$3,960",
    status: "Paid",
  },
];

const metrics: MetricItem[] = [
  { id: "amount", label: "Total Dispute Amount", value: "$17,200", growth: 3, icon: CircleDollarSign },
  { id: "raised", label: "Total Disputes Raised", value: "50", growth: 3, icon: BadgeDollarSign },
  { id: "paid", label: "Paid Disputes", value: "155", growth: 3, icon: CircleCheck },
  { id: "pending", label: "Pending Dispute", value: "10", growth: 3, icon: CircleDollarSign },
];

const statusClasses: Record<Status, string> = {
  Paid: "bg-[#053321] text-[#18C987]",
  Disputed: "bg-[#401516] text-[#FF5D58]",
  Processing: "bg-[#10264C] text-[#65A0FF]",
  Pending: "bg-[#3B3009] text-[#FFD45A]",
};

function Pill({ status }: { status: Status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] leading-none ${statusClasses[status]}`}>
      {status}
    </span>
  );
}

function RaiseDisputeModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[calc(100vh-48px)] w-full max-w-[410px] flex-col overflow-hidden rounded-lg border border-white/25 bg-black text-white shadow-[0_24px_80px_rgba(0,0,0,0.75)]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/25 px-5 py-4">
          <h2 className="text-xl font-bold">Raise New Dispute</h2>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2B2B2B] text-white">
            <X size={20} />
          </button>
        </div>

        <form
          className="space-y-4 overflow-y-auto px-5 py-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <fieldset className="rounded-lg border border-white/25 px-3 pb-3 pt-1.5">
            <legend className="px-2 text-xs text-white/55">Select Shoot ID*</legend>
            <button type="button" className="flex h-8 w-full items-center justify-between text-left text-sm text-white/35">
              Select shoot ID <ChevronDown size={18} className="text-white/70" />
            </button>
          </fieldset>

          <fieldset className="rounded-lg border border-white/25 px-3 pb-3 pt-1.5">
            <legend className="px-2 text-xs text-white/55">Select Dispute Type*</legend>
            <button type="button" className="flex h-8 w-full items-center justify-between text-left text-sm text-white/35">
              Select dispute type <ChevronDown size={18} className="text-white/70" />
            </button>
          </fieldset>

          <fieldset className="rounded-lg border border-white/25 px-3 pb-3 pt-1.5">
            <legend className="px-2 text-xs text-white/55">Description</legend>
            <textarea className="min-h-[112px] w-full resize-none bg-transparent text-sm outline-none placeholder:text-white/35" />
          </fieldset>

          <div>
            <p className="mb-2 text-sm text-white/55">Attach File</p>
            <button type="button" className="flex h-[92px] w-full items-center justify-center rounded-lg border border-dashed border-white/20 text-xs text-white/80">
              Drag &amp; Drop Your File Here Or <span className="ml-1 text-[#E8D1AB]">Upload</span>
            </button>
          </div>

          <button className="rounded-md bg-[#E8D1AB] px-5 py-3 text-xs font-semibold text-black">Save &amp; Update</button>
        </form>
      </div>
    </div>
  );
}

function SuccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[430px] rounded-xl border border-white/25 bg-black px-10 py-9 text-center text-white shadow-[0_24px_80px_rgba(0,0,0,0.75)]">
        <div className="mx-auto mb-7 flex h-[78px] w-[78px] items-center justify-center rounded-full bg-[#E8D1AB] text-black">
          <Check size={42} strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-semibold">Dispute Submitted Successfully</h2>
        <p className="mx-auto mt-3 max-w-[320px] text-sm leading-5 text-white/55">
          Your dispute has been received and is now under review. You will be notified of any updates.
        </p>
        <div className="my-7 rounded-lg bg-[#252525] p-4 text-left text-sm">
          <div className="flex justify-between py-1 text-white/60"><span>Dispute ID</span><span className="text-white">DIS-750</span></div>
          <div className="flex justify-between py-1 text-white/60"><span>Booking ID</span><span className="text-white">BK-001</span></div>
          <div className="flex justify-between py-1 text-white/60"><span>Status</span><span className="rounded-full bg-[#401516] px-3 py-1 text-xs text-[#FF5D58]">Dispute - Open</span></div>
        </div>
        <button onClick={onClose} className="h-12 w-full rounded-md bg-[#E8D1AB] text-sm font-semibold text-black">Close</button>
      </div>
    </div>
  );
}

function DetailsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <button className="absolute inset-0" onClick={onClose} aria-label="Close details" />
      <aside className="relative flex h-full w-full max-w-[640px] flex-col overflow-hidden rounded-l-lg border border-white/25 bg-black text-white shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
        <div className="flex shrink-0 items-center justify-between border-b border-white/20 px-5 py-6">
          <h2 className="text-[21px] font-bold leading-none">Dispute Details</h2>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2B2B2B] text-white">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 no-scrollbar">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Dispute ID - 001</h3>
            <span className="rounded-full border border-[#8E2022] bg-[#260A0B] px-3 py-1 text-[11px] leading-none text-[#FF5D58]">Dispute - Open</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[["Booking ID", "BK-001"], ["Invoice ID", "INV-004-B"], ["Raised By", "Emily Johnson\n(Client)"], ["Created", "20-04-2026"]].map(([label, value]) => (
              <div key={label} className={`rounded-md p-3 ${label === "Booking ID" ? "border border-[#3C2F1F] bg-[#17120D]" : "bg-[#202020]"}`}>
                <p className="mb-1.5 flex items-center gap-2 text-[11px] text-white/45"><FileText size={12} />{label}</p>
                <p className="whitespace-pre-line text-[13px] leading-4 text-white/85">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium">Issue Type</p>
              <div className="rounded-md bg-[#202020] px-3 py-3 text-xs text-white/80">Quality Issue</div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium">Description</p>
              <div className="rounded-md bg-[#202020] px-3 py-3 text-xs text-white/55">The final photos did not meet the agreed quality standards.</div>
            </div>

            <div>
              <p className="mb-4 text-xs font-medium">Timeline</p>
              <div className="space-y-5 text-xs">
                <div className="relative flex gap-3">
                  <div className="absolute left-[10px] top-6 h-[calc(100%+12px)] w-px bg-white/10" />
                  <span className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border border-[#6B542C] bg-[#2C2419] text-[#E0AC21]">
                    <Clock3 size={12} />
                  </span>
                  <span><b className="text-white">Dispute Created</b><br /><span className="text-white/50">by Emily Johnson - 2026-04-19 10:30</span></span>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[#2A4C7A] bg-[#17263D] text-[#4F93FF]">
                    <MessageSquare size={12} />
                  </span>
                  <span><b className="text-white">Under Review</b><br /><span className="text-white/50">by Support Team - 2026-04-19 14:20</span></span>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium">Attachments (2)</p>
              {[
                ["contract.pdf", "245KB - Uploaded by Sarah Chen on 2026-04-2026"],
                ["sample-photos.zip", "12.5MB - Uploaded by Sarah Chen on 2026-04-2026"],
              ].map(([file, meta]) => (
                <div key={file} className="mb-2 flex items-center justify-between rounded-md bg-[#202020] px-3 py-3 text-xs">
                  <span className="flex min-w-0 items-start gap-2">
                    <FileText size={14} className="mt-0.5 shrink-0 text-[#E8D1AB]" />
                    <span className="min-w-0">
                      <span className="block truncate text-white/90">{file}</span>
                      <span className="block truncate text-[10px] text-white/40">{meta}</span>
                    </span>
                  </span>
                  <Download size={14} className="shrink-0 text-[#E8D1AB]" />
                </div>
              ))}
            </div>

            <div>
              <p className="mb-3 text-xs font-medium">Comments (02)</p>
              {[
                ["Emily Johnson", "Client", "The photos are blurry and not as discussed."],
                ["Support Agent", "Admin", "We are reviewing the original contract and deliverables."],
              ].map(([author, role, comment]) => (
                <div key={author} className="mb-2 rounded-md bg-[#202020] px-3 py-3 text-xs text-white/55">
                  <div className="mb-2 flex justify-between gap-3 text-white/80">
                    <span>{author} <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] ${role === "Client" ? "bg-[#0E3560] text-[#6DB1FF]" : "bg-[#053321] text-[#18C987]"}`}>{role}</span></span>
                    <span className="shrink-0 text-[10px] text-white/45">19-04-2026, 10:35</span>
                  </div>
                  {comment}
                </div>
              ))}
            </div>

            <fieldset className="rounded-lg border border-white/25 px-4 pb-12 pt-2">
              <legend className="px-2 text-xs text-white/55">Comment</legend>
              <textarea placeholder="Add your comment..." className="w-full resize-none bg-transparent text-xs outline-none placeholder:text-white/35" />
            </fieldset>
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-white/10 px-5 py-4">
          <button className="flex h-9 items-center justify-center gap-2 rounded-md border border-white/25 text-xs"><Upload size={13} />Upload File</button>
          <button className="flex h-9 items-center justify-center gap-2 rounded-md bg-[#9B8E77] text-xs text-black"><Send size={13} />Send Comments</button>
        </div>
      </aside>
    </div>
  );
}

export default function CreatorDisputesPage() {
  const pathname = usePathname();
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState("Status");
  const [monthFilter, setMonthFilter] = useState("Month");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMetricId, setActiveMetricId] = useState("amount");
  const [overviewRange, setOverviewRange] = useState("Month");
  const [expandedBookingId, setExpandedBookingId] = useState("BK-001");
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.amount.replace(/[$,]/g, "")), 0), []);
  const totalPages = 3;

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <button onClick={() => setRaiseOpen(true)} className="h-12 rounded-md bg-[#E8D1AB] px-6 text-sm font-semibold text-black shadow-[0_0_24px_rgba(232,209,171,0.35)]">
            Raise New Dispute
          </button>
        }
      />
      <main className="min-h-full bg-[#0f0f0f] p-4 pb-10 text-white lg:p-9">
        <div className="mx-auto max-w-[1480px] space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Disputes</h1>
              <p className="mt-1 text-sm text-white/55">Resolve disputes linked to Shoot and Invoice IDs</p>
            </div>
            <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </div>

          <section className="mt-5 w-full rounded-2xl border border-[#3D3D3D] bg-[#171717] p-5 transition-all duration-300 lg:mt-9">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2"><span className="h-6 w-[3px] bg-[#E8D1AB]" />Overview</div>
              <BasicDropdown
                label="Month"
                value={overviewRange}
                onChange={setOverviewRange}
                options={["Month", "Last 30 Days", "This Quarter", "This Year"]}
                roundedFull
                width="w-fit"
              />
            </div>
            <div className="flex flex-col gap-4 rounded-2xl bg-[#101010] p-4 lg:flex-row">
              {metrics.map((metric) => {
                const isActive = activeMetricId === metric.id;
                const Icon = metric.icon;

                return (
                <div
                  key={metric.id}
                  onClick={() => setActiveMetricId(metric.id)}
                  className={`relative flex-1 cursor-pointer rounded-lg border p-4 transition-all duration-200 ${isActive ? "border-transparent bg-[#ECD7B4] text-[#171717]" : "border-transparent bg-[#101010] text-white hover:border-white/30"}`}
                >
                  <div className="mb-6 flex items-start justify-between">
                    <span className={`text-sm font-medium ${isActive ? "text-black/70" : "text-zinc-400"}`}>{metric.label}</span>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${isActive ? "bg-[#171717] text-[#E8D1AB]" : "bg-[#2C2C2C] text-[#E8D1AB]"}`}>
                      <Icon size={18} strokeWidth={2.4} />
                    </span>
                  </div>
                  <p className="mb-3 text-[26px] font-bold leading-normal">{metric.value}</p>
                  <p className={`flex items-center gap-1 text-xs ${isActive ? "text-[#171717]" : "text-white/70"}`}>
                    <span className={`text-sm font-bold ${isActive ? "text-[#047726]" : "text-[#0DAE3D]"}`}>+{metric.growth}%</span>
                    from last month
                  </p>
                </div>
              )})}
            </div>
          </section>

          <section className="rounded-xl border border-[#2D2D2D] bg-[#151515]">
            <div className="border-b border-[#2D2D2D] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="h-6 w-[3px] bg-[#E8D1AB]" />Dispute History</div>
                <div className="flex flex-wrap gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 w-[110px] rounded-full border-[#3D3D3D] bg-zinc-900 text-[10px] text-white/70 focus:ring-0 lg:text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="border-[#3D3D3D] bg-[#111111] text-white">
                      <SelectItem value="Status">Status</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Disputed">Disputed</SelectItem>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger className="h-8 w-[110px] rounded-full border-[#3D3D3D] bg-zinc-900 text-[10px] text-white/70 focus:ring-0 lg:text-xs">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="border-[#3D3D3D] bg-[#111111] text-white">
                      <SelectItem value="Month">Month</SelectItem>
                      <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                      <SelectItem value="This Quarter">This Quarter</SelectItem>
                      <SelectItem value="This Year">This Year</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-8 w-[90px] rounded-full border-[#3D3D3D] bg-zinc-900 text-[10px] text-white/70 focus:ring-0 lg:text-xs">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="border-[#3D3D3D] bg-[#111111] text-white">
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Client">Client</SelectItem>
                      <SelectItem value="Creator">Creator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={17} />
                <input className="h-10 w-full rounded-md border border-white/10 bg-[#202020] pl-10 text-sm outline-none placeholder:text-white/35" placeholder="Search by Dispute ID and Client Name..." />
              </div>
            </div>
            <div className="space-y-3 p-5">
              {items.map((item) => {
                const isExpanded = expandedBookingId === item.bookingId;

                return (
                <article key={item.bookingId} className={`rounded-lg bg-[#0D0D0D] ${isExpanded ? "border border-[#E8D1AB]" : ""}`}>
                  <button
                    type="button"
                    onClick={() => setExpandedBookingId((current) => current === item.bookingId ? "" : item.bookingId)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                  >
                    <div className="min-w-0">
                      <div className="mb-2 flex items-center gap-3">
                        <ChevronDown size={15} className={isExpanded ? "rotate-180" : ""} />
                        <h3 className="truncate font-medium">{item.title}</h3>
                        <Pill status={item.status} />
                      </div>
                      <p className="ml-7 flex items-center gap-4 text-xs text-white/45">
                        <span>{item.bookingId}</span><span className="flex items-center gap-1"><Clock3 size={12} />Payout: {item.payoutDate}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-[#00DCA4]">{item.amount}</p>
                      <p className="text-xs text-white/50">Net Payout</p>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="grid gap-4 border-t border-white/10 p-5 md:grid-cols-2">
                      <div className="rounded-md bg-[#1C1C1C] p-5">
                        <h4 className="mb-5 text-sm font-semibold">Earnings Breakdown</h4>
                        <p className="mb-3 flex justify-between text-sm text-white/55"><span>Total Earnings</span><span className="text-white">$2,500</span></p>
                        <p className="mb-5 flex justify-between text-sm text-white/55"><span>Platform Fee (12%)</span><span className="text-[#FF5D58]">-$300</span></p>
                        <p className="flex justify-between text-sm"><span>Final Payout</span><span className="text-[#00DCA4]">$2,200</span></p>
                      </div>
                      <div className="space-y-4">
                        <div className="rounded-md bg-[#1C1C1C] p-5">
                          <h4 className="mb-5 text-sm font-semibold">Payout Status</h4>
                          <p className="mb-3 flex justify-between text-sm text-white/55"><span>Status</span><Pill status="Paid" /></p>
                          <p className="flex justify-between text-sm text-white/55"><span>Payout Date</span><span className="text-white">28-04-2026</span></p>
                        </div>
                        <div className="flex items-center justify-between rounded-md border border-[#3A1717] bg-[#180909] p-4">
                          <div>
                            <p className="text-sm text-white">Active Dispute: DIS-045</p>
                            <p className="mt-1 text-xs text-white/45">Payout will be processed after dispute resolution</p>
                          </div>
                          <button onClick={() => setDetailsOpen(true)} className="rounded bg-[#E8D1AB] px-4 py-2 text-xs font-semibold text-black">View Details</button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              )})}
            </div>
            <div className="flex items-center justify-between border-t border-[#2D2D2D] p-5 text-sm text-white/55">
              <span>Page 1 to 10</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-[#333] bg-[#1A1A1A] px-3 py-2 text-white/60 transition-all hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all ${currentPage === page ? "bg-[#E5D5B8] text-black" : "text-white/60 hover:bg-white/5"}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-[#333] bg-[#1A1A1A] px-3 py-2 text-white/60 transition-all hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#2D2D2D] bg-[#151515] p-5">
            <p className="mb-4 text-sm text-[#00DCA4]">Payment Summary</p>
            <div className="grid gap-5 text-sm md:grid-cols-3">
              <p className="text-white/45">Completed Bookings<br /><span className="text-white">05</span></p>
              <p className="text-white/45">Average Earnings<br /><span className="text-white">${(total / items.length).toFixed(2)}</span></p>
              <p className="text-white/45">Average Platform Fee<br /><span className="text-white">12%</span></p>
            </div>
          </section>
        </div>
      </main>

      <RaiseDisputeModal open={raiseOpen} onClose={() => setRaiseOpen(false)} onSubmit={() => { setRaiseOpen(false); setSuccessOpen(true); }} />
      <SuccessModal open={successOpen} onClose={() => setSuccessOpen(false)} />
      <DetailsDrawer open={detailsOpen} onClose={() => setDetailsOpen(false)} />
    </>
  );
}
