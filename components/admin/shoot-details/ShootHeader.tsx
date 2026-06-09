"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle, Eye } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { fileManagerApi } from "@/lib/fileManagerApi";
import {
  getProjectDateText,
  getPaymentStatusMeta,
  getProjectScheduleTimeText,
  getShootFilesText,
} from "@/lib/utils/shootDetails";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils"
import { resolveTimelineStage, timelineStageToHeaderLabel } from "@/lib/utils/projectTimeline";
import { usePermissions } from "@/lib/hooks/usePermissions";

import { DeleteConfirmationModal } from "@/components/admin/DeleteConfirmationModal";

type ShootHeaderProject = {
  payment_status?: string | null;
  payment_id?: string | number | null;
  project_name?: string;
  skills_needed?: string;
  status?: number;
  timeline_status?: number;
  timeline_label?: string;
  description?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  event_start_time?: string;
  total_paid_amount?: string | number;
  total_value_amount?: string | number;
  converted_sales_quote_id?: string | number | null;
  converted_quote_amount?: string | number;
  converted_quote_total?: string | number;
  event_location?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
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

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;

interface ShootHeaderProps {
  activeTab?: string;
  project?: ShootHeaderProject;
  projectId?: string;
  convertedSalesQuoteId?: string | null;
  missingFields?: string[];
  hasFormDetails?: boolean;
  onOpenMissingFields?: () => void;
}

export default function ShootHeader({
  activeTab = "Overview",
  project,
  projectId,
  convertedSalesQuoteId = null,
  missingFields = [],
  hasFormDetails = false,
  onOpenMissingFields,
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
          ? "pending"
          : "unpaid";
    effectivePaymentStatus = getPaymentStatusMeta(statusKey, project?.payment_id);
  }

  const manualPaidAmount = parseAmount(manualPaymentSummary.paidAmount);
  const manualPendingAmount = parseAmount(manualPaymentSummary.pendingAmount);
  const hasMeaningfulManualProgress =
    Boolean(manualPaymentSummary.hasFullPayment) ||
    Boolean(manualPaymentSummary.isPartiallyPaid) ||
    manualPaidAmount > 0;

  const isPaidStatus = String(effectivePaymentStatus.label || "").toLowerCase() === "paid";

  const paidAmountValue = isConvertedBooking
    ? convertedPaidAmount
    : (hasMeaningfulManualProgress
      ? manualPaidAmount
      : isPaidStatus
        ? finalValue
        : 0);

 const pendingAmountValue = isFullyDiscountedShoot ? 0 : Math.max(finalValue - paidAmountValue, 0); 
  const shootFilesText =
    workspaceFileCount != null
      ? `${workspaceFileCount} File${workspaceFileCount === 1 ? "" : "s"}`
      : getShootFilesText(project);
  const locationText =
    project?.event_location ||
    [project?.location, project?.city, project?.state, project?.country].filter(Boolean).join(", ") ||
    "No location specified";
  const guestEmail = String(
    project?.guest_email ||
      (project?.lead_details as Record<string, unknown> | undefined)?.guest_email ||
      project?.email ||
      ""
  ).trim();
  const resolvedClientId = Number(
    project?.client_id ||
    project?.client_record_id ||
    (project?.lead_details as Record<string, unknown> | undefined)?.client_id ||
    0
  ) || null;
  const descriptionText = project?.description
    ? project.description.replace(/Matching Method:.*$/gm, "").trim()
    : "";
  const totalValueText = `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalReductionText = `$${totalReductionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const finalValueText = `$${finalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const paidAmountText = `$${paidAmountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pendingAmountText = `$${pendingAmountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  React.useEffect(() => {
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
  const projectDateText = getProjectDateText(project);
  const projectTimeText = getProjectScheduleTimeText(project);
  const resolvedStatusLabel =
    project?.timeline_label ||
    timelineStageToHeaderLabel(resolveTimelineStage(project));
  const hasMissingFields = missingFields.length > 0;
  const renderDescription = (text: string) => {
    if (!text) return <span>No description available.</span>;

    const lines = text.split(/\r?\n/);

    return lines.map((line, lineIndex) => {
      const phoneMatch = line.match(/^(\s*Phone\s*:\s*)(.+)$/i);
      const emailMatch = line.match(/^(\s*Email\s*:\s*)(.+)$/i);

      if (phoneMatch) {
        const phoneValue = phoneMatch[2].trim();
        const telValue = phoneValue.replace(/[^\d+]/g, "");

        return (
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
      }

      if (emailMatch) {
        const emailValue = emailMatch[2].trim();

        return (
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
      }

      return <div key={`description-line-${lineIndex}`}>{line}</div>;
    });
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
          {canEdit ? (
            <Button
              onClick={() => router.push(`${shootBasePath}/${projectId}/edit-booking`)}
              className="bg-[#E5D5B8] text-black hover:bg-[#D4C3A3] rounded-lg h-10 px-6 font-medium"
            >
              Edit Shoot
            </Button>
          ) : null}
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

      {/* Hero Section */}
      <div className={`transition-all duration-300 lg:rounded-2xl mb-6 lg:mb-10`}>
        <div className="flex gap-5">
          <div className={`w-10 h-10 lg:w-16 lg:h-16 rounded-lg lg:rounded-2xl flex items-center justify-center text-sm lg:text-2xl font-bold ${isDark ? "bg-[#FFF6D9] text-black" : "bg-[#DCE8FA] text-[#1F2A44]"
            }`}>
            {getInitials(project?.project_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className={`lg:text-2xl font-bold transition-colors ${isDark ? "text-white" : "text-black"}`}>
                    {project?.project_name || "Untitled Project"}
                    {project?.skills_needed && project.skills_needed !== "N/A" && <span className={`font-normal lg:text-lg ml-2 ${isDark ? "text-[#888]" : "text-[#666]"}`}>({project.skills_needed})</span>}
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
                    <button
                      type="button"
                      onClick={handleViewClientDetails}
                      className={`text-xs font-medium underline underline-offset-2 ml-1 ${isDark ? "text-[#E8D1AB] hover:text-[#F2E2C2]" : "text-[#7A5A00] hover:text-[#5E4300]"}`}
                    >
                      View Client Details
                    </button>
                  </div>
                ) : null}
              </div>

              {hasMissingFields ? (
                <button
                  type="button"
                  onClick={onOpenMissingFields}
                  className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-[#E8D1AB]/25 bg-[#FFF4DA] px-3 py-2 text-xs font-semibold text-[#7A5A00] transition-colors hover:bg-[#FFEFC5] lg:mt-0 lg:self-start"
                >
                  <AlertCircle size={14} />
                  Attention Needed
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <div className={`hidden lg:block w-full h-px my-6 transition-colors ${isDark ? "bg-[#222222]" : "bg-[#E5E5E5]"}`} />
          <div className={`mt-4 lg:mt-0 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 text-sm lg:text-base ${isDark ? "text-[#AAA7A7]" : "text-[#AAA7A7] lg:text-[#747171]"}`}>
            <div className="space-y-3 min-w-0">
              <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-white/40" : "text-black/40"}`}>Schedule & Location</p>
              <div className="flex items-center gap-3 min-w-0">
                <span className="whitespace-nowrap">Shoot Date :</span>
                <span title={projectDateText} className={`whitespace-nowrap truncate text-right ${isDark ? "text-white" : "text-black"}`}>{projectDateText}</span>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <span className="whitespace-nowrap">Time :</span>
                <span title={projectTimeText} className={`whitespace-nowrap truncate text-right ${isDark ? "text-white" : "text-black"}`}>{projectTimeText}</span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
