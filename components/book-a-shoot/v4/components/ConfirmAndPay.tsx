"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Info,
  Check,
  CreditCard,
  ShieldCheck,
  Phone,
  Pencil,
  Clock,
  FolderDown,
  BadgeCheck,
  PencilLine,
  Clapperboard,
} from "lucide-react";
import { ServiceAgreementModal } from "@/components/common/ServiceAgreementModal";

export interface PricingBreakdown {
  serviceName: string;
  baseServiceCost: number;
  packageOffers: string[];
  photosIncluded: number;
  extraPhotoUnitsText: string;
  extraPhotosCount: number;
  totalPhotosCount: number;
  editingServiceCost: number;
  creativeRoleTitle: string;
  creativeRoleCost: number;
  addOnsCount: number;
  addOnsCost: number;
  totalAmount: number;
  depositAmount: number;
  studioName: string;
  studioFee: number;
  studioType: string;
  studioTypeFee: number;
  studioCrewSize: string;
  studioDuration: string;
  studioBaseFee: number;
  platformFee: number;
}

interface ConfirmAndPayProps {
  onBack?: () => void;
  onConfirmAndPay?: () => void;
  onConnectTeam?: () => void;
  pricingData?: Partial<PricingBreakdown>;
  isSubmitting?: boolean;
  title?: string;
  subtitle?: string;
  stepNumber?: string;
  completionPercentage?: number;
}

const DEFAULT_PRICING: PricingBreakdown = {
  serviceName: "Photography Services",
  baseServiceCost: 3000,
  packageOffers: [
    "All Raw Images, Lighting & Insurance Provided",
    "Up to 45 Minutes Setup Time",
    "Digital Delivery",
  ],
  photosIncluded: 100,
  extraPhotoUnitsText: "Extra Photo Units x1",
  extraPhotosCount: 25,
  totalPhotosCount: 125,
  editingServiceCost: 500,
  creativeRoleTitle: "Photographer x1",
  creativeRoleCost: 275,
  addOnsCount: 1,
  addOnsCost: 350,
  totalAmount: 4125,
  depositAmount: 500,
  studioName: "Beige Media (Modern Resort Villa with Jacuzzi)",
  studioFee: 500,
  studioType: "Productions",
  studioTypeFee: 50,
  studioCrewSize: "5-6 Max",
  studioDuration: "4 hours",
  studioBaseFee: 600,
  platformFee: 25,
};

export default function ConfirmAndPay({
  onBack,
  onConfirmAndPay,
  onConnectTeam,
  pricingData = {},
  isSubmitting = false,
  title = "One Step Away",
  subtitle = "Review your final total and ConfirmAndPay method to confirm your production.",
  stepNumber = "09",
  completionPercentage = 98,
}: ConfirmAndPayProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const data = { ...DEFAULT_PRICING, ...pricingData };

  const [acceptServiceAgreement, setAcceptServiceAgreement] = useState(true);
  const [isServiceAgreementOpen, setIsServiceAgreementOpen] = useState(false);

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex flex-col min-h-[calc(100vh-160px)] justify-between">
      {/* Top Content Stack */}
      <div>
        {/* Back Arrow */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-11 h-11 rounded-full bg-[#1D1D1D] border border-[#9C9C9C80] flex items-center justify-center text-white hover:text-white/80 transition-colors mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Progress Step Header */}
      <div className="mb-8">
        <span className="text-sm lg:text-lg font-light text-[#E8D1AB] uppercase block mb-2 lg:mb-4 font-['Instrument_Sans']">
          STEP {stepNumber}
        </span>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-[linear-gradient(241deg,rgba(255,255,255,0.40)_9.9%,rgba(255,255,255,0.00)_151.26%)]">
          <div
            className="h-full bg-[#E8D1AB] w-full rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Title & Description */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-['Roboto_Condensed'] font-medium text-white mb-3 tracking-tight">
          {title}
        </h1>
        <p className="text-white/30 text-base md:text-xl font-light">
          {subtitle}
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Column: Pricing Summary */}
        <div className="lg:col-span-7 border border-white/20 rounded-2xl flex flex-col justify-between">
          <div className="bg-gradient-to-b from-[#191919] to-rgba(16,16,16,0) rounded-2xl p-5 lg:px-7 border-b border-white/20">
            <h2 className="text-lg lg:text-2xl font-['Roboto_Condensed'] text-white">
              Pricing Summary
            </h2>
          </div>

          {/* // show when only creative services are selected */}
          {/* <div className="p-4 lg:p-8">
            Service Line Header
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[#A9A9A9] text-xs lg:text-sm">{data.serviceName}</span>
                <Info className="w-5 h-5 text-white cursor-pointer" />
              </div>
              <span className="text-sm lg:text-base font-bold text-white">
                {formatCurrency(data.baseServiceCost)}
              </span>
            </div>

            Package Offer Card
            <div className="bg-[#FEF5E5] text-black rounded-xl mb-6">
              <div className="p-4 border-b border-black/40">
                <p className="text-xs lg:text-sm font-bold text-[#171717]">
                  Package Offer
                </p>
              </div>

              <div className="p-4 space-y-4">
                {data.packageOffers.map((offer, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs lg:text-sm font-medium italic text-black">
                    <div className="w-10 h-10 rounded-full bg-[#171717] flex items-center justify-center shrink-0">
                      {idx === 0 && <ShieldCheck className="w-5 h-5 text-[#E8D1AB]" />}
                      {idx === 1 && <Clock className="w-5 h-5 text-[#E8D1AB]" />}
                      {idx === 2 && <FolderDown className="w-5 h-5 text-[#E8D1AB]" />}
                    </div>
                    <span>{offer}</span>
                  </div>
                ))}
              </div>
            </div>

            Editing Services Breakdown
            <div className="space-y-2 mb-4 text-xs md:text-sm text-white/70">
              <p className="text-white/40 mb-4 text-xs lg:text-sm">+ Editing services</p>
              <div className="flex justify-between items-center">
                <div className="relative flex items-center gap-2">
                  <span className="text-white text-xs lg:text-sm">Photos Included</span>
                  <span className="absolute -top-1 -right-8 text-[8px] px-1 py-0.5 rounded bg-[#E8D1AB] text-black">
                    Free
                  </span>
                </div>
                <span className="text-[#E8D1AB] text-sm lg:text-base font-bold">{data.photosIncluded} Photos</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#A9A9A9] text-xs lg:text-sm ">{data.extraPhotoUnitsText}</span>
                <span className="text-white text-sm lg:text-base font-bold">{data.extraPhotosCount} Photos</span>
              </div>
            </div>

            Total Edits Pill Box
            <div className="bg-[#1D1C1A] border border-[#E8D1AB]/30 rounded-lg p-4 flex justify-between items-center text-[#E8D1AB]">
              <span className="text-xs lg:text-sm ">Total Edits</span>
              <span className="font-bold text-sm lg:text-base">{data.totalPhotosCount} Photos</span>
            </div>
          </div> */}

          {/* Show only when Studios are selected */}
          <div className="p-4 lg:p-8">
            <div className="flex justify-between">
              <span className="text-[#A9A9A9] text-xs lg:text-sm">{data.studioName}</span>
              <span className="text-white text-sm lg:text-base font-bold">{formatCurrency(data.studioFee)}</span>
            </div>
          </div>

          <div className="border-t border-white/20 p-4 lg:p-8">
            <div className="flex justify-between items-start">
              <div className="space-y-5">
                <div className="flex gap-3 items-center">
                  <div className="p-3 rounded-full bg-[#E8D1AB] text-black">
                    <Clapperboard size={24} strokeWidth={1} />
                  </div>
                  <p className="text-base lg:text-lg font-medium text-white">{data.studioType}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="space-y-2">
                    <p className="text-white text-xs lg:text-sm">Min Duration:</p>
                    <div className="bg-[#E8D5B5]/20 rounded-sm px-2 py-1 text-[#E8D5B5] text-center min-w-25">
                      <span>
                        {data.studioDuration}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-white text-xs lg:text-sm">Max People:</p>
                    <div className="bg-[#E8D5B5]/20 rounded-sm px-2 py-1 text-[#E8D5B5] text-center min-w-25">
                      <span>
                        {data.studioCrewSize}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-[#E8D1AB] text-sm lg:text-base font-bold">{formatCurrency(data.studioFee)}</span>
            </div>
          </div>

          {/* Fee breakdown component */}
          <div className="border-t border-white/20 p-4 lg:p-8">
            <div className="space-y-3 lg:space-y-4">
              <div className="flex justify-between">
                <span className="text-[#A9A9A9] text-xs lg:text-sm ">Base hours</span>
                <span className="text-white text-sm lg:text-base font-bold">{formatCurrency(data.studioBaseFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A9A9A9] text-xs lg:text-sm ">Platform fee</span>
                <span className="text-white text-sm lg:text-base font-bold">{formatCurrency(data.platformFee)}</span>
              </div>
            </div>
          </div>
          {/* Show only when Studios are selected ---Ends */}

          {/* Fee breakdown component */}
          <div className="border-t border-white/20 p-4 lg:p-8">
            <div className="space-y-3 lg:space-y-4">
              <div className="flex justify-between">
                <span className="text-[#A9A9A9] text-xs lg:text-sm ">Editing Service</span>
                <span className="text-white text-sm lg:text-base font-bold">{formatCurrency(data.editingServiceCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A9A9A9] text-xs lg:text-sm ">{data.creativeRoleTitle}</span>
                <span className="text-white text-sm lg:text-base font-bold">{formatCurrency(data.creativeRoleCost)}</span>
              </div>
              {/* If studio added */}
              <div className="flex justify-between">
                <span className="text-[#A9A9A9] text-xs lg:text-sm ">Studio Rental 4 hours × $150/hr</span>
                <span className="text-white text-sm lg:text-base font-bold">{formatCurrency(600)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A9A9A9] text-xs lg:text-sm ">Studio Platform fee</span>
                <span className="text-white text-sm lg:text-base font-bold">{formatCurrency(25)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#A9A9A9] text-xs lg:text-sm  flex items-center gap-1.5">
                  Added {data.addOnsCount} Add-ons
                  <PencilLine className="w-3.5 h-3.5 text-white hover:text-white/80 cursor-pointer" />
                </span>
                <span className="text-white text-sm lg:text-base font-bold">{formatCurrency(data.addOnsCost)}</span>
              </div>
            </div>
          </div>


          {/* Total Amount Header */}
          <div className="border-t border-white/20 bg-[#161515] text-[#E8D1AB] p-4 lg:p-8">
            <div className="flex justify-between items-center font-medium">
              <span className="text-sm lg:text-base">Total Amount</span>
              <span className="lg:text-xl">
                {formatCurrency(data.totalAmount)}
              </span>
            </div>
          </div>
          <div className="border-t border-white/20 p-4 lg:p-8">
            {/* Action Buttons inside Left Card */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={onConfirmAndPay}
                disabled={isSubmitting}
                className="w-full py-4 rounded-lg bg-[#E8D1AB] text-black hover:bg-[#dfc498] font-medium text-sm lg:text-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Check className="w-6 h-6" />
                {isSubmitting ? "Confirming..." : "Confirm & Pay"}
              </button>

              <div className="w-full rounded-lg border border-white/10 p-5 text-center">
                <p className="text-sm lg:text-base font-medium text-[#E8D1AB]">
                  Secure with deposit — {formatCurrency(data.depositAmount)} now
                </p>
                <p className="text-xs text-white/75 mt-0.5">
                  Balance of {formatCurrency(data.totalAmount - data.depositAmount)} due on shoot day
                </p>
              </div>

            </div>
          </div>
          <button
            type="button"
            onClick={onConnectTeam}
            className="w-full py-5 rounded-b-xl bg-white text-black font-medium text-sm lg:text-base transition-colors hover:bg-white/90 flex items-center justify-center gap-2"
          >
            <Phone className="w-6 h-6" />
            Connect with Beige Team
          </button>
        </div>

        {/* Right Column: ConfirmAndPay Method & Quality Guarantee */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0F0F0F] border border-[#ECE5D8]/10 rounded-2xl p-4 lg:p-7 space-y-3 lg:space-y-6">
            <h2 className="text-lg lg:text-2xl font-['Roboto_Condensed'] text-white">
              Payment method
            </h2>

            <div className="bg-gradient-to-r from-[#E8D1AB] to-[#FDEFD9] rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-15 lg:h-15 rounded-xl bg-[#171717] text-white flex items-center justify-center">
                  <CreditCard className="w-5 h-5 lg:w-8 lg:h-8" strokeWidth={1} />
                </div>
                <span className="text-black font-medium text-sm lg:text-lg">Credit / Debit Card</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FDEFD9]" />
              </div>
            </div>
          </div>

          {/* Quality Guarantee Box */}
          <div className="bg-[#121212]/90 border border-white/10 rounded-2xl p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8D5B5]/20 flex items-center justify-center shrink-0 mt-0.5">
              <BadgeCheck className="w-6 h-6 text-[#E8D1AB]" />
            </div>
            <p className="text-xs leading-relaxed text-[#E8D1AB] italic font-bold">
              Our Beige Quality Guarantee ensures your production meets professional standards. If your shoot does not meet the agreed scope or quality expectations, we'll work with you and your assigned creative partner to make it right — including a complimentary reshoot if necessary.
            </p>
          </div>
        </div>
      </div>

      {/* Terms Checkbox Card */}
      <label className="w-full bg-[#272626] rounded-xl p-5 flex items-center gap-3 cursor-pointer hover:border-white/20 transition-colors">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.value !== undefined ? e.target.checked : false)}
          className="w-5 h-5 accent-[#E8D1AB] rounded shrink-0"
        />
        <span className="text-sm lg:text-lg text-[#E8D1AB]">
          By continuing to payment, you agree to our

          <button
            type="button"
            onClick={() => setIsServiceAgreementOpen(true)}
            className="px-1 underline hover:text-[#f3e4cd]"
          >
            Services Agreement, Terms & Conditions,
          </button>
          Cancellation Policy, and Privacy Policy.
        </span>
      </label>

      {/* Sticky Bottom Navigation Footer */}
      <div className="pt-10 mt-12 border-t border-white/10 flex items-center justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-8 py-3.5 min-w-[185px] rounded-lg border border-[#8E8E8E] bg-[#101010] text-white font-medium text-base lg:text-xl hover:bg-white/5 transition-all cursor-pointer"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={onConfirmAndPay}
          disabled={!agreedToTerms}
          className="px-10 py-3.5 rounded-lg bg-[#E8D1AB] text-[#101010] font-medium text-base lg:text-xl hover:bg-[#dfc498] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer ml-auto"
        >
          Confirm & Pay {formatCurrency(data.totalAmount)}
        </button>
      </div>

      <ServiceAgreementModal
        isOpen={isServiceAgreementOpen}
        initialChecked={acceptServiceAgreement}
        onClose={() => setIsServiceAgreementOpen(false)}
        onAccept={() => {
          setAcceptServiceAgreement(true);
          setIsServiceAgreementOpen(false);
        }}
      />
    </div>
  );
}
