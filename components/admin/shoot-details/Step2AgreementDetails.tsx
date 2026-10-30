"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePickerFloating } from "@/components/admin/DatePickerFloating";
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
} from "lucide-react";
import { CPDetail, AgreementCreationMode } from "./Step1AgreementTypeSelection";
import { agreementContentPreview, agreementContentToSafeHtml } from "@/lib/utils/agreementContent";
import { formatProjectTimeValue } from "@/lib/utils/shootDetails";
import { TimePicker } from "@/components/ui/Timepicker";

const toTimePickerDate = (value: string) => {
  if (!value) return null;
  const formatted = formatProjectTimeValue(value);
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(formatted);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (hours < 1 || hours > 12 || minutes > 59) return null;
  if (meridiem === "AM" && hours === 12) hours = 0;
  if (meridiem === "PM" && hours !== 12) hours += 12;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const fromTimePickerDate = (value: Date | null) => value && !Number.isNaN(value.getTime())
  ? value.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  : "";

function ShootAgreementRichTextEditor({
  value,
  onChange,
  isDark,
}: {
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRange = useRef<Range | null>(null);
  const [activeCommands, setActiveCommands] = useState<Record<string, boolean>>({});
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const safeHtml = agreementContentToSafeHtml(value);
    if (editor.innerHTML !== safeHtml) editor.innerHTML = safeHtml;
  }, [value]);

  const rememberSelection = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) {
      savedRange.current = selection.getRangeAt(0).cloneRange();
    }
    setActiveCommands({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
    });
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !savedRange.current || !editorRef.current?.contains(savedRange.current.commonAncestorContainer)) return;
    selection.removeAllRanges();
    selection.addRange(savedRange.current);
  };

  const syncValue = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const safeHtml = agreementContentToSafeHtml(editor.innerHTML);
    if (editor.innerHTML !== safeHtml) editor.innerHTML = safeHtml;
    onChange(safeHtml);
    rememberSelection();
  };

  const runCommand = (command: "bold" | "italic" | "insertUnorderedList" | "insertOrderedList") => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false);
    syncValue();
  };

  const addLink = () => {
    const url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setLinkError("Enter a valid URL beginning with https:// or http://.");
      return;
    }
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand("createLink", false, url);
    syncValue();
    setLinkUrl("");
    setLinkError("");
    setIsLinkDialogOpen(false);
  };

  const toolClass = (active = false) => `rounded px-2 py-1 transition-colors ${active
    ? "bg-[#E8D1AB] text-black"
    : isDark ? "text-white/70 hover:bg-white/10" : "text-black/70 hover:bg-black/5"}`;

  return <>
    <div className={`flex items-center gap-1 w-full px-4 py-3 rounded-md border text-sm ${isDark ? "bg-[#111110] border-[#3D3D3D]" : "bg-[#F8F8F8] border-gray-200"}`}>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("bold")} className={toolClass(activeCommands.bold)} aria-label="Bold"><Bold size={14} /></button>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("italic")} className={toolClass(activeCommands.italic)} aria-label="Italic"><Italic size={14} /></button>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertUnorderedList")} className={toolClass(activeCommands.insertUnorderedList)} aria-label="Bulleted list"><List size={14} /></button>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertOrderedList")} className={toolClass(activeCommands.insertOrderedList)} aria-label="Numbered list"><ListOrdered size={14} /></button>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { rememberSelection(); setLinkError(""); setIsLinkDialogOpen(true); }} className={toolClass()} aria-label="Add link"><Link size={14} /></button>
    </div>
    <div className={`overflow-hidden rounded-md border ${isDark ? "bg-[#111110] border-[#3D3D3D] text-[#E8E8E7]" : "bg-[#F8F8F8] border-gray-200 text-black"}`}>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Agreement section content"
        aria-multiline="true"
        onInput={syncValue}
        onKeyUp={rememberSelection}
        onMouseUp={rememberSelection}
        onFocus={rememberSelection}
        className={`min-h-32 w-full p-4 text-sm focus:outline-none [&_a]:text-[#E8D1AB] [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 ${isDark ? "text-[#E8E8E7]" : "text-black"}`}
      />
    </div>
    {isLinkDialogOpen && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4" onMouseDown={() => setIsLinkDialogOpen(false)}>
      <div className={`w-full max-w-md rounded-xl border p-6 shadow-2xl ${isDark ? "border-[#3D3D3D] bg-[#202020] text-white" : "border-[#E5E5E5] bg-white text-black"}`} onMouseDown={(event) => event.stopPropagation()}>
        <h3 className="text-lg font-semibold">Add Link</h3>
        <p className="mt-1 text-sm opacity-60">Paste a full URL beginning with https://</p>
        <input autoFocus value={linkUrl} onChange={(event) => { setLinkUrl(event.target.value); setLinkError(""); }} onKeyDown={(event) => { if (event.key === "Enter") addLink(); }} placeholder="https://example.com" className={`mt-5 w-full rounded-md border px-3 py-2 text-sm outline-none ${isDark ? "border-[#3D3D3D] bg-[#111110]" : "border-gray-300 bg-white"}`} />
        {linkError && <p className="mt-2 text-xs text-red-400">{linkError}</p>}
        <div className="mt-5 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setIsLinkDialogOpen(false)}>Cancel</Button><Button type="button" className="bg-[#E8D1AB] text-black hover:bg-[#D4C3A3]" onClick={addLink}>Add Link</Button></div>
      </div>
    </div>}
  </>;
}

export interface ClauseSection {
  id: string;
  num: string;
  title: string;
  subtitle?: string;
  content: string;
  isExpanded: boolean;
}

interface Step2AgreementDetailsProps {
  isDark: boolean;
  selectedMode: AgreementCreationMode;
  currentCP: CPDetail;
  allCPs?: CPDetail[];
  productionDate: Date | null;
  setProductionDate: (date: Date | null) => void;
  location: string;
  setLocation: (val: string) => void;
  callTime: string;
  setCallTime: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
  sections: ClauseSection[];
  agreementVersion?: string;
  toggleSection: (id: string) => void;
  updateSectionTitle: (id: string, title: string) => void;
  updateSectionContent: (id: string, content: string) => void;
  addSection: () => void;
  removeSection: (id: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSaveDraft?: () => void;
  onPreview?: () => void;
}

export function Step2AgreementDetails({
  isDark,
  selectedMode,
  currentCP,
  allCPs = [],
  productionDate,
  setProductionDate,
  location,
  setLocation,
  callTime,
  setCallTime,
  endTime,
  setEndTime,
  sections,
  agreementVersion = "v1",
  toggleSection,
  updateSectionTitle,
  updateSectionContent,
  addSection,
  removeSection,
  onNext,
  onPrevious,
  onSaveDraft,
  onPreview,
}: Step2AgreementDetailsProps) {
  const isCommon = selectedMode === "common";
  const displayedVersion = /^v\d+$/i.test(agreementVersion)
    ? `${agreementVersion}.0`
    : agreementVersion;

  const cpList = allCPs;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className={`text-base lg:text-2xl font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>
            {isCommon ? (
              "Create Common Shoot Agreement"
            ) : (
              <>
                Agreement for {currentCP.name}{" "}
                <span className="text-[#E8D1AB] font-normal">
                  (Individual Agreement)
                </span>
              </>
            )}
          </h1>
          <p className={`text-xs lg:text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
            {isCommon
              ? "Create one agreement to be shared with the selected creative partners."
              : `${currentCP.role} • ${currentCP.assignCode}`}
          </p>
        </div>

        <Button
          type="button"
          className="flex-0 w-full lg:w-auto bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] h-10 px-5 rounded-lg font-semibold text-xs transition-all shrink-0"
        >
          Version {displayedVersion} (auto-generated)
        </Button>
      </div>

      {onSaveDraft && <div className="flex gap-4 lg:hidden">
        <Button
          onClick={onSaveDraft}
          variant="outline"
          className={`w-full rounded-lg h-12 px-4 lg:px-7 gap-2 transition-all ${isDark
            ? "bg-[#1A1A1A] border-white/10 text-white hover:bg-[#2C2C2C]"
            : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
            }`}
        > Save Draft
        </Button>

        <Button
          type="button"
          onClick={onPreview}
          className={`w-full rounded-lg h-12 px-4 lg:px-7 gap-2 transition-all ${isDark
            ? "bg-white border-white/10 text-black hover:bg-[#F0F0F0]"
            : "bg-[#1A1A1A] border-white/10 text-white hover:bg-[#2C2C2C]"
            }`}
        >
          Preview
        </Button>
      </div>}

      {/* Common Mode Specific Cards */}
      {isCommon ? (
        <>
          {/* Agreement Recipients Card */}
          <div className={`border rounded-2xl ${isDark ? "bg-[#101010] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
            <h2 className={`p-5 lg:p-9 text-base lg:text-xl font-medium rounded-2xl ${isDark ? "bg-[#090909] text-white" : "bg-[#E2E8F0]/40 text-black"}`}>
              Agreement Recipients
            </h2>
            <div className={`h-[1px] w-full border-b ${isDark ? "border-[#3D3D3D]" : "border-black/10"}`} />
            <div className="px-5 py-3 lg:p-9 flex flex-wrap items-center gap-6">
              {cpList.map((cp) => (
                <div key={cp.id} className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium border ${isDark
                      ? "bg-[#1E1E1C] text-[#A8A8A6] border-[#2A2A28]"
                      : "bg-[#F0F0F0] text-black/80"
                      }`}
                  >
                    {cp.initials}
                  </div>
                  <p className={`text-sm lg:text-base font-medium ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>
                    {cp.name}{""}
                    <span className={`ml-4 ${isDark ? "text-[#E8D1AB]" : "text-black/50"}`}>
                      {cp.role}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Project Detail Card */}
          <div className={`border rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
            <h2 className={`p-4 lg:p-9 text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
              Project Detail
            </h2>
            <div className={`h-[1px] w-full border-b ${isDark ? "border-[#3D3D3D]" : "border-black/10"}`} />
            <div className="p-4 lg:p-9 space-y-3 text-xs lg:text-sm">
              <div className={`flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-3 lg:gap-5 ${isDark ? "text-[#AAA7A7]" : "text-black/60"}`}>
                <p>
                  Project Name :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {cpList[0]?.projectName || "Wedding Videography"}
                  </span>
                </p>
                <span className="hidden lg:block">|</span>
                <p>
                  Project ID :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {cpList[0]?.projectId || "PRJ-1024"}
                  </span>
                </p>
                <span className="hidden lg:block">|</span>
                <p>
                  Assignment ID :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {cpList[0]?.assignmentId || "ASN-2012"}
                  </span>
                </p>
              </div>
              <p className={isDark ? "text-[#AAA7A7]" : "text-black/60"}>
                Creative Partner :{" "}
                <span className={isDark ? "text-[#E8D1AB]" : "text-black"}>
                  {cpList.map((cp, index) => (
                    <React.Fragment key={cp.id || index}>
                      <span>{cp.name}</span>
                      <span className={isDark ? "text-white/60" : "text-gray-500"}>
                        {` (${cp.role})`}
                      </span>
                      {index < cpList.length - 1 && (
                        <span className={isDark ? "text-white/60" : "text-gray-500"}>, </span>
                      )}
                    </React.Fragment>
                  ))}
                </span>
              </p>
            </div>
          </div>

           {/* Production Information Card */}
          <div className={`border rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
            <h2 className={`p-4 lg:p-8 text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
              Production Information
            </h2>
            <div className={`h-[1px] w-full border-b ${isDark ? "border-[#3D3D3D]" : "border-black/10"}`} />
            <div className="px-4 py-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-10">
              <DatePickerFloating
                selectedDate={productionDate}
                onDateChange={setProductionDate}
                displayFormat="MMM dd, yyyy"
                width="w-full"
                classnames={`pointer-none w-full px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] relative rounded-xl border ${isDark
                  ? "text-white placeholder:text-white/20"
                  : "text-black placeholder:text-gray-400"
                  }`}
                labelClasses={`${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"
                  } text-sm lg:text-base z-10 px-2`}
                label="Production Date"
              />

              <div
                className={`relative rounded-xl border ${isDark
                  ? "border-white/20 bg-[#171717]"
                  : "border-gray-300 bg-white"
                  }`}
              >
                <label className={`text-sm lg:text-base absolute -top-2.5 lg:-top-3.5 left-3 px-1.5 ${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"}`}>
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. General Terms of Service"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`w-full px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] ${isDark
                    ? "text-white placeholder:text-white/20"
                    : "text-black placeholder:text-gray-400"
                    }`}
                />
              </div>

              <TimePicker
                label="Call Time"
                value={toTimePickerDate(callTime)}
                onChange={(value) => setCallTime(fromTimePickerDate(value))}
                isDark={isDark}
                height={{ xs: "56px", lg: "82px" }}
                minuteStep={15}
                ampm
              />

              <TimePicker
                label="Expected End Time / Duration"
                value={toTimePickerDate(endTime)}
                onChange={(value) => setEndTime(fromTimePickerDate(value))}
                isDark={isDark}
                height={{ xs: "56px", lg: "82px" }}
                minuteStep={15}
                ampm
              />
            </div>
          </div>

          {/* Compensation Card */}
          <div className={`border rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
            <h2 className={`p-4 lg:p-9 text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
              Compensation
            </h2>
            <div className={`h-[1px] w-full border-b ${isDark ? "border-[#3D3D3D]" : "border-black/10"}`} />
            <div className="p-4 lg:p-9 space-y-4">
              {cpList.map((cp) => (
                <div
                  key={cp.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium ${isDark
                        ? "bg-[#1E1E1C] text-[#A8A8A6]"
                        : "bg-[#F0F0F0] text-black/80"
                        }`}
                    >
                      {cp.initials}
                    </div>
                    <span className={`text-sm lg:text-base font-medium ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>
                      {cp.name}
                    </span>
                  </div>

                  <div className="bg-[#E8D1AB] text-[#171717] px-3 lg:px-5 py-2.5 rounded-full text-xs flex items-center gap-1.5">
                    <span className="text-sm lg:text-base font-semibold">{cp.compensation}</span>
                    <span className="text-[#171717]/60">Compensation</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          { /* Individual Mode Project Detail Card */}
          <div className={`border rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
            <h2 className={`p-4 lg:p-8 text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
              Project Detail
            </h2>
            <div className={`h-[1px] w-full border-b ${isDark ? "border-[#3D3D3D]" : "border-black/10"}`} />
            <div className="p-4 lg:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div
                className={`w-14 h-14 lg:w-21 lg:h-21 rounded-2xl flex items-center justify-center font-semibold text-lg lg:text-3xl shrink-0 ${isDark
                  ? "bg-[#363434] text-[#E8D1AB]"
                  : "bg-[#E0E0E0] text-black/80"
                  }`}
              >
                {currentCP.initials}
              </div>
              <div className="space-y-1.5 lg:space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className={`text-lg lg:text-2xl font-semibold ${isDark ? "text-white" : "text-black"}`}>
                    {currentCP.name} ({currentCP.role})
                  </h3>
                  <div className="bg-[#E8D1AB] text-black px-4 py-1 rounded-full text-xs flex items-center gap-1">
                    <span className="font-semibold text-sm">
                      {currentCP.compensation}
                    </span>
                    <span className="opacity-70">Total Compensation</span>
                  </div>
                </div>

                <div className={`flex gap-4 text-xs lg:text-sm ${isDark ? "text-[#AAA7A7]" : "text-black/60"}`}>
                  <p>
                    Project Name :{" "}
                    <span className={isDark ? "text-white" : "text-black"}>
                      {currentCP.projectName}
                    </span>
                  </p>
                  <span className="hidden lg:block">|</span>
                  <p>
                    Project ID :{" "}
                    <span className={isDark ? "text-white" : "text-black"}>
                      {currentCP.projectId}
                    </span>
                  </p>
                  <span className="hidden lg:block">|</span>
                  <p>
                    Assignment ID :{" "}
                    <span className={isDark ? "text-white" : "text-black"}>
                      {currentCP.assignmentId}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Production Information Card */}
          <div className={`border rounded-2xl ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E2E8F0]"}`}>
            <h2 className={`p-4 lg:p-8 text-base lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
              Production Information
            </h2>
            <div
              className={`h-[1px] w-full border-b ${isDark ? "border-[#3D3D3D]" : "border-black/10"}`}
            />
            <div className="p-4 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-10">
              <DatePickerFloating
                selectedDate={productionDate}
                onDateChange={setProductionDate}
                displayFormat="MMM dd, yyyy"
                width="w-full"
                classnames={`pointer-none w-full px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] relative rounded-xl border ${isDark
                  ? "text-white placeholder:text-white/20"
                  : "text-black placeholder:text-gray-400"
                  }`}
                labelClasses={`${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"
                  } text-sm lg:text-base z-10 px-2`}
                label="Production Date"
              />

              <div
                className={`relative rounded-xl border ${isDark
                  ? "border-white/20 bg-[#171717]"
                  : "border-gray-300 bg-white"
                  }`}
              >
                <label
                  className={`absolute -top-3.5 left-3 px-1.5 ${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"
                    }`}
                >
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. General Terms of Service"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`w-full px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] ${isDark
                    ? "text-white placeholder:text-white/20"
                    : "text-black placeholder:text-gray-400"
                    }`}
                />
              </div>

              <TimePicker
                label="Call Time"
                value={toTimePickerDate(callTime)}
                onChange={(value) => setCallTime(fromTimePickerDate(value))}
                isDark={isDark}
                height={{ xs: "56px", lg: "82px" }}
                minuteStep={15}
                ampm
              />

              <TimePicker
                label="Expected End Time / Duration"
                value={toTimePickerDate(endTime)}
                onChange={(value) => setEndTime(fromTimePickerDate(value))}
                isDark={isDark}
                height={{ xs: "56px", lg: "82px" }}
                minuteStep={15}
                ampm
              />
            </div>
          </div>
        </>
      )}

      {/* Section Accordions */}
      <div className="flex flex-col gap-4">
        {sections.map((section, idx) => (
          <div
            key={section.id}
            className={`border rounded-2xl overflow-hidden transition-colors ${isDark
              ? "bg-[#171717] border-[#3D3D3D]"
              : "bg-white border-[#E5E5E5]"
              }`}
          >
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
                <span className={`text-xs font-medium mr-2 ${isDark ? "text-[#E8D1AB]" : "text-black/60" }`}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-[#E8E8E7]" : "text-black"}`}>
                    {section.title || "Untitled Section"}
                  </p>
                  {!section.isExpanded && section.content && (
                    <p className={`text-xs truncate max-w-[190px] md:max-w-md ${isDark ? "text-[#737373]" : "text-black/40"}`}>
                      {agreementContentPreview(section.content)}
                    </p>
                  )}
                </div>
              </div>

              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button type="button" onClick={() => removeSection(section.id)} aria-label={`Remove ${section.title || "section"}`} className="text-red-400 hover:text-red-300"><Trash2 size={18} /></button>
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`transition-colors ${isDark
                    ? "text-white hover:text-white/60"
                    : "text-black/60"
                    }`}
                >
                  {section.isExpanded ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
              </div>
            </div>

            {section.isExpanded && (
              <div className="p-4 lg:p-6 space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1.5 ${isDark ? "text-[#A8A8A6]" : "text-black/60"
                      }`}
                  >
                    Section Title
                  </label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) =>
                      updateSectionTitle(section.id, e.target.value)
                    }
                    className={`w-full px-4 py-3 rounded-md border text-sm focus:outline-none ${isDark
                      ? "bg-[#111110] border-[#3D3D3D] text-[#E8E8E7]"
                      : "bg-[#F8F8F8] border-gray-200 text-black"
                      }`}
                  />
                </div>

                <ShootAgreementRichTextEditor
                  value={section.content}
                  onChange={(content) => updateSectionContent(section.id, content)}
                  isDark={isDark}
                />
              </div>
            )}
          </div>
        ))}
        <Button type="button" onClick={addSection} variant="outline" className="w-full border-dashed"><Plus size={16} className="mr-2" /> Add Section</Button>
      </div>

      {/* Information Notice Bar */}
      <div
        className={`border rounded-xl p-3 flex items-center gap-3 text-sm ${isDark
          ? "bg-[#20201F] border-[#20201F] text-[#FFDE96]"
          : "bg-[#F9FAFB] border-[#E5E5E5] text-black/80"
          }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="26"
          height="24"
          viewBox="0 0 26 24"
          fill="none"
          className="shrink-0"
        >
          <path d="M12.7852 17V11" stroke="#FFDE96" strokeLinecap="round" />
          <ellipse
            cx="1.06536"
            cy="1"
            rx="1.06536"
            ry="1"
            transform="matrix(1 0 0 -1 11.7188 9)"
            fill="#FFDE96"
          />
          <path
            d="M2.13086 12C2.13086 7.28595 2.13086 4.92893 3.69104 3.46447C5.25123 2 7.7623 2 12.7845 2C17.8066 2 20.3177 2 21.8779 3.46447C23.438 4.92893 23.438 7.28595 23.438 12C23.438 16.714 23.438 19.0711 21.8779 20.5355C20.3177 22 17.8066 22 12.7845 22C7.7623 22 5.25123 22 3.69104 20.5355C2.13086 19.0711 2.13086 16.714 2.13086 12Z"
            stroke="#FFDE96"
          />
        </svg>
        <span>
          The system automatically generates:{" "}
          <span>Beige Sheet Version: {agreementVersion}</span>
        </span>
      </div>

      {/* Desktop Actions */}
      <div className="hidden lg:flex items-center gap-4 pt-4">
        <Button
          type="button"
          onClick={onPrevious}
          className={`h-18 px-12 rounded-lg border text-xl font-medium transition-colors bg-transparent ${isDark
            ? "border-white/20 text-white hover:bg-white/10"
            : "border-black/20 text-black hover:bg-black/5"
            }`}
        >
          Back
        </Button>

        <Button
          type="button"
          onClick={onNext}
          className="h-18 px-12 rounded-lg text-xl font-medium bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] transition-colors"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
