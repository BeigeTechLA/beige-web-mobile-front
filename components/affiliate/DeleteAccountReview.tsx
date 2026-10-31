"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  User,
  Contact,
  CalendarDays,
  Folder,
  CircleDollarSign,
  Hourglass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Lottie from "lottie-react";
import yellowAnimation from "@/public/animations/Yellow.json";
import { DeleteAccountConfirmModal } from "./DeleteAccountConfirmModal";
import { DeleteAccountVerifyModal } from "./DeleteAccountVerifyModal";
import { DeleteAccountFinalModal } from "./DeleteAccountFinalModal";
import { DeleteAccountSuccessModal } from "./DeleteAccountSuccessModal";

interface DeleteAccountReviewProps {
  isDark?: boolean;
  brandName?: string;
  onBack: () => void; // top "Back" and "Keep My Account"
  onVerify: (code: string) => void | Promise<void | boolean>; // "Verify & Continue"; return false to stay on the verify modal
  onResend: () => void; // "Resend Code"
  // "Delete My Account": return false on failure, or { requestId } on success
  onDelete: () => void | Promise<void | boolean | { requestId?: string }>;
  onContactSupport: () => void; // success modal
  onPreviewLogin: () => void; // success modal "Preview Deactivate Login"
  isLoading?: boolean;
}

const items = [
  {
    icon: User,
    title: "Account access",
    desc: "You will no longer be able to access your account or use its features.",
  },
  {
    icon: Contact,
    title: "Profile and Personal Information",
    desc: "Eligible personal data will be scheduled for deletion.",
  },
  {
    icon: CalendarDays,
    title: "Bookings and assignments",
    desc: "You may lose access to your booking history, shoot details, assignments, and related conversations.",
  },
  {
    icon: Folder,
    title: "Files and Media",
    desc: "Your access to uploaded briefs, portfolios, and other files may be removed. Some files may be retained or handled separately where necessary.",
  },
  {
    icon: CircleDollarSign,
    title: "Payments and Records",
    desc: "Certain invoices, payment records, contracts, and dispute records may need to be retained as required by law.",
  },
  {
    icon: Hourglass,
    title: "60-day Grace Period",
    desc: "Your eligible data will be scheduled for deletion after 60 days. You can cancel your request during this period by completing the required verification.",
  },
];

export const DeleteAccountReview = ({
  isDark = true,
  brandName = "Beige",
  onBack,
  onVerify,
  onResend,
  onDelete,
  onContactSupport,
  onPreviewLogin,
  isLoading = false,
}: DeleteAccountReviewProps) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string | undefined>();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showFinal, setShowFinal] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    // find the scrolling content area (the area next to the sidebar)
    let node: HTMLElement | null = el.parentElement;
    while (node && node !== document.body) {
      const { overflowY } = getComputedStyle(node);
      if (overflowY === "auto" || overflowY === "scroll") break;
      node = node.parentElement;
    }
    const container =
      node && node !== document.body ? node : (el.closest("main") as HTMLElement | null);
    if (!container) return;

    const update = () => {
      const r = container.getBoundingClientRect();
      setBar({ left: r.left, width: container.clientWidth });
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(container);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div ref={rootRef} className="flex flex-col min-h-full">
      <div className="space-y-6 pb-28">
        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          className={`flex items-center gap-2 text-sm transition-colors ${
            isDark ? "text-white/70 hover:text-white" : "text-zinc-500 hover:text-black"
          }`}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Heading */}
        <div className="space-y-2">
          <p className="text-xs lg:text-sm text-[#E8D1AB]">Please Review Carefully</p>
          <h2
            className={`text-xl lg:text-2xl font-semibold tracking-tight transition-colors ${
              isDark ? "text-white" : "text-[#171717]"
            }`}
          >
            Before You Delete Your Account
          </h2>
          <p className={`text-sm ${isDark ? "text-white/50" : "text-zinc-500"}`}>
            Deleting your {brandName} account will deactivate your access to the platform and start
            the account deletion process.
          </p>
        </div>

        {/* Warning banner */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20">
            <Lottie animationData={yellowAnimation} loop />
          </div>
          <div>
            <p className={`font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
              Once data is permanently deleted, it may not be possible to recover it.
            </p>
            <p className={`text-sm mt-1 ${isDark ? "text-white/60" : "text-zinc-600"}`}>
              If you have ongoing bookings, shoots, payments, or disputes, please contact{" "}
              {brandName} Support before proceeding.
            </p>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className={`rounded-xl border p-4 lg:p-5 space-y-3 transition-colors ${
                isDark ? "bg-[#161616] border-white/5" : "bg-zinc-50 border-zinc-200"
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                  isDark ? "bg-white/10" : "bg-zinc-200"
                }`}
              >
                <Icon size={18} className="text-[#E8D1AB]" />
              </div>
              <div className="space-y-1">
                <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-[#171717]"}`}>
                  {title}
                </p>
                <p className={`text-xs leading-relaxed ${isDark ? "text-white/50" : "text-zinc-500"}`}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer actions */}
      <div
        style={bar ? { left: bar.left, width: bar.width } : undefined}
        className={`fixed bottom-0 z-20 flex flex-col sm:flex-row gap-3 px-4 md:px-8 py-4 md:py-5 border-t ${
          bar ? "" : "left-0 right-0"
        } ${isDark ? "border-white/5 bg-[#161616]" : "border-zinc-200 bg-zinc-50"}`}
      >
        <Button
          type="button"
          onClick={onBack}
          className="h-10 lg:h-12 px-6 bg-[#E8D1AB] hover:bg-[#E8D1AB]/90 text-black font-medium rounded-lg lg:rounded-xl"
        >
          Keep My Account
        </Button>
        <Button
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={isLoading}
          className="h-10 lg:h-12 px-6 bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white font-medium rounded-lg lg:rounded-xl"
        >
          {isLoading ? "Please wait..." : "Continue to Delete Account"}
        </Button>
      </div>

      <DeleteAccountConfirmModal
        open={showConfirm}
        isDark={isDark}
        isLoading={isLoading}
        onCancel={() => setShowConfirm(false)}
        onProceed={() => {
          setShowConfirm(false);
          setShowVerify(true);
          onResend(); // sends the OTP email when the verify modal opens; remove if you don't want this
        }}
      />

      <DeleteAccountVerifyModal
        open={showVerify}
        isDark={isDark}
        isLoading={isLoading}
        onClose={() => setShowVerify(false)}
        onVerify={async (code) => {
          const result = await onVerify(code);
          if (result === false) return; // verification failed, stay on this modal
          setShowVerify(false);
          setShowFinal(true);
        }}
        onResend={onResend}
      />

      <DeleteAccountFinalModal
        open={showFinal}
        isDark={isDark}
        brandName={brandName}
        isLoading={isLoading}
        onGoBack={() => setShowFinal(false)}
        onDelete={async () => {
          const result = await onDelete();
          if (result === false) return; // failed, stay on this modal
          if (result && typeof result === "object") setRequestId(result.requestId);
          setShowFinal(false);
          setShowSuccess(true);
        }}
      />

      <DeleteAccountSuccessModal
        open={showSuccess}
        isDark={isDark}
        brandName={brandName}
        requestId={requestId}
        onContactSupport={onContactSupport}
        onPreviewLogin={onPreviewLogin}
      />
    </div>
  );
};
