"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Camera, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssignCrewFromShootMutation } from "@/lib/redux/features/sales/salesApi";
import Topbar from "@/components/admin/Topbar";
import { toast } from "sonner";
import { CreativeProfileSelectorAdd } from "@/components/sales/creativeProfileSelectorAdd";
import { AssignmentConfirmationModal } from "@/components/sales/AssignmentConfirmationModal";
import { adminApi } from "@/lib/api";
import { useTheme } from "next-themes";
import { usePermissions } from "@/lib/hooks/usePermissions";

type ProjectFulfillmentStats = {
  fulfillment_stats?: {
    videographer?: string;
    photographer?: string;
  };
  location?: string;
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

  const [roleType, setRoleType] = useState<string>('videographer');

  const [assignCrew, { isLoading }] = useAssignCrewFromShootMutation();

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
        const response = await adminApi.getProjectFulfillmentStats(projectId);
        // `adminApi.getProjectFulfillmentStats` already returns `response.data`
        // BUT if the backend actually returns `{ success: true, data: { ... } }` inside that data:
        const stats: ProjectFulfillmentStats =
          response?.success && response?.data ? response.data : response;

        if (stats) {
          // Parse fulfillment stats like "0/2" => videographer needed = 2
          const vReq = parseInt(stats.fulfillment_stats?.videographer?.split('/')[1] || "0");
          const pReq = parseInt(stats.fulfillment_stats?.photographer?.split('/')[1] || "0");
          setReqCounts({ videographer: vReq, photographer: pReq });

          // Also grab location for the crew search
          if (stats.location) setProjectLocation(stats.location);
        }
      } catch (error) {
        console.error("Failed to fetch project fulfillment stats", error);
      }
    };
    fetchFulfillmentStats();
  }, [projectId]);

  const handleAssign = async () => {
    if (!canEdit) return;

    if (selectedCreativeIds.length === 0) {
      toast.error("Please select at least one creative");
      return;
    }

    const isOverVideographers = selectionCounts.videographer > reqCounts.videographer;
    const isOverPhotographers = selectionCounts.photographer > reqCounts.photographer;

    if (isOverVideographers || isOverPhotographers) {
      setIsConfirmModalOpen(true);
      return;
    }

    executeAssignment();
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
      const errorData =
        typeof error === "object" && error !== null && "data" in error
          ? (error as { data?: { errors?: string[]; message?: string } }).data
          : undefined;

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        toast.error(errorData.errors.join(", "));
      } else if (errorData?.message) {
        toast.error(errorData.message);
      } else {
        toast.error("An error occurred while assigning crew");
      }
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
    <>
      <Topbar pathname={pathname}
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
              disabled={isLoading || selectedCreativeIds.length === 0}
              className="h-12 px-4 lg:px-7 bg-[#E8D1AB] text-black disabled:opacity-50"
            >
              {isLoading ? "Assigning..." : `Assign (${selectedCreativeIds.length}) CPs`}
            </Button>
          </div>
        }
      />

      <AssignmentConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeAssignment}
        videographerCount={{ selected: selectionCounts.videographer, required: reqCounts.videographer }}
        photographerCount={{ selected: selectionCounts.photographer, required: reqCounts.photographer }}
      />

      <div className={`min-h-screen overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 font-sans ${isDark ? "bg-black text-white" : "bg-[#F4F5F7] text-black"}`}>
        <Button
          onClick={() => router.back()}
          className={`transition-colors flex items-center gap-2 mb-5 p-0 bg-transparent hover:bg-transparent shadow-none ${
            isDark ? "text-white hover:text-white/80" : "text-zinc-700 hover:text-zinc-900"
          }`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back to Shoot Details</span>
        </Button>

        <CreativeProfileSelectorAdd
          projectId={projectId}
          selectedIds={selectedCreativeIds}
          onChange={setSelectedCreativeIds}
          onSelectionUpdate={setSelectionCounts}
          currentLocation={projectLocation}
          targets={reqCounts}
          roleType={roleType}
          isDark={isDark}
        />
      </div>
    </>
  );
}