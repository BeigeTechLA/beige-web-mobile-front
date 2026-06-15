"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useGetClientLeadByIdQuery } from "@/lib/redux/features/sales/salesApi";
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Constant default to dark
  const isDark = !mounted || theme === "dark";

  // Fetch lead data for pre-population
  const { data: leadData, isLoading: isLeadLoading } = useGetClientLeadByIdQuery(parseInt(leadId), {
    skip: !leadId,
  });

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
        <p>Lead not found.</p>
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
