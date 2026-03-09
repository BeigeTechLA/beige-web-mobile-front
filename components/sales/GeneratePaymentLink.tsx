"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Copy, Mail, Check, Clock, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { 
  useGeneratePaymentLinkMutation, 
  useNotifyPaymentLinkMutation,
  usePreviewInvoiceMutation,
  useSendInvoiceMutation 
} from "@/lib/redux/features/sales/salesApi";

interface GeneratePaymentLinkProps {
  leadId?: number;
  bookingId?: number;
  discountCodeId?: number;
  bookingStatus?: string | null;
  activeLink?: {
    payment_link_id: number;
    full_url: string;
    expires_at: string;
    is_used: boolean;
    is_expired: boolean;
  } | null;
}

const GeneratePaymentLink = ({ leadId, bookingId, discountCodeId, bookingStatus, activeLink }: GeneratePaymentLinkProps) => {
  const [attachDiscount, setAttachDiscount] = useState<"Yes" | "No" | null>("No"); // Default to No
  const [isLocked, setIsLocked] = useState(false);
  const [hasPreviewedInvoice, setHasPreviewedInvoice] = useState(false);
  
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

  useEffect(() => {
    setHasPreviewedInvoice(false);
  }, [bookingId, paymentData?.id]);

  const [generateLink, { isLoading: isGenerating }] = useGeneratePaymentLinkMutation();
  const [notifyLink, { isLoading: isNotifying }] = useNotifyPaymentLinkMutation();
  const [previewInvoice, { isLoading: isPreviewingInvoice }] = usePreviewInvoiceMutation();
  const [sendInvoice, { isLoading: isSendingInvoice }] = useSendInvoiceMutation();
  const isPaidBooking = String(bookingStatus || "").toLowerCase() === "paid";
  const showInvoiceActions = (!!paymentData && !paymentData.isExpired) || isPaidBooking;
  const showGenerateSection = !isPaidBooking && (!paymentData || (paymentData.isExpired && !activeLink));

  const handleGenerate = async () => {
    if (!bookingId) {
      toast.error("Booking ID is required");
      return;
    }

    try {
      const response = await generateLink({
        lead_id: leadId,
        booking_id: bookingId,
        discount_code_id: attachDiscount === "Yes" ? discountCodeId : undefined,
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

  const handlePreviewInvoice = async () => {
    if (!bookingId) return;

    try {
      const response = await previewInvoice({ booking_id: bookingId }).unwrap();
      if (response.success) {
        const hostedInvoiceUrl = response.data?.invoiceUrl || null;
        const invoicePdfUrl = response.data?.invoicePdf || null;
        const apiBase = (process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/").replace(/\/$/, "");
        const proxiedPdfUrl = `${apiBase}/sales/invoice-pdf/${bookingId}?t=${Date.now()}`;
        const proxiedDownloadUrl = `${apiBase}/sales/invoice-pdf/${bookingId}?download=1&t=${Date.now()}`;

        if (!hostedInvoiceUrl && !invoicePdfUrl) {
          toast.error("Preview URL not available");
          return;
        }

        // Open Stripe invoice page directly.
        if (hostedInvoiceUrl) {
          window.open(hostedInvoiceUrl, "_blank", "noopener,noreferrer");
        }

        // Trigger direct PDF download through backend proxy.
        if (invoicePdfUrl) {
          const link = document.createElement("a");
          link.href = proxiedDownloadUrl || proxiedPdfUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.click();
        }

        setHasPreviewedInvoice(true);
        toast.success("Invoice opened and download started");
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to preview invoice");
    }
  };

  const handleSendInvoice = async () => {
    if (!bookingId) return;
    if (!hasPreviewedInvoice) {
      toast.error("Please preview invoice first");
      return;
    }

    try {
      const response = await sendInvoice({ booking_id: bookingId }).unwrap();
      if (response.success) {
        toast.success("Invoice sent successfully to client email");
        setHasPreviewedInvoice(false);
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
    <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl w-full max-w-[500px] lg:max-w-6xl overflow-hidden">
      <div className="flex flex-col gap-3 px-5 lg:px-9 pt-5 lg:pt-8">
        <h2 className="lg:text-xl font-medium text-white">Payment Link</h2>
        {showInvoiceActions && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
            <Button 
              onClick={handlePreviewInvoice}
              disabled={isPreviewingInvoice}
              className="h-10 text-[#E8D1AB] text-xs lg:text-sm border border-[#E8D1AB]/20 bg-[#0A0808] px-3 lg:px-4 py-1.5 rounded-lg hover:bg-[#E8D1AB]/10 transition-all flex items-center justify-center gap-2"
            >
              {isPreviewingInvoice ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileText size={14} />
              )}
              View Invoice
            </Button>
            <Button 
              onClick={handleSendInvoice}
              disabled={!hasPreviewedInvoice || isSendingInvoice}
              className="h-10 text-[#101010] text-xs lg:text-sm bg-[#E8D1AB] px-3 lg:px-4 py-1.5 rounded-lg hover:bg-[#D4C3A3] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSendingInvoice ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Mail size={14} />
              )}
              Send Invoice
            </Button>
          </div>
        )}
      </div>
              <hr className="border-t border-[#3D3D3D] my-4 lg:my-9" />

      {/* <DottedDivider /> */}

      <div className="px-5 pb-6 lg:pb-9 lg:px-9">
        {showGenerateSection ? (
          <div className="space-y-6 mt-4">
            {/* Attach Discount Selection */}
            <div className="space-y-3">
              <label className="text-sm text-[#9F9FA9] block font-light">Attach Discount</label>
              <div className="flex gap-4">
                {["Yes", "No"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAttachDiscount(opt as any)}
                    className={`flex-1 h-12 rounded-xl border flex items-center justify-between px-4 transition-all duration-300 ${
                      attachDiscount === opt
                        ? "border-[#E8D1AB] bg-[#E8D1AB]/5 text-white"
                        : "border-[#3D3D3D] bg-transparent text-[#9F9FA9]"
                    }`}
                  >
                    <span className="font-medium text-sm">{opt}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      attachDiscount === opt ? "border-[#E8D1AB]" : "border-white/20"
                    }`}>
                      {attachDiscount === opt && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#E8D1AB]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="text-sm text-[#9F9FA9] font-light">Lock Booking After Generation</label>
              <button
                type="button"
                onClick={() => setIsLocked(!isLocked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                  isLocked ? "bg-[#E8D1AB]" : "bg-[#2A2A2A]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    isLocked ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="h-12 w-full bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010] font-semibold rounded-xl transition-all"
            >
              {isGenerating ? "Generating..." : "Generate Payment Link"}
            </Button>
          </div>
        ) : paymentData ? (
          /* Active / Expired Link UI */
          <div className="space-y-4 mt-6">
            <div className={`border rounded-xl p-4 space-y-4 ${
              paymentData.isExpired 
                ? "bg-red-500/10 border-red-500/20" 
                : "bg-[#0365441A] border-[#1B3024]"
            }`}>
              <div className={`flex items-center gap-2 text-sm font-medium ${
                paymentData.isExpired ? "text-red-400" : "text-[#22C55E]"
              }`}>
                {paymentData.isExpired ? <Clock size={16} /> : <Check size={16} />}
                {paymentData.isExpired ? "Payment Link Expired" : "Active Payment Link"}
              </div>

              {!paymentData.isExpired && (
                <div className="flex gap-2">
                  <div className="flex-1 bg-[#101010] border border-white/5 rounded-lg px-4 py-3 text-[#A1A1A1] text-xs lg:text-sm truncate">
                    {paymentData.url}
                  </div>
                  <button 
                    onClick={handleCopy} 
                    className="bg-[#101010] border border-white/5 p-3 rounded-lg text-white hover:bg-[#202020] transition-colors"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              )}
            </div>

            {!paymentData.isExpired ? (
              <Button
                onClick={handleNotify}
                disabled={isNotifying}
                className="h-12 w-full bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010] font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <Mail size={18} />
                {isNotifying ? "Sending..." : "Send via Email Or SMS"}
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-[#9F9FA9] text-center">This link has expired. Please generate a new one.</p>
                <Button
                  onClick={() => setPaymentData(null)}
                  className="h-12 w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl"
                >
                  Create New Link
                </Button>
              </div>
            )}

            {!paymentData.isExpired && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => setPaymentData(null)}
                  className="text-[#9F9FA9] text-sm hover:text-white transition-colors underline underline-offset-4"
                >
                  Regenerate Link
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
            <p className="text-sm text-emerald-300 font-medium">
              Payment is already completed.
            </p>
            <p className="text-xs text-emerald-200/80 mt-1">
              Use the buttons above to view the invoice or send it to the client.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneratePaymentLink;
