"use client";

import React, { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import Topbar from "@/components/admin/Topbar";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import ShootAssignmentAgreement from "@/components/creator-profile/agreements/ShootAssignmentAgreement";
import { acceptCpShootAgreement, getCpShootAgreement, rejectCpShootAgreement } from "@/lib/api";
import { toast } from "sonner";

type AgreementStatus =
  | "Accepted"
  | "Expired"
  | "Not Accepted"
  | "Pending"
  | "Rejected"
  | "Cancelled";

type AgreementDetail = {
  id: number | string;
  cpName: string;
  cpInitials?: string;
  cpDate?: string;
  avatarTone?: string;
  projectName: string;
  projectId: string;
  role: string;
  version: string;
  status: AgreementStatus;
  agreementType: "general" | "shoot";
  admin?: string;
  sendDate?: string;
};

const FALLBACK_AGREEMENT: AgreementDetail = {
  id: 1,
  cpName: "John Doe",
  projectName: "ABC Corporate Shoot",
  projectId: "ASN-2012",
  role: "Videographer",
  version: "v1.0",
  status: "Accepted",
  agreementType: "shoot",
  admin: "Admin",
  sendDate: "15 Sep 2026, 10:32 AM",
};

function InfoItem({
  label,
  value,
  isDark,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  isDark: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-[11px] ${isDark ? "text-white/40" : "text-black/45"}`}
      >
        {label}
      </p>

      <div
        className={`mt-1 text-sm font-medium ${
          accent
            ? isDark
              ? "text-[#E8D1AB]"
              : "text-[#8D6F3F]"
            : isDark
              ? "text-white"
              : "text-[#171717]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function DashedSection({
  title,
  children,
  isDark,
}: {
  title: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <section
      className={`border-t border-dashed px-6 py-6 lg:px-7 ${
        isDark ? "border-white/15" : "border-black/10"
      }`}
    >
      <h3
        className={`mb-4 text-sm font-semibold ${
          isDark ? "text-white/90" : "text-[#323232]"
        }`}
      >
        {title}
      </h3>

      {children}
    </section>
  );
}

export default function ReviewAgreementPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useResolvedTheme();

  const [agreement, setAgreement] =
    useState<AgreementDetail>(FALLBACK_AGREEMENT);

const [isAssignmentAccepted, setIsAssignmentAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("beige_selected_agreement");

      if (!raw) {
        setAgreement((current) => ({
          ...current,
          id: params.id,
        }));
        return;
      }

      const selected = JSON.parse(raw) as Partial<AgreementDetail>;

      if (String(selected.id) !== String(params.id)) {
        setAgreement((current) => ({
          ...current,
          id: params.id,
        }));
        return;
      }

      setAgreement({
        ...FALLBACK_AGREEMENT,
        ...selected,
      });
    } catch (error) {
      console.error("Failed to load selected agreement:", error);
    }
  }, [params.id]);

  useEffect(() => {
    const loadAgreement = async () => {
      const response = await getCpShootAgreement(params.id);
      if (response.error || !response.data) {
        toast.error(response.message || "Failed to load agreement.");
        return;
      }
      const data: any = response.data?.data ?? response.data;
      const request = data.shoot_request || {};
      setAgreement({
        ...FALLBACK_AGREEMENT,
        id: data.id || params.id,
        cpName: data.crew_member?.name || "Creative Partner",
        projectName: request.project_name || data.project_name || "—",
        projectId: String(request.project_id || "—"),
        role: data.role || "—",
        version: `v${data.version?.version_number || data.version_number || "1.0"}`,
        status: (String(data.status || "pending").replace(/^./, (value) => value.toUpperCase()) as AgreementStatus),
        sendDate: data.sent_at || data.created_at || "—",
      });
    };
    void loadAgreement();
  }, [params.id]);

  const submitDecision = async (accept: boolean) => {
    setIsSubmitting(true);
    const response = accept ? await acceptCpShootAgreement(params.id) : await rejectCpShootAgreement(params.id);
    setIsSubmitting(false);
    if (response.error) { toast.error(response.message || "Unable to update assignment."); return; }
    toast.success(response.message || (accept ? "Assignment accepted successfully." : "Assignment declined."));
    router.push("/creator/dashboard/request");
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          agreements: "Agreements",
          [String(params.id)]: "Details",
        }}
      />

      <main
        className={`min-h-screen p-4 pb-24 transition-colors duration-300 lg:p-6 lg:px-10 lg:py-8 ${
          isDark ? "bg-transparent" : "bg-[#F3F4F6]"
        }`}
        style={{
          fontFamily: "var(--font-instrument-sans)",
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/creator/dashboard/request")}
          className={`mb-7 inline-flex items-center gap-2 text-sm transition-colors ${
            isDark
              ? "text-white/80 hover:text-white"
              : "text-black/65 hover:text-black"
          }`}
        >
          <ArrowLeft size={19} />
          Back
        </button>

        <div className="mx-auto max-w-5xl">
          <div className="space-y-4">
            <ShootAssignmentAgreement agreement={agreement} isDark={isDark} />
            <div
              className={`mt-4 rounded-xl border p-5 ${
                isDark
                  ? "border-white/10 bg-[#171717]"
                  : "border-black/10 bg-white"
              }`}
            >
              <p
                className={`mb-3 text-xs font-semibold uppercase tracking-wide ${
                  isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"
                }`}
              >
                Assignment Acceptance
              </p>

              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={isAssignmentAccepted}
                  onChange={(e) => setIsAssignmentAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-400 accent-[#E8D1AB]"
                />

                <span
                  className={`text-xs leading-5 ${
                    isDark ? "text-white/85" : "text-[#323232]"
                  }`}
                >
                  By selecting 'Accept Assignment', I confirm that I have reviewed this
                  Beige Sheet and agree to perform this Assignment according to its terms
                  and the Beige Creative Partner Agreement. I understand that accepting
                  this Assignment creates a binding project commitment.
                </span>
              </label>

              <div className="mt-4 flex gap-2.5">
                <button
                  type="button"
                  disabled={!isAssignmentAccepted}
                  onClick={() => void submitDecision(true)}
                  className={`h-[37px] flex-1 rounded-md px-4 text-xs font-medium transition-colors ${
                    isAssignmentAccepted
                      ? "bg-[#167653] text-white hover:bg-[#126346]"
                      : "cursor-not-allowed bg-[#167653]/60 text-white/50"
                  }`}
                >
                  Accept Assignment
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void submitDecision(false)}
                  className="h-[37px] w-[74px] rounded-md bg-[#A83232] px-4 text-xs font-medium text-white hover:bg-[#922C2C]"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

    </>
  );
}



