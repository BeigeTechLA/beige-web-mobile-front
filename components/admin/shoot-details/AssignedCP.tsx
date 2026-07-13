"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards } from "swiper/modules";
import { useTheme } from "next-themes";

import "swiper/css";
import "swiper/css/effect-cards";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { getPrimaryRoleLabel } from "@/lib/utils/shootDetails";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { toast } from "sonner";
import Link from "next/link";


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
}

export default function AssignedCP({
  projectId,
  assignedCrew = [],
  cpCompensationStatus,
  onRequestAssignment
}: AssignedCPProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, resolvedTheme } = useTheme();
  const { canEdit, canCreate } = usePermissions("shoots");
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [crewMembers, setCrewMembers] = useState<CrewAssignment[]>(assignedCrew);
  const [removingCrewId, setRemovingCrewId] = useState<number | null>(null);
  const [selectedCrewId, setSelectedCrewId] = useState<number | null>(null);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  useEffect(() => {
    setCrewMembers(assignedCrew);
  }, [assignedCrew]);

  const hasCPs = crewMembers.length > 0;
  const userTypeId = Number(user?.user_type_id ?? user?.userTypeId);
  const normalizedRole = String(user?.role ?? user?.userRole ?? "").trim().toLowerCase();
  const isSalesAdmin = userTypeId === 7 && normalizedRole === "sales_admin";
  const isSalesShootPage = pathname?.startsWith("/sales/shoots/");
  const isCompensationApproved = String(cpCompensationStatus || "").toLowerCase() === "approved";
  const canAssignCP = canCreate && !isCompensationApproved;
  const canRemoveCP = canEdit && !isCompensationApproved;
  const assignmentLockTitle = !canCreate
    ? "Create permission not allowed"
    : isCompensationApproved
      ? "CP compensation is approved for this shoot. Adding more CPs is locked."
      : undefined;
  const removeLockTitle = !canEdit
    ? "Edit permission not allowed"
    : isCompensationApproved
      ? "CP compensation is approved for this shoot. Removing CPs is locked."
      : "Remove CP";

  const handleOpenAssignment = () => {
    if (!canCreate) {
      return;
    }

    if (isCompensationApproved) {
      toast.error("CP compensation is approved for this shoot. Adding more CPs is locked.");
      return;
    }

    const goToAddCreatives = () =>
      router.push(
        isSalesAdmin && isSalesShootPage
          ? `/sales/shoots/${projectId}/add-creatives`
          : `/admin/shoots/${projectId}/add-creatives`
      );
    if (onRequestAssignment) {
      onRequestAssignment(goToAddCreatives);
      return;
    }

    goToAddCreatives();
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

    if (member.crew_member?.crew_member_files?.length > 0) {
      const photo = member.crew_member.crew_member_files.find((f) => f.file_type === "profile_photo" || f.file_type === "headshot");
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
          Assigned CP
        </h3>
      </div>

      <div className="p-6 h-full">
        {hasCPs ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative z-10 py-10">
              <Swiper
                effect={"cards"}
                direction={"vertical"}
                grabCursor={true}
                modules={[EffectCards]}
                className="w-[240px] h-[260px] lg:!w-[317px] lg:!h-[309px]"
                cardsEffect={{
                  perSlideOffset: 12,
                  perSlideRotate: 0,
                  slideShadows: false,
                }}
                onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              >
                {crewMembers.map((member, index) => {
                  const crewMemberId = Number(member.crew_member_id || member.id);
                  const bgColor = index % 3 === 0 ? "bg-[#FFD6D6]" : index % 3 === 1 ? "bg-[#C4B5FD]" : "bg-white";

                  return (
                  <SwiperSlide
                      key={member.id || index}
                      className={`relative rounded-3xl overflow-hidden shadow-lg ${bgColor}`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          setSelectedCrewId(crewMemberId);
                          setIsRemoveModalOpen(true);
                        }}
                        disabled={!canRemoveCP || removingCrewId === crewMemberId}
                        className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/80 hover:bg-black flex items-center justify-center text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Remove CP"
                        title={removeLockTitle}
                      >
                        {removingCrewId === crewMemberId ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <X size={18} />
                        )}
                      </button>

                      <Link
                        href={`/admin/users/creative-partners/${crewMemberId}`}
                        className="relative block w-full h-full cursor-pointer"
                      >
                        <Image
                          src={getProfileImage(member)}
                          alt={`${member.crew_member?.first_name || ""} ${
                            member.crew_member?.last_name || ""
                          }`}
                          fill
                          className="object-cover object-top"
                        />
                      </Link>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>

            <div className="mt-auto lg:mb-2 text-center z-10 relative">
              <h4 className={`lg:text-xl font-semibold leading-none tracking-normal transition-all duration-300 ${isDark ? "text-white" : "text-black"}`}>
                {crewMembers[activeIndex]?.crew_member
                  ? `${crewMembers[activeIndex].crew_member.first_name || ""} ${crewMembers[activeIndex].crew_member.last_name || ""}`.trim() || "Unknown"
                  : "Unknown"}
              </h4>
              <p className={`text-sm lg:text-base font-medium leading-none mt-1 lg:mt-2 transition-all duration-300 ${isDark ? "text-[#888888]" : "text-[#666666]"}`}>
                {getPrimaryRoleLabel(
                  crewMembers[activeIndex]?.crew_member?.primary_role,
                  crewMembers[activeIndex]?.crew_member?.role_name
                )}
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              <Button
                onClick={handleOpenAssignment}
                disabled={!canAssignCP}
                title={assignmentLockTitle}
                className="h-12 px-4 lg:px-7 bg-[#E5D5B8] text-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus /> Add More CPs
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-10 relative z-30">
            <button
              onClick={handleOpenAssignment}
              disabled={!canAssignCP}
              title={assignmentLockTitle}
              className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 hover:scale-105 transition-all shadow-lg disabled:cursor-not-allowed disabled:opacity-40 ${isDark ? "bg-[#E5D5B8] shadow-[#E5D5B8]/10" : "bg-[#E8D1AB] shadow-[#E8D1AB]/20"}`}
            >
              <Plus size={40} className="text-black" />
            </button>
            <h4 className={`text-base font-medium leading-none ${isDark ? "text-[#E5D5B8]" : "text-text-black"}`}>
              {canAssignCP ? "Assign Creative Partner" : assignmentLockTitle}
            </h4>
          </div>
        )}
      </div>
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
          className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
            isDark
              ? "border-[#333333] bg-[#161616] text-white"
              : "border-[#E5E5E5] bg-white text-black"
          }`}
        >
          <h3 className="text-lg font-semibold">
            Remove Creative Partner?
          </h3>

          <p
            className={`mt-2 text-sm ${
              isDark ? "text-[#A3A3A3]" : "text-[#666666]"
            }`}
          >
            Are you sure you want to remove this creative partner from the shoot?
            This action cannot be undone.
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
              className={
                isDark
                  ? "border-[#3D3D3D] bg-[#222222] text-white hover:bg-[#2A2A2A]"
                  : "border-[#E5E5E5] bg-white text-black hover:bg-[#F5F5F5]"
              }
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
