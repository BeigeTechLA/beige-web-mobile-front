"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GeneralAgreementModal } from "./GeneralAgreementModal";
import { agreementApi, AgreementDocument } from "@/lib/api/agreements";

/** Keeps the mandatory CP agreement gate in one place for all creator routes. */
export function CreatorAgreementGate() {
  const router = useRouter();
  const [agreement, setAgreement] = useState<AgreementDocument | null>(null);
  const [isRequired, setIsRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  if (loading || !isRequired || !agreement) return null;

  return (
    <GeneralAgreementModal
      isOpen
      // Deliberately no close action: a mandatory agreement cannot be dismissed.
      onViewAgreement={() => router.push(`/creator/dashboard/agreements/general-agreement?agreement_id=${agreement.agreement_document_id}`)}
      onAccept={async () => {
        try {
          setSubmitting(true);
          await agreementApi.acceptGeneralAgreement(agreement.agreement_document_id);
          setIsRequired(false);
          toast.success("General agreement accepted");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Unable to accept the agreement");
        } finally {
          setSubmitting(false);
        }
      }}
      isSubmitting={submitting}
    />
  );
}
