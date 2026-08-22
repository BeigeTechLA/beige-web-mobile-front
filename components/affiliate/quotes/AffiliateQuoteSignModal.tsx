"use client";

import React from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

import { Button } from "@/components/ui/button";
import { useResolvedTheme } from "@/lib/useResolvedTheme";

type AffiliateQuoteSignModalProps = {
  open: boolean;
  onClose: () => void;
  initialName: string;
  initialEmail: string;
  isSubmitting?: boolean;
  onSubmit: (payload: {
    signerName: string;
    signerEmail: string;
    signatureFile: File;
  }) => Promise<void> | void;
};

export default function AffiliateQuoteSignModal({
  open,
  onClose,
  initialName,
  initialEmail,
  isSubmitting = false,
  onSubmit,
}: AffiliateQuoteSignModalProps) {
  const { isDark } = useResolvedTheme();
  const sigRef = React.useRef<SignatureCanvas>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [signerName, setSignerName] = React.useState(initialName);
  const [signerEmail, setSignerEmail] = React.useState(initialEmail);
  const [hasStartedSigning, setHasStartedSigning] = React.useState(false);

  // Resize canvas internal DOM attributes to match its actual rendered size & DPR
  const resizeCanvas = React.useCallback(() => {
    if (!containerRef.current || !sigRef.current) return;

    const canvas = sigRef.current.getCanvas();
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = 220;

    // Save existing signature data before resizing resets the canvas context
    const data = sigRef.current.isEmpty() ? null : sigRef.current.toDataURL();

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = containerWidth * ratio;
    canvas.height = containerHeight * ratio;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
    }

    if (data) {
      sigRef.current.fromDataURL(data);
    } else {
      sigRef.current.clear();
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      setSignerName(initialName);
      setSignerEmail(initialEmail);
      setHasStartedSigning(false);

      // Delay slightly to ensure modal container dimensions are calculated accurately in the DOM
      const timer = setTimeout(() => {
        resizeCanvas();
        sigRef.current?.clear();
      }, 50);

      window.addEventListener("resize", resizeCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", resizeCanvas);
      };
    }
  }, [initialEmail, initialName, open, resizeCanvas]);

  if (!open) {
    return null;
  }

  const handleClear = () => {
    sigRef.current?.clear();
    setHasStartedSigning(false);
  };

  const handleSubmit = async () => {
    if (!signerName.trim() || !signerEmail.trim()) {
      return;
    }

    if (!sigRef.current || sigRef.current.isEmpty()) {
      return;
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      sigRef.current?.getTrimmedCanvas().toBlob((result) => resolve(result), "image/png")
    );

    if (!blob) {
      return;
    }

    const signatureFile = new File([blob], `signature_${Date.now()}.png`, {
      type: "image/png",
    });

    await onSubmit({
      signerName: signerName.trim(),
      signerEmail: signerEmail.trim(),
      signatureFile,
    });
  };

  const isSaveDisabled =
    isSubmitting ||
    !signerName.trim() ||
    !signerEmail.trim() ||
    !hasStartedSigning;

  return (
    <div
      className={`fixed inset-0 z-[120] p-3 backdrop-blur-md sm:p-4 lg:p-6 ${isDark ? "bg-black/85" : "bg-black/50"
        }`}
      onClick={onClose}
    >
      <div
        className={`mx-auto flex h-full w-full max-w-[980px] flex-col overflow-hidden rounded-[28px] ${isDark ? "border border-white/10 bg-[#111111]" : "border border-[#DFDDDD] bg-[#F4F5F7]"
          }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8 ${isDark ? "border-b border-white/10" : "border-b border-[#DFDDDD] bg-white"
            }`}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className={`h-11 rounded-xl px-4 ${isDark
              ? "border border-white/10 bg-[#171717] text-white hover:bg-[#1F1F1F]"
              : "border border-[#E3E3E3] bg-[#F0F0F0] text-black hover:bg-[#E5E7EB]"
              }`}
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 pt-6 lg:px-8 lg:pb-12 lg:pt-8">
          <div className="mb-6">
            <h2 className={`text-[20px] font-medium lg:text-[30px] ${isDark ? "text-white" : "text-black"}`}>
              Sign And Accept
            </h2>
            <p className={`text-[14px] ${isDark ? "text-[#A1A1AA]" : "text-[#60646C]"}`}>
              Add your signature to accept this quote.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className={`mb-2 block text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                Signer Name
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(event) => setSignerName(event.target.value)}
                placeholder="Enter signer name"
                className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none ${isDark ? "border-white/10 bg-[#171717] text-white" : "border-[#E3E3E3] bg-white text-black"
                  }`}
              />
            </div>

            <div>
              <label className={`mb-2 block text-sm ${isDark ? "text-white/70" : "text-black/70"}`}>
                Signer Email
              </label>
              <input
                type="email"
                value={signerEmail}
                onChange={(event) => setSignerEmail(event.target.value)}
                placeholder="Enter signer email"
                className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none ${isDark ? "border-white/10 bg-[#171717] text-white" : "border-[#E3E3E3] bg-white text-black"}`}
              />
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-[#2B2B2B] bg-[#111111] p-4">
            <div className="mb-4 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={isSubmitting}
                className="rounded-xl border-white/10 bg-[#171717] text-white hover:bg-[#1F1F1F]"
              >
                Clear
              </Button>
              <Button
                type="button"
                onClick={() => {
                  void handleSubmit();
                }}
                disabled={isSaveDisabled}
                className="rounded-xl bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90"
              >
                {isSubmitting ? <Loader2 size={18} className="mr-2 animate-spin" /> : null}
                {isSubmitting ? "Saving..." : "Save Signature"}
              </Button>
            </div>

            <div
              ref={containerRef}
              className="overflow-hidden rounded-xl border-2 border-dashed border-[#3A3A3A] bg-white"
            >
              <SignatureCanvas
                ref={sigRef}
                penColor="black"
                onBegin={() => setHasStartedSigning(true)}
                canvasProps={{
                  style: { display: "block", width: "100%", height: "220px" },
                }}
              />
            </div>

            <p className="mt-2 text-xs text-[#8F8F95]">
              Draw your signature using mouse or touch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}