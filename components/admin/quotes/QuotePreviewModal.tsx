"use client";

import React from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  Copy,
  Loader2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SalesQuoteDetailData, SalesQuoteDetailLineItem } from "@/lib/api";
import { unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";

type QuotePreviewModalProps = {
  open: boolean;
  onClose: () => void;
  quote: SalesQuoteDetailData | null;
  quoteId?: string | null;
  isLoading?: boolean;
};

type PreviewLineItem = {
  id: string;
  name: string;
  section: "service" | "addon" | "logistics" | "custom";
  quantity: number;
  duration: number;
  crew: number;
  amount: number;
};

const getText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const findNumber = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value?: string | null) => {
  if (!value) {
    return "N/A";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const resolveSection = (item: SalesQuoteDetailLineItem): PreviewLineItem["section"] => {
  const rawSection = getText(
    item.section_type,
    item.category_slug,
    item.category_name,
    item.type
  ).toLowerCase();

  if (rawSection.includes("addon")) {
    return "addon";
  }

  if (
    rawSection.includes("logistic") ||
    rawSection.includes("travel") ||
    rawSection.includes("equipment") ||
    rawSection.includes("permit")
  ) {
    return "logistics";
  }

  if (rawSection.includes("custom") || rawSection.includes("line")) {
    return "custom";
  }

  return "service";
};

const extractLineItems = (quote: SalesQuoteDetailData) => {
  if (Array.isArray(quote.line_items)) {
    return quote.line_items;
  }

  if (Array.isArray(quote.items)) {
    return quote.items;
  }

  if (Array.isArray(quote.quote_items)) {
    return quote.quote_items;
  }

  if (Array.isArray(quote.rows)) {
    return quote.rows;
  }

  if (Array.isArray(quote.data)) {
    return quote.data as SalesQuoteDetailLineItem[];
  }

  return [];
};

const normalizeLineItems = (quote: SalesQuoteDetailData): PreviewLineItem[] =>
  extractLineItems(quote).map((item, index) => {
    const section = resolveSection(item);
    const quantity = Math.max(1, findNumber(item.quantity) ?? 1);
    const duration = Math.max(
      0,
      findNumber(item.duration_hours, item.duration, item.hours) ?? 0
    );
    const crew = Math.max(0, findNumber(item.crew_size, item.crew, item.crew_count) ?? 0);
    const unitRate =
      findNumber(
        item.unit_rate,
        item.estimated_pricing,
        item.rate,
        item.effective_rate,
        item.price
      ) ?? 0;

    let amount = findNumber(item.line_total, item.total_amount, item.amount) ?? unitRate;

    if (findNumber(item.line_total, item.total_amount, item.amount) === undefined) {
      if (section === "service") {
        amount = quantity * (duration > 0 ? duration : 1) * (crew > 0 ? crew : 1) * unitRate;
      } else {
        amount = quantity * unitRate;
      }
    }

    return {
      id: String(item.line_item_id ?? item.catalog_item_id ?? item.item_id ?? item.id ?? index),
      name: getText(item.item_name, item.name, item.label, "Line Item"),
      section,
      quantity,
      duration,
      crew,
      amount,
    };
  });

const normalizeTerms = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    const terms = value
      .split(/\r?\n|•/)
      .map((item) => item.trim())
      .filter(Boolean);

    return terms.length > 0 ? terms : [value.trim()];
  }

  return ["50% deposit required before production starts."];
};

const PreviewListSection = ({
  title,
  items,
}: {
  title: string;
  items: PreviewLineItem[];
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#71717B] lg:text-sm">
        {title}
      </p>

      <div className="space-y-3 rounded-2xl border border-white/10 bg-[#131313] p-4 lg:p-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid gap-2 text-xs text-white md:grid-cols-[minmax(0,2fr)_80px_100px_80px_140px] md:items-center lg:text-sm"
          >
            <p className="font-medium text-white">{item.name}</p>
            <p className="md:text-center">{item.quantity}</p>
            <p className="md:text-center">{item.duration > 0 ? `${item.duration} Hours` : "-"}</p>
            <p className="md:text-center">{item.crew > 0 ? item.crew : "-"}</p>
            <p className="font-medium text-[#E8D1AB] md:text-right">{formatCurrency(item.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function QuotePreviewModal({
  open,
  onClose,
  quote,
  quoteId,
  isLoading = false,
}: QuotePreviewModalProps) {
  if (!open) {
    return null;
  }

  const quoteData = unwrapSalesQuoteDetail(quote);
  const lineItems = quoteData ? normalizeLineItems(quoteData) : [];
  const serviceItems = lineItems.filter((item) => item.section === "service");
  const addonItems = lineItems.filter((item) => item.section === "addon");
  const logisticsItems = lineItems.filter((item) => item.section === "logistics");
  const customItems = lineItems.filter((item) => item.section === "custom");
  const lineItemsSubtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

  const subtotal = quoteData ? findNumber(quoteData.subtotal) ?? lineItemsSubtotal : 0;
  const taxRate = quoteData ? findNumber(quoteData.tax_rate) ?? 0 : 0;
  const taxType = quoteData ? getText(quoteData.tax_type, "Sales Tax") : "Sales Tax";
  const taxAmount = quoteData
    ? findNumber(quoteData.tax_amount, quoteData.sales_tax) ?? subtotal * (taxRate / 100)
    : 0;
  const amountAfterTax = quoteData
    ? findNumber(quoteData.amount_after_tax, quoteData.total_after_tax) ?? subtotal + taxAmount
    : 0;
  const discountValue = quoteData ? findNumber(quoteData.discount_value) ?? 0 : 0;
  const discountType = quoteData ? getText(quoteData.discount_type).toLowerCase() : "";
  const discountAmount = quoteData
    ? findNumber(quoteData.discount_amount) ??
      (discountType.includes("percent")
        ? amountAfterTax * (discountValue / 100)
        : discountValue)
    : 0;
  const finalTotal = quoteData
    ? findNumber(
        quoteData.final_total,
        quoteData.total_amount,
        quoteData.amount_after_discount
      ) ?? Math.max(amountAfterTax - discountAmount, 0)
    : 0;

  const resolvedQuoteId = String(quoteData?.quote_id ?? quoteData?.id ?? quoteId ?? "");
  const quoteNumber = getText(quoteData?.quote_number) || (resolvedQuoteId ? `Q-${resolvedQuoteId}` : "Draft Quote");
  const clientName = getText(quoteData?.client_name, "Client");
  const clientEmail = getText(quoteData?.client_email, quoteData?.guest_email, "N/A");
  const clientPhone = getText(quoteData?.client_phone, "N/A");
  const clientAddress = getText(
    quoteData?.client_address,
    quoteData?.address,
    quoteData?.location,
    "Address not available"
  );
  const projectDescription = getText(
    quoteData?.project_description,
    "Project description not available"
  );
  const terms = normalizeTerms(quoteData?.terms_conditions);
  const handleCopy = async () => {
    if (!resolvedQuoteId || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(resolvedQuoteId);
  };

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full w-full max-w-[1560px] flex-col overflow-hidden bg-[#111111] shadow-2xl lg:my-5 lg:h-[calc(100%-2.5rem)] lg:rounded-[28px] lg:border lg:border-white/10"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-11 rounded-xl border border-white/10 bg-[#171717] px-4 text-white hover:bg-[#1F1F1F]"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>

          <div className="hidden items-center gap-3 md:flex">
            <Button
              type="button"
              onClick={() => {
                void handleCopy();
              }}
              className="bg-[#202020] text-white hover:bg-[#202020]/70 border border-[#FFFFFF33]"
            >
              <Copy />
              Copy Link
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.print();
                }
              }}
              className="bg-[#202020] text-white hover:bg-[#202020]/70 border border-[#FFFFFF33]"
            >
              <ArrowDownToLine />
              Download PDF
            </Button>
            <Button
              type="button"
              className="bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
            >
              <Send />
              Send Quote
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 pt-6 lg:px-9 lg:pb-12 lg:pt-8">
          {isLoading ? (
            <div className="flex min-h-[420px] items-center justify-center text-[#CFCFD3]">
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Loading quote preview...
            </div>
          ) : !quoteData ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-white/10 bg-[#151515] px-6 text-center">
              <p className="text-lg font-semibold text-white">Preview data unavailable</p>
              <p className="text-sm text-[#8B8B90]">
                The quote was saved, but the preview response could not be loaded.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 lg:mb-9">
                <h2 className="text-[18px] font-medium text-white lg:text-[19px]">Quote Preview</h2>
                <p className="text-[14px] text-[#A1A1AA]">Review before sending to client</p>
              </div>

              <div className="rounded-[18px] border border-[#3D3D3D] bg-[#171717]">
                <div className="space-y-6 p-4 lg:space-y-8 lg:p-9">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4 lg:space-y-5">
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="flex h-[68px] w-[68px] items-center justify-center rounded-xl bg-[#E8D1AB] text-2xl font-semibold text-[#171717]">
                          BA
                        </div>
                        <div>
                          <p className="text-xl font-bold text-[#E8D1AB] lg:text-2xl">Beige AI</p>
                          <p className="text-xs text-white lg:text-sm">Production Marketplace</p>
                        </div>
                      </div>

                      <div className="text-xs text-white lg:text-sm">
                        <p>{clientAddress}</p>
                        <p>{clientEmail}</p>
                        <p>{clientPhone}</p>
                      </div>
                    </div>

                    <div className="text-left lg:text-right">
                      <h2 className="text-3xl font-bold text-white lg:text-5xl">QUOTATION</h2>
                      <div className="mt-3 text-xs text-[#BDBDBD] lg:text-sm">
                        <p>Quote #: {quoteNumber}</p>
                        <p>Date: {formatDate(quoteData.created_at)}</p>
                        <p>Valid Until: {formatDate(quoteData.valid_until ?? quoteData.expires_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#FFFFFF33]" />

                  <div className="space-y-4">
                    <p className="text-[10px] font-semibold uppercase text-[#71717B] lg:text-sm">
                      Bill To
                    </p>
                    <div className="text-xs text-white lg:text-sm">
                      <p className="text-base font-semibold text-white lg:text-lg">{clientName}</p>
                      <p>{clientAddress}</p>
                      <p>{clientEmail}</p>
                      <p>{clientPhone}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#FAFAFA] p-4 text-xs lg:text-sm">
                    <p className="font-semibold uppercase text-[#71717B]">Project Description</p>
                    <p className="mt-2 text-[#18181B]">{projectDescription}</p>
                  </div>

                  <div className="border-t border-[#FFFFFF33]" />

                  <div className="space-y-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#71717B] lg:text-sm">
                      Service Include
                    </p>
                    <div className="hidden grid-cols-[minmax(0,2fr)_80px_100px_80px_140px] border-b border-[#FFFFFF33] pb-2 text-xs font-medium text-white md:grid lg:text-sm">
                      <p>Description</p>
                      <p className="text-center">Qty</p>
                      <p className="text-center">Duration</p>
                      <p className="text-center">Crew</p>
                      <p className="text-right">Amount</p>
                    </div>
                    <div className="space-y-3">
                      {serviceItems.map((item) => (
                        <div
                          key={item.id}
                          className="grid gap-2 text-xs text-[#FFFFFFCC] md:grid-cols-[minmax(0,2fr)_80px_100px_80px_140px] md:items-center lg:text-base"
                        >
                          <p className="font-medium text-white">{item.name}</p>
                          <p className="md:text-center">{item.quantity}</p>
                          <p className="md:text-center">{item.duration > 0 ? `${item.duration} Hours` : "-"}</p>
                          <p className="md:text-center">{item.crew > 0 ? item.crew : "-"}</p>
                          <p className="font-medium md:text-right">{formatCurrency(item.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[#FFFFFF1A]" />

                  <PreviewListSection title="Add-ons" items={addonItems} />
                  <PreviewListSection title="Logistics" items={logisticsItems} />
                  <PreviewListSection title="Custom Items" items={customItems} />

                  <div className="rounded-xl bg-[#E8D1AB] p-4 lg:p-6">
                    <div className="space-y-2 text-sm text-black lg:text-base">
                      <div className="flex items-center justify-between gap-4">
                        <span>Subtotal</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>{taxType} ({taxRate}%)</span>
                        <span className="font-medium">{formatCurrency(taxAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Amount After Tax</span>
                        <span className="font-medium">{formatCurrency(amountAfterTax)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Discount Applied</span>
                        <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-xl bg-[#171717] p-4 text-white">
                      <p className="text-base font-bold lg:text-xl">Final Total</p>
                      <p className="text-xl font-bold text-[#E8D1AB] lg:text-2xl">
                        {formatCurrency(finalTotal)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[#FFFFFF33]" />

                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold uppercase text-white lg:text-sm">
                      Terms & Conditions
                    </p>
                    <ul className="list-disc space-y-2 pl-5 text-xs text-[#AAAAAA] lg:text-sm">
                      {terms.map((term, index) => (
                        <li key={`${term}-${index}`}>{term}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-[#FFFFFF33]" />

                  <div className="p-2 text-center text-xs text-white lg:text-sm">
                    Thank you for your business! For questions, contact Beige AI support.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
