"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import EditBookingDetailsForm from "@/components/admin/EditBookingDetailsForm";
import Topbar from "@/components/admin/Topbar";
import { useTheme } from "next-themes";
import { useRequireModulePermission } from "@/lib/hooks/useRequireModulePermission";

export default function EditBookingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const leadId = params.id as string;
  const { theme } = useTheme();
  const { allowed, isLoading: isPermissionLoading } = useRequireModulePermission(
    "shoots",
    "edit",
    `/sales/client/${leadId}`,
  );
  const [mounted, setMounted] = useState(false);
  const [leadData, setLeadData] = useState<any>(null);
  const [isLeadLoading, setIsLeadLoading] = useState(true);
  const [leadError, setLeadError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Constant default to dark
  const isDark = !mounted || theme === "dark";

  useEffect(() => {
    if (!leadId) return;

    let isActive = true;

    const loadLead = async () => {
      setIsLeadLoading(true);
      setLeadError(null);

      try {
        const response = await apiClient.get<any>(`sales/leads/${leadId}`);
        if (!isActive) return;

        const normalizedData = response?.data ?? response;
        setLeadData(normalizedData);
      } catch (error) {
        if (!isActive) return;
        setLeadError(error instanceof Error ? error.message : "Failed to load lead data");
        setLeadData(null);
      } finally {
        if (isActive) {
          setIsLeadLoading(false);
        }
      }
    };

    loadLead();

    return () => {
      isActive = false;
    };
  }, [leadId]);

  if (isLeadLoading || isPermissionLoading || !allowed) {
    return (
      <div className={`flex h-screen items-center justify-center bg-[#101010] ${isDark ? "bg-[#101010] text-white" : "bg-[#F4F5F7] text-black"}`}>
        {!isLeadLoading && !isPermissionLoading && !allowed ? (
          <p>No Permission</p>
        ) : (
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? "border-white" : "border-black"}`}></div>
        )}
      </div>
    );
  }

  if (!leadData) {
    return (
      <div className={`flex h-screen items-center justify-center bg-[#101010] ${isDark ? "bg-[#101010] text-white" : "bg-[#F4F5F7] text-black"}`}>
        <p>{leadError || "Lead not found."}</p>
      </div>
    );
  }

  return (
    <>
      <Topbar pathname={pathname} />
      <div className={`${isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"} min-h-screen`}>
        <EditBookingDetailsForm
          leadId={leadId}
          initialBookingData={leadData}
          onSuccess={() => router.back()}
          onCancel={() => router.back()}
          isDark={isDark}
        />
      </div>
    </>
  );
}
