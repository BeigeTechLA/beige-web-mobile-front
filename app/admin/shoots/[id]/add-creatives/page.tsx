"use client";

import React, { useCallback, useMemo, useState, useEffect, use } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Camera, Send, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssignCrewFromShootMutation } from "@/lib/redux/features/sales/salesApi";
import { CreativeProfileSelectorAdd } from "@/components/sales/creativeProfileSelectorAdd";
import { AssignmentConfirmationModal } from "@/components/sales/AssignmentConfirmationModal";
import { adminApi } from "@/lib/api";
import Topbar from "@/components/admin/Topbar";
import AddCompensationModal from "@/components/admin/finances/AddCompensationModal";
import { cpCompensationApi, type AddCpCompensationPayload, type PendingCompensationShoot } from "@/lib/api/cpCompensation";
import { usePermissions } from "@/lib/hooks/usePermissions";

type ProjectFulfillmentStats = {
  fulfillment_stats?: {
    videographer?: string;
    photographer?: string;
  };
  location?: string;
};

type FulfillmentStats = {
  fulfillment_stats?: {
    videographer?: string;
    photographer?: string;
  };
  cp_compensation_locked?: boolean;
  cp_compensation_has_pending?: boolean;
  cp_compensation_status?: string | null;
  location?: string;
  needs_attention?: {
    missing_fields?: string[];
  };
  [key: string]: unknown;
};

type SelectedCreative = {
  id: number;
  crew_member_id?: number;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  specialities?: string;
  role?: string;
  hourly_rate?: number | string;
};

type ConfirmAction = "assign" | "compensation";

const toNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const asText = (value: unknown, fallback = "") => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return fallback;
};

const asNullableText = (value: unknown) => {
  const text = asText(value);
  return text || null;
};

export default function AddCreativesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const { canEdit, isLoading: isPermissionsLoading } = usePermissions("shoots");

  const { id: projectId } = use(params);

  const [mounted, setMounted] = useState(false);
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const [selectedCreativeIds, setSelectedCreativeIds] = useState<number[]>([]);
  const [selectionCounts, setSelectionCounts] = useState({ videographer: 0, photographer: 0 });
  const [reqCounts, setReqCounts] = useState({ videographer: 0, photographer: 0 });
  const [projectLocation, setProjectLocation] = useState<string>("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>("assign");
  const [isAddCompOpen, setIsAddCompOpen] = useState(false);
  const [selectedCreatives, setSelectedCreatives] = useState<SelectedCreative[]>([]);
  const [isSubmittingCompensation, setIsSubmittingCompensation] = useState(false);

  const [roleType, setRoleType] = useState<string>('videographer');
  const [stats, setStats] = useState<FulfillmentStats | null>(null);

  const [assignCrew, { isLoading }] = useAssignCrewFromShootMutation();
  const cpCompensationLocked = Boolean(stats?.cp_compensation_locked);
  const cpCompensationHasPending = Boolean(stats?.cp_compensation_has_pending);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isPermissionsLoading || canEdit) return;
    router.replace(`/admin/shoots/${projectId}`);
  }, [mounted, isPermissionsLoading, canEdit, router, projectId]);

  // Fetch project fulfillment stats using the new POST endpoint
  useEffect(() => {
    const fetchFulfillmentStats = async () => {
      if (!projectId) return;
      try {
        const [statsResult, detailsResult] = await Promise.allSettled([
          adminApi.getProjectFulfillmentStats(projectId),
          adminApi.getProjectDetails(projectId),
        ]);

        const response = statsResult.status === "fulfilled" ? statsResult.value : null;
        // `adminApi.getProjectFulfillmentStats` already returns `response.data`
        // BUT if the backend actually returns `{ success: true, data: { ... } }` inside that data:
        const stats = (response?.success && response?.data ? response.data : response) as FulfillmentStats;
        const detailsResponse = detailsResult.status === "fulfilled" ? detailsResult.value : null;
        const projectDetails = (detailsResponse?.data?.project || detailsResponse?.project || detailsResponse?.data || {}) as Record<string, unknown>;
        const mergedStats = { ...projectDetails, ...(stats || {}) } as FulfillmentStats;

        if (mergedStats) {
          setStats(mergedStats);
          // Parse fulfillment stats like "0/2" => videographer needed = 2
          const vReq = parseInt(mergedStats.fulfillment_stats?.videographer?.split('/')[1] || "0");
          const pReq = parseInt(mergedStats.fulfillment_stats?.photographer?.split('/')[1] || "0");
          setReqCounts({ videographer: vReq, photographer: pReq });

          // Also grab location for the crew search
          if (mergedStats.location) setProjectLocation(mergedStats.location);
        }
      } catch (error) {
        console.error("Failed to fetch project fulfillment stats", error);
      }
    };
    fetchFulfillmentStats();
  }, [projectId]);

  const selectedCompensationShoot = useMemo<PendingCompensationShoot | null>(() => {
    if (!selectedCreativeIds.length) return null;

    const statsRecord = (stats || {}) as Record<string, unknown>;
    const shootAmount = toNumber(
      statsRecord.shoot_amount ??
      statsRecord.total_amount ??
      statsRecord.total_value_amount ??
      statsRecord.budget ??
      statsRecord.project_budget ??
      statsRecord.converted_quote_amount,
      0
    );

    return {
      booking_id: Number(projectId),
      shoot_name: asText(statsRecord.project_name, asText(statsRecord.shoot_name, `Shoot #${projectId}`)),
      shoot_type: asNullableText(statsRecord.shoot_type || statsRecord.event_type),
      content_type: asNullableText(statsRecord.content_type),
      event_date: asNullableText(statsRecord.event_date),
      shoot_amount: shootAmount,
      margin_percent: statsRecord.margin_percent == null ? null : toNumber(statsRecord.margin_percent, 0),
      customer: {
        name: asNullableText(statsRecord.customer_name),
        email: asNullableText(statsRecord.customer_email),
      },
      creators: selectedCreativeIds
        .map((id) => selectedCreatives.find((creative) => Number(creative.id) === Number(id)))
        .filter((creative): creative is SelectedCreative => Boolean(creative))
        .map((creative) => ({
          creator_id: Number(creative.crew_member_id || creative.id),
          creator_name: asText(
            creative.name,
            [creative.first_name, creative.last_name].filter(Boolean).join(" ").trim() || `Creator #${creative.id}`
          ),
          creator_email: creative.email || null,
          cp_role: creative.specialities || creative.role || null,
          hourly_rate: toNumber(creative.hourly_rate, 0),
        })),
    };
  }, [projectId, selectedCreativeIds, selectedCreatives, stats]);

  const compensationShootOptions = useMemo(
    () => selectedCompensationShoot ? [selectedCompensationShoot] : [],
    [selectedCompensationShoot]
  );

  const handleSelectedCreativesChange = useCallback((creatives: SelectedCreative[]) => {
    setSelectedCreatives((current) => {
      const next = new Map(current.map((creative) => [Number(creative.id), creative]));
      creatives.forEach((creative) => next.set(Number(creative.id), creative));
      return selectedCreativeIds
        .map((id) => next.get(Number(id)))
        .filter((creative): creative is SelectedCreative => Boolean(creative));
    });
  }, [selectedCreativeIds]);

  const validateSelectedCounts = (action: ConfirmAction) => {
    if (!canEdit) return;

    if (selectedCreativeIds.length === 0) {
      toast.error("Please select at least one creative");
      return false;
    }

    const isOverVideographers = selectionCounts.videographer > reqCounts.videographer;
    const isOverPhotographers = selectionCounts.photographer > reqCounts.photographer;

    if (isOverVideographers || isOverPhotographers) {
      setConfirmAction(action);
      setIsConfirmModalOpen(true);
      return false;
    }

    return true;
  };

  const handleAssign = async () => {
    if (cpCompensationLocked) {
      toast.error("CP compensation is already approved for this shoot. You cannot assign more CPs.");
      return;
    }
    if (cpCompensationHasPending) {
      toast.error("This shoot has pending CP compensation. Use Continue to Compensation so the payout stays updated.");
      return;
    }
    if (!validateSelectedCounts("assign")) return;
    executeAssignment();
  };

  const handleContinueToCompensation = () => {
    if (cpCompensationLocked) {
      toast.error("CP compensation is already approved for this shoot. You cannot assign more CPs.");
      return;
    }
    if (!validateSelectedCounts("compensation")) return;
    openCompensationDrawer();
  };

  const handleCreativeSelectionChange = useCallback((ids: number[]) => {
    if (cpCompensationLocked) {
      toast.error("CP compensation is already approved for this shoot. You cannot assign more CPs.");
      return;
    }
    setSelectedCreativeIds(ids);
  }, [cpCompensationLocked]);

  const openCompensationDrawer = () => {
    if (!selectedCompensationShoot?.creators.length) {
      toast.error("Selected CP details are still loading. Please try again.");
      return;
    }
    setIsConfirmModalOpen(false);
    setIsAddCompOpen(true);
  };

  const executeAssignment = async () => {
    if (!canEdit) return;

    setIsConfirmModalOpen(false);
    try {
      const response = await assignCrew({
        project_id: Number(projectId),
        crew_member_ids: selectedCreativeIds,
      }).unwrap();

      if (response.success) {
        toast.success("Crew assigned successfully");
        router.back();
      } else {
        if (response.errors && Array.isArray(response.errors)) {
          toast.error(response.errors.join(", "));
        } else {
          toast.error(response.message || "Failed to assign crew");
        }
      }
    } catch (error: unknown) {
      console.error("Failed to assign crew", error);
      const data = typeof error === "object" && error !== null && "data" in error
        ? (error as { data?: { errors?: string[]; message?: string } }).data
        : undefined;
      if (data?.errors && Array.isArray(data.errors)) {
        toast.error(data.errors.join(", "));
      } else if (data?.message) {
        toast.error(data.message);
      } else {
        toast.error("An error occurred while assigning crew");
      }
    }
  };

  const handleCompensationSubmit = async (payload: AddCpCompensationPayload) => {
    setIsSubmittingCompensation(true);
    try {
      const assignResponse = await assignCrew({
        project_id: Number(projectId),
        crew_member_ids: selectedCreativeIds,
        allow_pending_compensation_assignment: true,
      }).unwrap();

      if (!assignResponse.success) {
        const message = Array.isArray(assignResponse.errors)
          ? assignResponse.errors.join(", ")
          : assignResponse.message || "Failed to assign crew";
        toast.error(message);
        return;
      }

      await cpCompensationApi.submitForApproval(payload);
      toast.success("CP assigned and compensation sent for finance approval");
      setIsAddCompOpen(false);
      router.push(`/admin/shoots/${projectId}`);
    } catch (error: unknown) {
      console.error("Failed to submit CP compensation", error);
      const data = typeof error === "object" && error !== null && "data" in error
        ? (error as { data?: { errors?: string[]; message?: string } }).data
        : undefined;
      const message = data?.errors?.join(", ") || data?.message || "Failed to submit compensation for approval";
      toast.error(message);
    } finally {
      setIsSubmittingCompensation(false);
    }
  };

  if (!mounted || isPermissionsLoading || !canEdit) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDark ? "bg-[#101010] text-white" : "bg-[#F4F5F7] text-black"}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? "border-white" : "border-black"}`}></div>
      </div>
    );
  }

  return (
    /* Complete screen viewport container forcing headers to stay pinned while content scrolls */
    <div className="h-screen w-full flex flex-col overflow-hidden select-none">

      {/* --- FIXED SECTION CONTAINER (TOP STICKY TRACK) --- */}
      <div className="flex-shrink-0 z-50">
        <Topbar
          pathname={pathname}
          actions={
            <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
              <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
                {[
                  { type: 'videographer', icon: Video, label: 'Videographer(s)', count: selectionCounts.videographer, target: reqCounts.videographer || '0' },
                  { type: 'photographer', icon: Camera, label: 'Photographers(s)', count: selectionCounts.photographer, target: reqCounts.photographer || '0' }
                ].map((btn) => (
                  <div
                    key={btn.type}
                    onClick={() => setRoleType(btn.type)}
                    className={`h-12 flex items-center justify-center lg:justify-start gap-2 border px-4 py-2 rounded-lg text-sm cursor-pointer transition-all duration-300 ${roleType === btn.type
                      ? "bg-[#E8D1AB] border-[#E8D1AB] text-black"
                      : (isDark ? 'bg-[#1A1A1A] border-white/10 text-white/70' : 'bg-[#F0F0F0] border-[#E3E3E3] text-black')
                      }`}
                  >
                    <btn.icon size={16} />
                    <span>{btn.label} : {btn.count}/{btn.target}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleAssign}
                disabled={isLoading || selectedCreativeIds.length === 0 || cpCompensationLocked || cpCompensationHasPending}
                className="h-12 px-4 lg:px-7 bg-[#E8D1AB] text-black disabled:opacity-50"
              >
                {isLoading ? "Assigning..." : `Assign (${selectedCreativeIds.length}) CPs`}
              </Button>
            </div>
          }
        />

        {/* Conditional Message Banner Block */}
        {(cpCompensationLocked || cpCompensationHasPending) && (
          <div className="w-full px-6 py-3 bg-[rgba(232,209,171,0.1)] border-b-[0.5px] border-[#E8D1AB]">
            <p className="font-['Instrument_Sans'] text-sm leading-5 text-[#E8D1AB]">
              {cpCompensationLocked
                ? "CP compensation is approved for this shoot. Adding more CPs is locked."
                : "This shoot has pending CP compensation. Add CPs through compensation so payout records stay updated."}
            </p>
          </div>
        )}

        {/* Pinned Creative Counter Action Tray Bar */}
        {selectedCreativeIds.length > 0 && !cpCompensationLocked && (
          <div className="w-full flex flex-col items-start pt-3 px-6 bg-[rgba(232,209,171,0.1)] border-b-[0.5px] border-[#E8D1AB]">
            <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center mb-3">
              {/* Left Side: Count */}
              <div className="flex flex-row items-start lg:items-center">
                <span className="font-['Instrument_Sans'] font-medium text-sm leading-5 text-[#E8D1AB]">
                  {selectedCreativeIds.length} Creative{selectedCreativeIds.length !== 1 ? 's' : ''} Selected
                </span>
              </div>

              {/* Right Side: Actions */}
              <div className="flex flex-row justify-between items-center gap-2">
                {/* Clear Selection Button */}
                <button
                  onClick={() => setSelectedCreativeIds([])}
                  className="w-[132px] p-0 lg:pt-[5px] lg:pb-[7px] lg:px-4 flex items-center justify-start lg:justify-center rounded-lg bg-transparent hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <span className="font-['Instrument_Sans'] font-medium text-sm leading-5 text-white underline text-center">
                    Clear Selection
                  </span>
                </button>

                {/* Continue to Compensation Button */}
                <button
                  onClick={() => { handleContinueToCompensation(); }}
                  disabled={cpCompensationLocked}
                  className="w-[232px] pt-[5px] pb-[7px] px-4 bg-black rounded flex items-center justify-center gap-1.5 hover:bg-black/90 transition-colors cursor-pointer"
                >
                  <Send size={14} className="text-[#E8D1AB]" strokeWidth={1.5} />
                  <span className="font-['Instrument_Sans'] font-medium text-sm leading-5 text-[#E8D1AB] underline text-center">
                    Continue to Compensation
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- INDEPENDENT SCROLL ZONE CONTAINER --- */}
      <div className={`flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 pb-35 lg:px-10 lg:py-9 font-sans ${isDark ? "bg-black text-white" : "bg-[#F4F5F7] text-black"}`}>
        <Button
          onClick={() => router.back()}
          className={`transition-colors flex items-center gap-2 mb-5 p-0 bg-transparent hover:bg-transparent shadow-none ${isDark ? "text-white hover:text-white/80" : "text-zinc-700 hover:text-zinc-900"}`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back to Shoot Details</span>
        </Button>

        <CreativeProfileSelectorAdd
          projectId={projectId}
          selectedIds={selectedCreativeIds}
          onChange={handleCreativeSelectionChange}
          onSelectionUpdate={setSelectionCounts}
          onSelectedCreativesChange={handleSelectedCreativesChange}
          currentLocation={projectLocation}
          targets={reqCounts}
          roleType={roleType}
          isDark={isDark}
        />

        {selectedCompensationShoot && (
          <AddCompensationModal
            isOpen={isAddCompOpen}
            onClose={() => setIsAddCompOpen(false)}
            shoots={compensationShootOptions}
            isSubmitting={isSubmittingCompensation || isLoading}
            onSubmit={handleCompensationSubmit}
          />
        )}

        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className={`lg:hidden fixed flex flex-col gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-black" : "bg-[#F4F5F7]"}`}>
          <div className="flex gap-2 w-full">
            {[
              { type: 'videographer', icon: Video, label: 'Videographer(s)', count: selectionCounts.videographer, target: reqCounts.videographer || '0' },
              { type: 'photographer', icon: Camera, label: 'Photographers(s)', count: selectionCounts.photographer, target: reqCounts.photographer || '0' }
            ].map((btn) => (
              <div
                key={btn.type}
                onClick={() => setRoleType(btn.type)}
                className={`flex-1 h-8 flex items-center justify-center gap-2 border px-3 py-2 rounded-md text-xs cursor-pointer transition-all duration-300 ${roleType === btn.type
                  ? "bg-[#E8D1AB] border-[#E8D1AB] text-black"
                  : (isDark ? 'bg-[#1A1A1A] border-white/10 text-white/70' : 'bg-[#F0F0F0] border-[#E3E3E3] text-black')
                  }`}
              >
                <btn.icon size={16} />
                <span>{btn.label} : {btn.count}/{btn.target}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={handleAssign}
            disabled={isLoading || selectedCreativeIds.length === 0 || cpCompensationLocked || cpCompensationHasPending}
            className="h-12 px-4 lg:px-7 bg-[#E8D1AB] text-black disabled:opacity-50"
          >
            {isLoading ? "Assigning..." : `Assign (${selectedCreativeIds.length}) CPs`}
          </Button>
        </div>
      </div>

      {/* Modals outside the flow rules container layout */}
      <AssignmentConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmAction === "compensation" ? openCompensationDrawer : executeAssignment}
        videographerCount={{ selected: selectionCounts.videographer, required: reqCounts.videographer }}
        photographerCount={{ selected: selectionCounts.photographer, required: reqCounts.photographer }}
      />
    </div>
  );
}
