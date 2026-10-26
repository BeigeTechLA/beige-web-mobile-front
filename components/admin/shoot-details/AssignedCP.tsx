"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";
import { useTheme } from "next-themes";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/effect-cards";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { getPrimaryRoleLabel } from "@/lib/utils/shootDetails";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { toast } from "sonner";
import SelectCPCountModal, { type CPCounts } from "./SelectCPCountModal";
import { getCPRequirements } from "@/lib/utils/cpRequirements";

/**
 * Custom CSS to force the "Top-Stacking" behavior.
 * Swiper Cards effect usually translates slides down;
 * we override the slide transformations to stack them upwards.
 */
const stackStyles = `
  .top-stack-swiper .swiper-slide-shadow { display: none !important; }
  .top-stack-swiper .swiper-slide {
    transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  }
`;

interface AssignedCPProps {
  projectId: string;
  leadId?: string | number;
  assignedCrew?: CrewAssignment[];
  cpCompensationStatus?: string | null;
  onRequestAssignment?: (continueAction: () => void) => void;
  crewSizeNeeded?: number;
  crewRoles?: unknown;
}

interface CrewFile {
  file_type?: string;
  file_url?: string;
  file_path?: string;
}

interface CrewMemberProfile {
  first_name?: string;
  last_name?: string;
  primary_role?: unknown;
  role_name?: string;
  crew_member_files?: CrewFile[];
}

interface CrewAssignment {
  id?: number | string;
  crew_member_id?: number | string;
  crew_member?: CrewMemberProfile;
  /** CP's total compensation for this shoot */
  total_compensation?: number | string | null;
  /** Assignment request status, e.g. "accepted" | "rejected" | "request_sent" / "pending" */
  acceptance_status?: string | number | null;
}

/* Card helpers */

const REQUEST_STATUS_STYLES = {
  accepted: { label: "Accepted", bg: "bg-[#15B450]" },
  rejected: { label: "Rejected", bg: "bg-[#B41515]" },
  request_sent: { label: "Request Sent", bg: "bg-[#359DD0]" },
  pending: { label: "Pending", bg: "bg-amber-400 !text-black" },
} as const;

type RequestStatusKey = keyof typeof REQUEST_STATUS_STYLES;

const normalizeStatus = (value: unknown): RequestStatusKey | null => {
  const raw = String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!raw) return null;
  if (["accepted", "approved", "confirmed", "accept"].includes(raw)) return "accepted";
  if (["rejected", "declined", "reject", "decline"].includes(raw)) return "rejected";
  if (raw === "pending") return "pending";
  if (["request_sent", "sent", "requested", "invited", "awaiting", "awaiting_response"].includes(raw)) return "request_sent";
  return null;
};

/** Badge for member.status. Unknown values still show (neutral grey) so nothing silently disappears. */
const getRequestStatusBadge = (member: CrewAssignment): { label: string; bg: string } | null => {
  const raw = member.acceptance_status;

  if (raw == null || String(raw).trim() === "") return REQUEST_STATUS_STYLES.pending;
  const key = normalizeStatus(raw);
  if (key) return REQUEST_STATUS_STYLES[key];
  const label = String(raw).replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { label, bg: "bg-zinc-500" };
};

const formatCompensation = (value: CrewAssignment["total_compensation"]) => {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (n == null || !Number.isFinite(n)) return "--";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
};

export default function AssignedCP({
  projectId,
  assignedCrew = [],
  cpCompensationStatus,
  onRequestAssignment,
  crewSizeNeeded = 0,
  crewRoles,
}: AssignedCPProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { theme, resolvedTheme } = useTheme();
  const { canEdit, canCreate } = usePermissions("shoots");
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [crewMembers, setCrewMembers] = useState<CrewAssignment[]>(assignedCrew);
  const [removingCrewId, setRemovingCrewId] = useState<number | null>(null);
  const [selectedCrewId, setSelectedCrewId] = useState<number | null>(null);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);

  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  useEffect(() => {
    setCrewMembers(assignedCrew);
  }, [assignedCrew]);

  const hasCPs = crewMembers.length > 0;
  const savedRequirements = getCPRequirements(crewRoles);

  // CPs still to assign (alert next to the title while short)
  const missingCPs = Math.max(0, (Number(crewSizeNeeded) || 0) - crewMembers.length);
  const isShortOfCPs = missingCPs > 0;
  const missingCPsLabel = `${missingCPs} CP${missingCPs === 1 ? "" : "s"} Need${missingCPs === 1 ? "s" : ""} to be Assigned`;
  const userTypeId = Number(user?.user_type_id ?? user?.userTypeId);
  const normalizedRole = String(user?.role ?? user?.userRole ?? "").trim().toLowerCase();
  const isSalesAdmin = userTypeId === 7 && normalizedRole === "sales_admin";
  const isSuperAdmin = userTypeId === 8 || ["super_admin", "superadmin"].includes(normalizedRole);
  const isSalesShootPage = pathname?.startsWith("/sales/shoots/");
  const isCompensationApproved = String(cpCompensationStatus || "").toLowerCase() === "approved";
  const canAssignCP = canCreate;
  const canRemoveCP = canEdit && (!isCompensationApproved || isSuperAdmin);
  const assignmentLockTitle = !canCreate ? "Create permission not allowed" : undefined;
  const removeLockTitle = !canEdit
    ? "Edit permission not allowed"
    : isCompensationApproved
      ? isSuperAdmin
        ? "Remove CP"
        : "All CPs have accepted and their compensation has been approved. Only a Super Admin can remove a CP."
      : "Remove CP";

  // Saved booking requirements already define the roles; legacy shoots need the modal.
  const handleOpenAssignment = () => {
    if (!canCreate) return;
    if (savedRequirements) {
      handleCountContinue(savedRequirements);
    } else {
      setIsCountModalOpen(true);
    }
  };

  // Modal "Continue" -> /add-creatives (selected counts passed as query params,
  // e.g. ?photographer=2&videographer=1)
  const handleCountContinue = (counts: Partial<CPCounts>) => {
    const query = new URLSearchParams(
      Object.entries(counts)
        .filter(([, count]) => Number(count) > 0)
        .map(([role, count]) => [role, String(count)])
    ).toString();
    const basePath =
      isSalesAdmin && isSalesShootPage
        ? `/sales/shoots/${projectId}/add-creatives`
        : `/admin/shoots/${projectId}/add-creatives`;

    const goToAddCreatives = async () => {
      if (!savedRequirements) {
        try {
          await adminApi.updateProjectCrewRequirements(projectId, {
            photographer: counts.photographer || 0,
            videographer: counts.videographer || 0,
            hybrid: counts.hybrid || 0,
          });
        } catch (error) {
          toast.error("Failed to save CP requirements");
          return;
        }
      }
      router.push(query ? `${basePath}?${query}` : basePath);
    };
    if (onRequestAssignment) {
      setIsCountModalOpen(false);
      onRequestAssignment(goToAddCreatives);
      return;
    }

    setIsCountModalOpen(false);
    goToAddCreatives();
  };

  const handleViewProfile = (crewMemberId: number) => {
    const query = searchParams?.toString();
    const currentUrl = pathname ? (query ? `${pathname}?${query}` : pathname) : "";
    const returnTo = currentUrl ? encodeURIComponent(currentUrl) : "";
    router.push(
      returnTo
        ? `/admin/users/creative-partners/${crewMemberId}?returnTo=${returnTo}`
        : `/admin/users/creative-partners/${crewMemberId}`
    );
  };

  const handleRemoveCP = async (crewMemberId: number) => {
    if (!canRemoveCP) return;

    try {
      setRemovingCrewId(crewMemberId);
      const response = await adminApi.removeProjectCrew({
        project_id: Number(projectId),
        crew_member_id: crewMemberId,
      });

      if (response?.success === false && response?.error) {
        toast.error(response.error);
        return;
      }

      setCrewMembers((prev) => {
        const updated = prev.filter((member) => Number(member.crew_member_id) !== Number(crewMemberId));
        setActiveIndex((current) => (updated.length === 0 ? 0 : Math.min(current, updated.length - 1)));
        return updated;
      });
      toast.success("Assigned CP removed successfully");
    } catch (error) {
      console.error("Failed to remove assigned CP:", error);
      toast.error("Failed to remove assigned CP");
    } finally {
      setRemovingCrewId(null);
    }
  };

  const getProfileImage = (member: CrewAssignment) => {
    const s3Prefix = process.env.NEXT_PUBLIC_S3_PREFIX || "https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/";

    const photos = member.crew_member?.crew_member_files || [];
    if (photos.length > 0) {
      const photo = photos.find((f) => f.file_type === "profile_photo" || f.file_type === "headshot");
      if (photo) {
        if (photo.file_url) return photo.file_url;
        if (photo.file_path) return `${s3Prefix}${photo.file_path}`;
      }
    }

    const fullName = `${member.crew_member?.first_name || ""} ${member.crew_member?.last_name || ""}`.trim() || "Unknown";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;
  };

  if (!mounted) return null;

  return (
    <div
      className={`rounded-2xl h-full flex flex-col items-center transition-all duration-300 ${isDark ? "bg-[#111111] border border-[#222222]" : "bg-[#F4F5F7] border border-[#E5E5E5]"}`}
      style={{ fontFamily: "var(--font-instrument-sans)" }}
    >
      <style>{stackStyles}</style>
      <div className={`flex justify-center w-full p-6 border-b ${isDark ? "border-b-[#333333]" : "border-b-[#E5E5E5]"}`}>
        <h3 className={`text-lg font-medium transition-colors duration-300 ${isDark ? "text-white" : "text-black"}`}>
          {hasCPs ? "Assigned CP" : "Unassigned CP"}
        </h3>

        {/* Alert while fewer CPs are assigned than the shoot needs */}
        {isShortOfCPs && (
          <span className="relative inline-flex items-center justify-center w-6 h-6 shrink-0 ml-4" role="status" aria-label={missingCPsLabel}>
            {/* Popup message */}
            <span className="absolute bottom-9 left-1/2 -translate-x-1/2 mb-1 z-20 pointer-events-none whitespace-nowrap rounded-md bg-[#E0B91B] px-2.5 py-2 text-xs font-bold text-black shadow-lg">
              {missingCPsLabel}
              <span className="absolute left-1/2 top-full -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 bg-[#E0B91B]" />
            </span>

            {/* Pulsing halo */}
            <span className="absolute inset-0 rounded-full bg-[#E0B91B]/15" />
            <span className="absolute inset-0 rounded-full bg-[#E0B91B]/40 animate-ping motion-reduce:animate-none" />

            {/* Alert circle (18px) */}
            <span className="relative flex items-center justify-center w-[18px] h-[18px] rounded-full bg-[#E0B91B] text-white text-[11px] font-extrabold leading-none">
              !
            </span>
          </span>
        )}
      </div>

      <div className="p-6 h-full">
        {hasCPs ? (
          <div className="flex flex-col items-center justify-between h-full w-full gap-4">

            <div className="relative z-10 w-full flex justify-center items-center py-10">
              <Swiper
                effect={"cards"}
                direction={"vertical"}
                grabCursor={true}
                modules={[EffectCards]}
                className="top-stack-swiper w-[240px] h-[260px] xl:!w-[317px] xl:!h-[309px]"
                cardsEffect={{
                  perSlideOffset: 12,
                  perSlideRotate: 0,
                  slideShadows: false,
                }}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                }}
                onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              >
                {crewMembers.map((member, index) => {
                  const crewMemberId = Number(member.crew_member_id || member.id);
                  const bgColor = index % 3 === 0 ? "bg-[#FFD6D6]" : index % 3 === 1 ? "bg-[#C4B5FD]" : "bg-white";
                  return (
                    <SwiperSlide key={member.id || index} className={`relative rounded-3xl overflow-hidden shadow-lg group ${bgColor}`}>

                      <div className="relative h-full w-full">
                        <Image
                          src={getProfileImage(member)}
                          alt={`${member.crew_member?.first_name || ""} ${member.crew_member?.last_name || ""}`}
                          fill
                          className="object-cover object-top"
                        />
                      </div>

                      {/* Bottom Gradient Fade */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: "linear-gradient(180deg, rgba(0, 0, 0, 0.00) 40%, #000 100%)" }}
                      />
                      {/* Request status (top-left) */}
                      {(() => {
                        const status = getRequestStatusBadge(member);
                        if (!status) return null;
                        return (
                          <span className={`absolute top-4 left-4 z-30 rounded-full px-3 py-1.5 text-xs font-semibold leading-none text-white shadow-md ${status.bg}`}>
                            {status.label}
                          </span>
                        );
                      })()}

                      {/* Absolute Pill Controller Element on the Slide */}
                      <div className="absolute top-4 right-4 z-30 pointer-events-auto flex flex-col items-center gap-1.5 border border-white/40 bg-white/20 rounded-full px-2 py-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            swiperRef.current?.slidePrev();
                          }}
                          disabled={activeIndex === 0}
                          className="text-white hover:text-[#E8D1AB] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUp size={16} strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            swiperRef.current?.slideNext();
                          }}
                          disabled={activeIndex === crewMembers.length - 1}
                          className="text-white hover:text-[#E8D1AB] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowDown size={16} strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Identity Text and Interactive Inline Operations Panel */}
                      <div className="absolute inset-0 flex flex-col justify-end p-5 z-20 pointer-events-none">
                        <div className="flex items-end justify-between w-full gap-2">
                          <div className="text-left select-none min-w-0 flex-1">
                            <h4 className="text-sm font-semibold leading-tight text-white truncate">
                              {member.crew_member
                                ? `${member.crew_member.first_name || ""} ${member.crew_member.last_name || ""}`.trim() || "Unknown"
                                : "Unknown"}
                            </h4>
                            <p className="mt-1 truncate text-xs text-white/80">
                              {getPrimaryRoleLabel(member.crew_member?.primary_role, member.crew_member?.role_name)}
                            </p>
                            <p className="text-xs leading-normal mt-1 text-[#E8D1AB] truncate">
                              Total Compensation {formatCompensation(member.total_compensation)}
                            </p>
                          </div>

                          {/* Action Controls Frame Context */}
                          <div className="flex items-center gap-2 shrink-0 pointer-events-auto">
                            <button
                              type="button"
                              onClick={() => handleViewProfile(crewMemberId)}
                              className="h-8 px-3 py-1.5 bg-white text-black hover:bg-zinc-200 text-[10px] font-semibold rounded-full shadow transition-all"
                            >
                              View Profile
                            </button>

                            {canRemoveCP && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCrewId(crewMemberId);
                                  setIsRemoveModalOpen(true);
                                }}
                                disabled={removingCrewId === crewMemberId}
                                className="w-8 h-8 rounded-full bg-[#FF6467] text-white hover:bg-[#e60000] flex items-center justify-center transition-all shadow-md shrink-0"
                                aria-label="Remove CP"
                                title={removeLockTitle}
                              >
                                {removingCrewId === crewMemberId ? (
                                  <Loader2 size={15} className="animate-spin" />
                                ) : (
                                  <Trash2 size={15} strokeWidth={2.5} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>

            {/* Bottom Actions Row Layout */}
            <div className="flex flex-col lg:flex-row gap-4">
              <Button
                onClick={handleOpenAssignment}
                disabled={!canAssignCP}
                title={assignmentLockTitle}
                className="h-12 px-4 lg:px-7 bg-[#E8D1AB] font-semibold text-sm text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={24} /> Add More CPs
              </Button>
              {/* <Button
                onClick={handleOpenAssignment}
                disabled={!canAssignCP}
                variant="outline"
                className={`h-12 px-4 lg:px-7 font-semibold text-sm l flex-1 justify-center border transition-all ${isDark ? "border-white/20 bg-[#202020] text-white hover:bg-[#171717]" : "border-zinc-200 bg-white text-black hover:bg-zinc-50"}`}
              >
                Change CPs
              </Button> */}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-10 relative flex-1">
            <button
              onClick={handleOpenAssignment}
              disabled={!canAssignCP}
              title={assignmentLockTitle}
              className={`w-15 h-15 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mb-6 hover:scale-105 transition-all shadow-lg disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "bg-[#E8D1AB] shadow-[#E8D1AB]/10" : "bg-[#E8D1AB] shadow-[#E8D1AB]/20"}`}
            >
              <Plus className="w-7 lg:w-10 h-7 lg:h-10 text-[#333]" />
            </button>
            <h4 className={`text-base font-medium leading-none ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
              {canAssignCP ? "Assign Creative Partner" : assignmentLockTitle}
            </h4>
          </div>
        )}
      </div>

      <SelectCPCountModal
        open={isCountModalOpen}
        isDark={isDark}
        onClose={() => setIsCountModalOpen(false)}
        onContinue={handleCountContinue}
      />

      {isRemoveModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            if (removingCrewId === null) {
              setIsRemoveModalOpen(false);
              setSelectedCrewId(null);
            }
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${isDark
              ? "border-[#333333] bg-[#161616] text-white"
              : "border-[#E5E5E5] bg-white text-black"
              }`}
          >
            <h3 className="text-lg font-semibold">
              Remove Creative Partner?
            </h3>
            <p className={`mt-2 text-sm ${isDark ? "text-[#A3A3A3]" : "text-[#666666]"}`}>
              Are you sure you want to remove this creative partner from the shoot? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={removingCrewId !== null}
                onClick={() => {
                  setIsRemoveModalOpen(false);
                  setSelectedCrewId(null);
                }}
                className={isDark ? "border-[#3D3D3D] bg-[#222222] text-white hover:bg-[#2A2A2A]" : "border-[#E5E5E5] bg-white text-black hover:bg-[#F5F5F5]"}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!selectedCrewId || removingCrewId !== null}
                onClick={async () => {
                  if (!selectedCrewId) return;
                  await handleRemoveCP(selectedCrewId);
                  setIsRemoveModalOpen(false);
                  setSelectedCrewId(null);
                }}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {removingCrewId !== null ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
