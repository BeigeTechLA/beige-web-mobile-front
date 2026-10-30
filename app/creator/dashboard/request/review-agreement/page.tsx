"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { useTheme } from "next-themes";
import Topbar from "@/components/admin/Topbar";
import SuccessModal from "@/components/creator-profile/AgreementAcceptedSuccess";
import { toast } from "sonner";
import { agreementApi, AgreementDocument, type AgreementResponse } from "@/lib/api/agreements";
import { AgreementSignatureModal } from "@/components/creator-profile/AgreementSignatureModal";
import { AgreementSignatureEvidence } from "@/components/creator-profile/AgreementSignatureEvidence";
import { getPrimaryRoleLabel } from "@/lib/utils/shootDetails";
import { formatAgreementDate } from "@/lib/utils/agreementDate";
import { agreementContentToSafeHtml } from "@/lib/utils/agreementContent";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type AgreementSection = { id?: string; num?: string; title?: string; content?: string };

const formatDate = formatAgreementDate;

const getAgreementSections = (content: unknown): AgreementSection[] => {
  const parsed = typeof content === "string" ? (() => {
    try { return JSON.parse(content); } catch { return null; }
  })() : content;
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { sections?: unknown }).sections)) return [];
  return (parsed as { sections: AgreementSection[] }).sections.filter((section) =>
    section && typeof section.title === "string" && typeof section.content === "string" && section.content.trim(),
  );
};

const SectionContent = ({ content }: { content: string }) => /<[/!]?\w[\s\S]*>/i.test(content)
  ? <div className="agreement-content [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic" dangerouslySetInnerHTML={{ __html: agreementContentToSafeHtml(content) }} />
  : <p className="whitespace-pre-wrap">{content}</p>;

export default function AgreementReviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agreement, setAgreement] = useState<AgreementDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignOpen, setIsSignOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [signatureResponse, setSignatureResponse] = useState<AgreementResponse | null>(null);

  // Form Metadata State
  const snapshot = agreement?.snapshot;
  const agreementType = "SHOOT ASSIGNMENT AGREEMENT";
  const agreementTitle = snapshot?.shoot?.name || agreement?.title || "Shoot Agreement";
  const version = agreement?.display_version || "v1";
  const status = agreement?.status === "pending_acceptance" ? "Pending Acceptance" : agreement?.status === "accepted" ? "Accepted" : agreement?.status === "rejected" ? "Rejected" : "Pending Acceptance";
  const statusClass = agreement?.status === "accepted"
    ? "bg-[#D4FFE4] text-[#16803F]"
    : agreement?.status === "rejected"
      ? "bg-[#FFDADA] text-[#A31616]"
      : "bg-[#FEF9EC] text-[#D68910]";

  // Project Information
  const projectInfo = {
    projectName: snapshot?.shoot?.name || agreementTitle,
    projectId: String(snapshot?.booking_id || agreement?.booking_id || "—"),
    assignmentId: String(snapshot?.assignment_id || agreement?.assignment_id || "—"),
    creativePartner: snapshot?.creative_partner?.name || "—",
    role: getPrimaryRoleLabel(snapshot?.creative_partner?.role),
  };

  // Production Details
  const productionDetails = {
    productionDate: formatDate(snapshot?.shoot?.date),
    location: snapshot?.shoot?.location || "—",
    callTime: snapshot?.shoot?.start_time || "—",
    expectedEndTime: snapshot?.shoot?.end_time || "—",
  };

  // Compensation
  const totalCompensation = `${snapshot?.compensation?.currency || agreement?.currency || "USD"} ${Number(snapshot?.compensation?.amount ?? agreement?.compensation_amount ?? 0).toFixed(2)}`;

  // Detailed Specifications
  const asText = (value: unknown) => Array.isArray(value) ? value.join(", ") : String(value || "—");
  const fallbackSections: AgreementSection[] = [
    { title: "Scope of Services", content: asText(snapshot?.shoot?.scope) },
    { title: "Equipment Requirements", content: asText(snapshot?.shoot?.equipment) },
    { title: "Deliverables / Media Transfer", content: asText(snapshot?.shoot?.deliverables) },
    { title: "Approved Expenses / Travel", content: asText(snapshot?.extras?.expenses) },
    { title: "Special Instructions", content: asText(snapshot?.shoot?.special_instructions) },
  ].filter((section) => section.content !== "—");
  const agreementSections = getAgreementSections(agreement?.content_json);
  const visibleSections = agreementSections.length ? agreementSections : fallbackSections;

  const metaFooter = {
    beigeSheetVersion: version,
    createdDate: formatDate(agreement?.created_at),
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;
    const loadAgreement = async () => {
      try {
        const suppliedId = Number(searchParams.get("agreement_id"));
        const agreementId = Number.isFinite(suppliedId) && suppliedId > 0
          ? suppliedId
          : (await agreementApi.listCreatorAgreements({ type: "shoot", status: "pending_acceptance", limit: 1 })).data[0]?.agreement_document_id;
        if (!agreementId) throw new Error("No shoot agreement is awaiting your response");
        const response = await agreementApi.getCreatorAgreement(agreementId);
        if (active) { setAgreement(response.data.agreement); setSignatureResponse(response.data.responses.find((item) => item.action === "accepted") || null); }
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : "Unable to load shoot agreement");
      }
    };
    void loadAgreement();
    return () => { active = false; };
  }, [searchParams]);

  const handleAccept = async (signatureDataUrl: string, signerName: string) => {
    if (!agreement || agreement.status !== "pending_acceptance") return;
    try {
      setIsSubmitting(true);
      await agreementApi.acceptShootAgreement(agreement.agreement_document_id, signerName, signatureDataUrl);
      setAgreement({ ...agreement, status: "accepted" });
      setSignatureResponse({ agreement_response_id: 0, action: "accepted", signer_name: signerName, signature_data_url: signatureDataUrl, content_hash_at_response: "", responded_at: new Date().toISOString() });
      setIsSignOpen(false);
      setIsModalOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to accept the shoot agreement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!agreement || agreement.status !== "pending_acceptance") return;
    if (!rejectionReason?.trim()) return;
    try {
      setIsSubmitting(true);
      await agreementApi.rejectShootAgreement(agreement.agreement_document_id, rejectionReason.trim());
      setAgreement({ ...agreement, status: "rejected" });
      setIsRejectOpen(false);
      setRejectionReason("");
      toast.success("Shoot agreement rejected");
      router.push("/creator/dashboard/request");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reject the shoot agreement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  if (!mounted) return null;

  return (
    <>
      <Topbar pathname={pathname} />

      <div className={`min-h-screen p-4 lg:p-6 lg:px-10 lg:py-9 font-sans pb-20 transition-colors space-y-4 lg:space-y-9 ${isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F3F4F6] text-black"}`}>
        <Button
          onClick={() => router.back()}
          className={`transition-colors flex items-center gap-2 mb-2 p-0 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
          variant="ghost"
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        {/* Document Card Container */}
        <div
          className={`border rounded-2xl transition-colors mx-auto ${isDark
            ? "bg-[#171717] border-[#3D3D3D] text-[#D8D8D8]"
            : "bg-white border-[#E2E8F0] text-gray-800"
            }`}
        >
          {/* Header Metadata Section */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 lg:gap-4 p-5 lg:px-8 lg:py-7 rounded-t-2xl border-b ${isDark
            ? "bg-[#202020] border-[#3D3D3D] text-[#D8D8D8]"
            : "bg-white border-[#E2E8F0] text-gray-800"
            }`}>
            <div>
              <p className={`text-xs uppercase font-semibold mb-1 ${isDark ? "text-[#D8CCBA]" : "text-gray-400"}`}>
                {agreementType}
              </p>
              <h1 className={`text-lg lg:text-3xl uppercase ${isDark ? "text-white" : "text-black"}`}>
                {agreementTitle}
              </h1>
            </div>

            <div className="flex flex-col sm:items-end shrink-0 gap-1.5">
              <span className={`text-xs px-2.5 py-1 rounded-md font-medium w-fit ${isDark ? "bg-[#282828] text-[#D8CCBA]" : "bg-gray-200 text-gray-700"}`}>
                {version}
              </span>

              <span className={`shrink-0 w-fit flex gap-1 items-center rounded-full text-[10px] lg:text-xs font-medium px-2 py-0.5 lg:px-4 lg:py-1.5 ${statusClass}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {status}
              </span>
            </div>
          </div>

          <div>
            {/* Project Information */}
            <div className="p-5 lg:p-9 space-y-3">
              <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                Project Information
              </h2>
              <div className={`flex flex-col lg:flex-row lg:flex-wrap lg:items-center text-sm gap-y-2 gap-x-3 ${isDark ? "text-[#AAA7A7]" : "text-gray-700"}`}>
                <p>
                  Project Name :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {projectInfo.projectName}
                  </span>
                </p>
                <p className={`hidden lg:block ${isDark ? "text-[#E0E0E0]" : "text-gray-300"}`}>|</p>
                <p>
                  Project ID :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {projectInfo.projectId}
                  </span>
                </p>
                <p className={`hidden lg:block ${isDark ? "text-[#E0E0E0]" : "text-gray-300"}`}>|</p>
                <p>
                  Assignment ID :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {projectInfo.assignmentId}
                  </span>
                </p>
                <p className={`hidden lg:block ${isDark ? "text-[#E0E0E0]" : "text-gray-300"}`}>|</p>
                <p>
                  Creative Partner :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {projectInfo.creativePartner}
                  </span>
                </p>
                <p className={`hidden lg:block ${isDark ? "text-[#E0E0E0]" : "text-gray-300"}`}>|</p>
                <p>
                  Role :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {projectInfo.role}
                  </span>
                </p>
              </div>
            </div>

            <hr className={`border-[0.5px] ${isDark ? "border-white/50" : "border-black/40"}`} />

            {/* Production Details */}
            <div className="p-5 lg:p-9 space-y-3">
              <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                Production Details
              </h2>
              <div className={`flex flex-col lg:flex-row lg:flex-wrap lg:items-center text-sm gap-y-2 gap-x-3 ${isDark ? "text-[#AAA7A7]" : "text-gray-700"}`}>
                <p>
                  Production Date :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {productionDetails.productionDate}
                  </span>
                </p>
                <p className={`hidden lg:block ${isDark ? "text-[#E0E0E0]" : "text-gray-300"}`}>|</p>
                <p>
                  Location :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {productionDetails.location}
                  </span>
                </p>
                <p className={`hidden lg:block ${isDark ? "text-[#E0E0E0]" : "text-gray-300"}`}>|</p>
                <p>
                  Call Time :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {productionDetails.callTime}
                  </span>
                </p>
                <p className={`hidden lg:block ${isDark ? "text-[#E0E0E0]" : "text-gray-300"}`}>|</p>
                <p>
                  Expected End Time / Duration :{" "}
                  <span className={isDark ? "text-white" : "text-black"}>
                    {productionDetails.expectedEndTime}
                  </span>
                </p>
              </div>
            </div>

            <hr className={`border-[0.5px] ${isDark ? "border-white/50" : "border-black/40"}`} />

            {/* Compensation */}
            <div className="p-5 lg:p-9 space-y-3">
              <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>
                Compensation
              </h2>
              <div
                className={`flex items-center justify-between border rounded-md lg:rounded-xl p-2.5 lg:p-5 ${isDark
                    ? "bg-[#E8D1AB]/10 border-[#E8D1AB]"
                    : "bg-gray-50 border-gray-200"
                  }`}
              >
                <p className={`text-sm lg:text-base ${isDark ? "text-white" : "text-gray-700"}`}>
                  Total Compensation
                </p>
                <p className={`text-xl lg:text-2xl font-semibold tracking-tight ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
                  {totalCompensation}
                </p>
              </div>
            </div>

            <hr className={`border-[0.5px] ${isDark ? "border-white/50" : "border-black/40"}`} />

            {visibleSections.map((section, index) => (
              <React.Fragment key={section.id || `${section.title}-${index}`}>
                <hr className={`border-[0.5px] ${isDark ? "border-white/50" : "border-black/40"}`} />
                <section className="p-5 lg:p-9 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${isDark ? "text-[#E8D1AB]" : "text-gray-400"}`}>{section.num || String(index + 1).padStart(2, "0")}</span>
                    <h2 className={`lg:text-xl font-medium ${isDark ? "text-white" : "text-black"}`}>{section.title}</h2>
                  </div>
                  <div className={`border rounded-md lg:rounded-xl p-2.5 lg:p-5 text-sm leading-relaxed ${isDark
                      ? "bg-[#E8D1AB]/10 border-[#E8D1AB] text-white/70"
                      : "bg-gray-50 border-gray-200 text-gray-700"
                    }`}>
                    <SectionContent content={section.content || ""} />
                  </div>
                </section>
              </React.Fragment>
            ))}

            <hr className={`border-[0.5px] ${isDark ? "border-white/50" : "border-black/40"}`} />

            {/* Agreement footer */}
            <div className="p-5 lg:p-9 space-y-4">
              <p className={`text-xs lg:text-sm leading-relaxed pt-2 ${isDark ? "text-[#9E9690]" : "text-gray-600"}`}>
                This Shoot Assignment Agreement is issued under the Beige Creative
                Partner Agreement. By accepting, the Creative Partner confirms their
                ability to perform the assignment as described and agrees to the
                terms herein and the governing Beige Creative Partner Agreement. Both
                parties acknowledge that acceptance creates a binding commitment for
                the specified production.
              </p>

              <div className="flex items-center gap-8 pt-2">
                <div>
                  <p className={`text-xs lg:text-sm ${isDark ? "text-[#E8D1AB]" : "text-gray-400"}`}>
                    Beige Sheet Version
                  </p>
                  <p className={`text-sm lg:text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>
                    {metaFooter.beigeSheetVersion}
                  </p>
                </div>
                <div>
                  <p className={`text-xs lg:text-sm ${isDark ? "text-[#E8D1AB]" : "text-gray-400"}`}>
                    Created
                  </p>
                  <p className={`text-sm lg:text-base font-semibold ${isDark ? "text-white" : "text-black"}`}>
                    {metaFooter.createdDate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AgreementSignatureEvidence response={signatureResponse} />
        {/* Bottom Assignment Acceptance Action Card */}
        {agreement?.status === "pending_acceptance" && <div
          className={`border rounded-2xl p-6 space-y-4 ${isDark
              ? "bg-[#171717] border-[#3d3d3d]"
              : "bg-white border-[#E2E8F0]"
            }`}
        >
          <p className={`text-xs lg:text-sm font-semibold tracking-wider uppercase ${isDark ? "text-[#E8D1AB]" : "text-gray-800"}`}>
            ASSIGNMENT ACCEPTANCE
          </p>

          <label className="flex items-start gap-3 cursor-pointer select-none group">
            <div
              onClick={() => setIsChecked(!isChecked)}
              className={`flex h-5 w-5 shrink-0 mt-0.5 items-center justify-center rounded border transition-colors ${isChecked
                  ? "bg-[#E8D1AB] border-[#E8D1AB] text-black"
                  : isDark
                    ? "border-[#3A3A3A] bg-[#1A1A1A] group-hover:border-[#555555]"
                    : "border-gray-300 bg-white group-hover:border-gray-400"
                }`}
            >
              {isChecked && <Check size={14} strokeWidth={3} />}
            </div>
            <p className={`text-xs lg:text-sm leading-relaxed ${isDark ? "text-white" : "text-gray-700"}`}>
              By selecting &apos;Accept Assignment,&apos; I confirm that I have reviewed this Beige Sheet and agree to perform this Assignment according to its terms and the Beige Creative Partner Agreement. I understand that accepting this Assignment creates a binding project commitment.
            </p>
          </label>

          <div className="flex flex-col lg:flex-row lg:items-center gap-3 pt-2">
            <button
              disabled={!isChecked || !agreement || agreement.status !== "pending_acceptance" || isSubmitting}
              className={`flex-1 rounded-lg py-3 text-sm font-medium transition-all ${isChecked
                  ? "bg-[#10B981] text-white hover:bg-[#0E6C38] active:scale-[0.99]"
                  : isDark
                    ? "bg-[#123E28] text-[#3D7C5D] cursor-not-allowed"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              onClick={() => setIsSignOpen(true)}
            >
              {isSubmitting ? "Signing..." : "Sign and Accept Assignment"}
            </button>
            <button
              disabled={!agreement || agreement.status !== "pending_acceptance" || isSubmitting}
              onClick={() => { setRejectionReason(""); setIsRejectOpen(true); }}
              className={`px-8 py-3 rounded-lg text-sm font-medium transition-all ${isDark
                  ? "bg-[#EF4444] text-white hover:bg-[#8F2B2B]"
                  : "bg-red-600 text-white hover:bg-red-700"
                }`}
            >
              Reject
            </button>
          </div>
        </div>}

        <SuccessModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
      <Dialog open={isRejectOpen} onOpenChange={(open) => { if (!isSubmitting) setIsRejectOpen(open); }}>
        <DialogContent className={`w-[92vw] max-w-lg rounded-2xl border shadow-2xl ${isDark ? "border-[#3D3D3D] bg-[#171717] text-white" : "border-[#E5E5E5] bg-white text-black"}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : "text-black"}>Reject this Shoot Agreement?</DialogTitle>
            <DialogDescription className={isDark ? "text-white/60" : "text-black/60"}>
              Tell us why you’re rejecting this agreement. Your response will be shared with the admin.
            </DialogDescription>
          </DialogHeader>
          <textarea
            autoFocus
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="Enter your reason"
            rows={4}
            className={`w-full resize-y rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#E8D1AB] ${isDark ? "border-[#3D3D3D] bg-[#111110] text-white placeholder:text-white/40" : "border-[#D7D7D7] bg-white text-black placeholder:text-black/40"}`}
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => setIsRejectOpen(false)} disabled={isSubmitting} className={isDark ? "border-[#3D3D3D] bg-transparent text-white hover:bg-white/10 hover:text-white" : "border-[#D7D7D7] bg-white text-black hover:bg-black/5"}>
              Keep Agreement
            </Button>
            <Button type="button" onClick={handleReject} disabled={!rejectionReason.trim() || isSubmitting} className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
              {isSubmitting ? "Submitting..." : "Reject Agreement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {isSignOpen && agreement?.status === "pending_acceptance" && <AgreementSignatureModal title={agreement.title} initialName={projectInfo.creativePartner === "—" ? "" : projectInfo.creativePartner} isSubmitting={isSubmitting} onClose={() => setIsSignOpen(false)} onSubmit={handleAccept} />}
    </>
  );
}
