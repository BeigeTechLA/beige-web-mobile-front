"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, Download, ExternalLink, FileText, History, Loader2 } from "lucide-react";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { cpCompensationApi, normalizeCpRoleLabel, type CpCompensationDetails, type CpPaymentHistoryItem } from "@/lib/api/cpCompensation";
import { formatCurrency } from "@/lib/utils";

type HistoryEntry = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  dateLabel: string;
  dateSortKey: number;
  receiptUrl?: string | null;
  receiptDownloadUrl?: string | null;
  proofFileName?: string | null;
};

type CreatorHistoryGroup = {
  id: string;
  creatorName: string;
  role: string;
  total: string;
  paid: string;
  remaining: string;
  entries: HistoryEntry[];
};

const formatHistoryDate = (value?: string | null) => {
  if (!value) return "Date not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const joinAssetUrl = (baseUrl: string | undefined, pathValue: string) => {
  const base = String(baseUrl || "").trim();
  if (!base) return "";

  return `${base.replace(/\/+$/, "")}/${pathValue.replace(/^\/+/, "")}`;
};

const getReceiptFileName = (value?: string | null) => {
  const raw = String(value || "").split("?")[0];
  return raw.split("/").filter(Boolean).pop() || "receipt.pdf";
};

const resolveReceiptUrl = (value?: string | null, fallbackFileName?: string | null) => {
  const raw = String(value || fallbackFileName || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;

  const normalizedPath = raw.replace(/^beige\//i, "");
  return (
    joinAssetUrl(process.env.NEXT_PUBLIC_IMG_URL_CDN, normalizedPath) ||
    joinAssetUrl(process.env.NEXT_PUBLIC_IMG_URL, normalizedPath) ||
    raw
  );
};

const withDownloadDisposition = (url: string, filename: string) => {
  const params = new URLSearchParams({
    url,
    filename,
    disposition: "attachment",
  });
  return `/api/cp-compensation-receipt?${params.toString()}`;
};

const buildReceiptViewUrl = (url: string, filename: string, bookingId?: string | number) => {
  const params = new URLSearchParams({
    url,
    filename,
  });
  if (bookingId) params.set("bookingId", String(bookingId));
  return `/admin/finances/cpCompensation/receipt-view?${params.toString()}`;
};

const mapPaymentEntry = (item: CpPaymentHistoryItem, index: number): HistoryEntry => {
  const amount = Number(item.amount || 0);
  const title = String(item.method || item.type || "Payment").replace(/_/g, " ");
  const rawReceiptValue = item.receipt_url || item.receipt_download_url || null;
      const proofFileName = item.proof_file_name || (rawReceiptValue ? getReceiptFileName(rawReceiptValue) : null);
      const receiptUrl = resolveReceiptUrl(item.receipt_url || item.receipt_download_url, proofFileName);
      const receiptDownloadUrl = receiptUrl ? withDownloadDisposition(receiptUrl, proofFileName || "receipt.pdf") : null;

  return {
    id: String(item.id || `payment-${index}`),
    title: item.type === "partial_payment" ? "Applied as partial payment" : title,
    subtitle: String(item.notes || item.status || "Payment recorded"),
    amount: formatCurrency(amount),
    dateLabel: formatHistoryDate(item.paid_at),
    dateSortKey: item.paid_at ? new Date(item.paid_at).getTime() : 0,
    receiptUrl,
    receiptDownloadUrl,
    proofFileName,
  };
};

export default function CpCompensationHistoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ bookingId?: string | string[] }>();
  const { isDark } = useResolvedTheme();

  const bookingId = useMemo(() => {
    const raw = params?.bookingId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params?.bookingId]);

  const numericBookingId = Number(bookingId);

  const [details, setDetails] = useState<CpCompensationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const hasInitializedExpandedGroup = useRef(false);

  useEffect(() => {
    if (!Number.isFinite(numericBookingId) || numericBookingId <= 0) {
      setLoading(false);
      toast.error("Invalid booking ID for payment history.");
      return;
    }

    let active = true;

    const loadDetails = async () => {
      setLoading(true);
      try {
        const response = await cpCompensationApi.details(numericBookingId);
        if (active) {
          setDetails(response);
        }
      } catch (error) {
        if (active) {
          setDetails(null);
        }
        toast.error(error instanceof Error ? error.message : "Failed to load payment history");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadDetails();

    return () => {
      active = false;
    };
  }, [numericBookingId]);

  const creatorHistoryGroups = useMemo<CreatorHistoryGroup[]>(() => {
    return (details?.creators || []).map((creator) => {
      const creatorName = creator.creator_name || "Unknown Creator";
      const role = normalizeCpRoleLabel(creator.cp_role) || "Creative Partner";

      const paymentEntries = (creator.payment_history || []).map(mapPaymentEntry);

      const advances = (creator.advances || []).map((advance, index) => {
        const paidAt = advance.processed_at || null;
        return {
          id: `advance-${creator.creator_earning_id}-${advance.advance_id || index}`,
          title: "Applied as partial payment",
          subtitle: `${creatorName} - ${role}`,
          amount: formatCurrency(advance.amount || 0),
          dateLabel: formatHistoryDate(paidAt),
          dateSortKey: paidAt ? new Date(paidAt).getTime() : 0,
          receiptUrl: null,
          receiptDownloadUrl: null,
        };
      });

      const timeline = (creator.timeline || []).map((event, index) => {
        const eventDate = event.event_date || null;
        return {
          id: `timeline-${creator.creator_earning_id}-${event.timeline_event_id || event.event_type || index}`,
          title: event.label || event.event_type || "Payment activity",
          subtitle: event.sub_label || creatorName,
          amount: event.amount != null ? formatCurrency(event.amount) : formatCurrency(creator.total_compensation || 0),
          dateLabel: formatHistoryDate(eventDate),
          dateSortKey: eventDate ? new Date(eventDate).getTime() : 0,
          receiptUrl: null,
          receiptDownloadUrl: null,
        };
      });

      const entries = (paymentEntries.length > 0 ? paymentEntries : [...advances, ...timeline])
        .sort((left, right) => right.dateSortKey - left.dateSortKey);

      return {
        id: String(creator.creator_earning_id),
        creatorName,
        role,
        total: formatCurrency(creator.total_compensation || 0),
        paid: formatCurrency(creator.paid_total || 0),
        remaining: formatCurrency(Math.max(Number(creator.remaining_balance || 0), 0)),
        entries,
      };
    });
  }, [details]);

  useEffect(() => {
    if (!hasInitializedExpandedGroup.current && creatorHistoryGroups.length > 0) {
      setExpandedGroupId(creatorHistoryGroups[0].id);
      hasInitializedExpandedGroup.current = true;
    }
  }, [creatorHistoryGroups]);

  const toggleGroup = (groupId: string) => {
    if (creatorHistoryGroups.length <= 1) {
      setExpandedGroupId(groupId);
      return;
    }
    setExpandedGroupId((current) => (current === groupId ? null : groupId));
  };

  const summaryCards = [
    {
      label: "Total CP Payout",
      value: formatCurrency(details?.summary?.total_cp_payout || 0),
    },
    {
      label: "Shoot Amount",
      value: formatCurrency(details?.summary?.shoot_amount || 0),
    },
    {
      label: "Margin",
      value: `${Number(details?.summary?.margin_percent || 0).toFixed(1)}%`,
    },
    {
      label: "Creators",
      value: String(details?.creators?.length || 0),
    },
  ];

  return (
    <>
      <Topbar pathname={pathname} />

      <div
        className={`min-h-screen space-y-5 p-4 lg:space-y-8 lg:px-10 lg:py-9 ${isDark ? "bg-[#0B0B0B]" : "bg-[#F4F5F7]"}`}
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => router.back()}
              className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black"}`}
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <div>
              <h1 className={`text-lg lg:text-2xl font-semibold ${isDark ? "text-white" : "text-black"}`}>
                Payment History
              </h1>
              <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/55" : "text-black/55"}`}>
                {details?.shoot_name || `Booking #${bookingId || "Unknown"}`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl border p-4 lg:p-5 ${isDark ? "border-white/5 bg-[#151515]" : "border-[#E5E5E5] bg-white"}`}
            >
              <p className={`text-[11px] uppercase tracking-[0.16em] ${isDark ? "text-white/35" : "text-black/35"}`}>
                {card.label}
              </p>
              <p className={`mt-2 text-base font-semibold lg:text-xl ${isDark ? "text-[#E8D1AB]" : "text-[#8A6A3D]"}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <section className={`overflow-hidden rounded-xl border ${isDark ? "border-white/10 bg-[#111111]" : "border-[#E5E5E5] bg-white"}`}>
          <div className={`flex items-center justify-between gap-4 border-b px-4 py-4 lg:px-5 ${isDark ? "border-white/5" : "border-[#EFEFEF]"}`}>
            <div>
              <h2 className={`text-sm lg:text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>
                Payment History
              </h2>
              <p className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                View compensation activity for this specific booking.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="animate-spin text-[#E8D1AB]" size={32} />
            </div>
          ) : creatorHistoryGroups.some((group) => group.entries.length > 0) ? (
            <div className="space-y-4 p-4 lg:p-5">
              {creatorHistoryGroups.map((group) => {
                const isExpanded = expandedGroupId === group.id;
                const canCollapse = creatorHistoryGroups.length > 1;

                return (
                  <div key={group.id} className={`overflow-hidden rounded-xl border ${isDark ? "border-white/10 bg-[#171717]" : "border-[#EFEFEF] bg-[#FAFAFA]"}`}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      aria-expanded={isExpanded}
                      aria-disabled={!canCollapse}
                      disabled={!canCollapse}
                      className={`flex w-full flex-col gap-3 border-b p-4 text-left transition-colors sm:flex-row sm:items-center sm:justify-between ${isDark ? "border-white/10 bg-[#1C1C1C] hover:bg-white/[0.03]" : "border-[#EFEFEF] bg-white hover:bg-[#FCFCFC]"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isDark ? "bg-[#2A2520] text-[#E8D1AB]" : "bg-[#F4EFE2] text-[#8A6A3D]"}`}>
                          <History size={16} />
                        </div>
                        <div>
                          <p className={`text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>{group.creatorName}</p>
                          <p className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>{group.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <div className="grid grid-cols-3 gap-3 text-right text-base">
                          <span className={isDark ? "text-white/50" : "text-black/50"}>Total <b className={isDark ? "text-white/90" : "text-black/90"}>{group.total}</b></span>
                          <span className={isDark ? "text-white/50" : "text-black/50"}>Paid <b className="text-[#10B981]">{group.paid}</b></span>
                          <span className={isDark ? "text-white/50" : "text-black/50"}>Remaining <b className={isDark ? "text-[#E8D1AB]" : "text-[#8A6A3D]"}>{group.remaining}</b></span>
                        </div>
                        {canCollapse && (
                          <ChevronDown
                            size={18}
                            className={`shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""} ${isDark ? "text-white/50" : "text-black/45"}`}
                          />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div>
                        {group.entries.length > 0 ? group.entries.map((entry) => (
                          <div
                            key={entry.id}
                            className={`grid grid-cols-1 gap-4 border-b px-4 py-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center ${isDark ? "border-white/5" : "border-[#EFEFEF]"}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isDark ? "bg-[#2A2520] text-[#E8D1AB]" : "bg-[#F4EFE2] text-[#8A6A3D]"}`}>
                                <History size={16} />
                              </div>

                              <div className="min-w-0">
                                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                                  {entry.title}
                                </p>
                                <p className={`mt-1 text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
                                  {entry.dateLabel}
                                  {entry.subtitle ? ` - ${entry.subtitle}` : ""}
                                </p>

                                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                                  {entry.receiptUrl ? (
                                    <a
                                      href={buildReceiptViewUrl(entry.receiptUrl, entry.proofFileName || "receipt.pdf", bookingId)}
                                      className={`inline-flex items-center gap-1.5 font-medium transition-colors ${isDark ? "text-[#E8D1AB] hover:text-[#F4E8CF]" : "text-[#8A6A3D] hover:text-[#6E5430]"}`}
                                    >
                                      <ExternalLink size={12} />
                                      View Receipt
                                    </a>
                                  ) : entry.proofFileName ? (
                                    <span className={`inline-flex items-center gap-1.5 ${isDark ? "text-white/55" : "text-black/55"}`}>
                                      <FileText size={12} />
                                      Receipt attached: {entry.proofFileName}
                                    </span>
                                  ) : (
                                    <span className={`${isDark ? "text-white/30" : "text-black/30"}`}>
                                      No receipt attached
                                    </span>
                                  )}

                                  {entry.receiptDownloadUrl && (
                                    <a
                                      href={entry.receiptDownloadUrl}
                                      rel="noopener noreferrer"
                                      download={entry.proofFileName || "receipt.pdf"}
                                      className={`inline-flex items-center gap-1.5 font-medium transition-colors ${isDark ? "text-white/55 hover:text-white" : "text-black/55 hover:text-black"}`}
                                      title="Download receipt"
                                    >
                                      <Download size={12} />
                                      Download
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:text-right">
                              <span className={`text-xl font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#8A6A3D]"}`}>
                                {entry.amount || "-"}
                              </span>
                            </div>
                          </div>
                        )) : (
                          <div className={`px-4 py-4 text-sm ${isDark ? "text-white/35" : "text-black/35"}`}>
                            No payment history for this creative partner yet.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`flex min-h-[240px] items-center justify-center px-6 text-center ${isDark ? "text-white/45" : "text-black/45"}`}>
              No payment history found for this booking yet.
            </div>
          )}
        </section>

        
      </div>
    </>
  );
}
