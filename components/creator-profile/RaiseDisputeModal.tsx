"use client";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

// Success Modal Component
function DisputeSuccessModal({
    open,
    onOpenChange,
    details,
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
            <DialogContent className="w-[calc(100vw-24px)] max-w-[440px] overflow-hidden rounded-[22px] border border-white/15 bg-[#050505] p-0 text-white shadow-[0_30px_90px_rgba(0,0,0,0.6)] [&>button]:hidden">
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
                        <h2 className="text-[18px] font-medium leading-tight text-white sm:text-[20px]">
                            Dispute Submitted Successfully
                        </h2>
                        <p className="mx-auto mt-2 max-w-[340px] text-[12px] leading-[1.5] text-white/55 sm:text-[13px]">
                            Your dispute has been received and is now under review. You will be notified of any updates.
                        </p>
                    </div>

                    <div className="mt-5 rounded-[14px] border border-white/5 bg-[#121212] px-5 py-4">
                        <div className="space-y-2.5">
                            {summaryRows.map((row) => (
                                <div key={row.label} className="flex items-center justify-between gap-4">
                                    <span className="shrink-0 text-xs text-white/40">{row.label}</span>
                                    <span
                                        className={`max-w-[220px] truncate text-right text-xs font-medium ${
                                            row.isStatus
                                                ? "rounded-full border border-[#E26E67]/20 bg-[#E26E67]/10 px-2.5 py-0.5 text-[#E26E67]"
                                                : "text-white"
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

// Main Raise Dispute Modal Component
export default function RaiseDisputeModal({
    open,
    onOpenChange,
    onSubmit,
    initialShootId = null,
    lockShootSelection = false,
    shootOptions = [],
}: RaiseDisputeModalProps) {
    const [formData, setFormData] = useState<RaiseDisputeData>({
        shootId: "",
        disputeType: "",
        description: "",
        file: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [submittedData, setSubmittedData] = useState<DisputeSubmissionDetails>(DEFAULT_SUBMISSION_DETAILS);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const resetForm = () => {
        setFormData({
            shootId: "",
            disputeType: "",
            description: "",
            file: null,
        });
        setIsDragging(false);
    };

    useEffect(() => {
        if (open) {
            setSubmittedData(DEFAULT_SUBMISSION_DETAILS);
        } else {
            resetForm();
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const nextShootId = initialShootId === null || initialShootId === undefined
            ? ""
            : String(initialShootId);

        setFormData((prev) => ({
            ...prev,
            shootId: nextShootId,
        }));
    }, [initialShootId, lockShootSelection, open]);

    const disputeTypes = [
        "Payment Not Received",
        "Incorrect Amount",
        "Other",
    ];

    const handleInputChange = (field: keyof RaiseDisputeData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileSelect = (file: File) => {
        setFormData((prev) => ({ ...prev, file }));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.shootId || !formData.disputeType) {
            return;
        }

        setIsSubmitting(true);
        try {
            const selectedShoot = shootOptions.find((s) => String(s.bookingId) === String(formData.shootId));
            const result = await onSubmit({
                ...formData,
                creatorEarningId: selectedShoot?.creatorEarningId,
            });
            const submission = result || null;

            setSubmittedData({
                disputeId: submission?.disputeId || "-",
                bookingId: submission?.bookingId || formData.shootId,
                shootLabel: submission?.shootLabel || selectedShoot?.label || formData.shootId,
                disputeType: submission?.disputeType || formData.disputeType,
                status: submission?.status || "Dispute Open",
            });

            onOpenChange(false);
            setShowSuccess(true);

            resetForm();
        } catch (error) {
            toast.error(
                error instanceof Error && error.message
                    ? error.message
                    : "Failed to submit dispute"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[calc(100vw-24px)] max-w-[460px] overflow-hidden rounded-[2px] border border-white/40 bg-black p-0 text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)] sm:max-w-[500px] [&>button]:hidden">
                    <DialogTitle className="sr-only">Raise New Dispute</DialogTitle>

                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/40 px-5 py-4">
                        <h2 className="text-[22px] font-semibold leading-none">
                            Raise New Dispute
                        </h2>
                        <DialogClose asChild>
                            <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2B2525] text-white/90 transition hover:bg-[#3A3333]"
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
                            {/* Select Shoot ID */}
                            <fieldset className="rounded-[8px] border border-white/50 px-4 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/60">
                                    Select Shoot ID*
                                </legend>
                                <Select
                                    value={formData.shootId}
                                    onValueChange={(value) => handleInputChange("shootId", value)}
                                    disabled={lockShootSelection}
                                >
                                    <SelectTrigger className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-left text-[14px] text-white shadow-none focus:ring-0 data-[placeholder]:text-white/35 [&>svg]:text-white [&>svg]:transition-transform [&>svg]:duration-200 [&[data-state=open]>svg]:rotate-180">
                                        <SelectValue placeholder="Select shoot ID" />
                                    </SelectTrigger>
                                    <SelectContent className="border-white/10 bg-[#111111] text-white">
                                        {shootOptions.length > 0 ? (
                                            shootOptions.map((shoot) => (
                                                <SelectItem key={String(shoot.creatorEarningId)} value={String(shoot.bookingId)}>
                                                    {shoot.label}{shoot.amountLabel ? ` - ${shoot.amountLabel}` : ""}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="__no_eligible_shoots__" disabled>
                                                No eligible shoots available for dispute
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </fieldset>

                            {/* Select Dispute Type */}
                            <fieldset className="rounded-[8px] border border-white/50 px-4 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/60">
                                    Select Dispute Type*
                                </legend>
                                <Select
                                    value={formData.disputeType}
                                    onValueChange={(value) => handleInputChange("disputeType", value)}
                                >
                                    <SelectTrigger className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-left text-[14px] text-white shadow-none focus:ring-0 data-[placeholder]:text-white/35 [&>svg]:text-white [&>svg]:transition-transform [&>svg]:duration-200 [&[data-state=open]>svg]:rotate-180">
                                        <SelectValue placeholder="Select dispute type" />
                                    </SelectTrigger>
                                    <SelectContent className="border-white/10 bg-[#111111] text-white">
                                        {disputeTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </fieldset>

                            {/* Description */}
                            <fieldset className="rounded-[8px] border border-white/50 px-4 pb-3 pt-1.5">
                                <legend className="px-1 text-[11px] leading-none text-white/60">
                                    Description
                                </legend>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange("description", e.target.value)}
                                    placeholder="Describe your dispute in detail..."
                                    className="min-h-[100px] resize-none rounded-none border-0 bg-transparent px-0 py-0 text-[14px] text-white placeholder:text-white/35 focus-visible:ring-0"
                                />
                            </fieldset>

                            {/* Attach File */}
                            <div>
                                <label className="mb-1.5 block text-[13px] text-white/60">
                                    Attach File
                                </label>
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`flex cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-white/25 bg-[#111111]/50 p-6 transition-colors ${isDragging ? "border-[#E8D1AB] bg-[#E8D1AB]/10" : "hover:border-white/40"
                                        }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileSelect(file);
                                        }}
                                    />
                                    {formData.file ? (
                                        <div className="flex items-center gap-3">
                                            <File className="h-5 w-5 text-[#E8D1AB]" />
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-white">
                                                    {formData.file.name}
                                                </p>
                                                <p className="text-xs text-white/50">
                                                    {(formData.file.size / 1024).toFixed(2)} KB
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="mb-2 h-6 w-6 text-white/40" />
                                            <p className="text-center text-sm text-white/70">
                                                Drag & Drop Your File Here Or{" "}
                                                <span className="text-[#E8D1AB]">Upload</span>
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={isSubmitting || !formData.shootId || !formData.disputeType}
                                className="mt-2 w-full rounded-[8px] bg-[#E8D1AB] py-3 text-sm font-medium text-black transition hover:bg-[#F5EBD8] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting ? "Submitting..." : "Save & Update"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Success Modal */}
            <DisputeSuccessModal
                open={showSuccess}
                onOpenChange={(isOpen) => {
                    setShowSuccess(isOpen);
                    if (!isOpen) {
                        setSubmittedData(DEFAULT_SUBMISSION_DETAILS);
                        onOpenChange(false);
                    }
                }}
                details={submittedData}
            />
        </>
    );
}
