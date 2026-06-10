"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { ArrowLeft, Camera, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssignCrewFromLeadMutation } from "@/lib/redux/features/sales/salesApi";
import Topbar from "@/components/admin/Topbar";
import { toast } from "sonner";
import { CreativeProfileSelectorAdd } from "@/components/sales/creativeProfileSelectorAdd";
import { AssignmentConfirmationModal, AssignmentMissingDetailsModal } from "@/components/sales/AssignmentConfirmationModal";
import { salesApi } from "@/lib/api";
import { useTheme } from "next-themes";
import { getCpAssignmentMissingDetails } from "@/lib/utils/cpAssignmentMissingFields";

export default function ClientSelectCreativesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const leadId = params.id as string;

  const [selectedCreativeIds, setSelectedCreativeIds] = useState<number[]>([]);
  const [selectionCounts, setSelectionCounts] = useState({ videographer: 0, photographer: 0 });
  const [reqCounts, setReqCounts] = useState({ videographer: 0, photographer: 0 });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [missingDetails, setMissingDetails] = useState<string[]>([]);
  const [isMissingDetailsModalOpen, setIsMissingDetailsModalOpen] = useState(false);
  const [assignmentDetails, setAssignmentDetails] = useState<Record<string, unknown> | null>(null);
  const [assignCrew, { isLoading }] = useAssignCrewFromLeadMutation();

  useEffect(() => setMounted(true), []);
  const isDark = !mounted || theme === "dark";

  useEffect(() => {
    const fetchReqCounts = async () => {
      if (leadId) {
        try {
          const response = await salesApi.getClientLeadStats(leadId);
          setAssignmentDetails(response?.data || response);
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

  const handleAssign = async () => {
    if (!leadId) {
      toast.error("Lead ID is missing. Cannot assign crew.");
      return;
    }

    if (selectedCreativeIds.length === 0) {
      toast.error("Please select at least one creative");
      return;
    }

    const currentMissingDetails = getCpAssignmentMissingDetails(assignmentDetails);
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
        client_lead_id: Number(leadId),
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
          </>
        }
      />

      <AssignmentConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeAssignment}
        videographerCount={{ selected: selectionCounts.videographer, required: reqCounts.videographer }}
        photographerCount={{ selected: selectionCounts.photographer, required: reqCounts.photographer }}
        isDark={isDark}
      />

      <AssignmentMissingDetailsModal
        isOpen={isMissingDetailsModalOpen}
        onClose={() => setIsMissingDetailsModalOpen(false)}
        missingDetails={missingDetails}
        isDark={isDark}
      />

      <div className={`overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 font-sans transition-colors duration-300 ${isDark ? "text-white" : "text-black"
        }`}>
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          className={`transition-colors flex items-center gap-2 mb-5 p-0 bg-transparent hover:bg-transparent ${isDark ? "text-white/70 hover:text-white" : "text-black hover:text-black/80"
            }`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        <CreativeProfileSelectorAdd
          leadId={leadId}
          selectedIds={selectedCreativeIds}
          onChange={setSelectedCreativeIds}
          onSelectionUpdate={setSelectionCounts}
          statsSource="client"
          isDark={isDark}
        />
      </div>
    </>
  );
}
