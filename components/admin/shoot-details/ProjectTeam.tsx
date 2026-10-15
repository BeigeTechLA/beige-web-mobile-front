"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { usePermissions } from "@/lib/hooks/usePermissions";
import AddPostProductionTeamModal from "./AddPostProductionTeamModal";
import EditorAvatar from "./EditorAvatar";
import { combinePostProductionEditors, type CombinedEditor } from "./combinedPostProductionEditors";
import { normalizeAssignedEditors } from "./postProductionEditorUtils";
import { removeDemoAssignment, takePendingEditorQueue, useDemoEditorAssignments } from "./postProductionDemoStore";

import "swiper/css";
import "swiper/css/effect-coverflow";

interface Props {
  projectId: string;
  assignedMembers?: unknown[];
  onRequestAssignment?: (continueAction: () => void) => void;
  onMembersChanged?: () => void | Promise<void>;
  projectName?: string;
  shootLabel?: string;
}

export default function ProjectTeam({ projectId, assignedMembers, projectName, shootLabel, onRequestAssignment }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, resolvedTheme } = useTheme();
  const { canCreate, canEdit } = usePermissions("shoots");
  const assignments = useDemoEditorAssignments(projectId);
  const existing = useMemo(() => normalizeAssignedEditors(assignedMembers), [assignedMembers]);
  const editors = useMemo(() => combinePostProductionEditors(existing, assignments), [existing, assignments]);
  const isDark = (resolvedTheme ?? theme) === "dark";
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "change">("add");
  const [replaceId, setReplaceId] = useState<number | null>(null);
  const [resumeIds, setResumeIds] = useState<number[]>([]);
  const [removeEditor, setRemoveEditor] = useState<CombinedEditor | null>(null);
  const hasResumed = useRef(false);

  const selected = editors[Math.min(activeIndex, Math.max(0, editors.length - 1))];
  const canAdd = canCreate || canEdit;

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, editors.length - 1)));
  }, [editors.length]);

  useEffect(() => {
    const flag = searchParams.get("resumeEditorFlow");
    if (flag !== "1") { hasResumed.current = false; return; }
    if (hasResumed.current) return;
    hasResumed.current = true;
    const remaining = takePendingEditorQueue(projectId);
    router.replace(`/admin/shoots/${encodeURIComponent(projectId)}?tab=Overview`, { scroll: false });
    if (!remaining.length) return;
    setMode("add");
    setReplaceId(null);
    setResumeIds(remaining);
    setIsPickerOpen(true);
  }, [searchParams, router, projectId]);

  const openPicker = (nextMode: "add" | "change" = "add", id: number | null = null) => {
    if ((nextMode === "add" && !canAdd) || (nextMode === "change" && !canEdit)) return;
    const proceed = () => {
      setMode(nextMode);
      setReplaceId(id);
      setResumeIds([]);
      setIsPickerOpen(true);
    };
    if (nextMode === "add" && onRequestAssignment) {
      onRequestAssignment(proceed);
      return;
    }
    proceed();
  };

  const remove = () => {
    if (!removeEditor || !canEdit) return;
    if (removeEditor.source === "api") {
      toast.error("API-backed editor records cannot be changed in the static demo.");
    } else {
      removeDemoAssignment(projectId, removeEditor.id);
      setActiveIndex(0);
      toast.success("Demo editor removed from this shoot.");
    }
    setRemoveEditor(null);
  };

  const secondary = isDark ? "bg-[#202020] text-white hover:bg-[#303030]" : "bg-[#F0F0F0] text-black hover:bg-[#E3E3E3]";

  return (
    <div className={`relative flex min-h-[360px] flex-col overflow-hidden rounded-xl border sm:min-h-[425px] ${isDark ? "border-[#222222] bg-[#101010] text-white" : "border-[#E5E5E5] bg-[#F8F8F8] text-[#171717]"}`} style={{ fontFamily: "var(--font-instrument-sans)" }}>
      <header className={`relative flex min-h-[70px] items-center justify-center border-b border-dashed px-4 py-4 ${isDark ? "border-[#333333]" : "border-[#DADADA]"}`}>
        <h3 className="text-center text-base font-medium sm:text-lg">Project Post Production Team</h3>
        {editors.length > 0 && <button type="button" onClick={() => openPicker()} disabled={!canAdd} aria-label="Add another editor" className="absolute right-3 rounded-full p-1.5 text-[#E8D1AB] hover:bg-white/10 disabled:opacity-40"><Plus size={18}/></button>}
      </header>

      {editors.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-5 text-center">
          <button type="button" onClick={() => openPicker()} disabled={!canAdd} aria-label="Add Post Production Team" className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8D1AB] text-black transition-transform hover:scale-105 disabled:opacity-40 sm:h-20 sm:w-20"><Plus size={37} strokeWidth={1.6}/></button>
          <h4 className={`text-base font-medium sm:text-lg ${isDark ? "text-[#E8D1AB]" : "text-[#936D3A]"}`}>Add Post Production Team</h4>
          <p className={`max-w-[290px] text-xs leading-5 ${isDark ? "text-[#777777]" : "text-[#666666]"}`}>Internal editors assign directly. External editors continue through compensation and a Shoot Agreement.</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-3 pt-4 pb-5 sm:pt-5">
          <div className="w-full max-w-full">
            <Swiper key={editors.map((item) => `${item.source}-${item.id}`).join("-")} effect="coverflow" grabCursor centeredSlides slidesPerView="auto"
              coverflowEffect={{ rotate: 0, stretch: 0, depth: 90, modifier: 2, slideShadows: false }} modules={[EffectCoverflow]}
              onSlideChange={(swiper: SwiperInstance) => setActiveIndex(swiper.activeIndex)} className="w-full">
              {editors.map((editor, index) => (
                <SwiperSlide key={`${editor.source}-${editor.id}`} className={`!h-[165px] !w-[205px] overflow-hidden rounded-xl transition-opacity sm:!h-[190px] sm:!w-[230px] ${index === activeIndex ? "opacity-100" : "opacity-45"}`}>
                  <EditorAvatar name={editor.name} avatarUrl={editor.avatarUrl} className="h-full w-full text-4xl" rounded="rounded-none" />
                  {canEdit && index === activeIndex && editor.source === "preview" && <button type="button" onClick={() => setRemoveEditor(editor)} aria-label={`Remove ${editor.name}`} className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[#FF6467] text-white hover:bg-[#E54F52]"><Trash2 size={15}/></button>}
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          <div className="mt-3 max-w-full text-center">
            <h4 className="truncate text-base font-semibold sm:text-lg">{selected?.name}</h4>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${isDark ? "border-[#373329] bg-[#201D19] text-[#E8D1AB]" : "border-[#E3D3B8] bg-[#F7EBD9] text-[#78572A]"}`}>{selected?.category === "internal" ? "Internal Editor" : selected?.category === "external" ? "External Editor" : "Editor"}</span>
              {selected?.source === "preview" && <span className="rounded-full border border-[#806641] px-2 py-1 text-[10px] text-[#C6A675]">Demo</span>}
            </div>
          </div>
          <div className="mt-4 grid w-full grid-cols-2 gap-2 px-2 sm:gap-3 sm:px-3">
            <Button type="button" onClick={() => selected?.source === "preview" && openPicker("change", selected.id)} disabled={!canEdit || selected?.source !== "preview"} className="h-10 rounded-lg bg-[#E8D1AB] px-2 text-xs font-semibold text-black hover:bg-[#D9C39F] disabled:opacity-40 sm:text-sm">Change</Button>
            <Button type="button" onClick={() => selected && setRemoveEditor(selected)} disabled={!canEdit || selected?.source !== "preview"} className={`h-10 rounded-lg px-2 text-xs font-semibold disabled:opacity-40 sm:text-sm ${isDark ? "bg-[#2A1317] text-[#F0707A]" : "bg-[#FCE7E9] text-[#AE3139]"}`}>Remove</Button>
          </div>
          <p className={`mt-3 px-3 text-center text-xs ${isDark ? "text-[#777777]" : "text-[#666666]"}`}>External editors require compensation and an agreement.</p>
        </div>
      )}

      <AddPostProductionTeamModal isOpen={isPickerOpen} projectId={projectId} isDark={isDark} mode={mode} replaceMemberId={replaceId}
        assignedMemberIds={editors.map((item) => item.id)} projectName={projectName} shootLabel={shootLabel}
        resumeEditorIds={resumeIds} onClose={() => { setIsPickerOpen(false); setResumeIds([]); }} />

      <Dialog open={removeEditor !== null} onOpenChange={(open: boolean) => { if (!open) setRemoveEditor(null); }}>
        <DialogContent className={`z-[130] flex max-h-[calc(100dvh_-_24px)] w-[calc(100vw_-_24px)] max-w-[450px] flex-col gap-0 overflow-hidden rounded-2xl border p-0 [&>button]:hidden ${isDark ? "border-[#3A3A3A] bg-black text-white" : "border-[#E5E5E5] bg-white text-black"}`}>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-6 pb-4 sm:px-6">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#331B1D] text-[#F07979]"><AlertCircle size={20}/></span><DialogTitle className="text-xl font-medium">Remove Editor?</DialogTitle></div>
            <DialogDescription className="mt-4 text-sm leading-6 text-[#999999]">Remove <span className="font-medium text-[#E8D1AB]">{removeEditor?.name}</span> as Editor from this shoot?</DialogDescription>
            <p className="mt-2 text-sm leading-6 text-[#999999]">This only removes the local demo assignment. No email will be sent.</p>
          </div>
          <footer className="grid shrink-0 grid-cols-2 gap-3 px-5 pb-6 sm:px-6"><Button type="button" onClick={() => setRemoveEditor(null)} className={`h-11 rounded-lg ${secondary}`}>Cancel</Button><Button type="button" onClick={remove} className="h-11 rounded-lg bg-[#E8D1AB] text-black hover:bg-[#D9C39F]">Remove</Button></footer>
        </DialogContent>
      </Dialog>
    </div>
  );
}
