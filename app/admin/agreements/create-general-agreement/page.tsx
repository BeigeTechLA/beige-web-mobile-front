"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
  Plus,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
} from "lucide-react";
import { useTheme } from "next-themes";
import Topbar from "@/components/admin/Topbar";
import { DatePickerFloating } from "@/components/admin/DatePickerFloating";
import SuccessModal from "@/components/admin/agreements/AgreementSendSuccess";
import { toast } from "sonner";
import { agreementApi } from "@/lib/api/agreements";
import { format, startOfDay } from "date-fns";

interface Section {
  id: string;
  title: string;
  content: string;
  isExpanded: boolean;
}

const GENERAL_AGREEMENT_DRAFT_KEY = "admin-general-agreement-draft";

interface GeneralAgreementDraft {
  sourceTemplateId: number;
  agreementName: string;
  agreementTitle: string;
  description: string;
  effectiveDate: string | null;
  sections: Array<Pick<Section, "id" | "title" | "content">>;
  contentHtml: string;
}

const parseAgreementContent = (value: unknown): { lead_paragraphs?: unknown[]; sections?: Array<{ id?: string; title?: string; content?: string }> } | null => {
  if (!value) return null;
  if (typeof value === "object") return value as { lead_paragraphs?: unknown[]; sections?: Array<{ id?: string; title?: string; content?: string }> };
  try { return JSON.parse(String(value)); } catch { return null; }
};

const contentToEditorHtml = (content: string) => /<\/?[a-z][\s\S]*>/i.test(content)
  ? content
  : content ? content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />") : "";

const hasSectionContent = (content: string) => {
  const element = document.createElement("div");
  element.innerHTML = content;
  return Boolean(element.textContent?.replace(/\u00a0/g, " ").trim());
};

const isPastEffectiveDate = (date: Date) => Number.isNaN(date.getTime())
  || format(date, "yyyy-MM-dd") < format(new Date(), "yyyy-MM-dd");

function RichTextEditor({ value, onChange, isDark }: { value: string; onChange: (value: string) => void; isDark: boolean }) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRange = useRef<Range | null>(null);
  const [activeCommands, setActiveCommands] = useState<Record<string, boolean>>({});
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== contentToEditorHtml(value)) editor.innerHTML = contentToEditorHtml(value);
  }, [value]);

  const rememberSelection = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount) savedRange.current = selection.getRangeAt(0).cloneRange();
    setActiveCommands({
      bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"), insertOrderedList: document.queryCommandState("insertOrderedList"),
    });
  };
  const restoreSelection = () => {
    const selection = window.getSelection();
    if (selection && savedRange.current) { selection.removeAllRanges(); selection.addRange(savedRange.current); }
  };
  const syncValue = () => { if (editorRef.current) onChange(editorRef.current.innerHTML); rememberSelection(); };
  const runCommand = (command: "bold" | "italic" | "insertUnorderedList" | "insertOrderedList") => {
    editorRef.current?.focus(); restoreSelection(); document.execCommand(command, false); syncValue();
  };
  const applyLink = () => {
    const url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setLinkError("Enter a valid URL beginning with https:// or http://.");
      return;
    }
    editorRef.current?.focus(); restoreSelection(); document.execCommand("createLink", false, url);
    const links = editorRef.current?.querySelectorAll<HTMLAnchorElement>(`a[href="${CSS.escape(url)}"]`);
    const createdLink = links?.item((links.length || 1) - 1);
    if (createdLink) {
      createdLink.target = "_blank";
      createdLink.rel = "noopener noreferrer";
    }
    syncValue();
    setLinkUrl(""); setLinkError(""); setIsLinkModalOpen(false);
  };
  const toolClass = (active = false) => `rounded px-2 py-1 transition-colors ${active ? "bg-[#E8D1AB] text-black" : isDark ? "text-white/70 hover:bg-white/10" : "text-black/70 hover:bg-black/5"}`;

  return <>
    <div className={`flex items-center gap-1 w-full px-4 py-3 rounded-md border text-sm ${isDark ? "bg-[#111110] border-[#252523]" : "bg-[#F8F8F8] border-gray-200"}`}>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("bold")} className={toolClass(activeCommands.bold)} aria-label="Bold"><Bold size={14} /></button>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("italic")} className={toolClass(activeCommands.italic)} aria-label="Italic"><Italic size={14} /></button>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertUnorderedList")} className={toolClass(activeCommands.insertUnorderedList)} aria-label="Bulleted list"><List size={14} /></button>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertOrderedList")} className={toolClass(activeCommands.insertOrderedList)} aria-label="Numbered list"><ListOrdered size={14} /></button>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { rememberSelection(); setLinkError(""); setIsLinkModalOpen(true); }} className={toolClass()} aria-label="Add link"><Link size={14} /></button>
    </div>
    <div className={`border rounded-md overflow-hidden ${isDark ? "bg-[#111110] border-[#252523] text-[#E8E8E7]" : "bg-[#F8F8F8] border-gray-200 text-black"}`}>
      <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" onInput={syncValue} onKeyUp={rememberSelection} onMouseUp={rememberSelection} onFocus={rememberSelection} className={`min-h-32 w-full p-4 text-sm focus:outline-none [&_a]:text-[#E8D1AB] [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6`} />
    </div>
    {isLinkModalOpen && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4" onMouseDown={() => setIsLinkModalOpen(false)}>
      <div className={`w-full max-w-md rounded-xl border p-6 shadow-2xl ${isDark ? "border-[#3D3D3D] bg-[#202020] text-white" : "border-[#E5E5E5] bg-white text-black"}`} onMouseDown={(event) => event.stopPropagation()}>
        <h3 className="text-lg font-semibold">Add Link</h3><p className="mt-1 text-sm opacity-60">Paste a full URL beginning with https://</p>
        <input autoFocus value={linkUrl} onChange={(event) => { setLinkUrl(event.target.value); setLinkError(""); }} onKeyDown={(event) => { if (event.key === "Enter") applyLink(); }} placeholder="https://example.com" className={`mt-5 w-full rounded-md border px-3 py-2 text-sm outline-none ${isDark ? "border-[#3D3D3D] bg-[#111110]" : "border-gray-300 bg-white"}`} />
        {linkError && <p className="mt-2 text-xs text-red-400">{linkError}</p>}
        <div className="mt-5 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setIsLinkModalOpen(false)}>Cancel</Button><Button type="button" className="bg-[#E8D1AB] text-black hover:bg-[#D4C3A3]" onClick={applyLink}>Add Link</Button></div>
      </div>
    </div>}
  </>;
}

export default function AdminCreateGeneralAgreementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Form State
  const [agreementName, setAgreementName] = useState("");
  const [agreementTitle, setAgreementTitle] = useState("");
  const [version] = useState("Assigned automatically");
  const [description, setDescription] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<Date | null>(null);

  // Success Modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sections State
  const [sections, setSections] = useState<Section[]>([
    {
      id: "1",
      title: "Introduction",
      content:
        "These general terms outline the conditions and policies applicable to the use of Beige services.",
      isExpanded: true,
    },
    {
      id: "2",
      title: "Scope of Agreement",
      content:
        "This agreement defines the general terms, responsibilities, and expectations...",
      isExpanded: false,
    },
    {
      id: "3",
      title: "General Terms",
      content:
        "Additional terms and conditions applicable to this agreement...",
      isExpanded: false,
    },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const sourceTemplateId = Number(searchParams.get("clone_from") || 0);
    const savedDraftRaw = sessionStorage.getItem(GENERAL_AGREEMENT_DRAFT_KEY);
    try {
      const savedDraft = savedDraftRaw ? JSON.parse(savedDraftRaw) as GeneralAgreementDraft : null;
      if (savedDraft && savedDraft.sourceTemplateId === sourceTemplateId && Array.isArray(savedDraft.sections)) {
        setAgreementName(savedDraft.agreementName);
        setAgreementTitle(savedDraft.agreementTitle);
        setDescription(savedDraft.description);
        const draftDate = savedDraft.effectiveDate ? new Date(`${savedDraft.effectiveDate}T12:00:00`) : null;
        setEffectiveDate(draftDate && !isPastEffectiveDate(draftDate) ? draftDate : null);
        setSections(savedDraft.sections.map((section, index) => ({ ...section, isExpanded: index === 0 })));
        return;
      }
    } catch {
      sessionStorage.removeItem(GENERAL_AGREEMENT_DRAFT_KEY);
    }
    if (!sourceTemplateId) return;

    let active = true;
    agreementApi.listGeneralTemplates()
      .then((response) => {
        const source = response.data.find((template) => template.agreement_template_id === sourceTemplateId);
        if (!active || !source) return;

        setAgreementName(source.description || source.title);
        setAgreementTitle(source.title);
        if (source.effective_at) {
          const sourceDate = new Date(`${source.effective_at.slice(0, 10)}T12:00:00`);
          setEffectiveDate(!isPastEffectiveDate(sourceDate) ? sourceDate : null);
        }
        const sourceContent = parseAgreementContent(source.content_json);
        const sourceLeadParagraphs = sourceContent?.lead_paragraphs;
        if (Array.isArray(sourceLeadParagraphs) && sourceLeadParagraphs.every((paragraph) => typeof paragraph === "string")) {
          setDescription(sourceLeadParagraphs.join("\n\n"));
        } else setDescription(source.description || "");
        const sourceSections = sourceContent?.sections;
        if (Array.isArray(sourceSections) && sourceSections.length) {
          setSections(sourceSections.map((section, index) => ({
            id: section.id || String(index + 1),
            title: section.title || `Section ${String(index + 1).padStart(2, "0")}`,
            content: section.content || "",
            isExpanded: index === 0,
          })));
        }
      })
      .catch(() => toast.error("Unable to load the agreement version to copy"));

    return () => { active = false; };
  }, [searchParams]);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  // Helper function to close the modal
  const handleCloseModal = () => {
    setIsSuccessModalOpen(false);
  };

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((sec) =>
        sec.id === id ? { ...sec, isExpanded: !sec.isExpanded } : sec
      )
    );
  };

  const updateSectionTitle = (id: string, title: string) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, title } : sec))
    );
  };

  const updateSectionContent = (id: string, content: string) => {
    setSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, content } : sec))
    );
  };


  const handleAddSection = () => {
    const newId = globalThis.crypto?.randomUUID?.() || `section-${Date.now()}`;
    setSections((prev) => [
      ...prev,
      {
        id: newId,
        title: `Section ${String(prev.length + 1).padStart(2, "0")}`,
        content: "",
        isExpanded: true,
      },
    ]);
  };

  const validateSections = () => {
    if (!sections.length) {
      toast.error("Add at least one agreement section with a title and content.");
      return false;
    }
    const invalidIndex = sections.findIndex((section) => !section.title.trim() || !hasSectionContent(section.content));
    if (invalidIndex !== -1) {
      setSections((previous) => previous.map((section, index) => index === invalidIndex ? { ...section, isExpanded: true } : section));
      toast.error(`Section ${invalidIndex + 1} needs a title and content.`);
      return false;
    }
    return true;
  };

  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[character] || character));

  const contentToHtml = (content: string) => /<\/?[a-z][\s\S]*>/i.test(content)
    ? content
    : `<p>${escapeHtml(content).replace(/\n/g, "<br />")}</p>`;
  const buildContentHtml = () => [
    ...description.split(/\n\s*\n/).filter(Boolean).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
    ...sections.map((section) =>
    `<section><h2>${escapeHtml(section.title)}</h2>${contentToHtml(section.content)}</section>`
    ),
  ].join("\n");

  const openPreview = () => {
    if (effectiveDate && isPastEffectiveDate(effectiveDate)) {
      toast.error("Effective date cannot be in the past.");
      return;
    }
    if (!validateSections()) return;
    const sourceTemplateId = Number(searchParams.get("clone_from") || 0);
    const effectiveDateValue = effectiveDate ? format(effectiveDate, "yyyy-MM-dd") : "";
    const draft: GeneralAgreementDraft = {
      sourceTemplateId,
      agreementName,
      agreementTitle,
      description,
      effectiveDate: effectiveDateValue || null,
      sections: sections.map(({ id, title, content }) => ({ id, title, content })),
      contentHtml: buildContentHtml(),
    };
    sessionStorage.setItem(GENERAL_AGREEMENT_DRAFT_KEY, JSON.stringify(draft));
    const dateQuery = effectiveDateValue ? `&effective_date=${encodeURIComponent(effectiveDateValue)}` : "";
    router.push(sourceTemplateId
      ? `/admin/agreements/preview-general-agreement?template_id=${sourceTemplateId}${dateQuery}`
      : `/admin/agreements/preview-general-agreement?draft_preview=1${dateQuery}`);
  };

  const saveAndPublish = async () => {
    if (!agreementName.trim() || !agreementTitle.trim()) {
      toast.error("Agreement name and title are required");
      return;
    }
    if (effectiveDate && isPastEffectiveDate(effectiveDate)) {
      toast.error("Effective date cannot be in the past.");
      return;
    }
    if (!validateSections()) return;
    try {
      setIsSubmitting(true);
      const created = await agreementApi.createGeneralTemplate({
        title: agreementTitle.trim(),
        description: agreementName.trim(),
        content_html: buildContentHtml(),
        content_json: { lead_paragraphs: description.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean), sections: sections.map(({ id, title, content }) => ({ id, title, content })), effective_date: effectiveDate ? format(effectiveDate, "yyyy-MM-dd") : null },
        effective_at: effectiveDate ? format(effectiveDate, "yyyy-MM-dd") : null,
        is_mandatory: true,
        ...(Number(searchParams.get("clone_from") || 0) ? { source_template_id: Number(searchParams.get("clone_from")) } : {}),
      });
      await agreementApi.publishGeneralTemplate(created.data.agreement_template_id);
      sessionStorage.removeItem(GENERAL_AGREEMENT_DRAFT_KEY);
      setIsSuccessModalOpen(true);
      toast.success("General agreement published");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to publish agreement");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <>
            <Button
              onClick={openPreview}
              title="Preview"
              variant="outline"
              className={`rounded-lg h-12 px-4 lg:px-7 gap-2 transition-all ${isDark
                ? "bg-[#202020] border-white/10 text-white hover:bg-[#2C2C2C]"
                : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
                }`}
            >
              Preview
            </Button>
            <Button
              onClick={saveAndPublish}
              disabled={isSubmitting}
              title="Save & Publish"
              className={`h-12 px-4 lg:px-7 font-medium transition-colors ${isDark
                ? "bg-[#E5D5B8] text-black hover:bg-[#D4C3A3]"
                : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"
                }`}
            >
              {isSubmitting ? "Publishing..." : "Save & Publish"}
            </Button>
          </>
        }
      />

      <div className={`min-h-screen p-4 lg:p-6 lg:px-10 lg:py-9 font-sans pb-28 transition-colors space-y-4 lg:space-y-9 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F3F4F6] text-black"}`}>
        <Button
          onClick={() => router.back()}
          className={`transition-colors flex items-center gap-2 mb-5 p-0 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        <div className="flex flex-col justify-between items-start w-full">
          <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors ${isDark ? "text-white" : "text-black"}`}>
            Create General Agreement
          </h1>
          <p className={`text-xs lg:text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
            Define the agreement details and add the sections that make up your agreement.
          </p>
        </div>

        {/* --- SECTION 1: Agreement Details --- */}
        <div className={`border rounded-2xl transition-colors ${isDark ? "bg-[#171717] border-[#323232]" : "bg-white border-[#E5E5E5]"}`}>
          <div className="p-4 lg:px-6">
            <h2 className={`text-base lg:text-lg font-semibold ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>
              Agreement Details
            </h2>
          </div>

          <div className={`border-t p-4 lg:p-6 lg:pt-9 space-y-6 lg:space-y-8 ${isDark ? "border-[#323232]" : "border-black/80"}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Agreement Name Field */}
              <div>
                <div
                  className={`relative rounded-xl border ${isDark
                    ? "border-white/20 bg-[#171717]"
                    : "border-gray-300 bg-white"
                    }`}
                >
                  <label className={`absolute -top-3.5 left-3 px-1.5 ${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"}`}>
                    Agreement Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. General Terms of Service"
                    value={agreementName}
                    onChange={(e) => setAgreementName(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] ${isDark ? "text-white placeholder:text-white/20" : "text-black placeholder:text-gray-400"}`}
                  />
                </div>
                <p className={`text-xs mt-1.5 ${isDark ? "text-white/40" : "text-gray-500"}`}>
                  An internal name to help admins identify this agreement.
                </p>
              </div>

              <div>
                <div className={`relative rounded-xl border ${isDark ? "border-white/20 bg-[#171717]" : "border-gray-300 bg-white"}`}>
                  <label className={`absolute -top-3.5 left-3 px-1.5 ${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"}`}>
                    Version
                  </label>
                  <input
                    type="text"
                    aria-label="Version assigned automatically"
                    value={version}
                    readOnly
                    className={`w-full cursor-not-allowed px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] ${isDark ? "text-white/60" : "text-black/60"}`}
                  />
                </div>
                <p className={`text-xs mt-1.5 ${isDark ? "text-white/40" : "text-gray-500"}`}>The next version is assigned automatically when you publish.</p>
              </div>

              {/* Agreement Title Field */}
              <div>
                <div
                  className={`relative rounded-xl border ${isDark
                    ? "border-white/20 bg-[#171717]"
                    : "border-gray-300 bg-white"
                    }`}
                >
                  <label className={`absolute -top-3.5 left-3 px-1.5 ${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"}`}>
                    Agreement Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Beige General Agreement"
                    value={agreementTitle}
                    onChange={(e) => setAgreementTitle(e.target.value)}
                    className={`w-full px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] ${isDark ? "text-white placeholder:text-white/20" : "text-black placeholder:text-gray-400"}`}
                  />
                </div>
              </div>
            </div>

            {/* Description Field */}
            <div className="mb-6 lg:mb-8">
              <div
                className={`relative rounded-xl border ${isDark
                  ? "border-white/20 bg-[#171717]"
                  : "border-gray-300 bg-white"
                  }`}
              >
                <label className={`absolute -top-3.5 left-3 px-1.5 ${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"}`}>
                  Agreement Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Write the introductory agreement paragraphs. Separate paragraphs with one blank line."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-4 py-3.5 bg-transparent text-sm focus:outline-none resize-none ${isDark ? "text-white placeholder:text-white/30" : "text-black placeholder:text-gray-400"}`}
                />
              </div>
            </div>

            {/* Effective Date Field */}
            <div className="max-w-md">
              <DatePickerFloating
                selectedDate={effectiveDate}
                onDateChange={setEffectiveDate}
                minDate={startOfDay(new Date())}
                width="w-full"
                classnames={`w-full px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] relative rounded-xl border ${isDark ? "text-white placeholder:text-white/20" : "text-black placeholder:text-gray-400"}`}
                labelClasses={`${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"} text-sm lg:text-base z-10 px-1`}
                label="Effective Date"
                displayFormat="dd-MM-yyyy"
              />
              <p className={`text-xs mt-1.5 ${isDark ? "text-white/40" : "text-gray-500"}`}>
                Select today or a future effective date.
              </p>
            </div>
          </div>

        </div>

        {/* --- SECTION 2: Agreement Sections --- */}
        <div className="mb-10">
          <div className="mb-6">
            <h2 className={`text-base lg:text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>
              Agreement Sections
            </h2>
            <p className={`text-xs lg:text-base ${isDark ? "text-[#525250]" : "text-black/60"}`}>
              Add and organize the sections that will appear in this agreement.
            </p>
          </div>

          {/* Section Accordions */}
          <div className="flex flex-col gap-4">
            {sections.map((section, idx) => (
              <div
                key={section.id}
                className={`border rounded-2xl overflow-hidden transition-colors ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"}`}
              >
                {/* Section Header */}
                <div
                  onClick={() => toggleSection(section.id)}
                  className={`p-4 lg:px-5 flex items-center justify-between cursor-pointer select-none ${section.isExpanded
                    ? isDark
                      ? "border-b border-[#323232]"
                      : "border-b border-[#E5E5E5]"
                    : ""
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical
                      size={16}
                      className={isDark ? "text-[#6E6E6B]" : "text-black/30"}
                    />
                    <span className={`text-xs font-medium mr-2 ${isDark ? "text-[#E8D1AB]" : "text-black/60"}`}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className={`text-sm font-medium ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>
                        {section.title || "Untitled Section"}
                      </p>
                      {!section.isExpanded && section.content && (
                        <p className={`text-xs truncate max-w-xs md:max-w-md ${isDark ? "text-[#737373]" : "text-black/40"}`}>
                          {section.content}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => setSections((previous) => previous.filter((item) => item.id !== section.id))} aria-label={`Remove ${section.title || "section"}`} className="text-red-400 hover:text-red-300"><Trash2 size={18} /></button>
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className={`transition-colors ${isDark ? "text-white hover:text-white/60" : "text-black/60"}`}
                    >
                      {section.isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Section Body (Editor) */}
                {section.isExpanded && (
                  <div className="p-4 lg:p-6 space-y-4">
                    {/* Section Title */}
                    <div>
                      <label className={`block text-sm font-medium mb-1.5 ${isDark ? "text-[#A8A8A6]" : "text-black/60"}`}>
                        Section Title
                      </label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                        className={`w-full px-4 py-3 rounded-md border text-sm focus:outline-none ${isDark
                          ? "bg-[#111110] border-[#252523] text-[#E8E8E7]"
                          : "bg-[#F8F8F8] border-gray-200 text-black"
                          }`}
                      />
                    </div>
                    <RichTextEditor
                      value={section.content}
                      onChange={(content) => updateSectionContent(section.id, content)}
                      isDark={isDark}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Section Button */}
          <button
            type="button"
            onClick={handleAddSection}
            className={`w-full mt-4 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-1 transition-colors ${isDark
              ? "bg-[#E5D5B8] text-black hover:bg-[#D4C3A3]"
              : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"
              }`}
          >
            <Plus size={16} />
            Add Section
          </button>
        </div>

        <SuccessModal
          isOpen={isSuccessModalOpen}
          onClose={handleCloseModal}
        />

        {/* Floating Mobile Sticky Action Button */}
        <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={openPreview}
            title="Preview"
            variant="outline"
            className={`h-14 rounded-md font-semibold text-sm px-4 gap-2 transition-all ${isDark
              ? "bg-[#202020] border-white/10 text-white hover:bg-[#2C2C2C]"
              : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
              }`}
          >
            Preview
          </Button>
          <Button
            onClick={saveAndPublish}
            disabled={isSubmitting}
            title="Save & Publish"
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#D4C3A3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            {isSubmitting ? "Publishing..." : "Save & Publish"}
          </Button>
        </div>
      </div>
    </>
  );
}
