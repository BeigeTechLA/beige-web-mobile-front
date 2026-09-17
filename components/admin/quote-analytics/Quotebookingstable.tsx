"use client";

/**
 * QuoteBookingsTable
 * ---------------------------------------------------------------------------
 * Fully static UI — no API calls, no external data fetching. Built using the
 * same structural patterns as CreativePartnersTable (avatar-initial badges,
 * colored status pills, a collapsible mobile card view, and a page-number
 * paginator with ellipses), restyled to match the quote/booking table
 * mockup: Client Name & Quote No / Project / Booking Status / Amount /
 * Quote Status / Validity / Sales Rep / Action.
 *
 * All data below is mock data generated in-file (MOCK_QUOTES). Replace it
 * with real data whenever you're ready — the component itself has no
 * knowledge of where the rows came from.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Loader2, MoreVertical } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type BookingStatus = "Converted to Booking" | "Pending";
type QuoteStatus = "Sent" | "Accepted" | "Partially Paid";

type QuoteBooking = {
  id: string;
  quoteNo: string;
  clientName: string;
  email: string;
  initials: string;
  avatarBg: string;
  avatarText: string;
  project: string;
  bookingStatus: BookingStatus;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  quoteStatus: QuoteStatus;
  validity: string;
  salesRep: string;
};

const ROWS_PER_PAGE = 5;

const AVATAR_PALETTE = [
  { bg: "#F6E2C6", text: "#8A5A1E" }, // tan
  { bg: "#CFE0FA", text: "#2C5AA6" }, // blue
  { bg: "#E3D6FA", text: "#6B3FA0" }, // lavender
  { bg: "#D3F3D0", text: "#2E7D32" }, // green
  { bg: "#FAD6E9", text: "#A5326B" }, // pink
  { bg: "#FBDCC0", text: "#B5591A" }, // orange
];

const currency = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

// ---- mock data generation ----------------------------------------------------------
const NAME_TEMPLATES: {
  name: string;
  email: string;
  project: string;
  bookingStatus: BookingStatus;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  salesRep: string;
  quoteStatus: QuoteStatus;
}[] = [
  {
    name: "Ethan Carter",
    email: "ethan155@gmail.com",
    project: "Corporate video production",
    bookingStatus: "Converted to Booking",
    amount: 13475.7,
    paidAmount: 10475.7,
    pendingAmount: 3000,
    salesRep: "John Smith",
    quoteStatus: "Partially Paid",
  },
  {
    name: "Rami Guzman",
    email: "rami142@gmail.com",
    project: "Product launch",
    bookingStatus: "Pending",
    amount: 5000,
    paidAmount: 0,
    pendingAmount: 5000,
    salesRep: "Sarah Johnson",
    quoteStatus: "Sent",
  },
  {
    name: "John Lee",
    email: "john@gmail.com",
    project: "Commercial shoot",
    bookingStatus: "Pending",
    amount: 2000,
    paidAmount: 2000,
    pendingAmount: 0,
    salesRep: "Michael Chen",
    quoteStatus: "Accepted",
  },
  {
    name: "Kevin Brooks",
    email: "brookkevin@gmail.com",
    project: "Animated video",
    bookingStatus: "Converted to Booking",
    amount: 1400,
    paidAmount: 700,
    pendingAmount: 700,
    salesRep: "Emily Rodriguez",
    quoteStatus: "Partially Paid",
  },
  {
    name: "Lisa Anderson",
    email: "lisa@gmail.com",
    project: "Social media photography",
    bookingStatus: "Pending",
    amount: 5000,
    paidAmount: 0,
    pendingAmount: 5000,
    salesRep: "John Smith",
    quoteStatus: "Sent",
  },
  {
    name: "Sukuna Cole",
    email: "sukuna@gmail.com",
    project: "Corporate video production",
    bookingStatus: "Converted to Booking",
    amount: 2000,
    paidAmount: 2000,
    pendingAmount: 0,
    salesRep: "Sarah Johnson",
    quoteStatus: "Accepted",
  },
  {
    name: "Olivia Martin",
    email: "olivia@gmail.com",
    project: "Wedding photography",
    bookingStatus: "Pending",
    amount: 3500,
    paidAmount: 1000,
    pendingAmount: 2500,
    salesRep: "Michael Chen",
    quoteStatus: "Partially Paid",
  },
  {
    name: "Daniel Wilson",
    email: "daniel@gmail.com",
    project: "Brand campaign",
    bookingStatus: "Converted to Booking",
    amount: 8200,
    paidAmount: 8200,
    pendingAmount: 0,
    salesRep: "Emily Rodriguez",
    quoteStatus: "Accepted",
  },
  {
    name: "Sophia Taylor",
    email: "sophia@gmail.com",
    project: "Product photography",
    bookingStatus: "Pending",
    amount: 2750,
    paidAmount: 0,
    pendingAmount: 2750,
    salesRep: "John Smith",
    quoteStatus: "Sent",
  },
  {
    name: "Noah Thompson",
    email: "noah@gmail.com",
    project: "Music video",
    bookingStatus: "Converted to Booking",
    amount: 6500,
    paidAmount: 3000,
    pendingAmount: 3500,
    salesRep: "Sarah Johnson",
    quoteStatus: "Partially Paid",
  },
  {
    name: "Emma Davis",
    email: "emma@gmail.com",
    project: "Fashion shoot",
    bookingStatus: "Pending",
    amount: 4200,
    paidAmount: 0,
    pendingAmount: 4200,
    salesRep: "Michael Chen",
    quoteStatus: "Sent",
  },
  {
    name: "James Miller",
    email: "james@gmail.com",
    project: "Real estate video",
    bookingStatus: "Converted to Booking",
    amount: 1800,
    paidAmount: 1800,
    pendingAmount: 0,
    salesRep: "Emily Rodriguez",
    quoteStatus: "Accepted",
  },
  {
    name: "Mia Anderson",
    email: "mia@gmail.com",
    project: "Social media campaign",
    bookingStatus: "Pending",
    amount: 3200,
    paidAmount: 1200,
    pendingAmount: 2000,
    salesRep: "John Smith",
    quoteStatus: "Partially Paid",
  },
  {
    name: "Lucas Garcia",
    email: "lucas@gmail.com",
    project: "Event coverage",
    bookingStatus: "Converted to Booking",
    amount: 5600,
    paidAmount: 5600,
    pendingAmount: 0,
    salesRep: "Sarah Johnson",
    quoteStatus: "Accepted",
  },
  {
    name: "Ava Martinez",
    email: "ava@gmail.com",
    project: "YouTube production",
    bookingStatus: "Pending",
    amount: 2400,
    paidAmount: 500,
    pendingAmount: 1900,
    salesRep: "Michael Chen",
    quoteStatus: "Partially Paid",
  },
];


const MOCK_QUOTES: QuoteBooking[] = NAME_TEMPLATES.map((template, index) => {
  const palette = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
  const quoteNumber = index + 1;

  return {
    id: `quote-${quoteNumber}`,
    quoteNo: `QT-${String(quoteNumber).padStart(2, "0")}`,
    clientName: template.name,
    email: template.email,
    initials: initialsOf(template.name),
    avatarBg: palette.bg,
    avatarText: palette.text,
    project: template.project,
    bookingStatus: template.bookingStatus,
    amount: template.amount,
    paidAmount: template.paidAmount,
    pendingAmount: template.pendingAmount,
    quoteStatus: template.quoteStatus,
    validity: "April 15, 2026",
    salesRep: template.salesRep,
  };
});

// ---- status pill styles ---------------------------------------------------------------
const BookingStatusBadge = ({ status }: { status: BookingStatus }) => {
  const styles: Record<BookingStatus, string> = {
    "Converted to Booking": "bg-[#DFFBE4] text-[#1F9254] border-[#1F9254]/15",
    Pending: "bg-[#FCEEDA] text-[#B4770C] border-[#B4770C]/15",
  };
  return (
    <span
      className={`inline-flex w-fit whitespace-nowrap rounded-full border px-3 py-1 text-[12px] font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
};

const QuoteStatusBadge = ({ status }: { status: QuoteStatus }) => {
  const styles: Record<QuoteStatus, string> = {
    Sent: "bg-[#A2C9FF] text-[#003B8E]",
    Accepted: "bg-[#D4FFE4] text-[#16A34A]",
    "Partially Paid": "bg-[#FFF4C9] text-[#BA6605]",
  };
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
};

const AmountCell = ({
  amount,
  paidAmount,
  pendingAmount,
}: {
  amount: number;
  paidAmount: number;
  pendingAmount: number;
}) => (
  <div className="leading-tight">
    <p className="text-[13px] font-semibold text-[#f5f5f5]">{currency(amount)}</p>
    {paidAmount > 0 && (
      <p className="text-[11px] font-medium text-[#3DCB6C]">PAID - {currency(paidAmount)}</p>
    )}
    {pendingAmount > 0 && (
      <p className="text-[11px] font-medium text-[#E0A83E]">
        PENDING - {currency(pendingAmount)}
      </p>
    )}
  </div>
);

type QuoteBookingsTableProps = {
  isLoading?: boolean;
  statusFilter?: QuoteStatus | "All";
};

export function QuoteBookingsTable({ isLoading = false, statusFilter = "All" }: QuoteBookingsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filteredQuotes = useMemo(() => {
    if (!statusFilter || statusFilter === "All") return MOCK_QUOTES;
    return MOCK_QUOTES.filter((q) => q.quoteStatus === statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const totalRecords = filteredQuotes.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / ROWS_PER_PAGE));
  const currentPageClamped = Math.min(currentPage, totalPages);

  const displayedQuotes = useMemo(() => {
    const start = (currentPageClamped - 1) * ROWS_PER_PAGE;
    return filteredQuotes.slice(start, start + ROWS_PER_PAGE);
  }, [currentPageClamped, filteredQuotes]);

  const toggleRow = (id: string) => {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const columns = [
    "Client Name & Quote No",
    "Project",
    "Booking Status",
    "Amount",
    "Quote Status",
    "Validity",
    "Sales Rep",
    "Action",
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#171717]">
      {/* --- DESKTOP TABLE --- */}
      <div className="hidden lg:block w-full overflow-x-auto">
        <table className="w-full min-w-[1400px] table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[260px]" />
            <col className="w-[210px]" />
            <col className="w-[190px]" />
            <col className="w-[170px]" />
            <col className="w-[150px]" />
            <col className="w-[160px]" />
            <col className="w-[170px]" />
            <col className="w-[90px]" />
          </colgroup>
          <thead className="bg-[#101010]">
            <tr className="border-b border-[#2A2A2A]">
              {columns.map((label) => (
                <th
                  key={label}
                  className={`whitespace-nowrap px-5 py-4 text-[13px] font-medium text-[#E8D1AB] ${
                    label === "Action" ? "text-right" : ""
                  }`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="h-72">
                  <div className="flex items-center justify-center">
                    <Loader2
                      aria-label="Loading quote bookings"
                      className="h-8 w-8 animate-spin text-[#E8D1AB]"
                    />
                  </div>
                </td>
              </tr>
            ) : displayedQuotes.map((quote) => (
              <tr
                key={quote.id}
                className="border-b border-[#212121] transition-colors last:border-0 hover:bg-white/[0.02]"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                      style={{ backgroundColor: quote.avatarBg, color: quote.avatarText }}
                    >
                      {quote.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#f5f5f5]">
                        {quote.clientName}{" "}
                        <span className="font-normal text-[#E8D1AB]">({quote.quoteNo})</span>
                      </p>
                      <p className="truncate text-[12px] text-white/40">{quote.email}</p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4 text-[13px] text-white">
                  <span className="block truncate">{quote.project}</span>
                </td>

                <td className="px-5 py-4">
                  <BookingStatusBadge status={quote.bookingStatus} />
                </td>

                <td className="whitespace-nowrap px-5 py-4">
                  <AmountCell
                    amount={quote.amount}
                    paidAmount={quote.paidAmount}
                    pendingAmount={quote.pendingAmount}
                  />
                </td>

                <td className="px-5 py-4">
                  <QuoteStatusBadge status={quote.quoteStatus} />
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-[13px] text-white">
                  {quote.validity}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-[13px] text-white">
                  {quote.salesRep}
                </td>

                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    aria-label={`Actions for ${quote.clientName}`}
                    className="rounded-lg p-1.5 text-white transition-colors hover:bg-white/5"
                  >
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MOBILE COLLAPSIBLE VIEW --- */}
      <div className="block lg:hidden w-full">
        <div className="flex justify-between bg-[#101010] px-4 py-3 text-[12px] font-medium text-[#E8D1AB]">
          <p>Client</p>
          <p>Booking Status</p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2
              aria-label="Loading quote bookings"
              className="h-8 w-8 animate-spin text-[#E8D1AB]"
            />
          </div>
        ) : displayedQuotes.map((quote) => {
          const isExpanded = expandedRows.has(quote.id);
          return (
            <div
              key={quote.id}
              className={`border-b border-[#212121] px-4 py-4 last:border-0 ${
                isExpanded ? "bg-white/[0.02]" : ""
              }`}
            >
              <div
                className="flex cursor-pointer items-center justify-between gap-2"
                onClick={() => toggleRow(quote.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    className={`shrink-0 rounded-full border border-[#3a3a3a] p-1 transition-transform duration-200 ${
                      isExpanded ? "rotate-180 border-white/40" : ""
                    }`}
                  >
                    <ChevronDown size={14} className={isExpanded ? "text-white" : "text-[#777]"} />
                  </button>
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                    style={{ backgroundColor: quote.avatarBg, color: quote.avatarText }}
                  >
                    {quote.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#f5f5f5]">
                      {quote.clientName}
                    </p>
                    <p className="truncate text-[11px] text-[#E8D1AB]">{quote.quoteNo}</p>
                  </div>
                </div>
                <BookingStatusBadge status={quote.bookingStatus} />
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3 pt-4 text-[13px]">
                      <div className="col-span-2">
                        <p className="text-[11px] font-medium text-white">Email</p>
                        <p className="break-all text-white/60">{quote.email}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[11px] font-medium text-white">Project</p>
                        <p className="text-white/60">{quote.project}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-white">Amount</p>
                        <AmountCell
                          amount={quote.amount}
                          paidAmount={quote.paidAmount}
                          pendingAmount={quote.pendingAmount}
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium text-white">Quote Status</p>
                        <div className="mt-1 inline-block">
                          <QuoteStatusBadge status={quote.quoteStatus} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-white">Validity</p>
                        <p className="text-white/60">{quote.validity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium text-white">Sales Rep</p>
                        <p className="text-white/60">{quote.salesRep}</p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-3">
                      <button
                        type="button"
                        aria-label={`Actions for ${quote.clientName}`}
                        className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* --- PAGINATION --- */}
      {!isLoading && <div className="flex flex-col gap-3 border-t border-[#2A2A2A] bg-[#101010] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-[13px] text-white/50">
          Page {currentPageClamped} to {totalPages}
        </span>

        <div className="flex items-center gap-[2px]">
          <button
            aria-label="Previous page"
            disabled={currentPageClamped === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="grid h-8 w-8 place-items-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>

          {(() => {
            const rangePages: (number | "...")[] = [];
            const delta = 1;
            const left = currentPageClamped - delta;
            const right = currentPageClamped + delta + 1;

            for (let i = 1; i <= totalPages; i++) {
              if (i === 1 || i === totalPages || (i >= left && i < right)) {
                rangePages.push(i);
              } else if (i === left - 1 || i === right) {
                rangePages.push("...");
              }
            }

            return rangePages
              .filter((val, index, arr) => val !== "..." || arr[index - 1] !== "...")
              .map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="flex h-8 w-8 items-center justify-center text-[13px] text-white/30"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`grid h-8 w-8 place-items-center rounded-lg border text-[13px] font-medium transition-colors ${
                      currentPageClamped === page
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-transparent text-white/40 hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                )
              );
          })()}

          <button
            aria-label="Next page"
            disabled={currentPageClamped === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="grid h-8 w-8 place-items-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>}
    </section>
  );
}
