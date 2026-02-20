"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Switch } from "@/components/ui/switch";
import DottedDivider from "../admin/DottedDivider";
import { Copy, Mail, Check } from "lucide-react"; // Added for icons
import { toast } from "sonner";
import { useGeneratePaymentLinkMutation, useNotifyPaymentLinkMutation } from "@/lib/redux/features/sales/salesApi";

interface GeneratePaymentLinkProps {
  leadId?: number;
  bookingId?: number;
  discountCodeId?: number;
}

const GeneratePaymentLink = ({ leadId, bookingId, discountCodeId }: GeneratePaymentLinkProps) => {
  const [attachDiscount, setAttachDiscount] = useState<"Yes" | "No" | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // API Mutations
  const [generateLink, { isLoading: isGenerating }] = useGeneratePaymentLinkMutation();
  const [notifyLink, { isLoading: isNotifying }] = useNotifyPaymentLinkMutation();

  const [paymentData, setPaymentData] = useState<{ url: string; id: number } | null>(null);

  const handleGenerate = async () => {
    if (!bookingId) {
      toast.error("Booking ID is required to generate a payment link");
      return;
    }

    try {
      const response = await generateLink({
        lead_id: leadId,
        booking_id: bookingId,
        discount_code_id: discountCodeId,
        expiry_hours: 2
      }).unwrap();

      if (response.success && response.data) {
        setPaymentData({
          url: response.data.url || "",
          id: response.data.payment_link_id
        });
        toast.success("Payment link generated successfully");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to generate payment link");
    }
  };

  const handleNotify = async () => {
    if (!paymentData?.id) return;

    try {
      await notifyLink({ payment_link_id: paymentData.id }).unwrap();
      toast.success("Payment link sent successfully via Email/SMS");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to send notification");
    }
  };

  const handleCopy = () => {
    if (paymentData?.url) {
      navigator.clipboard.writeText(paymentData.url);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl w-full max-w-[500px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 lg:px-9 pt-5 lg:pt-10">
        <h2 className="lg:text-xl font-medium text-white">Payment Link</h2>
        {paymentData && (
          <Button className="text-[#E8D1AB] text-xs lg:text-sm border border-[#E8D1AB]/20 bg-[#0A0808] px-4 py-1.5 rounded-lg hover:bg-[#E8D1AB]/10 transition-all">
            View & Send Invoice
          </Button>
        )}
      </div>

      <DottedDivider />

      <div className="px-4 pb-4 lg:pb-8 lg:px-9">
        {!paymentData ? (
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
              onClick={handleGenerate}
              disabled={isGenerating}
              className="h-12 w-full bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010] font-semibold rounded-lg transition-all text-sm mt-2 disabled:opacity-50"
            >
              {isGenerating ? "Generating..." : "Generate Payment Link"}
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
                  {paymentData.url}
                </div>
                <button
                  onClick={handleCopy}
                  className="bg-[#101010] p-2.5 rounded-lg text-white hover:bg-[#323235] transition-all"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <Button
              onClick={handleNotify}
              disabled={isNotifying}
              className="h-9 w-full bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010] font-medium rounded-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Mail size={18} />
              {isNotifying ? "Sending..." : "Send via Email Or SMS"}
            </Button>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setPaymentData(null)}
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