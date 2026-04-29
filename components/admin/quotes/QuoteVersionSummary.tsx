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
import { formatQuoteCurrency, formatQuoteItemDisplayName } from "@/lib/quoteDetail";
import { unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";
import QuotePreviewModal from "@/components/quotes/QuotePreviewModal";
import { getInitials } from "@/lib/utils";

type QuoteVersionSummaryProps = {
  quoteId: string;
};

export default function QuoteVersionSummary({ quoteId }: QuoteVersionSummaryProps) {
  const router = useRouter();
  const [quote, setQuote] = useState<SalesQuoteDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [versions, setVersions] = useState<any[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fetchQuoteData = async (id: string, versionId?: string) => {
    setIsLoading(true);
    try {
      const response = versionId 
        ? await salesApi.getQuoteVersionDetail(id, versionId)
        : await salesApi.getQuoteDetail(id);
      
      if (response?.success && response.data) {
        const unwrappedQuote = unwrapSalesQuoteDetail(response.data);
        if (unwrappedQuote) {
          // Inject version info if it exists as a sibling to quote in response.data
          const versionInfo = (response.data as any).version;
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

  const fetchVersions = async () => {
    try {
      const response = await salesApi.getQuoteVersions(quoteId);
      if (response?.success && Array.isArray(response.data)) {
        setVersions(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch quote versions:", error);
    }
  };

  useEffect(() => {
    if (quoteId) {
      fetchQuoteData(quoteId);
      fetchVersions();
    }
  }, [quoteId]);

  const currentVersionNumber = quote?.metadata?.version_number || quote?.version_number || 1;
  const clientName = quote?.client_name || quote?.guest_email || "Client";
  
  const lineItems = useMemo(() => {
    const items = quote?.line_items || quote?.items || quote?.quote_items || [];
    return {
      services: items.filter((it: any) => it.section_type === "service" || it.section === "service"),
      addons: items.filter((it: any) => it.section_type === "addon" || it.section === "addon"),
      logistics: items.filter((it: any) => it.section_type === "logistics" || it.section === "logistics"),
      custom: items.filter((it: any) => it.section_type === "custom" || it.section === "custom"),
    };
  }, [quote]);

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
            value={String(currentVersionNumber)}
            onValueChange={(val) => {
              const selectedVersion = versions.find(v => String(v.version_number) === val);
              if (selectedVersion) {
                const verId = selectedVersion.sales_quote_version_id || selectedVersion.id;
                if (verId) {
                  fetchQuoteData(quoteId, verId);
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
                  <span className="text-[20px] font-bold text-white">{formatQuoteCurrency(lineItems.services.reduce((s, i) => s + (Number(i.line_total) || 0), 0))}</span>
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
                            {formatQuoteItemDisplayName(item.item_name || item.name)}
                            {item.subtitle && (
                              <span className="text-[#8F8F95] ml-2 font-normal"> - ({item.subtitle})</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <span className="text-[17px] font-medium text-[#8F8F95]">
                        {formatQuoteCurrency(item.line_total)}
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
                  <span className="text-[20px] font-bold text-white">{formatQuoteCurrency(lineItems.addons.reduce((s, i) => s + (Number(i.line_total) || 0), 0))}</span>
                </div>
                <div className="px-8 py-6 space-y-6">
                  {lineItems.addons.map((item: any) => (
                    <div key={item.id || item.line_item_id || item.name} className="flex items-center justify-between">
                      <span className="text-[18px] text-white">{formatQuoteItemDisplayName(item.item_name || item.name)}</span>
                      <span className="text-[18px] text-[#8F8F95]">{formatQuoteCurrency(item.line_total)}</span>
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
                  <span className="text-[20px] font-bold text-white">{formatQuoteCurrency(lineItems.logistics.reduce((s, i) => s + (Number(i.line_total) || 0), 0))}</span>
                </div>
                <div className="px-8 py-6 space-y-6">
                  {lineItems.logistics.map((item: any) => (
                    <div key={item.id || item.line_item_id || item.name} className="flex items-center justify-between">
                      <span className="text-[18px] text-white">{formatQuoteItemDisplayName(item.item_name || item.name)}</span>
                      <span className="text-[18px] text-[#8F8F95]">{formatQuoteCurrency(item.line_total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="rounded-[20px] bg-[#171717] border border-white/5 p-8 space-y-5">
              <div className="flex items-center justify-between text-[18px]">
                <span className="text-[#8F8F95] font-medium">Subtotal</span>
                <span className="text-white font-medium">{formatQuoteCurrency(quote?.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[18px]">
                <span className="text-[#8F8F95] font-medium">Sales Tax ({quote?.tax_rate || 0}%)</span>
                <span className="text-white font-medium">{formatQuoteCurrency(quote?.tax_amount)}</span>
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
