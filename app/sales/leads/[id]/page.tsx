"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import Image from "next/image";

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
  Edit2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetLeadByIdQuery,
  useUpdateBookingCrewMutation,
  useRemoveAssignedCrewMutation,
  useGenerateDiscountCodeMutation,
  useUpdateLeadIntentMutation
} from "@/lib/redux/features/sales/salesApi";

import { UpdateLeadIntentModal } from "@/components/sales/UpdateLeadIntent";

import { LEAD_TYPE_LABELS } from "@/types/sales";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/discountHelpers";
import GeneratePaymentLink from "@/components/sales/GeneratePaymentLink";
import { LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";
import { IntentBadge } from "@/components/sales/IntentBadge";
import DottedDivider from "@/components/admin/DottedDivider";
import BookingStatusStepper from "@/components/sales/BookingStatusStepper";
import Topbar from "@/components/admin/Topbar";
import { parseDate } from "@/src/components/landing/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreativePartnerProfile } from "@/components/admin/users/CreativePartnerProfile";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";

// Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

/** 
 * UPDATED ROLE MAPPING LOGIC
 * 1 or 9 -> Videographer
 * 2 or 10 -> Photographer
 * 3 or 11 -> Editor
 */
const getRoleLabel = (roleData: any): string => {
  try {
    let roles: string[] = [];
    if (typeof roleData === 'string') {
      if (roleData.startsWith('[')) {
        roles = JSON.parse(roleData);
      } else {
        roles = [roleData];
      }
    } else if (Array.isArray(roleData)) {
      roles = roleData.map(r => r.toString());
    }

    if (roles.some(r => r === "1" || r === "9")) return "Videographer";
    if (roles.some(r => r === "2" || r === "10")) return "Photographer";
    if (roles.some(r => r === "3" || r === "11")) return "Editor";
    return "Creative Partner";
  } catch (e) {
    return "Creative Partner";
  }
};

// Helper function to map lead status to UI format
const mapLeadStatusToUI = (status: string): string => {
  if (status === "booked") return "Booked";
  if (status === "abandoned") return "Cancelled";
  return "In-Progress";
};

// Helper to format date for the UI (e.g., 12 Mar 2026)
const formatDateUI = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  const date = parseDate(dateStr);
  if (!date) return null;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatLeadSource = (value?: string | null) => {
  if (!value) return "Website";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function SalesLeadDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const leadId = params.id as string;


  const [discount, setDiscount] = useState("");
  const [isIntentModalOpen, setIsIntentModalOpen] = useState(false);
  const [showDiscountCode, setShowDiscountCode] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed_amount">("percentage");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [usageType, setUsageType] = useState<"one_time" | "multi_use">("one_time");
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [activeCPIndex, setActiveCPIndex] = useState(0);
  const [generatedDiscountId, setGeneratedDiscountId] = useState<number | undefined>(undefined);
  const [isCPModalOpen, setIsCPModalOpen] = useState(false);
  const [selectedCPId, setSelectedCPId] = useState<string | null>(null);


  // Fetch real lead data
  const {
    data: leadData,
    isLoading,
    error,
    refetch
  } = useGetLeadByIdQuery(parseInt(leadId), {
    skip: !leadId,
  });

  // Discount code generation
  const [generateDiscountCode, { isLoading: isGenerating }] =
    useGenerateDiscountCodeMutation();

  const [updateLeadIntent] = useUpdateLeadIntentMutation();

  const lead = leadData;
  const booking = lead?.booking;

  // Filtered and Mapped CPs
  const filteredCPs = useMemo(() => {
    const crews = booking?.assigned_crews || [];
    const mapped = crews.map((crew: any) => {
      const profileFile = crew.crew_member?.crew_member_files?.[0];
      const imageUrl = profileFile?.file_path
        ? `${S3_PREFIX}${profileFile.file_path}`
        : null;

      return {
        id: crew.crew_member_id,
        name: `${crew.crew_member.first_name} ${crew.crew_member.last_name}`,
        image: imageUrl,
        status: crew.acceptance_status || "pending",
        role: getRoleLabel(crew.crew_member.primary_role),
        inviteSentAt: formatDateUI(crew.created_at),
        respondedAt: formatDateUI(crew.responded_at),
      };
    });

    if (statusFilter === "all") return mapped;
    return mapped.filter((cp: any) => cp.status === statusFilter);
  }, [booking, statusFilter]);

  const activePartner = filteredCPs[activeCPIndex % (filteredCPs.length || 1)];

  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return null;
    try {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const startTime = formatTime(booking?.start_time);
  const endTime = formatTime(booking?.end_time);
  const shootTimeDisplay = startTime && endTime ? `${startTime} - ${endTime}` : "Not set";

  // Extract data with defaults
  const clientName = lead?.client_name || lead?.guest_email || "Unknown User";
  const initials = clientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const email = lead?.guest_email || "No email";
  const phone = lead?.phone || "N/A";
  const leadType = lead ? LEAD_TYPE_LABELS[lead.lead_type as keyof typeof LEAD_TYPE_LABELS] : "Unknown";
  const status = lead ? (lead.booking_status || mapLeadStatusToUI(lead.lead_status)) : "Unknown";

  const bookingDate = booking?.event_date
    ? (parseDate(booking.event_date) || new Date(booking.event_date)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : "Not set";
  const location = booking?.event_location || "Not specified";
  const shootType = booking?.shoot_type || booking?.event_type || "Not specified";

  // Pricing from breakdown
  const basePrice = lead?.pricing_breakdown?.shoot_cost || 0;
  const editingCost = lead?.pricing_breakdown?.editing_cost || 0;
  const additionalCreatives = lead?.pricing_breakdown?.additional_creatives_cost || 0;
  const discountAmount = lead?.pricing_breakdown?.discount || 0;
  const total = lead?.pricing_breakdown?.total || 0;
  const taxes = 0; // Taxes are now part of total/breakdown if needed
  const referralInfo = useMemo(() => {
    const notes = booking?.primary_quote?.notes || "";
    const match = String(notes).match(/Referral applied \(([^)]+)\): -\$(\d+(?:\.\d+)?)/i);
    if (!match) return { code: null, amount: 0 };
    return { code: match[1] || null, amount: parseFloat(match[2] || "0") || 0 };
  }, [booking?.primary_quote?.notes]);

  const referralDiscountAmount = referralInfo.amount;
  const discountCodeDiscount = Math.max(0, discountAmount - referralDiscountAmount);
  const discountCodeValue = lead?.discount_codes?.[0]?.code || null;

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
        setGeneratedDiscountId(response.data.discount_code_id);
        setShowDiscountCode(true);
        toast.success("Discount code generated successfully!");
      }
    } catch (error: any) {
      console.error("Error generating discount:", error);
      toast.error(error?.data?.message || "Failed to generate discount code");
    }
  };

  const handleUpdateIntent = async (intent: string, notes: string) => {
    try {
      await updateLeadIntent({
        lead_id: parseInt(leadId),
        intent: intent,
        notes: notes
      }).unwrap();

      toast.success("Lead intent updated successfully");
      setIsIntentModalOpen(false);

      // 1. Manually trigger a refresh of the lead data
      refetch();

    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update intent");
    }
  };

  // Handle copy code
  const handleCopyCode = async () => {
    if (generatedCode) {
      await copyToClipboard(generatedCode);
      toast.success("Code copied to clipboard!");
    }
  };

  const [removeAssignedCrew] = useRemoveAssignedCrewMutation();

  const handleRemoveCP = async (cpId: number) => {
    try {
      await removeAssignedCrew({
        lead_id: Number(params.id),
        crew_member_id: cpId,
      }).unwrap();

      toast.success("Crew member unassigned successfully");
    } catch (error) {
      console.error("Failed to unassign crew member:", error);
      toast.error("Failed to unassign crew member");
    }
  };

  const handleCPClick = (cpId: number) => {
    setSelectedCPId(cpId.toString());
    setIsCPModalOpen(true);
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Area (Left/Middle) */}
          <div className="lg:col-span-8 space-y-3 lg:space-y-6">
            {/* Client Details Card */}
            <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
              <div className="flex justify-between items-center p-5 lg:px-9 lg:py-6 !pb-0">
                <h2 className="lg:text-xl font-medium text-white">
                  Client Details
                </h2>
                {/* 4. The "Update Intent" Button added here */}
                <Button
                  onClick={() => setIsIntentModalOpen(true)}
                  className="h-10 bg-zinc-800 border border-white/10 text-[#E8D1AB] hover:bg-zinc-700 px-5 rounded-lg text-sm transition-all"
                >
                  Update Intent
                </Button>
              </div>

              {/* <DottedDivider /> */}
              <hr className="border-t border-[#3D3D3D] my-4 lg:my-9" />

              <div className="flex flex-col gap-3 lg:gap-6 p-5 lg:p-9 !pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <div className="w-13 h-13 lg:w-[84px] lg:h-[84px] rounded-lg lg:rounded-2xl bg-[#FFF6D9] text-[#000000] border border-[#FFF6D9] flex items-center justify-center text-xl lg:text-[30px] font-semibold shrink-0">
                      {initials}
                    </div>
                    <div className="flex flex-col gap-2">
                      <h1 className="lg:text-[22px] font-semibold">{clientName}</h1>
                      <div className=" lg:hidden">
                        {/* <StatusBadge status={status} /> */}
                        <LeadsStatusBadge status={status as any} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {/* update once data is available */}
                    <IntentBadge intent={(lead.intent || "Hot") as any} />

                    <div className="hidden lg:block">
                      {/* <StatusBadge status={status} /> */}
                      <LeadsStatusBadge status={status as any} />
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
                    Temporary Booking ID : <span className="text-[#E8D1AB]">{`TMP-${new Date(lead.created_at).getFullYear()}-${lead.booking_id?.toString().padStart(3, '0')}`}</span>
                  </p>
                  <div className="w-[1px] h-4 bg-white hidden md:block" />
                  <p>
                    Lead Source : <span className="text-white">{formatLeadSource(lead.lead_source || lead.intent_source)}</span>
                  </p>
                  <div className="w-[1px] h-4 bg-white hidden md:block" />
                  <p>
                    Assigned Sales Rep : <span className="text-white">{lead.assigned_sales_rep?.name || "Unassigned"}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Assigned CPs Section - Synchronized with Admin UI */}
            <div className="bg-[#171717] border border-[#3D3D3D] rounded-[32px] overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 lg:p-9 !pb-0 gap-4">
                <h2 className="text-xl lg:text-2xl font-medium text-white">
                  Assigned CPs ({filteredCPs.length.toString().padStart(2, '0')})
                </h2>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  {/* Status Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className="flex items-center justify-between min-w-[140px] bg-[#1a1a1a] border border-[#3D3D3D] rounded-xl px-4 py-2.5 text-sm font-medium text-white hover:bg-[#252525] transition-all"
                    >
                      <span className="capitalize">{statusFilter === "all" ? "All Status" : statusFilter}</span>
                      <ChevronDown size={16} className={`ml-2 transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isStatusDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsStatusDropdownOpen(false)}></div>
                        <div className="absolute top-full right-0 mt-2 w-44 bg-[#1a1a1a] border border-[#3D3D3D] rounded-xl shadow-2xl z-40 overflow-hidden">
                          {['all', 'pending', 'accepted', 'rejected'].map((s) => (
                            <button
                              key={s}
                              onClick={() => {
                                setStatusFilter(s as any);
                                setIsStatusDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#E8D1AB] hover:text-black transition-colors capitalize"
                            >
                              {s} Status
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <Button
                    className="h-11 bg-[#E8D1AB] hover:bg-[#D4C3A3] text-black font-semibold px-6 rounded-xl flex items-center gap-2"
                    onClick={() => router.push(`/sales/select-creatives?id=${leadId}`)}
                  >
                    <Plus size={18} /> Add More CPs
                  </Button>
                </div>
              </div>

              <hr className="border-t border-[#3D3D3D] border-dashed my-6 lg:my-9 mx-6 lg:mx-9" />

              <div className="p-6 lg:p-9 !pt-0">
                <div className="relative">
                  {filteredCPs.length > 0 ? (
                    <Swiper
                      key={statusFilter}
                      effect={"coverflow"}
                      grabCursor={true}
                      centeredSlides={true}
                      slidesPerView={1.2}
                      breakpoints={{
                        768: { slidesPerView: 2.2 },
                        1024: { slidesPerView: 2.6 }
                      }}
                      coverflowEffect={{
                        rotate: 15,
                        stretch: 0,
                        depth: 100,
                        modifier: 1,
                        slideShadows: false,
                      }}
                      modules={[EffectCoverflow]}
                      onSlideChange={(swiper) => setActiveCPIndex(swiper.realIndex)}
                      className="w-full py-8"
                    >
                      {filteredCPs.map((cp: any, index: number) => (
                        <SwiperSlide key={cp.id}>
                          <div className="group relative transition-all duration-300">
                            {/* FLOATING IMAGE AREA */}
                            <div
                              onClick={() => handleCPClick(cp.id)}
                              className="relative aspect-[1.1/1] rounded-[32px] overflow-hidden bg-zinc-800 shadow-2xl mb-4 cursor-pointer"
                            >
                              {cp.image ? (
                                <img src={cp.image} alt={cp.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-700 text-3xl font-bold">
                                  {cp.name.split(" ").map((n: string) => n[0]).join("")}
                                </div>
                              )}

                              {/* PILL ON HOVER ONLY */}
                              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-lg px-5 py-2.5 rounded-full border border-white/10 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
                                Invite Sent: {cp.inviteSentAt}
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCP(cp.id);
                                }}
                                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/80 hover:bg-black flex items-center justify-center text-white transition-all z-20"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            {/* METADATA - ONLY SHOW FOR ACTIVE CARD */}
                            <div className={`px-2 transition-all duration-500 transform ${index === activeCPIndex ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none h-0 overflow-hidden"}`}>
                              <div className="flex justify-between items-start mb-4">
                                <div className="min-w-0">
                                  <h3 className="text-xl font-bold text-white truncate leading-tight">{cp.name}</h3>
                                  <p className="text-[#8E8E8E] text-sm mt-0.5">{cp.role}</p>
                                </div>

                                <div className={`px-5 py-2 rounded-xl text-xs font-bold capitalize
                                  ${cp.status === 'accepted' ? 'bg-[#12B76A] text-white' :
                                    cp.status === 'rejected' ? 'bg-[#D92D20] text-white' :
                                      'bg-[#9D6E2A] text-white'}`}
                                >
                                  {cp.status}
                                </div>
                              </div>

                              <hr className="border-t border-[#3D3D3D] mb-4" />

                              <div className="flex items-center gap-2 text-[#E8D1AB] text-[11px] font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#E8D1AB]" />
                                <span className="capitalize">{cp.status}</span>
                                <span className="mx-0.5">—</span>
                                <span>{cp.respondedAt || "Awaiting response"}</span>
                              </div>
                            </div>
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-white/40 border border-[#3D3D3D] border-dashed rounded-[32px]">
                      No partners found matching this status.
                    </div>
                  )}
                </div>
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
              {/* <DottedDivider /> */}
              <hr className="border-t border-[#3D3D3D] my-4 lg:my-9" />

              <div className="flex flex-col gap-3 lg:gap-5 px-4 lg:px-9">
                {booking?.is_multiple_day_shoot && (booking?.booking_days?.length ?? 0) > 0 ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4 mb-1">
                      <div className="p-3 rounded-lg lg:rounded-xl bg-white/5 text-[#8E8E8E]">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-[#71717B] font-medium mb-1">Shoot Schedule</p>
                        <p className="text-xs lg:text-base font-medium text-[#E8D1AB]">{booking.booking_days!.length} Day Shoot</p>
                      </div>
                    </div>
                    <div className="ml-2 border-l-2 border-[#3D3D3D] pl-5 flex flex-col gap-3">
                      {booking.booking_days!.map((day: any, idx: number) => {
                        const dayDate = day.event_date
                          ? (parseDate(day.event_date) || new Date(day.event_date)).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          : "Not set";
                        const dayStart = formatTime(day.start_time);
                        const dayEnd = formatTime(day.end_time);
                        const dayTime = dayStart && dayEnd ? `${dayStart} - ${dayEnd}` : "Not set";
                        return (
                          <div key={idx} className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
                            <div className="w-8 h-8 rounded-lg bg-[#E8D1AB]/10 flex items-center justify-center text-[#E8D1AB] text-xs font-bold shrink-0">
                              D{idx + 1}
                            </div>
                            <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4 min-w-0">
                              <p className="text-xs lg:text-sm font-medium text-white truncate">{dayDate}</p>
                              <div className="hidden lg:block w-[1px] h-4 bg-[#3D3D3D]" />
                              <p className="text-xs text-[#8E8E8E] flex items-center gap-1.5">
                                <Clock size={12} /> {dayTime}
                              </p>
                              {day.duration_hours && (
                                <>
                                  <div className="hidden lg:block w-[1px] h-4 bg-[#3D3D3D]" />
                                  <p className="text-xs text-[#8E8E8E]">{parseFloat(day.duration_hours)}h</p>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
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
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg lg:rounded-xl bg-white/5 text-[#8E8E8E]">
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-[#71717B] font-medium mb-1">
                          Shoot Time
                        </p>
                        <p className="text-xs lg:text-base font-medium">{shootTimeDisplay}</p>
                      </div>
                    </div>
                  </>
                )}
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
              {/* <DottedDivider /> */}
              <hr className="border-t border-[#3D3D3D] my-4 lg:my-9" />

              <div className="p-4 !pt-0 lg:p-9">
                <BookingStatusStepper currentStep={lead.booking_step || 1} />
              </div>
            </div>

            {/* Pricing Breakdown Card */}
            <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
              <h2 className="lg:text-xl font-medium text-white p-4 lg:p-9 !pb-0">
                Pricing Breakdown
              </h2>
              {/* <DottedDivider /> */}
              <hr className="border-t border-[#3D3D3D] my-4 lg:my-9" />


              <div className="flex flex-col gap-3 lg:gap-6 p-4 lg:p-9 lg:pb-6">
                <div className="flex justify-between font-medium">
                  <span className="text-[#71717B] text-xs">Base Price</span>
                  <span className="text-sm lg:text-base text-white">
                    ${basePrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-[#71717B] text-xs">Editing Fee</span>
                  <span className="text-sm lg:text-base text-white">
                    ${editingCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-[#71717B] text-xs">Additional Creatives</span>
                  <span className="text-sm lg:text-base text-white">
                    ${additionalCreatives.toLocaleString()}
                  </span>
                </div>
                {discountCodeValue && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Discount Code</span>
                    <span className="text-sm lg:text-base text-white font-mono">
                      {discountCodeValue}
                    </span>
                  </div>
                )}
                {discountCodeDiscount > 0 && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Discount Code Discount</span>
                    <span className="text-sm lg:text-base text-red-400">
                      -${discountCodeDiscount.toLocaleString()}
                    </span>
                  </div>
                )}
                {referralInfo.code && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Referral Code</span>
                    <span className="text-sm lg:text-base text-white font-mono">
                      {referralInfo.code}
                    </span>
                  </div>
                )}
                {referralDiscountAmount > 0 && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Referral Discount</span>
                    <span className="text-sm lg:text-base text-red-400">
                      -${referralDiscountAmount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              <div className="h-[1px] w-full bg-[#3D3D3D]" />
              <div className="p-4 lg:px-9 lg:py-6 flex justify-between items-center">
                <span className="text-sm font-medium">Total Amount</span>
                <span className="lg:text-lg font-semibold text-[#E8D1AB]">
                  ${total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Discount Generator */}
          <div className="lg:col-span-4 space-y-3 lg:space-y-6">
            <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
              <h2 className="lg:text-xl font-medium text-white p-4 lg:p-9 !pb-0">
                Generate Discount
              </h2>
              {/* <DottedDivider /> */}
              <hr className="border-t border-[#3D3D3D] my-4 lg:my-9" />

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
                      onChange={(e) => {
                        const value = e.target.value;
                        if (discountType === "fixed_amount") {
                          setDiscount(value);
                        } else if (discountType === "percentage" && (value === "" || (parseFloat(value) >= 0 && parseFloat(value) <= 100))) {
                          setDiscount(value);
                        }
                      }}
                      min="0"
                      max={discountType === "fixed_amount" ? "100" : ""}
                      onWheel={(e) => e.preventDefault()} // Prevent mouse scroll change
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
            <UpdateLeadIntentModal
              isOpen={isIntentModalOpen}
              onClose={() => setIsIntentModalOpen(false)}
              onSave={handleUpdateIntent}
              currentIntent={lead.intent}
            />
            <GeneratePaymentLink
              leadId={parseInt(leadId)}
              bookingId={lead?.booking_id}
              discountCodeId={generatedDiscountId}
              bookingStatus={status}
              activeLink={lead?.active_payment_link}
            />

            {/* CHANGED: Passing leadId dynamically */}
            <div className="lg:text-right lg:mt-[82px]">
              <Button
                onClick={() => router.push(`/sales/select-creatives?id=${leadId}`)}
                className="text-sm font-semibold text-white h-12 px-4 lg:px-7 rounded-lg bg-[#202020] border border-white/20 hover:bg-white/10 transition-colors "
              >
                Change CPs
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isCPModalOpen} onOpenChange={setIsCPModalOpen}>
        <DialogContent className="max-w-5xl bg-[#101010] border-[#333] text-white overflow-y-auto max-h-[90vh] no-scrollbar p-0">
          <div className="sr-only">
            <DialogTitle>Creative Partner Profile</DialogTitle>
          </div>
          <div className="p-6">
            {selectedCPId && (
              <CreativePartnerProfile id={selectedCPId} hideActions={true} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
