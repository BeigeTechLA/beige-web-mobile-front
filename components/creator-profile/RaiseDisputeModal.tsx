"use client";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { File, Upload, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface RaiseDisputeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RaiseDisputeData) => Promise<DisputeSubmissionDetails | void>;
  initialShootId?: string | number | null;
  lockShootSelection?: boolean;
  shootOptions?: Array<{
    creatorEarningId: number | string;
    bookingId: number | string;
    label: string;
    amountLabel?: string;
  }>;
}

export interface RaiseDisputeData {
  shootId: string;
  creatorEarningId?: number | string;
  disputeType: string;
  description: string;
  file?: File | null;
}

interface SuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: DisputeSubmissionDetails;
  isDark: boolean;
}

type DisputeSubmissionDetails = {
  disputeId: string;
  bookingId: string;
  shootLabel?: string;
  disputeType?: string;
  status?: string;
};

const DEFAULT_SUBMISSION_DETAILS: DisputeSubmissionDetails = {
  disputeId: "",
  bookingId: "",
  shootLabel: "",
  disputeType: "",
  status: "",
};

function DisputeSuccessModal({
  open,
  onOpenChange,
  details,
  isDark,
}: SuccessModalProps) {
  const summaryRows = [
    { label: "Dispute ID", value: details.disputeId || "-" },
    { label: "Booking ID", value: details.bookingId || "-" },
    { label: "Shoot", value: details.shootLabel || "-" },
    { label: "Dispute Type", value: details.disputeType || "-" },
    { label: "Status", value: details.status || "Dispute Open", isStatus: true },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`w-[calc(100vw-24px)] max-w-[440px] overflow-hidden rounded-[22px] p-0 shadow-[0_30px_90px_rgba(0,0,0,0.35)] transition-colors duration-200 [&>button]:hidden ${
          isDark
            ? "border border-white/15 bg-[#050505] text-white"
            : "border border-zinc-200 bg-white text-black"
        }`}
      >
        <DialogTitle className="sr-only">Dispute Submitted Successfully</DialogTitle>

        <div className="flex flex-col px-6 pb-6 pt-5">
          <div className="relative mx-auto h-[180px] w-[320px] max-w-full">
            <Image
              src="/images/misc/PaymentSuccess.gif"
              alt="Dispute Submitted"
              fill
              className="object-contain"
              priority
              unoptimized
            />
          </div>

          <div className="text-center">
            <h2 className={`text-[18px] font-medium leading-tight sm:text-[20px] ${isDark ? "text-white" : "text-[#171717]"}`}>
              Dispute Submitted Successfully
            </h2>

            <p className={`mx-auto mt-2 max-w-[340px] text-[12px] leading-[1.5] sm:text-[13px] ${isDark ? "text-white/55" : "text-zinc-500" }`}>
              Your dispute has been received and is now under review. You will be notified of any updates.
            </p>
          </div>

          <div className={`mt-5 rounded-[14px] border px-5 py-4 transition-colors ${isDark ? "border-white/5 bg-[#121212]" : "border-zinc-200 bg-[#F9F9F9]"}`}>
            <div className="space-y-2.5">
              {summaryRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4">
                  <span className={`shrink-0 text-xs ${isDark ? "text-white/40" : "text-zinc-500" }`}>{row.label}</span>
                  <span
                    className={`max-w-[220px] truncate text-right text-xs font-medium ${
                      row.isStatus
                        ? "rounded-full border border-[#E26E67]/20 bg-[#E26E67]/10 px-2.5 py-0.5 text-[#E26E67]"
                        : isDark
                          ? "text-white"
                          : "text-[#171717]"
                    }`}
                    title={row.value}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <DialogClose asChild>
            <button
              type="button"
              className="mt-4 h-11 w-full rounded-[12px] bg-[#E8D1AB] text-[13px] font-medium text-black transition-all hover:bg-[#F5EBD8] active:scale-[0.97]"
            >
              Close
            </button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function RaiseDisputeModal({
  open,
  onOpenChange,
  onSubmit,
  initialShootId = null,
  lockShootSelection = false,
  shootOptions = [],
}: RaiseDisputeModalProps) {
  const { theme, resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] =
    useState<RaiseDisputeData>({
      shootId: "",
      disputeType: "",
      description: "",
      file: null,
    });

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [showSuccess, setShowSuccess] =
    useState(false);

  const [submittedData, setSubmittedData] =
    useState<DisputeSubmissionDetails>(
      DEFAULT_SUBMISSION_DETAILS,
    );

  const [isDragging, setIsDragging] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = resolvedTheme || theme;

  // Keep dark styling during SSR/hydration.
  const isDark =
    !mounted || activeTheme === "dark";

  const resetForm = () => {
    setFormData({
      shootId: "",
      disputeType: "",
      description: "",
      file: null,
    });

    setIsDragging(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (open) {
      setSubmittedData(
        DEFAULT_SUBMISSION_DETAILS,
      );
    } else {
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextShootId =
      initialShootId === null ||
      initialShootId === undefined
        ? ""
        : String(initialShootId);

    setFormData((prev) => ({
      ...prev,
      shootId: nextShootId,
    }));
  }, [
    initialShootId,
    lockShootSelection,
    open,
  ]);

  const disputeTypes = [
    "Payment Not Received",
    "Incorrect Amount",
    "Other",
  ];

  const handleInputChange = (
    field: keyof RaiseDisputeData,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileSelect = (file: File) => {
    setFormData((prev) => ({
      ...prev,
      file,
    }));
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();

    setIsDragging(false);

    const droppedFile =
      e.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (
    e: React.DragEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (
      !formData.shootId ||
      !formData.disputeType
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedShoot = shootOptions.find(
        (shoot) =>
          String(shoot.bookingId) ===
          String(formData.shootId),
      );

      const result = await onSubmit({
        ...formData,

        creatorEarningId:
          selectedShoot?.creatorEarningId,
      });

      const submission = result || null;

      setSubmittedData({
        disputeId:
          submission?.disputeId || "-",

        bookingId:
          submission?.bookingId ||
          formData.shootId,

        shootLabel:
          submission?.shootLabel ||
          selectedShoot?.label ||
          formData.shootId,

        disputeType:
          submission?.disputeType ||
          formData.disputeType,

        status:
          submission?.status ||
          "Dispute Open",
      });

      onOpenChange(false);

      setShowSuccess(true);

      resetForm();
    } catch (error) {
      toast.error(
        error instanceof Error &&
          error.message
          ? error.message
          : "Failed to submit dispute",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent
          className={`w-[calc(100vw-24px)] max-w-[460px] overflow-hidden rounded-[2px] p-0 shadow-[0_18px_60px_rgba(0,0,0,0.25)] transition-colors duration-200 sm:max-w-[500px] [&>button]:hidden ${
            isDark
              ? "border border-white/40 bg-black text-white"
              : "border border-zinc-200 bg-white text-black"
          }`}
        >
          <DialogTitle className="sr-only">
            Raise New Dispute
          </DialogTitle>

          {/* Header */}
          <div
            className={`flex items-center justify-between border-b px-5 py-4 transition-colors ${
              isDark
                ? "border-white/40"
                : "border-zinc-200"
            }`}
          >
            <h2
              className={`text-[22px] font-semibold leading-none ${
                isDark
                  ? "text-white"
                  : "text-[#171717]"
              }`}
            >
              Raise New Dispute
            </h2>

            <DialogClose asChild>
              <button
                type="button"
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  isDark
                    ? "bg-[#2B2525] text-white/90 hover:bg-[#3A3333]"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-black"
                }`}
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </DialogClose>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="max-h-[calc(90vh-60px)] overflow-y-auto px-5 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="space-y-3.5">

              <fieldset
                className={`rounded-[8px] border px-4 pb-3 pt-1.5 transition-colors ${
                  isDark
                    ? "border-white/50"
                    : "border-zinc-300"
                }`}
              >
                <legend
                  className={`px-1 text-[11px] leading-none ${
                    isDark
                      ? "text-white/60"
                      : "text-zinc-500"
                  }`}
                >
                  Select Shoot ID*
                </legend>

                <Select
                  value={formData.shootId}
                  onValueChange={(value) =>
                    handleInputChange(
                      "shootId",
                      value,
                    )
                  }
                  disabled={lockShootSelection}
                >
                  <SelectTrigger
                    className={`h-9 rounded-none border-0 bg-transparent px-0 py-0 text-left text-[14px] shadow-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 [&>svg]:transition-transform [&>svg]:duration-200 [&[data-state=open]>svg]:rotate-180 ${
                      isDark
                        ? "text-white data-[placeholder]:text-white/35 [&>svg]:text-white"
                        : "text-black data-[placeholder]:text-zinc-400 [&>svg]:text-zinc-500"
                    }`}
                  >
                    <SelectValue placeholder="Select shoot ID" />
                  </SelectTrigger>

                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className={`z-[220] max-h-[280px] w-[var(--radix-select-trigger-width)] overflow-y-auto shadow-[0_18px_50px_rgba(0,0,0,0.25)] ${
                      isDark
                        ? "border-white/10 bg-[#111111] text-white"
                        : "border-zinc-200 bg-white text-black"
                    }`}
                  >
                    {shootOptions.map((shoot) => (
                      <SelectItem
                        key={String(
                          shoot.creatorEarningId,
                        )}
                        value={String(
                          shoot.bookingId,
                        )}
                        className={`cursor-pointer ${
                          isDark
                            ? "focus:bg-[#E8D1AB] focus:text-black"
                            : "focus:bg-[#F4E9D6] focus:text-black"
                        }`}
                      >
                        {shoot.label}
                        {shoot.amountLabel
                          ? ` - ${shoot.amountLabel}`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </fieldset>

              <fieldset
                className={`rounded-[8px] border px-4 pb-3 pt-1.5 transition-colors ${
                  isDark
                    ? "border-white/50"
                    : "border-zinc-300"
                }`}
              >
                <legend
                  className={`px-1 text-[11px] leading-none ${
                    isDark
                      ? "text-white/60"
                      : "text-zinc-500"
                  }`}
                >
                  Select Dispute Type*
                </legend>

                <Select
                  value={formData.disputeType}
                  onValueChange={(value) =>
                    handleInputChange(
                      "disputeType",
                      value,
                    )
                  }
                >
                  <SelectTrigger
                    className={`h-9 rounded-none border-0 bg-transparent px-0 py-0 text-left text-[14px] shadow-none focus:ring-0 [&>svg]:transition-transform [&>svg]:duration-200 [&[data-state=open]>svg]:rotate-180 ${
                      isDark
                        ? "text-white data-[placeholder]:text-white/35 [&>svg]:text-white"
                        : "text-black data-[placeholder]:text-zinc-400 [&>svg]:text-zinc-500"
                    }`}
                  >
                    <SelectValue placeholder="Select dispute type" />
                  </SelectTrigger>

                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className={`z-[220] w-[var(--radix-select-trigger-width)] shadow-[0_18px_50px_rgba(0,0,0,0.25)] ${
                      isDark
                        ? "border-white/10 bg-[#111111] text-white"
                        : "border-zinc-200 bg-white text-black"
                    }`}
                  >
                    {disputeTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className={`cursor-pointer ${
                          isDark
                            ? "focus:bg-[#E8D1AB] focus:text-black"
                            : "focus:bg-[#F4E9D6] focus:text-black"
                        }`}
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </fieldset>

              <fieldset
                className={`rounded-[8px] border px-4 pb-3 pt-1.5 transition-colors ${
                  isDark
                    ? "border-white/50"
                    : "border-zinc-300"
                }`}
              >
                <legend
                  className={`px-1 text-[11px] leading-none ${
                    isDark
                      ? "text-white/60"
                      : "text-zinc-500"
                  }`}
                >
                  Description
                </legend>

                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange(
                      "description",
                      e.target.value,
                    )
                  }
                  placeholder="Describe your dispute in detail..."
                  className={`min-h-[100px] resize-none rounded-none border-0 bg-transparent px-0 py-0 text-[14px] shadow-none focus-visible:ring-0 ${
                    isDark
                      ? "text-white placeholder:text-white/35"
                      : "text-black placeholder:text-zinc-400"
                  }`}
                />
              </fieldset>

              <div>
                <label
                  className={`mb-1.5 block text-[13px] ${
                    isDark
                      ? "text-white/60"
                      : "text-zinc-500"
                  }`}
                >
                  Attach File
                </label>

                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={
                    handleDragLeave
                  }
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed p-6 transition-all ${
                    isDragging
                      ? isDark
                        ? "border-[#E8D1AB] bg-[#E8D1AB]/10"
                        : "border-[#BFA780] bg-[#E8D1AB]/15"
                      : isDark
                        ? "border-white/25 bg-[#111111]/50 hover:border-white/40"
                        : "border-zinc-300 bg-[#F9F9F9] hover:border-zinc-400 hover:bg-zinc-50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file =
                        e.target.files?.[0];

                      if (file) {
                        handleFileSelect(file);
                      }
                    }}
                  />

                  {formData.file ? (
                    <div className="flex items-center gap-3">
                      <File className="h-5 w-5 text-[#BFA780] dark:text-[#E8D1AB]" />

                      <div className="min-w-0 text-center">
                        <p
                          className={`max-w-[300px] truncate text-sm font-medium ${
                            isDark
                              ? "text-white"
                              : "text-black"
                          }`}
                          title={
                            formData.file.name
                          }
                        >
                          {formData.file.name}
                        </p>

                        <p
                          className={`text-xs ${
                            isDark
                              ? "text-white/50"
                              : "text-zinc-500"
                          }`}
                        >
                          {(
                            formData.file
                              .size / 1024
                          ).toFixed(2)}{" "}
                          KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload
                        className={`mb-2 h-6 w-6 ${
                          isDark
                            ? "text-white/40"
                            : "text-zinc-400"
                        }`}
                      />

                      <p
                        className={`text-center text-sm ${
                          isDark
                            ? "text-white/70"
                            : "text-zinc-600"
                        }`}
                      >
                        Drag & Drop Your File
                        Here Or{" "}
                        <span className="font-medium text-[#B38F43] dark:text-[#E8D1AB]">
                          Upload
                        </span>
                      </p>
                    </>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !formData.shootId ||
                  !formData.disputeType
                }
                className="mt-2 w-full rounded-[8px] bg-[#E8D1AB] py-3 text-sm font-medium text-black transition hover:bg-[#F5EBD8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "Submitting..."
                  : "Save & Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DisputeSuccessModal
        open={showSuccess}
        isDark={isDark}
        onOpenChange={(isOpen) => {
          setShowSuccess(isOpen);

          if (!isOpen) {
            setSubmittedData(
              DEFAULT_SUBMISSION_DETAILS,
            );

            onOpenChange(false);
          }
        }}
        details={submittedData}
      />
    </>
  );
}