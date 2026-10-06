"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import {
  DEFAULT_GENERAL_AGREEMENT,
  getLocalGeneralAgreement,
  getLocalGeneralAgreementVersion,
  setLocalGeneralAgreementActive,
  type LocalGeneralAgreement,
} from "@/components/admin/agreements/localAgreementStore";
import {
  agreementRichTextClassName,
  normalizeAgreementHtml,
} from "@/components/admin/agreements/agreementRichText";

const formatDate = (value?: string) => {
  if (!value) return "September 1, 2026";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function AgreementDetailsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useResolvedTheme();
  const agreementId = searchParams.get("id");
  const previewVersion = searchParams.get("version");

  const [agreement, setAgreement] = useState<LocalGeneralAgreement>(DEFAULT_GENERAL_AGREEMENT);

  useEffect(() => {
    const current = getLocalGeneralAgreement(agreementId);
    if (previewVersion && agreementId) {
      const snapshot = getLocalGeneralAgreementVersion(agreementId, previewVersion);
      if (snapshot) {
        setAgreement({
          ...current,
          agreementName: snapshot.agreementName,
          agreementTitle: snapshot.agreementTitle,
          description: snapshot.description,
          effectiveDate: snapshot.effectiveDate,
          currentVersion: snapshot.version,
          sections: snapshot.sections,
          updatedAt: snapshot.createdAt,
        });
        return;
      }
    }
    setAgreement(current);
  }, [agreementId, previewVersion]);

  const sections = useMemo(
    () => agreement.sections.filter((section) => section.title.trim() || section.content.trim()),
    [agreement.sections],
  );

  const openVersionHistory = () => {
    const historyId = agreementId || agreement.id;
    try {
      window.sessionStorage.setItem(
        "beige_selected_agreement",
        JSON.stringify({
          id: historyId,
          cpName: "Creative Partner",
          projectName: agreement.agreementName,
          projectId: "GENERAL",
          role: "General",
          version: agreement.currentVersion,
          status: "Accepted",
          agreementType: "general",
          admin: "Admin",
          sendDate: new Date(agreement.updatedAt).toLocaleString("en-US"),
        }),
      );
    } catch (error) {
      console.error("Failed to prepare local agreement history:", error);
    }
    router.push(`/admin/agreements/${encodeURIComponent(historyId)}/version-history`);
  };

  const handleSaveAgreement = () => {
    const saved = setLocalGeneralAgreementActive(agreement.id);
    if (!saved) {
      toast.error("Unable to save this agreement.");
      return;
    }
    toast.success("Agreement saved and set as the active general agreement.");
  };

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{ agreements: "Agreements", details: "Details" }}
        actions={
          <div className="flex items-center gap-2 lg:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={openVersionHistory}
              className={`h-12 gap-2 rounded-lg border px-5 text-sm font-medium ${
                isDark
                  ? "border-[#3D3D3D] bg-[#171717] text-white hover:bg-[#202020] hover:text-white"
                  : "border-[#E3E3E3] bg-white text-[#323232]"
              }`}
            >
              <History size={18} />
              <span className="hidden sm:inline">View Version History</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/agreements/create-agreement?edit=${encodeURIComponent(agreement.id)}`)}
              disabled={Boolean(previewVersion)}
              className={`h-12 rounded-lg border px-5 text-sm font-medium ${
                isDark
                  ? "border-[#3D3D3D] bg-[#171717] text-white hover:bg-[#202020] hover:text-white"
                  : "border-[#E3E3E3] bg-white text-[#323232]"
              }`}
            >
              Edit Agreement
            </Button>

            <Button
              type="button"
              onClick={handleSaveAgreement}
              disabled={Boolean(previewVersion)}
              className="h-12 rounded-lg bg-[#E8D1AB] px-7 text-sm font-semibold text-black hover:bg-[#D9C19A] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Agreement
            </Button>
          </div>
        }
      />

      <main
        className={`min-h-screen p-4 pb-24 lg:px-10 lg:py-8 ${isDark ? "bg-transparent" : "bg-[#F3F4F6]"}`}
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <button
          type="button"
          onClick={() => router.push("/admin/agreements")}
          className={`mb-7 inline-flex items-center gap-2 text-sm ${isDark ? "text-white/80 hover:text-white" : "text-black/65 hover:text-black"}`}
        >
          <ArrowLeft size={19} /> Back
        </button>

        <article className={`overflow-hidden rounded-2xl border ${isDark ? "border-[#2D2D2D] bg-[#171717]" : "border-[#E3E3E3] bg-white"}`}>
          <header className={`flex flex-col gap-5 px-6 py-7 md:flex-row md:items-center md:justify-between lg:px-8 ${isDark ? "bg-[#202020]" : "bg-[#FFFCF6]"}`}>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.08em] ${isDark ? "text-[#E8D1AB]/85" : "text-[#8D6F3F]"}`}>General Agreement</p>
              <h1 className={`mt-3 text-2xl font-light uppercase leading-tight tracking-[-0.02em] md:text-[32px] ${isDark ? "text-white" : "text-[#171717]"}`}>
                {agreement.agreementTitle}
              </h1>
            </div>

            <div className="shrink-0 text-left md:text-right">
              <span className="inline-flex rounded-lg bg-[#E8D1AB] px-3 py-1.5 text-xs font-medium text-black">
                Version {agreement.currentVersion.replace(/^v/i, "")}
              </span>
              <p className={`mt-3 text-[11px] ${isDark ? "text-white/75" : "text-black/55"}`}>
                Effective {formatDate(agreement.effectiveDate)}
              </p>
              {previewVersion ? (
                <p className="mt-1 text-[10px] font-medium text-[#E8D1AB]">Historical preview</p>
              ) : null}
            </div>
          </header>

          <div className="px-6 py-7 lg:px-8 lg:py-8">
            {agreement.description.trim() ? (
              <div className={`whitespace-pre-line text-[15px] leading-6 ${isDark ? "text-white/65" : "text-black/65"}`}>
                {agreement.description}
              </div>
            ) : null}

            {sections.map((section, index) => (
              <section key={section.id} className={`mt-7 border-t pt-7 ${isDark ? "border-[#464646]" : "border-[#DDDDDD]"}`}>
                <h2 className={`text-xl font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"}`}>
                  {index + 1}. {section.title || "Untitled Section"}
                </h2>
                <div
                  className={`mt-3 text-[15px] leading-6 ${agreementRichTextClassName} ${isDark ? "text-white/65" : "text-black/65"}`}
                  dangerouslySetInnerHTML={{
                    __html: normalizeAgreementHtml(section.content || "No content added."),
                  }}
                />
              </section>
            ))}
          </div>
        </article>
      </main>
    </>
  );
}
