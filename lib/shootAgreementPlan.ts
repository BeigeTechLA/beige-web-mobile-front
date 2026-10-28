import type { AddCpCompensationPayload, PendingCompensationShoot } from "@/lib/api/cpCompensation";

export type ShootAgreementPlan = {
  compensation: AddCpCompensationPayload;
  creators: PendingCompensationShoot["creators"];
};

export const shootAgreementPlanKey = (bookingId: number | string) => `shoot-agreement-plan:${bookingId}`;
