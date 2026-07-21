"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { AffiliateShootDetailsForm } from "@/components/affiliate/AffiliateShootDetailsForm";

export default function SalesEditShootFormPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const projectId = Number(String(id || "").replace(/^#/, "").trim());

  return (
    <AffiliateShootDetailsForm
      isOpen={true}
      onClose={() => router.back()}
      projectId={Number.isFinite(projectId) && projectId > 0 ? projectId : undefined}
      hideAffiliateStep={true}
      redirectTo={`/sales/shoots/${id}`}
    />
  );
}
