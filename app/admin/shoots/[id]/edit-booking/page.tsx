"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminApi } from "@/lib/api";
import EditBookingForm from "@/components/admin/EditBookingForm";
import Topbar from "@/components/admin/Topbar";
import { Loader2 } from "lucide-react";

interface EditShootBookingPageProps {
    params: Promise<{ id: string }>;
}

export default function EditShootBookingPage({ params }: EditShootBookingPageProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { id: projectId } = use(params);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                const response = await adminApi.getProjectDetails(projectId);
                // The provided response structure shows the data needed is in response.data
                const projectData = response?.data || response;
                setProject(projectData);
            } catch (error) {
                console.error("Failed to fetch shoot details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (projectId) fetchProjectDetails();
    }, [projectId]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#101010]">
                <Loader2 className="animate-spin text-white/50" size={40} />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#101010] text-white">
                <p>Project not found.</p>
            </div>
        );
    }

    // Reuse the EditBookingForm component.
    // Pass the booking ID as leadId so the crew search also works for shoots.
    const projectInfo = project?.project || project;
    const leadId = projectInfo?.lead_id || projectInfo?.stream_project_booking_id || projectId;

    return (
        <>
            <Topbar pathname={pathname} />
            <div className="bg-[#101010] min-h-screen">
                <EditBookingForm
                    leadId={leadId}
                    projectId={projectId}
                    initialBookingData={project}
                    onSuccess={() => router.push(`/admin/shoots/${projectId}`)}
                    onCancel={() => router.back()}
                />
            </div>
        </>
    );
}
