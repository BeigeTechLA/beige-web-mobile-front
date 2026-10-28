"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { agreementApi, AgreementDocument } from "@/lib/api/agreements";

export default function AdminAgreementDetailsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const agreementId = Number(params.get("agreement_id"));
  const [agreement, setAgreement] = useState<AgreementDocument | null>(null);

  useEffect(() => {
    if (!agreementId) {
      router.replace("/admin/agreements");
      return;
    }

    agreementApi.getAdminAgreement(agreementId)
      .then((response) => setAgreement(response.data.agreement))
      .catch(() => router.replace("/admin/agreements"));
  }, [agreementId, router]);

  useEffect(() => {
    if (!agreement) return;
    const target = agreement.agreement_type === "shoot"
      ? `/admin/agreements/shoot-agreement-details?agreement_id=${agreement.agreement_document_id}`
      : `/admin/agreements/preview-general-agreement?agreement_id=${agreement.agreement_document_id}`;
    router.replace(target);
  }, [agreement, router]);

  return <div className="min-h-screen bg-[#0A0A0A]" aria-busy="true" />;
}
