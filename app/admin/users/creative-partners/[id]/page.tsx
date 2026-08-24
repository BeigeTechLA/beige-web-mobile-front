"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from "next/navigation";
import { CreativePartnerProfile } from '@/components/admin/users/CreativePartnerProfile';
import Topbar from "@/components/admin/Topbar";
import { adminApi } from "@/lib/api";
import { useTheme } from "next-themes";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CreativePartnerDetailsPage({ params }: PageProps) {
  const pathname = usePathname();
  const { id } = React.use(params);
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = React.useState<string>("");
  const [onboardingStatus, setOnboardingStatus] = React.useState<{
    success?: boolean;
    progress_percent?: number;
    completed_count?: number;
    total_required?: number;
    missing_count?: number;
  } | null>(null);

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        // 1. Fetch Basic Detail
        const response = await adminApi.getCrewMemberDetail(id);
        if (response?.data) {
          const fullName = `${response.data.first_name || ''} ${response.data.last_name || ''}`.trim();
          setName(fullName);
        }

        // 2. Fetch Onboarding Status
        const statusResponse = await adminApi.getCrewMemberOnboardingStatus(id);
        if (statusResponse?.success) {
          setOnboardingStatus(statusResponse);
        }
      } catch (error) {
        console.error("Failed to fetch partner data:", error);
      }
    };
    if (id) fetchPartner();
  }, [id]);

  const isDark = !mounted || theme === "dark";

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{ [id]: name }}
      />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-6">
        <CreativePartnerProfile 
          id={id} 
          isDark={isDark} 
          onboardingStatus={onboardingStatus}
        />
      </div>
    </>
  );
}
