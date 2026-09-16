"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

type AgreementSection = {
  id: number;
  title: string;
  content: string;
};

type AgreementDraft = {
  agreementTitle?: string;
  description?: string;
  effectiveDate?: string;
  sections?: AgreementSection[];
  acceptance?: string;
};

const STORAGE_KEY = "beige_general_agreement_draft";

const DEFAULT_DRAFT: AgreementDraft = {
  agreementTitle: "BEIGE CREATIVE PARTNER AGREEMENT",
  description:
    "This Creative Partner Agreement (the “Agreement”) governs participation as a creative professional on the Beige platform and the performance of photography, videography, production, post-production, livestreaming, editing, audio, and other creative or production services arranged through Beige.\n\nThis Agreement is between Beige Corporation, a Delaware corporation (“Beige,” “we,” “us,” or “our”), and the individual or entity accepting this Agreement (“Creative Partner,” “you,” or “your”).\n\nBy creating a Creative Partner account and affirmatively accepting this Agreement, you acknowledge that you have read, understood, and agree to be bound by it.",
  effectiveDate: "2026-09-01",
  sections: [
    {
      id: 1,
      title: "Creative Partner Relationship",
      content:
        "Beige operates a technology platform and production network through which independent creative professionals may receive opportunities to provide services for Beige and Beige clients.\n\nYou participate as an independent contractor and not as an employee, agent, partner, joint venturer, or representative of Beige.\n\nSubject to applicable law, you are responsible for your own taxes, equipment, business expenses, licenses, registrations, insurance, and other obligations associated with operating as an independent professional.\n\nNothing in this Agreement guarantees any minimum number of assignments, minimum compensation, minimum hours, or continuing relationship with Beige.\n\nExcept as expressly authorized by Beige in writing, you have no authority to enter into agreements, modify project terms, provide refunds or credits, make commitments, incur obligations, or otherwise bind Beige.",
    },
    {
      id: 2,
      title: "Project Assignments and Beige Sheets",
      content:
        "Beige may offer individual projects or assignments to you from time to time (each, an “Assignment”).\n\nEach Assignment will be documented through a digital project assignment, production sheet, deal sheet, booking record, or similar electronic record issued through Beige (a “Beige Sheet”).\n\nA Beige Sheet may include:\n•  Project name and identification number;\n•  Role;\n•  Production date;\n•  Location;\n•  Call time;\n•  Anticipated end time or duration;\n•  Compensation;\n•  Scope of services;\n•  Equipment requirements;\n•  Production requirements;\n•  Deliverables and media-transfer requirements;\n•  Approved expenses or travel arrangements;\n•  Special instructions; and\n•  Other project-specific terms.\n\nYou may accept or decline an offered Assignment.\n\nYou are not obligated to perform an Assignment merely because it is offered to you.",
    },
  ],
  acceptance:
    "When you select “Accept Assignment,” “Accept,” “Confirm,” or another electronic acceptance mechanism associated with a Beige Sheet, you enter into a binding commitment to perform that Assignment according to the Beige Sheet and this Agreement.\n\nEvery accepted Beige Sheet is incorporated into and forms part of this Agreement.\n\nIf an accepted Beige Sheet conflicts with this Agreement regarding a project-specific business term, including compensation, date, location, hours, equipment, or scope, the Beige Sheet controls solely with respect to that project-specific term.\n\nThis Agreement otherwise controls.",
};

function formatEffectiveDate(value?: string) {
  if (!value) return "September 1, 2026";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);

  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function CreatorAgreementPage() {
  const router = useRouter();
  const { isDark } = useResolvedTheme();
  const [draft, setDraft] = useState<AgreementDraft>(DEFAULT_DRAFT);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as AgreementDraft;
      setDraft({
        ...DEFAULT_DRAFT,
        ...parsed,
        sections:
          Array.isArray(parsed.sections) && parsed.sections.length > 0
            ? parsed.sections
            : DEFAULT_DRAFT.sections,
      });
    } catch (error) {
      console.error("Failed to load agreement draft:", error);
    }
  }, []);

  const sections = useMemo(
    () =>
      (draft.sections || []).filter(
        (section) => section.title?.trim() || section.content?.trim(),
      ),
    [draft.sections],
  );

  return (
    <main
      className={`min-h-screen p-4 pb-24 transition-colors duration-300 lg:p-6 lg:px-10 lg:py-8 ${
        isDark ? "bg-transparent" : "bg-[#F3F4F6]"
      }`}
      style={{ fontFamily: "var(--font-instrument-sans)" }}
    >
      <button
        type="button"
        onClick={() => router.push("/creator/dashboard/profile")}
        className={`mb-7 inline-flex items-center gap-2 text-sm transition-colors ${
          isDark ? "text-white/80 hover:text-white" : "text-black/65 hover:text-black"
        }`}
      >
        <ArrowLeft size={19} />
        Back
      </button>

      <article
        className={`mx-auto overflow-hidden rounded-2xl border transition-colors ${
          isDark ? "border-[#2D2D2D] bg-[#171717]" : "border-[#E3E3E3] bg-white"
        }`}
      >
        <header
          className={`flex flex-col gap-5 px-6 py-7 md:flex-row md:items-center md:justify-between lg:px-8 ${
            isDark ? "bg-[#202020]" : "bg-[#FFFCF6]"
          }`}
        >
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.08em] ${isDark ? "text-[#E8D1AB]/85" : "text-[#8D6F3F]"}`}>
              General Agreement
            </p>
            <h1 className={`mt-3 text-2xl font-light uppercase leading-tight tracking-[-0.02em] md:text-[32px] ${isDark ? "text-white" : "text-[#171717]"}`}>
              {draft.agreementTitle || DEFAULT_DRAFT.agreementTitle}
            </h1>
          </div>

          <div className="shrink-0 text-left md:text-right">
            <span className="inline-flex rounded-lg bg-[#E8D1AB] px-3 py-1.5 text-xs font-medium text-black">
              Version 1.0
            </span>
            <p className={`mt-3 text-[11px] ${isDark ? "text-white/75" : "text-black/55"}`}>
              Effective {formatEffectiveDate(draft.effectiveDate)}
            </p>
          </div>
        </header>

        <div className="px-6 py-7 lg:px-8 lg:py-8">
          {draft.description?.trim() ? (
            <div className={`whitespace-pre-line text-[15px] leading-6 ${isDark ? "text-white/65" : "text-black/65"}`}>
              {draft.description}
            </div>
          ) : null}

          {sections.map((section, index) => (
            <section key={section.id} className={`mt-7 border-t pt-7 ${isDark ? "border-[#464646]" : "border-[#DDDDDD]"}`}>
              <h2 className={`text-xl font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"}`}>
                {index + 1}. {section.title || "Untitled Section"}
              </h2>
              <div className={`mt-3 whitespace-pre-line text-[15px] leading-6 ${isDark ? "text-white/65" : "text-black/65"}`}>
                {section.content || "No content added."}
              </div>
            </section>
          ))}

          {draft.acceptance?.trim() ? (
            <section className="mt-7">
              <h2 className={`text-md font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"}`}>
                Acceptance
              </h2>
              <div className={`mt-3 whitespace-pre-line text-[15px] leading-6 ${isDark ? "text-white/65" : "text-black/65"}`}>
                {draft.acceptance}
              </div>
            </section>
          ) : null}
        </div>

        <div
          className={`border-t px-6 py-6 lg:px-8 ${
            isDark ? "border-[#2D2D2D] bg-[#1B1B1B]" : "border-[#E3E3E3] bg-[#FAFAFA]"
          }`}
        >
          <p className={`text-sm uppercase font-bold  ${isDark ? "text-white/85" : "text-black/80"}`}>
            Please review and accept Beige&apos;s Creative Partner Agreement to start receiving and working on assignments.
          </p>

          <label
            className={`mt-4 flex cursor-pointer items-center gap-2 text-sm ${
              isDark ? "text-white/70" : "text-black/65"
            }`}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4 w-4 rounded border-[#B3B3B3] accent-[#E8D1AB]"
            />
            I have read and agree to the terms and conditions
          </label>

          <button
            type="button"
            disabled={!agreed}
            onClick={() => {
              // TODO: hook up acceptance submission
              router.push("/creator/dashboard/profile");
            }}
            className={`mt-4 w-full rounded-lg py-3 text-sm font-medium transition-colors ${
              agreed
                ? "bg-[#E8D1AB] text-black hover:bg-[#DEC194]"
                : "cursor-not-allowed bg-[#E8D1AB]/50 text-black/50"
            }`}
          >
            Accept &amp; Continue
          </button>

          
        </div>
      </article>
    </main>
  );
}
