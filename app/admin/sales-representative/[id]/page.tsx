"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";

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
  Clock,
  Circle,
  Edit,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetLeadByIdQuery,
  useUpdateBookingCrewMutation,
  useRemoveAssignedCrewMutation,
  useGenerateDiscountCodeMutation,
  useUpdateLeadIntentMutation
} from "@/lib/redux/features/sales/salesApi";

import { LEAD_TYPE_LABELS } from "@/types/sales";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/discountHelpers";
import { parseDate } from "@/src/components/landing/lib/utils";
import GeneratePaymentLink from "@/components/sales/GeneratePaymentLink";
import { LeadsStatusBadge } from "@/components/sales/LeadsStatusBadge";
import { IntentBadge } from "@/components/sales/IntentBadge";
import DottedDivider from "@/components/admin/DottedDivider";
import BookingStatusStepper from "@/components/sales/BookingStatusStepper";
import Topbar from "@/components/admin/Topbar";
import { UpdateLeadIntentModal } from "@/components/sales/UpdateLeadIntent";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreativePartnerProfile } from "@/components/admin/users/CreativePartnerProfile";
import { salesApi as salesService } from "@/lib/api";

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

const formatCurrencyValue = (value?: number | string | null) => {
  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? 0));

  if (!Number.isFinite(numericValue)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

type LeadActivityLike = {
  activity_type?: string;
  activity_data?: unknown;
};

type QuoteLineItemLike = {
  line_item_id?: number;
  item_id?: number | null;
  name?: string;
  item_name?: string;
  quantity?: number | string;
  unit_price?: number | string;
  total?: number | string;
  line_total?: number | string;
  notes?: string | null;
};

type QuoteTaxDetailsLike = {
  tax_type?: string | null;
  tax_rate?: number | string | null;
  tax_amount?: number | string | null;
};

export default function LeadDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const leadId = params.id as string;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
  const [isEditingSalesRep, setIsEditingSalesRep] = useState(false);
  const [isUpdatingSalesRep, setIsUpdatingSalesRep] = useState(false);
  const [isLoadingSalesReps, setIsLoadingSalesReps] = useState(false);
  const [salesRepOptions, setSalesRepOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedSalesRepId, setSelectedSalesRepId] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchSalesReps = async () => {
      setIsLoadingSalesReps(true);
      try {
        const result = await salesService.getSalesReps();
        if (result.success && Array.isArray(result.data)) {
          setSalesRepOptions(
            result.data.map((rep: any) => ({
              label: rep.name || `${rep.first_name || ""} ${rep.last_name || ""}`.trim() || `Representative #${rep.id}`,
              value: String(rep.id),
            }))
          );
        } else {
          setSalesRepOptions([]);
        }
      } catch (error) {
        console.error("Failed to fetch sales representatives:", error);
        setSalesRepOptions([]);
      } finally {
        setIsLoadingSalesReps(false);
      }
    };

    fetchSalesReps();
  }, []);

  // Constant default to dark
  const isDark = !mounted || theme === "dark";

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
  const [removeAssignedCrew] = useRemoveAssignedCrewMutation();

  const lead = leadData;
  const booking = lead?.booking;
  const primaryQuote = booking?.primary_quote;

  const isQuoteConvertedLead = useMemo(() => {
    const normalizedSource = String(lead?.lead_source || "").trim().toLowerCase();
    const createdActivityMatch = lead?.activities?.some((activity: LeadActivityLike) => {
      if (activity?.activity_type !== "created" || !activity?.activity_data) return false;

      try {
        const parsedData =
          typeof activity.activity_data === "string"
            ? JSON.parse(activity.activity_data)
            : activity.activity_data;

        return typeof parsedData === "object" &&
          parsedData !== null &&
          "source" in parsedData &&
          parsedData.source === "sales_quote_conversion";
      } catch {
        return false;
      }
    });

    return normalizedSource === "converted bookings" || Boolean(createdActivityMatch);
  }, [lead?.activities, lead?.lead_source]);

  const quotePricingDetails = useMemo(() => {
    if (!isQuoteConvertedLead) return null;

    const projectedQuote = lead?.projected_quote;
    const quoteTaxDetails = primaryQuote as QuoteTaxDetailsLike | undefined;
    const lineItemsSource =
      projectedQuote?.line_items?.length
        ? projectedQuote.line_items
        : primaryQuote?.line_items || [];

    const lineItems = lineItemsSource.map((item: QuoteLineItemLike, index: number) => ({
      id: item?.line_item_id ?? `${item?.item_id ?? item?.name ?? item?.item_name ?? "item"}-${index}`,
      name: item?.name || item?.item_name || "Quote Item",
      quantity: Number(item?.quantity || 0),
      unitPrice: Number(item?.unit_price || 0),
      total: Number(item?.total ?? item?.line_total ?? 0),
      notes: item?.notes || null,
    }));

    return {
      source: projectedQuote?.source || "database",
      quoteId: projectedQuote?.quote_id || primaryQuote?.quote_id || booking?.quote_id || null,
      pricingMode: primaryQuote?.pricing_mode || null,
      shootHours: projectedQuote?.shoot_hours || primaryQuote?.shoot_hours || null,
      subtotal: Number(projectedQuote?.subtotal ?? primaryQuote?.subtotal ?? 0),
      discountAmount: Number(projectedQuote?.discount_amount ?? primaryQuote?.discount_amount ?? 0),
      taxType: quoteTaxDetails?.tax_type || null,
      taxRate: Number(quoteTaxDetails?.tax_rate ?? 0),
      taxAmount: Number(quoteTaxDetails?.tax_amount ?? 0),
      priceAfterDiscount: Number(primaryQuote?.price_after_discount ?? 0),
      total: Number(primaryQuote?.total ?? projectedQuote?.total ?? lead?.pricing_breakdown?.total ?? 0),
      expiresAt: primaryQuote?.expires_at || null,
      status: primaryQuote?.status || null,
      lineItems,
    };
  }, [booking?.quote_id, isQuoteConvertedLead, lead?.pricing_breakdown?.total, lead?.projected_quote, primaryQuote]);

  useEffect(() => {
    setSelectedSalesRepId(lead?.assigned_sales_rep?.id ? String(lead.assigned_sales_rep.id) : "");
  }, [lead?.assigned_sales_rep?.id]);

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
  const total = isQuoteConvertedLead
    ? Number(primaryQuote?.total ?? lead?.pricing_breakdown?.total ?? 0)
    : lead?.pricing_breakdown?.total || 0;

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

  // const [removeAssignedCrew] = useRemoveAssignedCrewMutation();

  const handleRemoveCP = async (cpId: number) => {
    try {
      await removeAssignedCrew({
        client_lead_id: Number(params.id),
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

  const handleUpdateSalesRep = async (salesRepId: string) => {
    if (!salesRepId) {
      toast.error("Please choose a representative");
      return;
    }

    if (salesRepId === String(lead?.assigned_sales_rep?.id || "")) {
      setIsEditingSalesRep(false);
      return;
    }

    setIsUpdatingSalesRep(true);
    try {
      const result = await salesService.changeLeadSalesRep(leadId, salesRepId);
      if (result.success) {
        toast.success("Assigned sales representative updated successfully");
        setIsEditingSalesRep(false);
        refetch();
      } else {
        toast.error(result.error || result.message || "Failed to update assigned sales representative");
      }
    } catch (error) {
      console.error("Failed to update assigned sales representative:", error);
      toast.error("Failed to update assigned sales representative");
    } finally {
      setIsUpdatingSalesRep(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`${isDark ? "text-white" : "text-black"} font-sans flex items-center justify-center py-20`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? "border-[#E8D1AB]" : "border-[#B18A00]"}`}></div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className={`${isDark ? "text-white" : "text-black"} font-sans`}>
        <Button
          onClick={() => router.back()}
          className={`${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"} transition-colors flex items-center gap-2 mb-5 p-0 bg-transparent shadow-none border-none`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>
        <div className={`${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"} border rounded-2xl p-8 text-center`}>
          <p className={isDark ? "text-white/60" : "text-black/60"}>Lead not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Topbar pathname={pathname} />
      <div className={`overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 font-sans transition-colors duration-300 ${isDark ? "text-white" : "text-black"}`}>
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          className={`transition-colors flex items-center gap-2 mb-5 p-0 bg-transparent shadow-none border-none ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-[#B18A00]"}`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Area (Left/Middle) */}
          <div className="lg:col-span-8 space-y-3 lg:space-y-6">
            {/* Client Details Card */}
            <div className={`border transition-colors duration-300 rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
              <div className="flex justify-between items-center p-5 lg:px-9 lg:py-6 !pb-0">
                <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                  Client Details
                </h2>
                <Button
                  onClick={() => setIsIntentModalOpen(true)}
                  className={`h-10 border px-5 rounded-lg text-sm transition-all ${isDark
                    ? "bg-zinc-800 border-white/10 text-[#E8D1AB] hover:bg-zinc-700"
                    : "bg-[#E8D1AB] hover:bg-[#D9C19A] border-[#E8D1AB] text-black"
                    }`}
                >
                  Update Intent
                </Button>
              </div>

              <hr className={`my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`} />

              <div className="flex flex-col gap-3 lg:gap-6 p-5 lg:p-9 !pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="w-13 h-13 lg:w-[84px] lg:h-[84px] rounded-lg lg:rounded-2xl bg-[#FFF6D9] text-[#000000] border border-[#FFF6D9] flex items-center justify-center text-xl lg:text-[30px] font-semibold shrink-0">
                      {initials}
                    </div>
                    <div className="flex flex-col gap-2 min-w-0">
                      <h1 className={`lg:text-[22px] font-semibold truncate ${isDark ? "text-white" : "text-black"}`}>{clientName}</h1>
                      <div className=" lg:hidden">
                        <LeadsStatusBadge status={status as any} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center shrink-0">
                    <IntentBadge intent={(lead.intent || "Hot") as any} />
                    <div className="hidden lg:block">
                      <LeadsStatusBadge status={status as any} />
                    </div>
                  </div>
                </div>
                <div className={`flex flex-col lg:flex-row flex-wrap gap-3 lg:gap-y-4 lg:gap-x-8 text-sm ${isDark ? "text-[#AAA7A7]" : "text-[#666666]"}`}>
                  <p>
                    Email ID : <span className={isDark ? "text-white" : "text-black"}>{email}</span>
                  </p>
                  <div className={`w-[1px] h-4 hidden md:block ${isDark ? "bg-[#3D3D3D]" : "bg-[#D8D8D8]"}`} />
                  <p>
                    Phone Number : <span className={isDark ? "text-white" : "text-black"}>{phone}</span>
                  </p>
                  <div className={`w-[1px] h-4 hidden md:block ${isDark ? "bg-[#3D3D3D]" : "bg-[#D8D8D8]"}`} />
                  <p>
                    Lead Type : <span className={isDark ? "text-white" : "text-black"}>{leadType}</span>
                  </p>
                </div>
                <div className={`flex flex-col lg:flex-row flex-wrap gap-3 lg:gap-y-4 lg:gap-x-8 text-sm ${isDark ? "text-[#AAA7A7]" : "text-[#666666]"}`}>
                  <p>
                    Temporary Booking ID : <span className="text-[#E8D1AB]">{`TMP-${new Date(lead.created_at).getFullYear()}-${lead.booking_id?.toString().padStart(3, '0')}`}</span>
                  </p>
                  <div className={`w-[1px] h-4 hidden md:block ${isDark ? "bg-[#3D3D3D]" : "bg-[#D8D8D8]"}`} />
                  <p>
                    Lead Source : <span className={isDark ? "text-white capitalize" : "text-black capitalize"}>{formatLeadSource(lead.lead_source || lead.intent_source)}</span>
                  </p>
                  <div className={`w-[1px] h-4 hidden md:block ${isDark ? "bg-[#3D3D3D]" : "bg-[#D8D8D8]"}`} />
                  <div className="relative inline-flex items-center gap-2 flex-nowrap overflow-visible">
                    <p className="whitespace-nowrap">
                      Assigned Sales Rep : <span className={isDark ? "text-white" : "text-black"}>{lead.assigned_sales_rep?.name || "Unassigned"}</span>
                    </p>
                    <button
                      type="button"
                      aria-label={isEditingSalesRep ? "Close sales representative options" : "Edit assigned sales representative"}
                      onClick={() => {
                        if (isEditingSalesRep) {
                          setSelectedSalesRepId(lead.assigned_sales_rep?.id ? String(lead.assigned_sales_rep.id) : "");
                          setIsEditingSalesRep(false);
                          return;
                        }
                        setIsEditingSalesRep(true);
                      }}
                      className={`relative z-30 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${isDark ? "text-[#E8D1AB] hover:bg-white/10" : "text-black hover:bg-black/5"}`}
                    >
                      {isEditingSalesRep ? <X size={14} /> : <Pencil size={14} />}
                    </button>
                    {isEditingSalesRep && (
                      <>
                        <button
                          type="button"
                          aria-label="Close sales representative options"
                          onClick={() => {
                            setSelectedSalesRepId(lead.assigned_sales_rep?.id ? String(lead.assigned_sales_rep.id) : "");
                            setIsEditingSalesRep(false);
                          }}
                          className="fixed inset-0 z-20 cursor-default"
                        />
                        <div className={`absolute top-full right-0 mt-2 z-30 min-w-[260px] rounded-xl border overflow-hidden shadow-xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
                          {isLoadingSalesReps ? (
                            <div className={`px-4 py-3 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                              Loading...
                            </div>
                          ) : (
                            <div className="py-1.5">
                              {salesRepOptions.map((option) => {
                                const isSelected = option.value === selectedSalesRepId;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                      if (isUpdatingSalesRep) return;
                                      setSelectedSalesRepId(option.value);
                                      handleUpdateSalesRep(option.value);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${isSelected
                                      ? (isDark ? "bg-white/5 text-[#E8D1AB]" : "bg-black/5 text-black font-medium")
                                      : (isDark ? "text-white/80 hover:bg-white/10" : "text-black/80 hover:bg-black/5")
                                      }`}
                                  >
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned CPs Section - FLOATING UI & HOVER PILL & ACTIVE METADATA */}
            <div className={`border rounded-[32px] overflow-hidden transition-colors duration-300 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 lg:p-9 !pb-0 gap-4">
                <h2 className={`text-xl lg:text-2xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                  Assigned CPs ({filteredCPs.length.toString().padStart(2, '0')})
                </h2>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  {/* Status Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                      className={`flex items-center justify-between min-w-[140px] border rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${isDark ? "bg-[#1a1a1a] border-[#3D3D3D] text-white hover:bg-[#252525]" : "bg-[#F9FAFB] border-[#D8D8D8] text-black hover:bg-[#F3F4F6]"
                        }`}
                    >
                      <span className="capitalize">{statusFilter === "all" ? "All Status" : statusFilter}</span>
                      <ChevronDown size={16} className={`ml-2 transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isStatusDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsStatusDropdownOpen(false)}></div>
                        <div className={`absolute top-full right-0 mt-2 w-44 border rounded-xl shadow-2xl z-40 overflow-hidden ${isDark ? "bg-[#1a1a1a] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
                          {['all', 'pending', 'accepted', 'rejected'].map((s) => (
                            <button
                              key={s}
                              onClick={() => {
                                setStatusFilter(s as any);
                                setIsStatusDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-sm transition-colors capitalize ${isDark ? "text-white hover:bg-[#E8D1AB] hover:text-black" : "text-black hover:bg-[#E8D1AB]"}`}
                            >
                              {s} Status
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <Button
                    className={`h-11 font-semibold px-6 rounded-xl flex items-center gap-2 transition-all ${isDark ? "bg-[#E8D1AB] hover:bg-[#D4C3A3] text-black" : "bg-[#E8D1AB] hover:bg-[#D9C19A] text-black"}`}
                    onClick={() => router.push(`/admin/select-creatives?id=${leadId}`)}
                  >
                    <Plus size={18} /> Add More CPs
                  </Button>
                </div>
              </div>

              <hr className={`my-6 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#D8D8D8]"}`} />

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
                      {filteredCPs.map((cp, index) => (
                        <SwiperSlide key={cp.id}>
                          <div className="group relative transition-all duration-300">
                            {/* FLOATING IMAGE AREA */}
                            <div
                              onClick={() => handleCPClick(cp.id)}
                              className={`relative aspect-[1.1/1] rounded-[32px] overflow-hidden shadow-2xl mb-4 cursor-pointer ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}
                            >
                              {cp.image ? (
                                <img src={cp.image} alt={cp.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center text-3xl font-bold ${isDark ? "bg-zinc-700" : "bg-zinc-300"}`}>
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
                                  <h3 className={`text-xl font-bold truncate leading-tight ${isDark ? "text-white" : "text-black"}`}>{cp.name}</h3>
                                  <p className={`${isDark ? "text-[#8E8E8E]" : "text-[#666666]"} text-sm mt-0.5`}>{cp.role}</p>
                                </div>

                                <div className={`px-5 py-2 rounded-lg text-xs font-bold capitalize
                                  ${cp.status === 'accepted' ? 'bg-[#12B76A] text-white' :
                                    cp.status === 'rejected' ? 'bg-[#D92D20] text-white' :
                                      'bg-[#E8D1AB] text-black'}`}
                                >
                                  {cp.status}
                                </div>
                              </div>
                              <hr className={`mb-4 ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`} />
                              <div className={`flex items-center gap-2 ${isDark ? "text-white" : "text-black/80"} text-[11px] font-medium`}>
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
                    <div className={`h-[300px] flex items-center justify-center border-dashed border rounded-[32px] ${isDark ? "text-white/40 border-[#3D3D3D]" : "text-black/40 border-[#D8D8D8]"}`}>
                      No partners found matching this status.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Summary Card */}
            <div className={`border transition-colors duration-300 rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
              <div className="flex justify-between items-center p-4 lg:p-9 !pb-0">
                <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                  Booking Summary
                </h2>
                {!isQuoteConvertedLead && (
                  <Button
                    onClick={() => router.push(`/admin/sales-representative/client/${params.id}/edit-booking`)}
                    className={`h-10 w-fit font-semibold py-2 px-4 rounded-lg transition-all text-sm ${isDark ? "bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010]" : "bg-[#E8D1AB] hover:bg-[#D9C19A] text-black"}`}
                  >
                    Edit Details
                  </Button>
                )}
              </div>
              <hr className={`my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`} />

              <div className="flex flex-col gap-3 lg:gap-5 px-4 lg:px-9">
                {booking?.is_multiple_day_shoot && (booking?.booking_days?.length ?? 0) > 0 ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4 mb-1">
                      <div className={`p-3 rounded-lg lg:rounded-xl ${isDark ? "bg-white/5 text-[#8E8E8E]" : "bg-black/5 text-[#666666]"}`}>
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className={`text-xs font-medium mb-1 ${isDark ? "text-[#71717B]" : "text-[#71717B]"}`}>Shoot Schedule</p>
                        <p className="text-xs lg:text-base font-medium text-[#E8D1AB]">{booking.booking_days!.length} Day Shoot</p>
                      </div>
                    </div>
                    <div className={`ml-2 border-l-2 pl-5 flex flex-col gap-3 ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`}>
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
                              <p className={`text-xs lg:text-sm font-medium truncate ${isDark ? "text-white" : "text-black"}`}>{dayDate}</p>
                              <div className={`hidden lg:block w-[1px] h-4 ${isDark ? "bg-[#3D3D3D]" : "bg-[#D8D8D8]"}`} />
                              <p className={`text-xs flex items-center gap-1.5 ${isDark ? "text-[#8E8E8E]" : "text-[#666666]"}`}>
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
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg lg:rounded-xl ${isDark ? "bg-white/5 text-[#8E8E8E]" : "bg-black/5 text-[#666666]"}`}>
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-[#71717B] font-medium mb-1">Shoot Date</p>
                        <p className="text-xs lg:text-base font-medium">{bookingDate}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg lg:rounded-xl ${isDark ? "bg-white/5 text-[#8E8E8E]" : "bg-black/5 text-[#666666]"}`}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-[#71717B] font-medium mb-1">Shoot Time</p>
                        <p className="text-xs lg:text-base font-medium">{shootTimeDisplay}</p>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg lg:rounded-xl ${isDark ? "bg-white/5 text-[#8E8E8E]" : "bg-black/5 text-[#666666]"}`}>
                    <MapPinned size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-[#71717B] font-medium mb-1">Location</p>
                    <p className={`text-xs lg:text-base font-medium max-w-md ${isDark ? "text-white" : "text-black"}`}>{location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg lg:rounded-xl ${isDark ? "bg-white/5 text-[#8E8E8E]" : "bg-black/5 text-[#666666]"}`}>
                    <Camera size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-[#71717B] font-medium mb-1">Shoot Type</p>
                    <p className="text-xs lg:text-base font-medium capitalize">{shootType}</p>
                  </div>
                </div>
              </div>
              <hr className={`my-4 lg:my-9 border-t ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`} />
              <div className="p-4 !pt-0 lg:p-9">
                <BookingStatusStepper currentStep={lead.booking_step || 1} isDark={isDark} />
              </div>
            </div>

            {/* Pricing Breakdown Card */}
            <div className={`border rounded-2xl transition-colors duration-300 ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
              <h2 className={`lg:text-xl font-medium p-4 lg:p-9 !pb-0 ${isDark ? "text-white" : "text-black"}`}>
                Pricing Breakdown
              </h2>
              <hr className={`my-4 lg:my-9 border-t ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`} />
              <div className="flex flex-col gap-3 lg:gap-6 p-4 lg:p-9 lg:pb-6">
                {isQuoteConvertedLead && (
                  <div
                    className={`rounded-2xl border px-4 py-3 ${isDark
                      ? "border-[#4A3E28] bg-[#1E1912] text-[#F5E9D2]"
                      : "border-[#E8D1AB] bg-[#FFF8E8] text-[#5C4717]"
                      }`}
                  >
                    <p className="text-sm font-medium">
                      This booking was created from a quote conversion, so pricing is locked from the approved quote and booking edits are disabled on this page.
                    </p>
                  </div>
                )}
                {/* <div className="flex justify-between font-medium">
                  <span className="text-[#71717B] text-xs">Base Price</span>
                  <span className="text-sm lg:text-base text-white">${basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-[#71717B] text-xs">Editing Fee</span>
                  <span className="text-sm lg:text-base text-white">${editingCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-[#71717B] text-xs">Additional Creatives</span>
                  <span className="text-sm lg:text-base text-white">${additionalCreatives.toLocaleString()}</span>
                </div> */}
                {[["Base Price", basePrice], ["Editing Fee", editingCost], ["Additional Creatives", additionalCreatives]].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">{label}</span>
                    <span className={`text-sm lg:text-base font-mono ${isDark ? "text-white" : "text-black"}`}>${(val as number).toLocaleString()}</span>
                  </div>
                ))}
                {discountCodeValue && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Discount Code</span>
                    <span className={`text-sm lg:text-base font-mono ${isDark ? "text-white" : "text-black"}`}>{discountCodeValue}</span>
                  </div>
                )}
                {discountCodeDiscount > 0 && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Discount Code Discount</span>
                    <span className="text-sm lg:text-base text-red-400">-${discountCodeDiscount.toLocaleString()}</span>
                  </div>
                )}
                {isQuoteConvertedLead && quotePricingDetails?.taxAmount > 0 && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">
                      Tax
                      {quotePricingDetails.taxRate > 0 ? ` (${quotePricingDetails.taxRate}%)` : ""}
                    </span>
                    <span className={`text-sm lg:text-base font-mono ${isDark ? "text-white" : "text-black"}`}>
                      {formatCurrencyValue(quotePricingDetails.taxAmount)}
                    </span>
                  </div>
                )}
                {referralInfo.code && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Referral Code</span>
                    <span className={`text-sm lg:text-base font-mono ${isDark ? "text-white" : "text-black"}`}>{referralInfo.code}</span>
                  </div>
                )}
                {referralDiscountAmount > 0 && (
                  <div className="flex justify-between font-medium">
                    <span className="text-[#71717B] text-xs">Referral Discount</span>
                    <span className="text-sm lg:text-base text-red-400">-${referralDiscountAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <div className={`h-[1px] w-full ${isDark ? "bg-[#3D3D3D]" : "bg-[#E5E5E5]"}`} />
              <div className="p-4 lg:px-9 lg:py-6 flex justify-between items-center">
                <span className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Total Amount</span>
                <span className="lg:text-lg font-semibold text-[#E8D1AB]">${total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Restored Discount Input Validation Logic */}
          <div className="lg:col-span-4 space-y-3 lg:space-y-6">
            <div className={`border transition-colors duration-300 rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
              <h2 className={`lg:text-xl font-medium p-4 lg:p-9 !pb-0 ${isDark ? "text-white" : "text-black"}`}>
                Generate Discount
              </h2>
              <hr className={`my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"}`} />
              <div className="flex flex-col gap-6 p-5 pt-6 lg:p-9">
                <div className="relative w-full">
                  <label className={`absolute -top-2.5 left-4 px-2 text-sm capitalize tracking-widest z-20 pointer-events-none ${isDark ? "bg-[#171717] text-white/60" : "bg-white text-black/60"}`}>
                    Discount Type
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`flex items-center justify-between w-full border rounded-xl px-4 py-4 text-left text-base transition-all duration-300 ${isDark
                        ? `text-white ${isDropdownOpen ? "border-white/80 ring-1 ring-white/20" : "border-white/50"} hover:border-white/80`
                        : `text-black ${isDropdownOpen ? "border-[#E8D1AB] ring-1 ring-[#E8D1AB]/20" : "border-[#D8D8D8]"} hover:border-[#E8D1AB]`
                        }`}
                    >
                      {discountType === "percentage" ? "Percentage" : "Fixed Amount"}
                      <ChevronDown size={18} className={`transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""} ${isDark ? "text-white" : "text-black"}`} />
                    </button>
                    {isDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)}></div>
                        <div className={`absolute top-[calc(100%+8px)] left-0 right-0 border rounded-xl overflow-hidden z-40 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${isDark
                          ? "bg-[#0A0808] border-white/20"
                          : "bg-white border-[#D8D8D8]"
                          }`}>
                          <button
                            onClick={() => {
                              setDiscountType("percentage");
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-4 transition-colors border-b ${isDark
                              ? "text-white hover:bg-white/10 border-white/5"
                              : "text-black hover:bg-gray-50 border-gray-100"
                              }`}
                          >
                            Percentage
                          </button>
                          <button
                            onClick={() => { setDiscountType("fixed_amount"); setIsDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-4 transition-colors ${isDark
                              ? "text-white hover:bg-white/10"
                              : "text-black hover:bg-gray-50"
                              }`}
                          >
                            Fixed Amount
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <label className={`absolute -top-2 lg:-top-2.5 left-4 px-2 text-xs lg:text-sm capitalize tracking-widest z-10 transition-colors duration-300 ${isDark
                    ? "bg-[#171717] text-white/60"
                    : "bg-white text-black/60"
                    }`}>
                    {discountType === "percentage" ? "Discount Percentage" : "Discount Amount"}
                  </label>
                  <div className={`flex items-center border rounded-xl px-4 py-4 bg-transparent transition-all focus-within:border-[#E8D1AB] ${isDark ? "border-white/50" : "border-[#D8D8D8]"}`}>
                    {discountType === "fixed_amount" && <DollarSign size={20} className={isDark ? "text-white mr-1" : "text-black mr-1"} />}
                    <input
                      type="number"
                      placeholder="0"
                      className={`bg-transparent w-full outline-none text-base transition-colors ${isDark ? "text-white placeholder:text-white/40" : "text-black placeholder:text-black/40"}`}
                      value={discount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (discountType === "fixed_amount") {
                          setDiscount(value);
                        } else if (discountType === "percentage" && (value === "" || (parseFloat(value) >= 0 && parseFloat(value) <= 100))) {
                          setDiscount(value);
                        }
                      }}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    />
                    {discountType === "percentage" && <Percent size={20} className={isDark ? "text-white" : "text-black"} />}
                  </div>
                </div>

                <Button
                  className={`h-12 w-full font-semibold py-3.5 rounded-lg transition-all text-sm ${isDark ? "bg-[#E8D1AB] text-[#101010] hover:bg-[#D4C3A3]" : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"} disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={handleGenerateDiscount}
                  disabled={isGenerating || !discount}
                >
                  {isGenerating ? "Generating..." : "Generate Code"}
                </Button>

                {showDiscountCode && generatedCode && (
                  <div className={`flex flex-col gap-2 border rounded-xl p-4 transition-colors duration-300 ${isDark
                    ? "bg-[#0A0808] border-white/50"
                    : "bg-[#F3F4F6] border-[#D8D8D8]"
                    }`}>
                    <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Generated Code</p>
                    <div className="flex gap-2 items-center">
                      <div className={`flex-1 px-3 py-2 border rounded-sm text-sm font-mono transition-colors ${isDark
                        ? "bg-[#171717] border-[#3F3F46] text-[#E8D1AB]"
                        : "bg-white border-[#D8D8D8] text-[#B18A00]"
                        }`}>
                        {generatedCode}
                      </div>
                      <Button
                        className={`h-8 w-8 transition-colors ${isDark
                          ? "bg-[#171717] hover:bg-[#272626] text-white"
                          : "bg-white border border-[#D8D8D8] hover:bg-gray-100 text-black"
                          }`}
                        onClick={handleCopyCode}>
                        <Copy size={16} className={`${isDark ? "text-white" : "text-black"}`} />
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
              isDark={isDark}
            />

            <GeneratePaymentLink
              leadId={parseInt(leadId)}
              bookingId={lead?.booking_id}
              discountCodeId={generatedDiscountId}
              bookingStatus={status}
              isDark={isDark}
              activeLink={lead?.active_payment_link}
            />

            {quotePricingDetails && (
              <div className={`border transition-colors duration-300 rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"}`}>
                <div className="p-4 lg:p-7">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                        Quote Pricing Details
                      </h2>
                      <p className={`mt-1 text-xs ${isDark ? "text-white/55" : "text-black/55"}`}>
                        Converted from quote #{quotePricingDetails.quoteId ?? "N/A"}
                      </p>
                    </div>
                    {quotePricingDetails.status && (
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-medium capitalize ${isDark ? "bg-white/5 text-[#E8D1AB]" : "bg-[#FFF6D9] text-[#7A5A00]"
                          }`}
                      >
                        {quotePricingDetails.status}
                      </span>
                    )}
                  </div>

                  <div className={`mt-5 grid grid-cols-2 gap-3 rounded-2xl p-4 ${isDark ? "bg-[#111111]" : "bg-[#F8F8F8]"}`}>
                    <div>
                      <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-black/40"}`}>Pricing Mode</p>
                      <p className={`mt-1 text-sm font-medium capitalize ${isDark ? "text-white" : "text-black"}`}>
                        {quotePricingDetails.pricingMode || "General"}
                      </p>
                    </div>
                    <div>
                      <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-black/40"}`}>Shoot Hours</p>
                      <p className={`mt-1 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                        {quotePricingDetails.shootHours || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-black/40"}`}>Subtotal</p>
                      <p className={`mt-1 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                        {formatCurrencyValue(quotePricingDetails.subtotal)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-black/40"}`}>Discount</p>
                      <p className="mt-1 text-sm font-medium text-red-400">
                        {formatCurrencyValue(quotePricingDetails.discountAmount)}
                      </p>
                    </div>
                    {quotePricingDetails.taxAmount > 0 && (
                      <>
                        <div>
                          <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-black/40"}`}>After Discount</p>
                          <p className={`mt-1 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                            {formatCurrencyValue(quotePricingDetails.priceAfterDiscount)}
                          </p>
                        </div>
                        <div>
                          <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-black/40"}`}>
                            Tax
                            {quotePricingDetails.taxRate > 0 ? ` (${quotePricingDetails.taxRate}%)` : ""}
                          </p>
                          <p className={`mt-1 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                            {formatCurrencyValue(quotePricingDetails.taxAmount)}
                          </p>
                        </div>
                      </>
                    )}
                    {quotePricingDetails.expiresAt && (
                      <div className="col-span-2">
                        <p className={`text-[11px] uppercase tracking-[0.18em] ${isDark ? "text-white/40" : "text-black/40"}`}>Quote Expiry</p>
                        <p className={`mt-1 text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                          {formatDateUI(quotePricingDetails.expiresAt) || "N/A"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Quote Line Items</p>
                      <p className={`text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                        {quotePricingDetails.source === "database" ? "Saved quote data" : "Projected quote"}
                      </p>
                    </div>

                    {quotePricingDetails.lineItems.length > 0 ? (
                      quotePricingDetails.lineItems.map((item) => (
                        <div
                          key={item.id}
                          className={`rounded-2xl border p-4 ${isDark ? "border-[#2D2D2D] bg-[#111111]" : "border-[#ECECEC] bg-[#FCFCFC]"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
                                {item.name}
                              </p>
                              <p className={`mt-1 text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
                                Qty {item.quantity} x {formatCurrencyValue(item.unitPrice)}
                              </p>
                              {item.notes && (
                                <p className={`mt-2 text-xs capitalize ${isDark ? "text-[#E8D1AB]" : "text-[#8C6A00]"}`}>
                                  {item.notes}
                                </p>
                              )}
                            </div>
                            <p className={`shrink-0 text-sm font-semibold ${isDark ? "text-white" : "text-black"}`}>
                              {formatCurrencyValue(item.total)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={`rounded-2xl border border-dashed p-4 text-sm ${isDark ? "border-[#3D3D3D] text-white/45" : "border-[#D8D8D8] text-black/45"}`}>
                        No quote line items were returned for this converted booking.
                      </div>
                    )}
                  </div>

                  <div className={`mt-5 flex items-center justify-between rounded-2xl px-4 py-4 ${isDark ? "bg-[#0F0F0F]" : "bg-[#F8F8F8]"}`}>
                    <span className={`text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>Quoted Total</span>
                    <span className="text-lg font-semibold text-[#E8D1AB]">
                      {formatCurrencyValue(quotePricingDetails.total)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="lg:text-right lg:mt-[82px]">
              <Button
                onClick={() => router.push(`/admin/select-creatives?id=${leadId}`)}
                className={`text-sm font-semibold h-12 px-4 lg:px-7 rounded-lg border transition-all ${isDark
                  ? "text-white bg-[#202020] border-white/20 hover:bg-white/10"
                  : "text-black bg-white border-[#D8D8D8] hover:bg-gray-50 shadow-sm"
                  }`}
              >
                Change CPs
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isCPModalOpen} onOpenChange={setIsCPModalOpen}>
        <DialogContent
          className={`max-w-5xl overflow-y-auto max-h-[90vh] no-scrollbar p-0 transition-colors duration-300 border ${isDark
            ? "bg-[#101010] border-[#333] text-white"
            : "bg-white border-[#D8D8D8] text-black"
            }`}
        >
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
