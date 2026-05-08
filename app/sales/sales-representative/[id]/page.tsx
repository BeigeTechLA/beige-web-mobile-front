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
  DollarSign,
  MapPinned,
  Copy,
  Plus,
  Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetLeadByIdQuery,
  useGenerateDiscountCodeMutation,
} from "@/lib/redux/features/sales/salesApi";
import { LEAD_TYPE_LABELS } from "@/types/sales";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/discountHelpers";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { parseDate } from "@/src/components/landing/lib/utils";

// Helper function to map lead status to UI format
const mapLeadStatusToUI = (status: string): string => {
  if (status === "booked") return "Booked";
  if (status === "abandoned") return "Cancelled";
  return "In-Progress";
};

export default function SalesSalesRepDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const leadId = params.id;

  const [discount, setDiscount] = useState("");
  const [showDiscountCode, setShowDiscountCode] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed_amount">("percentage");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [usageType, setUsageType] = useState<"one_time" | "multi_use">(
    "one_time",
  );
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const manualPaymentSummary = React.useMemo(() => {
    const manualActivities = (lead?.activities || [])
      .filter((activity: any) => activity?.activity_type === "payment_completed" && activity?.activity_data)
      .map((activity: any) => {
        try {
          const payload = typeof activity.activity_data === "string"
            ? JSON.parse(activity.activity_data)
            : activity.activity_data;
          if (!payload || (payload as any).payment_method !== "manual") return null;
          return payload as any;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as any[];

    const hasFullPayment = manualActivities.some((entry) => entry.payment_type === "full");
    const partialPaid = manualActivities.reduce((sum, entry) => {
      if (entry.payment_type !== "partial") return sum;
      const numeric = Number(entry.amount || 0);
      return sum + (Number.isFinite(numeric) ? numeric : 0);
    }, 0);

    const resolvedTotal = total > 0 ? total : 0;
    const paidAmount = hasFullPayment ? resolvedTotal : partialPaid;
    const pendingAmount = Math.max(resolvedTotal - paidAmount, 0);

    return {
      hasFullPayment,
      paidAmount,
      pendingAmount,
    };
  }, [lead?.activities, total]);

  const additionalPaymentDetails = React.useMemo(() => {
    const rawAdditionalPayment = lead?.booking?.primary_quote?.additional_payment;
    if (!rawAdditionalPayment) return null;

    const additionalAmount = Number(rawAdditionalPayment.additional_amount ?? 0);
    const previouslyPaidAmount = Number(rawAdditionalPayment.previously_paid_amount ?? 0);
    const revisedTotal = Number(rawAdditionalPayment.revised_total ?? 0);
    const outstandingAmount = Number(
      rawAdditionalPayment.outstanding_amount ?? Math.max(revisedTotal - previouslyPaidAmount, 0)
    );
    
    if (
      additionalAmount <= 0 &&
      previouslyPaidAmount <= 0 &&
      revisedTotal <= 0 &&
      outstandingAmount <= 0
    ) {
      return null;
    }

    return {
      additionalAmount,
      previouslyPaidAmount,
      revisedTotal,
      outstandingAmount,
    };
  }, [lead?.booking?.primary_quote?.additional_payment]);

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
  const clientRegistrationType = lead?.user_id ? "Registered" : "Guest";
  const status = lead ? mapLeadStatusToUI(lead.lead_status) : "Unknown" as any;

  const bookingDate = booking?.event_date
    ? (parseDate(booking.event_date) || new Date(booking.event_date)).toLocaleDateString("en-US", {
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
    if (!discount || parseFloat(discount) <= 0) {
      toast.error("Please enter a valid discount percentage");
      return;
    }

    if (parseFloat(discount) > 100) {
      toast.error("Discount cannot exceed 100%");
      return;
    }

    try {
      const response = await generateDiscountCode({
        lead_id: parseInt(leadId),
        booking_id: lead?.booking_id,
        discount_type: "percentage",
        discount_value: parseFloat(discount),
        usage_type: usageType,
        max_uses: usageType === "multi_use" ? 10 : undefined,
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
        <div className="lg:col-span-8 space-y-3 lg:space-y-6">
          {/* Client Details Card */}
          <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
            <h2 className="lg:text-xl font-medium text-white p-5 lg:p-9">
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
            <div className="flex flex-col gap-3 lg:gap-6 p-5 lg:p-9">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-13 h-13 lg:w-[84px] lg:h-[84px] rounded-lg lg:rounded-2xl bg-[#FFF6D9] text-[#000000] border border-[#FFF6D9] flex items-center justify-center text-xl lg:text-[30px] font-semibold shrink-0">
                    {initials}
                  </div>
                  <div className="flex flex-col gap-2">
                    <h1 className="lg:text-[22px] font-semibold">{clientName}</h1>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          clientRegistrationType === "Registered"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {clientRegistrationType}
                      </span>
                    </div>
                    <div className=" lg:hidden">
                      <StatusBadge status={status} />
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <StatusBadge status={status} />
                </div>
              </div>
              <div className="flex flex-col lg:flex-row flex-wrap gap-3 lg:gap-y-4 lg:gap-x-8 text-sm text-[#AAA7A7]">
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
            <h2 className="lg:text-xl font-medium text-white p-4 lg:p-9">
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
                <div className="p-3 rounded-lg lg:rounded-xl bg-white/5 text-[#8E8E8E]">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs text-[#71717B] font-medium mb-1">
                    Shoot Date
                  </p>
                  <p className="text-xs lg:text-base font-medium">{bookingDate}</p>
                </div>
              </div>
              {/* Location */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg lg:rounded-xl bg-white/5 text-[#8E8E8E]">
                  <MapPinned size={20} />
                </div>
                <div>
                  <p className="text-xs text-[#71717B] font-medium mb-1">
                    Location
                  </p>
                  <p className="text-xs lg:text-base font-medium max-w-md">{location}</p>
                </div>
              </div>
              {/* Type */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg lg:rounded-xl bg-white/5 text-[#8E8E8E]">
                  <Camera size={20} />
                </div>
                <div>
                  <p className="text-xs text-[#71717B] font-medium mb-1">
                    Shoot Type
                  </p>
                  <p className="text-xs lg:text-base font-medium capitalize">
                    {shootType}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
            <h2 className="lg:text-xl font-medium text-white p-4 lg:p-9">
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
                <span className="text-sm lg:text-base text-white">
                  ${basePrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-[#71717B] text-xs">Taxes & Fees</span>
                <span className="text-sm lg:text-base text-white">${taxes.toFixed(2)}</span>
              </div>
            </div>
            {additionalPaymentDetails && (
              <div className="flex flex-col gap-3 p-4 lg:p-9 lg:py-6 border-t border-dashed border-white/10">
                <div className="flex justify-between font-medium">
                  <span className="text-[#71717B] text-xs">Old Total</span>
                  <span className="text-sm lg:text-base text-white">
                    ${(additionalPaymentDetails.revisedTotal - additionalPaymentDetails.additionalAmount).toLocaleString()}
                  </span>
                </div>
                {additionalPaymentDetails.previouslyPaidAmount > 0 && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Previously Paid</span>
                    <span className="text-sm lg:text-base text-white">
                      ${additionalPaymentDetails.previouslyPaidAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#71717B] text-xs">
                      {additionalPaymentDetails.additionalAmount < 0 ? "Reduced Amount" : "Additional Amount"}
                    </span>
                  </div>
                  <span className={`text-sm lg:text-base font-semibold ${additionalPaymentDetails.additionalAmount < 0 ? "text-red-500" : "text-white"}`}>
                    {additionalPaymentDetails.additionalAmount < 0 ? "-" : "+"}${Math.abs(additionalPaymentDetails.additionalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
            <div className="h-[1px] w-full bg-[#3D3D3D]" />
            <div className="p-4 lg:px-9 lg:py-6 flex justify-between items-center">
              <span className="text-sm font-medium">Total Amount</span>
              <span className="lg:text-lg font-semibold text-[#E8D1AB]">
                ${total.toFixed(2)}
              </span>
            </div>
            {manualPaymentSummary.paidAmount > 0 && (
              <div className="p-4 lg:px-9 lg:py-4 flex justify-between items-center border-t border-dashed border-white/10">
                <span className="text-sm font-medium text-white/70">Paid Amount</span>
                <span className="text-sm lg:text-base font-semibold text-white">
                  ${manualPaymentSummary.paidAmount.toLocaleString()}
                </span>
              </div>
            )}
            {manualPaymentSummary.pendingAmount > 0 && (
              <div className="p-4 lg:px-9 lg:py-4 flex justify-between items-center border-t border-dashed border-white/10">
                <span className="text-sm font-medium text-white/70">Remaining Amount</span>
                <span className="text-sm lg:text-base font-semibold text-[#E8D1AB]">
                  ${manualPaymentSummary.pendingAmount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Discount Generator */}
        <div className="lg:col-span-4">
          <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
            <h2 className="lg:text-xl font-medium text-white p-4 lg:p-9">
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
            <div className="flex flex-col gap-6 p-5 pt-6 lg:p-9">
              {/* Percentage Input */}
              <div className="relative">
                <label className="absolute -top-2 lg:-top-2.5 left-4 bg-[#171717] px-2 text-xs lg:text-sm text-white/60 capitalize tracking-widest">
                  Discount Percentage
                </label>
                <div className="flex items-center border border-white/50 rounded-xl px-4 py-4 bg-transparent focus-within:border-[#E8D1AB]/50 transition-all">
                  <input
                    type="number"
                    placeholder="0"
                    className="bg-transparent w-full outline-none text-white text-base"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                  <Percent size={20} className="text-white" />
                </div>
              </div>

              {/* Usage Type Dropdown */}
              <div className="relative">
                <label className="absolute -top-2 lg:-top-2.5 left-4 bg-[#171717] px-2 text-xs lg:text-sm text-white/60 capitalize tracking-widest">
                  Usage Type
                </label>
                <button className="flex items-center justify-between w-full border border-white/50 rounded-xl px-4 py-4 text-left text-base text-white/60 hover:border-white/20">
                  Select usage type
                  <ChevronDown size={18} />
                </button>
              </div>

              {/* Action Button */}
              <Button
                className="h-12 w-full bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010] font-semibold py-3.5 rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGenerateDiscount}
                disabled={isGenerating || !discount}
              >
                {isGenerating ? "Generating..." : "Generate Code"}
              </Button>

              {showDiscountCode && generatedCode && (
                <div className="flex flex-col gap-2 bg-[#0A0808] border border-white/50 rounded-xl p-4">
                  <p className="text-sm font-medium text-white">
                    Generated Code
                  </p>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 px-3 py-2 bg-[#171717] border border-[#3F3F46] rounded-sm text-sm text-[#E8D1AB] font-mono">
                      {generatedCode}
                    </div>
                    <Button
                      className="h-8 w-8 bg-[#171717] hover:bg-[#272626]"
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
