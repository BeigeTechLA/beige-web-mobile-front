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
}: QuoteReviewChangesModalProps) {
  const fieldChanges = reviewChangesData.fieldChanges.map((item) => ({
    id: item.id,
    label: item.label,
    previousValue: item.previousValue || "None",
    nextValue: item.nextValue || "None",
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-auto right-0 top-0 h-screen w-full max-w-[732px] translate-x-0 translate-y-0 rounded-none border-y-0 border-l border-r-0 border-[#2B2B2B] bg-[#050505] p-0 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)] duration-300 sm:max-w-[732px]">
        <div className="flex items-start justify-between border-b border-white/10 px-7 pb-7 pt-12">
          <div>
            <DialogTitle className="text-[32px] font-semibold leading-[1.05] text-white lg:text-[33px]">
              Review Changes Before Saving
            </DialogTitle>
            <p className="mt-3 max-w-[520px] text-[15px] leading-6 text-[#96969E]">
              Review the changes to your quote including price differences and service
              modifications.
            </p>
          </div>
        </div>

        <div className="max-h-[calc(100vh-218px)] overflow-y-auto px-7 py-7">
          <div className="rounded-[14px] bg-[#E7D0A4] px-5 py-4 text-black">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-[16px] font-semibold">
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

          {reviewChangesData.delta < 0 ? (
            <div className="mt-4 rounded-[14px] border border-[#E8D1AB]/30 bg-[#201A10] px-5 py-4 text-[#E8D1AB]">
              <p className="text-[15px] font-semibold">Credit Notice</p>
              <p className="mt-2 text-[14px] leading-6 text-[#DCC79E]">
                This update decreases the quote total by{" "}
                <span className="font-semibold text-white">
                  {formatCurrency(Math.abs(reviewChangesData.delta))}
                </span>
                . Review whether the difference should be added as account credit before
                saving this version.
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[12px] bg-[#141416] px-5 py-4">
              <p className="text-sm text-[#9C9CA3]">Old Quote Total</p>
              <p className="mt-2 text-[18px] font-semibold text-white md:text-[19px]">
                {formatCurrency(reviewChangesData.previousTotal)}
              </p>
            </div>
            <div className="rounded-[12px] bg-[#141416] px-5 py-4">
              <p className="text-sm text-[#9C9CA3]">New Quote Total</p>
              <p className="mt-2 text-[18px] font-semibold text-white md:text-[19px]">
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
                <h3 className="mb-3 text-[15px] font-medium text-[#A7A7AE]">{title}</h3>
                <div className="space-y-3">
                  {items.map((item) => {
                    const isRemoved = item.changeType === "removed";
                    const isNegativeChange = isRemoved || item.delta < 0;
                    const isPositive = item.delta >= 0;
                    const toneClass = isRemoved
                      ? "border-[#6C161C] bg-[#2A090C] text-[#FF6B6B]"
                      : isPositive
                        ? "border-[#0C5B35] bg-[#031A12] text-[#00E18F]"
                        : "border-[#6C161C] bg-[#2A090C] text-[#FF6B6B]";

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
                            <p
                              className={`text-[16px] font-medium ${isRemoved ? "line-through" : ""}`}
                            >
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
                        <div
                          className={`text-[16px] font-semibold ${isRemoved ? "line-through" : ""}`}
                        >
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
              <h3 className="mb-3 text-[15px] font-medium text-[#A7A7AE]">Other Changes</h3>
              <div className="rounded-[12px] bg-[#141416] p-5">
                <div className="space-y-4">
                  {fieldChanges.map((item) => (
                    <div key={item.id} className="rounded-[12px] bg-[#101012] p-4">
                      <p className="text-[16px] font-medium text-white">{item.label}</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-[#7D7D84]">Old:</p>
                          <p className="mt-1 text-[15px] text-[#D4D4D8]">
                            {item.previousValue}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[#7D7D84]">New:</p>
                          <p className="mt-1 text-[15px] text-white">
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
            <label className="mb-3 block text-[15px] font-medium text-[#9D9DA4]">
              Reason for Change*
            </label>
            <Textarea
              value={reviewChangeReason}
              onChange={(event) => onReviewChangeReason(event.target.value)}
              placeholder="Explain why these changes are being made..."
              className="min-h-[136px] rounded-[14px] border border-[#2E2E33] bg-black px-5 py-4 text-[15px] text-white placeholder:text-[#5F5F65]"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-3 border-t border-white/10 px-7 py-7 sm:flex-row sm:justify-end sm:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="h-[50px] min-w-[160px] rounded-[12px] border-[#363636] bg-[#111111] text-white hover:bg-[#181818] sm:min-w-[160px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSaving || !reviewChangeReason.trim()}
            className="h-[50px] min-w-[230px] rounded-[12px] bg-[#E7D0A4] text-black hover:bg-[#E7D0A4]/90 sm:min-w-[230px]"
          >
            {isSaving ? "Saving..." : "Save as New Version"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
