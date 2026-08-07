"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, CalendarClock, Eye, Loader2, MessageCircle, MessageCirclePlus, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { fileManagerApi } from "@/lib/fileManagerApi";
import {
  getProjectDateText,
  getPaymentStatusMeta,
  getProjectScheduleTimeText,
  getProjectScheduleTooltipText,
  getShootFilesText,
} from "@/lib/utils/shootDetails";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils"
import { resolveTimelineStage, timelineStageToHeaderLabel } from "@/lib/utils/projectTimeline";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/components/landing/ui/tooltip";

import { DeleteConfirmationModal } from "@/components/admin/DeleteConfirmationModal";
import BookingDateTimeSection, {
  type BookingScheduleData,
} from "@/components/quotes/BookingDateTimeSection";

type ShootHeaderProject = {
  payment_status?: string | null;
  payment_id?: string | number | null;
  project_name?: unknown;
  skills_needed?: unknown;
  status?: number;
  timeline_status?: number;
  timeline_label?: string;
  description?: unknown;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  event_start_time?: string;
  event_end_time?: string;
  booking_type?: string | null;
  booking_days?: Array<{
    date?: string | null;
    event_date?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    time_zone?: string | null;
  }> | null;
  time_zone?: string | null;
  total_paid_amount?: string | number;
  total_value_amount?: string | number;
  converted_sales_quote_id?: string | number | null;
  converted_quote_amount?: string | number;
  converted_quote_total?: string | number;
  event_location?: unknown;
  location?: unknown;
  city?: unknown;
  state?: unknown;
  country?: unknown;
  latitude?: string | number | null;
  longitude?: string | number | null;
  location_latitude?: string | number | null;
  location_longitude?: string | number | null;
  needs_attention?: {
    required?: boolean;
    missing_fields?: string[];
  } | null;
  [key: string]: unknown;
};

const parseAmount = (value: unknown): number => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const getAmount = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
};

const formatCurrencyLike = (value: unknown): string => {
  const amount = getAmount(value) ?? 0;
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;

const toDisplayText = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
};

const getLocationText = (project?: ShootHeaderProject): string => {
  const location = asRecord(project?.location);
  const directLocation = toDisplayText(project?.event_location);
  if (directLocation) return directLocation;

  const nestedLocation = [
    location?.formatted_address,
    location?.address,
    location?.name,
    location?.label,
  ].map(toDisplayText).find(Boolean);
  if (nestedLocation) return nestedLocation;

  const locationParts = [
    project?.location,
    project?.city,
    project?.state,
    project?.country,
  ].map(toDisplayText).filter(Boolean);

  return locationParts.join(", ") || "No location specified";
};

const ScheduleTooltipValue = ({
  value,
  tooltip,
  isDark,
}: {
  value: string;
  tooltip: string;
  isDark: boolean;
}) => {
  if (!tooltip) {
    return <span className={`inline-block max-w-full whitespace-nowrap truncate text-right ${isDark ? "text-white" : "text-black"}`}>{value}</span>;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-block max-w-full select-none whitespace-nowrap truncate text-right ${isDark ? "text-white" : "text-black"}`}
          >
            {value}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="end"
          sideOffset={6}
          avoidCollisions
          style={{
            backgroundColor: isDark ? "#111111" : "#ffffff",
            color: isDark ? "#ffffff" : "#111111",
            borderColor: isDark ? "#3D3D3D" : "#E7D7BC",
          }}
          className={cn(
            "max-w-[260px] select-none whitespace-pre-line rounded-lg border px-2.5 py-1.5 text-[11px] leading-4 shadow-lg",
          )}
        >
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface ShootHeaderProps {
  activeTab?: string;
  project?: ShootHeaderProject;
  projectId?: string;
  convertedSalesQuoteId?: string | null;
  hasFormDetails?: boolean;
  missingFields?: string[];
  onOpenMissingFields?: () => void;
  onScheduleUpdated?: () => void | Promise<void>;
  notesCount?: number;
  onOpenNotes?: () => void;
}

const getBrowserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Calcutta";

const getDateInputValue = (value?: string | null) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";
  const datePrefix = rawValue.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (datePrefix) return datePrefix;

  const parsedDate = new Date(rawValue);
  if (Number.isNaN(parsedDate.getTime())) return "";

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTimeInputValue = (value?: string | null) => {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "";

  const match = rawValue.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*([AaPp][Mm]))?$/);
  if (match) {
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridiem = match[3]?.toUpperCase();

    if (meridiem) {
      if (hours === 12) {
        hours = meridiem === "AM" ? 0 : 12;
      } else if (meridiem === "PM") {
        hours += 12;
      }
    }

    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
  }

  const parsedDate = new Date(rawValue);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return `${String(parsedDate.getHours()).padStart(2, "0")}:${String(parsedDate.getMinutes()).padStart(2, "0")}`;
};

const getNumericValue = (...values: unknown[]) => {
  for (const value of values) {
    const parsedValue = Number(value);
    if (Number.isFinite(parsedValue)) return parsedValue;
  }

  return null;
};

const buildBookingScheduleData = (project?: ShootHeaderProject): BookingScheduleData => {
  const explicitType = String(project?.booking_type || "").trim().toLowerCase();
  const bookingDays = Array.isArray(project?.booking_days) ? project.booking_days : [];
  const timeZone = String(project?.time_zone || "").trim() || getBrowserTimeZone();

  if (explicitType === "tbd") {
    return {
      booking_type: "tbd",
      time_zone: timeZone,
    };
  }

  const normalizedBookingDays = bookingDays
    .map((day) => {
      const date = getDateInputValue(day?.event_date || day?.date);
      const startTime = getTimeInputValue(day?.start_time);
      const endTime = getTimeInputValue(day?.end_time);

      return date && startTime && endTime
        ? {
          date,
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
        }
        : null;
    })
    .filter((day): day is { date: string; start_time: string; end_time: string } => Boolean(day));

  if (explicitType === "multi_day" || normalizedBookingDays.length > 1) {
    return normalizedBookingDays.length > 0
      ? {
        booking_type: "multi_day",
        time_zone: timeZone,
        booking_days: normalizedBookingDays,
      }
      : {
        booking_type: "tbd",
        time_zone: timeZone,
      };
  }

  const startDate = getDateInputValue(project?.event_date);
  const startTime = getTimeInputValue(project?.start_time || project?.event_start_time);
  const endTime = getTimeInputValue(project?.end_time || project?.event_end_time);

  if (startDate && startTime && endTime) {
    return {
      booking_type: "single_day",
      time_zone: timeZone,
      start_date: startDate,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
    };
  }

  return {
    booking_type: "tbd",
    time_zone: timeZone,
  };
};

export default function ShootHeader({
  activeTab = "Overview",
  project,
  projectId,
  convertedSalesQuoteId = null,
  hasFormDetails = false,
  onScheduleUpdated,
  notesCount = 0,
  onOpenNotes,
}: ShootHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const { canEdit } = usePermissions("shoots");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [workspaceFileCount, setWorkspaceFileCount] = React.useState<number | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = React.useState(false);
  const [scheduleDraft, setScheduleDraft] = React.useState<BookingScheduleData | null>(null);
  const shootBasePath = pathname?.startsWith("/sales") ? "/sales/shoots" : "/admin/shoots";
  const paymentStatus = getPaymentStatusMeta(project?.payment_status, project?.payment_id);
  const isConvertedBooking = !!(project?.is_quote_converted_booking || project?.converted_sales_quote_id);
  const convertedTotalValue = parseAmount(project?.total_value_amount);
  const convertedPaidAmount = parseAmount(project?.total_paid_amount);
  const pricingBreakdown =
    (project?.pricing_breakdown as Record<string, unknown> | undefined) ||
    ((project?.lead_details as Record<string, unknown> | undefined)?.pricing_breakdown as Record<string, unknown> | undefined) ||
    {};
  const projectQuote = asRecord(project?.sales_quote) || asRecord(project?.quote);
  const primaryQuote =
    asRecord(project?.primary_quote) ||
    asRecord(asRecord(project?.booking)?.primary_quote) ||
    asRecord((project?.lead_details as Record<string, unknown> | undefined)?.primary_quote);
  const customQuote =
    asRecord(project?.custom_quote) ||
    asRecord((project?.lead_details as Record<string, unknown> | undefined)?.custom_quote);
  const projectConvertedSalesQuoteId = String(project?.converted_sales_quote_id || "").trim() || null;
  const isQuoteBasedShoot = Boolean(convertedSalesQuoteId || projectConvertedSalesQuoteId);
  const lockedQuoteAmount = isQuoteBasedShoot
    ? getAmount(
      project?.converted_quote_amount,
      project?.converted_quote_total,
      projectQuote?.final_total,
      projectQuote?.total_amount,
      projectQuote?.amount_after_tax,
      projectQuote?.total,
      primaryQuote?.final_total,
      primaryQuote?.total_amount,
      primaryQuote?.total,
      customQuote?.final_total,
      customQuote?.total_amount,
      customQuote?.total,
      project?.total_value_amount,
      project?.total_paid_amount
    )
    : undefined;
  const manualPaymentSummary =
    (project?.manual_payment_summary as Record<string, unknown> | undefined) ||
    ((project?.lead_details as Record<string, unknown> | undefined)?.manual_payment_summary as Record<string, unknown> | undefined) ||
    {};

  const subtotalValue = parseAmount(pricingBreakdown.subtotal);
  const isFullyDiscountedShoot = parseAmount(pricingBreakdown.total) === 0 && parseAmount(pricingBreakdown.subtotal) > 0;
  const totalBeforeCredit = parseAmount(pricingBreakdown.total_before_credit);
  const discountValue = parseAmount(pricingBreakdown.discount);
  const creditAppliedValue = parseAmount(pricingBreakdown.credit_applied);
  const totalAfterCredit = parseAmount(pricingBreakdown.total_after_credit);
  const totalValue = isConvertedBooking
    ? convertedTotalValue
    : (totalBeforeCredit ||
      subtotalValue ||
      Math.max(parseAmount(pricingBreakdown.total) + discountValue + creditAppliedValue, 0) ||
      parseAmount(project?.total_paid_amount));

  const totalReductionValue = isFullyDiscountedShoot
    ? discountValue
    : isConvertedBooking
      ? 0
      : Math.max(discountValue + creditAppliedValue, 0);

  const finalValue = isFullyDiscountedShoot
    ? 0
    : isConvertedBooking
      ? convertedTotalValue
      : (totalAfterCredit ||
        parseAmount(pricingBreakdown.total) ||
        Math.max(totalValue - totalReductionValue, 0));

  const isFullyPaidByManualSummary = Boolean(manualPaymentSummary.hasFullPayment);
  let effectivePaymentStatus = isFullyPaidByManualSummary
    ? getPaymentStatusMeta("paid", project?.payment_id)
    : paymentStatus;

  if (isConvertedBooking) {
    const isFullyDiscounted = parseAmount(pricingBreakdown.total) === 0 && parseAmount(pricingBreakdown.subtotal) > 0;
    const statusKey = isFullyDiscounted
      ? "paid"
      : convertedPaidAmount >= convertedTotalValue && convertedTotalValue > 0
        ? "paid"
        : convertedPaidAmount > 0
          ? "Partially Paid"
          : "unpaid";
    effectivePaymentStatus = getPaymentStatusMeta(statusKey, project?.payment_id);
  }

  const manualPaidAmount = parseAmount(manualPaymentSummary.paidAmount);
  const manualPendingAmount = parseAmount(manualPaymentSummary.pendingAmount);
  const summaryPaidAmount = getAmount(project?.paid_amount, project?.total_paid_amount);
  const summaryPendingAmount = getAmount(project?.pending_amount, project?.due_amount);
  const hasMeaningfulManualProgress =
    Boolean(manualPaymentSummary.hasFullPayment) ||
    Boolean(manualPaymentSummary.isPartiallyPaid) ||
    manualPaidAmount > 0;

  const isPaidStatus = String(effectivePaymentStatus.label || "").toLowerCase() === "paid";

  const paidAmountValue = isConvertedBooking
    ? convertedPaidAmount
    : (summaryPaidAmount !== undefined
      ? summaryPaidAmount
      : hasMeaningfulManualProgress
      ? manualPaidAmount
      : isPaidStatus
        ? finalValue
        : 0);

  const pendingAmountValue = isFullyDiscountedShoot
    ? 0
    : summaryPendingAmount !== undefined
      ? summaryPendingAmount
      : hasMeaningfulManualProgress && manualPendingAmount > 0
        ? manualPendingAmount
      : Math.max(finalValue - paidAmountValue, 0);
  const shootFilesText =
    workspaceFileCount != null
      ? `${workspaceFileCount} File${workspaceFileCount === 1 ? "" : "s"}`
      : getShootFilesText(project);
  const projectName = toDisplayText(project?.project_name) || "Untitled Project";
  const skillsText = Array.isArray(project?.skills_needed)
    ? project.skills_needed.map(toDisplayText).filter(Boolean).join(", ")
    : toDisplayText(project?.skills_needed);
  const locationText = getLocationText(project);
  const guestEmail = String(
    project?.guest_email ||
    (project?.lead_details as Record<string, unknown> | undefined)?.guest_email ||
    project?.email ||
    ""
  ).trim();
  const isSalesView = pathname?.startsWith("/sales");
  const resolvedClientId = Number(
    project?.client_id ||
    project?.client_record_id ||
    (project?.lead_details as Record<string, unknown> | undefined)?.client_id ||
    0
  ) || null;
  const rawDescription = toDisplayText(project?.description);
  const descriptionText = rawDescription
    ? rawDescription.replace(/Matching Method:.*$/gm, "").trim()
    : "";
  const totalValueText = `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalReductionText = `$${totalReductionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const finalValueText = `$${finalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const paidAmountText = `$${paidAmountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pendingAmountText = `$${pendingAmountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  useEffect(() => {
    let isMounted = true;

    const loadWorkspaceSummary = async () => {
      if (!projectId) return;

      try {
        const response = await fileManagerApi.getExternalWorkspace(projectId);
        if (!isMounted) return;

        setWorkspaceFileCount(
          typeof response.workspace.fileCount === "number" ? response.workspace.fileCount : null
        );
      } catch {
        if (!isMounted) return;
        setWorkspaceFileCount(null);
      }
    };

    loadWorkspaceSummary();

    return () => {
      isMounted = false;
    };
  }, [projectId]);
  const hasScheduledDate =
    Boolean(project?.event_date) ||
    (Array.isArray(project?.booking_days) && project.booking_days.length > 0);
  const projectDateText = hasScheduledDate ? getProjectDateText(project) : "TBD";
  const projectTimeText = hasScheduledDate ? getProjectScheduleTimeText(project) : "TBD";
  const scheduleTooltipText = getProjectScheduleTooltipText(project);

  useEffect(() => {
    if (!isScheduleModalOpen) return;

    setScheduleDraft(buildBookingScheduleData(project));
  }, [isScheduleModalOpen, project]);
  const resolvedStatusLabel =
    project?.timeline_label ||
    timelineStageToHeaderLabel(resolveTimelineStage(project));
  const renderDescription = (text: string) => {
    if (!text) return <span>No description available.</span>;

    const lines = text.split(/\r?\n/);
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIndex) => {
      if (line.includes("[BEIGE_STUDIO_META]")) {
        const jsonStr = line.replace("[BEIGE_STUDIO_META]", "");
        try {
          const parsed = JSON.parse(jsonStr);
          const meta = Array.isArray(parsed) ? parsed[0] : parsed;

          if (meta) {
            if (meta.name) {
              elements.push(<div key="meta-name" className="font-medium mb-1">{meta.name}</div>);
            }
            if (meta.location) {
              elements.push(<div key="meta-location" className="mb-2">{meta.location}</div>);
            }

            elements.push(
              <div key="meta-row-1" className="flex flex-wrap gap-x-8 gap-y-1 mb-1">
                {meta.priceLabel && <span>Pricing: {meta.priceLabel}</span>}
                {meta.totalPrice && (
                  <span>
                    Total Price: {
                      finalValue > (getAmount(meta.totalPrice) ?? 0)
                        ? finalValueText
                        : formatCurrencyLike(meta.totalPrice)
                    }
                  </span>
                )}
              </div>
            );

            elements.push(
              <div key="meta-row-2" className="flex flex-wrap gap-x-8 gap-y-1 mb-2">
                {meta.selectedDate && <span>Date: {meta.selectedDate}</span>}
                {meta.startTime && meta.endTime && <span>Time: {meta.startTime} - {meta.endTime}</span>}
              </div>
            );
          }
        } catch (e) {
          elements.push(<div key={`description-line-${lineIndex}`}>{line}</div>);
        }
      }
      else {
        const phoneMatch = line.match(/^(\s*Phone\s*:\s*)(.+)$/i);
        const emailMatch = line.match(/^(\s*Email\s*:\s*)(.+)$/i);

        if (phoneMatch) {
          const phoneValue = phoneMatch[2].trim();
          const telValue = phoneValue.replace(/[^\d+]/g, "");

          elements.push(
            <div key={`description-line-${lineIndex}`} className="flex items-center gap-2">
              <span>{phoneMatch[1]}</span>
              <a
                href={`tel:${telValue}`}
                className="break-all transition-colors hover:opacity-80"
                title={`Call ${phoneValue}`}
                aria-label={`Call ${phoneValue}`}
              >
                {phoneValue}
              </a>
            </div>
          );
        } else if (emailMatch) {
          const emailValue = emailMatch[2].trim();

          elements.push(
            <div key={`description-line-${lineIndex}`} className="flex items-center gap-2">
              <span>{emailMatch[1]}</span>
              <a
                href={`mailto:${emailValue}`}
                className="break-all transition-colors hover:opacity-80"
                title="Email ID"
                aria-label={`Email ${emailValue}`}
              >
                {emailValue}
              </a>
            </div>
          );
        } else if (line.trim()) {
          elements.push(<div key={`description-line-${lineIndex}`}>{line}</div>);
        }

      }
    });

    return elements;
  };

  const handleViewClientDetails = () => {
    if (resolvedClientId) {
      router.push(`/admin/users/clients/${resolvedClientId}`);
      return;
    }
    toast.error("This user is not available in our BEIGE members.");
  };

  const handleDelete = async () => {
    if (!projectId) return;
    setIsDeleting(true);

    try {
      const response = await adminApi.deleteProject(projectId);
      if (response?.success || response?.message === "Project deleted successfully") {
        toast.success("Shoot deleted successfully");
        router.push('/admin/shoots');
      } else {
        toast.error(response?.error || "Failed to delete shoot");
      }
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!projectId || !canEdit) return;

    if (!scheduleDraft) {
      toast.error("Please select a booking date and time or choose TBD.");
      return;
    }

    const locationForPayload = locationText === "No location specified" ? "" : locationText.trim();

    if (scheduleDraft.booking_type !== "tbd" && !locationForPayload) {
      toast.error("Shoot location is required before rescheduling.");
      return;
    }

    setIsSavingSchedule(true);
    try {
      const timeZone = String(project?.time_zone || "").trim() || getBrowserTimeZone();
      const locationFields = locationForPayload
        ? {
          location: locationForPayload,
          latitude: getNumericValue(project?.latitude, project?.location_latitude),
          longitude: getNumericValue(project?.longitude, project?.location_longitude),
        }
        : {};

      const payload =
        scheduleDraft.booking_type === "tbd"
          ? {
            booking_type: "tbd" as const,
            time_zone: scheduleDraft.time_zone || timeZone,
          }
          : scheduleDraft.booking_type === "multi_day"
            ? {
              booking_type: "multi_day" as const,
              time_zone: scheduleDraft.time_zone || timeZone,
              ...locationFields,
              booking_days: scheduleDraft.booking_days,
            }
            : {
              booking_type: "single_day" as const,
              time_zone: scheduleDraft.time_zone || timeZone,
              ...locationFields,
              start_date: scheduleDraft.start_date,
              start_time: scheduleDraft.start_time,
              end_time: scheduleDraft.end_time,
            };

      const response = await adminApi.updateShootDateLocation(projectId, payload);

      if (response?.success === false || response?.error) {
        throw new Error(response?.error || response?.message || "Failed to update shoot schedule");
      }

      toast.success("Shoot schedule updated");
      setIsScheduleModalOpen(false);
      await onScheduleUpdated?.();
    } catch (error) {
      console.error("Failed to update shoot schedule", error);
      toast.error(error instanceof Error ? error.message : "Failed to update shoot schedule");
    } finally {
      setIsSavingSchedule(false);
    }
  };

  if (!mounted) return null;

  return (
    <div data-active-tab={activeTab}>
      <button
        onClick={() => router.back()}
        className={`lg:hidden transition-colors flex items-center gap-2 mb-5 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Top Bar */}
      <div className="hidden lg:flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className={`transition-colors flex items-center gap-2 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>

        <div className="flex gap-3">
          {hasFormDetails ? (
            <Button
              variant="outline"
              className="bg-[#2C2C2C] border-none text-[#E5D5B8] hover:bg-[#3D3D3D] hover:text-[#f0e4d0] rounded-lg h-10 px-4 gap-2"
              onClick={() => router.push(`${shootBasePath}/${projectId}/form-details`)}
            >
              <Eye className="w-4 h-4" /> View Form Details
            </Button>
          ) : null}
          <Button
            onClick={() => router.push(`${shootBasePath}/${projectId}/edit-booking`)}
            disabled={!canEdit}
            title={canEdit ? "Edit Shoot" : "Edit permission not allowed"}
            className="bg-[#E5D5B8] text-black hover:bg-[#D4C3A3] rounded-lg h-10 px-6 font-medium"
          >
            Edit Shoot
          </Button>
          {/* <Button
            onClick={() => router.push(`${shootBasePath}/${projectId}/edit-booking`)}
            className="bg-[#E5D5B8] text-black hover:bg-[#D4C3A3] rounded-lg h-10 px-6 font-medium"
          >
            Edit Shoot
          </Button> */}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Shoot"
        description="Are you sure you want to delete this shoot? This action cannot be undone."
        isLoading={isDeleting}
      />

      {isScheduleModalOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className={`max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl border shadow-2xl ${isDark ? "border-[#3D3D3D] bg-[#171717] text-white" : "border-[#E5E5E5] bg-white text-black"}`}>
            <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? "border-[#2D2D2D]" : "border-[#EFEFEF]"}`}>
              <div>
                <h3 className="text-base font-semibold">Edit Shoot Schedule</h3>
                <p className={`mt-1 text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                  Update the client&apos;s rescheduled date and time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                disabled={isSavingSchedule}
                className={`rounded-lg p-2 transition-colors ${isDark ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-black/50 hover:bg-black/5 hover:text-black"}`}
                aria-label="Close schedule editor"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-5">
              <BookingDateTimeSection
                key={`${projectId || "shoot"}-${isScheduleModalOpen ? "open" : "closed"}`}
                isDark={isDark}
                initialData={scheduleDraft}
                onChange={setScheduleDraft}
              />
              <div className={`mt-5 rounded-xl px-4 py-3 text-xs leading-5 ${isDark ? "bg-white/[0.04] text-white/55" : "bg-[#F8F4EA] text-black/55"}`}>
                {scheduleDraft?.booking_type === "tbd" ? (
                  "Saving as TBD will remove the shoot date and time from this booking."
                ) : (
                  <>
                    Location will stay as: <span className={isDark ? "text-white/80" : "text-black/75"}>{locationText}</span>
                  </>
                )}
              </div>
            </div>

            <div className={`flex justify-end gap-2 border-t px-5 py-4 ${isDark ? "border-[#2D2D2D]" : "border-[#EFEFEF]"}`}>
              <Button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                disabled={isSavingSchedule}
                variant="outline"
                className={isDark ? "border-white/10 bg-transparent text-white hover:bg-white/10" : "border-[#E5E5E5] bg-white text-black hover:bg-black/5"}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule || !canEdit}
                className="bg-[#E5D5B8] text-black hover:bg-[#D4C3A3]"
              >
                {isSavingSchedule ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Hero Section */}
      <div className={`transition-all duration-300 lg:rounded-2xl mb-6 lg:mb-10`}>
        <div className="flex gap-5">
          <div className={`w-10 h-10 lg:w-16 lg:h-16 rounded-lg lg:rounded-2xl flex items-center justify-center text-sm lg:text-2xl font-bold ${isDark ? "bg-[#FFF6D9] text-black" : "bg-[#DCE8FA] text-[#1F2A44]"}`}>
            {getInitials(projectName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className={`lg:text-2xl font-bold transition-colors ${isDark ? "text-white" : "text-black"}`}>
                    {projectName}
                    {skillsText && skillsText !== "N/A" && <span className={`font-normal lg:text-lg ml-2 ${isDark ? "text-[#888]" : "text-[#666]"}`}>({skillsText})</span>}
                  </h1>
                  <span className="bg-[#FFF9E5] text-[#B18A00] text-xs font-semibold px-3 py-1 rounded-full border border-[#B18A00]/20">
                    {resolvedStatusLabel}
                  </span>
                  {convertedSalesQuoteId ? (
                    <span className="border border-[#86EFAC]/20 bg-[#DCFCE7] text-[#166534] text-xs font-semibold px-3 py-1 rounded-full">
                      Converted to Booking
                    </span>
                  ) : null}
                </div>
                <div className={`text-sm leading-relaxed max-w-3xl transition-colors whitespace-pre-line ${isDark ? "text-[#888888]" : "text-[#666666]"}`}>
                  {renderDescription(descriptionText)}
                </div>

                {guestEmail ? (
                  <div className="mt-2 max-w-3xl flex items-center gap-1 flex-wrap">
                    <span className={`text-sm leading-relaxed ${isDark ? "text-[#888888]" : "text-[#666666]"}`}>
                      Email Id :
                    </span>
                    <a
                      href={`mailto:${guestEmail}`}
                      className={`text-sm leading-relaxed break-all transition-colors hover:opacity-80 ${isDark ? "text-[#888888]" : "text-[#666666]"}`}
                      title="Email ID"
                      aria-label={`Email ${guestEmail}`}
                      >
                        {guestEmail}
                    </a>
                    {!isSalesView ? (
                      <button
                        type="button"
                        onClick={handleViewClientDetails}
                        className={`text-xs font-medium underline underline-offset-2 ml-1 ${isDark ? "text-[#E8D1AB] hover:text-[#F2E2C2]" : "text-[#7A5A00] hover:text-[#5E4300]"}`}
                      >
                        View Client Details
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>

            </div>
          </div>
        </div>

        <div>
          <div className={`hidden lg:block w-full h-px my-6 transition-colors ${isDark ? "bg-[#222222]" : "bg-[#E5E5E5]"}`} />
          <div className={`mt-4 lg:mt-0 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 text-sm lg:text-base ${isDark ? "text-[#AAA7A7]" : "text-[#AAA7A7] lg:text-[#747171]"}`}>
            <div className="space-y-3 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-white/40" : "text-black/40"}`}>Schedule & Location</p>
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  disabled={!canEdit || !projectId}
                  title={canEdit ? "Edit schedule" : "Edit permission not allowed"}
                  className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${isDark ? "border-white/10 bg-white/[0.03] text-[#E8D1AB] hover:bg-white/[0.07]" : "border-[#E7D7BC] bg-[#FFFCF6] text-[#7A5A00] hover:bg-[#F6EFD9]"}`}
                >
                  <CalendarClock size={14} />
                  Edit
                </button>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <span className="whitespace-nowrap">Shoot Date :</span>
                <ScheduleTooltipValue
                  value={projectDateText}
                  tooltip={projectDateText === "Multiple Days" ? scheduleTooltipText : ""}
                  isDark={isDark}
                />
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <span className="whitespace-nowrap">Time :</span>
                <span className={`inline-block max-w-full whitespace-nowrap truncate text-right ${isDark ? "text-white" : "text-black"}`}>{projectTimeText}</span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <span className="whitespace-nowrap">Location :</span>
                <span title={locationText} className={`${isDark ? "text-white" : "text-black"} whitespace-nowrap truncate text-right`}>
                  {locationText}
                </span>
              </div>
            </div>

            <div className="space-y-3 min-w-0">
              <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-white/40" : "text-black/40"}`}>Pricing Breakdown</p>
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Total Value :</span>
                <span title={totalValueText} className={`whitespace-nowrap truncate text-right ${isDark ? "text-white" : "text-black"}`}>
                  {totalValueText}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Discount/Referral/Credit :</span>
                <span title={totalReductionText} className={`whitespace-nowrap truncate text-right ${isDark ? "text-white" : "text-black"}`}>
                  {totalReductionText}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Final Value :</span>
                <span title={finalValueText} className={`whitespace-nowrap truncate text-right ${isDark ? "text-white" : "text-black"}`}>
                  {finalValueText}
                </span>
              </div>
            </div>

            <div className="space-y-3 min-w-0">
              <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-white/40" : "text-black/40"}`}>Other Details</p>
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Payment Status :</span>
                <span title={effectivePaymentStatus.label} className={cn("whitespace-nowrap truncate text-right", effectivePaymentStatus.className)}>
                  {effectivePaymentStatus.label}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Paid Amount :</span>
                <span title={paidAmountText} className="font-medium whitespace-nowrap truncate text-right text-emerald-500">
                  {paidAmountText}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Pending Amount :</span>
                <span title={pendingAmountText} className="whitespace-nowrap truncate text-right text-amber-500">
                  {pendingAmountText}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Shoot Files :</span>
                <span title={shootFilesText} className={`whitespace-nowrap truncate text-right ${isDark ? "text-white" : "text-black"}`}>{shootFilesText}</span>
              </div>
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Notes :</span>
                <button
                  type="button"
                  onClick={onOpenNotes}
                  className="inline-flex items-center gap-1 transition-opacity hover:opacity-70 outline-none"
                >
                  <MessageCircle 
                    size={15} 
                    className={isDark ? "text-white" : "text-black"} 
                  />       
                  <div className="flex flex-col items-center justify-center">
                    <span className={cn(
                      "text-base leading-none translate-y-[1px]",
                      isDark ? "text-white" : "text-black"
                    )}>
                      {String(notesCount || 0).padStart(2, '0')}
                    </span>
                    <div className={cn(
                      "w-full h-[1.5px] mt-0.5", 
                      isDark ? "bg-white" : "bg-black"
                    )} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
