"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from "next/navigation";
import SalesTopbar from "@/components/sales/Topbar";
import { CreativePartnerProfile } from "@/components/admin/users/CreativePartnerProfile";
import { adminApi } from "@/lib/api";
import { useTheme } from "next-themes";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SalesCreativePartnerDetailsPage({ params }: PageProps) {
  const pathname = usePathname();
  const { id } = React.use(params);
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [name, setName] = React.useState<string>("");

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const response = await adminApi.getCrewMemberDetail(id);
        if (response?.data) {
          const fullName = `${response.data.first_name || ""} ${response.data.last_name || ""}`.trim();
          setName(fullName || `Creative Partner ${id}`);
        }
      } catch (error) {
        console.error("Failed to fetch partner name:", error);
        setName(`Creative Partner ${id}`);
      }
    };

    if (id) {
      fetchPartner();
    }
  }, [id]);

  const isDark = !mounted || theme === "dark";

  return (
    <>
      <SalesTopbar pathname={pathname} title={name || "Creative Partner Profile"} />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-6">
        <CreativePartnerProfile id={id} isDark={isDark} />
      </div>
    </>
  );
}
