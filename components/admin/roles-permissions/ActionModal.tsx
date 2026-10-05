"use client";

import { AlertCircle } from "lucide-react";
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
      iconBg: isDark ? "bg-[#2A1F00]" : "bg-[#FFF7E6]",
      iconBorder: isDark ? "border-[#E5A700]/20" : "border-[#E5A700]/25",
      iconColor: "text-[#E5A700]",
      confirmBg: isDark ? "bg-[#E8D1AB]" : "bg-[#E8D1AB]",
      confirmHover: isDark ? "hover:bg-[#D9C29D]" : "hover:bg-[#D9C29D]",
      confirmText: "text-black",
    },
    danger: {
      iconBg: isDark ? "bg-[#2A1F00]" : "bg-[#FFF7E6]",
      iconBorder: isDark ? "border-[#E5A700]/20" : "border-[#E5A700]/25",
      iconColor: "text-[#E5A700]",
      confirmBg: isDark ? "bg-[#E8D1AB]" : "bg-[#E8D1AB]",
      confirmHover: isDark ? "hover:bg-[#D9C29D]" : "hover:bg-[#D9C29D]",
      confirmText: "text-black",
    },
    success: {
      iconBg: isDark ? "bg-[#2A1F00]" : "bg-[#FFF7E6]",
      iconBorder: isDark ? "border-[#E5A700]/20" : "border-[#E5A700]/25",
      iconColor: "text-[#E5A700]",
      confirmBg: isDark ? "bg-[#E8D1AB]" : "bg-[#E8D1AB]",
      confirmHover: isDark ? "hover:bg-[#D9C29D]" : "hover:bg-[#D9C29D]",
      confirmText: "text-black",
    },
  }[tone];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onClose();
      }}
    >
      <DialogContent
        className={`w-[92vw] max-w-md overflow-hidden rounded-xl sm:rounded-2xl border p-0 shadow-2xl [&>button]:hidden ${
          isDark
            ? "border-[#2B2B2B] bg-[#050505] text-white"
            : "border-[#D7D7D7] bg-white text-black"
        }`}
      >
        <div className="px-6 pb-6 pt-8 sm:px-7 sm:pb-7 sm:pt-9">
          <div className="flex flex-col items-center space-y-0 text-center">
            <div
              className={`mb-5 flex h-14 w-14 items-center justify-center rounded-full border ${styles.iconBg} ${styles.iconBorder}`}
            >
              <AlertCircle
                size={27}
                strokeWidth={1.8}
                className={styles.iconColor}
              />
            </div>

            <DialogHeader className="w-full items-center space-y-0 text-center">
              <DialogTitle className={`w-full text-center text-[20px] font-semibold leading-snug tracking-[-0.01em] ${isDark ? "text-white" : "text-[#101010]"}`}>
                {title}
              </DialogTitle>
              <DialogDescription className={`mx-auto mt-2 max-w-[420px] text-center text-[13px] leading-relaxed ${isDark ? "text-white/45" : "text-[#32323299]"}`}>
                {description}
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="mt-7 block sm:space-x-0">
            <div
              className={`grid w-full gap-3 ${
                hideCancel ? "grid-cols-1" : "grid-cols-2"
              }`}
            >
              {!hideCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className={`h-11 w-full rounded-lg border text-sm font-medium shadow-none transition-colors ${
                    isDark
                      ? "border-[#3A3A3A] bg-[#111111] text-white hover:bg-[#1A1A1A] hover:text-white"
                      : "border-[#D7D7D7] bg-white text-black hover:bg-[#F4F5F7]"
                  }`}
                >
                  {cancelLabel}
                </Button>
              )}

              <Button
                type="button"
                onClick={onConfirm ?? onClose}
                disabled={isLoading}
                className={`h-11 w-full rounded-lg text-sm font-medium shadow-none transition-colors ${styles.confirmBg} ${styles.confirmText} ${styles.confirmHover}`}
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
