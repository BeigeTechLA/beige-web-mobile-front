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
import { useResolvedTheme } from "@/lib/useResolvedTheme";

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
  const { isDark } = useResolvedTheme();
  const styles = {
    default: {
      iconBg: isDark ? "bg-[#2A1F00]" : "bg-[#F5EFE2]",
      iconBorder: isDark ? "border-[#E5A700]/20" : "border-[#C9A96E]/20",
      iconColor: isDark ? "text-[#E5A700]" : "text-[#8E6A2A]",
      iconRing: isDark
        ? "shadow-[0_0_0_6px_rgba(229,167,0,0.10)]"
        : "shadow-[0_0_0_6px_rgba(201,169,110,0.10)]",
      primaryBg: isDark ? "bg-[#E5D5B8]" : "bg-[#E5D5B8]",
      primaryText: "text-[#120F08]",
      primaryHover: isDark ? "hover:bg-[#D9C59D]" : "hover:bg-[#D9C59D]",
    },
    danger: {
      iconBg: isDark ? "bg-[#2A1F00]" : "bg-[#F7E8DA]",
      iconBorder: isDark ? "border-[#E5A700]/20" : "border-[#C9A96E]/20",
      iconColor: isDark ? "text-[#E5A700]" : "text-[#8E6A2A]",
      iconRing: isDark
        ? "shadow-[0_0_0_6px_rgba(229,167,0,0.10)]"
        : "shadow-[0_0_0_6px_rgba(201,169,110,0.10)]",
      primaryBg: isDark ? "bg-[#E8D1AB]" : "bg-[#E5D5B8]",
      primaryText: "text-black",
      primaryHover: isDark ? "hover:bg-[#E8D1AB]/70" : "hover:bg-[#D9C59D]",
    },
    success: {
      iconBg: isDark ? "bg-[#2A1F00]" : "bg-[#EEF7EA]",
      iconBorder: isDark ? "border-[#E5A700]/20" : "border-[#28C76F]/20",
      iconColor: isDark ? "text-[#E5A700]" : "text-[#28C76F]",
      iconRing: isDark
        ? "shadow-[0_0_0_6px_rgba(229,167,0,0.10)]"
        : "shadow-[0_0_0_6px_rgba(40,199,111,0.10)]",
      primaryBg: isDark ? "bg-[#E8D1AB]" : "bg-[#E5D5B8]",
      primaryText: "text-black",
      primaryHover: isDark ? "hover:bg-[#E8D1AB]/70" : "hover:bg-[#D9C59D]",
    },
  }[tone];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`max-w-[520px] overflow-hidden rounded-[24px] border p-0 shadow-[0_40px_120px_rgba(0,0,0,0.78)] [&>button]:hidden ${
          isDark
            ? "border-white/10 bg-[#0B0B0B] text-white"
            : "border-[#E3E3E3] bg-white text-[#101010] shadow-[0_24px_80px_rgba(16,16,16,0.18)]"
        }`}
      >
        <div className="relative">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close modal"
            className={`absolute right-4 top-4 rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-40 ${
              isDark
                ? "text-white/40 hover:bg-white/5 hover:text-white"
                : "text-[#32323266] hover:bg-black/5 hover:text-[#101010]"
            }`}
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
              <DialogTitle className={`text-[20px] font-semibold leading-snug tracking-[-0.01em] ${isDark ? "text-white" : "text-[#101010]"}`}>
                {title}
              </DialogTitle>
              <DialogDescription className={`mt-2 text-[13px] leading-relaxed ${isDark ? "text-white/45" : "text-[#32323299]"}`}>
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
                  className={`h-12 rounded-xl border bg-transparent text-[13px] font-medium shadow-none transition ${
                    isDark
                      ? "border-white/10 text-white/75 hover:bg-white/5 hover:text-white"
                      : "border-[#E3E3E3] text-[#32323299] hover:bg-black/5 hover:text-[#101010]"
                  }`}
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
