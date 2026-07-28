"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, Camera, Send, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssignCrewFromLeadMutation, useGetLeadByIdQuery } from "@/lib/redux/features/sales/salesApi";
import Topbar from "@/components/admin/Topbar";
import { toast } from "sonner";
import { CreativeProfileSelectorAdd } from "@/components/sales/creativeProfileSelectorAdd";
import { AssignmentConfirmationModal } from "@/components/sales/AssignmentConfirmationModal";
import { salesApi } from "@/lib/api";
import { useTheme } from "next-themes";
import AddCompensationModal from "@/components/admin/finances/AddCompensationModal";
import { cpCompensationApi, type AddCpCompensationPayload, type PendingCompensationShoot } from "@/lib/api/cpCompensation";

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

const pluralizeRole = (role: string, count: number) => {
  if (count === 1) return role;
  if (role.endsWith("y")) return `${role.slice(0, -1)}ies`;
  return `${role}s`;
};

const formatAssignmentErrors = (errors?: string[], fallback = "Failed to assign crew") => {
  if (!Array.isArray(errors) || errors.length === 0) {
    return fallback;
  }

  const grouped = new Map<string, { count: number; role: string; reason: string; original: string }>();
  const orderedMessages: string[] = [];
  const seenRawMessages = new Set<string>();
  const seenGroups = new Set<string>();

  errors
    .map((error) => String(error || "").trim())
    .filter(Boolean)
    .forEach((message) => {
      const match = message.match(/^Cannot add\s+(.+?)\s+\(([^)]+)\)\.\s+(.+)$/i);

      if (!match) {
        if (!seenRawMessages.has(message)) {
          seenRawMessages.add(message);
          orderedMessages.push(message);
        }
        return;
      }

      const role = match[2].trim().toLowerCase();
      const reason = match[3].trim();
      const key = `${role}::${reason.toLowerCase()}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        grouped.set(key, { count: 1, role, reason, original: message });
      }

      if (!seenGroups.has(key)) {
        seenGroups.add(key);
        orderedMessages.push(key);
      }
    });

  return orderedMessages
    .map((entry) => {
      const group = grouped.get(entry);
      if (!group) return entry;
      if (group.count === 1) return group.original;
      return `Cannot add ${group.count} ${pluralizeRole(group.role, group.count)}. ${group.reason}`;
    })
    .join(", ");
};

const getAssignmentErrorMessage = (error: unknown) => {
  if (typeof error !== "object" || error === null || !("data" in error)) {
    return "An error occurred while assigning crew";
  }

  const data = (error as { data?: { errors?: string[]; message?: string } }).data;
  return formatAssignmentErrors(
    data?.errors,
    data?.message || "An error occurred while assigning crew"
  );
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

const getAssignedCompensationCreators = (booking: Record<string, unknown> | null) => {
  const assignments = Array.isArray(booking?.assigned_crews) ? booking.assigned_crews : [];
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

export default function SelectCreativesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // CHANGED: Get the ID from URL Query Parameter (?id=xxx)
  // Removed hardcoded '136'
  const leadId = searchParams.get('id');
  const latitudeParam = searchParams.get('lat');
  const longitudeParam = searchParams.get('lng');
  const currentLatitude = latitudeParam !== null ? Number(latitudeParam) : undefined;
  const currentLongitude = longitudeParam !== null ? Number(longitudeParam) : undefined;

  const [selectedCreativeIds, setSelectedCreativeIds] = useState<number[]>([]);
  const [selectionCounts, setSelectionCounts] = useState({ videographer: 0, photographer: 0 });
  const [reqCounts, setReqCounts] = useState({ videographer: 0, photographer: 0 });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>("assign");
  const [isAddCompOpen, setIsAddCompOpen] = useState(false);
  const [selectedCreatives, setSelectedCreatives] = useState<SelectedCreative[]>([]);
  const [isSubmittingCompensation, setIsSubmittingCompensation] = useState(false);
  const [assignCrew, { isLoading }] = useAssignCrewFromLeadMutation();
  const { data: leadDetails } = useGetLeadByIdQuery(Number(leadId || 0), {
    skip: !leadId,
  });

  useEffect(() => setMounted(true), []);
  const isDark = !mounted || theme === "dark";

  useEffect(() => {
    const fetchReqCounts = async () => {
      if (leadId) {
        try {
          const response = await salesApi.getLeadStats(leadId);
          if (response?.data?.fulfillment_stats) {
            const vReq = parseInt(response.data.fulfillment_stats.videographer?.split('/')[1] || "0");
            const pReq = parseInt(response.data.fulfillment_stats.photographer?.split('/')[1] || "0");
            setReqCounts({ videographer: vReq, photographer: pReq });
          }
        } catch (error) {
          console.error("Failed to fetch lead stats", error);
        }
      }
    };
    fetchReqCounts();
  }, [leadId]);

  const selectedCompensationShoot = useMemo<PendingCompensationShoot | null>(() => {
    if (!selectedCreativeIds.length) return null;

    const leadRecord = asRecord(leadDetails) || {};
    const booking = asRecord(leadRecord.booking);
    const pricingBreakdown = asRecord(leadRecord.pricing_breakdown);
    const customQuote = asRecord(leadRecord.custom_quote);
    const paymentSummary = asRecord(leadRecord.payment_summary);
    const bookingId = toNumber(
      booking?.stream_project_booking_id ??
      booking?.booking_id ??
      booking?.id,
      0
    );

    if (!bookingId) return null;

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

    [...getAssignedCompensationCreators(booking), ...selectedCreatorsForCompensation].forEach((creator) => {
      creatorsById.set(
        Number(creator.creator_id),
        mergeCompensationCreator(creatorsById.get(Number(creator.creator_id)), creator)
      );
    });

    return {
      booking_id: bookingId,
      shoot_name: asText(booking?.project_name ?? leadRecord.project_name, `Shoot #${bookingId}`),
      shoot_type: asNullableText(booking?.shoot_type || booking?.event_type),
      content_type: asNullableText(booking?.content_type),
      event_date: asNullableText(booking?.event_date),
      shoot_amount: toNumber(
        pricingBreakdown?.total ??
        pricingBreakdown?.total_after_credit ??
        customQuote?.total ??
        paymentSummary?.quote_total ??
        booking?.total_value_amount ??
        booking?.budget,
        0
      ),
      margin_percent: null,
      customer: {
        name: asNullableText(leadRecord.client_name ?? leadRecord.customer_name ?? leadRecord.name),
        email: asNullableText(leadRecord.guest_email ?? leadRecord.client_email ?? booking?.guest_email),
      },
      creators: Array.from(creatorsById.values()),
    };
  }, [leadDetails, selectedCreativeIds, selectedCreatives]);

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
    // Safety check: ensure leadId exists
    if (!leadId) {
      toast.error("Lead ID is missing. Cannot assign crew.");
      return false;
    }

    if (selectedCreativeIds.length === 0) {
      toast.error("Please select at least one creative");
      return false;
    }

    // Check if over-selecting
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
    if (!validateSelectedCounts("assign")) return;
    executeAssignment();
  };

  const handleContinueToCompensation = () => {
    if (!validateSelectedCounts("compensation")) return;
    openCompensationDrawer();
  };

  const openCompensationDrawer = () => {
    if (!selectedCompensationShoot?.creators.length) {
      toast.error("Selected CP details are still loading. Please try again.");
      return;
    }
    setIsConfirmModalOpen(false);
    setIsAddCompOpen(true);
  };

  const executeAssignment = async () => {
    setIsConfirmModalOpen(false);
    try {
      const response = await assignCrew({
        lead_id: Number(leadId), // Use the dynamic ID
        crew_member_ids: selectedCreativeIds,
      }).unwrap();

      if (response.success) {
        toast.success("Crew assigned successfully");
        router.back();
      } else {
        toast.error(formatAssignmentErrors(response.errors, response.message || "Failed to assign crew"));
      }
    } catch (error: unknown) {
      console.error("Failed to assign crew", error);
      toast.error(getAssignmentErrorMessage(error));
    }
  };

  const handleCompensationSubmit = async (payload: AddCpCompensationPayload) => {
    setIsSubmittingCompensation(true);
    try {
      const response = await assignCrew({
        lead_id: Number(leadId),
        crew_member_ids: selectedCreativeIds,
        allow_pending_compensation_assignment: true,
      }).unwrap();

      if (!response.success) {
        toast.error(formatAssignmentErrors(response.errors, response.message || "Failed to assign crew"));
        return;
      }

      await cpCompensationApi.submitForApproval(payload);
      toast.success("CP assigned and compensation sent for finance approval");
      setIsAddCompOpen(false);
      router.back();
    } catch (error: unknown) {
      console.error("Failed to submit CP compensation", error);
      const data = typeof error === "object" && error !== null && "data" in error
        ? (error as { data?: { errors?: string[]; message?: string } }).data
        : undefined;
      const message = data?.errors?.join(", ") || data?.message || getAssignmentErrorMessage(error) || "Failed to submit compensation for approval";
      toast.error(message);
    } finally {
      setIsSubmittingCompensation(false);
    }
  };

  return (
    /* Full viewport screen container preventing global page bouncing */
    <div className="h-screen w-full flex flex-col overflow-hidden select-none">

      {/* --- FIXED SECTION CONTAINER (TOP STICKY TRACK) --- */}
      <div className="flex-shrink-0 z-50">
        <Topbar pathname={pathname}
          actions={
            <>
              <div className="flex gap-3">
                <div className={`h-12 flex items-center gap-2 border px-4 py-2 rounded-lg text-sm transition-colors duration-300 ${isDark
                  ? "bg-[#1A1A1A] border-white/10 text-white/70"
                  : "bg-gray-50 border-[#D8D8D8] text-black/70"
                  }`}>
                  <Video size={16} />
                  <span>Videographer(s) : {selectionCounts.videographer.toString()}/{reqCounts.videographer.toString()}</span>
                </div>
                <div className={`h-12 flex items-center gap-2 border px-4 py-2 rounded-lg text-sm transition-colors duration-300 ${isDark
                  ? "bg-[#1A1A1A] border-white/10 text-white/70"
                  : "bg-gray-50 border-[#D8D8D8] text-black/70"
                  }`}>
                  <Camera size={16} />
                  <span>Photographers(s) : {selectionCounts.photographer.toString()}/{reqCounts.photographer.toString()}</span>
                </div>
              </div>

              {/* <Button
                onClick={handleAssign}
                disabled={isLoading || selectedCreativeIds.length === 0}
                className={`h-12 px-4 lg:px-7 font-semibold transition-all ${isDark
                  ? "bg-[#E5D5B8] text-black hover:bg-[#D4C3A3]"
                  : "bg-[#E5D5B8] text-black hover:bg-[#D9C19A] shadow-sm"
                  } disabled:opacity-50`}
              >
                {isLoading ? "Assigning..." : `Assign (${selectedCreativeIds.length}) CPs`}
              </Button> */}
              <Button
                onClick={handleContinueToCompensation}
                disabled={isLoading || selectedCreativeIds.length === 0 || isSubmittingCompensation}
                className="h-12 px-4 lg:px-7 bg-black text-[#E8D1AB] border border-[#E8D1AB]/40 hover:bg-black/90 disabled:opacity-50"
              >
                <Send size={14} className="mr-2" strokeWidth={1.5} />
                Continue to Compensation
              </Button>
            </>
          }
        />
      </div>

      {/* --- INDEPENDENT SCROLL ZONE CONTAINER --- */}
      <div className={`flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 pb-40 lg:px-10 lg:py-9 font-sans transition-colors duration-300 ${isDark ? "bg-black text-white" : "bg-[#F4F5F7] text-black"}`}>
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          className={`transition-colors flex items-center gap-2 mb-5 p-0 bg-transparent hover:bg-transparent shadow-none ${isDark ? "text-white/70 hover:text-white" : "text-black hover:text-black/80"}`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {/* Pass the dynamic leadId here as well */}
        <CreativeProfileSelectorAdd
          leadId={leadId || undefined}
          currentLatitude={Number.isFinite(currentLatitude) ? currentLatitude : undefined}
          currentLongitude={Number.isFinite(currentLongitude) ? currentLongitude : undefined}
          selectedIds={selectedCreativeIds}
          onChange={setSelectedCreativeIds}
          onSelectionUpdate={setSelectionCounts}
          onSelectedCreativesChange={handleSelectedCreativesChange}
          statsSource="lead"
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
          <div className="flex gap-3">
            <div className={`h-8 flex items-center gap-2 border px-3 py-2 rounded-lg text-xs transition-colors duration-300 ${isDark
              ? "bg-[#1A1A1A] border-white/10 text-white/70"
              : "bg-gray-50 border-[#D8D8D8] text-black/70"
              }`}>
              <Video size={16} />
              <span>Videographer(s) : {selectionCounts.videographer.toString()}/{reqCounts.videographer.toString()}</span>
            </div>
            <div className={`h-8 flex items-center gap-2 border px-3 py-2 rounded-lg text-xs transition-colors duration-300 ${isDark
              ? "bg-[#1A1A1A] border-white/10 text-white/70"
              : "bg-gray-50 border-[#D8D8D8] text-black/70"
              }`}>
              <Camera size={16} />
              <span>Photographers(s) : {selectionCounts.photographer.toString()}/{reqCounts.photographer.toString()}</span>
            </div>
          </div>

          <Button
            onClick={handleAssign}
            disabled={isLoading || selectedCreativeIds.length === 0}
            className={`h-12 px-4 lg:px-7 font-semibold transition-all ${isDark
              ? "bg-[#E5D5B8] text-black hover:bg-[#D4C3A3]"
              : "bg-[#E5D5B8] text-black hover:bg-[#D9C19A] shadow-sm"
              } disabled:opacity-50`}
          >
            {isLoading ? "Assigning..." : `Assign (${selectedCreativeIds.length}) CPs`}
          </Button>
          <Button
            onClick={handleContinueToCompensation}
            disabled={isLoading || selectedCreativeIds.length === 0 || isSubmittingCompensation}
            className="h-12 px-4 lg:px-7 bg-black text-[#E8D1AB] border border-[#E8D1AB]/40 hover:bg-black/90 disabled:opacity-50"
          >
            <Send size={14} className="mr-2" strokeWidth={1.5} />
            Continue to Compensation
          </Button>
        </div>

        {/* Layout decoupled portals & modals */}
        <AssignmentConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={confirmAction === "compensation" ? openCompensationDrawer : executeAssignment}
          videographerCount={{ selected: selectionCounts.videographer, required: reqCounts.videographer }}
          photographerCount={{ selected: selectionCounts.photographer, required: reqCounts.photographer }}
          isDark={isDark}
        />
      </div>
    </div>
  );
}
