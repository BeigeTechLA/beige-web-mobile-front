"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import {
    Calendar,
    MapPin,
    Camera,
    ChevronDown,
    ArrowLeft,
    Percent,
    MapPinned,
    Copy,
    DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    useGetLeadByIdQuery,
    useGenerateDiscountCodeMutation,
} from "@/lib/redux/features/sales/salesApi";
import { LEAD_TYPE_LABELS } from "@/types/sales";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/discountHelpers";

// Helper function to map lead status to UI format
const mapLeadStatusToUI = (status: string): string => {
    if (status === "booked") return "Booked";
    if (status === "abandoned") return "Cancelled";
    return "In-Progress";
};

const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        Booked: "bg-[#D4FFE4] text-[#16A34A] border-[#D4FFE4]",
        Cancelled: "bg-[#fbd9d3] text-red-500 border-[#fbd9d3]",
        "In-Progress": "bg-[#FFF4C9] text-[#BA6605] border-[#FFF4C9]",
    };

    const currentStyle =
        styles[status] || "bg-gray-100 text-gray-800 border-gray-200";

    return (
        <span
            className={`px-7 py-2 rounded-full text-base font-medium border ${currentStyle}`}
        >
            {status}
        </span>
    );
};

export default function SalesLeadDetailsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const params = use(paramsPromise);
    const leadId = params.id;

    // Discount States
    const [discountValue, setDiscountValue] = useState("");
    const [discountType, setDiscountType] = useState<"percentage" | "fixed_amount">("percentage");
    const [usageType, setUsageType] = useState<"one_time" | "multi_use">("one_time");
    
    // UI States for custom dropdowns
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [isUsageDropdownOpen, setIsUsageDropdownOpen] = useState(false);

    const [showDiscountCode, setShowDiscountCode] = useState(false);
    const [generatedCode, setGeneratedCode] = useState<string>("");

    // Fetch real lead data
    const {
        data: leadData,
        isLoading,
        error,
    } = useGetLeadByIdQuery(parseInt(leadId), {
        skip: !leadId,
    });

    // Discount code generation
    const [generateDiscountCode, { isLoading: isGenerating }] =
        useGenerateDiscountCodeMutation();

    const lead = leadData;
    const booking = lead?.booking;

    // Extract data with defaults
    const clientName = lead?.client_name || lead?.guest_email || "Unknown Client";
    const initials = clientName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    const email = lead?.guest_email || "No email";
    const phone = lead?.user?.phone_number || "N/A";
    const leadType = lead ? LEAD_TYPE_LABELS[lead.lead_type as keyof typeof LEAD_TYPE_LABELS] : "Unknown";
    const status = lead ? mapLeadStatusToUI(lead.lead_status) : "Unknown";

    const bookingDate = booking?.event_date
        ? new Date(booking.event_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
        : "Not set";
    const location = booking?.event_location || "Not specified";
    const shootType = booking?.event_type || "Not specified";

    const basePrice = booking?.budget ? (typeof booking.budget === 'string' ? parseFloat(booking.budget) || 0 : booking.budget) : 0;
    const taxes = basePrice * 0.09; // 9% tax estimate
    const total = basePrice + taxes;

    // Handle discount code generation
    const handleGenerateDiscount = async () => {
        const val = parseFloat(discountValue);

        if (!discountValue || val <= 0) {
            toast.error("Please enter a valid discount value");
            return;
        }

        if (discountType === "percentage" && val > 100) {
            toast.error("Discount cannot exceed 100%");
            return;
        }

        if (discountType === "fixed_amount" && val > total) {
            toast.error("Discount amount cannot exceed total price");
            return;
        }

        try {
            const response = await generateDiscountCode({
                lead_id: parseInt(leadId),
                booking_id: lead?.booking_id,
                discount_type: discountType,
                discount_value: val,
                usage_type: usageType,
                max_uses: usageType === "multi_use" ? 10 : 1,
            }).unwrap();

            if (response.success && response.data) {
                setGeneratedCode(response.data.code);
                setShowDiscountCode(true);
                toast.success("Discount code generated successfully!");
            }
        } catch (error: any) {
            console.error("Error generating discount:", error);
            toast.error(error?.data?.message || "Failed to generate discount code");
        }
    };

    // Handle copy code
    const handleCopyCode = async () => {
        if (generatedCode) {
            await copyToClipboard(generatedCode);
            toast.success("Code copied to clipboard!");
        }
    };

    if (isLoading) {
        return (
            <div className="text-white font-sans flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E8D1AB]"></div>
            </div>
        );
    }

    if (error || !lead) {
        return (
            <div className="text-white font-sans">
                <Button
                    onClick={() => router.back()}
                    className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0 bg-transparent"
                >
                    <ArrowLeft size={24} />
                    <span className="text-sm font-medium">Back</span>
                </Button>
                <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl p-8 text-center">
                    <p className="text-white/60">Lead not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="text-white font-sans">
            {/* Back Button */}
            <Button
                onClick={() => router.back()}
                className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0 bg-transparent"
            >
                <ArrowLeft size={24} />
                <span className="text-sm font-medium">Back</span>
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Content Area (Left/Middle) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Client Details Card */}
                    <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
                        <h2 className="text-xl font-medium text-white p-4 lg:p-9">
                            Client Details
                        </h2>
                        <div
                            className="h-[1px] w-full"
                            style={{
                                backgroundImage: `linear-gradient(to right, #ffffff66 50%, transparent 50%)`,
                                backgroundSize: "30px 1px",
                                backgroundRepeat: "repeat-x",
                            }}
                        />
                        <div className="flex flex-col gap-3 lg:gap-6 p-4 lg:p-9">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-5">
                                    <div className="w-[84px] h-[84px] rounded-2xl bg-[#FFF6D9] text-[#000000] border border-[#FFF6D9] flex items-center justify-center text-[30px] font-semibold">
                                        {initials}
                                    </div>
                                    <div>
                                        <h1 className="text-[22px] font-semibold">{clientName}</h1>
                                    </div>
                                </div>
                                <StatusBadge status={status} />
                            </div>
                            <div className="flex flex-wrap gap-y-4 gap-x-8 text-sm text-[#AAA7A7]">
                                <p>
                                    Email ID : <span className="text-white">{email}</span>
                                </p>
                                <div className="w-[1px] h-4 bg-white hidden md:block" />
                                <p>
                                    Phone Number : <span className="text-white">{phone}</span>
                                </p>
                                <div className="w-[1px] h-4 bg-white hidden md:block" />
                                <p>
                                    Lead Type : <span className="text-white">{leadType}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Booking Summary Card */}
                    <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
                        <h2 className="text-xl font-medium text-white p-4 lg:p-9">
                            Booking Summary
                        </h2>
                        <div
                            className="h-[1px] w-full"
                            style={{
                                backgroundImage: `linear-gradient(to right, #ffffff66 50%, transparent 50%)`,
                                backgroundSize: "30px 1px",
                                backgroundRepeat: "repeat-x",
                            }}
                        />
                        <div className="flex flex-col gap-3 lg:gap-5 p-4 lg:p-9">
                            {/* Date */}
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-white/5 text-[#8E8E8E]">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-[#71717B] font-medium mb-1">
                                        Shoot Date
                                    </p>
                                    <p className="text-base font-medium">{bookingDate}</p>
                                </div>
                            </div>
                            {/* Location */}
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-white/5 text-[#8E8E8E]">
                                    <MapPinned size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-[#71717B] font-medium mb-1">
                                        Location
                                    </p>
                                    <p className="text-base font-medium max-w-md">{location}</p>
                                </div>
                            </div>
                            {/* Type */}
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-white/5 text-[#8E8E8E]">
                                    <Camera size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-[#71717B] font-medium mb-1">
                                        Shoot Type
                                    </p>
                                    <p className="text-base font-medium capitalize">
                                        {shootType}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Breakdown Card */}
                    <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
                        <h2 className="text-xl font-medium text-white p-4 lg:p-9">
                            Pricing Breakdown
                        </h2>
                        <div
                            className="h-[1px] w-full"
                            style={{
                                backgroundImage: `linear-gradient(to right, #ffffff66 50%, transparent 50%)`,
                                backgroundSize: "30px 1px",
                                backgroundRepeat: "repeat-x",
                            }}
                        />
                        <div className="flex flex-col gap-3 lg:gap-6 p-4 lg:p-9 lg:pb-6">
                            <div className="flex justify-between font-medium">
                                <span className="text-[#71717B] text-xs">Base Price</span>
                                <span className="text-white">
                                    ${basePrice.toLocaleString()}/-
                                </span>
                            </div>
                            <div className="flex justify-between font-medium">
                                <span className="text-[#71717B] text-xs">Taxes & Fees</span>
                                <span className="text-white">${taxes.toFixed(2)}/-</span>
                            </div>
                        </div>
                        <div className="h-[1px] w-full bg-[#3D3D3D]" />
                        <div className="p-4 lg:px-9 lg:py-6 flex justify-between items-center">
                            <span className="text-sm font-medium">Total Amount</span>
                            <span className="text-lg font-semibold text-[#E8D1AB]">
                                ${total.toFixed(2)}/-
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Discount Generator */}
                <div className="lg:col-span-4">
                    <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
                        <h2 className="text-xl font-medium text-white p-4 lg:p-9">
                            Generate Discount
                        </h2>
                        <div
                            className="h-[1px] w-full"
                            style={{
                                backgroundImage: `linear-gradient(to right, #ffffff66 50%, transparent 50%)`,
                                backgroundSize: "30px 1px",
                                backgroundRepeat: "repeat-x",
                            }}
                        />
                        <div className="flex flex-col gap-3 lg:gap-6 p-4 lg:p-9">
                            
                            {/* Discount Type Dropdown */}
                            <div className="relative">
                                <label className="absolute -top-2.5 left-4 bg-[#171717] px-2 text-sm text-white/60 capitalize tracking-widest z-10">
                                    Discount Type
                                </label>
                                <button 
                                    onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                                    className="flex items-center justify-between w-full border border-white/50 rounded-xl px-4 py-4 text-left text-base text-white/60 hover:border-white/20"
                                >
                                    {discountType === "percentage" ? "Percentage (%)" : "Fixed Amount ($)"}
                                    <ChevronDown size={18} />
                                </button>
                                {isTypeDropdownOpen && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-[#171717] border border-[#3D3D3D] rounded-xl z-20 overflow-hidden">
                                        <div 
                                            className="px-4 py-3 hover:bg-white/5 cursor-pointer text-sm"
                                            onClick={() => { setDiscountType("percentage"); setIsTypeDropdownOpen(false); }}
                                        >
                                            Percentage (%)
                                        </div>
                                        <div 
                                            className="px-4 py-3 hover:bg-white/5 cursor-pointer text-sm"
                                            onClick={() => { setDiscountType("fixed_amount"); setIsTypeDropdownOpen(false); }}
                                        >
                                            Fixed Amount ($)
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Value Input (Percentage or Amount) */}
                            <div className="relative">
                                <label className="absolute -top-2.5 left-4 bg-[#171717] px-2 text-sm text-white/60 capitalize tracking-widest z-10">
                                    {discountType === "percentage" ? "Discount Percentage" : "Discount Amount"}
                                </label>
                                <div className="flex items-center border border-white/50 rounded-xl px-4 py-4 bg-transparent focus-within:border-[#E8D1AB]/50 transition-all">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="bg-transparent w-full outline-none text-white text-base"
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                    />
                                    {discountType === "percentage" ? (
                                        <Percent size={20} className="text-white" />
                                    ) : (
                                        <DollarSign size={20} className="text-white" />
                                    )}
                                </div>
                            </div>

                            {/* Usage Type Dropdown */}
                            {/* <div className="relative">
                                <label className="absolute -top-2.5 left-4 bg-[#171717] px-2 text-sm text-white/60 capitalize tracking-widest z-10">
                                    Usage Type
                                </label>
                                <button 
                                    onClick={() => setIsUsageDropdownOpen(!isUsageDropdownOpen)}
                                    className="flex items-center justify-between w-full border border-white/50 rounded-xl px-4 py-4 text-left text-base text-white/60 hover:border-white/20"
                                >
                                    {usageType === "one_time" ? "Single Use" : "Multi Use"}
                                    <ChevronDown size={18} />
                                </button>
                                {isUsageDropdownOpen && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-[#171717] border border-[#3D3D3D] rounded-xl z-20 overflow-hidden">
                                        <div 
                                            className="px-4 py-3 hover:bg-white/5 cursor-pointer text-sm"
                                            onClick={() => { setUsageType("one_time"); setIsUsageDropdownOpen(false); }}
                                        >
                                            Single Use
                                        </div>
                                        <div 
                                            className="px-4 py-3 hover:bg-white/5 cursor-pointer text-sm"
                                            onClick={() => { setUsageType("multi_use"); setIsUsageDropdownOpen(false); }}
                                        >
                                            Multi Use
                                        </div>
                                    </div>
                                )}
                            </div> */}

                            {/* Action Button */}
                            <Button
                                className="h-12 w-full bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010] font-semibold py-3.5 rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleGenerateDiscount}
                                disabled={isGenerating || !discountValue}
                            >
                                {isGenerating ? "Generating..." : "Generate Code"}
                            </Button>

                            {showDiscountCode && generatedCode && (
                                <div className="flex flex-col gap-2 bg-[#0A0808] border border-white/50 rounded-xl p-4 mt-2">
                                    <p className="text-sm font-medium text-white">
                                        Generated Code
                                    </p>
                                    <div className="flex gap-2 items-center">
                                        <div className="flex-1 px-3 py-2 bg-[#171717] border border-[#3F3F46] rounded-sm text-sm text-[#E8D1AB] font-mono">
                                            {generatedCode}
                                        </div>
                                        <Button
                                            className="h-8 w-8 bg-[#171717] hover:bg-[#272626] p-0"
                                            onClick={handleCopyCode}
                                        >
                                            <Copy size={16} className="text-white" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}