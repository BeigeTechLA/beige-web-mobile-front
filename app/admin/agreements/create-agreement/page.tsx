"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Bold,
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
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
import SuccessModal from "@/components/admin/agreements/SuccessModal";
import { DatePickerFloating } from "@/components/admin/DatePickerFloating";
import {
  agreementHtmlToText,
  agreementRichTextClassName,
  hasAgreementContent,
  normalizeAgreementHtml,
} from "@/components/admin/agreements/agreementRichText";
import {
  getLocalGeneralAgreement,
  saveLocalGeneralAgreement,
} from "@/components/admin/agreements/localAgreementStore";

const parseLocalDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
    );
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const formatLocalDateValue = (value: Date | null): string => {
  if (!value) return "";

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
      "<p>These general terms outline the conditions and policies applicable to the use of Beige services.</p>",
    isOpen: true,
  },
  {
    id: 2,
    title: "Scope of Agreement",
    description:
      "This agreement defines the general terms, responsibilities, and expectations applicable to Beige services.",
    content:
      "<p>This agreement defines the general terms, responsibilities, and expectations applicable to Beige services.</p>",
    isOpen: false,
  },
  {
    id: 3,
    title: "General Terms",
    description:
      "Additional terms and conditions applicable to this agreement.",
    content: "<p>Additional terms and conditions applicable to this agreement.</p>",
    isOpen: false,
  },
];

type RichTextCommand = "bold" | "italic" | "bullet" | "numbered" | "link";

function AgreementRichTextEditor({
  value,
  onChange,
  isDark,
}: {
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;

    const normalized = normalizeAgreementHtml(value);
    if (editor.innerHTML !== normalized) {
      editor.innerHTML = normalized;
    }
  }, [value]);

  const syncValue = () => {
    const editor = editorRef.current;
    if (!editor) return;
    onChange(editor.innerHTML);
  };

  const runCommand = (command: RichTextCommand) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    if (command === "bold") {
      document.execCommand("bold", false);
    } else if (command === "italic") {
      document.execCommand("italic", false);
    } else if (command === "bullet") {
      document.execCommand("insertUnorderedList", false);
    } else if (command === "numbered") {
      document.execCommand("insertOrderedList", false);
    } else if (command === "link") {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        toast.error("Select text first, then click the link button.");
        return;
      }

      const enteredUrl = window.prompt("Enter link URL", "https://");
      if (!enteredUrl?.trim()) return;

      const trimmedUrl = enteredUrl.trim();
      const safeUrl = /^(https?:\/\/|mailto:)/i.test(trimmedUrl)
        ? trimmedUrl
        : `https://${trimmedUrl}`;

      document.execCommand("createLink", false, safeUrl);
      editor.querySelectorAll("a").forEach((anchor) => {
        anchor.setAttribute("target", "_blank");
        anchor.setAttribute("rel", "noopener noreferrer");
      });
    }

    syncValue();
  };

  const toolbarItems: Array<{
    label: string;
    icon: React.ElementType;
    command: RichTextCommand;
  }> = [
    { label: "Bold", icon: Bold, command: "bold" },
    { label: "Italic", icon: Italic, command: "italic" },
    { label: "Bulleted list", icon: List, command: "bullet" },
    { label: "Numbered list", icon: ListOrdered, command: "numbered" },
    { label: "Link", icon: Link2, command: "link" },
  ];

  return (
    <>
      <div
        className={`flex h-10 items-center gap-1 rounded-md border px-2 ${
          isDark
            ? "border-[#2B2B2B] bg-[#101010]"
            : "border-[#E3E3E3] bg-[#FAFAFA]"
        }`}
      >
        {toolbarItems.map(({ label, icon: Icon, command }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(event) => {
              event.preventDefault();
              runCommand(command);
            }}
            className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
              isDark
                ? "text-white/45 hover:bg-white/10 hover:text-white"
                : "text-black/45 hover:bg-black/5 hover:text-black"
            }`}
          >
            <Icon size={13} />
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder="Add section content..."
        onInput={syncValue}
        onBlur={syncValue}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          syncValue();
        }}
        className={`min-h-[150px] w-full rounded-md border p-3 text-sm leading-6 outline-none transition-colors empty:before:pointer-events-none empty:before:content-[attr(data-placeholder)] focus:border-[#E8D1AB]/70 ${agreementRichTextClassName} ${
          isDark
            ? "border-[#2B2B2B] bg-[#101010] text-white empty:before:text-white/20"
            : "border-[#E3E3E3] bg-[#FAFAFA] text-[#323232] empty:before:text-black/30"
        }`}
      />
    </>
  );
}

export default function CreateGeneralAgreementPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useResolvedTheme();
  const editAgreementId = searchParams.get("edit");
  const isEditing = Boolean(editAgreementId);

  const [agreementName, setAgreementName] = useState("");
  const [agreementTitle, setAgreementTitle] = useState("");
  const [description, setDescription] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [sections, setSections] =
    useState<AgreementSection[]>(INITIAL_SECTIONS);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdAgreementId, setCreatedAgreementId] = useState<string | number | null>(null);
  const [isLoadingAgreement, setIsLoadingAgreement] = useState(false);
  const [sectionMenuId, setSectionMenuId] = useState<number | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<number | null>(null);

  const effectiveDateSelected = useMemo(
    () => parseLocalDate(effectiveDate),
    [effectiveDate],
  );

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const effectiveDateMinDate = useMemo(() => {
    if (isEditing && effectiveDateSelected && effectiveDateSelected < today) {
      return effectiveDateSelected;
    }

    return today;
  }, [effectiveDateSelected, isEditing, today]);

  const handleEffectiveDateChange = (date: Date | null) => {
    if (!date) {
      setEffectiveDate("");
      markChanged();
      return;
    }

    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    setEffectiveDate(formatLocalDateValue(normalized));
    markChanged();
  };

  useEffect(() => {
    if (!editAgreementId) return;

    setIsLoadingAgreement(true);
    try {
      const agreement = getLocalGeneralAgreement(editAgreementId);
      setAgreementName(agreement.agreementName || "");
      setAgreementTitle(agreement.agreementTitle || "");
      setDescription(agreement.description || "");
      setEffectiveDate(agreement.effectiveDate || "");
      setSections(
        agreement.sections.length > 0
          ? agreement.sections.map((section, index) => ({
              id: section.id || index + 1,
              title: section.title || "",
              description: section.description || "",
              content: normalizeAgreementHtml(section.content || ""),
              isOpen: index === 0,
            }))
          : INITIAL_SECTIONS,
      );
      setHasChanges(false);
    } finally {
      setIsLoadingAgreement(false);
    }
  }, [editAgreementId]);

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

  const moveSection = (id: number, direction: -1 | 1) => {
    setSections((current) => {
      const index = current.findIndex((section) => section.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
    setSectionMenuId(null);
    markChanged();
  };

  const duplicateSection = (id: number) => {
    setSections((current) => {
      const sourceIndex = current.findIndex((section) => section.id === id);
      if (sourceIndex < 0) return current;
      const nextId = Math.max(0, ...current.map((section) => section.id)) + 1;
      const source = current[sourceIndex];
      const next = [...current];
      next.splice(sourceIndex + 1, 0, {
        ...source,
        id: nextId,
        title: `${source.title || "Untitled Section"} Copy`,
        isOpen: true,
      });
      return next;
    });
    setSectionMenuId(null);
    markChanged();
  };

  const reorderSection = (targetId: number) => {
    if (draggedSectionId === null || draggedSectionId === targetId) return;
    setSections((current) => {
      const sourceIndex = current.findIndex((section) => section.id === draggedSectionId);
      const targetIndex = current.findIndex((section) => section.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDraggedSectionId(null);
    markChanged();
  };

  const handleBack = () => {
    if (hasChanges && !window.confirm("You have unsaved agreement changes. Leave without saving?")) {
      return;
    }
    router.push("/admin/agreements");
  };

  const handleSave = async () => {
    if (isSaving) return;

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

    if (
      sections.length === 0 ||
      sections.some(
        (section) => !section.title.trim() || !hasAgreementContent(section.content),
      )
    ) {
      toast.error("Please complete every agreement section before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const agreement = saveLocalGeneralAgreement({
        id: editAgreementId,
        agreementName: agreementName.trim(),
        agreementTitle: agreementTitle.trim(),
        description: description.trim(),
        effectiveDate,
        sections: sections.map((section) => ({
          id: section.id,
          title: section.title.trim(),
          description: section.description,
          content: section.content.trim(),
        })),
      });

      setHasChanges(false);
      setCreatedAgreementId(agreement.id);
      setSuccessOpen(true);
    } catch (error) {
      console.error("Failed to save local agreement:", error);
      toast.error("Unable to save the agreement locally.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!successOpen || createdAgreementId === null) return;

    const timer = window.setTimeout(() => {
      setSuccessOpen(false);
      router.replace("/admin/agreements");
    }, 2300);

    return () => window.clearTimeout(timer);
  }, [createdAgreementId, router, successOpen]);

  const completedTitle = agreementTitle.trim() || "Beige General Agreement";

  const previewSections = useMemo(
    () =>
      sections.filter(
        (section) => section.title.trim() || hasAgreementContent(section.content),
      ),
    [sections],
  );

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          agreements: "Agreements",
          "create-agreement": isEditing ? "Edit General Agreement" : "Create General Agreement",
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
              disabled={isLoadingAgreement}
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
              disabled={isSaving || isLoadingAgreement}
              className={`h-11 rounded-lg px-5 text-sm font-semibold text-black transition-colors disabled:cursor-not-allowed disabled:opacity-60 lg:h-12 lg:px-7 ${
                isDark
                  ? "bg-[#E5D5B8] hover:bg-[#D4C3A3]"
                  : "bg-[#E8D1AB] hover:bg-[#D9C19A]"
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Send"
              )}
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
          onClick={handleBack}
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
            {isEditing ? "Edit General Agreement" : "Create General Agreement"}
          </h1>

          <p
            className={`mt-1 text-xs transition-colors lg:text-sm ${
              isDark ? "text-white/55" : "text-black/55"
            }`}
          >
            {isEditing
              ? "Update the agreement details and sections. Saving creates the next agreement version."
              : "Define the agreement details and add the sections that make up your agreement."}
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
              <DatePickerFloating
                selectedDate={effectiveDateSelected}
                onDateChange={handleEffectiveDateChange}
                minDate={effectiveDateMinDate}
                width="w-full"
                classnames={`!rounded-xl h-[66px] w-full resize-none px-0 pt-4 text-sm outline-none bg-transparent ${
                  isDark ? "text-white": "text-[#323232]"
                }`}
                labelClasses={`${
                  isDark
                    ? "bg-[#171717] text-white/55"
                    : "bg-white text-black/55"
                } text-sm z-10 px-1`}
              />

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
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => reorderSection(section.id)}
                className={`relative overflow-visible rounded-xl border transition-colors ${
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
                  <span
                    draggable
                    onDragStart={(event) => {
                      event.stopPropagation();
                      setDraggedSectionId(section.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setDraggedSectionId(null)}
                    className="inline-flex cursor-grab active:cursor-grabbing"
                    title="Drag to reorder section"
                  >
                    <GripVertical
                      size={17}
                      className={isDark ? "text-white/35" : "text-black/35"}
                    />
                  </span>

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
                          agreementHtmlToText(section.content) ||
                          "Add section content..."}
                      </p>
                    )}
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setSectionMenuId((current) => current === section.id ? null : section.id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        isDark
                          ? "text-white/45 hover:bg-white/10 hover:text-white"
                          : "text-black/40 hover:bg-black/5 hover:text-black"
                      }`}
                      aria-label="Section actions"
                      aria-expanded={sectionMenuId === section.id}
                    >
                      <MoreHorizontal size={17} />
                    </button>
                    {sectionMenuId === section.id ? (
                      <div className={`absolute right-0 top-9 z-40 min-w-[180px] rounded-lg border p-1.5 shadow-xl ${isDark ? "border-[#3A3A3A] bg-[#171717]" : "border-[#E5E5E5] bg-white"}`}>
                        <button type="button" disabled={index === 0} onClick={() => moveSection(section.id, -1)} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs disabled:opacity-35 ${isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"}`}><ArrowUp size={14} /> Move up</button>
                        <button type="button" disabled={index === sections.length - 1} onClick={() => moveSection(section.id, 1)} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs disabled:opacity-35 ${isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"}`}><ArrowDown size={14} /> Move down</button>
                        <button type="button" onClick={() => duplicateSection(section.id)} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs ${isDark ? "text-white hover:bg-white/10" : "text-black hover:bg-black/5"}`}><Copy size={14} /> Duplicate</button>
                        <div className={`my-1 h-px ${isDark ? "bg-white/10" : "bg-black/5"}`} />
                        <button type="button" onClick={() => { if (sections.length === 1) { toast.error("An agreement needs at least one section."); return; } removeSection(section.id); setSectionMenuId(null); }} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs ${isDark ? "text-red-400 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50"}`}><Trash2 size={14} /> Delete section</button>
                      </div>
                    ) : null}
                  </div>

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

                    <AgreementRichTextEditor
                      value={section.content}
                      onChange={(value) =>
                        updateSection(section.id, "content", value)
                      }
                      isDark={isDark}
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

                {hasAgreementContent(section.content) ? (
                  <div
                    className={`mt-2 text-sm leading-6 ${agreementRichTextClassName} ${
                      isDark ? "text-white/60" : "text-black/60"
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: normalizeAgreementHtml(section.content),
                    }}
                  />
                ) : (
                  <p className={`mt-2 text-sm leading-6 ${isDark ? "text-white/60" : "text-black/60"}`}>
                    No content added.
                  </p>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <SuccessModal
        isOpen={successOpen}
        onSubmit={() => {
          setSuccessOpen(false);
          if (createdAgreementId !== null) {
            router.replace("/admin/agreements");
          }
        }}
        title="General Agreement Sent Successfully"
        subtext="The general agreement has been sent to the CP for review and acceptance."
        buttonText=""
      />
    </>
  );
}
