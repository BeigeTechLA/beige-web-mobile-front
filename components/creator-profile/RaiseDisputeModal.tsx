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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Check, Upload, File } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface SuccessModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    disputeId: string;
    bookingId: string;
}

// Success Modal Component
function DisputeSuccessModal({
    open,
    onOpenChange,
    disputeId,
    bookingId,
}: SuccessModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-24px)] max-w-[420px] overflow-hidden rounded-[2px] border border-white/25 bg-black p-0 text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)] [&>button]:hidden">
                <DialogTitle className="sr-only">Dispute Submitted Successfully</DialogTitle>

                <div className="flex flex-col items-center justify-center px-6 py-8">
                    {/* Success Icon with Celebration Effect */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 animate-ping rounded-full bg-[#E8D1AB]/20" />
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#E8D1AB]">
                            <Check className="h-10 w-10 text-black" strokeWidth={3} />
                        </div>
                        {/* Celebration dots */}
                        <div className="absolute -top-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#10B981] animate-bounce" />
                        <div className="absolute -right-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#3B82F6] animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="absolute -bottom-2 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#F59E0B] animate-bounce" style={{ animationDelay: "0.2s" }} />
                        <div className="absolute -left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#EF4444] animate-bounce" style={{ animationDelay: "0.3s" }} />
                    </div>

                    {/* Title */}
                    <h2 className="mb-2 text-[22px] font-semibold leading-none text-white">
                        Dispute Submitted Successfully
                    </h2>

                    {/* Description */}
                    <p className="mb-6 text-center text-sm text-white/60">
                        Your dispute has been received and is now under review.
                        <br />
                        You will be notified of any updates.
                    </p>

                    {/* Details Card */}
                    <div className="mb-6 w-full rounded-[8px] border border-white/10 bg-[#111111] p-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white/55">Dispute ID</span>
                                <span className="text-sm font-medium text-white">{disputeId}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white/55">Booking ID</span>
                                <span className="text-sm font-medium text-white">{bookingId}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white/55">Status</span>
                                <span className="rounded-full border border-[#EF4444]/20 bg-[#EF4444]/10 px-2.5 py-0.5 text-xs font-medium text-[#EF4444]">
                                    Dispute - Open
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Close Button */}
                    <DialogClose asChild>
                        <button
                            type="button"
                            className="w-full rounded-[8px] bg-[#E8D1AB] px-4 py-3 text-sm font-medium text-black transition hover:bg-[#F5EBD8]"
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
        setShowSuccess(false);
        onOpenChange(false);
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