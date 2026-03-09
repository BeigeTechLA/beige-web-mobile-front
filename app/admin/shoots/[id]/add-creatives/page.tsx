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

export default function AddCreativesPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const pathname = usePathname();
    const { id: projectId } = use(params);

    const [selectedCreativeIds, setSelectedCreativeIds] = useState<number[]>([]);
    const [selectionCounts, setSelectionCounts] = useState({ videographer: 0, photographer: 0 });
    const [reqCounts, setReqCounts] = useState({ videographer: 0, photographer: 0 });
    const [projectLocation, setProjectLocation] = useState<string>("");
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [assignCrew, { isLoading }] = useAssignCrewFromShootMutation();

    // Fetch project fulfillment stats using the new POST endpoint
    useEffect(() => {
        const fetchFulfillmentStats = async () => {
            if (!projectId) return;
            try {
                const response = await adminApi.getProjectFulfillmentStats(projectId);
                // `adminApi.getProjectFulfillmentStats` already returns `response.data`
                // BUT if the backend actually returns `{ success: true, data: { ... } }` inside that data:
                const stats = response?.success && response?.data ? response.data : response;

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
                                <span>Videographer(s) : {selectionCounts.videographer}/{reqCounts.videographer}</span>
                            </div>
                            <div className="h-12 flex items-center gap-2 bg-[#1A1A1A] border border-white/10 px-4 py-2 rounded-lg text-sm text-white/70">
                                <Camera size={16} />
                                <span>Photographers(s) : {selectionCounts.photographer}/{reqCounts.photographer}</span>
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
                <Button
                    onClick={() => router.back()}
                    className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0"
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
                />
            </div>
        </>
    );
}
