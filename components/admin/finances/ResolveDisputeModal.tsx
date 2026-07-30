"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, Coins, FileText, Info, Trash2, X } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/src/components/landing/ui/button";
import { TabsSwitcher } from "../TabsSwitcher";

type ResolutionType = "auto" | "credits" | "manual";
type AmountType = "full" | "partial";

export type ResolveDisputeFormData = {
  resolutionType: ResolutionType;
  amountType: AmountType;
  amount: string;
  creditAmount: string;
  recipient: string;
  paymentMethod: string;
  transactionId: string;
  notes: string;
  files: File[];
};

type ResolveDisputeModalProps = {
  open: boolean;
  isSubmitting?: boolean;
  isDark?: boolean;
  disputeData: {
    disputeId: string;
    shootId: string;
    amount: string;
    recipient: string;
  } | null;
  creatorDispute?: boolean;
  onClose?: () => void;
  onSubmit: (data: ResolveDisputeFormData) => void;
};

const tabs = [
  {
    label: (
      <span className="flex items-center justify-center">
        <CreditCard className="mr-2 h-4 w-4" /> Auto Transfer (Stripe)
      </span>
    ),
    value: "auto",
    disabled: true,
  },
  {
    label: (
      <span className="flex items-center justify-center">
        <Coins className="mr-2 h-4 w-4" /> Beige Credits
      </span>
    ),
    value: "credits",
  },
  {
    label: (
      <span className="flex items-center justify-center">
        <FileText className="mr-2 h-4 w-4" /> Manual Payment
      </span>
    ),
    value: "manual",
  },
] as const;

export default function ResolveDisputeModal({
  open,
  isSubmitting = false,
  isDark = true,
  disputeData,
  creatorDispute = false,
  onClose,
  onSubmit,
}: ResolveDisputeModalProps) {
  const [tab, setTab] = useState<ResolutionType>("credits");
  const [amountType, setAmountType] = useState<AmountType>("full");
  const [amount, setAmount] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [recipient, setRecipient] = useState("client");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!open) return;
    setTab(creatorDispute ? "manual" : "credits");
    setAmountType("full");
    setAmount("");
    setCreditAmount("");
    setRecipient(creatorDispute ? "cp" : "client");
    setPaymentMethod("");
    setTransactionId("");
    setNotes("");
    setUploadedFiles([]);
  }, [creatorDispute, open]);

  useEffect(() => {
    if (tab === "credits") setRecipient("client");
  }, [tab]);

  const fullAmount = disputeData?.amount || "$0";
  const maxAmount = fullAmount;
  const recipientLabel = disputeData?.recipient || "Client";
  const visibleTabs = creatorDispute ? tabs.filter((item) => item.value !== "credits") : tabs;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadedFiles(Array.from(event.target.files || []));
  };

  const removeFile = (indexToRemove: number) => {
    setUploadedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (tab === "auto") return;
    onSubmit({
      resolutionType: tab,
      amountType,
      amount: tab === "credits" ? "" : amountType === "full" ? fullAmount : amount,
      creditAmount,
      recipient: creatorDispute ? `CP - ${recipientLabel}` : recipient === "client" ? recipientLabel : recipient,
      paymentMethod,
      transactionId,
      notes,
      files: uploadedFiles,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent className="flex h-[calc(90vh-50px)] w-[calc(100vw-24px)] max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/40 bg-black p-0 text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)] [&>button]:hidden">
        <DialogTitle className="sr-only">Resolve Dispute</DialogTitle>

        <div className="flex shrink-0 items-center justify-between border-b border-[#CACACA] p-4 lg:p-7">
          <div>
            <h2 className="text-xl font-bold leading-none lg:text-3xl">Resolve Dispute</h2>
            <p className="mt-1 font-medium text-[#E8D1AB] lg:text-xl">
              {disputeData?.disputeId || "-"} • {disputeData?.shootId || "-"} • {fullAmount}
            </p>
          </div>

          <DialogClose asChild>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2B2525] text-white/90 transition hover:bg-[#3A3333] lg:h-15 lg:w-15"
              aria-label="Close"
            >
              <X className="h-4 w-4 lg:h-7 lg:w-7" />
            </button>
          </DialogClose>
        </div>

        <form className="flex min-h-0 flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
          <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-4 lg:space-y-5 lg:p-7">
            <div>
              <p className={`text-sm font-medium lg:text-base ${isDark ? "text-white" : "text-black"}`}>Select Resolution Type</p>
              <p className={`text-xs lg:text-sm ${isDark ? "text-[#A0A0A0]" : "text-[#606060]"}`}>
                Choose how you want to process the payment
              </p>
            </div>

            <TabsSwitcher
              tabs={visibleTabs}
              activeTab={tab}
              onChange={(value) => setTab(value)}
              className="w-full"
              textCenter
            />

            <div className={`rounded-lg border p-4 lg:p-7 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E5E5E5] bg-[#F9F9F9] text-black"}`}>
              {tab === "auto" ? (
                <div className="space-y-5 lg:space-y-7">
                  <ResolutionHeader
                    isDark={isDark}
                    icon={<CreditCard className="h-5 w-5" />}
                    title="Amount Type - Auto Transfer Configuration"
                    subtitle="Configure automated Stripe transfer"
                  />

                  <AmountTypePicker
                    isDark={isDark}
                    amountType={amountType}
                    fullAmount={fullAmount}
                    onChange={setAmountType}
                  />

                  {amountType === "partial" ? (
                    <FloatingInput
                      isDark={isDark}
                      label="Enter Amount"
                      value={amount}
                      onChange={setAmount}
                      placeholder={`Maximum: ${maxAmount}`}
                    />
                  ) : null}

                  <RecipientSelect
                    isDark={isDark}
                    recipient={recipient}
                    recipientLabel={recipientLabel}
                    onChange={setRecipient}
                    creatorDispute={creatorDispute}
                  />

                  <InfoBox
                    isDark={isDark}
                    title="Payment Method"
                    body="Stripe transfer will be processed through the configured payment gateway."
                  />
                </div>
              ) : null}

              {tab === "credits" ? (
                <div className="space-y-5 lg:space-y-7">
                  <ResolutionHeader
                    isDark={isDark}
                    icon={<Coins className="h-5 w-5" />}
                    title="Beige Credits Configuration"
                    subtitle="Add credits to user wallet"
                  />

                  <FloatingInput
                    isDark={isDark}
                    label="Enter Credit Amount"
                    value={creditAmount}
                    onChange={setCreditAmount}
                    placeholder="500 Credit Points"
                    icon={<Coins className="h-5 w-5 text-[#D4B896]" />}
                  />

                  <RecipientSelect
                    isDark={isDark}
                    recipient={recipient}
                    recipientLabel={recipientLabel}
                    onChange={setRecipient}
                    clientOnly
                  />

                  <FloatingInput
                    isDark={isDark}
                    label="Notes (Optional)"
                    value={notes}
                    onChange={setNotes}
                    placeholder="Add a client-facing credit note..."
                  />

                  <InfoBox
                    isDark={isDark}
                    title="Credit Information"
                    body="Credits will be added to the selected user wallet and can be used for future bookings."
                    beige
                  />
                </div>
              ) : null}

              {tab === "manual" ? (
                <div className="space-y-5 lg:space-y-7">
                  <ResolutionHeader
                    isDark={isDark}
                    icon={<FileText className="h-5 w-5" />}
                    title="Amount Type - Manual Payment Configuration"
                    subtitle="Record manual payment with proof"
                  />

                  <AmountTypePicker
                    isDark={isDark}
                    amountType={amountType}
                    fullAmount={fullAmount}
                    onChange={setAmountType}
                  />

                  {amountType === "partial" ? (
                    <FloatingInput
                      isDark={isDark}
                      label="Enter Amount"
                      value={amount}
                      onChange={setAmount}
                      placeholder={`Maximum: ${maxAmount}`}
                    />
                  ) : null}

                  <div className="relative">
                    <label className={`absolute -top-3 left-4 z-10 px-2 text-sm font-medium lg:text-base ${isDark ? "bg-[#171717] text-white/50" : "bg-white text-black/60"}`}>
                      Select Payment Method*
                    </label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className={`h-16 rounded-lg text-left lg:h-[82px] lg:rounded-xl ${isDark ? "border-white/50 bg-[#171717] text-white" : "border-black/20 bg-white text-black"}`}>
                        <SelectValue placeholder="Eg: UPI, Cash, Bank Transfer, Credit Card..." />
                      </SelectTrigger>
                      <SelectContent className={`${isDark ? "border-white/10 bg-[#111111] text-white" : "border-black/20 bg-white text-black"}`}>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Credit Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <RecipientSelect
                    isDark={isDark}
                    recipient={recipient}
                    recipientLabel={recipientLabel}
                    onChange={setRecipient}
                    creatorDispute={creatorDispute}
                  />

                  <FloatingInput
                    isDark={isDark}
                    label="Transaction ID*"
                    value={transactionId}
                    onChange={setTransactionId}
                    placeholder="Enter transaction reference"
                  />

                  <ProofUpload
                    isDark={isDark}
                    files={uploadedFiles}
                    disabled={isSubmitting}
                    onFileChange={handleFileChange}
                    onRemove={removeFile}
                  />

                  <FloatingInput
                    isDark={isDark}
                    label="Notes (Optional)"
                    value={notes}
                    onChange={setNotes}
                    placeholder="Add any additional notes..."
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 bg-black p-4 lg:p-7">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="h-12 rounded-sm bg-[#242222] text-sm font-semibold text-white hover:bg-[#2f2b2b]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="beige"
              disabled={isSubmitting}
              className="h-12 rounded-sm bg-[#E8D1AB] text-sm font-semibold text-black hover:bg-[#e0c594]"
            >
              {isSubmitting ? "Submitting..." : "Resolve & Process Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResolutionHeader({
  isDark,
  icon,
  title,
  subtitle,
}: {
  isDark: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full lg:h-15 lg:w-15 ${isDark ? "bg-[#E8D1AB] text-black" : "bg-[#D9C49E] text-black"}`}>
        {icon}
      </div>
      <div>
        <h4 className={`text-base font-medium lg:text-lg ${isDark ? "text-white" : "text-black"}`}>{title}</h4>
        <p className={`text-sm lg:text-base ${isDark ? "text-white/50" : "text-black/50"}`}>{subtitle}</p>
      </div>
    </div>
  );
}

function AmountTypePicker({
  isDark,
  amountType,
  fullAmount,
  onChange,
}: {
  isDark: boolean;
  amountType: AmountType;
  fullAmount: string;
  onChange: (value: AmountType) => void;
}) {
  return (
    <div className={`grid grid-cols-2 overflow-hidden rounded-lg border p-1 ${isDark ? "border-[#3D3D3D] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}>
      {[
        { value: "full" as const, label: "Full Payment", helper: fullAmount },
        { value: "partial" as const, label: "Partial Payment", helper: "Custom" },
      ].map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md border p-2.5 text-center transition-all ${amountType === option.value
            ? isDark ? "border-[#E8D1AB] bg-[#E8D1AB]/20" : "border-[#D9C49E] bg-[#F0E6D2]"
            : "border-transparent bg-transparent"
          }`}
        >
          <span className="block text-sm text-[#A0A0A0] lg:text-base">{option.label}</span>
          <span className={`text-sm font-medium lg:text-base ${isDark ? "text-white" : "text-black"}`}>{option.helper}</span>
        </button>
      ))}
    </div>
  );
}

function FloatingInput({
  isDark,
  label,
  value,
  onChange,
  placeholder,
  icon,
}: {
  isDark: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <label className={`absolute -top-3 left-4 z-10 px-2 text-sm font-medium lg:text-base ${isDark ? "bg-[#171717] text-white/50" : "bg-white text-black/60"}`}>
        {label}
      </label>
      {icon ? <span className="absolute left-4 top-1/2 z-20 -translate-y-1/2">{icon}</span> : null}
      <Input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`h-16 rounded-lg pt-1 lg:h-[82px] lg:rounded-xl ${icon ? "pl-12" : ""} ${isDark ? "border-white/50 bg-[#171717] text-white placeholder:text-white/30 focus:border-[#E8D1AB]/50" : "border-black/20 bg-white text-black placeholder:text-black/60 focus:border-[#E8D1AB]"}`}
      />
    </div>
  );
}

function RecipientSelect({
  isDark,
  recipient,
  recipientLabel,
  onChange,
  clientOnly = false,
  creatorDispute = false,
}: {
  isDark: boolean;
  recipient: string;
  recipientLabel: string;
  onChange: (value: string) => void;
  clientOnly?: boolean;
  creatorDispute?: boolean;
}) {
  if (creatorDispute) {
    return (
      <div className="relative">
        <label className={`absolute -top-3 left-4 z-10 px-2 text-sm font-medium lg:text-base ${isDark ? "bg-[#171717] text-white/50" : "bg-white text-black/60"}`}>
          Recipient
        </label>
        <div className={`flex h-16 items-center rounded-lg border px-4 text-left text-sm lg:h-[82px] lg:rounded-xl lg:text-base ${isDark ? "border-white/50 bg-[#171717] text-white" : "border-black/20 bg-white text-black"}`}>
          CP - {recipientLabel}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className={`absolute -top-3 left-4 z-10 px-2 text-sm font-medium lg:text-base ${isDark ? "bg-[#171717] text-white/50" : "bg-white text-black/60"}`}>
        Select Recipient
      </label>
      <Select value={recipient} onValueChange={onChange}>
        <SelectTrigger className={`h-16 rounded-lg text-left lg:h-[82px] lg:rounded-xl ${isDark ? "border-white/50 bg-[#171717] text-white" : "border-black/20 bg-white text-black"}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className={`rounded-xl ${isDark ? "border-white/10 bg-[#111111] text-white" : "border-black/20 bg-white text-black"}`}>
          <SelectItem value="client">{creatorDispute ? "CP" : "Client"} - {recipientLabel}</SelectItem>
          {!clientOnly ? (
            <>
              <SelectItem value="creator">Creative Partner</SelectItem>
              <SelectItem value="admin">Admin Hold</SelectItem>
            </>
          ) : null}
        </SelectContent>
      </Select>
    </div>
  );
}

function InfoBox({
  isDark,
  title,
  body,
  beige = false,
}: {
  isDark: boolean;
  title: string;
  body: string;
  beige?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${beige
      ? isDark ? "border-[#E8D1AB]/20 bg-[#E8D1AB]/5" : "border-[#E8DFD0] bg-[#FAF7F2]"
      : isDark ? "border-[#3B82F6]/20 bg-[#3B82F6]/5" : "border-[#D0DDF0] bg-[#EEF2F6]"
    }`}>
      <Info className={`h-4 w-4 shrink-0 lg:h-5 lg:w-5 ${beige ? "text-[#E8D1AB]" : "text-[#3B82F6]"}`} />
      <div>
        <p className={`text-sm ${isDark ? "text-white" : "text-black"}`}>{title}</p>
        <p className="text-xs text-[#A0A0A0]">{body}</p>
      </div>
    </div>
  );
}

function ProofUpload({
  isDark,
  files,
  disabled,
  onFileChange,
  onRemove,
}: {
  isDark: boolean;
  files: File[];
  disabled: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="relative">
      <span className={`mb-1.5 block text-sm font-medium lg:text-base ${isDark ? "text-white" : "text-black"}`}>
        Upload Proof <span className="text-[#E8D1AB]">(Optional)</span>
      </span>
      {files.length === 0 ? (
        <>
          <label
            htmlFor="resolve-proof-upload"
            className={`flex cursor-pointer items-center justify-center rounded-xl border border-dashed p-6 text-center transition lg:h-30 ${isDark ? "border-white/50 hover:bg-[#1C1A1A]" : "border-[#CCCCCC] hover:bg-[#F0F0F0]"}`}
          >
            <p className="text-xs text-[#A0A0A0] lg:text-sm">
              Drag & Drop Your File Here Or <span className="font-semibold text-[#E8D1AB]">Upload</span>
            </p>
          </label>
          <input
            id="resolve-proof-upload"
            type="file"
            multiple
            accept="image/png,image/jpeg,application/pdf"
            className="hidden"
            onChange={onFileChange}
            disabled={disabled}
          />
        </>
      ) : (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className={`flex items-center justify-between rounded-xl border p-4 ${isDark ? "border-[#262626] bg-[#0A0A0A]" : "border-black/10 bg-[#F9F9F9] text-black"}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-[#E8D1AB]" />
                <div className="min-w-0">
                  <p className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>{file.name}</p>
                  <p className="mt-0.5 text-xs text-[#A0A0A0]">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="rounded-md p-1.5 text-red-500 transition hover:bg-red-500/10"
                aria-label="Remove file"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
