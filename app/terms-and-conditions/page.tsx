// "use client";

// import React from "react";
// import Link from "next/link";

// import { Footer } from "@/src/components/landing/Footer";
// import { Navbar } from "@/src/components/landing/Navbar";
// import { Separator as CenteredSeparator } from "@/src/components/landing/Separator";
// import { Container } from "@/src/components/landing/ui/container";

// import { motion } from "framer-motion";
// import { ChevronRight } from "lucide-react";

// export default function TermsAndConditionsPage() {
//   return (
//     <main className="bg-[#010101] min-h-screen text-white font-sans selection:bg-[#ECE1CE] selection:text-black px-5 pt-15 lg:p-0">
//       <Navbar />

//       <section className="py-10 md:py-20 lg:pt-50 lg:pb-0 bg-[#010101] overflow-hidden select-none">
//         <Container>
//           {/* Title + Breadcrumbs */}
//           <div className="text-center mb-6 lg:mb-12">
//             <motion.h1
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.8 }}
//               className="text-2xl md:text-4xl lg:text-[58px] leading-tight font-bold text-gradient-white mb-2"
//             >
//               Terms & Conditions
//             </motion.h1>
//             <div className="text-white/70 text-sm lg:text-base">
//               <Link href="/" className="hover:text-[#ECE1CE] hover:underline">
//                 Home
//               </Link>
//               <ChevronRight className="inline mx-2" size={16} />
//               <span>Terms & Conditions</span>
//             </div>
//           </div>
//           <CenteredSeparator />

//           <div className="my-7 lg:my-15 bg-[#171717] p-4 lg:p-7 rounded-[20px] border border-[#FFFFFF33]">
//             <p className="font-medium text-white lg:text-[22px]">
//               Welcome to Beige! These Terms and Conditions (“Terms”) govern your use of our website (the “Site”) and services (“Service”), provided by Beige,
//               EIN (EIN 88-2751156), trading as Beige (“Beige,” “we,” “us,” or “our”). By using our Service, you agree to comply with and be bound by these Terms.
//             </p>
//           </div>

//           <div className="mb-4 lg:mb-7">
//             <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">1. Acceptance of Terms</h2>
//             <p className="text-white/70 text-sm lg:text-base font-light">
//               By accessing or using our Site or Service, you acknowledge that you have read, understood, and agree to these Terms. If you do not agree, do not use our Service.
//             </p>
//           </div>
//           <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

//           <div className="my-4 lg:my-7">
//             <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">2. Services Provided</h2>
//             <div className="space-y-3 lg:space-y-5 font-light">
//               <p className="text-white/70 text-sm lg:text-base">
//                 Beige provides a platform that connects Customers and Photographers for photography engagements. The Service includes but is not limited to:
//               </p>
//               <ul className="text-white/70 text-sm lg:text-base list-disc pl-5 lg:leading-[28px]">
//                 <li>Booking photography sessions,</li>
//                 <li>
//                   Processing payments,
//                 </li>
//                 <li>
//                   Delivering digital photographs,
//                 </li>
//                 <li>
//                   Providing customer and photographer support,
//                 </li>
//                 <li>
//                   Offering promotional and marketing services for photographers.
//                 </li>
//               </ul>
//               <p className="text-white/70 text-sm lg:text-base">
//                 We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time without prior notice.
//               </p>
//             </div>
//           </div>
//           <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

//           <div className="my-4 lg:my-7">
//             <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">3. User Accounts</h2>
//             <div className="space-y-3 lg:space-y-5">
//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 <span className="text-white font-medium">3.1 Registration : </span>To access certain features, you may need to create an account. You agree to provide accurate, complete, and up-to-date information when registering.
//               </p>
//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 <span className="text-white font-medium">3.2 Account Security : </span>You are responsible for maintaining the confidentiality of your account credentials. Any unauthorized access or use must be reported to us immediately.
//               </p>
//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 <span className="text-white font-medium">3.3 Account Termination : </span>Beige reserves the right to suspend or terminate accounts that violate these Terms or engage in fraudulent, abusive, or unlawful behavior.
//               </p>
//             </div>
//           </div>
//           <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

//           <div className="my-4 lg:my-7">
//             <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">4. Payments and Fees</h2>
//             <div className="space-y-3 lg:space-y-5">
//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 <span className="text-white font-medium">4.1 Pricing : </span>All prices are listed on our Site and are subject to change without notice. Taxes may apply based on your location and applicable U.S. tax laws.
//               </p>
//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 <span className="text-white font-medium">4.2 Payment Processing : </span>Payments for photography services are processed through third-party payment providers (e.g., Stripe, PayPal). By making a payment, you agree to the provider&apos;s terms and policies. <span className="text-white font-normal">Beige is not responsible for payment failures due to technical issues, insufficient funds, or third-party service disruptions.</span>
//               </p>
//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 <span className="text-white font-medium">4.3 Refund Policy : </span>Refunds may be issued under specific conditions outlined in our refund policy:
//               </p>
//               <ul className="text-white/70 text-sm lg:text-base list-disc pl-5 lg:leading-[28px] font-light">
//                 <li>Cancellations made at least <span className="text-white font-normal">48 hours before the scheduled session</span> are eligible for a full refund.</li>
//                 <li>Cancellations within <span className="text-white font-normal">48 hours</span> may be subject to a partial refund or non-refundable deposit.</li>
//                 <li>Refunds will be processed within <span className="text-white font-normal">10 business days</span> to the original payment method.</li>
//               </ul>
//             </div>
//           </div>
//           <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

//           <div className="my-4 lg:my-7">
//             <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">5. Photographer Responsibilities</h2>
//             <div className="space-y-3 lg:space-y-5">
//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 <span className="text-white font-medium">5.1 Professional Conduct : </span>Photographers must provide high-quality services and conduct themselves professionally at all times.
//               </p>
//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 <span className="text-white font-medium">5.2 Intellectual Property : </span>Photographers retain the copyright to their images but grant Beige a non-exclusive license to display and promote their work on our platform.
//               </p>
//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 <span className="text-white font-medium">5.3 Liability : </span> Beige is not liable for disputes between Customers and Photographers. Any disputes must be resolved between the parties involved. <span className="text-white font-normal">Beige does not guarantee the quality of the final deliverables.</span>
//               </p>
//             </div>
//           </div>
//           <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

//           <div className="my-4 lg:my-7">
//             <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">6. Customer Responsibilities</h2>
//             <div className="space-y-3 lg:space-y-5">
//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 <span className="text-white font-medium">6.1 Booking : </span>Customers must provide accurate booking details and comply with any agreed-upon terms with Photographers.
//               </p>
//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 <span className="text-white font-medium">6.2 Usage Rights : </span>Customers may use photographs for personal purposes unless otherwise agreed with the Photographer. Any commercial usage must be explicitly authorized by the Photographer.
//               </p>
//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 <span className="text-white font-medium">6.3 Cancellations :</span> Customers must adhere to the cancellation policies outlined on our Site. Late cancellations may be subject to penalties or non-refundable deposits.
//               </p>
//             </div>
//           </div>
//           <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

//           <div className="my-4 lg:my-7">
//             <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">7. Dispute Resolution Between Photographers and Customers</h2>
//             <div className="space-y-3 lg:space-y-5">
//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 Before escalating disputes, Customers and Photographers must attempt to resolve issues directly. If unresolved, Beige provides the following resolution process:
//               </p>

//               <ol className="text-white/70 text-sm lg:text-base list-decimal pl-5 lg:leading-[28px]">
//                 <li>
//                   <span className="text-white font-medium">Mediation -</span> Customers and Photographers may request Beige to mediate the issue.
//                 </li>
//                 <li>
//                   <span className="text-white font-medium">Formal Complaint Review -</span> If mediation fails, Beige may review and decide the dispute based on available evidence.
//                 </li>
//                 <li>
//                   <span className="text-white font-medium">External Legal Action -</span> If a resolution is not reached, disputes must be handled outside Beige Media.
//                 </li>
//               </ol>

//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 Beige is not liable for final dispute outcomes but will assist in facilitating a resolution.
//               </p>
//             </div>
//           </div>
//           <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />


//           <div className="my-4 lg:my-7">
//             <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">8. Intellectual Property</h2>
//             <div className="space-y-3 lg:space-y-5">
//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 All content on the Site, including text, graphics, logos, software, and images, is owned by Beige or its licensors and is protected under U.S. intellectual property laws. Users may not reproduce, distribute, or modify any content without explicit written permission from Beige.
//               </p>
//             </div>
//           </div>
//           <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

//           <div className="my-4 lg:my-7">
//             <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">9. Limitation of Liability</h2>
//             <div className="space-y-3 lg:space-y-5">
//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 To the maximum extent permitted by U.S. law, Beige a is not liable for any indirect, incidental, special, or consequential damages arising from:
//               </p>

//               <ul className="text-white/70 text-sm lg:text-base list-disc pl-5 lg:leading-[28px]">
//                 <li>
//                   Your use of the Service,
//                 </li>
//                 <li>
//                   Errors, interruptions, or security breaches,
//                 </li>
//                 <li>
//                   Loss of data,
//                 </li>
//                 <li>
//                   Third-party service provider failures.
//                 </li>
//               </ul>

//               <p className="text-white font-medium text-sm lg:text-base lg:leading-[28px]">
//                 Beige total liability shall not exceed the amount paid by you for our services in the past six (6) months. We expressly exclude liability for lost profits, indirect damages, or third-party misconduct.
//               </p>
//             </div>
//           </div>
//           <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

//           <div className="mt-4 lg:mt-7">
//             <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">10. Indemnification</h2>
//             <div className="space-y-3 lg:space-y-5">
//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 You agree to indemnify and hold Beige, its affiliates, employees, and partners harmless from any claims, losses, damages, liabilities, and legal fees arising from:
//               </p>

//               <ul className="text-white/70 text-sm lg:text-base list-disc pl-5 lg:leading-[28px]">
//                 <li>
//                   Your breach of these Terms,
//                 </li>
//                 <li>
//                   Your use of the Service,
//                 </li>
//                 <li>
//                   Any disputes between you and a Photographer or Customer.
//                 </li>
//               </ul>

//               <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
//                 Beige is not responsible for damages resulting from third-party misconduct or service failures.
//               </p>
//             </div>
//           </div>
//         </Container>
//       </section>

//       <Footer />
//     </main>
//   );
// }

"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import Link from "next/link";

import { Footer } from "@/src/components/landing/Footer";
import { Navbar } from "@/src/components/landing/Navbar";
import { Separator as CenteredSeparator } from "@/src/components/landing/Separator";
import { Container } from "@/src/components/landing/ui/container";
import { ChevronRight } from "lucide-react";

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

export default function TermsAndConditionsPage() {
  return (
    <main className="bg-[#010101] min-h-screen text-white font-sans selection:bg-[#ECE1CE] selection:text-black px-5 pt-15 lg:p-0">
      <Navbar />

      <section className="py-10 md:py-20 lg:pt-50 lg:pb-0 bg-[#010101] overflow-hidden select-none">
        <Container>
          {/* Title + Breadcrumbs */}
          <div className="text-center mb-6 lg:mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-2xl md:text-4xl lg:text-[58px] leading-tight font-bold text-gradient-white mb-2"
            >
              Terms & Conditions
            </motion.h1>
            <div className="text-white/70 text-sm lg:text-base">
              <Link href="/" className="hover:text-[#ECE1CE] hover:underline">
                Home
              </Link>
              <ChevronRight className="inline mx-2" size={16} />
              <span>Terms & Conditions</span>
            </div>
          </div>
          <CenteredSeparator />

          <div className="my-7 lg:my-15 bg-[#171717] p-4 lg:p-7 rounded-[20px] border border-[#FFFFFF33]">
            <p className="font-medium text-white lg:text-[22px]">
              This Agreement is between the Client ("You") and Production Company ("Beige Corporation"), relating to Your Project (the "Project") as referenced and further described below.
              Client and Production Company agree that this Agreement governs the engagement of Production Company for services and related deliverables (collectively, "Services") for the Project.
              In consideration of the mutual obligations specified herein, the parties, intending to be legally bound, agree as follows:
            </p>
          </div>

          <div className="space-y-4 lg:space-y-6">
            {SERVICE_AGREEMENT_SECTIONS.map((section) => (
              <section key={section.id} className="bg-[#171717] p-4 lg:p-6 rounded-[20px] border border-[#FFFFFF1A]">
                <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-4">
                  {section.id}. {section.title}
                </h2>
                <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">{section.content}</p>
              </section>
            ))}
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
