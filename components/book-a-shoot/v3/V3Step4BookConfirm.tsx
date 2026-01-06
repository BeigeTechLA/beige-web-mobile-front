"use client";

import React from "react";
import { BookingDataV3 } from "./types";
import { Button } from "@/src/components/landing/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { CreditCard, Calendar, MapPin, Clock, Loader2 } from "lucide-react";

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

export const V3Step4BookConfirm: React.FC<Props> = ({ data, updateData, onNext, onBack, onConfirm, isSubmitting }) => {

  const handlePay = () => {
    if (!data.fullName || !data.email) {
        toast.error("Please fill in your contact information");
        return;
    }
    // Trigger submission
    onConfirm();
  };

  // Mock total calculation
  // Base package + extra team members + add-ons logic would go here
  const basePrice = 3251.00;
  const total = basePrice; // + extras

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
                              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60">
                                  <Image src="/images/projects/Corporate.png" alt="Type" width={16} height={16} className="opacity-60" />
                              </div>
                              <span className="text-white font-medium capitalize">{data.shootType}</span>
                          </div>
                          <div className="text-xs text-white/40 pl-11">Conferences, summits, gatherings</div>
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
                  
                  <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-start">
                          <div>
                              <div className="font-medium">Package Offer</div>
                              <div className="text-xs opacity-70">Custom Quote</div>
                          </div>
                          <div className="font-bold">{formatCurrency(basePrice)}</div>
                      </div>
                      
                      {/* Dynamic Items */}
                      {data.selectedCrewIds.length > 0 && (
                          <div className="flex justify-between items-start text-sm opacity-80">
                              <div>Additional Team ({data.selectedCrewIds.length})</div>
                              <div>{formatCurrency(data.selectedCrewIds.length * 275)}</div>
                          </div>
                      )}
                      
                      <div className="border-t border-black/10 my-4" />
                      
                      <div className="flex justify-between items-center text-lg font-bold">
                          <div>Total Amount</div>
                          <div>{formatCurrency(total + (data.selectedCrewIds.length * 275))}</div>
                      </div>
                  </div>

                  <Button 
                    onClick={handlePay}
                    disabled={isSubmitting}
                    className="w-full h-14 bg-black text-[#E8D1AB] hover:bg-black/90 text-lg rounded-xl font-bold"
                  >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                        </div>
                      ) : (
                        `Pay ${formatCurrency(total + (data.selectedCrewIds.length * 275))}`
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
