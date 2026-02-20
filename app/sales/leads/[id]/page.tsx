"use client";

import React, { useState, use } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetLeadByIdQuery,
  useUpdateLeadStatusMutation,
  useRemoveAssignedCrewMutation,
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
import Topbar from "@/components/admin/Topbar";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";

// Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";

// Helper function to map lead status to UI format
const mapLeadStatusToUI = (status: string): string => {
  if (status === "booked") return "Booked";
  if (status === "abandoned") return "Cancelled";
  if (status?.includes("in_progress")) return "In-Progress";
  return status || "In-Progress";
};

const CP_COLORS = ["bg-blue-200", "bg-green-200", "bg-orange-100", "bg-purple-200"];

export default function SalesLeadDetailsPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const router = useRouter();

  const pathname = usePathname();
  const params = use(paramsPromise);
  const leadId = params.id;

  // Discount States
  const [discountValue, setDiscountValue] = useState("");
  const [showDiscountCode, setShowDiscountCode] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed_amount">("percentage");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isUsageDropdownOpen, setIsUsageDropdownOpen] = useState(false);
  const [assignedCPs, setAssignedCPs] = useState<any[]>([]);
  const [removeAssignedCrew] = useRemoveAssignedCrewMutation();

  const [usageType, setUsageType] = useState<"one_time" | "multi_use">("one_time");

  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [activeCPIndex, setActiveCPIndex] = useState(0);

  const activePartner = assignedCPs[activeCPIndex % assignedCPs.length];
  const [generatedPaymentLink, setGeneratedPaymentLink] = useState<string>("Placeholder");
  const [generatedDiscountId, setGeneratedDiscountId] = useState<number | undefined>(undefined);

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

  const lead = leadData as any;
  const booking = lead?.booking;

  // Update assigned CPs when lead data is loaded
  React.useEffect(() => {
    if (booking?.assigned_crews) {
      const mappedCPs = booking.assigned_crews.map((crew: any, index: number) => ({
        id: crew.crew_member_id,
        name: `${crew.crew_member.first_name} ${crew.crew_member.last_name}`,
        email: crew.crew_member.email || "No email",
        image: `/images/crew/CREW(${(index % 6) + 1}).png`,
        earnings: `$${crew.crew_member.hourly_rate}`,
        bgColor: CP_COLORS[index % CP_COLORS.length],
      }));
      setAssignedCPs(mappedCPs);
    }
  }, [booking?.assigned_crews]);

  // Extract data with defaults
  const clientName = lead?.client_name || lead?.guest_email || "Unknown Client";
  const initials = clientName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const email = lead?.guest_email || "No email";
  const phone = lead?.user?.phone_number || lead?.phone || "N/A";
  const leadType = lead ? (LEAD_TYPE_LABELS[lead.lead_type as keyof typeof LEAD_TYPE_LABELS] || lead.lead_type) : "Unknown";
  const status = lead ? mapLeadStatusToUI(lead.lead_status) as any : "Unknown";

  const bookingDate = booking?.event_date
    ? new Date(booking.event_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : "Not set";
  const location = booking?.event_location || "Not specified";
  const shootType = booking?.event_type || "Not specified";

  const pricingBreakdown = lead?.pricing_breakdown;
  const basePrice = pricingBreakdown ? (pricingBreakdown.shoot_cost + pricingBreakdown.editing_cost + pricingBreakdown.additional_creatives_cost) : (booking?.budget ? (typeof booking.budget === 'string' ? parseFloat(booking.budget) || 0 : booking.budget) : 0);
  const taxes = pricingBreakdown ? 0 : basePrice * 0.09; // Use 0 if we have pricing breakdown as it might already include everything or be handled differently
  const total = pricingBreakdown?.total || (basePrice + taxes);
  const discount = pricingBreakdown?.discount || 0;

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
        setGeneratedDiscountId(response.data.discount_code_id);
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

  // Handle copy payment link
  const handleCopyPaymentLink = async () => {
    if (generatedPaymentLink) {
      await copyToClipboard(generatedPaymentLink);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleRemoveCP = async (cpId: number) => {
    try {
      await removeAssignedCrew({
        lead_id: Number(params.id),
        crew_member_id: cpId,
      }).unwrap();

      setAssignedCPs((current) => current.filter((cp) => cp.id !== cpId));
      toast.success("CP removed successfully");
    } catch (error) {
      console.error("Failed to remove CP:", error);
      toast.error("Failed to remove CP");
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
    <>
      <Topbar pathname={pathname} />
      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 text-white font-sans">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0"
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>
        <div className="flex justify-between items-center mb-3 lg:mb-6">
          <div className="text-white">
            <h1 className="lg:text-2xl lg:leading-[32px] font-semibold mb-1">Lead Details</h1>
            <p className="text-xs lg:text-sm text-white/70">Manage lead information and generate payment resources</p>
          </div>

        </div>

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
                      <div className=" lg:hidden">
                        {/* <StatusBadge status={status} /> */}
                        <LeadsStatusBadge status={(lead?.booking_status || status) as any} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {/* update once data is available */}
                    <IntentBadge intent={(lead?.intent || "Hot") as any} />

                    <div className="hidden lg:block">
                      {/* <StatusBadge status={status} /> */}
                      <LeadsStatusBadge status={(lead?.booking_status || status) as any} />
                    </div>
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
                <div className="flex flex-col lg:flex-row flex-wrap gap-3 lg:gap-y-4 lg:gap-x-8 text-sm text-[#AAA7A7]">
                  <p>
                    Booking ID : <span className="text-[#E8D1AB]">{lead?.booking_id || "N/A"}</span>
                  </p>
                  <div className="w-[1px] h-4 bg-white hidden md:block" />
                  <p>
                    Lead Source : <span className="text-white">{lead?.lead_source || "N/A"}</span>
                  </p>
                  <div className="w-[1px] h-4 bg-white hidden md:block" />
                  <p>
                    Assigned Sales Rep : <span className="text-white">{lead?.assigned_sales_rep?.name || "N/A"}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Assigned CPs */}
            <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
              <div className="flex justify-between items-center  p-4 !pb-0 lg:p-9">
                <h2 className="lg:text-xl font-medium text-white">
                  Assigned CPs ({assignedCPs.length.toString().padStart(2, '0')})
                  {/* Number to be dynamic */}
                </h2>
                <Link
                  href={"/sales/select-creatives"}
                  className="flex gap-1 items-center h-12 w-fit bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010] font-semibold py-3.5 px-6 rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                // onClick={handleGenerateDiscount}
                >
                  <Plus className="text-black" size={18} /> Add More CPs
                </Link>
              </div>
              <DottedDivider />
              <div className="p-5 lg:p-9 space-y-6">
                {/* Slider Section */}
                <div className="relative pb-4">
                  {isLoading ? (
                    <div className="h-[200px] flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8D1AB]" />
                    </div>
                  ) : assignedCPs.length > 0 ? (
                    <Swiper
                      effect={"coverflow"}
                      grabCursor={true}
                      centeredSlides={true}
                      slidesPerView={1.5} // Better fit for the 8-column span on desktop
                      breakpoints={{
                        640: { slidesPerView: 2 },
                        1024: { slidesPerView: 3 }
                      }}
                      initialSlide={0}
                      loop={assignedCPs.length >= 3}
                      spaceBetween={20}
                      coverflowEffect={{
                        rotate: 40,
                        stretch: 0,
                        depth: 100,
                        modifier: 1,
                        slideShadows: false,
                      }}
                      modules={[EffectCoverflow]}
                      onSlideChange={(swiper) => setActiveCPIndex(swiper.realIndex)}
                      className="w-full"
                    >
                      {assignedCPs.map((cp, index) => (
                        <SwiperSlide key={cp.id} className="flex items-center justify-center">
                          <div
                            className={`relative !w-[184px] !h-[140px] md:!w-[280px] md:!h-[212px] rounded-[20px] overflow-hidden transition-all duration-500 ${cp.bgColor}`}
                          >
                            <Image
                              src={cp.image}
                              alt={cp.name}
                              fill
                              className="object-cover object-top"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveCP(cp.id);
                              }}
                              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black flex items-center justify-center text-white hover:bg-black/80 transition-all z-10"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-white/50">
                      No partners found.
                    </div>
                  )}
                </div>

                {/* Active Partner Info - Centered Design */}
                {activePartner && (
                  <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold text-white">
                        {activePartner.name}
                      </h3>
                      <p className="text-white/40 text-sm tracking-wide">
                        {activePartner.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Summary Card */}
            <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
              <div className="flex justify-between items-center p-4 !pb-0 lg:p-9">
                <h2 className="lg:text-xl font-medium text-white">
                  Booking Summary
                </h2>
                <Button
                  onClick={() => router.push(`/sales/leads/${params.id}/edit-booking`)}
                  className="h-10 w-fit bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010] font-semibold py-2 px-4 rounded-lg transition-all text-sm"
                >
                  Edit Details
                </Button>
              </div>
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
                <BookingStatusStepper currentStep={lead?.booking_step || 1} />
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
                  <span className="text-[#71717B] text-xs">Shoot Cost</span>
                  <span className="text-sm lg:text-base text-white">
                    ${pricingBreakdown?.shoot_cost?.toLocaleString() || basePrice.toLocaleString()}/-
                  </span>
                </div>
                {pricingBreakdown?.editing_cost ? (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Editing Cost</span>
                    <span className="text-sm lg:text-base text-white">
                      ${pricingBreakdown.editing_cost.toLocaleString()}/-
                    </span>
                  </div>
                ) : null}
                {pricingBreakdown?.additional_creatives_cost ? (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Additional Creatives Cost</span>
                    <span className="text-sm lg:text-base text-white">
                      ${pricingBreakdown.additional_creatives_cost.toLocaleString()}/-
                    </span>
                  </div>
                ) : null}
                {discount > 0 && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Discount</span>
                    <span className="text-sm lg:text-base text-red-400">
                      -${discount.toLocaleString()}/-
                    </span>
                  </div>
                )}
                {taxes > 0 && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Taxes & Fees</span>
                    <span className="text-sm lg:text-base text-white">${taxes.toFixed(2)}/-</span>
                  </div>
                )}
              </div>
              <div className="h-[1px] w-full bg-[#3D3D3D]" />
              <div className="p-4 lg:px-9 lg:py-6 flex justify-between items-center">
                <span className="text-sm font-medium">Total Amount</span>
                <span className="lg:text-lg font-semibold text-[#E8D1AB]">
                  ${total.toLocaleString()}/-
                </span>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-3 lg:space-y-6">
            {/* Discount Generator */}
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
                      onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                      className={`flex items-center justify-between w-full border rounded-xl px-4 py-4 text-left text-base text-white transition-all ${isTypeDropdownOpen ? "border-white/80 ring-1 ring-white/20" : "border-white/50"
                        } hover:border-white/80`}
                    >
                      {discountType === "percentage" ? "Percentage (%)" : "Fixed Amount ($)"}
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-300 ${isTypeDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isTypeDropdownOpen && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-[#18181B] border border-[#27272A] rounded-xl z-20 overflow-hidden">
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
                </div>

                {/* Value Input (Percentage or Amount) */}
                <div className="relative">
                  <label className="absolute -top-2 lg:-top-2.5 left-4 bg-[#18181B] px-2 text-xs lg:text-sm text-white/60 capitalize tracking-widest z-10">
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
                                    <div className="absolute top-full left-0 w-full mt-1 bg-[#171717] border border-[#27272A] rounded-xl z-20 overflow-hidden">
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

            <GeneratePaymentLink
              leadId={parseInt(leadId)}
              bookingId={lead?.booking_id}
              discountCodeId={generatedDiscountId}
            />

            {/* Show only after booking is created? */}
            <div className="lg:text-right lg:mt-[82px]">
              <Button className="text-sm font-semibold text-white h-12 px-4 lg:px-7 rounded-lg bg-[#202020] border border-white/20 hover:bg-white/10 transition-colors ">
                Change CPs
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
