"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Switch } from "@/components/ui/switch";
import DottedDivider from "../admin/DottedDivider";
import { Copy, Mail, Check } from "lucide-react"; // Added for icons
import { toast } from "sonner";

const GeneratePaymentLink = () => {
  const [attachDiscount, setAttachDiscount] = useState<"Yes" | "No" | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false); // Toggle state

  const paymentUrl = "https://payment.example.com/bkg-2026-001234"; // to be generated

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentUrl);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl w-full max-w-[500px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 lg:px-9 pt-5 lg:pt-10">
        <h2 className="lg:text-xl font-medium text-white">Payment Link</h2>
        {isGenerated && (
          <Button className="text-[#E8D1AB] text-xs lg:text-sm border border-[#E8D1AB]/20 bg-[#0A0808] px-4 py-1.5 rounded-lg hover:bg-[#E8D1AB]/10 transition-all">
            View & Send Invoice
          </Button>
        )}
      </div>

      <DottedDivider />

      <div className="px-4 pb-4 lg:pb-8 lg:px-9">
        {!isGenerated ? (
          /* --- INITIAL GENERATE VIEW --- */
          <div className="space-y-4 lg:space-y-6 mt-2">
            <div className="space-y-4">
              <label className="text-sm text-[#9F9FA9] block">Attach Discount</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setAttachDiscount("Yes")}
                  className={`h-12 w-[100px] lg:w-[110px] rounded-lg border px-2 lg:px-3 flex items-center justify-between transition-all duration-300 ${attachDiscount === "Yes"
                      ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black"
                      : "bg-[#101010] border-white/10 text-[#A9A9A9]"
                    }`}
                >
                  <span className="font-medium text-sm lg:text-base">Yes</span>
                  <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center border ${attachDiscount === "Yes" ? "bg-black border-transparent" : "border-[#3D3D3D]"
                    }`}>
                    {attachDiscount === "Yes" && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAttachDiscount("No")}
                  className={`h-12 w-[100px] lg:w-[110px] rounded-lg border px-2 lg:px-3 flex items-center justify-between transition-all duration-300 ${attachDiscount === "No"
                      ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black"
                      : "bg-[#101010] border-white/10 text-[#A9A9A9]"
                    }`}
                >
                  <span className="font-medium text-sm lg:text-base">No</span>
                  <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center border ${attachDiscount === "No" ? "bg-black border-transparent" : "border-[#3D3D3D]"
                    }`}>
                    {attachDiscount === "No" && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Lock Booking Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-[#A1A1A1]">
                Lock Booking After Generation
              </label>
              <Switch
                checked={isLocked}
                onCheckedChange={setIsLocked}
                className="data-[state=checked]:bg-[#E8D1AB] data-[state=unchecked]:bg-[#27272A]"
              />
            </div>

            <Button
              onClick={() => setIsGenerated(true)} //update this with valid function
              className="h-12 w-full bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010] font-semibold rounded-lg transition-all text-sm mt-2"
            >
              Generate Payment Link
            </Button>
          </div>
        ) : (
          /* --- GENERATED LINK SUCCESS VIEW --- */
          <div className="space-y-4 mt-6">
            <div className="bg-[#0365441A] border border-[#1B3024] rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-2 text-[#22C55E] text-sm">
                <Check size={16} />
                Payment Link Generated
              </div>

              <div className="flex gap-2">
                <div className="flex-1 bg-[#101010] border border-white/10 rounded-lg px-4 py-2.5 text-[#A1A1A1] text-xs lg:text-sm truncate">
                  {paymentUrl}
                </div>
                <button
                  onClick={handleCopy}
                  className="bg-[#101010] p-2.5 rounded-lg text-white hover:bg-[#323235] transition-all"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <Button className="h-9 w-full bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010] font-medium rounded-lg transition-all text-sm flex items-center justify-center gap-2">
              <Mail size={18} />
              Send via Email Or SMS
            </Button>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setIsGenerated(false)}
                className="text-[#9F9FA9] text-sm hover:text-white transition-colors font-medium"
              >
                Regenerate Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratePaymentLink;