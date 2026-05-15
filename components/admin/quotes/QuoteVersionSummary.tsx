"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

type QuoteVersionSummaryProps = {
  quoteId: string;
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

export default function QuoteVersionSummary({ quoteId }: QuoteVersionSummaryProps) {
  const router = useRouter();
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
    if (!quoteId) {
      return;
    }

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
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E8D1AB]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Topbar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#111111] px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-white">Quote Summary</h1>
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
            <SelectTrigger className="h-10 w-[140px] gap-2 border border-white/10 bg-[#1A1A1A] text-white hover:bg-[#252525]">
              <SelectValue placeholder="All Version" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#1A1A1A] text-white">
              {versions.map((v) => (
                <SelectItem 
                  key={v.sales_quote_version_id || v.id} 
                  value={String(v.version_number)}
                  className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
                >
                  Version {v.version_number} {v.is_current ? "(Current)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={() => setIsPreviewOpen(true)}
            className="h-10 bg-[#E8D1AB] px-6 font-semibold text-black hover:bg-[#E8D1AB]/90"
          >
            Preview Quote
          </Button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6 h-9 gap-2 pl-0 text-[#8F8F95] hover:bg-transparent hover:text-white group"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          Back
        </Button>

        {/* Summary Container */}
        <div className="rounded-[24px] bg-[#111111] border border-white/10 p-8 shadow-2xl">
          
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-[24px] font-bold text-white mb-1">Quote Summary</h2>
              <p className="text-[#8F8F95] text-[14px]">Real-time pricing breakdown</p>
            </div>
            <div className="rounded-full bg-[#E8D1AB]/10 px-6 py-2 border border-[#E8D1AB]/20">
              <span className="text-[14px] font-bold text-[#E8D1AB]">
                Quote Version {currentVersionNumber}
              </span>
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="w-full h-[1px] border-t border-dashed border-white/20 mb-10" />

          {/* Client Info */}
          <div className="flex items-center gap-4 mb-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2A2A2A] text-xl font-medium text-[#8F8F95]">
              {getInitials(clientName)}
            </div>
            <span className="text-[28px] font-semibold text-white">{clientName}</span>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {/* Services */}
            {lineItems.services.length > 0 && (
              <div className="rounded-[20px] bg-[#171717] border border-white/5 overflow-hidden">
                <div className="px-8 py-6 flex items-center justify-between border-b border-white/10">
                  <span className="text-[18px] font-medium text-[#8F8F95]">Service Include</span>
                  <span className="text-[20px] font-bold text-white">{formatQuoteCurrency(lineItems.services.reduce((s, i) => s + (Number(i.amount) || 0), 0))}</span>
                </div>
                <div className="px-6 py-5 space-y-4">
                  {lineItems.services.map((item: any) => (
                    <div key={item.id || item.line_item_id || item.name} className="rounded-[16px] bg-[#222222]/50 border border-white/5 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8D1AB] text-black">
                          <Video size={24} fill="currentColor" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[17px] font-medium text-white">
                            {item.name}
                            {item.subtitle && (
                              <span className="text-[#8F8F95] ml-2 font-normal"> - ({item.subtitle})</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <span className="text-[17px] font-medium text-[#8F8F95]">
                        {formatQuoteCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons */}
            {lineItems.addons.length > 0 && (
              <div className="rounded-[20px] bg-[#171717] border border-white/5 overflow-hidden">
                <div className="px-8 py-6 flex items-center justify-between border-b border-white/10">
                  <span className="text-[18px] font-medium text-[#8F8F95]">Add-ons</span>
                  <span className="text-[20px] font-bold text-white">{formatQuoteCurrency(lineItems.addons.reduce((s, i) => s + (Number(i.amount) || 0), 0))}</span>
                </div>
                <div className="px-8 py-6 space-y-6">
                  {lineItems.addons.map((item: any) => (
                    <div key={item.id || item.line_item_id || item.name} className="flex items-center justify-between">
                      <span className="text-[18px] text-white">{item.name}</span>
                      <span className="text-[18px] text-[#8F8F95]">{formatQuoteCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logistics */}
            {lineItems.logistics.length > 0 && (
              <div className="rounded-[20px] bg-[#171717] border border-white/5 overflow-hidden">
                <div className="px-8 py-6 flex items-center justify-between border-b border-white/10">
                  <span className="text-[18px] font-medium text-[#8F8F95]">Logistics</span>
                  <span className="text-[20px] font-bold text-white">{formatQuoteCurrency(lineItems.logistics.reduce((s, i) => s + (Number(i.amount) || 0), 0))}</span>
                </div>
                <div className="px-8 py-6 space-y-6">
                  {lineItems.logistics.map((item: any) => (
                    <div key={item.id || item.line_item_id || item.name} className="flex items-center justify-between">
                      <span className="text-[18px] text-white">{item.name}</span>
                      <span className="text-[18px] text-[#8F8F95]">{formatQuoteCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="rounded-[20px] bg-[#171717] border border-white/5 p-8 space-y-5">
              <div className="flex items-center justify-between text-[18px]">
                <span className="text-[#8F8F95] font-medium">Subtotal</span>
                <span className="text-white font-medium">{formatQuoteCurrency(subtotalAmount)}</span>
              </div>
              {hasDiscount && (
                <div className="flex items-center justify-between text-[18px]">
                  <span className="text-[#8F8F95] font-medium">
                    Discount{discountType.includes("percent") ? ` (${discountValue}%)` : ""}
                  </span>
                  <span className="font-medium text-[#FF8A8A]">- {formatQuoteCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-[18px]">
                <span className="text-[#8F8F95] font-medium">Sales Tax ({taxRate}%)</span>
                <span className="text-white font-medium">{formatQuoteCurrency(taxAmount)}</span>
              </div>
              <div className="mt-4 rounded-[16px] bg-[#E8D1AB] p-6 flex items-center justify-between">
                <span className="text-[20px] font-bold text-black">Final Total</span>
                <span className="text-[32px] font-bold text-black">{formatQuoteCurrency(quote?.final_total || quote?.total_amount || quote?.total)}</span>
              </div>
            </div>
          </div>
        </div>
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
