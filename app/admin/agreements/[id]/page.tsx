"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, History, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import AgreementEditModal from "@/components/admin/agreements/AgreementEditModal";
import {
  agreementRichTextClassName,
  normalizeAgreementHtml,
} from "@/components/admin/agreements/agreementRichText";

type AgreementStatus =
  | "Accepted"
  | "Expired"
  | "Not Accepted"
  | "Pending"
  | "Rejected"
  | "Cancelled";

type AgreementSection = {
  id: string | number;
  title: string;
  content: string;
  isOpen?: boolean;
};

type AgreementCreator = {
  creatorId: number;
  creatorName: string;
  creatorEmail?: string | null;
  role: string;
  rateType?: "flat" | "hourly";
  totalCompensation?: number;
};

type SentShootAgreement = {
  shootId?: string | number;
  bookingId?: number;
  projectName?: string;
  projectCode?: string;
  assignmentId?: string;
  productionDate?: string | null;
  location?: string;
  callTime?: string;
  expectedEndTime?: string;
  compensationMethod?: string;
  creators?: AgreementCreator[];
  mode?: "individual" | "common";
  version?: string;
  status?: AgreementStatus;
  sentAt?: string;
  createdAt?: string;
  commonSections?: AgreementSection[];
  individualSections?: Record<string, AgreementSection[]>;
};

type AgreementDetail = {
  id: number | string;
  agreementId?: number | string;
  shootId?: string | number;
  cpName: string;
  cpInitials?: string;
  cpDate?: string;
  avatarTone?: string;
  projectName: string;
  projectCode?: string;
  projectId: string;
  assignmentId?: string;
  role: string;
  version: string;
  status: AgreementStatus;
  agreementType: "general" | "shoot";
  agreementMode?: "individual" | "common";
  admin?: string;
  sendDate?: string;
  productionDate?: string | null;
  location?: string;
  callTime?: string;
  expectedEndTime?: string;
  compensation?: number;
  createdAt?: string;
  sections?: AgreementSection[];
};

const FALLBACK_SECTIONS: AgreementSection[] = [
  {
    id: "scope",
    title: "Scope of Services",
    content:
      "Capture photography coverage for the corporate event, including event highlights and speaker sessions.",
  },
  {
    id: "equipment",
    title: "Equipment Requirements",
    content:
      "Sony FX3 or equivalent cinema camera, prime lenses (24mm, 50mm, 85mm), tripod, gimbal stabilizer, audio recording equipment.",
  },
  {
    id: "deliverables",
    title: "Deliverables / Media Transfer Requirements",
    content:
      "Upload all raw media to the designated Beige folder within 24 hours of shoot completion.",
  },
  {
    id: "expenses",
    title: "Approved Expenses / Travel",
    content:
      "Travel to and from shoot location (up to $75 round trip). Parking at venue. No additional expenses without prior written approval.",
  },
  {
    id: "instructions",
    title: "Special Instructions",
    content:
      "Client requires all crew to sign NDA upon arrival. Business casual attire. Shoot brief will be provided 48 hours before the production date.",
  },
];

const FALLBACK_AGREEMENT: AgreementDetail = {
  id: 1,
  shootId: 1,
  cpName: "John Doe",
  projectName: "ABC Corporate Shoot",
  projectCode: "PRJ-1024",
  projectId: "ASN-2012",
  assignmentId: "ASN-2012",
  role: "Videographer",
  version: "v1.0",
  status: "Accepted",
  agreementType: "shoot",
  agreementMode: "common",
  admin: "Admin",
  sendDate: "15 Sep 2026, 10:32 AM",
  productionDate: "2026-09-15",
  location: "Los Angeles",
  callTime: "08:00",
  expectedEndTime: "18:00",
  compensation: 2000,
  createdAt: "2026-09-15T12:20:00",
  sections: FALLBACK_SECTIONS,
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

const formatCurrency = (value?: number) =>
  Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string | null) => {
  if (!value) return "Not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateTime = (value?: string) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatTime = (value?: string) => {
  if (!value) return "Not specified";
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
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
    <div className="min-w-0">
      <p className={`text-[11px] ${isDark ? "text-white/40" : "text-black/45"}`}>
        {label}
      </p>
      <div
        className={`mt-1 truncate text-sm font-medium ${
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
      className={`border-t border-dashed px-5 py-6 sm:px-6 lg:px-7 ${
        isDark ? "border-white/15" : "border-black/10"
      }`}
    >
      <h3 className={`mb-4 text-sm font-semibold ${isDark ? "text-white/90" : "text-[#323232]"}`}>
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
  const searchParams = useSearchParams();
  const { isDark } = useResolvedTheme();
  const cameFromShoot = searchParams.get("from") === "shoot";
  const sourceShootId = searchParams.get("shootId");

  const backRoute =
    cameFromShoot && sourceShootId
      ? `/admin/shoots/${encodeURIComponent(sourceShootId)}`
      : "/admin/agreements";

  const versionHistoryRoute =
    cameFromShoot && sourceShootId
      ? `/admin/agreements/${encodeURIComponent(String(params.id))}/version-history?from=shoot&shootId=${encodeURIComponent(sourceShootId)}`
      : `/admin/agreements/${encodeURIComponent(String(params.id))}/version-history`;

  const [agreement, setAgreement] = useState<AgreementDetail>(FALLBACK_AGREEMENT);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    try {
      const selectedRaw = window.sessionStorage.getItem("beige_selected_agreement");
      const selected = selectedRaw
        ? (JSON.parse(selectedRaw) as Partial<AgreementDetail>)
        : null;

      const selectedAgreement =
        selected && String(selected.id) === String(params.id) ? selected : null;

      const shootId =
        selectedAgreement?.shootId ||
        selectedAgreement?.id ||
        params.id;

      const sentRaw = window.sessionStorage.getItem(`beige_shoot_agreement_sent_${shootId}`);
      const sent = sentRaw ? (JSON.parse(sentRaw) as SentShootAgreement) : null;

      if (!sent) {
        setAgreement({
          ...FALLBACK_AGREEMENT,
          ...selectedAgreement,
          id: params.id,
        });
        return;
      }

      const selectedCreator = sent.creators?.find(
        (creator) => creator.creatorName === selectedAgreement?.cpName,
      ) || sent.creators?.[0];

      const sections =
        sent.mode === "common"
          ? sent.commonSections || FALLBACK_SECTIONS
          : selectedCreator
            ? sent.individualSections?.[String(selectedCreator.creatorId)] || FALLBACK_SECTIONS
            : FALLBACK_SECTIONS;

      setAgreement({
        ...FALLBACK_AGREEMENT,
        ...selectedAgreement,
        id: params.id,
        shootId: sent.shootId || shootId,
        cpName: selectedCreator?.creatorName || selectedAgreement?.cpName || FALLBACK_AGREEMENT.cpName,
        projectName: sent.projectName || selectedAgreement?.projectName || FALLBACK_AGREEMENT.projectName,
        projectCode: sent.projectCode || FALLBACK_AGREEMENT.projectCode,
        projectId: sent.assignmentId || selectedAgreement?.projectId || FALLBACK_AGREEMENT.projectId,
        assignmentId: sent.assignmentId || selectedAgreement?.projectId || FALLBACK_AGREEMENT.assignmentId,
        role: selectedCreator?.role || selectedAgreement?.role || FALLBACK_AGREEMENT.role,
        version: sent.version || selectedAgreement?.version || "v1.0",
        status: sent.status || selectedAgreement?.status || "Pending",
        agreementMode: sent.mode || "individual",
        sendDate: sent.sentAt || selectedAgreement?.sendDate,
        productionDate: sent.productionDate,
        location: sent.location,
        callTime: sent.callTime,
        expectedEndTime: sent.expectedEndTime,
        compensation: selectedCreator?.totalCompensation || 0,
        createdAt: sent.createdAt || sent.sentAt,
        sections,
      });
    } catch (error) {
      console.error("Failed to load shoot agreement detail:", error);
      setAgreement((current) => ({ ...current, id: params.id }));
    }
  }, [params.id]);

  const sections = useMemo(
    () => (agreement.sections || []).filter((section) => section.title.trim() || section.content.trim()),
    [agreement.sections],
  );

  const handleEdit = () => {
    if (agreement.status === "Accepted") {
      setEditModalOpen(true);
      return;
    }

    const shootId = agreement.shootId || agreement.id;
    router.push(`/admin/shoots/${shootId}/shoot-agreement?from=agreement&agreementId=${encodeURIComponent(String(agreement.id))}`);
  };

  const handleCreateNewVersion = () => {
    setEditModalOpen(false);

    try {
      window.sessionStorage.setItem(
        "beige_agreement_new_version",
        JSON.stringify({
          agreementId: agreement.id,
          shootId: agreement.shootId,
          currentVersion: agreement.version,
          createNewVersion: true,
        }),
      );
    } catch (error) {
      console.error("Failed to save new version state:", error);
    }

    router.push(`/admin/shoots/${agreement.shootId || agreement.id}/shoot-agreement?from=agreement&agreementId=${encodeURIComponent(String(agreement.id))}`);
  };

  const handleResend = () => {
    try {
      const shootId = agreement.shootId || agreement.id;
      const key = `beige_shoot_agreement_sent_${shootId}`;
      const raw = window.sessionStorage.getItem(key);
      if (raw) {
        const current = JSON.parse(raw) as SentShootAgreement;
        const nextSentAt = new Date().toISOString();
        window.sessionStorage.setItem(
          key,
          JSON.stringify({ ...current, sentAt: nextSentAt, status: "Pending" }),
        );
        setAgreement((currentAgreement) => ({
          ...currentAgreement,
          sendDate: nextSentAt,
          status: "Pending",
        }));
      }
      toast.success("Agreement resent to the Creative Partner.");
    } catch (error) {
      console.error("Failed to resend local shoot agreement:", error);
      toast.error("Unable to resend the agreement.");
    }
  };

  const sentLabel = formatDateTime(agreement.sendDate);
  const createdLabel = formatDateTime(agreement.createdAt || agreement.sendDate);

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          agreements: "Agreements",
          [String(params.id)]: "Details",
        }}
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(versionHistoryRoute)}
            className={`h-11 gap-2 rounded-lg border px-4 text-sm font-medium lg:h-12 lg:px-5 ${
              isDark
                ? "border-[#3D3D3D] bg-[#171717] text-white hover:bg-[#202020] hover:text-white"
                : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-[#F4F5F7]"
            }`}
          >
            <History size={18} />
            <span className="hidden sm:inline">View Version History</span>
          </Button>
        }
      />

      <main
        className={`min-h-screen p-4 pb-24 transition-colors duration-300 lg:px-8 lg:py-8 2xl:px-10 ${
          isDark ? "bg-transparent" : "bg-[#F3F4F6]"
        }`}
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="mx-auto w-full max-w-[1540px]">
          <button
            type="button"
            onClick={() => router.push(backRoute)}
            className={`mb-7 inline-flex items-center gap-2 text-sm transition-colors ${
              isDark ? "text-white/80 hover:text-white" : "text-black/65 hover:text-black"
            }`}
          >
            <ArrowLeft size={19} />
            Back
          </button>

          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className={`text-xl font-semibold lg:text-2xl ${isDark ? "text-white" : "text-[#171717]"}`}>
                Agreement Detail
              </h1>
              <span className="rounded-md bg-[#EDE8DE] px-2.5 py-1 text-[11px] font-medium text-black">
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

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                className={`h-11 min-w-[112px] rounded-lg border px-5 text-sm font-semibold ${
                  isDark
                    ? "border-[#3D3D3D] bg-[#202020] text-white hover:bg-[#282828] hover:text-white"
                    : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-[#F4F5F7]"
                }`}
              >
                <RotateCcw size={15} className="mr-2" />
                Resend
              </Button>

              <Button
                type="button"
                onClick={handleEdit}
                className="h-11 min-w-[128px] rounded-lg bg-[#E8D1AB] px-5 text-sm font-semibold text-black hover:bg-[#D9C19A]"
              >
                Edit Agreement
              </Button>
            </div>
          </div>

          <div className={`mb-7 border-t border-dashed ${isDark ? "border-white/15" : "border-black/10"}`} />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-4">
              <section
                className={`grid grid-cols-2 gap-x-6 gap-y-5 rounded-2xl border p-5 sm:grid-cols-3 lg:p-6 ${
                  isDark ? "border-[#2E2E2E] bg-[#171717]" : "border-[#E3E3E3] bg-white"
                }`}
              >
                <InfoItem label="Project" value={agreement.projectName} isDark={isDark} />
                <InfoItem label="CP" value={agreement.cpName} isDark={isDark} />
                <InfoItem label="Role" value={agreement.role} isDark={isDark} />
                <InfoItem label="Assignment ID" value={agreement.assignmentId || agreement.projectId} isDark={isDark} />
                <InfoItem label="Current Version" value={agreement.version} accent isDark={isDark} />
                <InfoItem label="Compensation" value={formatCurrency(agreement.compensation)} isDark={isDark} />
              </section>

              <article
                className={`overflow-hidden rounded-2xl border ${
                  isDark ? "border-[#2E2E2E] bg-[#171717]" : "border-[#E3E3E3] bg-white"
                }`}
              >
                <header
                  className={`flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-7 ${
                    isDark ? "bg-[#202020]" : "bg-[#FFFCF6]"
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${isDark ? "text-[#E8D1AB]/80" : "text-[#8D6F3F]"}`}>
                      Shoot Assignment Agreement
                    </p>
                    <h2 className={`mt-2 truncate text-2xl font-light ${isDark ? "text-white" : "text-[#171717]"}`}>
                      {agreement.projectName}
                    </h2>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    <span className={`rounded-md px-2.5 py-1 text-[10px] font-medium ${isDark ? "bg-white/10 text-white/60" : "bg-black/5 text-black/55"}`}>
                      {agreement.version}
                    </span>
                    <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold text-blue-300">
                      ● {agreement.agreementMode === "common" ? "Common Agreement" : "Individual Agreement"}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClass(agreement.status, isDark)}`}>
                      ● {agreement.status}
                    </span>
                  </div>
                </header>

                <div className="px-5 py-6 sm:px-6 lg:px-7">
                  <h3 className={`mb-4 text-sm font-semibold ${isDark ? "text-white/90" : "text-[#323232]"}`}>
                    Project Information
                  </h3>

                  <div className={`grid gap-3 text-sm sm:grid-cols-2 ${isDark ? "text-white/55" : "text-black/55"}`}>
                    <p>Project Name : <b className={isDark ? "text-white/80" : "text-black/80"}>{agreement.projectName}</b></p>
                    <p>Project ID : <b className={isDark ? "text-white/80" : "text-black/80"}>{agreement.projectCode || `PRJ-${agreement.id}`}</b></p>
                    <p>Assignment ID : <b className={isDark ? "text-white/80" : "text-black/80"}>{agreement.assignmentId || agreement.projectId}</b></p>
                    <p>Creative Partner : <b className={isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"}>{agreement.cpName}</b></p>
                    <p>Role : <b className={isDark ? "text-white/80" : "text-black/80"}>{agreement.role}</b></p>
                  </div>
                </div>

                <DashedSection title="Production Details" isDark={isDark}>
                  <div className={`grid gap-3 text-sm sm:grid-cols-2 ${isDark ? "text-white/55" : "text-black/55"}`}>
                    <p>Production Date : <b className={isDark ? "text-white/85" : "text-black/80"}>{formatDate(agreement.productionDate)}</b></p>
                    <p>Location : <b className={isDark ? "text-white/85" : "text-black/80"}>{agreement.location || "Not specified"}</b></p>
                    <p>Call Time : <b className={isDark ? "text-white/85" : "text-black/80"}>{formatTime(agreement.callTime)}</b></p>
                    <p>Expected End Time / Duration : <b className={isDark ? "text-white/85" : "text-black/80"}>{formatTime(agreement.expectedEndTime)}</b></p>
                  </div>
                </DashedSection>

                <DashedSection title="Compensation" isDark={isDark}>
                  <div className={`flex flex-col gap-3 rounded-xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
                    isDark ? "border-[#8A7759] bg-[#2A2722]" : "border-[#D6C19D] bg-[#FFF9EF]"
                  }`}>
                    <span className={`text-sm ${isDark ? "text-white/80" : "text-black/70"}`}>
                      Total Compensation
                    </span>
                    <strong className={`text-2xl ${isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"}`}>
                      {formatCurrency(agreement.compensation)}
                    </strong>
                  </div>
                </DashedSection>

                {sections.map((section) => (
                  <DashedSection key={section.id} title={section.title || "Untitled Section"} isDark={isDark}>
                    <div
                      className={`rounded-xl border px-5 py-4 text-sm leading-6 ${agreementRichTextClassName} ${
                        isDark
                          ? "border-[#6A5B45] bg-[#24211D] text-white/65"
                          : "border-[#D6C19D] bg-[#FFF9EF] text-black/65"
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: normalizeAgreementHtml(section.content || "No content added."),
                      }}
                    />
                  </DashedSection>
                ))}

                <div className={`border-t border-dashed px-5 py-6 sm:px-6 lg:px-7 ${isDark ? "border-white/15" : "border-black/10"}`}>
                  <p className={`text-xs leading-5 ${isDark ? "text-white/40" : "text-black/45"}`}>
                    This Shoot Assignment Agreement is issued under the Beige Creative Partner Agreement. By accepting,
                    the Creative Partner confirms their ability to perform the assignment as described and agrees to the
                    terms herein and the governing Beige Creative Partner Agreement. Both parties acknowledge that acceptance
                    creates a binding commitment for the specified production.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-x-10 gap-y-4">
                    <InfoItem label="Beige Sheet Version" value={agreement.version} isDark={isDark} />
                    <InfoItem label="Created" value={createdLabel} isDark={isDark} />
                  </div>
                </div>
              </article>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
              <section className={`rounded-2xl border p-5 ${isDark ? "border-[#2E2E2E] bg-[#171717]" : "border-[#E3E3E3] bg-white"}`}>
                <h3 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-[#323232]"}`}>
                  Version History
                </h3>

                <div className={`mt-4 rounded-xl border p-4 ${isDark ? "border-[#2A2A2A] bg-[#101010]" : "border-[#EAEAEA] bg-[#FAFAFA]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"}`}>
                        {agreement.version}
                      </span>
                      <span className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${statusClass(agreement.status, isDark)}`}>
                        ● {agreement.status}
                      </span>
                    </div>
                    <span className={`text-right text-[10px] ${isDark ? "text-white/35" : "text-black/40"}`}>
                      {sentLabel}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className={`text-[11px] ${isDark ? "text-white/35" : "text-black/40"}`}>Compensation</span>
                    <strong className={`text-sm ${isDark ? "text-white" : "text-[#171717]"}`}>
                      {formatCurrency(agreement.compensation)}
                    </strong>
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      const previewId =
                        agreement.agreementType === "general"
                          ? agreement.agreementId || params.id
                          : agreement.id;
                      router.push(
                        `/admin/agreements/details?id=${encodeURIComponent(String(previewId))}`,
                      );
                    }}
                    className="mt-4 h-10 w-full gap-2 rounded-lg bg-[#E8D1AB] text-xs font-semibold text-black hover:bg-[#D9C19A]"
                  >
                    <Eye size={14} />
                    Preview Agreement
                  </Button>
                </div>
              </section>

              <section className={`rounded-2xl border p-5 ${isDark ? "border-[#2E2E2E] bg-[#171717]" : "border-[#E3E3E3] bg-white"}`}>
                <h3 className={`text-sm font-semibold ${isDark ? "text-white/90" : "text-[#323232]"}`}>
                  Activity Log
                </h3>

                <div className="mt-5 space-y-5">
                  {[
                    { text: `Created agreement — ${agreement.version}`, time: createdLabel },
                    { text: `Agreement sent to ${agreement.cpName}`, time: sentLabel },
                  ].map((activity, index) => (
                    <div key={`${activity.text}-${index}`} className="relative flex gap-3">
                      <div className="relative shrink-0">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ${isDark ? "bg-[#3A3A3A] text-white/70" : "bg-[#EAEAEA] text-black/60"}`}>
                          A
                        </div>
                        {index === 0 ? (
                          <div className={`absolute left-1/2 top-7 h-[32px] w-px -translate-x-1/2 ${isDark ? "bg-white/20" : "bg-black/15"}`} />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"}`}>ADMIN</span>
                            <span className="rounded bg-[#EDE8DE] px-1.5 py-0.5 text-[9px] text-black">{agreement.version}</span>
                          </div>
                          <span className={`text-right text-[9px] leading-4 ${isDark ? "text-white/35" : "text-black/40"}`}>{activity.time}</span>
                        </div>
                        <p className={`mt-1 text-xs leading-5 ${isDark ? "text-white/70" : "text-black/65"}`}>{activity.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
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
