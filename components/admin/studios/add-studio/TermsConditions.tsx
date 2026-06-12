"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";

interface TermItem {
  id: string;
  title: string;
  descriptions: string[];
}

const CANCELLATION_TERMS: TermItem[] = [
  {
    id: "window-refunded",
    title: "Cancellation Window & Refunded",
    descriptions: [
      "Guests may cancel with a full refund if cancellation is submitted at least 48 hours before the booking start time.",
      "If cancellation is made within 48 hours of start time, refunds may be reduced or unavailable depending on the policy selected at booking.",
      "Different cancellation options let studios choose how strict their policy is — e.g., Very Flexible, Flexible, Standard 30-Day, Standard 90-Day, each with defined refund rules based on how far in advance the booking is cancelled.",
      "Cleaning fees (if any) are refunded in full if the booking is cancelled and the space is not used.",
      "Cancellation requests must be submitted through the platform to be valid.",
    ],
  },
  {
    id: "host-cancellations",
    title: "Host / Studio Cancellations",
    descriptions: [
      "If a studio cancels a confirmed booking, the guest may receive a full refund or platform credit, and the studio may be subject to penalties to protect trust in the marketplace.",
    ],
  },
];

const SAFETY_TERMS: TermItem[] = [
  {
    id: "user-responsibility",
    title: "User Responsibility",
    descriptions: [
      "All communications and payments must be conducted through the platform to ensure security and protection against fraud.",
      "Hosts and creators should only participate in bookings where they feel safe and comfortable.",
      "Guests should provide accurate event information and be mindful of any local laws, age restrictions, or special permits that may apply.",
      "Hosts are encouraged to disclose any safety features (e.g., surveillance cameras) and ensure they are compliant with privacy expectations.",
    ],
  },
  {
    id: "conduct-compliance",
    title: "Conduct & Compliance",
    descriptions: [
      "Users must follow the platform’s community guidelines, respect neighbors, and avoid unsafe or unsanitary conditions.",
      "Guests and hosts are responsible for the behavior of anyone on the premises during a booking.",
    ],
  },
  {
    id: "trust-protection",
    title: "Trust & Protection",
    descriptions: [
      "The platform may use risk detection, identity verification, and fraud safeguards to enhance community security.",
      "If you feel unsafe or if conditions compromise your well-being or the space’s integrity, you may cancel the booking and reach out to support.",
    ],
  },
];

const CLEANLINESS_TERMS: TermItem[] = [
  {
    id: "studio-expectations",
    title: "Studio Expectations",
    descriptions: [
      "Hosts should provide a clean and orderly space that matches what has been advertised.",
      "Basic amenities like restrooms should be in working order, and the space should be ready for use upon arrival.",
    ],
  },
  {
    id: "guest-responsibility",
    title: "Guest Responsibility",
    descriptions: [
      "Guests should leave the space in substantially the same condition as received.",
      "Any damage or excessive mess beyond normal wear and tear may result in additional fees or charges.",
      "Hosts may specify post-booking cleaning protocols if needed.",
    ],
  },
];

const ADDITIONAL_TERMS: TermItem[] = [
  {
    id: "damage-liability",
    title: "Damage & Liability",
    descriptions: [
      "Guests agree to be responsible for any damage they or their crew cause during a booking.",
    ],
  }, {
    id: "health-safety",
    title: "Health & Safety",
    descriptions: [
      "Hosts may require depending on type of shoot: proof of liability insurance, permits, or safety documentation"
    ],
  }, {
    id: "good-neighbor-policy",
    title: "Good Neighbor Policy",
    descriptions: [
      "Especially for residential studio spaces, users must respect noise limits and local community rules."
    ],
  }
]


interface Props {
  isDark?: boolean;
  studioData: any;
  setStudioData: (data: any) => void;
}

export default function TermsConditions({ isDark = true, studioData, setStudioData }: Props) {
  // --- State Syncing ---
  const checkedItems: Record<string, boolean> = {
    "window-refunded": studioData.policies?.cancellation_and_refund?.cancellation_window_refunded,
    "host-cancellations": studioData.policies?.cancellation_and_refund?.host_studio_cancellations,
    "user-responsibility": studioData.policies?.safety?.user_responsibility,
    "conduct-compliance": studioData.policies?.safety?.conduct_and_compliance,
    "trust-protection": studioData.policies?.safety?.trust_and_protection,
    "studio-expectations": studioData.policies?.cleanliness?.studio_expectation,
    "guest-responsibility": studioData.policies?.cleanliness?.guest_responsibility,
    "damage-liability": studioData.policies?.additional?.damage_liability,
    "health-safety": studioData.policies?.additional?.health_and_safety,
    "good-neighbor-policy": studioData.policies?.additional?.good_neighbor_policy,
  };

  const toggleCheckbox = (id: string) => {
    const map: Record<string, { category: string; field: string }> = {
      "window-refunded": { category: "cancellation_and_refund", field: "cancellation_window_refunded" },
      "host-cancellations": { category: "cancellation_and_refund", field: "host_studio_cancellations" },
      "user-responsibility": { category: "safety", field: "user_responsibility" },
      "conduct-compliance": { category: "safety", field: "conduct_and_compliance" },
      "trust-protection": { category: "safety", field: "trust_and_protection" },
      "studio-expectations": { category: "cleanliness", field: "studio_expectation" },
      "guest-responsibility": { category: "cleanliness", field: "guest_responsibility" },
      "damage-liability": { category: "additional", field: "damage_liability" },
      "health-safety": { category: "additional", field: "health_and_safety" },
      "good-neighbor-policy": { category: "additional", field: "good_neighbor_policy" },
    };

    const target = map[id];
    if (target) {
      setStudioData({
        ...studioData,
        policies: {
          ...studioData.policies,
          [target.category]: {
            ...studioData.policies?.[target.category],
            [target.field]: !checkedItems[id]
          }
        }
      });
    }
  };

  const TermSection = ({ items }: { items: TermItem[] }) => (
    <>
      {items.map((term) => (
        <div key={term.id} className="flex gap-4 group items-baseline">
          {/* Functional Checkbox */}
          <button
            onClick={() => toggleCheckbox(term.id)}
            aria-checked={!!checkedItems[term.id]}
            className="flex-shrink-0 mt-1 focus:outline-none"
          >
            <div
              className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-all duration-200 ${checkedItems[term.id]
                  ? "bg-[#E8D1AB] border-[#E8D1AB]"
                  : `border-[#5B5B5B] ${isDark ? "hover:border-white/50" : "hover:border-black/50"}`
                }`}
            >
              <Check
                size={14}
                className={`transition-opacity duration-200 ${checkedItems[term.id] ? "text-black opacity-100" : "opacity-0"
                  }`}
              />
            </div>
          </button>

          {/* Text Content */}
          <div className="space-y-2.5">
            <h3 className={`text-xs lg:text-sm font-medium ${isDark ? "text-white" : "text-black"}`}>
              {term.title}
            </h3>
            <ul className="space-y-1">
              {term.descriptions.map((desc, index) => (
                <li key={index} className="flex gap-3 items-center">
                  <span className={`${isDark ? "text-white/40" : "text-black/40"} flex-shrink-0`}>•</span>
                  <p className={`${isDark ? "text-white/70" : "text-black/70"} text-xs lg:text-sm `}>
                    {desc}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="space-y-3 lg:space-y-6">
      <TermSection items={CANCELLATION_TERMS} />

      {/* Safety Policy Section */}
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
      <div>
        <h1 className={`text-lg lg:text-xl font-medium mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
          Safety Policy
        </h1>
        <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
          The platform is built for safe, reliable booking, and we expect all users to act responsibly:
        </p>
      </div>
      <TermSection items={SAFETY_TERMS} />

      {/* Cleanliness Policy Section */}
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
      <div>
        <h1 className={`text-lg lg:text-xl font-medium mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
          Cleanliness Policy
        </h1>
        <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
          Studios and creators must maintain cleanliness and hygiene standards:
        </p>
      </div>
      <TermSection items={CLEANLINESS_TERMS} />

      {/* Additional Policy Section */}
      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
      <div>
        <h1 className={`text-lg lg:text-xl font-medium mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
          Additional Policy
        </h1>
        <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
          These are inspired by marketplace standards and help round out your policies:
        </p>
      </div>
      <TermSection items={ADDITIONAL_TERMS} />

      <hr className={`border-t my-4 lg:my-9 ${isDark ? "border-[#3D3D3D]" : "border-[#00000080]"}`} />
    </div>
  );
}