"use client";

import { format } from "date-fns";
import { CheckCircle2, Info } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

const formatExpiryDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, "dd/MM/yyyy");
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
    { label: "Expiry Date", value: formatExpiryDate(details?.expiryDate) },
    { label: "Reason", value: details?.reason || "-" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-[440px] overflow-hidden rounded-[22px] border border-white/20 bg-black p-0 text-white shadow-[0_30px_90px_rgba(0,0,0,0.6)] sm:max-w-[460px] [&>button]:hidden">
        <DialogTitle className="sr-only">Credit points added successfully</DialogTitle>

        <div className="px-5 py-6 sm:px-7 sm:py-7">
          <div className="mx-auto max-w-[372px] text-center">
            <div className="mx-auto mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#03261D] text-[#17D8A2]">
              <CheckCircle2 className="h-[31px] w-[31px] stroke-[1.75]" />
            </div>
            <h2 className="text-[25px] font-medium leading-tight text-white">
              Credits Added Successfully
            </h2>
            <p className="mx-auto mt-2.5 max-w-[340px] text-[15px] leading-[1.45] text-white/55">
              The credits have been added to the user&apos;s wallet successfully.
            </p>
          </div>

          <div className="mx-auto mt-5 max-w-[372px] rounded-[16px] bg-[#242222] px-5 py-4">
            <div className="space-y-4">
              {summaryRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4">
                  <span className="text-[14px] text-white/55">
                    {row.label}
                  </span>
                  <span
                    className={`text-right text-[15px] ${
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
            <div className="mx-auto mt-5 flex max-w-[372px] gap-3 rounded-[16px] border border-[#11356A] bg-[#060B15] px-4 py-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#3B82F6] text-[#3B82F6]">
                <Info className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-white">
                  Notifications Sent
                </p>
                <p className="mt-1 max-w-[280px] text-[12px] leading-[1.45] text-white/55">
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
            className="mx-auto mt-5 flex h-[46px] w-full max-w-[372px] rounded-[12px] text-[15px] font-semibold text-black"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
