"use client";

import React from "react";
import Link from "next/link";

import { Footer } from "@/src/components/landing/Footer";
import { Navbar } from "@/src/components/landing/Navbar";
import { Separator as CenteredSeparator } from "@/src/components/landing/Separator";
import { Container } from "@/src/components/landing/ui/container";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

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
              Welcome to Beige! These Terms and Conditions (“Terms”) govern your use of our website (the “Site”) and services (“Service”), provided by Beige,
              EIN (EIN 88-2751156), trading as Beige (“Beige,” “we,” “us,” or “our”). By using our Service, you agree to comply with and be bound by these Terms.
            </p>
          </div>

          <div className="mb-4 lg:mb-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">1. Acceptance of Terms</h2>
            <p className="text-white/70 text-sm lg:text-base font-light">
              By accessing or using our Site or Service, you acknowledge that you have read, understood, and agree to these Terms. If you do not agree, do not use our Service.
            </p>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">2. Services Provided</h2>
            <div className="space-y-3 lg:space-y-5 font-light">
              <p className="text-white/70 text-sm lg:text-base">
                Beige provides a platform that connects Customers and Photographers for photography engagements. The Service includes but is not limited to:
              </p>
              <ul className="text-white/70 text-sm lg:text-base list-disc pl-5 lg:leading-[28px]">
                <li>Booking photography sessions,</li>
                <li>
                  Processing payments,
                </li>
                <li>
                  Delivering digital photographs,
                </li>
                <li>
                  Providing customer and photographer support,
                </li>
                <li>
                  Offering promotional and marketing services for photographers.
                </li>
              </ul>
              <p className="text-white/70 text-sm lg:text-base">
                We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time without prior notice.
              </p>
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">3. User Accounts</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                <span className="text-white font-medium">3.1 Registration : </span>To access certain features, you may need to create an account. You agree to provide accurate, complete, and up-to-date information when registering.
              </p>
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                <span className="text-white font-medium">3.2 Account Security : </span>You are responsible for maintaining the confidentiality of your account credentials. Any unauthorized access or use must be reported to us immediately.
              </p>
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                <span className="text-white font-medium">3.3 Account Termination : </span>Beige reserves the right to suspend or terminate accounts that violate these Terms or engage in fraudulent, abusive, or unlawful behavior.
              </p>
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">4. Payments and Fees</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                <span className="text-white font-medium">4.1 Pricing : </span>All prices are listed on our Site and are subject to change without notice. Taxes may apply based on your location and applicable U.S. tax laws.
              </p>
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                <span className="text-white font-medium">4.2 Payment Processing : </span>Payments for photography services are processed through third-party payment providers (e.g., Stripe, PayPal). By making a payment, you agree to the provider&apos;s terms and policies. <span className="text-white font-normal">Beige is not responsible for payment failures due to technical issues, insufficient funds, or third-party service disruptions.</span>
              </p>
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                <span className="text-white font-medium">4.3 Refund Policy : </span>Refunds may be issued under specific conditions outlined in our refund policy:
              </p>
              <ul className="text-white/70 text-sm lg:text-base list-disc pl-5 lg:leading-[28px] font-light">
                <li>Cancellations made at least <span className="text-white font-normal">48 hours before the scheduled session</span> are eligible for a full refund.</li>
                <li>Cancellations within <span className="text-white font-normal">48 hours</span> may be subject to a partial refund or non-refundable deposit.</li>
                <li>Refunds will be processed within <span className="text-white font-normal">10 business days</span> to the original payment method.</li>
              </ul>
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">5. Photographer Responsibilities</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                <span className="text-white font-medium">5.1 Professional Conduct : </span>Photographers must provide high-quality services and conduct themselves professionally at all times.
              </p>
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                <span className="text-white font-medium">5.2 Intellectual Property : </span>Photographers retain the copyright to their images but grant Beige a non-exclusive license to display and promote their work on our platform.
              </p>
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                <span className="text-white font-medium">5.3 Liability : </span> Beige is not liable for disputes between Customers and Photographers. Any disputes must be resolved between the parties involved. <span className="text-white font-normal">Beige does not guarantee the quality of the final deliverables.</span>
              </p>
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">6. Customer Responsibilities</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                <span className="text-white font-medium">6.1 Booking : </span>Customers must provide accurate booking details and comply with any agreed-upon terms with Photographers.
              </p>
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                <span className="text-white font-medium">6.2 Usage Rights : </span>Customers may use photographs for personal purposes unless otherwise agreed with the Photographer. Any commercial usage must be explicitly authorized by the Photographer.
              </p>
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                <span className="text-white font-medium">6.3 Cancellations :</span> Customers must adhere to the cancellation policies outlined on our Site. Late cancellations may be subject to penalties or non-refundable deposits.
              </p>
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">7. Dispute Resolution Between Photographers and Customers</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                Before escalating disputes, Customers and Photographers must attempt to resolve issues directly. If unresolved, Beige provides the following resolution process:
              </p>

              <ol className="text-white/70 text-sm lg:text-base list-decimal pl-5 lg:leading-[28px]">
                <li>
                  <span className="text-white font-medium">Mediation -</span> Customers and Photographers may request Beige to mediate the issue.
                </li>
                <li>
                  <span className="text-white font-medium">Formal Complaint Review -</span> If mediation fails, Beige may review and decide the dispute based on available evidence.
                </li>
                <li>
                  <span className="text-white font-medium">External Legal Action -</span> If a resolution is not reached, disputes must be handled outside Beige Media.
                </li>
              </ol>

              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                Beige is not liable for final dispute outcomes but will assist in facilitating a resolution.
              </p>
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />


          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">8. Intellectual Property</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                All content on the Site, including text, graphics, logos, software, and images, is owned by Beige or its licensors and is protected under U.S. intellectual property laws. Users may not reproduce, distribute, or modify any content without explicit written permission from Beige.
              </p>
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">9. Limitation of Liability</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                To the maximum extent permitted by U.S. law, Beige a is not liable for any indirect, incidental, special, or consequential damages arising from:
              </p>

              <ul className="text-white/70 text-sm lg:text-base list-disc pl-5 lg:leading-[28px]">
                <li>
                  Your use of the Service,
                </li>
                <li>
                  Errors, interruptions, or security breaches,
                </li>
                <li>
                  Loss of data,
                </li>
                <li>
                  Third-party service provider failures.
                </li>
              </ul>

              <p className="text-white font-medium text-sm lg:text-base lg:leading-[28px]">
                Beige total liability shall not exceed the amount paid by you for our services in the past six (6) months. We expressly exclude liability for lost profits, indirect damages, or third-party misconduct.
              </p>
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="mt-4 lg:mt-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">10. Indemnification</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                You agree to indemnify and hold Beige, its affiliates, employees, and partners harmless from any claims, losses, damages, liabilities, and legal fees arising from:
              </p>

              <ul className="text-white/70 text-sm lg:text-base list-disc pl-5 lg:leading-[28px]">
                <li>
                  Your breach of these Terms,
                </li>
                <li>
                  Your use of the Service,
                </li>
                <li>
                  Any disputes between you and a Photographer or Customer.
                </li>
              </ul>

              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                Beige is not responsible for damages resulting from third-party misconduct or service failures.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}