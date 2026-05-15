"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Eye } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { fileManagerApi } from "@/lib/fileManagerApi";
import {
  getProjectDateText,
  getPaymentStatusMeta,
  getProjectFolderLink,
  getProjectScheduleTimeText,
  getShootFilesText,
} from "@/lib/utils/shootDetails";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils"
import { resolveTimelineStage, timelineStageToHeaderLabel } from "@/lib/utils/projectTimeline";

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
  event_location?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  [key: string]: unknown;
};

const parseAmount = (value: unknown): number => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

interface ShootHeaderProps {
  activeTab?: string;
  project?: ShootHeaderProject;
  projectId?: string;
}

export default function ShootHeader({ activeTab = "Overview", project, projectId }: ShootHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [workspaceFolderLink, setWorkspaceFolderLink] = React.useState("");
  const [workspaceFileCount, setWorkspaceFileCount] = React.useState<number | null>(null);
  const shootBasePath = pathname?.startsWith("/sales") ? "/sales/shoots" : "/admin/shoots";
  const paymentStatus = getPaymentStatusMeta(project?.payment_status, project?.payment_id);
  const pricingBreakdown =
    (project?.pricing_breakdown as Record<string, unknown> | undefined) ||
    ((project?.lead_details as Record<string, unknown> | undefined)?.pricing_breakdown as Record<string, unknown> | undefined) ||
    {};
  const manualPaymentSummary =
    (project?.manual_payment_summary as Record<string, unknown> | undefined) ||
    ((project?.lead_details as Record<string, unknown> | undefined)?.manual_payment_summary as Record<string, unknown> | undefined) ||
    {};

  const subtotalValue = parseAmount(pricingBreakdown.subtotal);
  const totalBeforeCredit = parseAmount(pricingBreakdown.total_before_credit);
  const discountValue = parseAmount(pricingBreakdown.discount);
  const creditAppliedValue = parseAmount(pricingBreakdown.credit_applied);
  const totalAfterCredit = parseAmount(pricingBreakdown.total_after_credit);
  const totalValue =
    totalBeforeCredit ||
    subtotalValue ||
    Math.max(parseAmount(pricingBreakdown.total) + discountValue + creditAppliedValue, 0) ||
    parseAmount(project?.total_paid_amount);
  const totalReductionValue = Math.max(discountValue + creditAppliedValue, 0);
  const finalValue =
    totalAfterCredit ||
    parseAmount(pricingBreakdown.total) ||
    Math.max(totalValue - totalReductionValue, 0);
  const isFullyPaidByManualSummary = Boolean(manualPaymentSummary.hasFullPayment);
  const effectivePaymentStatus = isFullyPaidByManualSummary
    ? getPaymentStatusMeta("paid", project?.payment_id)
    : paymentStatus;
  const manualPaidAmount = parseAmount(manualPaymentSummary.paidAmount);
  const manualPendingAmount = parseAmount(manualPaymentSummary.pendingAmount);
  const hasMeaningfulManualProgress =
    Boolean(manualPaymentSummary.hasFullPayment) ||
    Boolean(manualPaymentSummary.isPartiallyPaid) ||
    manualPaidAmount > 0;
  const isPaidStatus = String(effectivePaymentStatus.label || "").toLowerCase() === "paid";
  const paidAmountValue = hasMeaningfulManualProgress
    ? manualPaidAmount
    : isPaidStatus
      ? finalValue
      : 0;
  const pendingAmountValue = hasMeaningfulManualProgress
    ? manualPendingAmount
    : Math.max(finalValue - paidAmountValue, 0);
  const folderLink = workspaceFolderLink || getProjectFolderLink(project);
  const shootFilesText =
    workspaceFileCount != null
      ? `${workspaceFileCount} File${workspaceFileCount === 1 ? "" : "s"}`
      : getShootFilesText(project);
  const locationText =
    project?.event_location ||
    [project?.location, project?.city, project?.state, project?.country].filter(Boolean).join(", ") ||
    "No location specified";
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

        setWorkspaceFolderLink(response.workspace.consoleUrl || "");
        setWorkspaceFileCount(
          typeof response.workspace.fileCount === "number" ? response.workspace.fileCount : null
        );
      } catch (error) {
        if (!isMounted) return;
        setWorkspaceFolderLink("");
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
    <div>
      <button
        onClick={() => router.back()}
        className={`lg:hidden transition-colors flex items-center gap-2 mb-3 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
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
          <Button
            variant="outline"
            className="bg-[#2C2C2C] border-none text-[#E5D5B8] hover:bg-[#3D3D3D] hover:text-[#f0e4d0] rounded-lg h-10 px-4 gap-2"
            onClick={() => router.push(`${shootBasePath}/${projectId}/form-details`)}
          >
            <Eye className="w-4 h-4" /> View Form Details
          </Button>
          <Button
            onClick={() => router.push(`${shootBasePath}/${projectId}/edit-booking`)}
            className="bg-[#E5D5B8] text-black hover:bg-[#D4C3A3] rounded-lg h-10 px-6 font-medium"
          >
            Edit Shoot
          </Button>
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
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className={`lg:text-2xl font-bold transition-colors ${isDark ? "text-white" : "text-black"}`}>
                {project?.project_name || "Untitled Project"}
                {project?.skills_needed && project.skills_needed !== "N/A" && <span className={`font-normal lg:text-lg ml-2 ${isDark ? "text-[#888]" : "text-[#666]"}`}>({project.skills_needed})</span>}
              </h1>
              <span className="bg-[#FFF9E5] text-[#B18A00] text-xs font-semibold px-3 py-1 rounded-full border border-[#B18A00]/20">
                {resolvedStatusLabel}
              </span>
            </div>
            <p className={`text-sm leading-relaxed max-w-3xl transition-colors whitespace-pre-line leading-relaxed ${isDark ? "text-[#888888]" : "text-[#666666]"}`}>
              {project?.description
                ? project.description.replace(/Matching Method:.*$/gm, '').trim()
                : "No description available."}
            </p>
          </div>
        </div>

        <div>
          <div className={`hidden lg:block w-full h-px my-6 transition-colors ${isDark ? "bg-[#222222]" : "bg-[#E5E5E5]"}`} />
          <div className={`mt-4 lg:mt-0 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 text-sm lg:text-base ${isDark ? "text-[#AAAAAA]" : "text-[#666666]"}`}>
            <div className="space-y-3 min-w-0">
              <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-white/40" : "text-black/40"}`}>Schedule & Location</p>
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Shoot Date :</span>
                <span title={projectDateText} className={`font-medium whitespace-nowrap truncate text-right ${isDark ? "text-white" : "text-black"}`}>{projectDateText}</span>
              </div>
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Time :</span>
                <span title={projectTimeText} className={`font-medium whitespace-nowrap truncate text-right ${isDark ? "text-white" : "text-black"}`}>{projectTimeText}</span>
              </div>
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Location :</span>
                <span title={locationText} className={`${isDark ? "text-white" : "text-black"} font-medium whitespace-nowrap truncate text-right`}>
                  {locationText}
                </span>
              </div>
            </div>

            <div className="space-y-3 min-w-0">
              <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-white/40" : "text-black/40"}`}>Pricing Breakdown</p>
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Total Value :</span>
                <span title={totalValueText} className={`font-medium whitespace-nowrap truncate text-right ${isDark ? "text-white" : "text-black"}`}>
                  {totalValueText}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Discount/Referral/Credit :</span>
                <span title={totalReductionText} className={`font-medium whitespace-nowrap truncate text-right ${isDark ? "text-white" : "text-black"}`}>
                  {totalReductionText}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Final Value :</span>
                <span title={finalValueText} className={`font-medium whitespace-nowrap truncate text-right ${isDark ? "text-white" : "text-black"}`}>
                  {finalValueText}
                </span>
              </div>
            </div>

            <div className="space-y-3 min-w-0">
              <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? "text-white/40" : "text-black/40"}`}>Other Details</p>
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Payment Status :</span>
                <span title={effectivePaymentStatus.label} className={cn("font-medium whitespace-nowrap truncate text-right", effectivePaymentStatus.className)}>
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
                <span title={pendingAmountText} className="font-medium whitespace-nowrap truncate text-right text-amber-500">
                  {pendingAmountText}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="whitespace-nowrap">Shoot Files :</span>
                <span title={shootFilesText} className={`font-medium whitespace-nowrap truncate text-right ${isDark ? "text-white" : "text-black"}`}>{shootFilesText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
