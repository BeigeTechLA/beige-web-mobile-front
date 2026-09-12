"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, History, Pencil, Send } from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import SuccessModal from "@/components/admin/agreements/SuccessModal";

type AgreementSection = {
  id: number;
  title: string;
  description?: string;
  content: string;
  isOpen?: boolean;
};

type AgreementDraft = {
  agreementName?: string;
  agreementTitle?: string;
  description?: string;
  effectiveDate?: string;
  sections?: AgreementSection[];
};

const STORAGE_KEY = "beige_general_agreement_draft";

const DEFAULT_DRAFT: AgreementDraft = {
  agreementName: "General Agreement",
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
        "Beige may offer individual projects or assignments to you from time to time (each, an “Assignment”).\n\nEach Assignment will be documented through a digital project assignment, production sheet, deal sheet, booking record, or similar electronic record issued through Beige (a “Beige Sheet”).",
    },
  ],
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

export default function AgreementDetailsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useResolvedTheme();

  const [draft, setDraft] = useState<AgreementDraft>(DEFAULT_DRAFT);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sendSuccessOpen, setSendSuccessOpen] = useState(false);

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

  useEffect(() => {
    if (!sendSuccessOpen) return;

    const redirectTimer = window.setTimeout(() => {
      setSendSuccessOpen(false);
      router.push("/admin/agreements");
    }, 2500);

    return () => {
      window.clearTimeout(redirectTimer);
    };
  }, [sendSuccessOpen, router]);

  const handleSendAgreement = () => {
    setSendSuccessOpen(true);
  };

  const handleSuccessClose = () => {
    setSendSuccessOpen(false);
    router.push("/admin/agreements");
  };

  const title =
    draft.agreementTitle?.trim() || DEFAULT_DRAFT.agreementTitle || "";

  const effectiveDate = formatEffectiveDate(draft.effectiveDate);

  const sections = useMemo(
    () =>
      (draft.sections || []).filter(
        (section) => section.title?.trim() || section.content?.trim(),
      ),
    [draft.sections],
  );

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          agreements: "Agreements",
          details: "Details",
        }}
        actions={
          <div className="flex items-center gap-2 lg:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setHistoryOpen(true)}
              className={`h-11 gap-2 rounded-lg border px-4 text-sm font-medium transition-colors lg:h-12 lg:px-5 ${
                isDark
                  ? "border-[#3D3D3D] bg-[#171717] text-white hover:bg-[#202020] hover:text-white"
                  : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-[#F4F5F7] hover:text-black"
              }`}
            >
              <History size={18} />
              <span className="hidden sm:inline">View Version History</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/agreements/create?edit=1")}
              className={`h-11 gap-2 rounded-lg border px-4 text-sm font-medium transition-colors lg:h-12 lg:px-5 ${
                isDark
                  ? "border-[#3D3D3D] bg-[#171717] text-white hover:bg-[#202020] hover:text-white"
                  : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-[#F4F5F7] hover:text-black"
              }`}
            >
              <Pencil size={16} className="sm:hidden" />
              <span className="hidden sm:inline">Edit Agreement</span>
            </Button>

            <Button
              type="button"
              onClick={handleSendAgreement}
              className={`h-11 gap-2 rounded-lg px-4 text-sm font-semibold text-black transition-colors lg:h-12 lg:px-6 ${
                isDark
                  ? "bg-[#E5D5B8] hover:bg-[#D4C3A3]"
                  : "bg-[#E8D1AB] hover:bg-[#D9C19A]"
              }`}
            >
              <Send size={17} />
              <span className="hidden sm:inline">Send Agreement to CP</span>
              <span className="sm:hidden">Send</span>
            </Button>
          </div>
        }
      />

      <main
        className={`min-h-screen p-4 pb-24 transition-colors duration-300 lg:p-6 lg:px-10 lg:py-8 ${
          isDark ? "bg-transparent" : "bg-[#F3F4F6]"
        }`}
        style={{ fontFamily: "var(--font-instrument-sans)" }}
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

        <article
          className={`mx-auto overflow-hidden rounded-2xl border transition-colors ${
            isDark
              ? "border-[#2D2D2D] bg-[#171717]"
              : "border-[#E3E3E3] bg-white"
          }`}
        >
          <header
            className={`flex flex-col gap-5 px-6 py-7 md:flex-row md:items-center md:justify-between lg:px-8 ${
              isDark ? "bg-[#202020]" : "bg-[#FFFCF6]"
            }`}
          >
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-[0.08em] ${
                  isDark ? "text-[#E8D1AB]/85" : "text-[#8D6F3F]"
                }`}
              >
                General Agreement
              </p>

              <h1
                className={`mt-3 text-2xl font-light uppercase leading-tight tracking-[-0.02em] md:text-[32px] ${
                  isDark ? "text-white" : "text-[#171717]"
                }`}
              >
                {title}
              </h1>
            </div>

            <div className="shrink-0 text-left md:text-right">
              <span className="inline-flex rounded-lg bg-[#E8D1AB] px-3 py-1.5 text-xs font-medium text-black">
                Version 1.0
              </span>

              <p
                className={`mt-3 text-[11px] ${
                  isDark ? "text-white/75" : "text-black/55"
                }`}
              >
                Effective {effectiveDate}
              </p>
            </div>
          </header>

          <div className="px-6 py-7 lg:px-8 lg:py-8">
            {draft.description?.trim() ? (
              <div
                className={`whitespace-pre-line text-[15px] leading-6 ${
                  isDark ? "text-white/65" : "text-black/65"
                }`}
              >
                {draft.description}
              </div>
            ) : null}

            {sections.map((section, index) => (
              <section
                key={section.id}
                className={`mt-7 border-t pt-7 ${
                  isDark ? "border-[#464646]" : "border-[#DDDDDD]"
                }`}
              >
                <h2
                  className={`text-xl font-medium ${
                    isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"
                  }`}
                >
                  {index + 1}. {section.title || "Untitled Section"}
                </h2>

                <div
                  className={`mt-3 whitespace-pre-line text-[15px] leading-6 ${
                    isDark ? "text-white/65" : "text-black/65"
                  }`}
                >
                  {section.content || "No content added."}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent
          className={`max-w-lg border ${
            isDark
              ? "border-[#3D3D3D] bg-[#0A0A0A] text-white"
              : "border-[#E3E3E3] bg-[#FFFCF6] text-[#323232]"
          }`}
        >
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>

          <div
            className={`rounded-xl border p-4 ${
              isDark
                ? "border-[#3D3D3D] bg-[#171717]"
                : "border-[#E3E3E3] bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Version 1.0</p>
                <p
                  className={`mt-1 text-xs ${
                    isDark ? "text-white/45" : "text-black/45"
                  }`}
                >
                  Current agreement version
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  isDark
                    ? "bg-[#E8D1AB]/10 text-[#E8D1AB]"
                    : "bg-[#E8D1AB]/35 text-[#7D6235]"
                }`}
              >
                Current
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SuccessModal
        isOpen={sendSuccessOpen}
        onSubmit={handleSuccessClose}
        title="General Agreement Sent Successfully"
        subtext="The general agreement has been sent to the CP for review and acceptance."
        buttonText=""
      />
    </>
  );
}
