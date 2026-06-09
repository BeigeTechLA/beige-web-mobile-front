"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Camera, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssignCrewFromShootMutation } from "@/lib/redux/features/sales/salesApi";
import Topbar from "@/components/admin/Topbar";
import { toast } from "sonner";
import { CreativeProfileSelectorAdd } from "@/components/sales/creativeProfileSelectorAdd";
import { AssignmentConfirmationModal, AssignmentMissingDetailsModal } from "@/components/sales/AssignmentConfirmationModal";
import { adminApi } from "@/lib/api";
import { useTheme } from "next-themes";
import { getCpAssignmentMissingDetails } from "@/lib/utils/cpAssignmentMissingFields";

type FulfillmentStats = {
  fulfillment_stats?: {
    videographer?: string;
    photographer?: string;
  };
  location?: string;
  needs_attention?: {
    missing_fields?: string[];
  };
  [key: string]: unknown;
};

export default function AddCreativesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();

  const { id: projectId } = use(params);

  const [mounted, setMounted] = useState(false);
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const [selectedCreativeIds, setSelectedCreativeIds] = useState<number[]>([]);
  const [selectionCounts, setSelectionCounts] = useState({ videographer: 0, photographer: 0 });
  const [reqCounts, setReqCounts] = useState({ videographer: 0, photographer: 0 });
  const [projectLocation, setProjectLocation] = useState<string>("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [missingDetails, setMissingDetails] = useState<string[]>([]);
  const [isMissingDetailsModalOpen, setIsMissingDetailsModalOpen] = useState(false);

  const [roleType, setRoleType] = useState<string>('videographer');
  const [stats, setStats] = useState<FulfillmentStats | null>(null);

  const [assignCrew, { isLoading }] = useAssignCrewFromShootMutation();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch project fulfillment stats using the new POST endpoint
  useEffect(() => {
    const fetchFulfillmentStats = async () => {
      if (!projectId) return;
      try {
        const response = await adminApi.getProjectFulfillmentStats(projectId);
        // `adminApi.getProjectFulfillmentStats` already returns `response.data`
        // BUT if the backend actually returns `{ success: true, data: { ... } }` inside that data:
        const stats = (response?.success && response?.data ? response.data : response) as FulfillmentStats;

        if (stats) {
          setStats(stats);
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
    if (selectedCreativeIds.length === 0) {
      toast.error("Please select at least one creative");
      return;
    }

    const currentMissingDetails = getCpAssignmentMissingDetails(stats);
    if (currentMissingDetails.length > 0) {
      setMissingDetails(currentMissingDetails);
      setIsMissingDetailsModalOpen(true);
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

  return (
    <>
      <Topbar pathname={pathname}
        actions={
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
            <div className="flex flex-col lg:flex-row gap-2 lg:gap-3">
              {[
                { type: 'videographer', icon: Video, label: 'Videographer(s)', count: selectionCounts.videographer, target: reqCounts?.videographer || stats?.fulfillment_stats?.videographer?.split('/')[1] || '0' },
                { type: 'photographer', icon: Camera, label: 'Photographers(s)', count: selectionCounts.photographer, target: reqCounts?.photographer || stats?.fulfillment_stats?.photographer?.split('/')[1] || '0' }
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

      <AssignmentMissingDetailsModal
        isOpen={isMissingDetailsModalOpen}
        onClose={() => setIsMissingDetailsModalOpen(false)}
        missingDetails={missingDetails}
        isDark={isDark}
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
