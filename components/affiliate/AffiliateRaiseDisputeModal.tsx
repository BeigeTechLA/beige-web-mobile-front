"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { FileText, Plus, UploadCloud, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { Button } from "@/src/components/landing/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DisputeFormState = {
  shootId: string;
  disputeType: string;
  description: string;
};

type AttachedFile = {
  id: string;
  file: File;
  previewUrl?: string;
};

type AffiliateDisputeSuccessDetails = {
  disputeId: string;
  bookingId: string;
  status: string;
};

type AffiliateRaiseDisputeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialShootId?: string | null;
};

const DEFAULT_FORM_STATE: DisputeFormState = {
  shootId: "",
  disputeType: "",
  description: "",
};

const SHOOT_OPTIONS = ["BK-001", "BK-002", "BK-003", "BK-004", "BK-005"];
const DISPUTE_TYPES = ["Payment Issue", "Invoice Mismatch", "Refund Request", "Service Concern"];

export default function AffiliateRaiseDisputeModal({
  isOpen,
  onClose,
  initialShootId,
}: AffiliateRaiseDisputeModalProps) {
  const { isDark } = useResolvedTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [form, setForm] = useState<DisputeFormState>(DEFAULT_FORM_STATE);
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successDetails, setSuccessDetails] = useState<AffiliateDisputeSuccessDetails | null>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setForm((current) => ({
        ...DEFAULT_FORM_STATE,
        shootId: initialShootId || current.shootId || SHOOT_OPTIONS[0],
      }));
      return;
    }

    setForm(DEFAULT_FORM_STATE);
    setFiles((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl && previewUrlsRef.current.has(item.previewUrl)) {
          URL.revokeObjectURL(item.previewUrl);
          previewUrlsRef.current.delete(item.previewUrl);
        }
      });
      return [];
    });
    setIsDragging(false);
  }, [isOpen, initialShootId]);

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.clear();
    };
  }, []);

  const selectedFileLabel = useMemo(() => {
    if (!files.length) return null;
    return `${files.length} file${files.length > 1 ? "s" : ""} attached`;
  }, [files]);

  const createPreviewUrl = (file: File) => {
    const canPreview = file.type.startsWith("image/");
    if (!canPreview) return undefined;
    const url = URL.createObjectURL(file);
    previewUrlsRef.current.add(url);
    return url;
  };

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;

    const now = Date.now();
    const newFiles = Array.from(incoming)
      .filter((file) => file.size > 0)
      .map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}-${now}`,
        file,
        previewUrl: createPreviewUrl(file),
      }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl && previewUrlsRef.current.has(target.previewUrl)) {
        URL.revokeObjectURL(target.previewUrl);
        previewUrlsRef.current.delete(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const bookingId = form.shootId || initialShootId || SHOOT_OPTIONS[0];
    const disputeNumber = String(Math.floor(700 + Math.random() * 300)).padStart(3, "0");

    setSuccessDetails({
      disputeId: `DIS-${disputeNumber}`,
      bookingId,
      status: "Dispute - Open",
    });
    setIsSuccessOpen(true);
    onClose();
  };

  const handleDragState = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setIsDragging(true);
    } else if (event.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  if (!isOpen && !isSuccessOpen) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/82 px-4 py-5 backdrop-blur-md">
          <div
            className={`relative flex max-h-[90vh] w-full max-w-[438px] flex-col overflow-hidden rounded-[18px] border ${
              isDark
                ? "border-white/15 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
                : "border-[#D7D7D7] bg-white text-black shadow-2xl"
            }`}
          >
            <div className="flex items-center justify-between p-[18px]">
              <h2 className="text-[22px] font-semibold leading-tight">
                Raise New Dispute
              </h2>
              <button
                type="button"
                onClick={onClose}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                  isDark ? "border-[#2B2626] bg-[#2B2626] text-white" : "border-[#F0F0F0] bg-[#F0F0F0] text-black"
                }`}
              >
                <X size={20} />
              </button>
            </div>

            <div className={`border-t ${isDark ? "border-white/10" : "border-black/10"}`} />

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-3.5 overflow-y-auto p-[18px] no-scrollbar">
                <fieldset className={`rounded-[12px] border px-4 pb-4 pt-2 ${isDark ? "border-white/10" : "border-black/10"}`}>
                  <legend className={`px-2 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                    Select Shoot ID*
                  </legend>
                  <Select
                    value={form.shootId}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, shootId: value }))}
                  >
                    <SelectTrigger className={`h-auto border-0 bg-transparent px-0 py-1 shadow-none focus:ring-0 ${isDark ? "text-white" : "text-black"}`}>
                      <SelectValue placeholder="Select a shoot" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "border-[#333] bg-[#111] text-white" : "border-[#E5E5E5] bg-white text-black"}>
                      {SHOOT_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </fieldset>

                <fieldset className={`rounded-[12px] border px-4 pb-4 pt-2 ${isDark ? "border-white/10" : "border-black/10"}`}>
                  <legend className={`px-2 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                    Select Dispute Type*
                  </legend>
                  <Select
                    value={form.disputeType}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, disputeType: value }))}
                  >
                    <SelectTrigger className={`h-auto border-0 bg-transparent px-0 py-1 shadow-none focus:ring-0 ${isDark ? "text-white" : "text-black"}`}>
                      <SelectValue placeholder="Choose type" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "border-[#333] bg-[#111] text-white" : "border-[#E5E5E5] bg-white text-black"}>
                      {DISPUTE_TYPES.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </fieldset>

                <fieldset className={`rounded-[12px] border px-4 pb-4 pt-2 ${isDark ? "border-white/10" : "border-black/10"}`}>
                  <legend className={`px-2 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>Description</legend>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Add details about the dispute"
                    rows={4}
                    className={`min-h-[120px] w-full resize-none border-0 bg-transparent px-0 py-1 text-sm outline-none placeholder:text-sm ${isDark ? "text-white placeholder:text-white/25" : "text-black placeholder:text-black/25"}`}
                  />
                </fieldset>

                <div className="space-y-3">
                  <p className={`text-sm font-medium ${isDark ? "text-white/80" : "text-black/80"}`}>Attach File</p>
                  <div
                    onDragEnter={handleDragState}
                    onDragOver={handleDragState}
                    onDragLeave={handleDragState}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex min-h-[110px] cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed px-5 text-center transition-colors ${
                      isDragging
                        ? "border-[#E8D1AB] bg-[#E8D1AB]/5"
                        : isDark
                          ? "border-white/10 bg-[#141414] hover:border-white/20"
                          : "border-black/10 bg-[#F9F9F9] hover:border-black/20"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      multiple
                      onChange={(event) => handleFiles(event.target.files)}
                    />
                    <UploadCloud size={24} className="mb-2 text-[#E8D1AB]" />
                    <p className={`text-sm ${isDark ? "text-white/75" : "text-black/75"}`}>
                      Drag & Drop Your File Here Or <span className="font-medium text-[#E8D1AB] underline">Upload</span>
                    </p>
                  </div>

                  {selectedFileLabel && (
                    <p className="text-xs text-[#E8D1AB]">{selectedFileLabel}</p>
                  )}

                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between rounded-[12px] border px-3 py-2 ${isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {item.previewUrl ? (
                              <Image
                                src={item.previewUrl}
                                alt={item.file.name}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-md object-cover"
                              />
                            ) : (
                              <div className={`flex h-10 w-10 items-center justify-center rounded-md ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                                <FileText size={16} className="text-[#E8D1AB]" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className={`truncate text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                                {item.file.name}
                              </p>
                              <p className={`text-xs ${isDark ? "text-white/40" : "text-black/45"}`}>
                                {(item.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(item.id)}
                            className={`${isDark ? "text-white/50 hover:text-white" : "text-black/50 hover:text-black"}`}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-[18px] pt-0">
                <Button
                  type="submit"
                  className="h-12 w-full rounded-lg bg-[#E8D1AB] text-black hover:bg-[#d9c08a]"
                >
                  <Plus size={16} className="mr-2" />
                  Save & Update
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isSuccessOpen && (
        <Dialog
          open={isSuccessOpen}
          onOpenChange={(open) => {
            setIsSuccessOpen(open);
            if (!open) {
              setSuccessDetails(null);
            }
          }}
        >
        <DialogContent className="w-[calc(100vw-24px)] max-w-[352px] overflow-hidden rounded-[22px] border border-white/15 bg-[#050505] p-0 text-white shadow-[0_30px_90px_rgba(0,0,0,0.6)] [&>button]:hidden">
            <DialogTitle className="sr-only">Dispute Submitted Successfully</DialogTitle>

            <div className="flex flex-col px-4 pb-4 pt-4">
              <div className="relative mx-auto h-[156px] w-[270px]">
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
                <h2 className="text-[18px] font-medium leading-tight text-white sm:text-[20px]">
                  Dispute Submitted Successfully
                </h2>
                <p className="mx-auto mt-2 max-w-[280px] text-[11px] leading-[1.45] text-white/55 sm:text-[12px]">
                  Your dispute has been received and is now under review. You will be notified of any updates.
                </p>
              </div>

              <div className="mt-4 rounded-[14px] border border-white/5 bg-[#121212] px-4 py-3.5">
                <div className="space-y-2.5">
                  {[
                    { label: "Dispute ID", value: successDetails?.disputeId || "-" },
                    { label: "Booking ID", value: successDetails?.bookingId || "-" },
                    { label: "Status", value: successDetails?.status || "-" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-4">
                      <span className="text-[11px] text-white/40">{row.label}</span>
                      <span
                        className={`text-[11px] font-medium ${
                          row.label === "Status"
                            ? "rounded-full border border-[#E26E67]/20 bg-[#E26E67]/10 px-2.5 py-0.5 text-[#E26E67]"
                            : "text-white"
                        }`}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                variant="beige"
                onClick={() => {
                  setIsSuccessOpen(false);
                  setSuccessDetails(null);
                }}
                className="mt-4 h-11 w-full rounded-[12px] text-[13px] font-medium text-black transition-all active:scale-[0.97]"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
