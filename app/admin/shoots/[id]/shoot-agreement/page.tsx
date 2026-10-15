"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
  const [productionDate, setProductionDate] = useState<Date | null>(
    new Date("2026-09-15")
  );
  const [location, setLocation] = useState("The Grand Hall, Los Angeles");
  const [callTime, setCallTime] = useState("8:00 AM");
  const [endTime, setEndTime] = useState("6:00 PM");

  // Modal States
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [cpList, setCpList] = useState<CPDetail[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [draftAgreementIds, setDraftAgreementIds] = useState<Record<string, number>>({});

  // Editable Clause Sections State
  const [sections, setSections] = useState<ClauseSection[]>([
    {
      id: "scope",
      num: "01",
      title: "Scope of Services",
      content:
        "Capture photography coverage for the corporate event, including event highlights and speaker sessions.",
      isExpanded: true,
    },
    {
      id: "equipment",
      num: "02",
      title: "Equipment Requirements",
      subtitle:
        "This agreement defines the Shoot terms, responsibilities, and expectations...",
      content:
        "Sony FX3 or equivalent cinema camera, prime lenses (24mm, 50mm, 85mm), tripod, gimbal stabilizer, audio recording equipment.",
      isExpanded: false,
    },
    {
      id: "deliverables",
      num: "03",
      title: "Deliverables / Media Transfer",
      subtitle:
        "Additional terms and conditions applicable to this agreement....",
      content:
        "Upload all raw media to the designated Beige folder within 24 hours of shoot completion.",
      isExpanded: false,
    },
    {
      id: "expenses",
      num: "04",
      title: "Approved Expenses / Travel",
      subtitle:
        "Additional terms and conditions applicable to this agreement....",
      content:
        "Travel to and from shoot location (up to $75 round trip). Parking at venue. No additional expenses without prior written approval.",
      isExpanded: false,
    },
    {
      id: "additional",
      num: "05",
      title: "Special Instructions",
      subtitle:
        "Additional terms and conditions applicable to this agreement....",
      content:
        "Client requires all crew to sign NDA upon arrival. Business casual attire. Shoot brief will be provided 48 hours before the production date.",
      isExpanded: false,
    },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadShoot = async () => {
      const bookingId = Number(params.id);
      const requestedAssignmentId = Number(searchParams.get("assignment_id") || 0);
      if (!bookingId) return;
      try {
        const [response, agreementsResponse] = await Promise.all([
          getProject(bookingId),
          agreementApi.listAdminAgreements({ type: "shoot", booking_id: bookingId, limit: 100 }),
        ]);
        const payload = response?.data?.data ?? response?.data ?? response;
        const booking = payload?.project ?? payload;
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
        const pending = assignments.filter((assignment: any) =>
          Number(assignment?.crew_accept ?? 0) === 0 &&
          Number(assignment?.is_active ?? 1) === 1 &&
          !sentAssignmentIds.has(Number(assignment?.id)) &&
          (!requestedAssignmentId || Number(assignment?.id) === requestedAssignmentId),
        )
          .map((assignment: any) => {
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
        if (!pending.length) toast.info("All pending Creative Partner assignments already have a sent agreement.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load assigned Creative Partners");
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

  // Step Navigation Logic
  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      setActiveCpIndex(0);
    } else if (currentStep === 2) {
      if (selectedMode === "individual" && activeCpIndex < cpList.length - 1) {
        setActiveCpIndex((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setCurrentStep(3);
        setReviewCpIndex(0);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
      setActiveCpIndex(Math.max(cpList.length - 1, 0));
    } else if (currentStep === 2) {
      if (selectedMode === "individual" && activeCpIndex > 0) {
        setActiveCpIndex((prev) => prev - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setCurrentStep(1);
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

  const buildAgreementHtml = () => sections.map((section) =>
    `<section><h2>${section.title}</h2><p>${section.content.replace(/\n/g, "<br />")}</p></section>`
  ).join("\n");

  const persistAgreementDrafts = async () => {
    const bookingId = Number(params.id);
    if (!bookingId || !cpList.length) return [];

    const html = buildAgreementHtml();
    const payload = {
      content_html: html,
      content_json: {
        sections,
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
    };

    const persisted = await Promise.all(cpList.map(async (cp) => {
      const assignmentId = Number(cp.assignmentId);
      const existingAgreementId = draftAgreementIds[cp.assignmentId];
      if (existingAgreementId) {
        await agreementApi.updateShootAgreement(existingAgreementId, payload);
        return [cp.assignmentId, existingAgreementId] as const;
      }

      const created = await agreementApi.createShootAgreement(bookingId, assignmentId, {
        ...payload,
        title: `Shoot Agreement — ${cp.projectName}`,
      });
      return [cp.assignmentId, created.data.agreement_document_id] as const;
    }));

    const nextDraftAgreementIds = Object.fromEntries(persisted);
    setDraftAgreementIds((current) => ({ ...current, ...nextDraftAgreementIds }));
    return persisted.map(([, agreementId]) => agreementId);
  };

  const saveDrafts = async () => {
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
    try {
      setIsSending(true);
      const agreementIds = await persistAgreementDrafts();
      await Promise.all(agreementIds.map((agreementId) => agreementApi.sendShootAgreement(agreementId)));
      setIsSendDialogOpen(false);
      setIsSuccessOpen(true);
      toast.success(`${agreementIds.length} shoot agreement${agreementIds.length === 1 ? "" : "s"} sent`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create and send shoot agreements");
    } finally {
      setIsSending(false);
    }
  };

  if (!cpList.length) {
    return <><Topbar pathname={pathname} /><div className={`min-h-screen p-10 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F3F4F6] text-black"}`}><p>No pending CP assignment is ready for a shoot agreement.</p><Button className="mt-4" onClick={() => router.back()}>Back</Button></div></>;
  }

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <>
            {currentStep === 2 &&
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

      <div className={`min-h-screen p-4 lg:p-6 lg:px-10 lg:py-9 font-sans pb-40 transition-colors space-y-4 lg:space-y-9 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F3F4F6] text-black"}`}>
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
            toggleSection={toggleSection}
            updateSectionTitle={updateSectionTitle}
            updateSectionContent={updateSectionContent}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
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
            sections={sections}
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
      />

      <ShootAgreementSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        onBackToShoots={() => router.push("/admin/shoots")}
        onViewAgreement={() => router.push("/admin/agreements")}
        count={cpList.length}
        mode={selectedMode}
      />
    </>
  );
}
