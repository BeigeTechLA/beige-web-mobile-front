"use client";

import React from "react";

import type { SalesQuoteDetailData } from "@/lib/api";
import {
  formatQuoteCurrency,
  formatQuoteDate,
  getQuoteNumber,
  getQuoteDisplayShootTypeLabel,
  getQuoteText,
  normalizeQuoteLineItems,
  normalizeQuoteTerms,
  type NormalizedQuoteLineItem,
} from "@/lib/quoteDetail";
import { unwrapSalesQuoteDetail } from "@/lib/salesQuotePreview";
import { getDefaultQuoteTerms, isLegacyDefaultQuoteTerms } from "@/lib/quoteTerms";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

type QuotePreviewDocumentProps = {
  quote: SalesQuoteDetailData;
  quoteId?: string | null;
};

const COMPANY_PROFILE = {
  name: "Beige AI",
  subtitle: "",
  addressLines: ["9200 Sunset Blvd. #215", "West Hollywood, CA 90069"],
  email: "sales@beigecorporation.io",
  phone: "323-826-7230",
};

const formatCount = (value: number) => String(Math.max(0, value)).padStart(2, "0");

const formatDuration = (value: number) => {
  if (value <= 0) {
    return "-";
  }

  return `${value} ${value === 1 ? "Hour" : "Hours"}`;
};

const BeigeMark = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" viewBox="0 0 20 22" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.32217 0.0321608C2.83197 0.321635 0.819599 2.63743 1.00826 6.01462C1.07115 7.68713 1.7629 9.00585 3.02063 9.90643L3.33506 10.1316L2.89486 10.3567C1.10259 11.2895 0.222177 12.6082 0.0335174 14.6667C-0.280915 18.1082 1.63712 20.9708 4.93867 21.7427C6.03918 22 6.13351 22 11.6361 22H16.4155L16.0381 21.7427C15.1263 21.0994 14.3088 20.231 13.7428 19.2982L13.5541 19.0088H10.4098C7.29692 19.0088 6.73094 19.0088 6.1964 18.8801C4.37269 18.5263 3.33506 17.2719 3.33506 15.3421C3.33506 13.4123 4.37269 12.4152 6.57372 12.0614C6.88815 12.0292 7.29692 11.9971 9.15207 11.9971H11.3217L11.2902 11.3538C11.2588 10.7427 11.3217 9.52047 11.3531 9.23099L11.3845 9.10234H9.90671C7.64279 9.10234 6.88815 9.03801 6.1964 8.81286C5.033 8.39474 4.40413 7.55848 4.37269 6.2076C4.3098 4.63158 4.97011 3.60234 6.32217 3.21637C7.04537 3.02339 7.04537 3.02339 10.2526 2.99122H13.1768V7.20468C13.1768 11.3538 13.1768 12.0936 13.2711 13.0585C13.7113 17.0146 15.315 19.7164 18.082 21.1637C18.3021 21.2924 18.5222 21.3567 18.5222 21.3567C18.5851 21.3246 20 18.8801 20 18.7193C20 18.7193 19.8428 18.5906 19.717 18.5263C18.2392 17.8187 17.0129 16.0819 16.6356 14.2164C16.384 12.8977 16.384 12.4795 16.384 5.8538V0H11.5103C8.80619 0 6.47939 0.0321608 6.32217 0.0321608Z"
      fill="#171717"
    />
  </svg>
);

const SectionTitle = ({
  children,
  isDark,
}: {
  children: React.ReactNode;
  isDark: boolean;
}) => (
  <p className={`text-xs font-semibold uppercase tracking-[0.16em] lg:text-sm ${isDark ? "text-[#707078]" : "text-[#71717B]"}`}>
    {children}
  </p>
);

const PreviewAmountList = ({
  title,
  items,
  isDark,
}: {
  title: string;
  items: NormalizedQuoteLineItem[];
  isDark: boolean;
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <SectionTitle isDark={isDark}>{title}</SectionTitle>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center justify-between gap-6 text-sm lg:text-lg ${isDark ? "text-white/90" : "text-black/85"}`}
          >
            <p className="min-w-0 truncate">{item.name}</p>
            <p className={`shrink-0 text-right ${isDark ? "text-white/65" : "text-black/60"}`}>
              {formatQuoteCurrency(item.amount)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

const ServiceTable = ({
  items,
  shootTypeLabel,
  isDark,
}: {
  items: NormalizedQuoteLineItem[];
  shootTypeLabel: string;
  isDark: boolean;
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <SectionTitle isDark={isDark}>Services</SectionTitle>
      <div
        // className={`hidden grid-cols-[minmax(0,2fr)_90px_120px_90px_160px] border-b pb-3 text-sm font-medium md:grid ${
        //   isDark ? "border-white/10 text-white/75" : "border-[#00000014] text-black/65"
        // }`}
        className={`grid-cols-[10fr_3fr_4fr_3fr_4fr] border-b pb-3 text-[8px] lg:text-sm font-medium grid ${isDark ? "border-white/10 text-white/75" : "border-[#00000014] text-black/65"
          }`}
      >
        <p>Description</p>
        <p className="text-center">Qty</p>
        <p className="text-center">Duration</p>
        <p className="text-center">Crew</p>
        <p className="text-right">Amount</p>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            // className={`grid gap-2 text-sm md:grid-cols-[minmax(0,2fr)_90px_120px_90px_160px] md:items-center lg:text-lg ${
            //   isDark ? "text-white/90" : "text-black/80"
            // }`}
            className={`grid gap-2 text-[10px] grid-cols-[10fr_3fr_4fr_3fr_4fr] md:items-center lg:text-base ${isDark ? "text-white/90" : "text-black/80"}`}
          >
            <p className={`font-medium ${isDark ? "text-white" : "text-black"}`}>
              {item.subtitle || shootTypeLabel ? (
                <>
                  {item.name} - <span className="text-[#E8D1AB]">{item.subtitle || `(${shootTypeLabel})`}</span>
                </>
              ) : (
                item.name
              )}
            </p>
            <p className="md:text-center">{formatCount(item.quantity)}</p>
            <p className="md:text-center">{formatDuration(item.duration)}</p>
            <p className="md:text-center">{item.crew > 0 ? formatCount(item.crew) : "-"}</p>
            <p className={`font-medium md:text-right ${isDark ? "text-white/65" : "text-black/60"}`}>
              {formatQuoteCurrency(item.amount)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default function QuotePreviewDocument({
  quote,
  quoteId,
}: QuotePreviewDocumentProps) {
  const { isDark } = useResolvedTheme();
  const quoteData = unwrapSalesQuoteDetail(quote);

  if (!quoteData) {
    return null;
  }

  const lineItems = normalizeQuoteLineItems(quoteData);
  const serviceItems = lineItems.filter((item) => item.section === "service");
  const addonItems = lineItems.filter((item) => item.section === "addon");
  const logisticsItems = lineItems.filter((item) => item.section === "logistics");
  const customItems = lineItems.filter((item) => item.section === "custom");
  const lineItemsSubtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

  const subtotal = getQuoteNumber(quoteData.subtotal) ?? lineItemsSubtotal;
  const discountValue = getQuoteNumber(quoteData.discount_value) ?? 0;
  const discountType = getQuoteText(quoteData.discount_type).toLowerCase();
  const discountAmount = discountType.includes("percent")
    ? subtotal * (discountValue / 100)
    : discountValue;
  const discountedSubtotal = Math.max(subtotal - discountAmount, 0);
  const taxRate = getQuoteNumber(quoteData.tax_rate) ?? 0;
  const taxType = getQuoteText(quoteData.tax_type, "Sales Tax") || "Sales Tax";
  const taxAmount = discountedSubtotal * (taxRate / 100);
  const amountAfterTax = discountedSubtotal + taxAmount;
  const finalTotal = amountAfterTax;

  const resolvedQuoteId = String(
    quoteData.sales_quote_id ?? quoteData.quote_id ?? quoteData.id ?? quoteId ?? ""
  );
  const quoteNumber =
    getQuoteText(quoteData.quote_number) || (resolvedQuoteId ? `Q-${resolvedQuoteId}` : "Draft Quote");
  const clientName = getQuoteText(quoteData.client_name, "Client");
  const clientEmail = getQuoteText(quoteData.client_email, quoteData.guest_email, "N/A") || "N/A";
  const clientPhone = getQuoteText(quoteData.client_phone, "N/A") || "N/A";
  const clientAddress =
    getQuoteText(
      quoteData.client_address,
      quoteData.address,
      quoteData.location,
      "Address not available"
    ) || "Address not available";
  const projectDescription =
    getQuoteText(quoteData.project_description, "Project description not available") ||
    "Project description not available";
  const shootTypeLabel = getQuoteDisplayShootTypeLabel(quoteData);
  const fallbackTerms = getDefaultQuoteTerms(
    getQuoteText(quoteData.valid_until, quoteData.expires_at) || null
  );
  const normalizedTerms = normalizeQuoteTerms(
    quoteData.terms_conditions ??
    quoteData["terms_and_conditions"] ??
    quoteData["terms"] ??
    quoteData["termsConditions"],
    fallbackTerms
  );
  const terms = isLegacyDefaultQuoteTerms(normalizedTerms) ? fallbackTerms : normalizedTerms;
  return (
    <div
      className={`rounded-[24px] px-5 py-5 lg:px-10 lg:py-9 ${isDark ? "border border-white/10 bg-[#171717]" : "border border-[#DFDDDD] bg-white"
        }`}
    >
      <div className="flex flex-col gap-5 lg:gap-9">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex h-[58px] w-[58px] items-center justify-center rounded-2xl bg-[#E8D1AB]">
                <BeigeMark />
              </div>
                <div>
                  <p className="text-[22px] font-semibold text-[#E8D1AB] lg:text-[28px]">
                    {COMPANY_PROFILE.name}
                  </p>
                  {COMPANY_PROFILE.subtitle ? (
                    <p className={`text-sm lg:text-lg ${isDark ? "text-white/85" : "text-[#020202]"}`}>
                      {COMPANY_PROFILE.subtitle}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className={`space-y-1 text-sm leading-7 lg:text-base ${isDark ? "text-white/75" : "text-[#606060]"}`}>
                {COMPANY_PROFILE.addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p>{COMPANY_PROFILE.email} {COMPANY_PROFILE.phone}</p>
              </div>
            </div>

          <div className="text-left lg:text-right">
            <h3 className={`text-[38px] font-bold tracking-tight lg:text-[64px] ${isDark ? "text-white" : "text-[#101010]"}`}>
              PROPOSAL
            </h3>
            <div className={`mt-4 space-y-1 text-sm lg:text-base ${isDark ? "text-white/65" : "text-[#00000080]"}`}>
              <p>Quote #: {quoteNumber}</p>
              <p>Date: {formatQuoteDate(quoteData.created_at)}</p>
              <p>Valid Until: {formatQuoteDate(quoteData.valid_until ?? quoteData.expires_at)}</p>
            </div>
          </div>
        </div>

        <div className={`border-t ${isDark ? "border-white/10" : "border-[#00000014]"}`} />

        <section className="space-y-4">
          <SectionTitle isDark={isDark}>Bill To</SectionTitle>
          <div className={`space-y-1 text-xs lg:text-base ${isDark ? "text-white/75" : "text-black/75"}`}>
            <p className={`text-[24px] font-semibold leading-tight ${isDark ? "text-white" : "text-black"}`}>{clientName}</p>
            <p>{clientAddress}</p>
            <p>{clientEmail}</p>
            <p>{clientPhone}</p>
          </div>
        </section>

        <div className={`rounded-lg lg:rounded-xl p-3 text-[#18181B] lg:p-4 ${isDark ? "bg-[#F5F5F5]" : "border border-[#D7D7D7] bg-[#F4F5F7]"}`}>
          <p className="text-xs font-semibold uppercase text-[#71717B] lg:text-sm">
            Project Description
          </p>
          <p className="mt-1 lg:mt-2 text-xs lg:text-base">{projectDescription}</p>
        </div>

        <div className={`border-t ${isDark ? "border-white/10" : "border-[#00000014]"}`} />

        <ServiceTable items={serviceItems} shootTypeLabel={shootTypeLabel} isDark={isDark} />

        {addonItems.length > 0 || logisticsItems.length > 0 || customItems.length > 0 ? (
          <div className={`space-y-8 border-t pt-8 ${isDark ? "border-white/10" : "border-[#00000014]"}`}>
            <PreviewAmountList title="Add-ons" items={addonItems} isDark={isDark} />
            <PreviewAmountList title="Logistics" items={logisticsItems} isDark={isDark} />
            <PreviewAmountList title="Custom Items" items={customItems} isDark={isDark} />
          </div>
        ) : null}

        <div className="rounded-[20px] bg-[#E8D1AB] p-4 lg:p-6">
          <div className="space-y-3 text-sm text-black lg:text-base">
            <div className="flex items-center justify-between gap-6">
              <span>Subtotal</span>
              <span className="font-semibold">{formatQuoteCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 ? (
              <div className="flex items-center justify-between gap-6">
                <span>Discount Applied</span>
                <span className="font-semibold">-{formatQuoteCurrency(discountAmount)}</span>
              </div>
            ) : null}
            {discountAmount > 0 ? (
              <div className="flex items-center justify-between gap-6">
                <span>Total After Discount</span>
                <span className="font-semibold">{formatQuoteCurrency(discountedSubtotal)}</span>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-6">
              <span>{taxType} ({taxRate}%)</span>
              <span className="font-semibold">{formatQuoteCurrency(taxAmount)}</span>
            </div>
          </div>

          <div className={`mt-5 rounded-[16px] px-4 py-4 lg:px-5 ${isDark ? "bg-[#171717]" : "bg-white"}`}>
            <div className="flex items-center justify-between gap-6">
              <span className={`text-[28px] font-semibold lg:text-[36px] ${isDark ? "text-white" : "text-black"}`}>
                Total
              </span>
              <span className={`text-[28px] font-semibold lg:text-[36px] ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                {formatQuoteCurrency(finalTotal)}
              </span>
            </div>
          </div>
        </div>

        <div className={`border-t ${isDark ? "border-white/10" : "border-[#00000014]"}`} />

        <section className="space-y-4">
          <SectionTitle isDark={isDark}>Terms & Conditions</SectionTitle>
          <ul
            className={`list-disc space-y-3 pl-5 text-sm leading-7 lg:text-base ${isDark ? "text-white/60 marker:text-white/45" : "text-[#00000085] marker:text-[#00000060]"
              }`}
          >
            {terms.map((term, index) => (
              <li key={`${term}-${index}`}>{term}</li>
            ))}
          </ul>
        </section>

        <div className={`border-t ${isDark ? "border-white/10" : "border-[#00000014]"}`} />

        <p className={`pt-2 text-center text-sm lg:text-[16px] ${isDark ? "text-white/70" : "text-black/70"}`}>
          Thank you for your business! For questions, contact Beige AI at sales@beigecorporation.io or 323-826-7230
        </p>
      </div>
    </div>
  );
}
