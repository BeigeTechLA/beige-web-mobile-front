import type { AddCpCompensationPayload, PendingCompensationShoot } from "@/lib/api/cpCompensation";

export type ShootAgreementPlan = {
  compensation: AddCpCompensationPayload;
  creators: PendingCompensationShoot["creators"];
  selected_creative_ids?: number[];
  agreement_draft?: {
    sections: Array<{ id: string; num: string; title: string; subtitle?: string; content: string; isExpanded: boolean }>;
    sections_by_creator: Record<string, Array<{ id: string; num: string; title: string; subtitle?: string; content: string; isExpanded: boolean }>>;
    production_date: string | null;
    location: string;
    call_time: string;
    end_time: string;
    selected_mode: "individual" | "common";
  };
};

export const shootAgreementPlanKey = (bookingId: number | string) => `shoot-agreement-plan:${bookingId}`;
