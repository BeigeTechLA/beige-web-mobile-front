"use client";

import { CheckCircle2, Info, X } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/src/components/landing/ui/button";
import { type CreditPointsFormState } from "@/components/admin/finances/AddCreditPointsModal";

type CreditPointsSuccessModalProps = {
  open: boolean;
  details: CreditPointsFormState | null;
  onOpenChange: (open: boolean) => void;
};

const formatCurrency = (value: string) => {
  const numeric = Number(String(value).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return value || "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numeric);
};

const formatSuccessDate = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
};

export default function CreditPointsSuccessModal({
  open,
  details,
  onOpenChange,
}: CreditPointsSuccessModalProps) {
  const summaryRows = [
    { label: "User Type", value: details?.userType || "-" },
    { label: "Amount", value: formatCurrency(details?.amount || "") },
    { label: "Credit Type", value: details?.creditType || "-" },
    { label: "Expiry Date", value: formatSuccessDate(details?.expiryDate || "") },
    { label: "Reason", value: details?.reason || "-" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-[420px] overflow-hidden rounded-[20px] border border-white/25 bg-black p-0 text-white shadow-[0_24px_72px_rgba(0,0,0,0.5)] sm:max-w-[440px] [&>button]:hidden">
        <DialogTitle className="sr-only">Credit points added successfully</DialogTitle>

        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <div className="mb-2 flex justify-end">
            <DialogClose asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2B2525] text-white/90 transition hover:bg-[#3A3333]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </div>

          <div className="mx-auto max-w-[340px] text-center">
            <div className="mx-auto mb-5 flex h-[74px] w-[74px] items-center justify-center rounded-full bg-[#03231A] text-[#19D19A]">
              <CheckCircle2 className="h-[36px] w-[36px] stroke-[1.75]" />
            </div>
            <h2 className="text-[24px] font-medium leading-tight text-white">
              Credits Added Successfully
            </h2>
            <p className="mx-auto mt-2.5 max-w-[320px] text-[15px] leading-[1.45] text-white/55">
              The credits have been added to the user&apos;s wallet successfully.
            </p>
          </div>

          <div className="mx-auto mt-6 max-w-[340px] rounded-[16px] bg-[#242222] px-4 py-4">
            <div className="space-y-3.5">
              {summaryRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4">
                  <span className="text-[14px] text-white/55">
                    {row.label}
                  </span>
                  <span
                    className={`text-right text-[14px] ${
                      row.label === "Amount" ? "text-[#19D19A]" : "text-white"
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {details?.notifyUser ? (
            <div className="mx-auto mt-5 flex max-w-[340px] gap-3 rounded-[16px] border border-[#163769] bg-[#040A16] px-4 py-3.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#3B82F6] text-[#3B82F6]">
                <Info className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-white">
                  Notifications Sent
                </p>
                <p className="mt-1 max-w-[268px] text-[12px] leading-[1.45] text-white/55">
                  The user has been notified on email about the Beige Credits added
                  to their account.
                </p>
              </div>
            </div>
          ) : null}

          <Button
            type="button"
            variant="beige"
            onClick={() => onOpenChange(false)}
            className="mx-auto mt-6 flex h-[44px] w-full max-w-[340px] rounded-[14px] text-[15px] font-semibold text-black"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
