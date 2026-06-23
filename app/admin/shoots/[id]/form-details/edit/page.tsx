"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { AffiliateShootDetailsForm } from "@/components/affiliate/AffiliateShootDetailsForm";
import { useRequireModulePermission } from "@/lib/hooks/useRequireModulePermission";

export default function EditShootFormPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const projectId = Number(String(id || "").replace(/^#/, "").trim());
  const { allowed, isLoading } = useRequireModulePermission(
    "shoots",
    "edit",
    `/admin/shoots/${id}`,
  );

  if (isLoading || !allowed) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-white/60">
        {!isLoading && !allowed ? "No Permission" : null}
      </div>
    );
  }

  return (
    <AffiliateShootDetailsForm
      isOpen={true}
      onClose={() => router.back()}
      projectId={Number.isFinite(projectId) && projectId > 0 ? projectId : undefined}
      hideAffiliateStep={true}
      redirectTo={`/admin/shoots/${id}`}
    />
  );
}
