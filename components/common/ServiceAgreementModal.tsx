"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, X } from "lucide-react";

type AgreementSection = {
  id: string;
  title: string;
  content: string;
};

const SERVICE_AGREEMENT_INTRO =
  'This Agreement is between the Client ("You") and Production Company ("Beige Corporation"), relating to Your Project (the "Project") as referenced and further described below. Client and Production Company agree that this Agreement governs the engagement of Production Company for services and related deliverables (collectively, "Services") for the Project. In consideration of the mutual obligations specified herein, the parties, intending to be legally bound, agree as follows:';

const SERVICE_AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    id: "01",
    title: "Engagement and Scope of Services",
    content:
      "Beige's submission of a proposal for a Project constitutes an offer to provide Services and related deliverables under the terms of this Agreement. The Client's approval of the proposal constitutes acceptance of this offer, and this Agreement becomes effective with respect to the specific Services upon such approval. The parties agree that any proposal, including scope, deliverables, timeline, and pricing, shall be deemed incorporated into this Agreement by reference upon approval.",
  },
  {
    id: "02",
    title: "Client Obligations & Cooperation",
    content:
      "The Client agrees to fulfill any responsibilities outlined in the approved proposal or undertaken thereafter. This includes providing timely input, approvals, and coordination as needed throughout the project. Beige shall not be responsible for delays, missed opportunities, or project issues resulting from incomplete or delayed Client input.",
  },
  {
    id: "03",
    title: "Payment and Process Deposits, Cancellations & Refunds",
    content:
      "All payments are final once any portion of the Services has begun. Deposits are non-refundable and are used to reserve the production date, retain creative talent, and initiate pre-production. Cancellations made more than 7 days prior to a scheduled shoot may be eligible for shoot credit, at Beige's sole discretion. Cancellations within 7 days of a scheduled shoot may result in partial or full forfeiture of paid amounts. Refunds are not customary and are considered only in exceptional circumstances, at Beige's sole discretion. No partial refund is guaranteed. Beige is committed to professional service and, where appropriate, may offer post-production adjustments or other discretionary resolutions. These options are provided solely at Beige's discretion and do not constitute an obligation or guarantee. Requests to reschedule or postpone a confirmed shoot date will be accommodated when possible. Frequent or last-minute changes may result in rescheduling or cancellation fees.",
  },
  {
    id: "04",
    title: "Overtime Charges",
    content:
      'If the Client requests that the Creative Partner ("CP") stay beyond the contracted hours on the day of the shoot, overtime charges will apply at the predetermined rate provided in the initial contract. Since CP overtime availability may vary, the Client is encouraged to notify their designated Beige representative as soon as additional time is anticipated, ideally before the shoot date, to ensure proper coordination. Full payment for overtime is required before deliverables are provided.',
  },
  {
    id: "05",
    title: "Client No-Show Policy",
    content:
      "If Beige arrives at the scheduled shoot location and the Client or designated representative is not present, a one-hour grace period will be provided. After that, Beige reserves the right to leave the premises and consider the shoot canceled, subject to further communication. In such cases, no refund shall be issued, and rescheduling may incur additional fees.",
  },
  {
    id: "06",
    title: "Creative Subjectivity",
    content:
      "The Client acknowledges that creative services such as videography and editing are inherently subjective. Beige will make best efforts to align with the Client's vision as outlined in the proposal or pre-production documentation, but artistic judgment will ultimately remain at the discretion of the creative team.",
  },
  {
    id: "07",
    title: "Proprietary Rights",
    content:
      'Ownership: The Client owns all intellectual property rights to the photo and video deliverables in all formats. Such work shall be considered "work made for hire." Beige License: Beige Corporation retains a perpetual, non-exclusive license to display, reproduce, and distribute the deliverables solely for use in its portfolio, showreels, and other self-promotional materials, unless the Client provides written objection prior to or upon delivery of the final files.',
  },
  {
    id: "08",
    title: "Content Storage",
    content:
      "Beige will maintain the Client's final deliverables in its cloud storage for a period of one (1) year following the Project's completion. After this period, Beige may delete the files from its systems without notice. It is the Client's sole responsibility to download, archive, and maintain copies of the deliverables for future use.",
  },
  {
    id: "09",
    title: "Confidentiality",
    content:
      "Both parties agree to maintain confidentiality regarding any proprietary information, materials, or business strategies exchanged during the term of this Agreement. Neither party will disclose such information to third parties without the prior written consent of the other party.",
  },
  {
    id: "10",
    title: "Indemnification",
    content:
      "The Client agrees to indemnify and hold harmless Beige Corporation, its officers, directors, contractors, employees, and agents from any and all claims, losses, damages, or expenses (including attorney's fees) arising out of the Client's use of the Services or any breach of this Agreement.",
  },
  {
    id: "11",
    title: "Disclaimer of Warranties",
    content:
      "Except as expressly set forth in this Agreement, Beige Corporation makes no warranties, express or implied, including without limitation any implied warranties of merchantability or fitness for a particular purpose. The Services are provided as is and as available.",
  },
  {
    id: "12",
    title: "Limitation of Liability",
    content:
      "In no event shall Beige Corporation's total liability arising out of or related to this Agreement exceed the total fees paid by the Client for the Project. Beige shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits or revenue, arising out of or relating to the Services provided.",
  },
  {
    id: "13",
    title: "Force Majeure",
    content:
      "Neither party shall be held liable for any delay or failure in performance under this Agreement due to circumstances beyond their reasonable control, including but not limited to war, terrorism, or other force majeure events.",
  },
  {
    id: "14",
    title: "Non-Disparagement",
    content:
      "The Client agrees not to make any public statement, review, or communication that is false, misleading, or disparaging about Beige Corporation, its employees, services, or reputation. This includes but is not limited to online reviews, social media posts, or other public commentary. This clause shall survive termination or completion of this Agreement.",
  },
  {
    id: "15",
    title: "Communication Boundaries",
    content:
      "Client agrees to provide timely information and approvals. Beige is not liable for delays caused by incomplete input. While direct communication with personnel (such as videographers or editors) may occur for logistical or creative purposes, all official decisions and coordination must go through your designated Beige representative. To protect our partnerships and ensure a smooth process, the Client agrees not to engage Beige's creative partners separately for related or future work outside the scope of this Agreement. Any such efforts may result in project suspension or other remedies at Beige's discretion.",
  },
  {
    id: "16",
    title: "Dispute Resolution and Governing Law",
    content:
      "All disputes arising out of or related to this Agreement shall be resolved exclusively through binding arbitration or mediation in Harris County, Texas, in accordance with the rules of the American Arbitration Association. The Client waives any right to bring or participate in class actions, class arbitrations, or collective claims against Beige Corporation. This Agreement shall be governed by and construed in accordance with the laws of the State of Texas.",
  },
  {
    id: "17",
    title: "General Terms",
    content:
      "This Agreement constitutes the entire understanding between the parties and supersedes all prior written or oral agreements. No changes shall be valid unless made in writing and signed by both parties. If any portion of this Agreement is deemed unenforceable, the remainder shall remain in full force and effect.",
  },
];

interface ServiceAgreementModalProps {
  isOpen: boolean;
  initialChecked: boolean;
  isAcceptedLocked?: boolean;
  onClose: () => void;
  onAccept: () => void;
  isDark?: boolean;
}

export function ServiceAgreementModal({
  isOpen,
  initialChecked,
  isAcceptedLocked = false,
  onClose,
  onAccept,
  isDark = true
}: ServiceAgreementModalProps) {
  const [checked, setChecked] = useState(initialChecked);
  const [expandedSection, setExpandedSection] = useState("01");

  useEffect(() => {
    if (!isOpen) return;
    setChecked(initialChecked);
    setExpandedSection("01");
  }, [initialChecked, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 p-3 lg:p-6 flex items-center justify-center">
      <div className={`w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border transition-colors duration-200 ${isDark ? "border-white/10 bg-black" : "border-[#D7D7D7] bg-white shadow-2xl"
        }`}>
        {/* Header Section */}
        <div className={`flex items-center justify-between px-6 lg:px-7 py-5 lg:py-6 border-b ${isDark ? "border-white/10" : "border-[#D7D7D7]"
          }`}>
          <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>
            Service Agreement & Terms of Engagement
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${isDark ? "bg-[#1F1F1F] text-white hover:bg-[#2C2C2C]" : "bg-[#F4F5F7] text-black hover:bg-[#E5E7EB]"
              }`}
            aria-label="Close service agreement"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 lg:p-5 overflow-y-auto max-h-[calc(90vh-90px)]">
          <div className="rounded-lg bg-[#E8D1AB] text-black p-4 mb-4">
            <p className="text-sm font-semibold mb-1">Services Agreement</p>
            <p className="text-xs leading-relaxed">{SERVICE_AGREEMENT_INTRO}</p>
          </div>

          {/* Accordion Layout Container */}
          <div className={`rounded-lg border overflow-hidden ${isDark ? "border-white/10" : "border-[#D7D7D7]"
            }`}>
            {SERVICE_AGREEMENT_SECTIONS.map((section) => {
              const isExpanded = expandedSection === section.id;
              return (
                <div key={section.id} className={`border-b last:border-b-0 ${isDark ? "border-white/10" : "border-[#D7D7D7]"
                  }`}>
                  <button
                    type="button"
                    onClick={() => setExpandedSection(isExpanded ? "" : section.id)}
                    className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between transition-colors ${isDark
                        ? "bg-[#171717] text-white hover:bg-[#1F1F1F]"
                        : "bg-[#FAFAFA] text-black hover:bg-[#F4F5F7]"
                      }`}
                  >
                    <span>
                      {section.id}: {section.title}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className={`h-4 w-4 ${isDark ? "text-white/80" : "text-black/80"}`} />
                    ) : (
                      <ChevronDown className={`h-4 w-4 ${isDark ? "text-white/80" : "text-black/80"}`} />
                    )}
                  </button>
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className={`px-4 py-3 text-xs leading-relaxed ${isDark ? "bg-[#111111] text-[#A1A1AA]" : "bg-white text-[#727272] border-t border-[#D7D7D7]"
                          }`}>
                          {section.content}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Consent Checkbox Panel */}
          <label className={`mt-4 rounded-md px-3 py-2 flex items-center gap-2 cursor-pointer transition-colors ${isDark ? "bg-[#171717]" : "bg-[#F4F5F7] border border-[#D7D7D7]"
            }`}>
            <input
              type="checkbox"
              checked={checked}
              disabled={isAcceptedLocked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span className={`text-xs ${isDark ? "text-[#A1A1AA]" : "text-[#727272]"}`}>
              I have read and agree to the Terms & Services Agreement.
            </span>
          </label>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                if (!checked || isAcceptedLocked) return;
                onAccept();
              }}
              disabled={!checked || isAcceptedLocked}
              className="h-11 px-5 bg-[#E8D1AB] hover:opacity-90 text-[#101010] font-semibold rounded-[10px] disabled:opacity-40 transition-opacity"
            >
              {isAcceptedLocked ? "Already Signed" : "Accept & Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
