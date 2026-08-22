import { Minus, TrendingDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import type { QuoteReviewFieldChange, QuoteReviewLineChange } from "@/lib/quoteReviewChanges";

type QuoteReviewChangesData = {
  previousTotal: number;
  nextTotal: number;
  delta: number;
  serviceChanges: QuoteReviewLineChange[];
  addonChanges: QuoteReviewLineChange[];
  logisticsChanges: QuoteReviewLineChange[];
  customChanges: QuoteReviewLineChange[];
  fieldChanges: QuoteReviewFieldChange[];
};

type QuoteReviewChangesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewChangesData: QuoteReviewChangesData;
  reviewChangeReason: string;
  onReviewChangeReason: (value: string) => void;
  onConfirm: () => void;
  isSaving: boolean;
  confirmLabel?: string;
  requireReason?: boolean;
  isDark?: boolean;
};

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function QuoteReviewChangesModal({
  open,
  onOpenChange,
  reviewChangesData,
  reviewChangeReason,
  onReviewChangeReason,
  onConfirm,
  isSaving,
  confirmLabel = "Save as New Version",
  requireReason = true,
  isDark = true,
}: QuoteReviewChangesModalProps) {
  const fieldChanges = reviewChangesData.fieldChanges.map((item) => ({
    id: item.id,
    label: item.label,
    previousValue: item.previousValue || "None",
    nextValue: item.nextValue || "None",
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`left-auto right-0 top-0 flex h-dvh w-full max-w-[732px] translate-x-0 translate-y-0 flex-col rounded-none border-y-0 border-l border-r-0 duration-300 sm:max-w-[732px] p-0 ${isDark
            ? "border-[#2B2B2B] bg-[#050505] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
            : "border-[#D7D7D7] bg-white text-black shadow-xl"
          }`}
      >
        {/* Header Block Section */}
        <div className={`flex shrink-0 items-start justify-between border-b px-7 pb-7 pt-12 ${isDark ? "border-white/10" : "border-[#D7D7D7]"
          }`}>
          <div>
            <DialogTitle className={`text-2xl font-semibold leading-[1.05] lg:text-4xl ${isDark ? "text-white" : "text-black"
              }`}>
              Review Changes Before Saving
            </DialogTitle>
            <p className={`mt-3 max-w-[520px] text-base leading-6 ${isDark ? "text-[#96969E]" : "text-[#727272]"
              }`}>
              Review the changes to your quote including price differences and service modifications.
            </p>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-7 py-7">
          <div className="rounded-[14px] bg-[#E7D0A4] px-5 py-4 text-black">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-base font-semibold">
                {reviewChangesData.delta < 0 ? (
                  <TrendingDown size={18} />
                ) : reviewChangesData.delta > 0 ? (
                  <TrendingDown size={18} className="rotate-180" />
                ) : (
                  <Minus size={18} />
                )}
                <span>
                  {reviewChangesData.delta < 0
                    ? "Price Decrease"
                    : reviewChangesData.delta > 0
                      ? "Price Increase"
                      : "No Price Change"}
                </span>
              </div>
              <div className="text-[22px] font-bold tracking-tight">
                {`${reviewChangesData.delta > 0 ? "+" : reviewChangesData.delta < 0 ? "-" : ""}${formatCurrency(Math.abs(reviewChangesData.delta))}`}
              </div>
            </div>
          </div>

          {/* Refund/Credit Alternative Prompt */}
          {reviewChangesData.delta < 0 ? (
            <div className={`mt-4 rounded-[14px] border px-5 py-4 ${isDark
                ? "border-[#E8D1AB]/30 bg-[#201A10] text-[#E8D1AB]"
                : "border-[#E8D1AB] bg-[#FFF7E6] text-[#B38F43]"
              }`}>
              <p className="text-base font-semibold">Credit Notice</p>
              <p className={`mt-2 text-[14px] leading-6 ${isDark ? "text-[#DCC79E]" : "text-[#727272]"}`}>
                This update decreases the quote total by{" "}
                <span className={`font-semibold ${isDark ? "text-white" : "text-black"}`}>
                  {formatCurrency(Math.abs(reviewChangesData.delta))}
                </span>
                . Review whether the difference should be added as account credit before saving this version.
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className={`rounded-[12px] px-5 py-4 ${isDark ? "bg-[#141416]" : "bg-[#F4F5F7]"}`}>
              <p className={`text-sm ${isDark ? "text-[#9C9CA3]" : "text-[#727272]"}`}>Old Quote Total</p>
              <p className={`mt-2 text-lg font-semibold md:text-xl ${isDark ? "text-white" : "text-black"}`}>
                {formatCurrency(reviewChangesData.previousTotal)}
              </p>
            </div>
            <div className={`rounded-[12px] px-5 py-4 ${isDark ? "bg-[#141416]" : "bg-[#F4F5F7]"}`}>
              <p className={`text-sm ${isDark ? "text-[#9C9CA3]" : "text-[#727272]"}`}>New Quote Total</p>
              <p className={`mt-2 text-lg font-semibold md:text-xl ${isDark ? "text-white" : "text-black"}`}>
                {formatCurrency(reviewChangesData.nextTotal)}
              </p>
            </div>
          </div>

          {([
            ["Service Changes", reviewChangesData.serviceChanges],
            ["Add-On Changes", reviewChangesData.addonChanges],
            ["Logistics Changes", reviewChangesData.logisticsChanges],
            ["Custom Item Changes", reviewChangesData.customChanges],
          ] as const).map(([title, items]) =>
            items.length ? (
              <div key={title} className="mt-5">
                <h3 className={`mb-3 text-base font-medium ${isDark ? "text-[#A7A7AE]" : "text-[#727272]"}`}>{title}</h3>
                <div className="space-y-3">
                  {items.map((item) => {
                    const isRemoved = item.changeType === "removed";
                    const isNegativeChange = isRemoved || item.delta < 0;
                    const isPositive = item.delta >= 0;

                    const toneClass = isRemoved || !isPositive
                      ? isDark
                        ? "border-[#6C161C] bg-[#2A090C] text-[#FF6B6B]"
                        : "border-red-200 bg-red-50 text-red-600"
                      : isDark
                        ? "border-[#0C5B35] bg-[#031A12] text-[#00E18F]"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700";

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between rounded-[12px] border px-4 py-[15px] ${toneClass}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[26px] leading-none">
                            {isNegativeChange ? "-" : "+"}
                          </span>
                          <div>
                            <p className={`text-base font-medium ${isRemoved ? "line-through" : ""}`}>
                              {item.label}
                            </p>
                            {item.changeType === "updated" ? (
                              <p className="text-sm opacity-80">
                                {formatCurrency(item.previousAmount)} to{" "}
                                {formatCurrency(item.nextAmount)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className={`text-base font-semibold ${isRemoved ? "line-through" : ""}`}>
                          {`${isNegativeChange ? "-" : "+"}${formatCurrency(Math.abs(item.delta))}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null,
          )}

          {fieldChanges.length ? (
            <div className="mt-5">
              <h3 className={`mb-3 text-base font-medium ${isDark ? "text-[#A7A7AE]" : "text-[#727272]"}`}>Other Changes</h3>
              <div className={`rounded-[12px] p-5 ${isDark ? "bg-[#141416]" : "bg-[#F4F5F7] border border-[#D7D7D7]"}`}>
                <div className="space-y-4">
                  {fieldChanges.map((item) => (
                    <div key={item.id} className={`rounded-[12px] p-4 ${isDark ? "bg-[#101012]" : "bg-white border border-[#D7D7D7]"}`}>
                      <p className={`text-base font-medium ${isDark ? "text-white" : "text-black"}`}>{item.label}</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <p className={`text-sm ${isDark ? "text-[#7D7D84]" : "text-[#727272]"}`}>Old:</p>
                          <p className={`mt-1 text-base ${isDark ? "text-[#D4D4D8]" : "text-[#333333]"}`}>
                            {item.previousValue}
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm ${isDark ? "text-[#7D7D84]" : "text-[#727272]"}`}>New:</p>
                          <p className={`mt-1 text-base ${isDark ? "text-white" : "text-black"}`}>
                            {item.nextValue}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-7">
            <label className={`mb-3 block text-base font-medium ${isDark ? "text-[#9D9DA4]" : "text-[#727272]"}`}>
              {requireReason ? "Reason for Change*" : "Reason for Change"}
            </label>
            <Textarea
              value={reviewChangeReason}
              onChange={(event) => onReviewChangeReason(event.target.value)}
              placeholder={
                requireReason
                  ? "Explain why these changes are being made..."
                  : "Optional: explain why these changes are being made..."
              }
              className={`min-h-[136px] rounded-[14px] px-5 py-4 text-base focus:border-[#A78857] ${isDark
                  ? "border-[#2E2E33] bg-black text-white placeholder:text-[#5F5F65]"
                  : "border-[#D7D7D7] bg-white text-black placeholder:text-[#9F9FA9]"
                }`}
            />
          </div>
        </div>

        {/* Form Overlay Sticky Footer Panel */}
        <DialogFooter className={`flex shrink-0 flex-col gap-3 border-t px-7 py-7 ${isDark ? "border-white/10" : "border-[#D7D7D7] bg-[#FAFAFA]"
          }`}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className={`h-[50px] min-w-[160px] rounded-[12px] border transition-colors sm:min-w-[160px] ${isDark
                ? "border-[#363636] bg-[#111111] text-white hover:bg-[#181818]"
                : "border-[#D7D7D7] bg-white text-black hover:bg-[#F4F5F7]"
              }`}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSaving || (requireReason && !reviewChangeReason.trim())}
            className="h-[50px] min-w-[230px] rounded-[12px] bg-[#E7D0A4] text-black hover:bg-[#E7D0A4]/90 sm:min-w-[230px]"
          >
            {isSaving ? "Saving..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}