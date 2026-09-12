"use client";

import React, { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import AgreementEditModal from "@/components/admin/agreements/AgreementEditModal";

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

export default function AgreementDetailPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useResolvedTheme();

  const [agreement, setAgreement] =
    useState<AgreementDetail>(FALLBACK_AGREEMENT);

  const [editModalOpen, setEditModalOpen] = useState(false);

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

  const handleEdit = () => {
    if (agreement.status === "Accepted") {
      setEditModalOpen(true);
      return;
    }

    toast.info(
      "Agreement edit flow can open directly for non-accepted agreements.",
    );
  };

  const handleCreateNewVersion = () => {
    setEditModalOpen(false);

    try {
      window.sessionStorage.setItem(
        "beige_agreement_new_version",
        JSON.stringify({
          agreementId: agreement.id,
          currentVersion: agreement.version,
          createNewVersion: true,
        }),
      );
    } catch (error) {
      console.error("Failed to save new version state:", error);
    }

    toast.success("New agreement version is ready to edit.");
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
          onClick={() => router.push("/admin/agreements")}
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

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                toast.success("Agreement resent to the Creative Partner.")
              }
              className={`h-11 min-w-[112px] rounded-lg border px-5 text-sm font-semibold transition-colors ${
                isDark
                  ? "border-[#3D3D3D] bg-[#202020] text-white hover:bg-[#282828] hover:text-white"
                  : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-[#F4F5F7]"
              }`}
            >
              Resend
            </Button>

            <Button
              type="button"
              onClick={handleEdit}
              className={`h-11 min-w-[128px] rounded-lg px-5 text-sm font-semibold text-black transition-colors ${
                isDark
                  ? "bg-[#E5D5B8] hover:bg-[#D4C3A3]"
                  : "bg-[#E8D1AB] hover:bg-[#D9C19A]"
              }`}
            >
              Edit Agreement
            </Button>
          </div>
        </div>

        <div
          className={`mb-7 border-t border-dashed ${
            isDark ? "border-white/15" : "border-black/10"
          }`}
        />

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

            <article
              className={`overflow-hidden rounded-2xl border ${
                isDark
                  ? "border-[#2E2E2E] bg-[#171717]"
                  : "border-[#E3E3E3] bg-white"
              }`}
            >
              <header
                className={`flex items-start justify-between gap-4 px-6 py-6 lg:px-7 ${
                  isDark ? "bg-[#202020]" : "bg-[#FFFCF6]"
                }`}
              >
                <div>
                  <p
                    className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${
                      isDark ? "text-[#E8D1AB]/75" : "text-[#8D6F3F]"
                    }`}
                  >
                    Shoot Assignment Agreement
                  </p>

                  <h2
                    className={`mt-2 text-2xl font-light ${
                      isDark ? "text-white" : "text-[#171717]"
                    }`}
                  >
                    {agreement.projectName}
                  </h2>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                      isDark
                        ? "bg-white/10 text-white/60"
                        : "bg-black/5 text-black/55"
                    }`}
                  >
                    {agreement.version}
                  </span>

                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClass(
                      agreement.status,
                      isDark,
                    )}`}
                  >
                    ● {agreement.status}
                  </span>
                </div>
              </header>

              <div className="px-6 py-6 lg:px-7">
                <h3
                  className={`mb-4 text-sm font-semibold ${
                    isDark ? "text-white/90" : "text-[#323232]"
                  }`}
                >
                  Project Information
                </h3>

                <div
                  className={`flex flex-wrap gap-x-4 gap-y-2 text-sm ${
                    isDark ? "text-white/55" : "text-black/55"
                  }`}
                >
                  <span>
                    Project Name :{" "}
                    <b className={isDark ? "text-white/80" : "text-black/80"}>
                      {agreement.projectName}
                    </b>
                  </span>

                  <span>|</span>

                  <span>
                    Project ID :{" "}
                    <b className={isDark ? "text-white/80" : "text-black/80"}>
                      PRJ-1024
                    </b>
                  </span>

                  <span>|</span>

                  <span>
                    Assignment ID :{" "}
                    <b className={isDark ? "text-white/80" : "text-black/80"}>
                      {agreement.projectId}
                    </b>
                  </span>
                </div>

                <p
                  className={`mt-2 text-sm ${
                    isDark ? "text-white/55" : "text-black/55"
                  }`}
                >
                  Creative Partner :{" "}
                  <b className={isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"}>
                    {agreement.cpName}
                  </b>
                  <span className="mx-2">|</span>
                  Role :{" "}
                  <b className={isDark ? "text-white/80" : "text-black/80"}>
                    {agreement.role}
                  </b>
                </p>
              </div>

              <DashedSection title="Production Details" isDark={isDark}>
                <div
                  className={`flex flex-wrap gap-x-4 gap-y-2 text-sm ${
                    isDark ? "text-white/55" : "text-black/55"
                  }`}
                >
                  <span>
                    Production Date :{" "}
                    <b className={isDark ? "text-white/85" : "text-black/80"}>
                      15 September, 2026
                    </b>
                  </span>

                  <span>|</span>

                  <span>
                    Location :{" "}
                    <b className={isDark ? "text-white/85" : "text-black/80"}>
                      Los Angeles
                    </b>
                  </span>

                  <span>|</span>

                  <span>
                    Call Time :{" "}
                    <b className={isDark ? "text-white/85" : "text-black/80"}>
                      8:00 AM
                    </b>
                  </span>
                </div>

                <p
                  className={`mt-2 text-sm ${
                    isDark ? "text-white/55" : "text-black/55"
                  }`}
                >
                  Expected End Time / Duration :{" "}
                  <b className={isDark ? "text-white/85" : "text-black/80"}>
                    6:00 PM
                  </b>
                </p>
              </DashedSection>

              <DashedSection title="Compensation" isDark={isDark}>
                <div
                  className={`flex items-center justify-between rounded-xl border px-5 py-4 ${
                    isDark
                      ? "border-[#8A7759] bg-[#2A2722]"
                      : "border-[#D6C19D] bg-[#FFF9EF]"
                  }`}
                >
                  <span
                    className={`text-sm ${
                      isDark ? "text-white/80" : "text-black/70"
                    }`}
                  >
                    Total Compensation
                  </span>

                  <strong
                    className={`text-2xl ${
                      isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"
                    }`}
                  >
                    $2000.00
                  </strong>
                </div>
              </DashedSection>

              {[
                {
                  title: "Scope of Services",
                  text: "Capture photography coverage for the corporate event, including event highlights and speaker sessions.",
                },
                {
                  title: "Equipment Requirements",
                  text: "Sony FX3 or equivalent cinema camera, prime lenses (24mm, 50mm, 85mm), tripod, gimbal stabilizer, audio recording equipment.",
                },
                {
                  title: "Deliverables / Media Transfer",
                  text: "Upload all raw media to the designated Beige folder within 24 hours of shoot completion.",
                },
                {
                  title: "Approved Expenses / Travel",
                  text: "Travel to and from shoot location (up to $75 round trip). Parking at venue. No additional expenses without prior written approval.",
                },
                {
                  title: "Special Instructions",
                  text: "Client requires all crew to sign NDA upon arrival. Business casual attire. Shoot brief will be provided 48 hours before the production date.",
                },
              ].map((item) => (
                <DashedSection
                  key={item.title}
                  title={item.title}
                  isDark={isDark}
                >
                  <div
                    className={`rounded-xl border px-5 py-4 text-sm leading-5 ${
                      isDark
                        ? "border-[#8A7759] bg-[#2A2722] text-white/60"
                        : "border-[#D6C19D] bg-[#FFF9EF] text-black/60"
                    }`}
                  >
                    {item.text}
                  </div>
                </DashedSection>
              ))}

              <div
                className={`border-t border-dashed px-6 py-6 lg:px-7 ${
                  isDark ? "border-white/15" : "border-black/10"
                }`}
              >
                <p
                  className={`text-xs leading-5 ${
                    isDark ? "text-white/40" : "text-black/45"
                  }`}
                >
                  This Shoot Assignment Agreement is issued under the Beige
                  Creative Partner Agreement. By accepting, the Creative Partner
                  confirms their ability to perform the assignment as described
                  and agrees to the terms herein and the governing Beige
                  Creative Partner Agreement.
                </p>

                <div className="mt-5 flex flex-wrap gap-8">
                  <InfoItem
                    label="Beige Sheet Version"
                    value={agreement.version}
                    isDark={isDark}
                  />

                  <InfoItem
                    label="Created"
                    value="15 Sep 2026, 12:20 PM"
                    isDark={isDark}
                  />
                </div>
              </div>
            </article>
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
                      ● {agreement.status}
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
                    text: `Created agreement — ${agreement.version}`,
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

      <AgreementEditModal
        isOpen={editModalOpen}
        creativePartnerName={agreement.cpName}
        onClose={() => setEditModalOpen(false)}
        onCreateNewVersion={handleCreateNewVersion}
      />
    </>
  );
}
