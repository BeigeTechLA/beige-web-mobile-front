"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import { DeletionRequestsManagement } from "@/components/admin/users/DeletionRequestsManagement";

export default function DeletionRequestsPage() {
  const pathname = usePathname();

  return (
    <>
      <Topbar pathname={pathname} />
      <div className="overflow-hidden p-4 pb-30 lg:px-10 lg:py-9 space-y-4 lg:space-y-8">
        <DeletionRequestsManagement />
      </div>
    </>
  );
}