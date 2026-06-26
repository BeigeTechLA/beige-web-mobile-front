"use client";

import { AlertCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ActionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger" | "success";
  isLoading?: boolean;
  hideCancel?: boolean;
};

const toneStyles = {
  default: {
    iconBg: "bg-[#2A1F00]",
    iconBorder: "border-[#E5A700]/20",
    iconColor: "text-[#E5A700]",
    iconRing: "shadow-[0_0_0_6px_rgba(229,167,0,0.10)]",
    primaryBg: "bg-[#E5D5B8]",
    primaryText: "text-[#120F08]",
    primaryHover: "hover:bg-[#D9C59D]",
  },
  danger: {
    iconBg: "bg-[#2A1F00]",
    iconBorder: "border-[#E5A700]/20",
    iconColor: "text-[#E5A700]",
    iconRing: "shadow-[0_0_0_6px_rgba(229,167,0,0.10)]",
    primaryBg: "bg-[#E8D1AB]",
    primaryText: "text-black",
    primaryHover: "hover:bg-[#E8D1AB]/70",
  },
  success: {
    iconBg: "bg-[#2A1F00]",
    iconBorder: "border-[#E5A700]/20",
    iconColor: "text-[#E5A700]",
    iconRing: "shadow-[0_0_0_6px_rgba(229,167,0,0.10)]",
    primaryBg: "bg-[#E8D1AB]",
    primaryText: "text-black",
    primaryHover: "hover:bg-[#E8D1AB]/70",
  },
};

export function ActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  isLoading = false,
  hideCancel = false,
}: ActionModalProps) {
  const styles = toneStyles[tone];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[520px] overflow-hidden rounded-[24px] border border-white/10 bg-[#0B0B0B] p-0 text-white shadow-[0_40px_120px_rgba(0,0,0,0.78)] [&>button]:hidden">
        <div className="relative">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close modal"
            className="absolute right-4 top-4 rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col items-center px-6 pb-5 pt-11 text-center sm:px-8">
            <div
              className={`mb-5 flex h-[58px] w-[58px] items-center justify-center rounded-full border ${styles.iconBg} ${styles.iconBorder} ${styles.iconRing}`}
            >
              <AlertCircle className={styles.iconColor} size={26} strokeWidth={1.8} />
            </div>

            <DialogHeader className="space-y-0">
              <DialogTitle className="text-[20px] font-semibold leading-snug tracking-[-0.01em] text-white">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-2 text-[13px] leading-relaxed text-white/45">
                {description}
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="px-6 pb-6 pt-1 sm:px-8 sm:pb-8">
            <div className={`grid w-full gap-3 ${hideCancel ? "" : "grid-cols-1 sm:grid-cols-2"}`}>
              {!hideCancel && (
                <Button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="h-12 rounded-xl border border-white/10 bg-transparent text-[13px] font-medium text-white/75 shadow-none transition hover:bg-white/5 hover:text-white"
                >
                  {cancelLabel}
                </Button>
              )}
              <Button
                type="button"
                onClick={onConfirm ?? onClose}
                disabled={isLoading}
                className={`h-12 rounded-xl text-[13px] font-semibold shadow-none transition ${styles.primaryBg} ${styles.primaryText} ${styles.primaryHover} ${
                  hideCancel ? "w-full" : ""
                }`}
              >
                {isLoading ? "Please wait..." : confirmLabel}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
