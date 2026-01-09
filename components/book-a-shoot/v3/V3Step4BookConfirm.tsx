"use client";

import React, { useState, useEffect } from "react";
import { BookingDataV3 } from "./types";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { CreditCard, Calendar, MapPin, Clock, Loader2, Map, Icon, Info, ShieldCheck, FileImage, RefreshCw, Package, Phone } from "lucide-react";
import { useCalculateQuoteMutation } from "@/lib/redux/features/pricing/pricingApi";
import { newshootTypes } from "@/app/data/shootData";

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns";


interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: () => void;
  onBack: () => void;
  onConfirm: () => void; // New prop
  isSubmitting?: boolean;
}

interface ShootTypeProps {
  title: string;
  details: string; // e.g. "Conferences, summits, company offsites"
  image: string;
  stats?: { label: string; value: string }[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Crew role to pricing item ID mapping (from backend pricing_items table)
const CREW_ROLE_ITEMS = {
  videographer: 11,
  photographer: 10,
  cinematographer: 12
};

// Crew role display names and base rates (for display purposes)
const CREW_ROLE_INFO = {
  videographer: { label: "Videographer", baseRate: 275 },
  photographer: { label: "Photographer", baseRate: 275 },
  cinematographer: { label: "Cinematographer", baseRate: 410 }
};

export const V3Step4BookConfirm: React.FC<Props> = ({ data, updateData, onNext, onBack, onConfirm, isSubmitting }) => {
  const [calculateQuote, { isLoading: isCalculating }] = useCalculateQuoteMutation();
  const [quoteTotal, setQuoteTotal] = useState<number | null>(null);
  const [crewBreakdown, setCrewBreakdown] = useState<Array<{ role: string; cost: number }>>([]);
  const [durationHours, setDurationHours] = useState<number>(0);

  const shootInfo: ShootTypeProps = newshootTypes.find((type) => type.key === data.shootType)

  const handlePay = () => {
    if (!data.fullName || !data.email) {
      toast.error("Please fill in your contact information");
      return;
    }
    // Trigger submission
    onConfirm();
  };

  // Calculate duration in hours
  useEffect(() => {
    if (!data.startDate || !data.endDate) {
      setDurationHours(0);
      return;
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
    setDurationHours(hours);
  }, [data.startDate, data.endDate]);

  // Calculate quote when component mounts or data changes
  useEffect(() => {
    const fetchQuote = async () => {
      // Build items list based on content type (matching BookAShootV3 logic)
      let quoteItems: Array<{ item_id: number; quantity: number }> = [];
      const breakdown: Array<{ role: string; cost: number }> = [];

      // Filter out 'editing' as it doesn't have a pricing item yet
      const crewTypes = data.contentType.filter(type => type !== 'editing');

      crewTypes.forEach((type) => {
        if (type === "videographer" || type === "photographer" || type === "cinematographer") {
          const itemId = CREW_ROLE_ITEMS[type];
          quoteItems.push({ item_id: itemId, quantity: 1 });
        }
      });

      if (quoteItems.length === 0 || durationHours === 0) {
        setQuoteTotal(null);
        setCrewBreakdown([]);
        return;
      }

      try {
        const result = await calculateQuote({
          items: quoteItems,
          shootHours: durationHours,
          eventType: data.shootType || "general",
        }).unwrap();

        console.log('V3Step4BookConfirm - API Result:', {
          total: result.total,
          lineItems: result.lineItems,
          shootHours: result.shootHours,
          durationHours
        });

        setQuoteTotal(result.total);

        // Build crew breakdown from line items
        if (result.lineItems && result.lineItems.length > 0) {
          const breakdown = result.lineItems.map((item: any) => ({
            role: item.item_name,
            cost: parseFloat(item.line_total)
          }));
          console.log('Crew breakdown:', breakdown);
          setCrewBreakdown(breakdown);
        } else {
          // Fallback: calculate manually if lineItems not available
          const manualBreakdown = crewTypes.map((type) => {
            if (type === "videographer" || type === "photographer" || type === "cinematographer") {
              const info = CREW_ROLE_INFO[type];
              return {
                role: info.label,
                cost: info.baseRate * durationHours
              };
            }
            return null;
          }).filter(Boolean) as Array<{ role: string; cost: number }>;
          setCrewBreakdown(manualBreakdown);
        }
      } catch (error) {
        console.error("Failed to calculate quote:", error);
        // Fallback calculation
        let fallbackTotal = 0;
        const fallbackBreakdown = crewTypes.map((type) => {
          if (type === "videographer" || type === "photographer" || type === "cinematographer") {
            const info = CREW_ROLE_INFO[type];
            const cost = info.baseRate * durationHours;
            fallbackTotal += cost;
            return { role: info.label, cost };
          }
          return null;
        }).filter(Boolean) as Array<{ role: string; cost: number }>;

        setQuoteTotal(fallbackTotal);
        setCrewBreakdown(fallbackBreakdown);
      }
    };

    fetchQuote();
  }, [data.contentType, data.shootType, durationHours, calculateQuote]);

  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">

      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg lg:text-[64px] leading-[1.1] font-bold text-gradient-white tracking-tight mb-2 lg:mb-5">Review & Confirm</h2>
        <p className="text-white/60">Review your project details and complete payment</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 pt-8 lg:pt-15 border-t border-white/10 bg-[#101010">
        {/* Left Column: Summary & Contact */}
        <div className="flex-1 flex flex-col gap-8">
          <div className="cursor-pointer rounded-2xl border transition-all relative overflow-hidden border-white/20">
            <div className="bg-[#171717] p-7">
              <h4 className="text-lg font-medium text-white">Project Summary</h4>
            </div>

            {/* Project Summary */}
            <div className="p-6 flex flex-col gap-3 lg:gap-6 ">
              <div className="flex items-center gap-4 pb-8 border-b border-b-white/10">
                <div className="w-10 h-10 bg-[#E8D5B533] rounded-[10px] overflow-hidden relative">
                  {/* Placeholder for project image based on type */}
                  <div className="absolute inset-0 bg-[#E8D1AB]/10 flex items-center justify-center text-[#E8D1AB]">
                    {data.shootType.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#999] capitalize tracking-wide mb-1">Content Type</div>
                  <h3 className="text-base text-white capitalize">{data.contentType.join(" & ")}</h3>
                </div>
                {/* <div className="ml-auto">
                  <Button variant="outline" size="sm" onClick={onBack} className="text-xs h-8 border-white/20 text-white/60 hover:text-white">
                    Edit
                  </Button>
                </div> */}
              </div>

              <div className="rounded-[12px] overflow-hidden border border-white/10">
                <div className="p-4 flex gap-4 items-center">
                  <div className="w-[100px] h-[70px] lg:w-[209px] lg:h-[151px] bg-gradient-to-br from-[#E8D1AB]/20 to-[#E8D1AB]/5 rounded-lg flex items-center justify-center relative">
                    <Image
                      src={shootInfo.image || "/images/projects/interior.png"}
                      alt={"Sample shoot"}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex flex-col lg:flex-row gap-2 lg:gap-0 justify-between lg:items-center flex-1">
                    <div className="w-full">
                      <div className="">
                        <h4 className="text-[#E8D1AB] text-lg font-bold capitalize">{shootInfo.title}</h4>
                        <span className="text-sm text-[#A9A9A9]">{shootInfo.details}</span>
                      </div>
                    </div>

                    <div className="rounded-full bg-[#211F1C] border border-[#616161] min-w-[170px] py-2">
                      <p className="text-xs lg:text-sm text-center font-medium capitalize text-white/50">#Video shoot type</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#101010] px-5 py-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 lg:h-[62px] lg:w-[62px] rounded-xl bg-[#171717] flex items-center justify-center">
                      <Calendar size={32} className="text-[#9D9595]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-white text-lg font-medium capitalize">{format(new Date(data.startDate), 'EEEE, dd MMM yyyy')}</span>
                      <span className="text-sm text-[#A9A9A9]">Date</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#101010] px-5 py-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 lg:h-[62px] lg:w-[62px] rounded-xl bg-[#171717] flex items-center justify-center">
                      <Clock size={32} className="text-[#9D9595]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-white text-lg font-medium capitalize">{format(new Date(data.startDate), 'h:mm a')} - {format(new Date(data.startDate), 'h:mm a')}</span>
                      <span className="text-sm text-[#A9A9A9]">Time</span>
                    </div>
                  </div>
                </div>

                {/* <div className="bg-[#101010] p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60">
                      <Calendar size={14} />
                    </div>
                    <span className="text-white font-medium">
                      {data.startDate ? new Date(data.startDate).toLocaleDateString() : 'Date not set'}
                    </span>
                  </div>
                  <div className="text-xs text-white/40 pl-11">
                    {data.startDate ? new Date(data.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} -
                    {data.endDate ? new Date(data.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div> */}
              </div>

              <div className="bg-[#101010] px-5 py-3 rounded-xl border border-white/5 col-span-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 lg:h-[62px] lg:w-[62px] rounded-xl bg-[#171717] flex items-center justify-center">
                    <Map size={32} className="text-[#9D9595]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-white text-lg font-medium line-clamp-2">{data.location || 'Location not set'}</span>
                    <span className="text-sm text-[#A9A9A9]">Location</span>
                  </div>
                </div>
              </div>

              {/* Editing Services */}
              <div className="rounded-[16px] border border-white/5 bg-[#171717]">
                <div className="p-4 lg:p-[30px] border-b border-b-white/5">
                  <h4 className="text-white text-base lg:text-xl font-medium capitalize tracking-wide">Editing Services</h4>
                </div>
                <div className="p-4 lg:p-[30px] space-y-4">
                  <div className="flex flex-col gap-2 text-sm">
                    <span className="text-white">Video Edit</span>
                    <span className="bg-[#E8D5B533] w-fit text-[#E8D5B5] text-xs px-2 py-1 rounded-sm">{data.videoEditTypes.join(", ") || "None"}</span>
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    <span className="text-white">Photo Edit</span>
                    <span className="bg-[#E8D5B533] w-fit text-[#E8D5B5] text-xs px-2 py-1 rounded-sm">{data.photoEditTypes.join(", ") || "None"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="cursor-pointer rounded-2xl border transition-all relative overflow-hidden border-white/20">
            <div className="bg-[#171717] p-7">
              <h4 className="text-lg font-medium text-white">Contact Information</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8 p-4 lg:gap-8">
              <div className="relative space-y-2 col-span-full">
                <Label
                  htmlFor="fullName"
                  className="absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none"
                >
                  Full Name*
                </Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    type={"text"}
                    value={data.fullName}
                    onChange={(e) => updateData({ fullName: e.target.value })}
                    className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white bg-[#101010] text-sm lg:text-base"
                  />
                </div>
              </div>
              <div className="relative space-y-2">
                <Label
                  htmlFor="email"
                  className="absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none"
                >
                  Email Address*
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type={"email"}
                    value={data.email}
                    onChange={(e) => updateData({ email: e.target.value })}
                    className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white bg-[#101010] text-sm lg:text-base"
                  />
                </div>
              </div>
              <div className="relative space-y-2">
                <Label
                  htmlFor="phone"
                  className="absolute -top-2 lg:-top-3 left-4 z-10 px-2 bg-[#101010] text-sm lg:text-base text-white/60 pointer-events-none"
                >
                  Phone Number*
                </Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type={"tel"}
                    value={data.phone}
                    onChange={(e) => updateData({ phone: e.target.value })}
                    className="h-14 lg:h-[82px] w-full rounded-[12px] border border-white/30 px-4 text-white outline-none focus:border-white bg-[#101010] text-sm lg:text-base"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="cursor-pointer rounded-2xl border transition-all relative overflow-hidden border-white/20">
            <div className="bg-[#171717] p-7">
              <h4 className="text-lg font-medium text-white">Payment Method</h4>
            </div>
            <div className="flex flex-col gap-3 lg:gap-6 p-4 lg:p-7">
              <div className="bg-[#E8D1AB] p-4 rounded-2xl text-black flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 lg:h-[62px] lg:w-[62px] rounded-lg bg-[#101010] flex items-center justify-center">
                    <CreditCard size={32} className="text-[#E8D1AB]" />
                  </div>
                  <span className="font-medium">Credit / Debit Card</span>
                </div>
                <div className="w-5 h-5 lg:w-8 lg:h-8 rounded-full border-2 border-black flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-black" />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#171717] text-white/60 flex items-center justify-between cursor-pointer hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 lg:h-[62px] lg:w-[62px] bg-white/5 rounded-lg bg-[#101010] flex items-center justify-center">
                    <span className="font-bold text-xs">Stripe</span>
                  </div>
                  <span className="font-medium">Pay via Stripe</span>
                </div>
                <div className="w-5 h-5 lg:w-8 lg:h-8 rounded-full border-2 border-white/20" />
              </div>
              <div className="flex flex-col lg:flex-row gap-3 bg-[#2A2A2A] rounded-[10px] p-2 lg:p-4 items-center">
                <input
                  type="checkbox"
                />
                <p className="text-sm text-[#999]">
                  I agree to the <span className="text-[#E8D5B5]">Terms & Conditions</span>, <span className="text-[#E8D5B5]">Cancellation Policy</span>, and <span className="text-[#E8D5B5]">Privacy Policy</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Summary (Sticky) */}
        <div className="lg:w-[380px] shrink-0 ">
          <div className="border border-white/10 rounded-2xl ">
            <div className="bg-[#101010] p-7 rounded-t-2xl">
              <h3 className="text-xl font-bold">Pricing Summary</h3>
            </div>
            <div className="bg-[#171717] text-white">
              <div className="p-6 border-b border-b-white/10">
                {/* Type of Servioces and Base price */}
                <div className="flex justify-between mb-3.5">
                  <p className="text-[#A9A9A9] text-sm flex items-center gap-1">
                    Video Services <Info size={18} className="text-white" />
                  </p>
                  {/* Base value here: please set */}
                  <div className="font-bold">{"$6012.6"}</div>
                </div>

                {/* Package Offer section */}
                <div className="rounded-2xl border transition-all relative overflow-hidden bg-[#FEF5E5] text-[#171717]">
                  <div className="p-4">
                    <h4 className="text-sm font-bold">Package Offer</h4>
                  </div>
                  <div className="p-4 flex flex-col gap-3.5 border-t border-t-black/20 text-sm font-medium">
                    <div className="flex gap-3 items-center">
                      <div className="bg-[#171717] rounded-full p-2.5 text-[#E8D1AB]">
                        <ShieldCheck size={20} />
                      </div>
                      <p className="italic">Unlimited Usage Rights</p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="bg-[#171717] rounded-full p-2.5 text-[#E8D1AB]">
                        <FileImage size={20} />
                      </div>
                      <p className="italic">All Raw Content </p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="bg-[#171717] rounded-full p-2.5 text-[#E8D1AB]">
                        <Package size={20} />
                      </div>
                      <p className="italic">Include Edited Deliverable </p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="bg-[#171717] rounded-full p-2.5 text-[#E8D1AB]">
                        <RefreshCw size={20} />
                      </div>
                      <p className="italic">Up to 2 Sets of Revisions</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-b border-b-white/10">
                {isCalculating || quoteTotal === null ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-black/60" />
                    <span className="ml-3 text-black/60">Calculating quote...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Duration Info:Not required as per design */}
                    {/* <div className="bg-black/5 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="opacity-70">Duration</span>
                        <span className="font-medium text-white">{durationHours} hours</span>
                      </div>
                    </div> */}

                    {/* Crew Breakdown */}
                    <div className="">
                      {/* <div className="text-sm font-medium opacity-70 uppercase tracking-wide">Crew Members</div> */}
                      {crewBreakdown.map((crew, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div className="text-[#A9A9A9]">
                            {/* crew count needs to be shown along with role */}
                            <div className="text-sm font-medium">{crew.role} x 1</div>
                            {/* <div className="text-xs opacity-70">{durationHours} hrs × rate</div> */}
                          </div>
                          {/* <div className="font-bold">{formatCurrency(crew.cost)}</div> */}
                          {/* crew's base price to be displayed */}
                          <div className="font-bold">{formatCurrency(275)}</div>
                        </div>
                      ))}
                    </div>

                    {/* Selected Crew from Dream Team (if any) */}
                    {/* {data.selectedCrewIds.length > 0 && (
                      <div className="bg-black/5 rounded-lg mt-4">
                        <div className="flex justify-between items-start text-sm">
                          <div>
                            <div className="font-medium">Dream Team Selected</div>
                            <div className="text-xs opacity-70">{data.selectedCrewIds.length} member(s) chosen</div>
                          </div>
                          <div className="text-xs opacity-70">Assigned post-payment</div>
                        </div>
                      </div>
                    )} */}

                    {/* <div className="border-t border-black/10 my-4" /> */}

                    <div className="flex justify-between items-center text-lg font-bold">
                      <div className="text-sm font-medium text-[#E8D1AB]">Total Amount</div>
                      <div className="text-[#E8D1AB]">{formatCurrency(quoteTotal)}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-b border-b-white/10">
                <Button
                  onClick={handlePay}
                  disabled={isSubmitting || isCalculating || quoteTotal === null}
                  className="w-full h-14 text-base lg:text-xl bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-medium rounded-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : isCalculating || quoteTotal === null ? (
                    "Calculating..."
                  ) : (
                    `Pay ${formatCurrency(quoteTotal)}`
                  )}
                </Button>

                <p className="text-center text-base font-medium mt-5 opacity-60 flex items-center justify-center gap-1">
                  <Phone size={24} /> Connect with Beige Team
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex  gap-3 lg:gap-6 items-center">
        <Button
          onClick={onBack}
          className="h-14 lg:h-[72px] border border-[#8E8E8E] hover:bg-[#1A1A1A] text-white font-medium text-base lg:text-xl rounded-[10px] min-w-[140px] lg:min-w-[185px] "
        >
          Back
        </Button>
      </div>

    </div>
  );
};
