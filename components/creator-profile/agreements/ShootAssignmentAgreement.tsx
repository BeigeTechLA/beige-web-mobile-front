"use client";

import React from "react";

export type ShootAgreementStatus =
  | "Accepted"
  | "Expired"
  | "Not Accepted"
  | "Pending"
  | "Rejected"
  | "Cancelled";

export type ShootAgreementData = {
  id: number | string;
  cpName: string;
  projectName: string;
  projectId: string;
  role: string;
  version: string;
  status: ShootAgreementStatus;
};

type AgreementStatus = ShootAgreementStatus;

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

export default function ShootAssignmentAgreement({
  agreement,
  isDark,
}: {
  agreement: ShootAgreementData;
  isDark: boolean;
}) {
  return (
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
            Ã¢â€”Â {agreement.status}
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
  );
}

