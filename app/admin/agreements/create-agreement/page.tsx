"use client";

import React, { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bold,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Italic,
  Link2,
  List,
  ListOrdered,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

type AgreementSection = {
  id: number;
  title: string;
  description: string;
  content: string;
  isOpen: boolean;
};

const INITIAL_SECTIONS: AgreementSection[] = [
  {
    id: 1,
    title: "Introduction",
    description: "",
    content:
      "These general terms outline the conditions and policies applicable to the use of Beige services.",
    isOpen: true,
  },
  {
    id: 2,
    title: "Scope of Agreement",
    description:
      "This agreement defines the general terms, responsibilities, and expectations applicable to Beige services.",
    content:
      "This agreement defines the general terms, responsibilities, and expectations applicable to Beige services.",
    isOpen: false,
  },
  {
    id: 3,
    title: "General Terms",
    description:
      "Additional terms and conditions applicable to this agreement.",
    content: "Additional terms and conditions applicable to this agreement.",
    isOpen: false,
  },
];

export default function CreateGeneralAgreementPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useResolvedTheme();

  const [agreementName, setAgreementName] = useState("");
  const [agreementTitle, setAgreementTitle] = useState("");
  const [description, setDescription] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [sections, setSections] =
    useState<AgreementSection[]>(INITIAL_SECTIONS);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(true);

  const markChanged = () => setHasChanges(true);

  const updateSection = (
    id: number,
    field: "title" | "content",
    value: string,
  ) => {
    setSections((current) =>
      current.map((section) =>
        section.id === id
          ? {
              ...section,
              [field]: value,
            }
          : section,
      ),
    );
    markChanged();
  };

  const toggleSection = (id: number) => {
    setSections((current) =>
      current.map((section) =>
        section.id === id ? { ...section, isOpen: !section.isOpen } : section,
      ),
    );
  };

  const addSection = () => {
    const nextId =
      sections.length > 0
        ? Math.max(...sections.map((section) => section.id)) + 1
        : 1;

    setSections((current) => [
      ...current,
      {
        id: nextId,
        title: `New Section`,
        description: "Add a short description for this agreement section.",
        content: "",
        isOpen: true,
      },
    ]);

    markChanged();
  };

  const removeSection = (id: number) => {
    setSections((current) => current.filter((section) => section.id !== id));
    markChanged();
  };

  const handleSave = () => {
    if (!agreementName.trim()) {
      toast.error("Please enter an agreement name.");
      return;
    }

    if (!agreementTitle.trim()) {
      toast.error("Please enter an agreement title.");
      return;
    }

    if (!effectiveDate) {
      toast.error("Please select an effective date.");
      return;
    }

    if (sections.length === 0) {
      toast.error("Please add at least one agreement section.");
      return;
    }

    try {
      window.sessionStorage.setItem(
        "beige_general_agreement_draft",
        JSON.stringify({
          agreementName,
          agreementTitle,
          description,
          effectiveDate,
          sections,
        }),
      );

      setHasChanges(false);
      toast.success("Agreement saved successfully.");
      router.push("/admin/agreements/details");
    } catch (error) {
      console.error("Failed to save agreement draft:", error);
      toast.error("Unable to open agreement details.");
    }
  };

  const completedTitle = agreementTitle.trim() || "Beige General Agreement";

  const previewSections = useMemo(
    () =>
      sections.filter(
        (section) => section.title.trim() || section.content.trim(),
      ),
    [sections],
  );

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          agreements: "Agreements",
          create: "Create General Agreement",
        }}
        actions={
          <div className="flex items-center gap-2 lg:gap-3">
            <span
              className={`hidden text-[11px] font-medium sm:inline ${
                hasChanges
                  ? isDark
                    ? "text-[#C9A85E]"
                    : "text-[#9A7542]"
                  : isDark
                    ? "text-white/35"
                    : "text-black/35"
              }`}
            >
              {hasChanges ? "Unsaved Changes" : "Saved"}
            </span>

            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              className={`h-11 rounded-lg border px-5 text-sm font-medium transition-colors lg:h-12 lg:px-7 ${
                isDark
                  ? "border-[#3D3D3D] bg-[#171717] text-white hover:bg-[#202020] hover:text-white"
                  : "border-[#E3E3E3] bg-white text-[#323232] hover:bg-[#F4F5F7] hover:text-black"
              }`}
            >
              Preview
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              className={`h-11 rounded-lg px-5 text-sm font-semibold text-black transition-colors lg:h-12 lg:px-7 ${
                isDark
                  ? "bg-[#E5D5B8] hover:bg-[#D4C3A3]"
                  : "bg-[#E8D1AB] hover:bg-[#D9C19A]"
              }`}
            >
              Save &amp; Send
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
          onClick={() => router.back()}
          className={`mb-6 inline-flex items-center gap-2 text-sm transition-colors ${
            isDark
              ? "text-white/75 hover:text-white"
              : "text-black/65 hover:text-black"
          }`}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div>
          <h1
            className={`text-xl font-semibold leading-8 transition-colors lg:text-2xl ${
              isDark ? "text-white" : "text-[#171717]"
            }`}
          >
            Create General Agreement
          </h1>

          <p
            className={`mt-1 text-xs transition-colors lg:text-sm ${
              isDark ? "text-white/55" : "text-black/55"
            }`}
          >
            Define the agreement details and add the sections that make up your
            agreement.
          </p>
        </div>

        <div
          className={`my-7 border-t border-dashed lg:my-8 ${
            isDark ? "border-white/15" : "border-black/10"
          }`}
        />

        {/* Agreement details */}
        <section
          className={`overflow-hidden rounded-2xl border transition-colors ${
            isDark
              ? "border-[#2E2E2E] bg-[#171717]"
              : "border-[#E3E3E3] bg-white"
          }`}
        >
          <div
            className={`border-b px-5 py-4 lg:px-6 ${
              isDark
                ? "border-[#2A2A2A] bg-[#191919]"
                : "border-[#E8E8E8] bg-[#FFFCF6]"
            }`}
          >
            <h2
              className={`text-base font-semibold ${
                isDark ? "text-white" : "text-[#171717]"
              }`}
            >
              Agreement Details
            </h2>
          </div>

          <div className="space-y-5 p-5 lg:p-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <fieldset
                  className={`rounded-xl border px-4 pb-3 pt-1.5 transition-colors ${
                    isDark
                      ? "border-[#3D3D3D] bg-[#171717] focus-within:border-[#E8D1AB]/60"
                      : "border-[#DCDCDC] bg-white focus-within:border-[#D6C19D]"
                  }`}
                >
                  <legend
                    className={`px-2 text-sm ${
                      isDark ? "text-white/55" : "text-black/55"
                    }`}
                  >
                    Agreement Name
                  </legend>

                  <input
                    value={agreementName}
                    onChange={(event) => {
                      setAgreementName(event.target.value);
                      markChanged();
                    }}
                    placeholder="e.g. General Terms of Service"
                    className={`h-10 w-full bg-transparent text-sm outline-none ${
                      isDark
                        ? "text-white placeholder:text-white/20"
                        : "text-[#323232] placeholder:text-black/30"
                    }`}
                  />
                </fieldset>

                <p
                  className={`mt-2 text-[11px] ${
                    isDark ? "text-white/30" : "text-black/40"
                  }`}
                >
                  An internal name to help admins identify this agreement.
                </p>
              </div>

              <div>
                <fieldset
                  className={`rounded-xl border px-4 pb-3 pt-1.5 transition-colors ${
                    isDark
                      ? "border-[#3D3D3D] bg-[#171717] focus-within:border-[#E8D1AB]/60"
                      : "border-[#DCDCDC] bg-white focus-within:border-[#D6C19D]"
                  }`}
                >
                  <legend
                    className={`px-2 text-sm ${
                      isDark ? "text-white/55" : "text-black/55"
                    }`}
                  >
                    Agreement Title
                  </legend>

                  <input
                    value={agreementTitle}
                    onChange={(event) => {
                      setAgreementTitle(event.target.value);
                      markChanged();
                    }}
                    placeholder="e.g. Beige General Agreement"
                    className={`h-10 w-full bg-transparent text-sm outline-none ${
                      isDark
                        ? "text-white placeholder:text-white/20"
                        : "text-[#323232] placeholder:text-black/30"
                    }`}
                  />
                </fieldset>
              </div>
            </div>

            <fieldset
              className={`rounded-xl border px-4 pb-3 pt-1.5 transition-colors ${
                isDark
                  ? "border-[#3D3D3D] bg-[#171717] focus-within:border-[#E8D1AB]/60"
                  : "border-[#DCDCDC] bg-white focus-within:border-[#D6C19D]"
              }`}
            >
              <legend
                className={`px-2 text-sm ${
                  isDark ? "text-white/55" : "text-black/55"
                }`}
              >
                Description
              </legend>

              <textarea
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  markChanged();
                }}
                rows={5}
                placeholder="Add a brief description of the agreement and its purpose."
                className={`w-full resize-none bg-transparent py-2 text-sm leading-6 outline-none ${
                  isDark
                    ? "text-white placeholder:text-white/20"
                    : "text-[#323232] placeholder:text-black/30"
                }`}
              />
            </fieldset>

            <div className="w-full lg:max-w-[46%]">
              <fieldset
                className={`rounded-xl border px-4 pb-3 pt-1.5 transition-colors ${
                  isDark
                    ? "border-[#3D3D3D] bg-[#171717] focus-within:border-[#E8D1AB]/60"
                    : "border-[#DCDCDC] bg-white focus-within:border-[#D6C19D]"
                }`}
              >
                <legend
                  className={`px-2 text-sm ${
                    isDark ? "text-white/55" : "text-black/55"
                  }`}
                >
                  Effective Date
                </legend>

                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(event) => {
                    setEffectiveDate(event.target.value);
                    markChanged();
                  }}
                  className={`h-10 w-full bg-transparent text-sm outline-none ${
                    isDark
                      ? "text-white [color-scheme:dark]"
                      : "text-[#323232] [color-scheme:light]"
                  }`}
                />
              </fieldset>

              <p
                className={`mt-2 text-[11px] ${
                  isDark ? "text-white/30" : "text-black/40"
                }`}
              >
                The date from which this agreement becomes effective.
              </p>
            </div>
          </div>
        </section>

        <div
          className={`my-7 border-t border-dashed lg:my-8 ${
            isDark ? "border-white/15" : "border-black/10"
          }`}
        />

        {/* Agreement sections */}
        <section>
          <div className="mb-4">
            <h2
              className={`text-base font-semibold lg:text-lg ${
                isDark ? "text-white" : "text-[#171717]"
              }`}
            >
              Agreement Sections
            </h2>

            <p
              className={`mt-1 text-xs lg:text-sm ${
                isDark ? "text-white/35" : "text-black/45"
              }`}
            >
              Add and organize the sections that will appear in this agreement.
            </p>
          </div>

          <div className="space-y-3">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className={`overflow-hidden rounded-xl border transition-colors ${
                  isDark
                    ? "border-[#2E2E2E] bg-[#171717]"
                    : "border-[#E3E3E3] bg-white"
                }`}
              >
                <div
                  className={`flex items-center gap-3 px-4 py-4 lg:px-5 ${
                    section.isOpen
                      ? isDark
                        ? "border-b border-[#2A2A2A]"
                        : "border-b border-[#E8E8E8]"
                      : ""
                  }`}
                >
                  <GripVertical
                    size={17}
                    className={isDark ? "text-white/35" : "text-black/35"}
                  />

                  <span
                    className={`w-7 shrink-0 text-xs font-medium ${
                      isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p
                      className={`truncate text-sm font-medium ${
                        isDark ? "text-white" : "text-[#171717]"
                      }`}
                    >
                      {section.title || "Untitled Section"}
                    </p>

                    {!section.isOpen && (
                      <p
                        className={`mt-1 truncate text-xs ${
                          isDark ? "text-white/30" : "text-black/40"
                        }`}
                      >
                        {section.description ||
                          section.content ||
                          "Add section content..."}
                      </p>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeSection(section.id)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      isDark
                        ? "text-white/45 hover:bg-red-500/10 hover:text-red-400"
                        : "text-black/40 hover:bg-red-50 hover:text-red-600"
                    }`}
                    aria-label="Delete section"
                  >
                    <MoreHorizontal size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      isDark
                        ? "text-white/70 hover:bg-white/5 hover:text-white"
                        : "text-black/55 hover:bg-black/5 hover:text-black"
                    }`}
                    aria-label={
                      section.isOpen ? "Collapse section" : "Expand section"
                    }
                  >
                    {section.isOpen ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                </div>

                {section.isOpen && (
                  <div className="space-y-3 p-4 lg:p-5">
                    <div>
                      <label
                        className={`mb-2 block text-xs font-medium ${
                          isDark ? "text-white/60" : "text-black/60"
                        }`}
                      >
                        Section Title
                      </label>

                      <input
                        value={section.title}
                        onChange={(event) =>
                          updateSection(section.id, "title", event.target.value)
                        }
                        className={`h-11 w-full rounded-md border px-3 text-sm outline-none transition-colors focus:border-[#E8D1AB]/70 ${
                          isDark
                            ? "border-[#2B2B2B] bg-[#101010] text-white"
                            : "border-[#E3E3E3] bg-[#FAFAFA] text-[#323232]"
                        }`}
                      />
                    </div>

                    <div
                      className={`flex h-10 items-center gap-1 rounded-md border px-2 ${
                        isDark
                          ? "border-[#2B2B2B] bg-[#101010]"
                          : "border-[#E3E3E3] bg-[#FAFAFA]"
                      }`}
                    >
                      {[
                        { label: "Bold", icon: Bold },
                        { label: "Italic", icon: Italic },
                        { label: "Bulleted list", icon: List },
                        { label: "Numbered list", icon: ListOrdered },
                        { label: "Link", icon: Link2 },
                      ].map(({ label, icon: Icon }) => (
                        <button
                          key={label}
                          type="button"
                          title={label}
                          className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                            isDark
                              ? "text-white/35 hover:bg-white/5 hover:text-white"
                              : "text-black/40 hover:bg-black/5 hover:text-black"
                          }`}
                        >
                          <Icon size={13} />
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={section.content}
                      onChange={(event) =>
                        updateSection(section.id, "content", event.target.value)
                      }
                      rows={4}
                      placeholder="Add section content..."
                      className={`w-full resize-none rounded-md border p-3 text-sm leading-6 outline-none transition-colors focus:border-[#E8D1AB]/70 ${
                        isDark
                          ? "border-[#2B2B2B] bg-[#101010] text-white placeholder:text-white/20"
                          : "border-[#E3E3E3] bg-[#FAFAFA] text-[#323232] placeholder:text-black/30"
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}

            <Button
              type="button"
              onClick={addSection}
              className={`h-12 w-full gap-2 rounded-lg text-sm font-medium text-black transition-colors ${
                isDark
                  ? "bg-[#E5D5B8] hover:bg-[#D4C3A3]"
                  : "bg-[#E8D1AB] hover:bg-[#D9C19A]"
              }`}
            >
              <Plus size={17} />
              Add Section
            </Button>
          </div>
        </section>
      </main>

      {/* Preview modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className={`max-h-[85vh] max-w-3xl overflow-y-auto border ${
            isDark
              ? "border-[#3D3D3D] bg-[#0A0A0A] text-white"
              : "border-[#E3E3E3] bg-[#FFFCF6] text-[#323232]"
          }`}
        >
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : "text-[#171717]"}>
              Agreement Preview
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            <div>
              <h2 className="text-xl font-semibold">{completedTitle}</h2>

              {description.trim() && (
                <p
                  className={`mt-2 text-sm leading-6 ${
                    isDark ? "text-white/55" : "text-black/55"
                  }`}
                >
                  {description}
                </p>
              )}

              <div
                className={`mt-3 text-xs ${
                  isDark ? "text-white/40" : "text-black/45"
                }`}
              >
                Effective Date: {effectiveDate || "Not selected"}
              </div>
            </div>

            <div
              className={`border-t ${
                isDark ? "border-white/10" : "border-black/10"
              }`}
            />

            {previewSections.map((section, index) => (
              <div key={section.id}>
                <p
                  className={`text-xs font-medium ${
                    isDark ? "text-[#E8D1AB]" : "text-[#8D6F3F]"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </p>

                <h3 className="mt-1 text-base font-semibold">
                  {section.title || "Untitled Section"}
                </h3>

                <p
                  className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${
                    isDark ? "text-white/60" : "text-black/60"
                  }`}
                >
                  {section.content || "No content added."}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
