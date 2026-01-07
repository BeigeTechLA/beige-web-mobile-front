"use client";

import React, { useState, useEffect } from "react";
import { BookingDataV3 } from "./types";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { CreditCard, Calendar, MapPin, Clock, Loader2 } from "lucide-react";
import { useCalculateQuoteMutation } from "@/lib/redux/features/pricing/pricingApi";

interface Props {
  data: BookingDataV3;
  updateData: (data: Partial<BookingDataV3>) => void;
  onNext: () => void;
  onBack: () => void;
  onConfirm: () => void; // New prop
  isSubmitting?: boolean;
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
        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">Review & Confirm</h2>
        <p className="text-white/60">Review your project details and complete payment</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Summary & Contact */}
          <div className="flex-1 flex flex-col gap-8">
              
              {/* Project Summary */}
              <div className="bg-[#171717] rounded-[20px] p-6 border border-white/5">
                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-[80px] h-[80px] bg-white/5 rounded-lg overflow-hidden relative">
                         {/* Placeholder for project image based on type */}
                         <div className="absolute inset-0 bg-[#E8D1AB]/10 flex items-center justify-center text-[#E8D1AB]">
                             {data.shootType.slice(0, 2).toUpperCase()}
                         </div>
                      </div>
                      <div>
                          <div className="text-xs text-[#E8D1AB] uppercase tracking-wide mb-1">Content Type</div>
                          <h3 className="text-xl font-bold text-white capitalize">{data.contentType.join(" & ")}</h3>
                      </div>
                      <div className="ml-auto">
                          <Button variant="outline" size="sm" onClick={onBack} className="text-xs h-8 border-white/20 text-white/60 hover:text-white">
                              Edit
                          </Button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#101010] p-4 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-full bg-[#E8D1AB]/20 flex items-center justify-center">
                                  <span className="text-[#E8D1AB] text-xs font-bold uppercase">
                                    {data.shootType.slice(0, 2)}
                                  </span>
                              </div>
                              <span className="text-white font-medium capitalize">{data.shootType}</span>
                          </div>
                          <div className="text-xs text-white/40 pl-11">Professional shoot</div>
                      </div>

                       <div className="bg-[#101010] p-4 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60">
                                  <Calendar size={14} />
                              </div>
                              <span className="text-white font-medium">
                                {data.startDate ? new Date(data.startDate).toLocaleDateString() : 'Date not set'}
                              </span>
                          </div>
                          <div className="text-xs text-white/40 pl-11">
                               {data.startDate ? new Date(data.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''} - 
                               {data.endDate ? new Date(data.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                          </div>
                      </div>

                       <div className="bg-[#101010] p-4 rounded-xl border border-white/5 col-span-full">
                          <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60">
                                  <MapPin size={14} />
                              </div>
                              <span className="text-white font-medium truncate">{data.location || 'Location not set'}</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Editing Services */}
               <div className="bg-[#171717] rounded-[20px] p-6 border border-white/5">
                  <h4 className="text-white/60 text-sm uppercase tracking-wide mb-4">Editing Services</h4>
                  <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                          <span className="text-white">Video Edit</span>
                          <span className="text-white/60">{data.videoEditTypes.join(", ") || "None"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-white">Photo Edit</span>
                          <span className="text-white/60">{data.photoEditTypes.join(", ") || "None"}</span>
                      </div>
                  </div>
               </div>

               {/* Contact Info */}
               <div>
                  <h3 className="text-xl font-medium text-white/90 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-full">
                          <input 
                            type="text" 
                            placeholder="Full Name"
                            value={data.fullName}
                            onChange={(e) => updateData({ fullName: e.target.value })}
                            className="w-full h-12 bg-[#101010] border border-white/20 rounded-xl px-4 text-white focus:border-[#E8D1AB] outline-none"
                          />
                      </div>
                      <div>
                          <input 
                            type="email" 
                            placeholder="Email Address"
                            value={data.email}
                            onChange={(e) => updateData({ email: e.target.value })}
                            className="w-full h-12 bg-[#101010] border border-white/20 rounded-xl px-4 text-white focus:border-[#E8D1AB] outline-none"
                          />
                      </div>
                       <div>
                          <input 
                            type="tel" 
                            placeholder="Phone Number"
                            value={data.phone}
                            onChange={(e) => updateData({ phone: e.target.value })}
                            className="w-full h-12 bg-[#101010] border border-white/20 rounded-xl px-4 text-white focus:border-[#E8D1AB] outline-none"
                          />
                      </div>
                  </div>
               </div>

                {/* Payment Method */}
               <div>
                  <h3 className="text-xl font-medium text-white/90 mb-4">Payment Method</h3>
                  <div className="bg-[#E8D1AB] p-4 rounded-[16px] text-black flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center">
                              <CreditCard size={20} />
                          </div>
                          <span className="font-medium">Credit / Debit Card</span>
                      </div>
                       <div className="w-5 h-5 rounded-full border-2 border-black flex items-center justify-center">
                           <div className="w-2.5 h-2.5 rounded-full bg-black" />
                       </div>
                  </div>
                   <div className="mt-4 p-4 rounded-[16px] bg-[#101010] border border-white/10 text-white/60 flex items-center justify-between cursor-pointer hover:bg-white/5">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                              <span className="font-bold text-xs">Stripe</span>
                          </div>
                          <span className="font-medium">Pay via Stripe</span>
                      </div>
                       <div className="w-5 h-5 rounded-full border-2 border-white/20" />
                  </div>
               </div>
          </div>

          {/* Right Column: Pricing Summary (Sticky) */}
          <div className="lg:w-[380px] shrink-0">
              <div className="bg-[#E8D1AB] rounded-[20px] p-6 text-black sticky top-24">
                  <h3 className="text-xl font-bold mb-6">Pricing Summary</h3>

                  {isCalculating || quoteTotal === null ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-black/60" />
                      <span className="ml-3 text-black/60">Calculating quote...</span>
                    </div>
                  ) : (
                    <div className="space-y-4 mb-6">
                      {/* Duration Info */}
                      <div className="bg-black/5 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="opacity-70">Duration</span>
                          <span className="font-medium">{durationHours} hours</span>
                        </div>
                      </div>

                      {/* Crew Breakdown */}
                      <div className="space-y-3">
                        <div className="text-sm font-medium opacity-70 uppercase tracking-wide">Crew Members</div>
                        {crewBreakdown.map((crew, index) => (
                          <div key={index} className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{crew.role}</div>
                              <div className="text-xs opacity-70">{durationHours} hrs × rate</div>
                            </div>
                            <div className="font-bold">{formatCurrency(crew.cost)}</div>
                          </div>
                        ))}
                      </div>

                      {/* Selected Crew from Dream Team (if any) */}
                      {data.selectedCrewIds.length > 0 && (
                          <div className="bg-black/5 rounded-lg p-3 mt-4">
                            <div className="flex justify-between items-start text-sm">
                              <div>
                                <div className="font-medium">Dream Team Selected</div>
                                <div className="text-xs opacity-70">{data.selectedCrewIds.length} member(s) chosen</div>
                              </div>
                              <div className="text-xs opacity-70">Assigned post-payment</div>
                            </div>
                          </div>
                      )}

                      <div className="border-t border-black/10 my-4" />

                      <div className="flex justify-between items-center text-lg font-bold">
                          <div>Total Amount</div>
                          <div>{formatCurrency(quoteTotal)}</div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handlePay}
                    disabled={isSubmitting || isCalculating || quoteTotal === null}
                    className="w-full h-14 bg-black text-[#E8D1AB] hover:bg-black/90 text-lg rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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

                  <p className="text-center text-xs mt-4 opacity-60 flex items-center justify-center gap-1">
                      <CreditCard size={12} /> Secured with Beige Team
                  </p>
              </div>
          </div>

      </div>

    </div>
  );
};
