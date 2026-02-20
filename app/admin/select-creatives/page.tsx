"use client";

import React, { useState } from "react";
import { useRouter, useParams, usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft, Camera, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreativeProfileSelector } from "@/components/sales/CreativeProfileSelector";
import { useAssignCrewFromLeadMutation } from "@/lib/redux/features/sales/salesApi";
import Topbar from "@/components/admin/Topbar";
import { toast } from "sonner";
import { CreativeProfileSelectorAdd } from "@/components/sales/creativeProfileSelectorAdd";


export default function ClientDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const rawId = params?.id || searchParams.get('id') || '136'; // Default to 136 for testing
  const leadId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [selectedCreativeIds, setSelectedCreativeIds] = useState<number[]>([]);
  const [assignCrew, { isLoading }] = useAssignCrewFromLeadMutation();

  const handleAssign = async () => {
    if (selectedCreativeIds.length === 0) {
      toast.error("Please select at least one creative");
      return;
    }

    try {
      const response = await assignCrew({
        lead_id: Number(leadId),
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
      // specific error handling if the error object comes from the RTK Query failure
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
                <span>Videographer(s) : 02/06</span>
              </div>
              <div className="h-12 flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-lg text-sm text-white/70">
                <Camera size={16} />
                <span>Photographers(s) : 02/06</span>
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

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 text-white font-sans">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0"
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        <CreativeProfileSelectorAdd
          leadId={leadId || undefined}
          selectedIds={selectedCreativeIds}
          onChange={setSelectedCreativeIds}
        />
      </div>
    </>
  );
}
