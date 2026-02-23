"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Switch } from "@/components/ui/switch";
import DottedDivider from "../admin/DottedDivider";
import { Copy, Mail, Check, Clock, Loader2, FileText } from "lucide-react"; // Added icons
import { toast } from "sonner";
import { 
  useGeneratePaymentLinkMutation, 
  useNotifyPaymentLinkMutation,
  useSendInvoiceMutation // Hook for the new API
} from "@/lib/redux/features/sales/salesApi";

interface GeneratePaymentLinkProps {
  leadId?: number;
  bookingId?: number;
  discountCodeId?: number;
  activeLink?: {
    payment_link_id: number;
    full_url: string;
    expires_at: string;
    is_used: boolean;
    is_expired: boolean;
  } | null;
}

const GeneratePaymentLink = ({ leadId, bookingId, discountCodeId, activeLink }: GeneratePaymentLinkProps) => {
  const [attachDiscount, setAttachDiscount] = useState<"Yes" | "No" | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  
  const [paymentData, setPaymentData] = useState<{ url: string; id: number; isExpired: boolean } | null>(null);

  useEffect(() => {
    if (activeLink) {
      setPaymentData({
        url: activeLink.full_url,
        id: activeLink.payment_link_id,
        isExpired: activeLink.is_expired
      });
    }
  }, [activeLink]);

  const [generateLink, { isLoading: isGenerating }] = useGeneratePaymentLinkMutation();
  const [notifyLink, { isLoading: isNotifying }] = useNotifyPaymentLinkMutation();
  const [sendInvoice, { isLoading: isSendingInvoice }] = useSendInvoiceMutation();

  const handleGenerate = async () => {
    if (!bookingId) {
      toast.error("Booking ID is required");
      return;
    }

    try {
      const response = await generateLink({
        lead_id: leadId,
        booking_id: bookingId,
        discount_code_id: discountCodeId,
        expiry_hours: 48
      }).unwrap();

      if (response.success && response.data) {
        setPaymentData({
          url: response.data.url || "",
          id: response.data.payment_link_id,
          isExpired: false
        });
        toast.success("Payment link generated successfully");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to generate payment link");
    }
  };

  const handleNotify = async () => {
    if (!paymentData?.id || paymentData.isExpired) return;

    try {
      await notifyLink({ payment_link_id: paymentData.id }).unwrap();
      toast.success("Payment link sent successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to send notification");
    }
  };

  const handleSendInvoice = async () => {
    if (!bookingId) return;

    try {
      const response = await sendInvoice({ booking_id: bookingId }).unwrap();
      
      if (response.success) {
        toast.success("Invoice sent successfully to client email");
        
        // Open the PDF in a new tab for "View"
        if (response.data?.invoicePdf) {
          window.open(response.data.invoicePdf, "_blank");
        }
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to send invoice");
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
      <div className="flex items-center justify-between px-5 lg:px-9 pt-5 lg:pt-10">
        <h2 className="lg:text-xl font-medium text-white">Payment Link</h2>
        {paymentData && !paymentData.isExpired && (
          <Button 
            onClick={handleSendInvoice}
            disabled={isSendingInvoice}
            className="text-[#E8D1AB] text-xs lg:text-sm border border-[#E8D1AB]/20 bg-[#0A0808] px-4 py-1.5 rounded-lg hover:bg-[#E8D1AB]/10 transition-all flex items-center gap-2"
          >
            {isSendingInvoice ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileText size={14} />
            )}
            View & Send Invoice
          </Button>
        )}
      </div>

      <DottedDivider />

      <div className="px-4 pb-4 lg:pb-8 lg:px-9">
        {!paymentData || (paymentData.isExpired && !activeLink) ? (
          <div className="space-y-4 lg:space-y-6 mt-2">
            <div className="space-y-4">
              <label className="text-sm text-[#9F9FA9] block">Attach Discount</label>
              <div className="flex gap-4">
                {["Yes", "No"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAttachDiscount(opt as any)}
                    className={`h-12 w-[100px] lg:w-[110px] rounded-lg border px-2 lg:px-3 flex items-center justify-between transition-all duration-300 ${
                      attachDiscount === opt
                        ? "bg-[#E8D1AB] [background:linear-gradient(to_right,#E8D1AB,#FDEFD9)] border-transparent text-black"
                        : "bg-[#101010] border-white/10 text-[#A9A9A9]"
                    }`}
                  >
                    <span className="font-medium text-sm lg:text-base">{opt}</span>
                    <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center border ${
                      attachDiscount === opt ? "bg-black border-transparent" : "border-[#3D3D3D]"
                    }`}>
                      {attachDiscount === opt && <div className="w-2 h-2 rounded-full bg-[#E8D1AB]" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-[#A1A1A1]">Lock Booking After Generation</label>
              <Switch checked={isLocked} onCheckedChange={setIsLocked} />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="h-12 w-full bg-[#E8D1AB] text-[#101010] font-semibold rounded-lg"
            >
              {isGenerating ? "Generating..." : "Generate Payment Link"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            <div className={`border rounded-xl p-3 space-y-3 ${
              paymentData.isExpired 
                ? "bg-red-500/10 border-red-500/20" 
                : "bg-[#0365441A] border-[#1B3024]"
            }`}>
              <div className={`flex items-center gap-2 text-sm ${
                paymentData.isExpired ? "text-red-400" : "text-[#22C55E]"
              }`}>
                {paymentData.isExpired ? <Clock size={16} /> : <Check size={16} />}
                {paymentData.isExpired ? "Payment Link Expired" : "Active Payment Link"}
              </div>

              {!paymentData.isExpired && (
                <div className="flex gap-2">
                  <div className="flex-1 bg-[#101010] border border-white/10 rounded-lg px-4 py-2.5 text-[#A1A1A1] text-xs lg:text-sm truncate">
                    {paymentData.url}
                  </div>
                  <button onClick={handleCopy} className="bg-[#101010] p-2.5 rounded-lg text-white hover:bg-[#323235]">
                    <Copy size={18} />
                  </button>
                </div>
              )}
            </div>

            {!paymentData.isExpired ? (
              <Button
                onClick={handleNotify}
                disabled={isNotifying}
                className="h-9 w-full bg-[#E8D1AB] text-[#101010] font-medium rounded-lg flex items-center justify-center gap-2"
              >
                <Mail size={18} />
                {isNotifying ? "Sending..." : "Send via Email Or SMS"}
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-white/50 text-center">This link has expired. Please generate a new one.</p>
                <Button
                  onClick={() => setPaymentData(null)}
                  className="h-10 w-full bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg"
                >
                  Create New Link
                </Button>
              </div>
            )}

            {!paymentData.isExpired && (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setPaymentData(null)}
                  className="text-[#9F9FA9] text-sm hover:text-white transition-colors"
                >
                  Regenerate Link
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratePaymentLink;