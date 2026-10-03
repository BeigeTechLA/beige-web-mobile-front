"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  History,
  Search,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { salesApi, type SalesQuoteDetailData } from "@/lib/api";
import {
  formatQuoteCurrency,
  getQuoteNumber,
  normalizeQuoteLineItems,
} from "@/lib/quoteDetail";
import { unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

type QuoteVersionHistoryPageProps = {
  quoteId: string;
};

type QuoteVersionMeta = Record<string, unknown>;

type QuoteVersionRecord = {
  number: number;
  isCurrent: boolean;
  status: string;
  reason: string;
  createdAt: string | null;
  actorName: string;
  detail: SalesQuoteDetailData | null;
  raw: QuoteVersionMeta;
};

type HistoryChange = {
  key: string;
  label: string;
  category: "Service" | "Pricing" | "Quote";
  previous: string;
  next: string;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const firstText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
};

const getVersionNumber = (version: QuoteVersionMeta, fallback: number) => {
  const value = Number(version.version_number ?? version.version ?? fallback);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const formatVersionDate = (value: string | null) => {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getVersionActor = (version: QuoteVersionMeta, detail: SalesQuoteDetailData | null) => {
  const rawDetail = asRecord(detail);
  const createdBy = asRecord(version.created_by) || asRecord(version.performed_by) || asRecord(rawDetail?.created_by);
  const updatedBy = asRecord(version.updated_by) || asRecord(rawDetail?.updated_by);
  return firstText(
    version.created_by_name,
    version.updated_by_name,
    createdBy?.name,
    updatedBy?.name,
    rawDetail?.created_by_name,
    rawDetail?.updated_by_name,
    "System"
  );
};

const getVersionReason = (version: QuoteVersionMeta, detail: SalesQuoteDetailData | null, versionNumber: number) => {
  const rawDetail = asRecord(detail);
  return firstText(
    version.edit_reason,
    version.version_notes,
    version.reason,
    version.change_reason,
    rawDetail?.edit_reason,
    rawDetail?.version_notes,
    versionNumber === 1 ? "Initial quote creation" : "Quote updated"
  );
};

const getVersionCreatedAt = (version: QuoteVersionMeta, detail: SalesQuoteDetailData | null) => {
  const rawDetail = asRecord(detail);
  const value = firstText(
    version.created_at,
    version.updated_at,
    version.reviewed_at,
    rawDetail?.created_at,
    rawDetail?.updated_at
  );
  return value || null;
};

const getVersionStatus = (version: QuoteVersionMeta) =>
  firstText(
    version.approval_status,
    version.change_request_status,
    version.review_status,
    version.status
  ).toLowerCase();

const getQuoteTitle = (detail: SalesQuoteDetailData | null) => {
  const record = asRecord(detail);
  return firstText(
    record?.project_name,
    record?.quote_title,
    record?.title,
    record?.project_description,
    "Quote"
  );
};

const getClientName = (detail: SalesQuoteDetailData | null) => {
  const record = asRecord(detail);
  const client = asRecord(record?.client);
  const lead = asRecord(record?.lead);
  return firstText(
    client?.name,
    record?.client_name,
    lead?.name,
    record?.customer_name,
    "Client"
  );
};

const getQuoteNumberLabel = (detail: SalesQuoteDetailData | null, quoteId: string) => {
  const record = asRecord(detail);
  return firstText(record?.quote_number, record?.quote_no, quoteId);
};

const summarizeQuote = (detail: SalesQuoteDetailData | null) => {
  if (!detail) {
    return {
      total: 0,
      duration: 0,
      crew: 0,
      serviceCount: 0,
      status: "",
    };
  }

  const raw = asRecord(detail);
  const lineItems = normalizeQuoteLineItems(detail);
  const duration = lineItems.reduce((sum, item) => sum + Number(item.duration || 0), 0);
  const crew = lineItems.reduce((sum, item) => sum + Number(item.crew || 0), 0);
  const total = Number(
    getQuoteNumber(
      raw?.final_total,
      raw?.total_amount,
      raw?.amount_after_tax,
      raw?.amount_after_discount,
      raw?.total
    ) || 0
  );

  return {
    total: Number.isFinite(total) ? total : 0,
    duration,
    crew,
    serviceCount: lineItems.length,
    status: firstText(raw?.status, raw?.quote_status),
  };
};

const createChanges = (
  older: SalesQuoteDetailData | null,
  newer: SalesQuoteDetailData | null
): HistoryChange[] => {
  if (!older || !newer) return [];

  const previous = summarizeQuote(older);
  const next = summarizeQuote(newer);
  const changes: HistoryChange[] = [];

  if (previous.duration !== next.duration) {
    changes.push({
      key: "duration",
      label: "Duration",
      category: "Service",
      previous: `${previous.duration || 0} hours`,
      next: `${next.duration || 0} hours`,
    });
  }

  if (previous.crew !== next.crew) {
    changes.push({
      key: "crew",
      label: "Crew Size",
      category: "Service",
      previous: `${previous.crew || 0} members`,
      next: `${next.crew || 0} members`,
    });
  }

  if (previous.serviceCount !== next.serviceCount) {
    changes.push({
      key: "services",
      label: "Services",
      category: "Service",
      previous: `${previous.serviceCount} item${previous.serviceCount === 1 ? "" : "s"}`,
      next: `${next.serviceCount} item${next.serviceCount === 1 ? "" : "s"}`,
    });
  }

  if (previous.total !== next.total) {
    changes.push({
      key: "price",
      label: "Total Price",
      category: "Pricing",
      previous: formatQuoteCurrency(previous.total),
      next: formatQuoteCurrency(next.total),
    });
  }

  if (previous.status !== next.status && (previous.status || next.status)) {
    changes.push({
      key: "status",
      label: "Status",
      category: "Quote",
      previous: previous.status || "Not set",
      next: next.status || "Not set",
    });
  }

  return changes;
};

const extractServerChanges = (version: QuoteVersionMeta): HistoryChange[] => {
  const possibleChanges = asArray(version.changes || version.changed_fields || asRecord(version.audit)?.changed_fields);

  return possibleChanges.flatMap((value, index) => {
    const change = asRecord(value);
    if (!change) return [];
    const label = firstText(change.label, change.field, `Change ${index + 1}`);
    const previous = firstText(change.display_previous, change.previous, change.old_value, "Not set");
    const next = firstText(change.display_new, change.next, change.new_value, "Not set");
    const lowered = label.toLowerCase();
    const category: HistoryChange["category"] = lowered.includes("price") || lowered.includes("total")
      ? "Pricing"
      : lowered.includes("service") || lowered.includes("duration") || lowered.includes("crew")
        ? "Service"
        : "Quote";
    return [{ key: `${label}-${index}`, label, category, previous, next }];
  });
};

const HistorySkeleton = ({ isDark }: { isDark: boolean }) => (
  <div className="space-y-4">
    {[0, 1].map((item) => (
      <div
        key={item}
        className={`animate-pulse rounded-2xl border p-6 ${isDark ? "border-white/10 bg-[#121212]" : "border-black/10 bg-white"}`}
      >
        <div className={`h-5 w-44 rounded ${isDark ? "bg-white/10" : "bg-black/10"}`} />
        <div className={`mt-4 h-10 rounded ${isDark ? "bg-white/5" : "bg-black/5"}`} />
        <div className={`mt-4 h-24 rounded ${isDark ? "bg-white/5" : "bg-black/5"}`} />
      </div>
    ))}
  </div>
);

export default function QuoteVersionHistoryPage({ quoteId }: QuoteVersionHistoryPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useResolvedTheme();

  const [quote, setQuote] = useState<SalesQuoteDetailData | null>(null);
  const [versions, setVersions] = useState<QuoteVersionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [versionFilter, setVersionFilter] = useState("all");

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [quoteResponse, versionsResponse] = await Promise.all([
        salesApi.getQuoteDetail(quoteId),
        salesApi.getQuoteVersions(quoteId),
      ]);

      const quoteDetail = unwrapSalesQuoteDetail(quoteResponse?.data ?? null);
      if (!quoteDetail) throw new Error("Quote details are unavailable");
      setQuote(quoteDetail);

      const rawVersions = Array.isArray(versionsResponse?.data)
        ? versionsResponse.data
        : Array.isArray(versionsResponse?.data?.versions)
          ? versionsResponse.data.versions
          : [];

      const versionMeta = rawVersions
        .filter((item: unknown) => asRecord(item))
        .map((item: unknown, index: number) => {
          const raw = asRecord(item) as QuoteVersionMeta;
          return {
            raw,
            number: getVersionNumber(raw, index + 1),
          };
        })
        .sort((a, b) => a.number - b.number);

      const detailResponses = await Promise.all(
        versionMeta.map(async ({ raw, number }) => {
          try {
            const response = await salesApi.getQuoteVersionDetail(quoteId, String(number));
            const detail = unwrapSalesQuoteDetail(response?.data ?? null);
            return { raw, number, detail };
          } catch {
            return { raw, number, detail: null };
          }
        })
      );

      const records: QuoteVersionRecord[] = detailResponses.map(({ raw, number, detail }, index) => ({
        number,
        isCurrent: Boolean(raw.is_current) || index === detailResponses.length - 1,
        status: getVersionStatus(raw),
        reason: getVersionReason(raw, detail, number),
        createdAt: getVersionCreatedAt(raw, detail),
        actorName: getVersionActor(raw, detail),
        detail,
        raw,
      }));

      setVersions(records.sort((a, b) => b.number - a.number));
    } catch (loadError) {
      console.error("Failed to load quote version history", loadError);
      const message = loadError instanceof Error ? loadError.message : "Failed to load version history";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const filteredVersions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const now = new Date();

    return versions.filter((version) => {
      const searchText = [
        `version ${version.number}`,
        version.actorName,
        version.reason,
        version.status,
      ].join(" ").toLowerCase();

      if (normalizedSearch && !searchText.includes(normalizedSearch)) return false;
      if (statusFilter === "current" && !version.isCurrent) return false;
      if (statusFilter === "previous" && version.isCurrent) return false;
      if (versionFilter !== "all" && String(version.number) !== versionFilter) return false;

      if (dateFilter !== "all" && version.createdAt) {
        const date = new Date(version.createdAt);
        if (!Number.isNaN(date.getTime())) {
          if (dateFilter === "month" && (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear())) return false;
          if (dateFilter === "year" && date.getFullYear() !== now.getFullYear()) return false;
        }
      }

      return true;
    });
  }, [dateFilter, search, statusFilter, versionFilter, versions]);

  const ascendingVersions = useMemo(
    () => [...versions].sort((a, b) => a.number - b.number),
    [versions]
  );

  const getChangesForVersion = useCallback((version: QuoteVersionRecord) => {
    const serverChanges = extractServerChanges(version.raw);
    if (serverChanges.length > 0) return serverChanges;

    const currentIndex = ascendingVersions.findIndex((item) => item.number === version.number);
    if (currentIndex <= 0) return [];
    return createChanges(ascendingVersions[currentIndex - 1].detail, version.detail);
  }, [ascendingVersions]);

  const handleRevert = useCallback((version: QuoteVersionRecord) => {
    router.push(
      `/admin/quotes/create?quoteId=${encodeURIComponent(quoteId)}&editVersion=${encodeURIComponent(String(version.number))}`
    );
    toast.message(`Version ${version.number} loaded for review. Saving it will create a new quote version.`);
  }, [quoteId, router]);

  const quoteTitle = getQuoteTitle(quote);
  const clientName = getClientName(quote);
  const quoteNumber = getQuoteNumberLabel(quote, quoteId);

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0D0D0D] text-white" : "bg-[#F4F5F7] text-black"}`}>
      <div className="sticky top-0 z-40">
        <Topbar
          pathname={pathname}
          breadcrumbOverrides={{ quotes: "Quote", [quoteId]: "Quotes Details", history: "Version History" }}
        />
      </div>

      <main className="px-4 pb-12 pt-6 lg:px-10 lg:pt-10">
        <button
          type="button"
          onClick={() => router.push(`/admin/quotes/${quoteId}`)}
          className={`mb-7 inline-flex items-center gap-2 text-sm transition-colors ${isDark ? "text-white/80 hover:text-white" : "text-black/70 hover:text-black"}`}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight lg:text-[30px]">Quote History - {quoteTitle}</h1>
          <p className={`mt-1 text-sm lg:text-base ${isDark ? "text-white/55" : "text-black/55"}`}>
            Client: {clientName} · Quote #{quoteNumber}
          </p>
        </div>

        <section className={`overflow-hidden rounded-2xl border ${isDark ? "border-[#2A2A2A] bg-[#111111]" : "border-black/10 bg-white"}`}>
          <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="flex items-center gap-3">
              <span className="h-8 w-[3px] rounded-full bg-[#E8D1AB]" />
              <h2 className="text-lg font-medium">Version History</h2>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:flex lg:items-center">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`h-10 rounded-full px-4 text-xs ${isDark ? "border-white/20 bg-transparent text-white" : "border-black/15 bg-white text-black"}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Status</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="previous">Previous</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className={`h-10 rounded-full px-4 text-xs ${isDark ? "border-white/20 bg-transparent text-white" : "border-black/15 bg-white text-black"}`}>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Month</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>

              <Select value={versionFilter} onValueChange={setVersionFilter}>
                <SelectTrigger className={`h-10 rounded-full px-4 text-xs ${isDark ? "border-white/20 bg-transparent text-white" : "border-black/15 bg-white text-black"}`}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {versions.map((version) => (
                    <SelectItem key={version.number} value={String(version.number)}>
                      Version {version.number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={`border-t px-5 py-4 lg:px-6 ${isDark ? "border-[#252525]" : "border-black/10"}`}>
            <div className="relative">
              <Search size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? "text-white/35" : "text-black/35"}`} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by Quote Version.."
                className={`h-12 w-full rounded-lg border pl-11 pr-4 text-sm outline-none transition-colors ${isDark ? "border-[#343434] bg-[#202020] text-white placeholder:text-white/30 focus:border-[#E8D1AB]/60" : "border-black/10 bg-[#F7F7F7] text-black placeholder:text-black/35 focus:border-[#C6A875]"}`}
              />
            </div>
          </div>
        </section>

        <div className="mt-5">
          {loading ? (
            <HistorySkeleton isDark={isDark} />
          ) : error ? (
            <div className={`rounded-2xl border p-8 text-center ${isDark ? "border-red-500/20 bg-red-500/5" : "border-red-200 bg-red-50"}`}>
              <AlertCircle className="mx-auto mb-3 text-red-400" size={28} />
              <p className="font-medium">{error}</p>
              <Button onClick={() => void loadHistory()} className="mt-4 bg-[#E8D1AB] text-black hover:bg-[#E8D1AB]/90">
                Try Again
              </Button>
            </div>
          ) : filteredVersions.length === 0 ? (
            <div className={`rounded-2xl border px-6 py-16 text-center ${isDark ? "border-white/10 bg-[#111111]" : "border-black/10 bg-white"}`}>
              <History size={30} className="mx-auto mb-3 text-[#C8A96B]" />
              <p className="font-medium">No version history found</p>
              <p className={`mt-1 text-sm ${isDark ? "text-white/45" : "text-black/45"}`}>Try changing the current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVersions.map((version) => {
                const changes = getChangesForVersion(version);
                const isInitial = version.number === Math.min(...versions.map((item) => item.number));

                return (
                  <article
                    key={version.number}
                    className={`rounded-2xl border p-5 lg:p-6 ${isDark ? "border-[#343434] bg-[#101010]" : "border-black/10 bg-white"}`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold ${version.isCurrent ? "bg-[#5A3A00] text-[#FFC400]" : isDark ? "bg-[#28282B] text-white/65" : "bg-[#EFEFEF] text-black/55"}`}>
                          V{version.number}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold">{isInitial ? "Initial Quote" : `Version ${version.number}`}</h3>
                            {version.isCurrent ? (
                              <span className="rounded-md border border-[#7A5400] bg-[#3C2A00] px-2 py-0.5 text-xs font-medium text-[#FFC400]">Current</span>
                            ) : null}
                          </div>
                          <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm ${isDark ? "text-white/55" : "text-black/55"}`}>
                            <span className="inline-flex items-center gap-1.5"><UserRound size={15} /> {version.actorName}</span>
                            <span className="inline-flex items-center gap-1.5"><Clock3 size={15} /> {formatVersionDate(version.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {!version.isCurrent ? (
                        <Button
                          type="button"
                          onClick={() => handleRevert(version)}
                          className="h-11 shrink-0 rounded-lg bg-[#E8D1AB] px-5 font-semibold text-black hover:bg-[#E8D1AB]/90"
                        >
                          Revert to Version {version.number}
                        </Button>
                      ) : null}
                    </div>

                    <div className={`mt-4 flex items-start gap-2 rounded-md border px-4 py-3 text-sm ${isDark ? "border-[#3B3B3F] bg-[#1E1E20] text-white/75" : "border-black/10 bg-[#F6F6F6] text-black/70"}`}>
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span><strong>Reason:</strong> {version.reason}</span>
                    </div>

                    {isInitial ? (
                      <p className={`mt-4 text-sm italic ${isDark ? "text-white/30" : "text-black/35"}`}>Original quote created</p>
                    ) : changes.length > 0 ? (
                      <div className={`mt-4 border-t pt-4 ${isDark ? "border-[#2A2A2A]" : "border-black/10"}`}>
                        <p className={`mb-3 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>Changes Made:</p>
                        <div className="space-y-2">
                          {changes.map((change) => (
                            <div key={change.key} className={`rounded-xl px-4 py-3 ${isDark ? "bg-[#181818]" : "bg-[#F7F7F7]"}`}>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium">{change.label}</span>
                                <span className={`rounded border px-1.5 py-0.5 text-[11px] ${change.category === "Pricing" ? "border-[#A27300] bg-[#4A3400] text-[#FFC400]" : change.category === "Service" ? "border-[#0F5B9B] bg-[#0C2A44] text-[#60A5FA]" : "border-white/10 bg-white/5 text-white/60"}`}>
                                  {change.category}
                                </span>
                              </div>
                              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                <div>
                                  <p className={`flex items-center gap-1 text-xs ${isDark ? "text-white/35" : "text-black/40"}`}><ArrowDownLeft size={13} /> Old Value</p>
                                  <p className={`mt-1 text-sm ${isDark ? "text-white/60" : "text-black/65"}`}>{change.previous}</p>
                                </div>
                                <div>
                                  <p className={`flex items-center gap-1 text-xs ${isDark ? "text-white/35" : "text-black/40"}`}><ArrowUpRight size={13} /> New Value</p>
                                  <p className="mt-1 text-sm font-medium">{change.next}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={`mt-4 border-t pt-4 text-sm ${isDark ? "border-[#2A2A2A] text-white/35" : "border-black/10 text-black/40"}`}>
                        No field-level changes were returned for this version.
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
