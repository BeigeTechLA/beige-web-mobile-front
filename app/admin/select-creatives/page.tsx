"use client";

import React, { useState } from "react";
import { useRouter, useParams, usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, Camera, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssignCrewFromLeadMutation } from "@/lib/redux/features/sales/salesApi";
import Topbar from "@/components/admin/Topbar";
import { toast } from "sonner";
import { CreativeProfileSelectorAdd } from "@/components/sales/creativeProfileSelectorAdd";
import { AssignmentConfirmationModal } from "@/components/sales/AssignmentConfirmationModal";
import { salesApi } from "@/lib/api";
import { useEffect } from "react";


export default function ClientDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // CHANGED: Get the ID from URL Query Parameter (?id=xxx)
  // Removed hardcoded '136'
  const leadId = searchParams.get('id');

  const [selectedCreativeIds, setSelectedCreativeIds] = useState<number[]>([]);
  const [selectionCounts, setSelectionCounts] = useState({ videographer: 0, photographer: 0 });
  const [reqCounts, setReqCounts] = useState({ videographer: 0, photographer: 0 });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [assignCrew, { isLoading }] = useAssignCrewFromLeadMutation();

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

  const handleAssign = async () => {
    // Safety check: ensure leadId exists
    if (!leadId) {
      toast.error("Lead ID is missing. Cannot assign crew.");
      return;
    }

    if (selectedCreativeIds.length === 0) {
      toast.error("Please select at least one creative");
      return;
    }

    // Check if over-selecting
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
        lead_id: Number(leadId), // Use the dynamic ID
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
    } catch (error: any) {
      console.error("Failed to assign crew", error);
      if (error?.data?.errors && Array.isArray(error.data.errors)) {
        toast.error(error.data.errors.join(", "));
      } else if (error?.data?.message) {
        toast.error(error.data.message);
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
              <div className="h-12 flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-lg text-sm text-white/70">
                <Video size={16} />
                <span>Videographer(s) : {selectionCounts.videographer.toString()}/{reqCounts.videographer.toString()}</span>
              </div>
              <div className="h-12 flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-lg text-sm text-white/70">
                <Camera size={16} />
                <span>Photographers(s) : {selectionCounts.photographer.toString()}/{reqCounts.photographer.toString()}</span>
              </div>
            </div>

            <Button
              onClick={handleAssign}
              disabled={isLoading || selectedCreativeIds.length === 0}
              className="h-12 px-4 lg:px-7 bg-[#E5D5B8] text-black disabled:opacity-50"
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
      />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 text-white font-sans">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0"
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {/* Pass the dynamic leadId here as well */}
        <CreativeProfileSelectorAdd
          leadId={leadId || undefined}
          selectedIds={selectedCreativeIds}
          onChange={setSelectedCreativeIds}
          onSelectionUpdate={setSelectionCounts}
        />
      </div>
    </>
  );
}