"use client";

import React, { useState, useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/lib/hooks/usePermissions";
import AssignEditorModal, { DUMMY_EDITORS, EditorTypeBadge, editorInitials, type Editor } from "./AssignEditorModal";
import EditorAssignmentConfirmationModal, { DUMMY_EDITOR_SHOOT, type EditorShootSummary } from "./EditorAssignmentConfirmationModal";
import EditorAssignmentSuccessModal from "./EditorAssignmentSuccessModal";
import EditorRemovalConfirmationModal from "./EditorRemovalConfirmationModal";
import AddEditorCompensationModal, { type CompensationShoot, type EditorCompensationPayload } from "./AddEditorCompensationModal";
import SuccessModal from "../finances/SuccessModal";

import "swiper/css";
import "swiper/css/effect-coverflow";
import { Button } from "@/components/ui/button";

/* Types */

// A team member is an assigned editor (+ the card tile colour)
type TeamMember = Editor & { bgColor: string };

const BG_COLORS = ["bg-[#EAFCDB]", "bg-[#F3E8FF]", "bg-[#E0F2FE]", "bg-[#FCE7F3]", "bg-[#FFFAC2]"];

// Assign flow
//   Internal editors: select -> confirm ("Assign & Continue" / "Assign Editor") -> success
//   External editors: confirm ("Add Compensation") -> AddCompensationModal (owned by the page) -> added
//   Internals are handled first (together), then each external one at a time.
type Step = "select" | "confirm" | "success" | "compensation" | "compensationSuccess" | null;

// Dummy "API" calls – swap for adminApi calls later
const fakeRequest = (ms = 700) => new Promise<void>((r) => setTimeout(r, ms));

interface ProjectTeamProps {
  projectId: string;
  // assignedMembers?: AssignedPostProductionMember[];
  initialEditors?: Editor[];
  assignedEditors?: Editor[];
  onEditorsChange?: (editors: Editor[]) => void;
  editors?: Editor[];
  shoot?: EditorShootSummary;
  onRequestAssignment?: (continueAction: () => void) => void;
  compensationShoot?: CompensationShoot;
  onSubmitCompensation?: (editor: Editor, payload: EditorCompensationPayload) => Promise<void>;
  onAddShootAgreement?: (editor: Editor, payload: EditorCompensationPayload) => void;
  onAddCompensation?: (editor: Editor) => Promise<boolean>;
}

// Dummy budget: $50,000 shoot, two editors sharing the 25% pool, one already at $6,250
const DUMMY_COMPENSATION_SHOOT: CompensationShoot = {
  bookingId: 87,
  name: "Lana Guzman (Videography)",
  shootAmount: 50000,
  existingCompensation: 6250,
  splitCount: 2,
};

const dummySubmitCompensation = async () => {
  await fakeRequest(800);
};

export default function ProjectTeam({
  projectId,
  initialEditors = [],
  assignedEditors,
  onEditorsChange,
  editors = DUMMY_EDITORS,
  shoot = DUMMY_EDITOR_SHOOT,
  onRequestAssignment,
  compensationShoot = DUMMY_COMPENSATION_SHOOT,
  onSubmitCompensation = dummySubmitCompensation,
  onAddShootAgreement,
  onAddCompensation,
}: ProjectTeamProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { canEdit, canCreate } = usePermissions("shoots");
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  // Assign Editor flow
  const [step, setStep] = useState<Step>(null);
  const [pendingEditors, setPendingEditors] = useState<Editor[]>([]);
  const [replaceMemberId, setReplaceMemberId] = useState<number | null>(null); // set when "Change" was clicked
  const [externalQueue, setExternalQueue] = useState<Editor[]>([]); // externals still to set up
  const replaceRef = useRef<number | null>(null); // slot to replace (used once, by the first editor added)

  // External editor compensation (built-in drawer)
  const [compEditor, setCompEditor] = useState<Editor | null>(null);
  const [compQueue, setCompQueue] = useState<Editor[]>([]); // externals after compEditor
  const [compSubmitting, setCompSubmitting] = useState(false);
  const [compSubmitted, setCompSubmitted] = useState<EditorCompensationPayload | null>(null); // set after "Submit To Finance" succeeds

  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep the slider on the active editor after adding / changing / removing
  useEffect(() => {
    const swiper = swiperRef.current;
    if (swiper && !swiper.destroyed && swiper.activeIndex !== activeIndex) {
      swiper.update();
      swiper.slideTo(activeIndex);
      }
  }, [teamMembers, activeIndex]);

  // Dummy load
  useEffect(() => {
    const t = setTimeout(() => {
      setTeamMembers((assignedEditors ?? initialEditors).map((e, i) => ({ ...e, bgColor: BG_COLORS[i % BG_COLORS.length] })));
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Tell the page whenever the team changes (after the first load)
  const onEditorsChangeRef = useRef(onEditorsChange);
  onEditorsChangeRef.current = onEditorsChange;
  useEffect(() => {
    if (loading) return;
    onEditorsChangeRef.current?.(teamMembers.map(({ bgColor: _bg, ...editor }) => editor));
  }, [teamMembers, loading]);

  // Pick up changes made outside this card (e.g. "Remove Editor" in the Editor Assignment table)
  const assignedKey = assignedEditors?.map((e) => e.id).join(",");
  useEffect(() => {
    if (loading || !assignedEditors) return;
    setTeamMembers((prev) => {
      if (prev.map((m) => m.id).join(",") === assignedKey) return prev;
      const next = assignedEditors.map((e, i) => ({
        ...e,
        bgColor: prev.find((m) => m.id === e.id)?.bgColor ?? BG_COLORS[i % BG_COLORS.length],
      }));
      setActiveIndex((cur) => (next.length === 0 ? 0 : Math.min(cur, next.length - 1)));
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedKey, loading]);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  /* ---------------- Assign / Change ---------------- */

  const openSelect = (replaceId: number | null = null) => {
    if (!canCreate) return;
    const start = () => {
      setReplaceMemberId(replaceId);
      replaceRef.current = replaceId;
      setExternalQueue([]);
      setPendingEditors([]);
      setStep("select");
    };
    if (onRequestAssignment) {
      onRequestAssignment(start);
      return;
    }
    start();
  };

  const closeFlow = () => {
    setStep(null);
    setCompEditor(null);
    setCompQueue([]);
    setCompSubmitting(false);
    setCompSubmitted(null);
    setPendingEditors([]);
    setReplaceMemberId(null);
    setExternalQueue([]);
    replaceRef.current = null;
  };

  // Add editors to the card (replacing the "Change" slot once, if any)
  const addToTeam = (chosen: Editor[]) => {
    const replaceId = replaceRef.current;
    replaceRef.current = null;
    setTeamMembers((prev) => {
      const base = replaceId !== null ? prev.filter((m) => m.id !== replaceId) : prev;
      const insertAt = replaceId !== null ? Math.max(0, prev.findIndex((m) => m.id === replaceId)) : base.length;
      const added = chosen
        .filter((e) => !base.some((m) => m.id === e.id))
        .map((e, i) => ({ ...e, bgColor: BG_COLORS[(base.length + i) % BG_COLORS.length] }));
      const next = [...base.slice(0, insertAt), ...added, ...base.slice(insertAt)];
      setActiveIndex(Math.min(insertAt, Math.max(0, next.length - 1)));
      return next;
    });
  };

  // Show the confirmation for the next external editor, or finish
  const startNextExternal = (queue: Editor[]) => {
    if (!queue.length) {
      closeFlow();
      return;
    }
    setPendingEditors([queue[0]]);
    setExternalQueue(queue.slice(1));
    setStep("confirm");
  };

  // Step 1 -> 2: internals first (together), externals queued
  const handleContinue = (chosen: Editor[]) => {
    const internals = chosen.filter((e) => e.type === "internal");
    const externals = chosen.filter((e) => e.type === "external");
    if (internals.length) {
      setPendingEditors(internals);
      setExternalQueue(externals);
      setStep("confirm");
    } else {
      startNextExternal(externals);
    }
  };

  const pendingIsExternal = pendingEditors.length > 0 && pendingEditors.every((e) => e.type === "external");

  // Step 2 -> 3
  const handleConfirm = async (chosen: Editor[]) => {
    if (chosen.every((e) => e.type === "external")) {
      const editor = chosen[0];
      const queue = externalQueue;

      // Optional override: page-owned compensation UI
      if (onAddCompensation) {
      setStep("compensation");
      void (async () => {
        let ok = false;
        try {
          ok = await onAddCompensation(editor);
        } catch (error) {
          console.error("Compensation failed:", error);
          toast.error("Failed to add compensation");
        }
        if (!ok) {
            closeFlow();
          return;
        }
        addToTeam([editor]);
        startNextExternal(queue);
      })();
        return;
      }

      // Built-in: open the Add Compensation drawer for this editor
      setCompEditor(editor);
      setCompQueue(queue);
      setCompSubmitted(null);
      setStep("compensation");
      return;
    }

    // Internal: assign directly (dummy request; throw to show the error in the modal)
    await fakeRequest();
    addToTeam(chosen);
    setStep("success");
  };

  /* ---------------- External: compensation ---------------- */

  // "Back" in the drawer -> back to this editor's confirmation
  const backToConfirm = () => {
    if (!compEditor || compSubmitted) return closeFlow(); // already submitted & added -> nothing to go back to
    setPendingEditors([compEditor]);
    setExternalQueue(compQueue);
    setStep("confirm");
  };

  const submitCompensation = async (payload: EditorCompensationPayload) => {
    if (!compEditor) return false;
    try {
      setCompSubmitting(true);
      await onSubmitCompensation(compEditor, payload);
      addToTeam([compEditor]);
      setCompSubmitted(payload);
      return true;
    } catch (error) {
      console.error("Compensation submit failed:", error);
      toast.error(error instanceof Error && error.message ? error.message : "Failed to submit compensation");
      return false;
    } finally {
      setCompSubmitting(false);
    }
  };

  // "Submit To Finance" -> "Request Sent Successfully"
  const handleSubmitToFinance = async (payload: EditorCompensationPayload) => {
    if (compSubmitted) return;
    if (await submitCompensation(payload)) setStep("compensationSuccess");
  };

  // After submission: hand over to the shoot agreement page
  // (SuccessModal closed, or "Add Shoot Agreement" clicked in the drawer)
  const goToShootAgreement = () => {
    const editor = compEditor;
    const payload = compSubmitted;
    if (!editor || !payload) return closeFlow();
    if (!onAddShootAgreement) {
      // No agreement page wired -> carry on with the next External editor (or finish)
      setCompEditor(null);
      setCompSubmitted(null);
      startNextExternal(compQueue);
      return;
    }
      closeFlow();
      onAddShootAgreement(editor, payload);
  };

  // Called by the Remove Editor modal. Throws on failure so the modal shows the error.
  const handleRemoveMember = async (memberId: number) => {
    if (!canEdit) return;
    try {
      setRemovingMemberId(memberId);
      await fakeRequest(500); // dummy request – swap for the API call later
      setTeamMembers((prev) => {
        const updated = prev.filter((member) => member.id !== memberId);
        setActiveIndex((current) => (updated.length === 0 ? 0 : Math.min(current, updated.length - 1)));
        return updated;
      });
      setIsRemoveModalOpen(false);
      setSelectedMemberId(null);
      toast.success("Editor removed successfully");
    } catch (error) {
      console.error("Failed to remove editor:", error);
      throw new Error("Failed to remove editor. Please try again.");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const closeRemoveModal = () => {
    if (removingMemberId !== null) return;
    setIsRemoveModalOpen(false);
    setSelectedMemberId(null);
  };

  const askRemove = (memberId: number) => {
    setSelectedMemberId(memberId);
    setIsRemoveModalOpen(true);
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className={`rounded-2xl border h-full flex items-center justify-center transition-colors duration-300 ${isDark ? "bg-[#111111] border-[#222222]" : "bg-white border-[#E5E5E5]"}`}>
        <Loader2 className={`animate-spin ${isDark ? "text-white/20" : "text-black/10"}`} size={32} />
      </div>
    );
  }

  const hasTeam = teamMembers.length > 0;
  const activeMember = teamMembers[activeIndex];

  return (
    <div
      className={`rounded-2xl h-full flex flex-col items-center justify-center relative overflow-hidden py-6 transition-all duration-300 ${isDark ? "bg-[#111111] border border-[#222222]" : "bg-[#F4F5F7]"}`}
      style={{ fontFamily: 'var(--font-instrument-sans)' }}
    >

      {/* Header */}
      <h3 className={cn(
        "text-lg font-medium mb-4 absolute top-6 z-10 transition-colors duration-300",
        isDark ? "text-white" : "text-black"
      )}>
        Project Post Production Team
      </h3>

      <div className={cn(
        "w-full h-px border-t absolute top-20 left-0 transition-colors duration-300",
        isDark ? "border-[#333333]" : "border-[#E5E5E5]"
      )} />

      {/* Remove Editor confirmation */}
      <EditorRemovalConfirmationModal
        open={isRemoveModalOpen}
        editor={teamMembers.find((m) => m.id === selectedMemberId) ?? null}
        onClose={closeRemoveModal}
        onConfirm={(editor) => handleRemoveMember(editor.id)}
      />

      {/* Step 1: Assign Editor (multi-select for Add, single-select for Change) */}
      <AssignEditorModal
        open={step === "select"}
        onClose={closeFlow}
        onContinue={handleContinue}
        editors={editors}
        assignedIds={teamMembers.map((m) => m.id).filter((id) => id !== replaceMemberId)}
        initialSelectedIds={pendingEditors.map((e) => e.id)}
        selectionMode={replaceMemberId !== null ? "single" : "multiple"}
        title={replaceMemberId !== null ? "Change Editor" : "Assign Editor"}
      />

      {/* Step 2: confirm */}
      <EditorAssignmentConfirmationModal
        open={step === "confirm"}
        editors={pendingEditors}
        shoot={shoot}
        onClose={closeFlow}
        onConfirm={handleConfirm}
        confirmLabel={
          pendingIsExternal
            ? "Add Compensation"
            : externalQueue.length > 0
              ? "Assign & Continue"
              : undefined
        }
      />

      {/* Step 3 (internal): success – "Continue" moves on to the next (external) editor */}
      <EditorAssignmentSuccessModal
        open={step === "success"}
        editors={pendingEditors}
        shoot={shoot}
        onClose={closeFlow}
        nextEditor={externalQueue[0] ?? null}
        onContinue={() => startNextExternal(externalQueue)}
      />

      {/* External editor: Add Compensation drawer */}
      <AddEditorCompensationModal
        // stays open underneath the "Request Sent" SuccessModal
        isOpen={(step === "compensation" || step === "compensationSuccess") && !!compEditor}
        onClose={closeFlow}
        onBack={backToConfirm}
        editor={compEditor ? {
          id: compEditor.id,
          name: compEditor.name,
          role: compEditor.type === "external" ? "External Editor" : "Internal Editor",
          avatarUrl: compEditor.avatarUrl,
          avatarBg: compEditor.avatarBg,
        } : null}
        shoot={compensationShoot}
        isSubmitting={compSubmitting}
        onSubmit={handleSubmitToFinance}
        isSubmitted={!!compSubmitted}
        onAddShootAgreement={onAddShootAgreement ? goToShootAgreement : undefined}
      />

      {/* External editor: "Request Sent Successfully" (reusable SuccessModal) */}
      <SuccessModal
        isOpen={step === "compensationSuccess"}
        title="Request Sent Successfully"
        subtext="This compensation request is now sent to the Finance for approval."
        // No button in the design: clicking outside closes it -> shoot agreement page
        buttonText=""
        onSubmit={goToShootAgreement}
      />

      {!hasTeam && (
        <div className="flex flex-col items-center justify-center h-full mt-16 relative py-10 lg:py-0">
          <button
            onClick={() => openSelect()}
            disabled={!canCreate}
            className={cn(
              "w-15 h-15 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mb-6 hover:scale-105 transition-all shadow-lg disabled:cursor-not-allowed disabled:opacity-40",
              isDark ? "bg-[#E8D1AB] shadow-[#E8D1AB]/10" : "bg-[#E8D1AB] shadow-[#E8D1AB]/20"
            )}
            title={canCreate ? "Add Post Production Team" : "Create permission not allowed"}
          >
            <Plus className="w-7 lg:w-10 h-7 lg:h-10 text-[#333]" />
          </button>
          <h4 className={cn(
            "text-base font-medium leading-none",
            isDark ? "text-[#E8D1AB]" : "text-[#000]"
          )}>
            {canCreate ? "Add Post Production Team" : "Create permission not allowed"}
          </h4>
        </div>
      )}

      {hasTeam && (
        <>
          {/* Add Button in Top Right */}
          <button
            onClick={() => openSelect()}
            disabled={!canCreate}
            className={cn(
              "absolute top-6 right-6 z-30 transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              isDark ? "text-[#E8D1AB] hover:text-white" : "text-[#E8D1AB] hover:text-black"
            )}
            title={canCreate ? "Add Post Production Team" : "Create permission not allowed"}
            aria-label="Add Post Production Team"
          >
            <Plus size={24} />
          </button>

          {/* Slider Section - Swiper Coverflow */}
          <div className="w-full h-[270px] mt-24 relative z-10">
            <Swiper
              key={teamMembers.map((m) => m.id).join("-")} // re-init cleanly when editors are added / removed
              effect="coverflow"
              modules={[EffectCoverflow]}
              grabCursor
              centeredSlides
              slidesPerView="auto"
              spaceBetween={0}
              slideToClickedSlide
              watchSlidesProgress
              observer
              observeParents
              initialSlide={Math.min(activeIndex, teamMembers.length - 1)}
              coverflowEffect={{
                rotate: 35,        // classic coverflow tilt
                stretch: 0,
                depth: 140,        // pushes side cards back
                modifier: 1,
                scale: 0.9,        // side cards slightly smaller
                slideShadows: true,
              }}
              className={cn(
                "w-full h-full project-team-swiper !py-2",
                // dim the side cards; Swiper handles the 3D transforms
                "[&_.swiper-slide]:transition-opacity [&_.swiper-slide]:duration-300",
                "[&_.swiper-slide:not(.swiper-slide-active)]:opacity-50",
                // softer coverflow shadows that suit the dark card
                "[&_.swiper-slide-shadow-left]:!bg-[linear-gradient(to_left,rgba(0,0,0,0.45),transparent)]",
                "[&_.swiper-slide-shadow-right]:!bg-[linear-gradient(to_right,rgba(0,0,0,0.45),transparent)]"
              )}
              onSwiper={(swiper) => { swiperRef.current = swiper; }}
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
            >
              {teamMembers.map((member, index) => (
                <SwiperSlide
                  key={member.id}
                  className={cn(
                    // fixed card size; no Tailwind transforms here (they would fight Swiper's)
                    "relative !w-[230px] sm:!w-[260px] !h-[250px] rounded-2xl overflow-hidden shadow-lg",
                    member.bgColor
                  )}
                >
                  {canEdit && activeIndex === index && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        askRemove(member.id);
                      }}
                      disabled={removingMemberId === member.id}
                      className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-[#FF6467] text-white hover:bg-[#e60000] flex items-center justify-center transition-all shadow-md shrink-0"
                      aria-label="Remove"
                      title="Remove"
                    >
                      {removingMemberId === member.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} strokeWidth={2.5} />
                      )}
                    </button>
                  )}
                  <div className="w-full h-full flex items-center justify-center select-none">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} draggable={false} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl font-bold text-black/85">{editorInitials(member.name || "U")}</span>
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Text Info */}
          <div className="mt-auto mb-4 text-center z-10 relative flex flex-col items-center">
            <h4 className={cn(
              "text-base lg:text-lg font-semibold leading-none tracking-normal transition-all duration-300",
              isDark ? "text-white" : "text-black"
            )}>
              {activeMember?.name}
            </h4>
            {activeMember && (
              <EditorTypeBadge type={activeMember.type} isDark={isDark} long className="mt-3 px-3.5 py-1 text-xs" />
            )}
          </div>

          {/* Change / Remove (act on the editor in front) */}
          <div className="w-full grid grid-cols-2 gap-3 px-6 mb-2 relative z-10">
            <Button
              type="button"
              className="h-12 text-sm font-semibold bg-[#E8D1AB] text-black hover:bg-[#D4C3A3]"
              onClick={() => activeMember && openSelect(activeMember.id)}
              disabled={!canCreate || !activeMember}
              title={canCreate ? "Change editor" : "Create permission not allowed"}
            >
              Change
            </Button>
            <Button
              type="button"
              className={cn(
                "h-12 text-sm font-semibold",
                isDark ? "bg-[#EF4444]/10 hover:bg-[#341C1C] text-[#FD6D6D]" : "bg-[#FDECEA] hover:bg-[#FBE0DC] text-[#C8392B]"
              )}
              onClick={() => activeMember && askRemove(activeMember.id)}
              disabled={!canEdit || !activeMember || removingMemberId !== null}
              title={canEdit ? "Remove editor" : "Edit permission not allowed"}
            >
              Remove
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
