"use client";

import React from "react";
import {
  CalendarDays,
  FileText,
  Film,
  Mail,
  MapPin,
  Phone,
  Truck,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatQuoteItemDisplayName } from "@/lib/quoteDetail";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { getInitials } from "@/lib/utils";
import type { QuoteSummaryLineItem, QuoteSummarySnapshot } from "@/lib/quoteSummary";

type QuoteSummaryContentProps = {
  snapshot: QuoteSummarySnapshot | null;
  onPreview: () => void;
  previewDisabled?: boolean;
  emptyStateAction: () => void;
  emptyStateLabel?: string;
  showMobilePreviewBar?: boolean;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string) => {
  if (!value.trim()) {
    return "";
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

const SectionCard = ({
  title,
  items,
  icon,
  isDark,
}: {
  title: string;
  items: QuoteSummaryLineItem[];
  icon: React.ReactNode;
  isDark: boolean;
}) => {
  if (items.length === 0) {
    return null;
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div
      className={`rounded-[18px] p-4 lg:p-6 ${
        isDark ? "border border-white/10 bg-[#202020]" : "border border-[#DFDDDD] bg-white"
      }`}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8D1AB] text-black">
            {icon}
          </div>
          <div>
            <p className={`text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>{title}</p>
            <p className="text-sm text-[#8B8B90]">{items.length} item{items.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        <p className="text-sm font-semibold text-[#E8D1AB] lg:text-base">{formatCurrency(total)}</p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={`${title}-${item.id}`}
            className={`rounded-2xl px-4 py-3 ${
              isDark ? "border border-white/10 bg-[#151515]" : "border border-[#E9E9E9] bg-[#F4F5F7]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-sm font-medium lg:text-base ${isDark ? "text-white" : "text-black"}`}>
                  {formatQuoteItemDisplayName(item.name)}
                </p>
                {item.subtitle ? (
                  <p className="mt-1 text-xs text-[#A1A1AA] lg:text-sm">{item.subtitle}</p>
                ) : null}
                <p className="mt-2 text-xs text-[#8B8B90] lg:text-sm">
                  Qty {item.quantity}
                  {item.duration > 0 ? ` | ${item.duration} hr` : ""}
                  {item.crew > 0 ? ` | Crew ${item.crew}` : ""}
                </p>
              </div>

              <p className={`text-sm font-semibold lg:text-base ${isDark ? "text-white" : "text-black"}`}>
                {formatCurrency(item.amount)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const InfoTile = ({
  icon,
  label,
  value,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isDark: boolean;
}) => {
  if (!value.trim()) {
    return null;
  }

  return (
    <div
      className={`rounded-[18px] p-4 ${
        isDark ? "border border-white/10 bg-[#202020]" : "border border-[#DFDDDD] bg-white"
      }`}
    >
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl text-[#E8D1AB] ${
          isDark ? "bg-[#2A2A2A]" : "bg-[#F4F5F7]"
        }`}
      >
        {icon}
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-[#71717B]">{label}</p>
      <p className={`mt-2 text-sm font-medium lg:text-base ${isDark ? "text-white" : "text-black"}`}>
        {value}
      </p>
    </div>
  );
};

export default function QuoteSummaryContent({
  snapshot,
  onPreview,
  previewDisabled = false,
  emptyStateAction,
  emptyStateLabel = "Back to Quote Form",
  showMobilePreviewBar = true,
}: QuoteSummaryContentProps) {
  const { isDark } = useResolvedTheme();
  const discountedSubtotal = Math.max(
    (snapshot?.subtotal ?? 0) - (snapshot?.discountAmount ?? 0),
    0
  );
  const hasClientSummary = Boolean(
    snapshot &&
      (
        snapshot.clientName.trim() ||
        snapshot.clientEmail.trim() ||
        snapshot.clientPhone.trim()
      )
  );
  const hasTotals =
    Boolean(snapshot) &&
    (
      snapshot.subtotal > 0 ||
      snapshot.discountEnabled ||
      snapshot.taxRate > 0 ||
      snapshot.taxAmount > 0 ||
      snapshot.finalTotal > 0
    );
  const hasTerms = Boolean(snapshot && snapshot.termsConditions.length > 0);
  const validUntilText =
    snapshot && snapshot.validUntil.trim()
      ? `${formatDate(snapshot.validUntil)} (${snapshot.quoteValidityDays} day${snapshot.quoteValidityDays === 1 ? "" : "s"})`
      : "";
  const visibleInfoTiles = snapshot
    ? [
        {
          key: "validUntil",
          icon: <CalendarDays size={18} />,
          label: "Valid Until",
          value: validUntilText,
        },
        {
          key: "shootType",
          icon: <Film size={18} />,
          label: "Shoot Type",
          value: snapshot.shootTypeLabel,
        },
        {
          key: "address",
          icon: <MapPin size={18} />,
          label: "Address",
          value: snapshot.clientAddress,
        },
        {
          key: "project",
          icon: <FileText size={18} />,
          label: "Project",
          value: snapshot.projectDescription,
        },
      ].filter((item) => item.value.trim())
    : [];

  return (
    <div className="px-4 pb-24 pt-6 lg:px-9 lg:pb-12 lg:pt-8">
      {!snapshot ? (
        <div
          className={`rounded-[20px] p-6 text-center lg:p-10 ${
            isDark ? "border border-white/10 bg-[#171717]" : "border border-[#DFDDDD] bg-white"
          }`}
        >
          <p className={`text-xl font-semibold ${isDark ? "text-white" : "text-black"}`}>
            Quote summary unavailable
          </p>
          <p className="mx-auto mt-3 max-w-[520px] text-sm text-[#A1A1AA]">
            Open this page from the quote form after filling the required fields so the latest
            summary can be generated.
          </p>
          <Button
            type="button"
            onClick={emptyStateAction}
            className="mt-6 bg-[#E5D5B8] text-black hover:bg-[#d7c7aa]"
          >
            {emptyStateLabel}
          </Button>
        </div>
      ) : (
        <>
          <div
            className={`rounded-[20px] ${
              isDark ? "border border-white/10 bg-[#171717]" : "border border-[#DFDDDD] bg-white"
            }`}
          >
            <div className={`px-5 py-5 lg:px-8 lg:py-7 ${isDark ? "border-b border-white/10" : "border-b border-[#DFDDDD]"}`}>
              <h1 className={`text-[20px] font-semibold lg:text-[24px] ${isDark ? "text-white" : "text-black"}`}>
                Quote Summary
              </h1>
              <p className="mt-2 text-sm text-[#A1A1AA]">
                Review the live quote breakdown before previewing or saving it.
              </p>
            </div>

            <div className="space-y-6 px-5 py-5 lg:px-8 lg:py-8">
              {hasClientSummary ? (
                <div
                  className={`rounded-[18px] p-5 lg:p-6 ${
                    isDark ? "border border-white/10 bg-[#202020]" : "border border-[#DFDDDD] bg-[#F4F5F7]"
                  }`}
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-medium lg:h-20 lg:w-20 lg:text-2xl ${
                          isDark ? "bg-[#333333] text-[#FFFFFF85]" : "bg-white text-[#00000085]"
                        }`}
                      >
                        {getInitials(snapshot.clientName || snapshot.clientEmail || snapshot.clientPhone)}
                      </div>
                      <div>
                        <p className={`text-xl font-semibold lg:text-2xl ${isDark ? "text-white" : "text-black"}`}>
                          {snapshot.clientName || snapshot.clientEmail || snapshot.clientPhone}
                        </p>
                        <div className="mt-2 flex flex-col gap-2 text-sm text-[#A1A1AA]">
                          {snapshot.clientEmail.trim() ? (
                            <span className="flex items-center gap-2">
                              <Mail size={15} className="text-[#E8D1AB]" />
                              {snapshot.clientEmail}
                            </span>
                          ) : null}
                          {snapshot.clientPhone.trim() ? (
                            <span className="flex items-center gap-2">
                              <Phone size={15} className="text-[#E8D1AB]" />
                              {snapshot.clientPhone}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`rounded-2xl px-4 py-3 lg:min-w-[260px] ${
                        isDark ? "border border-white/10 bg-[#151515]" : "border border-[#DFDDDD] bg-white"
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-[#71717B]">Generated</p>
                      <p className={`mt-2 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                        {formatDate(snapshot.generatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {visibleInfoTiles.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {visibleInfoTiles.map((item) => (
                    <InfoTile
                      key={item.key}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                      isDark={isDark}
                    />
                  ))}
                </div>
              ) : null}

              <div className="space-y-4">
                <SectionCard title="Services Included" items={snapshot.services} icon={<Film size={18} />} isDark={isDark} />
                <SectionCard title="Add-ons" items={snapshot.addons} icon={<Wrench size={18} />} isDark={isDark} />
                <SectionCard title="Logistics" items={snapshot.logistics} icon={<Truck size={18} />} isDark={isDark} />
                <SectionCard title="Custom Line Items" items={snapshot.customLineItems} icon={<FileText size={18} />} isDark={isDark} />
              </div>

              {hasTotals ? (
                <div
                  className={`rounded-[18px] p-4 lg:p-6 ${
                    isDark ? "border border-white/10 bg-[#202020]" : "border border-[#DFDDDD] bg-white"
                  }`}
                >
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8D1AB] text-black">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className={`text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>Totals</p>
                      <p className="text-sm text-[#8B8B90]">Current quote amount</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className={`flex items-center justify-between text-sm lg:text-base ${isDark ? "text-[#D4D4D8]" : "text-[#444444]"}`}>
                      <span>Subtotal</span>
                      <span>{formatCurrency(snapshot.subtotal)}</span>
                    </div>
                    {snapshot.discountEnabled ? (
                      <>
                        <div className={`flex items-center justify-between text-sm lg:text-base ${isDark ? "text-[#D4D4D8]" : "text-[#444444]"}`}>
                          <span>{`Discount ${snapshot.discountType === "percentage" ? `(${snapshot.discountValue}%)` : ""}`}</span>
                          <span>{`- ${formatCurrency(snapshot.discountAmount)}`}</span>
                        </div>
                        <div className={`flex items-center justify-between text-sm lg:text-base ${isDark ? "text-[#D4D4D8]" : "text-[#444444]"}`}>
                          <span>Total After Discount</span>
                          <span>{formatCurrency(discountedSubtotal)}</span>
                        </div>
                      </>
                    ) : null}
                    {snapshot.taxRate > 0 || snapshot.taxAmount > 0 ? (
                      <div className={`flex items-center justify-between text-sm lg:text-base ${isDark ? "text-[#D4D4D8]" : "text-[#444444]"}`}>
                        <span>{`${snapshot.taxLabel} (${snapshot.taxRate}%)`}</span>
                        <span>{formatCurrency(snapshot.taxAmount)}</span>
                      </div>
                    ) : null}
                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#E8D1AB] px-4 py-4 text-black lg:px-5">
                      <span className="text-sm font-semibold lg:text-base">Current Total</span>
                      <span className="text-xl font-semibold lg:text-2xl">
                        {formatCurrency(snapshot.finalTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {hasTerms ? (
                <div
                  className={`rounded-[18px] p-4 lg:p-6 ${
                    isDark ? "border border-white/10 bg-[#202020]" : "border border-[#DFDDDD] bg-white"
                  }`}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8D1AB] text-black">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className={`text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>
                        Terms & Conditions
                      </p>
                      <p className="text-sm text-[#8B8B90]">Included with this quote</p>
                    </div>
                  </div>

                  <div className={`space-y-2 text-sm ${isDark ? "text-[#D4D4D8]" : "text-[#444444]"}`}>
                    {snapshot.termsConditions.map((term, index) => (
                      <p key={`${term}-${index}`}>{term}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {showMobilePreviewBar ? (
            <div className={`fixed bottom-0 left-0 right-0 z-40 px-6 pb-6 pt-4 lg:hidden ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
              <Button
                type="button"
                onClick={onPreview}
                disabled={previewDisabled}
                className="h-14 w-full rounded-xl bg-[#E5D5B8] text-black hover:bg-[#d7c7aa] disabled:opacity-60"
              >
                Preview Quote
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
