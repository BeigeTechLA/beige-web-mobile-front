"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetLeadByIdQuery,
  useGenerateDiscountCodeMutation,
} from "@/lib/redux/features/sales/salesApi";
import { LEAD_TYPE_LABELS } from "@/types/sales";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/discountHelpers";
import GeneratePaymentLink from "@/components/sales/GeneratePaymentLink";
import { LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";
import { IntentBadge } from "@/components/sales/IntentBadge";
import DottedDivider from "@/components/admin/DottedDivider";
import BookingStatusStepper from "@/components/sales/BookingStatusStepper";

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
      className={`text-nowrap px-4 py-1 rounded-full text-xs lg:text-base font-medium border lg:px-7 lg:py-2  ${currentStyle}`}
    >
      {status}
    </span>
  );
};

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;


  const [discount, setDiscount] = useState("");
  const [showDiscountCode, setShowDiscountCode] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed_amount">("percentage");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [usageType, setUsageType] = useState<"one_time" | "multi_use">("one_time");
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
  const clientName = lead?.client_name || lead?.guest_email || "Unknown User";
  const initials = clientName
    .split(" ")
    .map((n) => n[0])
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
    if (!discount || parseFloat(discount) <= 0) {
      toast.error("Please enter a valid discount value");
      return;
    }

    if (discountType === "percentage" && parseFloat(discount) > 100) {
      toast.error("Discount cannot exceed 100%");
      return;
    }

    try {
      const response = await generateDiscountCode({
        lead_id: parseInt(leadId),
        booking_id: lead?.booking_id,
        discount_type: discountType,
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
          className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0"
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
        className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0"
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
              User Details
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
                    <div className=" lg:hidden">
                      {/* <StatusBadge status={status} /> */}
                      <LeadsStatusBadge status={"Booked"} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {/* update once data is available */}
                  <IntentBadge intent={lead.intent || "Hot"} />

                  <div className="hidden lg:block">
                    {/* <StatusBadge status={status} /> */}
                    <LeadsStatusBadge status={"Booked"} />
                  </div>
                </div>
                {/* <div className="hidden lg:block">
                  <LeadsStatusBadge status={"Booked"} />
                </div> */}
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
              <div className="flex flex-col lg:flex-row flex-wrap gap-3 lg:gap-y-4 lg:gap-x-8 text-sm text-[#AAA7A7]">
                <p>
                  Temporary Booking ID : <span className="text-[#E8D1AB]">{"TMP-2024-001"}</span>
                </p>
                <div className="w-[1px] h-4 bg-white hidden md:block" />
                <p>
                  Lead Source : <span className="text-white">{"Website"}</span>
                </p>
                <div className="w-[1px] h-4 bg-white hidden md:block" />
                <p>
                  Assigned Sales Rep : <span className="text-white">{"John Doe"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Booking Summary Card */}
          <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
            <h2 className="lg:text-xl font-medium text-white p-4 !pb-0 lg:p-9">
              Booking Summary
            </h2>
            <DottedDivider />
            <div className="flex flex-col gap-3 lg:gap-5 px-4 lg:px-9 !pt-0">
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
            <DottedDivider />
            <div className="p-4 !pt-0 lg:p-9">
              <BookingStatusStepper currentStep={1} />
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
                  ${basePrice.toLocaleString()}/-
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-[#71717B] text-xs">Taxes & Fees</span>
                <span className="text-sm lg:text-base text-white">${taxes.toFixed(2)}/-</span>
              </div>
            </div>
            <div className="h-[1px] w-full bg-[#3D3D3D]" />
            <div className="p-4 lg:px-9 lg:py-6 flex justify-between items-center">
              <span className="text-sm font-medium">Total Amount</span>
              <span className="lg:text-lg font-semibold text-[#E8D1AB]">
                ${total.toFixed(2)}/-
              </span>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Discount Generator */}
        <div className="lg:col-span-4 space-y-3 lg:space-y-6">
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
              {/* Discount Type Dropdown */}
              <div className="relative w-full">
                {/* Label */}
                <label className="absolute -top-2.5 left-4 bg-[#171717] px-2 text-sm text-white/60 capitalize tracking-widest z-20 pointer-events-none">
                  Discount Type
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex items-center justify-between w-full border rounded-xl px-4 py-4 text-left text-base text-white transition-all ${isDropdownOpen ? "border-white/80 ring-1 ring-white/20" : "border-white/50"
                      } hover:border-white/80`}
                  >
                    {discountType === "percentage" ? "Percentage" : "Fixed Amount"}
                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <>
                      {/* Invisible backdrop to close dropdown when clicking outside */}
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsDropdownOpen(false)}
                      ></div>

                      <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0A0808] border border-white/20 rounded-xl overflow-hidden z-40 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <button
                          onClick={() => {
                            setDiscountType("percentage");
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-4 text-white hover:bg-white/10 transition-colors border-b border-white/5"
                        >
                          Percentage
                        </button>
                        <button
                          onClick={() => {
                            setDiscountType("fixed_amount");
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-4 text-white hover:bg-white/10 transition-colors"
                        >
                          Fixed Amount
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Discount Value Input */}
              <div className="relative">
                <label className="absolute -top-2 lg:-top-2.5 left-4 bg-[#171717] px-2 text-xs lg:text-sm text-white/60 capitalize tracking-widest z-10">
                  {discountType === "percentage" ? "Discount Percentage" : "Discount Amount"}
                </label>
                <div className="flex items-center border border-white/50 rounded-xl px-4 py-4 bg-transparent focus-within:border-[#E8D1AB]/50 transition-all">
                  <input
                    type="number"
                    placeholder="0"
                    className="bg-transparent w-full outline-none text-white text-base"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                  {discountType === "percentage" ? (
                    <Percent size={20} className="text-white" />
                  ) : (
                    <DollarSign size={20} className="text-white" />
                  )}
                </div>
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

          <GeneratePaymentLink />
        </div>
      </div>
    </div>
  );
}
