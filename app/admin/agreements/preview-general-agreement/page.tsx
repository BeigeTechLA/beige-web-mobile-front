"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History } from "lucide-react";
import { useTheme } from "next-themes";
import Topbar from "@/components/admin/Topbar";

interface Section {
  id: string;
  title: string;
  content: string | string[];
}

export default function AdminGeneralAgreementPreviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Form Metadata State
  const [agreementType] = useState("GENERAL AGREEMENT");
  const [agreementTitle] = useState("BEIGE CREATIVE PARTNER AGREEMENT");
  const [version] = useState("Version 1.0");
  const [effectiveDate] = useState("Effective September 1, 2026");

  // Lead Paragraphs State
  const [leadParagraphs] = useState<string[]>([
    'This Creative Partner Agreement (the "Agreement") governs participation as a creative professional on the Beige platform and the performance of photography, videography, production, post-production, livestreaming, editing, audio, and other creative or production services arranged through Beige.',
    'This Agreement is between Beige Corporation, a Delaware corporation ("Beige," "we," "us," or "our"), and the individual or entity accepting this Agreement ("Creative Partner," "you," or "your").',
    "By creating a Creative Partner account and affirmatively accepting this Agreement, you acknowledge that you have read, understood, and agree to be bound by it.",
  ]);

  // Sections State
  const [sections] = useState<Section[]>([
    {
      id: "1",
      title: "1. Creative Partner Relationship",
      content: [
        "Beige operates a technology platform and production network through which independent creative professionals may receive opportunities to provide services for Beige and Beige clients.",
        "You participate as an independent contractor and not as an employee, agent, partner, joint venturer, or representative of Beige.",
        "Subject to applicable law, you are responsible for your own taxes, equipment, business expenses, licenses, registrations, insurance, and other obligations associated with operating as an independent professional.",
        "Nothing in this Agreement guarantees any minimum number of assignments, minimum compensation, minimum hours, or continuing relationship with Beige.",
        "Except as expressly authorized by Beige in writing, you have no authority to enter into agreements, modify project terms, provide refunds or credits, make commitments, incur obligations, or otherwise bind Beige.",
      ],
    },
    {
      id: "2",
      title: "2. Project Assignments and Beige Sheets",
      content: [
        'Beige may offer individual projects or assignments to you from time to time (each, an "Assignment").',
        'Each Assignment will be documented through a digital project assignment, production sheet, deal sheet, booking record, or similar electronic record issued through Beige (a "Beige Sheet").',
      ],
    },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  if (!mounted) return null;

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <>
            <Button
              onClick={() => router.push("/admin/agreements/history")}
              title="View Version History"
              variant="outline"
              className={`rounded-lg h-12 px-4 lg:px-7 gap-2 transition-all ${isDark
                ? "bg-[#202020] border-white/10 text-white hover:bg-[#2C2C2C]"
                : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
                }`}
            >
              <History size={24} />
              View Version History
            </Button>
            <Button
              onClick={() => router.push("/admin/agreements")}
              title="Edit Agreement"
              variant="outline"
              className={`rounded-lg h-12 px-4 lg:px-7 gap-2 transition-all ${isDark
                ? "bg-[#202020] border-white/10 text-white hover:bg-[#2C2C2C]"
                : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
                }`}
            >
              Edit Agreement
            </Button>
            <Button
              onClick={() => router.push("/admin/agreements")}
              title="Save Agreement"
              className={`h-12 px-4 lg:px-7 font-medium transition-colors ${isDark
                ? "bg-[#E5D5B8] text-black hover:bg-[#D4C3A3]"
                : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"
                }`}
            >
              Save Agreement
            </Button>
          </>
        }
      />

      <div className={`min-h-screen p-4 lg:p-6 lg:px-10 lg:py-9 font-sans pb-40 transition-colors space-y-4 lg:space-y-9 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F3F4F6] text-black"}`}>
        <Button
          onClick={() => router.back()}
          className={`transition-colors flex items-center gap-2 mb-5 p-0 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {/* Document Card Container */}
        <div
          className={`border rounded-2xl transition-colors max-w-6xl mx-auto ${isDark
              ? "bg-[#171717] border-[#3D3D3D] text-[#D8D8D8]"
              : "bg-white border-[#E2E8F0] text-gray-800"
            }`}
        >
          {/* Header Metadata Section */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 lg:px-8 lg:py-7 rounded-t-2xl border-b ${isDark
              ? "bg-[#202020] border-[#3D3D3D] text-[#D8D8D8]"
              : "bg-white border-[#E2E8F0] text-gray-800"
            }`}>
            <div>
              <p className={`text-xs uppercase font-semibold mb-1 ${isDark ? "text-[#D8CCBA]" : "text-gray-400"}`}>
                {agreementType}
              </p>
              <h1 className={`text-2xl lg:text-3xl uppercase ${isDark ? "text-white" : "text-black"}`}>
                {agreementTitle}
              </h1>
            </div>

            <div className="flex flex-col sm:items-end shrink-0">
              <span
                className={`inline-flex items-center w-fit px-2.5 py-1 rounded-lg text-xs font-medium mb-1.5 bg-[#E8D1AB] text-black`}
              >
                {version}
              </span>
              <p className={`text-[10px] font-medium ${isDark ? "text-white" : "text-black"}`}>
                {effectiveDate}
              </p>
            </div>
          </div>

          <div className="p-5 lg:px-8 lg:py-7">
            {/* Lead Paragraphs */}
            <div className="space-y-4 text-sm lg:text-base">
              {leadParagraphs.map((para, idx) => (
                <p key={`lead-para-${idx}`}>{para}</p>
              ))}
            </div>

            {/* Dynamic Sections Loop */}
            {sections.map((section, index) => (
              <React.Fragment key={section.id}>
                <div className={`border-t my-5 lg:my-8 ${isDark ? "border-white/60" : "border-black/50"}`}/>

                <div className="space-y-4">
                  <h2 className={`text-base lg:text-xl font-medium ${isDark ? "text-[#E8D1AB]" : "text-[#B8860B]"}`}>
                    {section.title}
                  </h2>

                  <div className="space-y-3 text-sm lg:text-base">
                    {Array.isArray(section.content) ? (
                      section.content.map((paragraph, pIdx) => (
                        <p key={`section-${section.id}-para-${pIdx}`}>{paragraph}</p>
                      ))
                    ) : (
                      <p>{section.content}</p>
                    )}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Floating Mobile Sticky Action Bar */}
        <div className={`lg:hidden fixed flex flex-wrap gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={() => router.push("/admin/agreements")}
            title="View Version History"
            variant="outline"
            className={`h-14 rounded-md font-semibold text-sm px-4 gap-2 transition-all ${isDark
              ? "bg-[#202020] border-white/10 text-white hover:bg-[#2C2C2C]"
              : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
              }`}
          >
            <History size={24} />
            View Version History
          </Button>
          <Button
            onClick={() => router.push("/admin/agreements")}
            title="Edit Agreement"
            variant="outline"
            className={`h-14 rounded-md font-semibold text-sm px-4 gap-2 transition-all ${isDark
              ? "bg-[#202020] border-white/10 text-white hover:bg-[#2C2C2C]"
              : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
              }`}
          >
            Edit Agreement
          </Button>
          <Button
            onClick={() => router.push("/admin/agreements")}
            title="Save Agreement"
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#D4C3A3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            Save Agreement
          </Button>
        </div>
      </div>
    </>
  );
}