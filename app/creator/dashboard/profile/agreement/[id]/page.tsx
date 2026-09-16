"use client";

import React, { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import Topbar from "@/components/admin/Topbar";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import ShootAssignmentAgreement from "@/components/creator-profile/agreements/ShootAssignmentAgreement";

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

const statusClass = (status: AgreementStatus, isDark: boolean) => {
  if (status === "Accepted") {
    return isDark
      ? "border-emerald-400/20 bg-[#C9F8DD] text-[#169348]"
      : "border-emerald-200 bg-[#D8FBE6] text-[#169348]";
  }

  if (status === "Pending" || status === "Expired") {
    return isDark
      ? "border-amber-300/20 bg-[#FFF1B7] text-[#C56A00]"
      : "border-amber-200 bg-[#FFF1B7] text-[#C56A00]";
  }

  return isDark
    ? "border-red-300/20 bg-[#FFC7C7] text-[#B51F28]"
    : "border-red-200 bg-[#FFD2D2] text-[#B51F28]";
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

export default function CreatorAgreementDetailPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useResolvedTheme();

  const [agreement, setAgreement] =
    useState<AgreementDetail>(FALLBACK_AGREEMENT);

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
          onClick={() =>
            router.push(
              "/creator/dashboard/profile?tab=Documents%20%26%20Agreements",
            )
          }
          className={`mb-7 inline-flex items-center gap-2 text-sm transition-colors ${
            isDark
              ? "text-white/80 hover:text-white"
              : "text-black/65 hover:text-black"
          }`}
        >
          <ArrowLeft size={19} />
          Back
        </button>

        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1
              className={`text-xl font-semibold lg:text-2xl ${
                isDark ? "text-white" : "text-[#171717]"
              }`}
            >
              Agreement Detail
            </h1>

            <span
              className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                isDark
                  ? "bg-[#EDE8DE] text-black"
                  : "bg-[#F2EBDD] text-[#323232]"
              }`}
            >
              {agreement.version}
            </span>

            <span
              className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 text-xs font-semibold ${statusClass(
                agreement.status,
                isDark,
              )}`}
            >
              {agreement.status}
            </span>
          </div>

        </div>


        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-4">
            <section
              className={`grid grid-cols-2 gap-5 rounded-2xl border p-5 md:grid-cols-3 lg:p-6 ${
                isDark
                  ? "border-[#2E2E2E] bg-[#171717]"
                  : "border-[#E3E3E3] bg-white"
              }`}
            >
              <InfoItem
                label="Project"
                value={agreement.projectName}
                isDark={isDark}
              />

              <InfoItem label="CP" value={agreement.cpName} isDark={isDark} />

              <InfoItem label="Role" value={agreement.role} isDark={isDark} />

              <InfoItem
                label="Assignment ID"
                value={agreement.projectId}
                isDark={isDark}
              />

              <InfoItem
                label="Current Version"
                value={agreement.version}
                accent
                isDark={isDark}
              />

              <InfoItem label="Compensation" value="$2000.00" isDark={isDark} />
            </section>

            <ShootAssignmentAgreement agreement={agreement} isDark={isDark} />
          </div>

          <aside className="space-y-4">
            <section
              className={`rounded-2xl border p-5 ${
                isDark
                  ? "border-[#2E2E2E] bg-[#171717]"
                  : "border-[#E3E3E3] bg-white"
              }`}
            >
              <h3
                className={`text-sm font-semibold ${
                  isDark ? "text-white/90" : "text-[#323232]"
                }`}
              >
                Version History
              </h3>

              <div
                className={`mt-4 rounded-xl border p-4 ${
                  isDark
                    ? "border-[#2A2A2A] bg-[#101010]"
                    : "border-[#EAEAEA] bg-[#FAFAFA]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"
                      }`}
                    >
                      {agreement.version}
                    </span>

                    <span
                      className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${statusClass(
                        agreement.status,
                        isDark,
                      )}`}
                    >
                      Ã¢â€”Â {agreement.status}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] ${
                      isDark ? "text-white/35" : "text-black/40"
                    }`}
                  >
                    {agreement.sendDate || "15 Sep 2026, 10:32 AM"}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`text-[11px] ${
                      isDark ? "text-white/35" : "text-black/40"
                    }`}
                  >
                    Compensation
                  </span>

                  <strong
                    className={`text-sm ${
                      isDark ? "text-white" : "text-[#171717]"
                    }`}
                  >
                    $2000.00
                  </strong>
                </div>
              </div>
            </section>

            <section
              className={`rounded-2xl border p-5 ${
                isDark
                  ? "border-[#2E2E2E] bg-[#171717]"
                  : "border-[#E3E3E3] bg-white"
              }`}
            >
              <h3
                className={`text-sm font-semibold ${
                  isDark ? "text-white/90" : "text-[#323232]"
                }`}
              >
                Activity Log
              </h3>

              <div className="mt-5 space-y-5">
                {[
                  {
                    text: `Created agreement Ã¢â‚¬â€ ${agreement.version}`,
                    time: "11:15 AM",
                  },
                  {
                    text: `Agreement sent to ${agreement.cpName}`,
                    time: "10:32 AM",
                  },
                ].map((activity, index) => (
                  <div key={activity.text} className="relative flex gap-3">
                    <div className="relative">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ${
                          isDark
                            ? "bg-[#3A3A3A] text-white/70"
                            : "bg-[#EAEAEA] text-black/60"
                        }`}
                      >
                        A
                      </div>

                      {index === 0 ? (
                        <div
                          className={`absolute left-1/2 top-7 h-[28px] w-px -translate-x-1/2 ${
                            isDark ? "bg-white/20" : "bg-black/15"
                          }`}
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-semibold ${
                              isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"
                            }`}
                          >
                            ADMIN
                          </span>

                          <span className="rounded bg-[#EDE8DE] px-1.5 py-0.5 text-[9px] text-black">
                            {agreement.version}
                          </span>
                        </div>

                        <span
                          className={`text-[9px] ${
                            isDark ? "text-white/35" : "text-black/40"
                          }`}
                        >
                          {activity.time}
                        </span>
                      </div>

                      <p
                        className={`mt-1 text-xs ${
                          isDark ? "text-white/70" : "text-black/65"
                        }`}
                      >
                        {activity.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>

    </>
  );
}

