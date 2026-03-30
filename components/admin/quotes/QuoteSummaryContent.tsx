"use client";

import React from "react";
import {
  ArrowLeft,
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
import { getInitials } from "@/lib/utils";
import type { QuoteSummaryLineItem, QuoteSummarySnapshot } from "@/lib/quoteSummary";

type QuoteSummaryContentProps = {
  snapshot: QuoteSummarySnapshot | null;
  onBack: () => void;
  onPreview: () => void;
  previewDisabled?: boolean;
  emptyStateAction: () => void;
  emptyStateLabel?: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string) => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value || "N/A";
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
}: {
  title: string;
  items: QuoteSummaryLineItem[];
  icon: React.ReactNode;
}) => {
  if (items.length === 0) {
    return null;
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="rounded-[18px] border border-white/10 bg-[#202020] p-4 lg:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8D1AB] text-black">
            {icon}
          </div>
          <div>
            <p className="text-base font-semibold text-white">{title}</p>
            <p className="text-sm text-[#8B8B90]">{items.length} item{items.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        <p className="text-sm font-semibold text-[#E8D1AB] lg:text-base">{formatCurrency(total)}</p>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={`${title}-${item.id}`}
            className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white lg:text-base">{item.name}</p>
                {item.subtitle ? (
                  <p className="mt-1 text-xs text-[#A1A1AA] lg:text-sm">{item.subtitle}</p>
                ) : null}
                <p className="mt-2 text-xs text-[#8B8B90] lg:text-sm">
                  Qty {item.quantity}
                  {item.duration > 0 ? ` | ${item.duration} hr` : ""}
                  {item.crew > 0 ? ` | Crew ${item.crew}` : ""}
                </p>
              </div>

              <p className="text-sm font-semibold text-white lg:text-base">
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="rounded-[18px] border border-white/10 bg-[#202020] p-4">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2A2A2A] text-[#E8D1AB]">
      {icon}
    </div>
    <p className="text-xs uppercase tracking-[0.2em] text-[#71717B]">{label}</p>
    <p className="mt-2 text-sm font-medium text-white lg:text-base">{value || "N/A"}</p>
  </div>
);

export default function QuoteSummaryContent({
  snapshot,
  onBack,
  onPreview,
  previewDisabled = false,
  emptyStateAction,
  emptyStateLabel = "Back to Quote Form",
}: QuoteSummaryContentProps) {
  return (
    <div className="px-4 pb-24 pt-6 lg:px-9 lg:pb-12 lg:pt-8">
      <div className="mb-7 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[15px] text-[#D4D4D4] transition-colors hover:text-white"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      {!snapshot ? (
        <div className="rounded-[20px] border border-white/10 bg-[#171717] p-6 text-center lg:p-10">
          <p className="text-xl font-semibold text-white">Quote summary unavailable</p>
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
          <div className="rounded-[20px] border border-white/10 bg-[#171717]">
            <div className="border-b border-white/10 px-5 py-5 lg:px-8 lg:py-7">
              <h1 className="text-[20px] font-semibold text-white lg:text-[24px]">Quote Summary</h1>
              <p className="mt-2 text-sm text-[#A1A1AA]">
                Review the live quote breakdown before previewing or saving it.
              </p>
            </div>

            <div className="space-y-6 px-5 py-5 lg:px-8 lg:py-8">
              <div className="rounded-[18px] border border-white/10 bg-[#202020] p-5 lg:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#333333] text-xl font-medium text-[#FFFFFF85] lg:h-20 lg:w-20 lg:text-2xl">
                      {getInitials(snapshot.clientName)}
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-white lg:text-2xl">{snapshot.clientName}</p>
                      <div className="mt-2 flex flex-col gap-2 text-sm text-[#A1A1AA]">
                        <span className="flex items-center gap-2">
                          <Mail size={15} className="text-[#E8D1AB]" />
                          {snapshot.clientEmail || "N/A"}
                        </span>
                        <span className="flex items-center gap-2">
                          <Phone size={15} className="text-[#E8D1AB]" />
                          {snapshot.clientPhone || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#151515] px-4 py-3 lg:min-w-[260px]">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#71717B]">Generated</p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {formatDate(snapshot.generatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <InfoTile
                  icon={<CalendarDays size={18} />}
                  label="Valid Until"
                  value={`${formatDate(snapshot.validUntil)} (${snapshot.quoteValidityDays} day${snapshot.quoteValidityDays === 1 ? "" : "s"})`}
                />
                <InfoTile
                  icon={<Film size={18} />}
                  label="Shoot Type"
                  value={snapshot.shootTypeLabel || "N/A"}
                />
                <InfoTile
                  icon={<MapPin size={18} />}
                  label="Address"
                  value={snapshot.clientAddress || "N/A"}
                />
                <InfoTile
                  icon={<FileText size={18} />}
                  label="Project"
                  value={snapshot.projectDescription || "N/A"}
                />
              </div>

              <div className="space-y-4">
                <SectionCard title="Services Included" items={snapshot.services} icon={<Film size={18} />} />
                <SectionCard title="Add-ons" items={snapshot.addons} icon={<Wrench size={18} />} />
                <SectionCard title="Logistics" items={snapshot.logistics} icon={<Truck size={18} />} />
                <SectionCard title="Custom Line Items" items={snapshot.customLineItems} icon={<FileText size={18} />} />
              </div>

              <div className="rounded-[18px] border border-white/10 bg-[#202020] p-4 lg:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8D1AB] text-black">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">Totals</p>
                    <p className="text-sm text-[#8B8B90]">Final quote amount</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-[#D4D4D8] lg:text-base">
                    <span>Subtotal</span>
                    <span>{formatCurrency(snapshot.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-[#D4D4D8] lg:text-base">
                    <span>{`${snapshot.taxLabel} (${snapshot.taxRate}%)`}</span>
                    <span>{formatCurrency(snapshot.taxAmount)}</span>
                  </div>
                  {snapshot.discountEnabled ? (
                    <div className="flex items-center justify-between text-sm text-[#E8D1AB] lg:text-base">
                      <span>
                        Discount {snapshot.discountType === "percentage" ? `(${snapshot.discountValue}%)` : ""}
                      </span>
                      <span>- {formatCurrency(snapshot.discountAmount)}</span>
                    </div>
                  ) : null}
                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#E8D1AB] px-4 py-4 text-black lg:px-5">
                    <span className="text-sm font-semibold lg:text-base">Final Total</span>
                    <span className="text-xl font-semibold lg:text-2xl">
                      {formatCurrency(snapshot.finalTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[18px] border border-white/10 bg-[#202020] p-4 lg:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8D1AB] text-black">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-white">Terms & Conditions</p>
                    <p className="text-sm text-[#8B8B90]">Included with this quote</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-[#D4D4D8]">
                  {snapshot.termsConditions.map((term, index) => (
                    <p key={`${term}-${index}`}>{term}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0f0f0f] px-6 pb-6 pt-4 lg:hidden">
            <Button
              type="button"
              onClick={onPreview}
              disabled={previewDisabled}
              className="h-14 w-full rounded-xl bg-[#E5D5B8] text-black hover:bg-[#d7c7aa] disabled:opacity-60"
            >
              Preview Quote
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
