"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
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
    icon: Info,
    iconWrap: "border-[#E5D5B8]/20 bg-[#E5D5B8]/10",
    iconColor: "text-[#E5D5B8]",
    confirm: "bg-[#E5D5B8] text-black hover:bg-[#d6c29b]",
  },
  danger: {
    icon: AlertTriangle,
    iconWrap: "border-[#F04438]/20 bg-[#F04438]/10",
    iconColor: "text-[#F04438]",
    confirm: "bg-[#F04438] text-white hover:bg-[#d7372d]",
  },
  success: {
    icon: CheckCircle2,
    iconWrap: "border-[#28C76F]/20 bg-[#28C76F]/10",
    iconColor: "text-[#28C76F]",
    confirm: "bg-[#E5D5B8] text-black hover:bg-[#d6c29b]",
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
  const Icon = toneStyles[tone].icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0A0A] p-0 text-white shadow-[0_28px_90px_rgba(0,0,0,0.6)] [&>button]:hidden">
        <DialogHeader className="border-b border-white/10 px-8 py-6 text-left">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`rounded-2xl border p-3 ${toneStyles[tone].iconWrap}`}>
                <Icon className={toneStyles[tone].iconColor} size={20} />
              </div>
              <div>
                <DialogTitle className="text-[24px] font-bold text-white">
                  {title}
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm leading-relaxed text-white/60">
                  {description}
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/5 p-2 text-white/60 transition-colors hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </DialogHeader>

        <DialogFooter className="px-8 py-6 sm:justify-end">
          <div className="flex w-full gap-3 sm:w-auto">
            {!hideCancel ? (
              <Button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 bg-white text-black hover:bg-white/90 sm:flex-none"
              >
                {cancelLabel}
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={onConfirm ?? onClose}
              disabled={isLoading}
              className={`flex-1 sm:flex-none ${toneStyles[tone].confirm}`}
            >
              {isLoading ? "Please wait..." : confirmLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
