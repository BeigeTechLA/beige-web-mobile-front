"use client";
import React, { useState, useRef, useEffect } from "react";
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
import { X, Check, Upload, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

interface RaiseDisputeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: RaiseDisputeData) => Promise<void>;
}

export interface RaiseDisputeData {
    shootId: string;
    disputeType: string;
    description: string;
    file?: File | null;
}

type DisputeSuccessModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    disputeId: string;
    bookingId: string;
};

// Success Modal Component
function DisputeSuccessModal({
    open,
    onOpenChange,
    disputeId,
    bookingId,
}: DisputeSuccessModalProps) {
    const { isDark } = useResolvedTheme();
    const containerRef = useRef<HTMLDivElement>(null);

    if (!open) {
        return null;
    }

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
            onOpenChange(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
    };

    return (
        <div
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[140] flex items-center justify-center bg-black/82 p-3 backdrop-blur-md lg:p-5"
        >
            <div
                ref={containerRef}
                className={`relative max-h-[calc(80vh-60px)] w-full overflow-y-auto rounded-[16px] border p-5 transition-colors duration-200 flex flex-col items-center gap-3 lg:max-w-lg lg:gap-6 lg:p-8 animate-in fade-in zoom-in duration-200 ${isDark
                    ? "border-white/40 bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.62)]"
                    : "border-[#E3E3E3] bg-white text-[#101010] shadow-[0_24px_80px_rgba(16,16,16,0.18)]"
                    }`}
            >
                <div className="relative h-[220px] w-[360px]">
                    <Image
                        src="/images/misc/PaymentSuccess.gif"
                        alt="Dispute Submitted Successfully"
                        fill
                        className="object-contain"
                        priority
                        unoptimized
                    />
                </div>

                <div className="flex flex-col items-center gap-2 text-center lg:gap-3">
                    <h2 className={`pr-4 text-lg font-bold lg:text-3xl ${isDark ? "text-white" : "text-[#101010]"}`}>
                        Dispute Submitted Successfully
                    </h2>
                    <p className={`text-xs lg:text-sm ${isDark ? "text-white/80" : "text-[#32323299]"}`}>
                        Your dispute has been received and is now under review.
                        <br />
                        You will be notified of any updates.
                    </p>
                </div>

                {/* Details Card */}
                <div className={`w-full rounded-[8px] border p-4 ${isDark ? "border-white/10 bg-[#111111]" : "border-[#E3E3E3] bg-[#F9F9F9]"
                    }`}>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className={`text-sm ${isDark ? "text-white/55" : "text-[#32323299]"}`}>Dispute ID</span>
                            <span className={`text-sm font-medium ${isDark ? "text-white" : "text-[#101010]"}`}>{disputeId}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={`text-sm ${isDark ? "text-white/55" : "text-[#32323299]"}`}>Booking ID</span>
                            <span className={`text-sm font-medium ${isDark ? "text-white" : "text-[#101010]"}`}>{bookingId}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={`text-sm ${isDark ? "text-white/55" : "text-[#32323299]"}`}>Status</span>
                            <span className="rounded-full border border-[#EF4444]/20 bg-[#EF4444]/10 px-2.5 py-0.5 text-xs font-medium text-[#EF4444]">
                                Dispute - Open
                            </span>
                        </div>
                    </div>
                </div>

                <Button
                    type="button"
                    onClick={handleClose}
                    className={`h-10 w-full rounded-lg px-5 text-sm font-semibold lg:h-12 lg:text-base ${isDark
                        ? "bg-[#EED4A7] text-black hover:bg-[#EED4A7]/92"
                        : "bg-[#E5D5B8] text-[#101010] hover:bg-[#DCC79F]"
                        }`}
                >
                    Close
                </Button>
            </div>
        </div>
    );
}

// Main Raise Dispute Modal Component
export default function RaiseDisputeModal({
    open,
    onOpenChange,
    onSubmit,
}: RaiseDisputeModalProps) {
    const [formData, setFormData] = useState<RaiseDisputeData>({
        shootId: "",
        disputeType: "",
        description: "",
        file: null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [submittedData, setSubmittedData] = useState({
        disputeId: "",
        bookingId: "",
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Sample shoot IDs - replace with actual data
    const shootIds = [
        { id: "BK-001", name: "Corporate Headshots Session" },
        { id: "BK-002", name: "Wedding Photography Package" },
        { id: "BK-003", name: "Product Photography - E-commerce" },
        { id: "BK-004", name: "Real Estate Virtual Tour" },
        { id: "BK-005", name: "Event Coverage - Conference" },
    ];

    const disputeTypes = [
        "Payment Not Received",
        "Incorrect Amount",
        "Service Quality Issue",
        "Delivery Delay",
        "Contract Discrepancy",
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
            await onSubmit(formData);

            // Generate random dispute ID for demo
            const newDisputeId = `DIS-${Math.floor(100 + Math.random() * 900)}`;
            const selectedShoot = shootIds.find((s) => s.id === formData.shootId);

            setSubmittedData({
                disputeId: newDisputeId,
                bookingId: formData.shootId,
            });

            setShowSuccess(true);
            onOpenChange(false);
            // Reset form
            setFormData({
                shootId: "",
                disputeType: "",
                description: "",
                file: null,
            });
        } catch (error) {
            console.error("Error submitting dispute:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        //setShowSuccess(false);
        onOpenChange(false);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[calc(100vw-24px)] max-w-[460px] overflow-hidden rounded-[2px] border border-white/40 bg-black/82 backdrop-blur-md p-0 text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)] sm:max-w-[500px] [&>button]:hidden">
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
                                >
                                    <SelectTrigger className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-left text-[14px] text-white shadow-none focus:ring-0 data-[placeholder]:text-white/35 [&>svg]:text-white [&>svg]:transition-transform [&>svg]:duration-200 [&[data-state=open]>svg]:rotate-180">
                                        <SelectValue placeholder="Select shoot ID" />
                                    </SelectTrigger>
                                    <SelectContent className="border-white/10 bg-[#111111] text-white">
                                        {shootIds.map((shoot) => (
                                            <SelectItem key={shoot.id} value={shoot.id}>
                                                {shoot.id} - {shoot.name}
                                            </SelectItem>
                                        ))}
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
                                //onClick={handleClose}
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
                onOpenChange={setShowSuccess}
                disputeId={submittedData.disputeId}
                bookingId={submittedData.bookingId}
            />
        </>
    );
}