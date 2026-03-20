"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Copy, Mail, Check, Clock, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  useGeneratePaymentLinkMutation,
  useGenerateClientPaymentLinkMutation,
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
  isClientLead?: boolean;
  isDark?: boolean;
}

const GeneratePaymentLink = ({ leadId, bookingId, discountCodeId, bookingStatus, activeLink, isClientLead, isDark = true }: GeneratePaymentLinkProps) => {
  const [attachDiscount, setAttachDiscount] = useState<"Yes" | "No" | null>("No");
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

  const [generateLink, { isLoading: isGeneratingLink }] = useGeneratePaymentLinkMutation();
  const [generateClientLink, { isLoading: isGeneratingClientLink }] = useGenerateClientPaymentLinkMutation();
  const isGenerating = isGeneratingLink || isGeneratingClientLink;

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
      let response: any;
      if (isClientLead && leadId) {
        response = await generateClientLink({
          client_lead_id: leadId,
          booking_id: bookingId,
          discount_code_id: attachDiscount === "Yes" ? discountCodeId : undefined,
          expiry_hours: 2 // User requested 2 hours in example
        }).unwrap();
      } else {
        response = await generateLink({
          lead_id: leadId,
          booking_id: bookingId,
          discount_code_id: attachDiscount === "Yes" ? discountCodeId : undefined,
          expiry_hours: 48
        }).unwrap();
      }

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
    <div className={`transition-all duration-300 border rounded-2xl w-full max-w-[500px] lg:max-w-6xl overflow-hidden ${
      isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#D8D8D8]"
    }`}>
      <div className="flex flex-col gap-3 px-5 lg:px-9 pt-5 lg:pt-8">
        <h2 className={`lg:text-xl font-medium transition-colors ${isDark ? "text-white" : "text-black"}`}>
          Payment Link
        </h2>
        {showInvoiceActions && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
            <Button
              onClick={handlePreviewInvoice}
              disabled={isPreviewingInvoice}
              className={`h-10 text-xs lg:text-sm border px-3 lg:px-4 py-1.5 rounded-lg transition-all flex items-center justify-center gap-2 ${isDark
                ? "text-[#E8D1AB] border-[#E8D1AB]/20 bg-[#0A0808] hover:bg-[#E8D1AB]/10"
                : "text-white border-black bg-black hover:bg-gblack/70"
                }`}
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
              className={`h-10 text-xs lg:text-sm px-3 lg:px-4 py-1.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${isDark
                ? "text-[#101010] bg-[#E8D1AB] hover:bg-[#D4C3A3]"
                : "text-black bg-[#E8D1AB] hover:bg-[#D9C19A]"
                }`}
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
      
      <hr className={`border-t ${isDark ? "border-[#3D3D3D]" : "border-[#E5E5E5]"} my-4 lg:my-9`} />

      {/* <DottedDivider /> */}

      <div className="px-5 pb-6 lg:pb-9 lg:px-9">
        {showGenerateSection ? (
          <div className="space-y-6 mt-4">
            {/* Attach Discount Selection */}
            <div className="space-y-3">
              <label className={`text-sm block font-light ${isDark ? "text-[#9F9FA9]" : "text-black/60"}`}>
                Attach Discount
              </label>
              <div className="flex gap-4">
                {["Yes", "No"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAttachDiscount(opt as any)}
                    className={`flex-1 h-12 rounded-xl border flex items-center justify-between px-4 transition-all duration-300 ${attachDiscount === opt
                      ? (isDark ? "border-[#E8D1AB] bg-[#E8D1AB]/5 text-white" : "border-[#E8D1AB] bg-[#E8D1AB]/50 text-black")
                      : (isDark ? "border-[#3D3D3D] bg-transparent text-[#9F9FA9]" : "border-[#D8D8D8] bg-transparent text-black/40")
                      }`}
                  >
                    <span className="font-medium text-sm">{opt}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${attachDiscount === opt
                      ? (isDark ? "border-[#E8D1AB]" : "border-black")
                      : (isDark ? "border-white/20" : "border-gray-400/60")
                      }`}>
                      {attachDiscount === opt && (
                        <div className={`w-2.5 h-2.5 rounded-full bg-[#E8D1AB] ${isDark ? "bg-[#E8D1AB]" : "bg-black"}`} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`h-12 w-full font-semibold rounded-xl transition-all ${isDark ? "bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010]" : "bg-[#E8D1AB] hover:bg-[#D9C19A] text-black"
                }`}
            >
              {isGenerating ? "Generating..." : "Generate Payment Link"}
            </Button>
          </div>
        ) : paymentData ? (
          /* Active / Expired Link UI */
          <div className="space-y-4 mt-6">
            <div className={`border rounded-xl p-4 space-y-4 transition-colors ${paymentData.isExpired
              ? (isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200")
              : (isDark ? "bg-[#0365441A] border-[#1B3024]" : "bg-emerald-50 border-emerald-100")
              }`}>
              <div className={`flex items-center gap-2 text-sm font-medium ${paymentData.isExpired ? (isDark ? "text-red-400" : "text-red-600") : (isDark ? "text-[#22C55E]" : "text-emerald-600")
                }`}>
                {paymentData.isExpired ? <Clock size={16} /> : <Check size={16} />}
                {paymentData.isExpired ? "Payment Link Expired" : "Active Payment Link"}
              </div>

              {!paymentData.isExpired && (
                <div className="flex gap-2">
                  <div className={`flex-1 border rounded-lg px-4 py-3 text-xs lg:text-sm truncate transition-colors ${isDark ? "bg-[#101010] border-white/5 text-[#A1A1A1]" : "bg-white border-[#D8D8D8] text-black/60"
                    }`}>
                    {paymentData.url}
                  </div>
                  <button onClick={handleCopy} className={`border p-3 rounded-lg transition-colors ${isDark ? "bg-[#101010] border-white/5 text-white hover:bg-[#202020]" : "bg-white border-[#D8D8D8] text-black hover:bg-gray-50"
                    }`}>
                    <Copy size={18} />
                  </button>
                </div>
              )}
            </div>

            {!paymentData.isExpired ? (
              <Button
                onClick={handleNotify}
                disabled={isNotifying} className={`h-12 w-full font-semibold rounded-xl flex items-center justify-center gap-2 ${isDark ? "bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010]" : "bg-[#E8D1AB] hover:bg-[#D9C19A] text-black"
                  }`}>
                <Mail size={18} />
                {isNotifying ? "Sending..." : "Send via Email Or SMS"}
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className={`text-xs text-center ${isDark ? "text-[#9F9FA9]" : "text-black/50"}`}>This link has expired. Please generate a new one.</p>
                <Button onClick={() => setPaymentData(null)} className={`h-12 w-full border font-medium rounded-xl transition-all ${isDark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-gray-50 border-[#D8D8D8] text-black hover:bg-gray-100"
                  }`}>
                  Create New Link
                </Button>
              </div>
            )}

            {!paymentData.isExpired && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => setPaymentData(null)}
                  className={`text-sm transition-colors underline underline-offset-4 ${isDark
                    ? "text-[#9F9FA9] hover:text-white"
                    : "text-black/50 hover:text-black"
                    }`}
                >
                  Regenerate Link
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={`mt-4 rounded-xl border p-4 transition-colors ${isDark ? "border-emerald-500/25 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50"
            }`}>
            <p className={`text-sm font-medium ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>
              Payment is already completed.
            </p>
            <p className={`text-xs mt-1 ${isDark ? "text-emerald-200/80" : "text-emerald-600/80"}`}>
              Use the buttons above to view the invoice or send it to the client.
            </p>
          </div>
        )}
      </div >
    </div >
  );
};

export default GeneratePaymentLink;