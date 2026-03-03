"use client";

import React from "react";
import Link from "next/link";

import { Footer } from "@/src/components/landing/Footer";
import { Navbar } from "@/src/components/landing/Navbar";
import { Separator as CenteredSeparator } from "@/src/components/landing/Separator";
import { Container } from "@/src/components/landing/ui/container";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import ReusableTable from "@/components/generic/Table";


const Table_1_Data = [
  {
    category: "Account Data",
    description: "Includes name, email, phone number, mailing address, and profile information for Photographers.",
  },
  {
    category: "Payment Data",
    description: "Includes billing details, PayPal or payment card information, and tax ID numbers for Photographers.",
  },
  {
    category: "Photograph Data",
    description: "Includes details of booked shoots (time, place) and stored photographs.",
  },
  {
    category: "Communication Data",
    description: "Includes information from customer support interactions, surveys, and feedback.",
  },
  {
    category: "Social Media Data",
    description: "Includes information shared via Facebook, Instagram, LinkedIn, and X (Twitter).",
  },
  {
    category: "Third-Party Data",
    description: "Includes information received from third parties, such as job titles and employers.",
  },
  {
    category: "Background Check Data",
    description: "Includes information collected from third-party providers for Photographer verification.",
  },
  {
    category: "Online Activity Data",
    description: "Includes log data, cookies, device details, and browsing behavior.",
  },
];

const Table_3_Data = [
  {
    column1: "Vendors",
    column2: "Payment processors, hosting providers, analytics services, and customer support tools.",
  },
  {
    column1: "Business Transfers",
    column2: "In case of a merger, acquisition, or business restructuring, your Personal Data may be transferred.",
  },
  {
    column1: "Legal Compliance",
    column2: "To comply with legal obligations or respond to lawful requests from public authorities.",
  },
];


export default function PrivacyPage() {
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
              Privacy Policy
            </motion.h1>
            <motion.div className="text-white/70 text-sm lg:text-base">
              <Link href="/" className="hover:text-[#ECE1CE] hover:underline">
                Home
              </Link>
              <ChevronRight className="inline mx-2" size={16} />
              <span>Privacy Policy</span>
            </motion.div>
          </div>
          <CenteredSeparator />

          <div className="my-7 lg:my-15 bg-[#171717] p-4 lg:p-7 rounded-[20px] border border-[#FFFFFF33]">
            <p className="font-medium text-white lg:text-[22px] mb-5 lg:mb-8">
              Through our website (the “Site”), Beige, EIN 88-2751156, trading as Beige (“Beige,” “we,” “us,” or “our”), allows customers (“Customers”) and photographers/Videographers (“Photographers/Videographers”) to book photography and Videography engagements (the “Service”). This Privacy Policy describes the information that, alone or in combination with other information, could be used to identify you (“Personal Data”) that Beige collects, how we use and share that data, and your choices concerning our data practices.
            </p>
            <p className="font-medium text-white lg:text-[22px]">
              Please read this Privacy Policy before using our Service or submitting any Personal Data to Beige, and contact us if you have any questions.
            </p>
          </div>

          <div className="mb-4 lg:mb-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">1. Information We Collect</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base font-light">
                The Personal Data we collect varies based on who you are and what you choose to share with us. When you contact us or interact with our Service, we collect categories of Personal Data as follows:
              </p>
              <ReusableTable
                titleColumns={["Category", "Description"]}
                data={Table_1_Data}
              />
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">2. How We Use Personal Data</h2>
            <div className="space-y-3 lg:space-y-5 font-light">
              <p className="text-white/70 text-sm lg:text-base">
                We use Personal Data to provide the Service, including allowing Customers to book photoshoots, ensuring Photographers are paid, and facilitating the transmission of photographs from Photographers to Customers. This processing is necessary to perform our contract with you.
              </p>
              <p className="text-white/70 text-sm lg:text-base">
                We also use Personal Data as necessary for the following legitimate business interests:
              </p>
              <ul className="text-white/70 text-sm lg:text-base list-disc pl-5 lg:leading-[28px]">
                <li>
                  To contact and communicate with you, including responding to your inquiries, comments, feedback, or questions.
                </li>
                <li>
                  To manage our relationship with you, including sending administrative information about changes to our terms, conditions, and policies.
                </li>
                <li>
                  To analyse how you interact with our Service and improve its content and functionality.
                </li>
                <li>
                  To administer and protect our business and the Site, prevent fraud, and ensure the security of our IT systems and networks.
                </li>
                <li>
                  To comply with legal obligations and protect our rights, privacy, safety, or property, and that of our affiliates, users, or third parties.
                </li>
              </ul>
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7" >
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">3. How We Share and Disclose Personal Data</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                In certain circumstances, we may share your Personal Data with third parties as follows:
              </p>
              <ReusableTable
                titleColumns={["Data Recipients", "Purpose of Sharing"]}
                data={Table_3_Data}
              />
            </div>
          </div >
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">4. Data Retention</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                We retain Personal Data for as long as necessary for the purposes described in this Privacy Policy, while we have a legitimate business need, or as required by law. Specifically:
              </p>

              <ul className="text-white/70 text-sm lg:text-base list-disc pl-5 lg:leading-[28px] font-light">
                <li>
                  Account Data: Retained for the duration of your account plus 5 years.
                </li>
                <li>
                  Payment Data: Retained for 7 years for tax and audit purposes.
                </li>
                <li>
                  Photograph Data: Retained for 1 year unless otherwise agreed.
                </li>
                <li>
                  Communication Data: Retained for 3 years.
                </li>
                <li>
                  Background Check Data: Retained for 5 years.
                </li>
              </ul>
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">5. Your Privacy Rights</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                <span className="text-white font-medium">5.1 U.S. Residents&apos; Rights : </span> If you are a resident of the U.S., including California, you have the following rights under applicable laws such as the California Consumer Privacy Act (CCPA):
              </p>

              <ul className="text-white/70 text-sm lg:text-base list-disc pl-5 lg:leading-[28px] font-light">
                <li>
                  The right to request details about collected Personal Data.
                </li>
                <li>
                  The right to request deletion of Personal Data.
                </li>
                <li>
                  The right to be free from discrimination for exercising privacy rights.
                </li>
                <li>
                  The right to opt out of data sales (if applicable). If we sell Personal Data, we will provide a “Do Not Sell My Personal Information” link on our website.
                </li>
                <li>
                  The right to opt-in or opt-out of arbitration agreements in compliance with California-specific consumer protection laws.
                </li>
              </ul>

              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                To exercise these rights, contact us using the information below.
              </p>

              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                <span className="text-white font-medium">5.2 European Residents&apos; Rights (GDPR Compliance) : </span> If you are located in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR), including:
              </p>

              <ul className="text-white/70 text-sm lg:text-base list-disc pl-5 lg:leading-[28px] font-light">
                <li>
                  The right to access and rectify your Personal Data.
                </li>
                <li>
                  The right to request data deletion or restriction.
                </li>
                <li>
                  The right to object to data processing.
                </li>
                <li>
                  The right to data portability.
                </li>
              </ul>

              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                We rely on legal bases such as contract necessity, legitimate interests, consent, and legal compliance for data processing.
              </p>
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">6. Children’s Privacy</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                Our Service is not directed to children under <span className="text-white font-medium">13</span> years of age, and we do not knowingly collect data from children under <span className="text-white font-medium">13</span> in compliance with the <span className="text-white font-medium">Children&apos;s Online Privacy Protection Act (COPPA)</span>. <br />If you believe a minor has provided Personal Data, contact us to request removal.
              </p>

            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">7. International Data Transfers</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                Your Personal Data may be stored and processed in the U.S. We implement appropriate safeguards for international data transfers as required by law.
              </p>
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">8. Cookies & Tracking Technologies</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                We use cookies and similar tracking technologies (e.g., Google Analytics, Facebook Pixel) to analyse website traffic and enhance user experience. By using our Site, you consent to our cookie practices. For more details, refer to our <span className="text-white font-normal">Cookie Policy.</span>
                {/* Cookie Policy Link ti be added once avilable */}
              </p>
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">9. Data Security</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                We follow industry standards to protect Personal Data from unauthorized access, loss, or misuse. However, no online transmission is fully secure. Users should take precautions when sharing information.
              </p>
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">10. Refunds and Payment Processing Liability</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                If you purchase services through our Site, payment processing is handled by third-party vendors. We are not responsible for unauthorized transactions or processing errors. Refunds, if applicable, are subject to our refund policy outlined on our Site.
              </p>
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="my-4 lg:my-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">11. Changes to This Privacy Policy</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                We may update this Privacy Policy periodically. Continued use of our Service implies acceptance of updates.
              </p>
            </div>
          </div>
          <div className="h-[1px] w-full bg-[linear-gradient(90deg,_#FFF_0%,_rgba(255,255,255,0.50)_50%,_rgba(255,255,255,0)_100%)] opacity-20" />

          <div className="mt-4 lg:mt-7">
            <h2 className="text-lg lg:text-2xl font-bold text-[#E8D1AB] mb-3 lg:mb-5">12. Contact Us</h2>
            <div className="space-y-3 lg:space-y-5">
              <p className="text-white/70 text-sm lg:text-base lg:leading-[28px] font-light">
                For questions about this Privacy Policy or to exercise your rights, contact us at:
              </p>
              <div>
                <p className="text-white text-sm lg:text-base lg:leading-[28px]">
                  Beige
                </p>
                <p className="text-white text-sm lg:text-base lg:leading-[28px]">
                  Email: sales@beigecorporation.io
                </p>
                <p className="text-white text-sm lg:text-base lg:leading-[28px]">
                  Phone: 323-826-7230
                </p>
              </div>
            </div>
          </div>
        </Container >
      </section >

      <Footer />
    </main >
  );
}