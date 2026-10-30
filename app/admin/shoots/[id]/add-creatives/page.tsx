"use client";

import React, { useCallback, useMemo, useState, useEffect, use } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Camera, Send, Video, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreativeProfileSelectorAdd } from "@/components/sales/creativeProfileSelectorAdd";
import { adminApi } from "@/lib/api";
import Topbar from "@/components/admin/Topbar";
import AddCompensationModal from "@/components/admin/finances/AddCompensationModal";
import { type AddCpCompensationPayload, type PendingCompensationShoot } from "@/lib/api/cpCompensation";
import { shootAgreementPlanKey, type ShootAgreementPlan } from "@/lib/shootAgreementPlan";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { formatCurrency } from "@/lib/utils";
import { getCPRequirements, getRequiredCPCount } from "@/lib/utils/cpRequirements";

type FulfillmentStats = {
  fulfillment_stats?: {
    videographer?: string;
    photographer?: string;
  };
  cp_compensation_has_pending?: boolean;
  cp_compensation_status?: string | null;
  location?: string;
  needs_attention?: {
    missing_fields?: string[];
  };
  assignedCrew?: unknown[];
  assigned_crews?: unknown[];
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

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null ? value as Record<string, unknown> : null;

const buildCreatorName = (record: Record<string, unknown>, fallback: string) => {
  const name = asText(record.name);
  if (name) return name;

  const firstName = asText(record.first_name);
  const lastName = asText(record.last_name);
  return [firstName, lastName].filter(Boolean).join(" ").trim() || fallback;
};

const mergeCompensationCreator = (
  current: PendingCompensationShoot["creators"][number] | undefined,
  next: PendingCompensationShoot["creators"][number]
): PendingCompensationShoot["creators"][number] => ({
  creator_id: next.creator_id || current?.creator_id || 0,
  creator_name: next.creator_name || current?.creator_name || null,
  creator_email: next.creator_email || current?.creator_email || null,
  cp_role: next.cp_role || current?.cp_role || null,
  hourly_rate: next.hourly_rate || current?.hourly_rate || 0,
});

const getAssignedCompensationCreators = (stats: FulfillmentStats | null) => {
  const assignments = [
    ...(Array.isArray(stats?.assignedCrew) ? stats.assignedCrew : []),
    ...(Array.isArray(stats?.assigned_crews) ? stats.assigned_crews : []),
  ];
  const byCreatorId = new Map<number, PendingCompensationShoot["creators"][number]>();

  assignments.forEach((assignment) => {
    const assignmentRecord = asRecord(assignment);
    if (!assignmentRecord) return;

    const crewRecord =
      asRecord(assignmentRecord.crew_member) ||
      asRecord(assignmentRecord.crewMember) ||
      asRecord(assignmentRecord.creator) ||
      assignmentRecord;
    const creatorId = toNumber(
      assignmentRecord.crew_member_id ??
      assignmentRecord.creator_id ??
      crewRecord.crew_member_id ??
      crewRecord.id,
      0
    );

    if (!creatorId) return;

    const creator = {
      creator_id: creatorId,
      creator_name: buildCreatorName(crewRecord, `Creator #${creatorId}`),
      creator_email: asNullableText(crewRecord.email ?? assignmentRecord.email),
      cp_role: asNullableText(
        crewRecord.role_name ??
        crewRecord.primary_role ??
        assignmentRecord.cp_role ??
        assignmentRecord.role
      ),
      hourly_rate: toNumber(crewRecord.hourly_rate ?? assignmentRecord.hourly_rate, 0),
    };

    byCreatorId.set(creatorId, mergeCompensationCreator(byCreatorId.get(creatorId), creator));
  });

  return Array.from(byCreatorId.values());
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
  const [selectionCounts, setSelectionCounts] = useState({ videographer: 0, photographer: 0, hybrid: 0 });
  const [reqCounts, setReqCounts] = useState({ videographer: 0, photographer: 0, hybrid: 0 });
  const [projectLocation, setProjectLocation] = useState<string>("");
  const [isAddCompOpen, setIsAddCompOpen] = useState(false);
  const [selectedCreatives, setSelectedCreatives] = useState<SelectedCreative[]>([]);
  const [savedAgreementPlan, setSavedAgreementPlan] = useState<ShootAgreementPlan | null>(null);

  const [roleType, setRoleType] = useState<string>('videographer');
  const [stats, setStats] = useState<FulfillmentStats | null>(null);

  const cpCompensationHasPending = Boolean(stats?.cp_compensation_has_pending);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep the CP selection in sync with the plan created before opening the
  // agreement screen. The plan remains in session storage until the agreement
  // is sent, so returning to this page can restore the in-progress assignment.
  useEffect(() => {
    if (!projectId) return;

    try {
      const savedPlan = sessionStorage.getItem(shootAgreementPlanKey(projectId));
      if (!savedPlan) return;

      const plan = JSON.parse(savedPlan) as ShootAgreementPlan;
      if (Number(plan.compensation?.booking_id) !== Number(projectId) || !Array.isArray(plan.creators)) return;

      setSavedAgreementPlan(plan);
      const creators = plan.creators.filter((creator) => Number(creator.creator_id) > 0);
      const creativeIds = Array.isArray(plan.selected_creative_ids) && plan.selected_creative_ids.length === creators.length
        ? plan.selected_creative_ids
        : creators.map((creator) => Number(creator.creator_id));
      setSelectedCreativeIds(creativeIds);
      setSelectedCreatives(creators.map((creator, index) => ({
        id: Number(creativeIds[index]),
        crew_member_id: Number(creator.creator_id),
        name: creator.creator_name || `Creator #${creator.creator_id}`,
        email: creator.creator_email || undefined,
        specialities: creator.cp_role || undefined,
        hourly_rate: creator.hourly_rate,
      })));
    } catch (error) {
      console.error("Unable to restore the shoot agreement plan", error);
    }
  }, [projectId]);

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
        const detailsData = (detailsResponse?.data || detailsResponse || {}) as Record<string, unknown>;
        const projectDetails = (asRecord(detailsData.project) || asRecord(detailsResponse?.project) || detailsData) as Record<string, unknown>;
        const mergedStats = {
          ...projectDetails,
          assignedCrew: detailsData.assignedCrew || projectDetails.assignedCrew,
          assigned_crews: detailsData.assigned_crews || projectDetails.assigned_crews,
          ...(stats || {}),
        } as FulfillmentStats;

        if (mergedStats) {
          setStats(mergedStats);
          // Parse fulfillment stats like "0/2" => videographer needed = 2
          const vReq = parseInt(mergedStats.fulfillment_stats?.videographer?.split('/')[1] || "0");
          const pReq = parseInt(mergedStats.fulfillment_stats?.photographer?.split('/')[1] || "0");
          const requested = new URLSearchParams(window.location.search);
          const savedRoles = getCPRequirements(projectDetails.crew_roles);
          const requestedCount = (role: "photographer" | "videographer" | "hybrid", fallback: number) => {
            const value = Number(requested.get(role));
            return Number.isInteger(value) && value > 0 && value <= 10 ? value : fallback;
          };
          setReqCounts({
            videographer: requestedCount("videographer", savedRoles?.videographer ?? vReq),
            photographer: requestedCount("photographer", savedRoles?.photographer ?? pReq),
            hybrid: requestedCount("hybrid", savedRoles?.hybrid ?? 0),
          });
          if (requested.has("hybrid") || (savedRoles?.hybrid && !savedRoles.videographer && !savedRoles.photographer)) setRoleType("hybrid");
          else if ((requested.has("photographer") && !requested.has("videographer")) ||
            (savedRoles?.photographer && !savedRoles.videographer)) setRoleType("photographer");

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

    const selectedCreatorsForCompensation = selectedCreativeIds
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
      }));
    const creatorsById = new Map<number, PendingCompensationShoot["creators"][number]>();

    [...getAssignedCompensationCreators(stats), ...selectedCreatorsForCompensation]
      .filter((creator) => selectedCreativeIds.includes(Number(creator.creator_id)))
      .forEach((creator) => {
      creatorsById.set(
        Number(creator.creator_id),
        mergeCompensationCreator(creatorsById.get(Number(creator.creator_id)), creator)
      );
    });

    return {
      booking_id: Number(projectId),
      shoot_name: asText(statsRecord.project_name, asText(statsRecord.shoot_name, `Shoot #${projectId}`)),
      shoot_type: asNullableText(statsRecord.shoot_type || statsRecord.event_type),
      content_type: asNullableText(statsRecord.content_type),
      event_date: asNullableText(statsRecord.event_date),
      shoot_amount: shootAmount,
      required_cp_count: getRequiredCPCount(statsRecord.crew_roles, statsRecord.crew_size_needed),
      margin_percent: statsRecord.margin_percent == null ? null : toNumber(statsRecord.margin_percent, 0),
      customer: {
        name: asNullableText(statsRecord.customer_name),
        email: asNullableText(statsRecord.customer_email),
      },
      creators: Array.from(creatorsById.values()),
    };
  }, [projectId, selectedCreativeIds, selectedCreatives, stats]);

  const compensationShootOptions = useMemo(
    () => selectedCompensationShoot ? [selectedCompensationShoot] : [],
    [selectedCompensationShoot]
  );
  const restoredCompensationPlan = savedAgreementPlan && selectedCompensationShoot &&
    savedAgreementPlan.creators.length === selectedCompensationShoot.creators.length &&
    savedAgreementPlan.creators.every((creator) =>
      selectedCompensationShoot.creators.some((selected) => Number(selected.creator_id) === Number(creator.creator_id))
    )
    ? savedAgreementPlan.compensation
    : undefined;

  const handleSelectedCreativesChange = useCallback((creatives: SelectedCreative[]) => {
    setSelectedCreatives((current) => {
      const next = new Map(current.map((creative) => [Number(creative.id), creative]));
      creatives.forEach((creative) => next.set(Number(creative.id), creative));
      return selectedCreativeIds
        .map((id) => next.get(Number(id)))
        .filter((creative): creative is SelectedCreative => Boolean(creative));
    });
  }, [selectedCreativeIds]);

  const validateSelectedCounts = () => {
    if (!canEdit) return;

    if (selectedCreativeIds.length === 0) {
      toast.error("Please select at least one creative");
      return false;
    }

    return true;
  };

  const handleContinueToCompensation = () => {
    if (!validateSelectedCounts()) return;
    openCompensationDrawer();
  };

  const handleCreativeSelectionChange = useCallback((ids: number[]) => {
    setSelectedCreativeIds(ids);
  }, []);

  const openCompensationDrawer = () => {
    if (!selectedCompensationShoot?.creators.length) {
      toast.error("Selected CP details are still loading. Please try again.");
      return;
    }
    setIsAddCompOpen(true);
  };

  const prepareShootAgreement = async (compensation: AddCpCompensationPayload, creators: PendingCompensationShoot["creators"]) => {
    const plan: ShootAgreementPlan = { compensation, creators, selected_creative_ids: selectedCreativeIds };
    sessionStorage.setItem(shootAgreementPlanKey(projectId), JSON.stringify(plan));
    setIsAddCompOpen(false);
    router.push(`/admin/shoots/${projectId}/shoot-agreement`);
  };

  const statsRecord = (stats || {}) as Record<string, unknown>;
  const shootAmount = selectedCompensationShoot?.shoot_amount || toNumber(
    statsRecord.shoot_amount ?? statsRecord.total_amount ?? statsRecord.total_value_amount ??
    statsRecord.budget ?? statsRecord.project_budget ?? statsRecord.converted_quote_amount,
    0
  );
  const assignments = Array.isArray(stats?.assignedCrew) ? stats.assignedCrew :
    Array.isArray(stats?.assigned_crews) ? stats.assigned_crews : [];
  const compensationAmounts = assignments
    .map(asRecord)
    .filter((assignment): assignment is Record<string, unknown> => Boolean(assignment))
    .map((assignment) => assignment.total_compensation ?? assignment.compensation_amount)
    .filter((amount) => amount != null && Number.isFinite(Number(amount)));
  const allocatedCompensation = compensationAmounts.reduce<number>((total, amount) => total + Number(amount), 0);
  const compensationBudget = statsRecord.cp_compensation_budget;
  const hasCompensationBudget = compensationBudget != null && Number.isFinite(Number(compensationBudget));

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
                  { type: 'videographer', icon: Video, label: 'Videographer(s)', count: selectionCounts.videographer },
                  { type: 'photographer', icon: Camera, label: 'Photographer(s)', count: selectionCounts.photographer },
                  { type: 'hybrid', icon: Clapperboard, label: 'Hybrid Shooter(s)', count: selectionCounts.hybrid }
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
                    <span>{btn.label} : {btn.count} selected</span>
                  </div>
                ))}
              </div>

            </div>
          }
        />

        {/* Conditional Message Banner Block */}
        {cpCompensationHasPending && (
          <div className="w-full px-6 py-3 bg-[rgba(232,209,171,0.1)] border-b-[0.5px] border-[#E8D1AB]">
            <p className="font-['Instrument_Sans'] text-sm leading-5 text-[#E8D1AB]">
              This shoot has pending CP compensation. You can still add CPs and send their agreements.
            </p>
          </div>
        )}

        {/* Pinned Creative Counter Action Tray Bar */}
        {selectedCreativeIds.length > 0 && (
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

        <div className={`w-full rounded-2xl mb-5 lg:mb-9 p-5 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between ${isDark ? "bg-[#E8D1AB]/20" : "bg-[#F6EDDD] border border-[#EADBC0]"}`}>
          {/* Left: two stats */}
          <div className="grid grid-cols-2 gap-4 lg:flex lg:gap-18">
            <div className="min-w-0">
              <p className={`text-xs lg:text-sm font-semibold leading-tight text-[#E8D1AB]`}>Total Shoot Amount</p>
              <p className="mt-1.5 text-xs lg:text-sm font-medium leading-tight">{shootAmount > 0 ? formatCurrency(shootAmount) : "—"}</p>
            </div>
            <div className="min-w-0">
              <p className={`text-xs lg:text-sm font-semibold leading-tight text-[#E8D1AB]`}>CP Compensation Budget</p>
              <p className="mt-1.5 text-xs lg:text-sm font-medium leading-tight">{hasCompensationBudget ? formatCurrency(Number(compensationBudget)) : "Set during compensation"}</p>
            </div>
          </div>

          {/* Right: allocated pill */}
          <div className="w-full lg:w-auto shrink-0 rounded-xl bg-white px-5 h-10 whitespace-nowrap text-black italic flex items-center gap-1">
            <span className="text-xs lg:text-sm font-bold">{compensationAmounts.length ? formatCurrency(allocatedCompensation) : "—"}</span>{" "}
            <span className={`text-[10px] lg:text-xs text-black/70`}>Compensation Allocated</span>
          </div>
        </div>

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
            onPrepareAgreement={prepareShootAgreement}
            initialPlan={restoredCompensationPlan}
          />
        )}

        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className={`lg:hidden fixed flex flex-col gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-black" : "bg-[#F4F5F7]"}`}>
          <div className="flex gap-2 w-full">
            {[
              { type: 'videographer', icon: Video, label: 'Videographer(s)', count: selectionCounts.videographer },
              { type: 'photographer', icon: Camera, label: 'Photographer(s)', count: selectionCounts.photographer },
              { type: 'hybrid', icon: Clapperboard, label: 'Hybrid Shooter(s)', count: selectionCounts.hybrid }
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
                <span>{btn.label} : {btn.count} selected</span>
              </div>
            ))}
          </div>

          <Button onClick={handleContinueToCompensation} disabled={selectedCreativeIds.length === 0} className="h-12 px-4 lg:px-7 bg-[#E8D1AB] text-black disabled:opacity-50">Continue to Compensation</Button>
        </div>
      </div>

      {/* Modals outside the flow rules container layout */}
    </div>
  );
}
