"use client";

import React, { useEffect, useState } from "react";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { getLocalShootAgreement } from "@/components/admin/agreements/localAgreementStore";

type SentRecipient = {
  creatorId: number;
  creatorName: string;
  role: string;
  compensation: number;
  status: string;
};

type SentAgreement = {
  agreementId?: string;
  shootId?: string;
  projectName?: string;
  assignmentId?: string;
  mode?: "individual" | "common";
  version?: string;
  recipients?: SentRecipient[];
};

const formatCurrency = (value: number) =>
  Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const statusClasses = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "accepted") return "bg-[#C9F8DD] text-[#169348]";
  if (normalized === "rejected" || normalized === "not accepted") return "bg-[#FFC7C7] text-[#B51F28]";
  return "bg-[#FFF1B7] text-[#C56A00]";
};

export default function CreativePartnerAgreementTable({ shootId }: { shootId: string }) {
  const router = useRouter();
  const { isDark } = useResolvedTheme();
  const [agreement, setAgreement] = useState<SentAgreement | null>(null);

  useEffect(() => {
    const loadAgreement = () => {
      try {
        const stored = getLocalShootAgreement(shootId);
        if (stored) {
          setAgreement({
            agreementId: stored.agreementId,
            shootId: stored.shootId,
            projectName: stored.projectName,
            assignmentId: stored.assignmentId,
            mode: stored.mode,
            version: stored.version,
            recipients: stored.creators.map((creator) => ({
              creatorId: creator.creatorId,
              creatorName: creator.creatorName,
              role: creator.role,
              compensation: creator.totalCompensation,
              status: stored.status || "Pending",
            })),
          });
          return;
        }

        const raw =
          window.localStorage.getItem(`beige_shoot_agreement_sent_${shootId}`) ||
          window.sessionStorage.getItem(`beige_shoot_agreement_sent_${shootId}`);
        setAgreement(raw ? (JSON.parse(raw) as SentAgreement) : null);
      } catch (error) {
        console.error("Failed to load shoot agreement assignment state", error);
        setAgreement(null);
      }
    };

    loadAgreement();
    window.addEventListener("beige-agreements-local-updated", loadAgreement);
    window.addEventListener("storage", loadAgreement);
    return () => {
      window.removeEventListener("beige-agreements-local-updated", loadAgreement);
      window.removeEventListener("storage", loadAgreement);
    };
  }, [shootId]);

  const openAgreement = (recipient: SentRecipient) => {
    if (!agreement) return;
    const agreementId = agreement.agreementId || `shoot-${shootId}`;
    try {
      window.sessionStorage.setItem(
        "beige_selected_agreement",
        JSON.stringify({
          id: agreementId,
          agreementId,
          shootId,
          cpId: String(recipient.creatorId),
          cpName: recipient.creatorName,
          projectName: agreement.projectName || `Shoot #${shootId}`,
          projectId: agreement.assignmentId || `ASSIGN-${shootId}`,
          role: recipient.role,
          version: agreement.version || "v1.0",
          status: recipient.status || "Pending",
          agreementType: "shoot",
          admin: "Admin",
        }),
      );
    } catch (error) {
      console.error("Failed to prepare agreement detail navigation", error);
    }
    router.push(`/admin/agreements/${encodeURIComponent(agreementId)}?from=shoot&shootId=${encodeURIComponent(shootId)}`);
  };

  const recipients = Array.isArray(agreement?.recipients) ? agreement.recipients : [];
  if (!agreement || recipients.length === 0) return null;

  return (
    <div className="px-5 mt-6">
      <section className={`overflow-hidden rounded-xl border ${isDark ? "border-[#2D2D2D] bg-[#101010]" : "border-[#E5E5E5] bg-white"}`}>
        <div className={`flex items-center justify-between gap-3 border-b px-4 py-4 ${isDark ? "border-[#2D2D2D]" : "border-[#EFEFEF]"}`}>
          <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>
            Creative Partner Assignment
          </h3>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className={`grid grid-cols-[1.4fr_0.8fr_0.55fr_0.8fr_0.8fr_60px] gap-4 border-b px-4 py-3 text-[11px] font-medium ${isDark ? "border-[#2D2D2D] text-[#E8D1AB]" : "border-[#EFEFEF] text-[#7D6235]"}`}>
              <span>Creative Partner</span>
              <span>Agreement Type</span>
              <span>Version</span>
              <span>Compensation</span>
              <span>Agreement Status</span>
              <span className="text-center">Action</span>
            </div>

            {recipients.map((recipient) => (
              <button
                key={recipient.creatorId}
                type="button"
                onClick={() => openAgreement(recipient)}
                className={`grid w-full grid-cols-[1.4fr_0.8fr_0.55fr_0.8fr_0.8fr_60px] items-center gap-4 border-b px-4 py-3 text-left text-sm last:border-b-0 ${isDark ? "border-[#242424] hover:bg-white/[0.02]" : "border-[#F1F1F1] hover:bg-black/[0.02]"}`}
              >
                <span className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${isDark ? "bg-[#ECE0CB] text-black" : "bg-[#EFE5D5] text-[#604A2A]"}`}>
                    {initials(recipient.creatorName)}
                  </span>
                  <span className="min-w-0">
                    <span className={`block truncate font-medium ${isDark ? "text-white" : "text-black"}`}>{recipient.creatorName}</span>
                    <span className={`mt-0.5 block truncate text-xs ${isDark ? "text-white/40" : "text-black/40"}`}>{recipient.role}</span>
                  </span>
                </span>
                <span className={isDark ? "text-white/70" : "text-black/70"}>{agreement.mode === "common" ? "Common" : "Individual"}</span>
                <span className="w-fit rounded bg-[#F2EBDD] px-2 py-1 text-[10px] font-medium text-black">{agreement.version || "v1.0"}</span>
                <span className={isDark ? "text-white/80" : "text-black/80"}>{formatCurrency(recipient.compensation)}</span>
                <span className={`w-fit rounded-full px-4 py-1.5 text-xs font-medium ${statusClasses(recipient.status || "Pending")}`}>{recipient.status || "Pending"}</span>
                <span className="flex justify-center"><MoreVertical size={18} /></span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
