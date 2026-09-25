"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  GripVertical,
  MoreHorizontal,
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

interface Section {
  id: string;
  title: string;
  content: string;
  isExpanded: boolean;
}

export default function AdminCreateGeneralAgreementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Form State
  const [agreementName, setAgreementName] = useState("");
  const [agreementTitle, setAgreementTitle] = useState("");
  const [description, setDescription] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<Date | null>(null);

  // Success Modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

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
    const newId = String(sections.length + 1);
    setSections((prev) => [
      ...prev,
      {
        id: newId,
        title: `Section ${newId.padStart(2, "0")}`,
        content: "",
        isExpanded: true,
      },
    ]);
  };

  if (!mounted) return null;

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <>
            <Button
              onClick={() => router.push("/admin/agreements")}
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
              onClick={() => router.push("/admin/agreements")}
              title="Save & Send"
              className={`h-12 px-4 lg:px-7 font-medium transition-colors ${isDark
                ? "bg-[#E5D5B8] text-black hover:bg-[#D4C3A3]"
                : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"
                }`}
            >
              Save & Send
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
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Add a brief description of the agreement and its purpose."
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
                width="w-full"
                classnames={`w-full px-4 py-3.5 bg-transparent text-base focus:outline-none h-14 lg:h-[82px] relative rounded-xl border ${isDark ? "text-white placeholder:text-white/20" : "text-black placeholder:text-gray-400"}`}
                labelClasses={`${isDark ? "bg-[#171717] text-white/60" : "bg-white text-gray-600"} text-sm lg:text-base z-10 px-1`}
                label="MeetEffectiveing Date"
              />
              <p className={`text-xs mt-1.5 ${isDark ? "text-white/40" : "text-gray-500"}`}>
                The date from which this agreement becomes effective.
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
                    <button
                      type="button"
                      className={`transition-colors ${isDark ? "text-white hover:text-white/60" : "text-black/60"}`}
                    >
                      <MoreHorizontal size={18} />
                    </button>
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
                    {/* Rich Editor Toolbar */}
                    <div className={`flex items-center gap-1 w-full px-4 py-3 rounded-md border text-sm focus:outline-none ${isDark
                      ? "bg-[#111110] border-[#252523] text-[#E8E8E7]"
                      : "bg-[#F8F8F8] border-gray-200 text-black"
                      }`}>
                      <button
                        type="button"
                        className={`py-0.5 px-2 rounded transition-colors ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/5 text-black/70"}`}
                      >
                        <Bold size={14} />
                      </button>
                      <button
                        type="button"
                        className={`py-0.5 px-2 rounded transition-colors ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/5 text-black/70"}`}
                      >
                        <Italic size={14} />
                      </button>
                      <button
                        type="button"
                        className={`py-0.5 px-2 rounded transition-colors ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/5 text-black/70"
                          }`}
                      >
                        <List size={14} />
                      </button>
                      <button
                        type="button"
                        className={`py-0.5 px-2 rounded transition-colors ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/5 text-black/70"
                          }`}
                      >
                        <ListOrdered size={14} />
                      </button>
                      <button
                        type="button"
                        className={`py-0.5 px-2 rounded transition-colors ${isDark ? "hover:bg-white/10 text-white/70" : "hover:bg-black/5 text-black/70"
                          }`}
                      >
                        <Link size={14} />
                      </button>
                    </div>

                    <div className={`border rounded-md overflow-hidden ${isDark
                      ? "bg-[#111110] border-[#252523] text-[#E8E8E7]"
                      : "bg-[#F8F8F8] border-gray-200 text-black"
                      }`}>
                      {/* Content Field */}
                      <textarea
                        rows={4}
                        value={section.content}
                        onChange={(e) => updateSectionContent(section.id, e.target.value)}
                        placeholder="Write section content here..."
                        className={`w-full p-4 bg-transparent text-sm focus:outline-none resize-none ${isDark ? "text-white placeholder:text-white/30" : "text-black placeholder:text-gray-400"}`}
                      />
                    </div>
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
            onClick={() => router.push("/admin/agreements")}
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
            onClick={() => router.push("/admin/agreements")}
            title="Save & Send"
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#D4C3A3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            Save & Send
          </Button>
        </div>
      </div>
    </>
  );
}