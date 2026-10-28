"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GeneralAgreementModal } from "./GeneralAgreementModal";
import { agreementApi, AgreementDocument } from "@/lib/api/agreements";

/** Keeps the mandatory CP agreement gate in one place for all creator routes. */
export function CreatorAgreementGate() {
  const router = useRouter();
  const pathname = usePathname();
  const [agreement, setAgreement] = useState<AgreementDocument | null>(null);
  const [isRequired, setIsRequired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await agreementApi.getCurrentGeneralAgreement();
        if (!active) return;
        setAgreement(response.data.agreement);
        setIsRequired(response.data.acceptance_required);
      } catch (error) {
        // A missing published template is an admin configuration issue. Do not lock
        // every CP screen while the admin has not published the first version.
        console.error("Unable to load current general agreement", error);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const markAccepted = () => setIsRequired(false);
    window.addEventListener("creator-general-agreement-accepted", markAccepted);
    return () => window.removeEventListener("creator-general-agreement-accepted", markAccepted);
  }, []);

  // The full agreement page is the required modal's continuation. Rendering
  // the overlay there traps the CP behind it and leaves a stale page behind.
  const isViewingGeneralAgreement = pathname?.startsWith("/creator/dashboard/agreements/general-agreement");
  if (loading || !isRequired || !agreement || isViewingGeneralAgreement) return null;

  return (
    <GeneralAgreementModal
      isOpen
      // Deliberately no close action: a mandatory agreement cannot be dismissed.
      onViewAgreement={() => router.push(`/creator/dashboard/agreements/general-agreement?agreement_id=${agreement.agreement_document_id}`)}
      onAccept={() => router.push(`/creator/dashboard/agreements/general-agreement?agreement_id=${agreement.agreement_document_id}`)}
    />
  );
}
