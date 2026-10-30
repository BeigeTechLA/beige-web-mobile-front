"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter, usePathname, useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";

import Topbar from "@/components/admin/Topbar";
import { SendAgreementModal } from "@/components/admin/shoot-details/SendAgreementModal";
import ShootAgreementSuccessModal from "@/components/admin/shoot-details/ShootAgreementSuccessModal";

import {
  Step1ModeSelection,
  CPDetail,
  AgreementCreationMode,
} from "@/components/admin/shoot-details/Step1AgreementTypeSelection";
import {
  Step2AgreementDetails,
  ClauseSection,
} from "@/components/admin/shoot-details/Step2AgreementDetails";
import { Step3ReviewAgreement } from "@/components/admin/shoot-details/Step3ReviewAgreement";
import { getProject } from "@/lib/api";
import { agreementApi } from "@/lib/api/agreements";
import { getPrimaryRoleLabel } from "@/lib/utils/shootDetails";
import { shootAgreementPlanKey, type ShootAgreementPlan } from "@/lib/shootAgreementPlan";

type ShootBooking = { event_date?: string; event_location?: string; location?: string; start_time?: string; end_time?: string; project_name?: string };
type ShootAssignment = { id: number; crew_member_id: number; crew_accept?: number; is_active?: number; first_name?: string; last_name?: string; name?: string; primary_role?: unknown; role?: unknown; role_name?: string; crew_member?: ShootAssignment; creator?: ShootAssignment };

export default function AdminAgreementDetailsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Flow & Mode States
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedMode, setSelectedMode] =
    useState<AgreementCreationMode>("individual");
  const [activeCpIndex, setActiveCpIndex] = useState<number>(0);
  const [reviewCpIndex, setReviewCpIndex] = useState<number>(0);

  // Form Fields State
  const [productionDate, setProductionDate] = useState<Date | null>(null);
  const [location, setLocation] = useState("");
  const [callTime, setCallTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Modal States
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [cpList, setCpList] = useState<CPDetail[]>([]);
  const [pendingPlan, setPendingPlan] = useState<ShootAgreementPlan | null>(null);
  const [isLoadingShoot, setIsLoadingShoot] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [draftAgreementIds, setDraftAgreementIds] = useState<Record<string, number>>({});
  const [sentAgreementIds, setSentAgreementIds] = useState<number[]>([]);
  const [revisionSourceId, setRevisionSourceId] = useState<number | null>(null);
  const [agreementVersion, setAgreementVersion] = useState("v1");

  // Editable Clause Sections State
  const [sections, setSections] = useState<ClauseSection[]>([
    {
      id: "scope",
      num: "01",
      title: "Scope of Services",
      content: "The Creative Partner will provide the services described in the shoot brief for the project listed above.",
      isExpanded: true,
    },
    {
      id: "equipment",
      num: "02",
      title: "Equipment Requirements",
      content: "The Creative Partner will bring the equipment agreed for this assignment and notify Beige if the equipment plan changes before the shoot.",
      isExpanded: false,
    },
    {
      id: "deliverables",
      num: "03",
      title: "Deliverables / Media Transfer",
      content: "The Creative Partner will provide the agreed media or deliverables in the shoot brief and coordinate their transfer with Beige.",
      isExpanded: false,
    },
    {
      id: "expenses",
      num: "04",
      title: "Approved Expenses / Travel",
      content: "Any travel or other expenses must be agreed with Beige before they are incurred.",
      isExpanded: false,
    },
    {
      id: "additional",
      num: "05",
      title: "Special Instructions",
      content: "Follow the confirmed production schedule and share any project-specific changes with Beige before the shoot.",
      isExpanded: false,
    },
  ]);
  const [sectionsByCreator, setSectionsByCreator] = useState<Record<string, ClauseSection[]>>({});
  const defaultSections = useRef(sections.map((section) => ({ ...section })));
  const agreementPageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isLoadingShoot) return;
    const scrollToTop = () => {
      agreementPageRef.current?.closest("main")?.scrollTo({ top: 0, left: 0, behavior: "instant" });
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    scrollToTop();
    const frame = window.requestAnimationFrame(scrollToTop);
    return () => window.cancelAnimationFrame(frame);
  }, [isLoadingShoot, currentStep, activeCpIndex, reviewCpIndex]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadShoot = async () => {
      const bookingId = Number(params.id);
      const requestedAssignmentId = Number(searchParams.get("assignment_id") || 0);
      const requestedRevisionId = Number(searchParams.get("revise_from") || 0);
      if (!bookingId) { setIsLoadingShoot(false); return; }
      try {
        const applyBookingDetails = (booking: ShootBooking) => {
          if (booking?.event_date) {
            const date = new Date(booking.event_date);
            if (!Number.isNaN(date.getTime())) setProductionDate(date);
          }
          setLocation(String(booking?.event_location || booking?.location || ""));
          setCallTime(String(booking?.start_time || ""));
          setEndTime(String(booking?.end_time || ""));
        };
        if (requestedRevisionId) {
          const [sourceResponse, projectResponse, agreementsResponse] = await Promise.all([
            agreementApi.getAdminAgreement(requestedRevisionId), getProject(bookingId),
            agreementApi.listAdminAgreements({ type: "shoot", booking_id: bookingId, limit: 100 }),
          ]);
          const source = sourceResponse.data.agreement;
          if (source.agreement_type !== "shoot" || Number(source.booking_id) !== bookingId || !source.assignment_id) throw new Error("Shoot agreement revision is unavailable");
          const bookingPayload = projectResponse?.data?.data ?? projectResponse?.data ?? projectResponse;
          applyBookingDetails(bookingPayload?.project ?? bookingPayload);
          const draft = source.status === "draft" ? source : agreementsResponse.data.find((item) => item.status === "draft" && Number(item.parent_document_id) === requestedRevisionId);
          const editable = draft || source;
          const nextVersion = Math.max(0, ...agreementsResponse.data
            .filter((item) => Number(item.assignment_id) === Number(source.assignment_id))
            .map((item) => Number(item.version_no) || 0)) + 1;
          setAgreementVersion(draft ? draft.display_version : `v${nextVersion}`);
          if (draft) setDraftAgreementIds({ [String(source.assignment_id)]: draft.agreement_document_id });
          else if (!source.is_current || !["accepted", "pending_acceptance", "rejected"].includes(source.status)) {
            throw new Error("Only the current agreement can be revised");
          }
          setRevisionSourceId(draft ? Number(draft.parent_document_id) || null : requestedRevisionId);
          const cp = editable.snapshot?.creative_partner;
          const name = cp?.name || `CP #${editable.creator_id}`;
          setCpList([{ id: String(editable.creator_id), name, role: cp?.role || "Creative Partner",
            assignCode: String(source.assignment_id), initials: name.split(" ").map((part) => part[0]).join("").slice(0, 2),
            compensation: `${editable.currency || "USD"} ${Number(editable.compensation_amount || 0).toFixed(2)}`,
            projectName: editable.snapshot?.shoot?.name || `Shoot #${bookingId}`,
            projectId: String(bookingId), assignmentId: String(source.assignment_id) } as CPDetail]);
          const content = editable.content_json as { sections?: ClauseSection[]; production_date?: string; location?: string; call_time?: string; end_time?: string } | null;
          if (Array.isArray(content?.sections) && content.sections.length) setSections(content.sections);
          if (content?.production_date) setProductionDate(new Date(content.production_date));
          if (content?.location) setLocation(content.location);
          if (content?.call_time) setCallTime(content.call_time);
          if (content?.end_time) setEndTime(content.end_time);
          setSelectedMode("individual");
          setCurrentStep(2);
          return;
        }
        const savedPlan = sessionStorage.getItem(shootAgreementPlanKey(bookingId));
        if (savedPlan) {
          const plan = JSON.parse(savedPlan) as ShootAgreementPlan;
          if (Number(plan.compensation.booking_id) === bookingId && plan.creators.length) {
            const response = await getProject(bookingId);
            const payload = response?.data?.data ?? response?.data ?? response;
            const booking = payload?.project ?? payload;
            applyBookingDetails(booking);
            setPendingPlan(plan);
            setCpList(plan.creators.map((creator) => {
              const name = creator.creator_name || `CP #${creator.creator_id}`;
              return { id: String(creator.creator_id), name, role: creator.cp_role || "Creative Partner",
                assignCode: String(creator.creator_id), initials: name.split(" ").map((part) => part[0]).join("").slice(0, 2),
                compensation: `$${(plan.compensation.creators.find((row) => Number(row.creator_id) === Number(creator.creator_id))?.items || []).reduce((total, item) => total + Number(item.amount || 0), 0).toFixed(2)}`,
                projectName: booking?.project_name || `Shoot #${bookingId}`,
                projectId: String(bookingId), assignmentId: String(creator.creator_id) } as CPDetail;
            }));
            setCurrentStep(plan.creators.length === 1 ? 2 : 1);
            return;
          }
        }
        const [response, agreementsResponse] = await Promise.all([
          getProject(bookingId),
          agreementApi.listAdminAgreements({ type: "shoot", booking_id: bookingId, limit: 100 }),
        ]);
        const payload = response?.data?.data ?? response?.data ?? response;
        const booking = payload?.project ?? payload;
        applyBookingDetails(booking);
        const assignments = Array.isArray(payload?.assignedCrew)
          ? payload.assignedCrew
          : Array.isArray(payload?.assigned_crews) ? payload.assigned_crews : [];
        const sentAssignmentIds = new Set(
          agreementsResponse.data
            .filter((agreement) =>
              agreement.is_current &&
              ["pending_acceptance", "accepted"].includes(agreement.status) &&
              agreement.assignment_id,
            )
            .map((agreement) => Number(agreement.assignment_id)),
        );
        const savedDraftIds: Record<string, number> = {};
        for (const agreement of agreementsResponse.data) {
          if (agreement.status === "draft" && agreement.assignment_id && !savedDraftIds[String(agreement.assignment_id)]) {
            savedDraftIds[String(agreement.assignment_id)] = agreement.agreement_document_id;
          }
        }
        setDraftAgreementIds(savedDraftIds);
        const pending = (assignments as ShootAssignment[]).filter((assignment) =>
          Number(assignment?.crew_accept ?? 0) === 0 &&
          Number(assignment?.is_active ?? 1) === 1 &&
          !sentAssignmentIds.has(Number(assignment?.id)) &&
          (!requestedAssignmentId || Number(assignment?.id) === requestedAssignmentId),
        )
          .map((assignment) => {
            const cp = assignment.crew_member ?? assignment.creator ?? assignment;
            const name = [cp.first_name, cp.last_name].filter(Boolean).join(" ") || cp.name || `CP #${assignment.crew_member_id}`;
            return {
              id: String(assignment.id), name,
              role: getPrimaryRoleLabel(cp.primary_role ?? cp.role, cp.role_name),
              assignCode: String(assignment.id), initials: name.split(" ").map((part: string) => part[0]).join("").slice(0, 2),
              compensation: "Set in CP compensation", projectName: booking?.project_name || `Shoot #${bookingId}`,
              projectId: String(bookingId), assignmentId: String(assignment.id),
            } as CPDetail;
          });
        setCpList(pending);
        if (pending.length === 1) setCurrentStep(2);
        if (!pending.length) toast.info("All pending Creative Partner assignments already have a sent agreement.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load assigned Creative Partners");
      } finally {
        setIsLoadingShoot(false);
      }
    };
    void loadShoot();
  }, [params.id, searchParams]);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
  if (!mounted) return null;

  const currentCP = cpList[activeCpIndex];

  // Accordion Section Handlers
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
  const addSection = () => setSections((previous) => [...previous, {
    id: globalThis.crypto?.randomUUID?.() || `section-${Date.now()}`,
    num: String(previous.length + 1).padStart(2, "0"), title: "", content: "", isExpanded: true,
  }]);
  const removeSection = (id: string) => setSections((previous) => previous.filter((section) => section.id !== id));

  const validateSections = (items: ClauseSection[]) => {
    if (!items.length) {
      toast.error("Add at least one agreement section with a title and content.");
      return false;
    }
    const invalidIndex = items.findIndex((section) => !section.title.trim() || !section.content.trim());
    if (invalidIndex !== -1) {
      setSections((previous) => previous.map((section, index) => index === invalidIndex ? { ...section, isExpanded: true } : section));
      toast.error(`Section ${invalidIndex + 1} needs a title and content.`);
      return false;
    }
    return true;
  };

  // Step Navigation Logic
  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      setActiveCpIndex(0);
    } else if (currentStep === 2) {
      if (!validateSections(sections)) return;
      if (selectedMode === "individual" && activeCpIndex < cpList.length - 1) {
        const currentId = cpList[activeCpIndex].id;
        const nextId = cpList[activeCpIndex + 1].id;
        setSectionsByCreator((previous) => ({ ...previous, [currentId]: sections.map((section) => ({ ...section })) }));
        setSections(sectionsByCreator[nextId]?.map((section) => ({ ...section })) || defaultSections.current.map((section) => ({ ...section })));
        setActiveCpIndex((prev) => prev + 1);
      } else {
        if (selectedMode === "individual") setSectionsByCreator((previous) => ({ ...previous, [cpList[activeCpIndex].id]: sections.map((section) => ({ ...section })) }));
        setCurrentStep(3);
        setReviewCpIndex(0);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
      setActiveCpIndex(Math.max(cpList.length - 1, 0));
      if (selectedMode === "individual") setSections(sectionsByCreator[cpList[cpList.length - 1].id]?.map((section) => ({ ...section })) || sections);
    } else if (currentStep === 2) {
      if (selectedMode === "individual" && activeCpIndex > 0) {
        setSectionsByCreator((previous) => ({ ...previous, [cpList[activeCpIndex].id]: sections.map((section) => ({ ...section })) }));
        setSections(sectionsByCreator[cpList[activeCpIndex - 1].id]?.map((section) => ({ ...section })) || sections);
        setActiveCpIndex((prev) => prev - 1);
      } else {
        if (cpList.length === 1) router.back();
        else setCurrentStep(1);
      }
    } else {
      router.back();
    }
  };

  const handlePrimaryAction = () => {
    if (currentStep === 3) {
      setIsSendDialogOpen(true);
      return;
    }
    handleNextStep();
  };

  const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const buildAgreementHtml = (agreementSections = sections) => agreementSections.map((section) =>
    `<section><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.content).replace(/\n/g, "<br />")}</p></section>`
  ).join("\n");

  const persistAgreementDrafts = async () => {
    const bookingId = Number(params.id);
    if (!bookingId || !cpList.length) return [];

    const payloadFor = (agreementSections: ClauseSection[]) => ({
      content_html: buildAgreementHtml(agreementSections),
      content_json: {
        sections: agreementSections,
        production_date: productionDate?.toISOString() || null,
        location,
        call_time: callTime,
        end_time: endTime,
      },
      snapshot_overrides: {
        production_date: productionDate?.toISOString() || null,
        location,
        call_time: callTime,
        end_time: endTime,
      },
    });

    const persisted: (readonly [string, number])[] = [];
    for (const cp of cpList) {
      if (sentAgreementIds.includes(draftAgreementIds[cp.assignmentId])) continue;
      const assignmentId = Number(cp.assignmentId);
      const existingAgreementId = draftAgreementIds[cp.assignmentId];
      const payload = payloadFor(selectedMode === "individual" ? sectionsByCreator[cp.id] || sections : sections);
      if (existingAgreementId) {
        await agreementApi.updateShootAgreement(existingAgreementId, payload);
        persisted.push([cp.assignmentId, existingAgreementId]);
        continue;
      }

      if (revisionSourceId) {
        const created = await agreementApi.reviseShootAgreement(revisionSourceId, payload);
        const agreementId = created.data.agreement_document_id;
        persisted.push([cp.assignmentId, agreementId]);
        setDraftAgreementIds((current) => ({ ...current, [cp.assignmentId]: agreementId }));
        continue;
      }

      const created = await agreementApi.createShootAgreement(bookingId, assignmentId, {
        ...payload,
        title: `Shoot Agreement — ${cp.projectName}`,
      });
      const agreementId = created.data.agreement_document_id;
      persisted.push([cp.assignmentId, agreementId]);
      setDraftAgreementIds((current) => ({ ...current, [cp.assignmentId]: agreementId }));
    }

    const nextDraftAgreementIds = Object.fromEntries(persisted);
    setDraftAgreementIds((current) => ({ ...current, ...nextDraftAgreementIds }));
    return persisted.map(([, agreementId]) => agreementId);
  };

  const saveDrafts = async () => {
    if (!validateSections(sections)) return;
    if (pendingPlan) {
      toast.info("The agreement and compensation will be saved together when you send it.");
      return;
    }
    try {
      setIsSending(true);
      const agreementIds = await persistAgreementDrafts();
      if (agreementIds.length) toast.success("Shoot agreement draft saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save shoot agreement draft");
    } finally {
      setIsSending(false);
    }
  };

  const sendAgreements = async () => {
    if (!cpList.length) return;
    const agreementSections = selectedMode === "individual"
      ? cpList.map((cp) => sectionsByCreator[cp.id] || sections)
      : [sections];
    for (const items of agreementSections) if (!validateSections(items)) return;
    try {
      setIsSending(true);
      if (pendingPlan) {
        const agreementPayload = (agreementSections: ClauseSection[]) => ({
          title: `Shoot Agreement — ${cpList[0]?.projectName || `Shoot #${params.id}`}`,
          content_html: buildAgreementHtml(agreementSections),
          content_json: { sections: agreementSections, production_date: productionDate?.toISOString() || null, location, call_time: callTime, end_time: endTime },
          snapshot_overrides: { production_date: productionDate?.toISOString() || null, location, call_time: callTime, end_time: endTime },
        });
        await agreementApi.assignCompensateAndSend(Number(params.id), {
          compensation: pendingPlan.compensation,
          agreement: agreementPayload(sections),
          ...(selectedMode === "individual" ? { agreements: Object.fromEntries(cpList.map((cp) => [cp.id, agreementPayload(sectionsByCreator[cp.id] || sections)])) } : {}),
        });
        sessionStorage.removeItem(shootAgreementPlanKey(Number(params.id)));
        setPendingPlan(null);
        setIsSendDialogOpen(false);
        setIsSuccessOpen(true);
        toast.success(`${cpList.length} shoot agreement${cpList.length === 1 ? "" : "s"} sent`);
        return;
      }
      const agreementIds = await persistAgreementDrafts();
      for (const agreementId of agreementIds) {
        await agreementApi.sendShootAgreement(agreementId);
        setSentAgreementIds((current) => [...current, agreementId]);
      }
      setIsSendDialogOpen(false);
      setIsSuccessOpen(true);
      toast.success(`${cpList.length} shoot agreement${cpList.length === 1 ? "" : "s"} sent`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create and send shoot agreements");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoadingShoot) {
    return <><Topbar pathname={pathname} /><div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F3F4F6] text-black"}`}><Loader2 className="h-8 w-8 animate-spin" aria-label="Loading shoot agreement" /></div></>;
  }
  if (isSuccessOpen) {
    return <ShootAgreementSuccessModal
      onBackToShoots={() => router.replace(`/admin/shoots/${params.id}`)}
      count={cpList.length}
      mode={selectedMode}
    />;
  }
  if (!cpList.length) {
    return <><Topbar pathname={pathname} /><div className={`min-h-screen p-10 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F3F4F6] text-black"}`}><p>No pending CP assignment is ready for a shoot agreement.</p><Button className="mt-4" onClick={() => router.back()}>Back</Button></div></>;
  }

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <>
            {currentStep === 2 && !pendingPlan &&
              <>
                <Button
                  variant="outline"
                  className={`rounded-lg h-12 px-4 lg:px-7 gap-2 transition-all ${isDark
                    ? "bg-[#1A1A1A] border-white/10 text-white hover:bg-[#2C2C2C]"
                    : "bg-[#F0F0F0] border-[#E3E3E3] text-[#323232] hover:bg-zinc-50"
                    }`}
                  onClick={() => void saveDrafts()}
                  disabled={isSending}
                > {isSending ? "Saving..." : "Save Draft"}
                </Button>
                <Button
                  className={`rounded-lg h-12 px-4 lg:px-7 gap-2 transition-all ${isDark
                    ? "bg-white border-white/10 text-black hover:bg-[#F0F0F0]"
                    : "bg-[#1A1A1A] border-white/10 text-white hover:bg-[#2C2C2C]"
                    }`}
                >
                  Preview
                </Button>
              </>}
          </>
        }
      />

      <div ref={agreementPageRef} className={`min-h-screen p-4 lg:p-6 lg:px-10 lg:py-9 font-sans pb-40 transition-colors space-y-4 lg:space-y-9 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F3F4F6] text-black"}`}>
        <Button
          type="button"
          onClick={handlePreviousStep}
          className={`transition-colors flex items-center gap-2 lg:mb-5 p-0 bg-transparent hover:bg-transparent ${isDark
              ? "text-white hover:text-white/80"
              : "text-black hover:text-black/70"
            }`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {/* Step 1 Component */}
        {currentStep === 1 && (
          <Step1ModeSelection
            isDark={isDark}
            selectedMode={selectedMode}
            setSelectedMode={setSelectedMode}
            cpList={cpList}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
          />
        )}

        {/* Step 2 Component */}
        {currentStep === 2 && (
          <Step2AgreementDetails
            isDark={isDark}
            selectedMode={selectedMode}
            currentCP={currentCP}
            productionDate={productionDate}
            setProductionDate={setProductionDate}
            location={location}
            setLocation={setLocation}
            callTime={callTime}
            setCallTime={setCallTime}
            endTime={endTime}
            setEndTime={setEndTime}
            sections={sections}
            agreementVersion={agreementVersion}
            allCPs={cpList}
            toggleSection={toggleSection}
            updateSectionTitle={updateSectionTitle}
            updateSectionContent={updateSectionContent}
            addSection={addSection}
            removeSection={removeSection}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
            onSaveDraft={pendingPlan ? undefined : () => void saveDrafts()}
          />
        )}

        {/* Step 3 Component */}
        {currentStep === 3 && (
          <Step3ReviewAgreement
            isDark={isDark}
            selectedMode={selectedMode}
            cpList={cpList}
            reviewCpIndex={reviewCpIndex}
            setReviewCpIndex={setReviewCpIndex}
            productionDate={productionDate}
            location={location}
            callTime={callTime}
            endTime={endTime}
            sections={selectedMode === "individual" ? sectionsByCreator[cpList[reviewCpIndex]?.id] || sections : sections}
            agreementVersion={agreementVersion}
            onOpenSendDialog={() => setIsSendDialogOpen(true)}
            onPrevious={handlePreviousStep}
            onSave={() => setIsSendDialogOpen(true)}
          />
        )}

        {/* Mobile Sticky Action Bar */}
        <div
          className={`lg:hidden fixed flex flex-wrap gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"
            }`}
        >
          <Button
            type="button"
            onClick={handlePreviousStep}
            className={`flex-1 h-12 rounded-lg border text-sm font-medium bg-transparent ${isDark
                ? "border-white/20 text-white"
                : "border-black/20 text-black"
              }`}
          >
            Back
          </Button>

          <Button
            type="button"
            onClick={handlePrimaryAction}
            className="flex-[2] h-12 rounded-lg text-sm font-semibold bg-[#E8D1AB] text-black hover:bg-[#D4C3A3]"
          >
            {currentStep === 1
              ? "Continue to Add Agreement"
              : currentStep === 2 &&
                selectedMode === "individual" &&
                activeCpIndex < cpList.length - 1
                ? "Next CP"
                : currentStep === 2
                  ? "Review"
                  : "Send Agreement"}
          </Button>
        </div>
      </div>

      <SendAgreementModal
        isOpen={isSendDialogOpen}
        onClose={() => setIsSendDialogOpen(false)}
        onSubmit={sendAgreements}
        cps={cpList}
        mode={selectedMode}
        isSubmitting={isSending}
        assignAndSubmit={Boolean(pendingPlan)}
      />

    </>
  );
}
