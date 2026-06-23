"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminApi } from "@/lib/api";
import EditBookingForm from "@/components/admin/EditBookingForm";
import Topbar from "@/components/admin/Topbar";
import { useTheme } from "next-themes";
import { usePermissions } from "@/lib/hooks/usePermissions";

interface EditShootBookingPageProps {
  params: Promise<{ id: string }>;
}

type ProjectResponse = {
  project?: Record<string, unknown>;
  lead_id?: string | number;
  stream_project_booking_id?: string | number;
  [key: string]: unknown;
};

export default function EditShootBookingPage({ params }: EditShootBookingPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { id: projectId } = use(params);
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const { canEdit, isLoading: isPermissionsLoading } = usePermissions("shoots");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Constant default to dark
  const isDark = !mounted || theme === "dark";
  const shootBasePath = pathname?.startsWith("/sales") ? "/sales/shoots" : "/admin/shoots";

  useEffect(() => {
    if (!mounted || isPermissionsLoading || canEdit) return;
    router.replace(`${shootBasePath}/${projectId}`);
  }, [mounted, isPermissionsLoading, canEdit, router, shootBasePath, projectId]);

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

  if (loading || isPermissionsLoading || !canEdit) {
    return (
      <div className={`flex h-screen items-center justify-center bg-[#101010] ${isDark ? "bg-[#101010] text-white" : "bg-[#F4F5F7] text-black"}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? "border-white" : "border-black"}`}></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={`flex h-screen items-center justify-center bg-[#101010] ${isDark ? "bg-[#101010] text-white" : "bg-[#F4F5F7] text-black"}`}>
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
          onSuccess={() => router.push(`${shootBasePath}/${projectId}`)}
          onCancel={() => router.back()}
          isDark={isDark}
        />
      </div>
    </>
  );
}
