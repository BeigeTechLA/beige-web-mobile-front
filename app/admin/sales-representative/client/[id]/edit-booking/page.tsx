"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useGetLeadByIdQuery } from "@/lib/redux/features/sales/salesApi";
import EditBookingForm from "@/components/admin/EditBookingForm";
import Topbar from "@/components/admin/Topbar";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";

export default function EditBookingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const leadId = params.id as string;
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Constant default to dark
  const isDark = !mounted || theme === "dark";

  // Fetch lead data for pre-population
  const { data: leadData, isLoading: isLeadLoading } = useGetLeadByIdQuery(parseInt(leadId), {
    skip: !leadId,
  });

  if (isLeadLoading) {
    return (
      <div className={`flex h-screen items-center justify-center bg-[#101010] ${isDark ? "bg-[#101010] text-white" : "bg-[#F4F5F7] text-black"}`}>
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? "border-white" : "border-black"}`}></div>
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
        <EditBookingForm
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
