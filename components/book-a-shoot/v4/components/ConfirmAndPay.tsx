"use client";

import React, { useState } from "react";
import { ArrowLeft, Check, CreditCard, Phone, BadgeCheck, ChevronDown, Camera, UserRound } from "lucide-react";
import { ServiceAgreementModal } from "@/components/common/ServiceAgreementModal";

export interface PricingBreakdown {
  serviceHeading?: string;
  packageName?: string;
  crewLabel?: string;
  summaryRows?: Array<{ label: string; amount: number }>;
  serviceName: string;
  baseServiceCost: number;
  showBaseServiceCost: boolean;
  packageOffers: string[];
  photosIncluded: number;
  extraPhotoUnitsText: string;
  extraPhotosCount: number;
  totalPhotosCount: number;
  totalEditsText: string;
  videoEditUnitsText: string;
  videoEditsCount: number;
  editingServiceCost: number;
  creativeRoleTitle: string;
  creativeRoleCost: number;
  showCreativeRoleCost: boolean;
  addOnsCount: number;
  addOnsCost: number;
  addOnsText: string;
  studioCost: number;
  studioText: string;
  mandatoryFeeCost: number;
  mandatoryFeeText: string;
  mandatoryFees: Array<{ name: string; amount: number }>;
  pricingBalanceCost: number;
  pricingBalanceText: string;
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
  onConfirmAndPay?: (paymentAmount?: number) => void;
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
  showBaseServiceCost: true,
  packageOffers: [
    "All Raw Images, Lighting & Insurance Provided",
    "Up to 45 Minutes Setup Time",
    "Digital Delivery",
  ],
  photosIncluded: 100,
  extraPhotoUnitsText: "Extra Photo Units x1",
  extraPhotosCount: 25,
  totalPhotosCount: 125,
  totalEditsText: "125 Photos",
  videoEditUnitsText: "",
  videoEditsCount: 0,
  editingServiceCost: 500,
  creativeRoleTitle: "Photographer x1",
  creativeRoleCost: 250,
  showCreativeRoleCost: true,
  addOnsCount: 1,
  addOnsCost: 350,
  addOnsText: "Added 1 Add-on",
  studioCost: 0,
  studioText: "",
  mandatoryFeeCost: 0,
  mandatoryFeeText: "",
  mandatoryFees: [],
  pricingBalanceCost: 0,
  pricingBalanceText: "",
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
  subtitle = "Review your final total and payment method to confirm your production.",
  stepNumber = "9",
  completionPercentage = 98,
}: ConfirmAndPayProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [packageExpanded, setPackageExpanded] = useState(true);
  const [acceptServiceAgreement, setAcceptServiceAgreement] = useState(true);
  const [isServiceAgreementOpen, setIsServiceAgreementOpen] = useState(false);
  const data = { ...DEFAULT_PRICING, ...pricingData };
  const mandatoryFees = data.mandatoryFees.length > 0
    ? data.mandatoryFees
    : data.mandatoryFeeCost > 0
      ? [{ name: data.mandatoryFeeText || "Mandatory Fee", amount: data.mandatoryFeeCost }]
      : [];
  const summaryRows = data.summaryRows ?? [
    ...(data.showCreativeRoleCost ? [{ label: data.creativeRoleTitle, amount: data.creativeRoleCost }] : []),
    { label: "Editing Services", amount: data.editingServiceCost },
    ...(data.addOnsCost > 0 ? [{ label: data.addOnsText || "Add-ons", amount: data.addOnsCost }] : []),
    ...(data.studioCost > 0 ? [{ label: data.studioText || "Studio", amount: data.studioCost }] : []),
    ...mandatoryFees.map((fee) => ({ label: fee.name, amount: fee.amount })),
    ...(data.pricingBalanceCost > 0 ? [{ label: data.pricingBalanceText || "Production Fee", amount: data.pricingBalanceCost }] : []),
  ];
  // Display charges returned by the quote; the design's sample fee is not a new charge.
  const isCardCharge = (label: string) => /card.*(?:charge|fee)|(?:processing|payment).*fee/i.test(label);
  const cardCharges = summaryRows.filter((row) => isCardCharge(row.label));
  const productionRows = summaryRows.filter((row) => !isCardCharge(row.label));
  const subtotal = data.totalAmount - cardCharges.reduce((sum, row) => sum + row.amount, 0);
  const hasEdits = data.photosIncluded > 0 || data.extraPhotosCount > 0 || data.videoEditsCount > 0;
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  const handleConfirmClick = () => {
    if (agreedToTerms && !isSubmitting) onConfirmAndPay?.();
  };
  const row = (label: string, amount: number, key: React.Key) => (
    <div key={key} className="flex items-start justify-between gap-5 text-xs lg:text-sm leading-relaxed">
      <span className="min-w-0 text-white/50">{label}</span>
      <span className="shrink-0 tabular-nums text-white/90">{formatCurrency(amount)}</span>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-6 lg:pt-5 pb-32 lg:pb-36 text-white">
      {onBack && (
        <button type="button" onClick={onBack} aria-label="Back to shoot summary" disabled={isSubmitting}
          className="mb-6 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#1D1D1D] hover:bg-white/10 disabled:opacity-40">
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}
      <div className="mb-6 lg:mb-8">
        <span className="mb-3 block text-xs lg:text-sm font-light uppercase text-[#E8D1AB]">STEP {stepNumber}</span>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-[#E8D1AB]" style={{ width: `${completionPercentage}%` }} />
        </div>
      </div>
      <h1 className="mb-3 text-3xl lg:text-5xl font-['Roboto_Condensed'] font-medium tracking-tight">{title}</h1>
      <p className="mb-7 lg:mb-9 text-sm lg:text-base text-white/50">{subtitle}</p>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-9">
        <section className="min-w-0" aria-label="Your package">
          <h2 className="mb-3 text-xs lg:text-sm uppercase tracking-widest text-[#E8D1AB]">{data.serviceHeading || "Production Services"}</h2>
          <div className="overflow-hidden rounded-lg border border-white/10">
            <button type="button" onClick={() => setPackageExpanded((value) => !value)}
              aria-expanded={packageExpanded} aria-controls="booking-package-inclusions"
              className="flex w-full items-center gap-3 bg-[#1E1E1C] px-4 py-5 text-left hover:bg-white/5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/10 text-white/50"><Camera className="h-4 w-4" strokeWidth={1} /></span>
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-xs lg:text-sm">
                <span>{data.packageName || data.serviceName}</span>
                <span className="rounded-full border border-white/10 bg-[#2B2925] px-2 py-1 text-[10px] text-[#E8D1AB]">{packageExpanded ? "Hide Package Includes" : "Show Package Includes"}</span>
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${packageExpanded ? "rotate-180" : ""}`} />
            </button>
            <div id="booking-package-inclusions" hidden={!packageExpanded} className="border-t border-white/5 px-4 py-5">
              <ul className="space-y-3">
                {data.packageOffers.map((offer, index) => (
                  <li key={`${offer}-${index}`} className="flex items-start gap-3 text-xs lg:text-sm italic leading-relaxed text-white/55">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/20"><Check className="h-3 w-3" strokeWidth={1} /></span>
                    <span>{offer}</span>
                  </li>
                ))}
              </ul>
            </div>
            {(data.crewLabel || data.studioCrewSize) && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 bg-[#1E1E1C] px-4 py-4">
                <div className="flex min-w-0 items-center gap-3 text-xs lg:text-sm">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/10 text-white/50"><UserRound className="h-4 w-4" strokeWidth={1} /></span>
                  <div>
                    {data.crewLabel && <p>{data.crewLabel}</p>}
                    {data.studioCrewSize && <p className="text-white/50">Studio cast & crew: {data.studioCrewSize}</p>}
                  </div>
                </div>
                {data.crewLabel && <span className="rounded-full border border-emerald-500/10 bg-emerald-500/10 px-3 py-1 text-[10px] tracking-wider text-emerald-400">INCLUDED</span>}
              </div>
            )}
          </div>

          {hasEdits && (
            <section className="mt-5" aria-label="Editing services">
              <h2 className="mb-4 text-xs uppercase tracking-widest text-white/80">Editing Services</h2>
              <div className="space-y-3 text-xs lg:text-sm">
                {data.photosIncluded > 0 && <div className="flex justify-between gap-4"><span className="text-white/50">Photos Included <span className="align-super rounded-sm bg-[#E8D1AB] px-1 text-[7px] font-semibold text-black">Free</span></span><span>{data.photosIncluded} Photos</span></div>}
                {data.extraPhotosCount > 0 && <div className="flex justify-between gap-4"><span className="text-white/50">{data.extraPhotoUnitsText}</span><span className="shrink-0">{data.extraPhotosCount} Photos</span></div>}
                {data.videoEditsCount > 0 && <div className="flex justify-between gap-4"><span className="text-white/50">{data.videoEditUnitsText || "Video edits"}</span><span className="shrink-0">{data.videoEditsCount} Video{data.videoEditsCount === 1 ? "" : "s"}</span></div>}
                <div className="flex justify-between gap-4 border-t border-white/5 py-4 text-[#E8D1AB]"><span>Total Edits</span><span className="text-right">{data.totalEditsText}</span></div>
              </div>
            </section>
          )}
          <div className="mt-3 flex items-center justify-between gap-4 border-y border-white/5 py-4">
            <span className="text-sm font-semibold uppercase tracking-widest text-white/60">Total to Pay</span>
            <span className="text-2xl lg:text-3xl font-semibold tracking-tight tabular-nums">{formatCurrency(data.totalAmount)}</span>
          </div>
          <div className="my-5 flex items-start gap-3 text-xs lg:text-sm leading-relaxed">
            <input id="booking-payment-terms" type="checkbox" checked={agreedToTerms} onChange={(event) => setAgreedToTerms(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[#E8D1AB]" />
            <div>
              <label htmlFor="booking-payment-terms" className="cursor-pointer">By continuing to payment, you agree to our </label>
              <button type="button" onClick={() => setIsServiceAgreementOpen(true)} className="text-left text-[#E8D1AB] underline underline-offset-4">Services Agreement, Terms & Conditions, Cancellation Policy, and Privacy Policy.</button>
            </div>
          </div>
          <button type="button" onClick={onConnectTeam} className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-4 py-3 text-xs lg:text-sm font-medium text-black hover:bg-white/90">
            <Phone className="h-4 w-4" /> Connect with Beige Team
          </button>
        </section>

        <aside className="min-w-0 space-y-5" aria-label="Payment and pricing summary">
          <section>
            <h2 className="mb-3 text-xs lg:text-sm uppercase tracking-widest">Payment Method</h2>
            <div className="flex items-center gap-3 rounded-md border border-[#E8D1AB]/15 bg-[#23221F] p-4 lg:py-5">
              <span className="flex h-8 w-8 items-center justify-center rounded bg-[#E8D1AB]/10 text-[#E8D1AB]"><CreditCard className="h-4 w-4" strokeWidth={1} /></span>
              <span className="flex-1 text-xs lg:text-sm">Credit / Debit Card</span>
              <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center rounded-full border border-[#E8D1AB]"><span className="h-2 w-2 rounded-full bg-[#E8D1AB]" /></span>
            </div>
          </section>
          <section>
            <h2 className="mb-4 text-xs uppercase tracking-widest">Pricing Summary</h2>
            <div className="space-y-2.5">{productionRows.map((item, index) => row(item.label, item.amount, index))}</div>
            <div className="mt-3 space-y-3 border-t border-white/5 py-3">
              {row("Sub Total", subtotal, "subtotal")}
              {cardCharges.map((item, index) => row(item.label, item.amount, `card-${index}`))}
            </div>
            <div className="flex justify-between gap-4 border-t border-white/5 pt-3 text-base font-semibold"><span>Final Amount</span><span className="tabular-nums">{formatCurrency(data.totalAmount)}</span></div>
          </section>
          <section className="border-l-2 border-[#E8D1AB]/30 pl-4">
            <h2 className="mb-3 flex items-center gap-2 text-[10px] lg:text-xs uppercase tracking-widest text-[#E8D1AB]"><BadgeCheck className="h-4 w-4 shrink-0" strokeWidth={1} /> Beige Quality Guarantee</h2>
            <p className="text-xs italic leading-relaxed text-white/45">Our Beige Quality Guarantee ensures your production meets professional standards. If your shoot does not meet the agreed scope or quality expectations, we&apos;ll work with you and your assigned creative partner to make it right — including a complimentary reshoot if necessary.</p>
          </section>
        </aside>
      </div>

      <div data-testid="payment-footer" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-[#171717] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-8 lg:py-5">
          {onBack && <button type="button" onClick={onBack} disabled={isSubmitting} className="rounded-lg border border-white/25 px-6 py-3.5 text-sm lg:min-w-[180px] lg:text-base hover:bg-white/5 disabled:opacity-40">Back</button>}
          <button type="button" onClick={handleConfirmClick} disabled={!agreedToTerms || isSubmitting} className="ml-auto rounded-lg bg-[#E8D1AB] px-5 py-3.5 text-sm font-medium text-black hover:bg-[#dfc498] disabled:cursor-not-allowed disabled:opacity-40 lg:px-8 lg:text-base">
            {isSubmitting ? "Confirming…" : `Confirm & Pay ${formatCurrency(data.totalAmount)}`}
          </button>
        </div>
      </div>
      <ServiceAgreementModal isOpen={isServiceAgreementOpen} initialChecked={acceptServiceAgreement} onClose={() => setIsServiceAgreementOpen(false)} onAccept={() => {
        setAcceptServiceAgreement(true);
        setAgreedToTerms(true);
        setIsServiceAgreementOpen(false);
      }} />
    </div>
  );
}
