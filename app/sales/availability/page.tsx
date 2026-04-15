"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import SalesAvailability from "@/components/sales/SalesAvailability";
import Topbar from "@/components/sales/Topbar";

const getUserTypeId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedUser = localStorage.getItem("revure_user");
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const normalizedUserTypeId = Number(
      parsedUser?.user_type_id ?? parsedUser?.userTypeId
    );

    return Number.isFinite(normalizedUserTypeId) ? normalizedUserTypeId : null;
  } catch {
    return null;
  }
};

export default function SalesAvailabilityPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const userTypeId = getUserTypeId();
    const canAccessPage = userTypeId === 5;

    setHasAccess(canAccessPage);
    setAccessChecked(true);

    if (!canAccessPage) {
      router.replace("/sales/dashboard");
    }
  }, [router]);

  if (!accessChecked || !hasAccess) {
    return null;
  }

  return (
    <>
      <Topbar pathname={pathname} />
      <div className="min-h-screen p-4 pb-30 lg:p-6 lg:px-10 lg:py-9">
        <SalesAvailability />
      </div>
    </>
  );
}
