"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Eye,
  Loader2,
  Video,
} from "lucide-react";
import {
  salesApi,
  type SalesQuoteDetailData,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatQuoteCurrency,
  normalizeQuoteLineItems,
} from "@/lib/quoteDetail";
import { unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";
import QuotePreviewModal from "@/components/quotes/QuotePreviewModal";
import { getInitials } from "@/lib/utils";
import Topbar from "@/components/admin/Topbar";

type QuoteVersionSummaryProps = {
  quoteId: string;
  isDark?: boolean; // Dynamic theme tracker
};

const asRecord = (value: unknown): Record<string, any> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, any>;
};

const extractVersionInfo = (value: unknown) => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  if (asRecord(record.version)) {
    return record.version as Record<string, any>;
  }

  const nestedData = asRecord(record.data);
  if (nestedData && asRecord(nestedData.version)) {
    return nestedData.version as Record<string, any>;
  }

  return null;
};

export default function QuoteVersionSummary({ quoteId, isDark = true }: QuoteVersionSummaryProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [quote, setQuote] = useState<SalesQuoteDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [versions, setVersions] = useState<any[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");

  const fetchQuoteData = async (id: string, versionId?: string) => {
    setIsLoading(true);
    try {
      const response = versionId
        ? await salesApi.getQuoteVersionDetail(id, versionId)
        : await salesApi.getQuoteDetail(id);

      if (response?.success && response.data) {
        const unwrappedQuote = unwrapSalesQuoteDetail(response.data);
        if (unwrappedQuote) {
          const versionInfo = extractVersionInfo(response.data);
          if (versionInfo) {
            unwrappedQuote.version_number = versionInfo.version_number;
            unwrappedQuote.metadata = {
              ...(unwrappedQuote.metadata || {}),
              ...versionInfo
            };
          }
          setQuote(unwrappedQuote);
        }
      }
    } catch (error) {
      console.error("Failed to fetch quote detail:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!quoteId) return;

    const initializeQuoteSummary = async () => {
      setIsLoading(true);

      try {
        const versionsResponse = await salesApi.getQuoteVersions(quoteId);
        const versionsData =
          versionsResponse?.success
            ? Array.isArray(versionsResponse.data)
              ? versionsResponse.data
              : Array.isArray((versionsResponse.data as any)?.versions)
                ? (versionsResponse.data as any).versions
                : []
            : [];

        setVersions(versionsData);

        const defaultVersion =
          versionsData.find((version) => version?.is_current && version?.version_number != null) ||
          versionsData.find((version) => version?.version_number != null);

        if (defaultVersion?.version_number != null) {
          const versionId = String(defaultVersion.version_number);
          setSelectedVersionId(versionId);
          await fetchQuoteData(quoteId, versionId);
          return;
        }

        await fetchQuoteData(quoteId);
      } catch (error) {
        console.error("Failed to initialize quote summary:", error);
        await fetchQuoteData(quoteId);
      }
    };

    void initializeQuoteSummary();
  }, [quoteId]);

  const currentVersionNumber = quote?.metadata?.version_number || quote?.version_number || 1;
  const clientName = quote?.client_name || quote?.guest_email || "Client";

  useEffect(() => {
    if (currentVersionNumber != null) {
      setSelectedVersionId(String(currentVersionNumber));
    }
  }, [currentVersionNumber]);

  const lineItems = useMemo(() => {
    const items = quote ? normalizeQuoteLineItems(quote) : [];
    return {
      services: items.filter((it: any) => it.section === "service"),
      addons: items.filter((it: any) => it.section === "addon"),
      logistics: items.filter((it: any) => it.section === "logistics"),
      custom: items.filter((it: any) => it.section === "custom"),
    };
  }, [quote]);

  const subtotalAmount = Number(quote?.subtotal ?? 0);
  const discountType = String(quote?.discount_type ?? "").toLowerCase();
  const discountValue = Number(quote?.discount_value ?? 0);
  const resolvedDiscountAmount = Math.max(
    0,
    Number(
      quote?.discount_amount ??
      (discountType.includes("percent") ? subtotalAmount * (discountValue / 100) : discountValue)
    )
  );
  const discountAmount = Math.min(resolvedDiscountAmount, subtotalAmount);
  const taxRate = Number(quote?.tax_rate ?? 0);
  const taxAmount = Number(quote?.tax_amount ?? 0);
  const hasDiscount = discountAmount > 0;

  if (isLoading && !quote) {
    return (
      <div className={`flex h-[400px] items-center justify-center ${isDark ? "bg-[#0f0f0f]" : "bg-white"}`}>
        <Loader2 className="h-8 w-8 animate-spin text-[#E8D1AB]" />
      </div>
    );
  }

  return (
    <div className={`quote-editor-theme min-h-screen transition-colors duration-200 ${isDark ? "quote-editor-theme-dark bg-[#0f0f0f] text-white" : "quote-editor-theme-light bg-[#F4F5F7] text-black"}`}>
      {/* Top Header Navigation Panel */}

      <Topbar
        pathname={pathname}
        actions={
          <>
            <Select
              value={selectedVersionId}
              onValueChange={(val) => {
                setSelectedVersionId(val);
                const selectedVersion = versions.find(v => String(v.version_number) === val);
                if (selectedVersion) {
                  const versionNumber = selectedVersion.version_number;
                  if (versionNumber) {
                    fetchQuoteData(quoteId, String(versionNumber));
                  }
                }
              }}
            >
              <SelectTrigger className={`h-10 w-[140px] gap-2 border rounded-xl focus:border-[#A78857] ${isDark
                ? "border-[#4A4A4A] bg-[#1A1A1A] text-white hover:bg-[#252525]"
                : "border-[#D7D7D7] bg-white text-black hover:bg-[#FAFAFA]"
                }`}>
                <SelectValue placeholder="All Versions" />
              </SelectTrigger>
              <SelectContent className={`border ${isDark ? "border-[#2E2E2E] bg-[#1A1A1A] text-white" : "border-[#D7D7D7] bg-white text-black"
                }`}>
                {versions.map((v) => (
                  <SelectItem
                    key={v.sales_quote_version_id || v.id}
                    value={String(v.version_number)}
                    className={`cursor-pointer ${isDark ? "hover:bg-white/5 focus:bg-white/5" : "hover:bg-black/5 focus:bg-black/5"}`}
                  >
                    Version {v.version_number} {v.is_current ? "(Current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => setIsPreviewOpen(true)}
              className="h-10 bg-[#E8D1AB] px-6 font-semibold text-[#101010] hover:opacity-90 rounded-xl"
            >
              Preview Quote
            </Button>
          </>
        }
      />

      {/* <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? "border-[#2E2E2E] bg-[#111111]" : "border-[#D7D7D7] bg-white"
        }`}>
        <div className="flex items-center gap-4">
          <h1 className={`text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>Quote Summary</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedVersionId}
            onValueChange={(val) => {
              setSelectedVersionId(val);
              const selectedVersion = versions.find(v => String(v.version_number) === val);
              if (selectedVersion) {
                const versionNumber = selectedVersion.version_number;
                if (versionNumber) {
                  fetchQuoteData(quoteId, String(versionNumber));
                }
              }
            }}
          >
            <SelectTrigger className={`h-10 w-[140px] gap-2 border rounded-xl focus:border-[#A78857] ${isDark
              ? "border-[#4A4A4A] bg-[#1A1A1A] text-white hover:bg-[#252525]"
              : "border-[#D7D7D7] bg-white text-black hover:bg-[#FAFAFA]"
              }`}>
              <SelectValue placeholder="All Versions" />
            </SelectTrigger>
            <SelectContent className={`border ${isDark ? "border-[#2E2E2E] bg-[#1A1A1A] text-white" : "border-[#D7D7D7] bg-white text-black"
              }`}>
              {versions.map((v) => (
                <SelectItem
                  key={v.sales_quote_version_id || v.id}
                  value={String(v.version_number)}
                  className={`cursor-pointer ${isDark ? "hover:bg-white/5 focus:bg-white/5" : "hover:bg-black/5 focus:bg-black/5"}`}
                >
                  Version {v.version_number} {v.is_current ? "(Current)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => setIsPreviewOpen(true)}
            className="h-10 bg-[#E8D1AB] px-6 font-semibold text-[#101010] hover:opacity-90 rounded-xl"
          >
            Preview Quote
          </Button>
        </div>
      </div> */}

      <div className="max-w-[1200px] mx-auto px-6 py-8 pb-40 lg:pb-12">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/quotes")}
          className={`mb-6 h-9 gap-2 pl-0 bg-transparent hover:bg-transparent group ${isDark ? "text-[#96969E] hover:text-white" : "text-[#727272] hover:text-black"}`}
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          Back
        </Button>

        {/* Global Summary Content Base */}
        <div className={`rounded-[24px] border p-8 shadow-2xl ${isDark ? "bg-[#111111] border-[#2E2E2E]" : "bg-white border-[#D7D7D7]"
          }`}>

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className={`text-lg lg:text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-black"}`}>Quote Summary</h2>
              <p className={isDark ? "text-[#96969E] text-xs lg:text-sm" : "text-[#727272] text-xs lg:text-sm"}>Real-time pricing breakdown</p>
            </div>
            <div className={`rounded-full px-3 lg:px-6 py-2 border ${isDark ? "bg-[#E8D1AB]/10 border-[#E8D1AB]/20" : "bg-[#FFF7E6] border-[#E8D1AB]"}`}>
              <span className={`text-xs lg:text-sm font-bold ${isDark ? "text-[#E8D1AB]" : "text-[#B38F43]"}`}>
                Quote Version {currentVersionNumber}
              </span>
            </div>
          </div>

          {/* Separation Accent Line */}
          <div className={`w-full h-[1px] border-t border-dashed mb-10 ${isDark ? "border-white/20" : "border-[#D7D7D7]"
            }`} />

          {/* Client Info */}
          <div className="flex items-center gap-4 mb-5 lg:mb-10">
            <div className={`flex h-12 w-12 lg:h-16 lg:w-16 items-center justify-center rounded-full text-lg lg:text-xl font-medium ${isDark ? "bg-[#2A2A2A] text-[#96969E]" : "bg-[#F4F5F7] text-[#727272]"}`}>
              {getInitials(clientName)}
            </div>
            <span className={`text-xl lg:text-3xl font-semibold ${isDark ? "text-white" : "text-black"}`}>{clientName}</span>
          </div>

          {/* Sections */}
          <div className="space-y-4 lg:space-y-8">
            {/* Services */}
            {lineItems.services.length > 0 && (
              <div className={`rounded-xl lg:rounded-2xl border overflow-hidden ${isDark ? "bg-[#171717] border-[#2E2E2E]" : "bg-[#FAFAFA] border-[#D7D7D7]"
                }`}>
                <div className={`px-4 lg:px-8 py-3 lg:py-6 flex items-center justify-between border-b ${isDark ? "border-white/10" : "border-[#D7D7D7]"}`}>
                  <span className={`lg:text-lg font-medium ${isDark ? "text-[#96969E]" : "text-[#000000AD]"}`}>Service Include</span>
                  <span className={`text-lg lg:text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
                    {formatQuoteCurrency(lineItems.services.reduce((s, i) => s + (Number(i.amount) || 0), 0))}
                  </span>
                </div>
                <div className="px-4 lg:px-6 py-3 lg:py-5 space-y-4">
                  {lineItems.services.map((item: any) => (
                    <div
                      key={item.id || item.line_item_id || item.name}
                      className={`rounded-xl lg:rounded-2xl border p-4 flex items-center justify-between ${isDark ? "bg-[#222222]/50 border-white/5" : "bg-white border-[#E5E7EB]"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8D1AB] text-black">
                          <Video size={24} fill="currentColor" />
                        </div>
                        <div className="flex flex-col">
                          <span className={`lg:text-lg font-medium ${isDark ? "text-white" : "text-black"}`}>
                            {item.name}
                            {item.subtitle && (
                              <span className={`ml-2 font-normal text-sm lg:text-base ${isDark ? "text-[#96969E]" : "text-[#727272]"}`}> - ({item.subtitle})</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <span className={`lg:text-lg font-medium ${isDark ? "text-[#96969E]" : "text-[#9C9696]"}`}>
                        {formatQuoteCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supplemental Package Extensions */}
            {lineItems.addons.length > 0 && (
              <div className={`rounded-xl lg:rounded-2xl border overflow-hidden ${isDark ? "bg-[#171717] border-[#2E2E2E]" : "bg-[#FAFAFA] border-[#D7D7D7]"}`}>
                <div className={`px-4 lg:px-8 py-3 lg:py-6 flex items-center justify-between border-b ${isDark ? "border-white/10" : "border-[#D7D7D7]"}`}>
                  <span className={`lg:text-lg font-medium ${isDark ? "text-[#96969E]" : "text-[#727272]"}`}>Add-ons</span>
                  <span className={`text-lg lg:text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
                    {formatQuoteCurrency(lineItems.addons.reduce((s, i) => s + (Number(i.amount) || 0), 0))}
                  </span>
                </div>
                <div className="px-4 lg:px-8 py-3 lg:py-6 space-y-4">
                  {lineItems.addons.map((item: any) => (
                    <div key={item.id || item.line_item_id || item.name} className="flex items-center justify-between">
                      <span className={`lg:text-lg${isDark ? "text-white" : "text-black"}`}>{item.name}</span>
                      <span className={`lg:text-lg${isDark ? "text-[#96969E]" : "text-[#727272]"}`}>{formatQuoteCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logistics Breakdown Block Container */}
            {lineItems.logistics.length > 0 && (
              <div className={`rounded-xl lg:rounded-2xl border overflow-hidden ${isDark ? "bg-[#171717] border-[#2E2E2E]" : "bg-[#FAFAFA] border-[#D7D7D7]"}`}>
                <div className={`px-4 lg:px-8 py-3 lg:py-6 flex items-center justify-between border-b ${isDark ? "border-white/10" : "border-[#D7D7D7]"}`}>
                  <span className={`lg:text-lg font-medium ${isDark ? "text-[#96969E]" : "text-[#727272]"}`}>Logistics</span>
                  <span className={`text-lg lg:text-xl font-bold ${isDark ? "text-white" : "text-black"}`}>
                    {formatQuoteCurrency(lineItems.logistics.reduce((s, i) => s + (Number(i.amount) || 0), 0))}
                  </span>
                </div>
                <div className="px-4 lg:px-8 py-3 lg:py-6 space-y-4">
                  {lineItems.logistics.map((item: any) => (
                    <div key={item.id || item.line_item_id || item.name} className="flex items-center justify-between">
                      <span className={`lg:text-lg ${isDark ? "text-white" : "text-black"}`}>{item.name}</span>
                      <span className={`lg:text-lg ${isDark ? "text-[#96969E]" : "text-[#727272]"}`}>{formatQuoteCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Ledger Aggregations Panel */}
            <div className={`rounded-xl lg:rounded-2xl border p-4 lg:p-8 space-y-5 ${isDark ? "bg-[#171717] border-[#2E2E2E]" : "bg-[#FAFAFA] border-[#D7D7D7]"
              }`}>
              <div className="flex items-center justify-between lg:text-lg">
                <span className={`font-medium ${isDark ? "text-[#96969E]" : "text-[#727272]"}`}>Subtotal</span>
                <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{formatQuoteCurrency(subtotalAmount)}</span>
              </div>
              {hasDiscount && (
                <div className="flex items-center justify-between lg:text-lg">
                  <span className={`font-medium ${isDark ? "text-[#96969E]" : "text-[#727272]"}`}>
                    Discount{discountType.includes("percent") ? ` (${discountValue}%)` : ""}
                  </span>
                  <span className="font-medium text-[#FF8A8A]">- {formatQuoteCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between lg:text-lg">
                <span className={`font-medium ${isDark ? "text-[#96969E]" : "text-[#727272]"}`}>Sales Tax ({taxRate}%)</span>
                <span className={`font-medium ${isDark ? "text-white" : "text-black"}`}>{formatQuoteCurrency(taxAmount)}</span>
              </div>
              <div className="mt-4 rounded-[16px] bg-[#E8D1AB] p-6 flex items-center justify-between">
                <span className="text-lg lg:text-xl font-bold text-black">Final Total</span>
                <span className="text-lg lg:text-[32px] font-bold text-black">
                  {formatQuoteCurrency(quote?.final_total || quote?.total_amount || quote?.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Mobile buttons */}
      <div className={`lg:hidden fixed flex flex-col gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] bg-[#0f0f0f]`}>
        <Select
          value={selectedVersionId}
          onValueChange={(val) => {
            setSelectedVersionId(val);
            const selectedVersion = versions.find(v => String(v.version_number) === val);
            if (selectedVersion) {
              const versionNumber = selectedVersion.version_number;
              if (versionNumber) {
                fetchQuoteData(quoteId, String(versionNumber));
              }
            }
          }}
        >
          <SelectTrigger className={`h-10 w-full gap-2 border rounded-xl focus:border-[#A78857] ${isDark
            ? "border-[#4A4A4A] bg-[#1A1A1A] text-white hover:bg-[#252525]"
            : "border-[#D7D7D7] bg-white text-black hover:bg-[#FAFAFA]"
            }`}>
            <SelectValue placeholder="All Versions" />
          </SelectTrigger>
          <SelectContent className={`border ${isDark ? "border-[#2E2E2E] bg-[#1A1A1A] text-white" : "border-[#D7D7D7] bg-white text-black"
            }`}>
            {versions.map((v) => (
              <SelectItem
                key={v.sales_quote_version_id || v.id}
                value={String(v.version_number)}
                className={`cursor-pointer ${isDark ? "hover:bg-white/5 focus:bg-white/5" : "hover:bg-black/5 focus:bg-black/5"}`}
              >
                Version {v.version_number} {v.is_current ? "(Current)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={() => setIsPreviewOpen(true)}
          className="h-10 bg-[#E8D1AB] px-6 font-semibold text-[#101010] hover:opacity-90 rounded-xl"
        >
          Preview Quote
        </Button>
      </div>

      <QuotePreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        quote={quote}
        quoteId={quoteId}
      />
    </div>
  );
}