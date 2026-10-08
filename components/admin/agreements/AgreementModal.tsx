"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

export default function AgreementModal({
  isOpen,
  onClose,
  isDark = true,
}: DeleteConfirmModalProps) {
  const router = useRouter();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`lg:max-w-[700px] w-[92vw] lg:w-full p-0 overflow-hidden [&>button]:hidden transition-colors duration-200 border ${isDark
        ? "border-white/40 bg-[#000000] text-white"
        : "border-[#D7D7D7] bg-white text-black"
        }`}>
        {/* Header Section */}
        <DialogHeader className={`border-b px-4 py-4 lg:px-6 lg:py-5 text-left transition-colors duration-200 ${isDark ? "border-b-[#CACACA]" : "border-b-[#D7D7D7]"}`}>
          <div className="flex items-start justify-between gap-3 lg:gap-4">

            <div className="min-w-0 flex-1 max-w-2/3">
              <DialogTitle className={`text-lg lg:text-3xl font-bold transition-colors text-wrap ${isDark ? "text-white" : "text-black"}`}>
                This agreement has already been accepted.
              </DialogTitle>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`rounded-full p-2 lg:p-3.5 transition-colors shrink-0 ${isDark ? "bg-white/5 text-white/60 hover:text-white" : "bg-black/5 text-black/60 hover:text-black"}`}
            >
              <X size={28} />
            </button>
          </div>
        </DialogHeader>

        {/* Content Body - Target Info Display */}
        <div className="px-4 py-4 lg:px-6 lg:py-5">
          <div className={`rounded-2xl p-4 transition-colors duration-200 ${isDark
            ? "bg-[#E8D1AB]/10"
            : "bg-[#FAFAFA]"
            }`}>
            <p className={`break-words text-sm transition-colors ${isDark ? "text-[#E8D1AB]" : "text-black"}`}>
              Changes will create a new version and require John Doe to accept again. The assignment will
              return to Awaiting CP Confirmation status until the new version is accepted.
            </p>
          </div>
        </div>

        {/* Footer Actions Panel */}
        <DialogFooter className={`px-4 pb-4 lg:px-6 lg:pb-5 flex flex-col-reverse lg:flex-row gap-3 w-full transition-colors duration-200 ${isDark ? "border-t-white/10" : "border-t-[#D7D7D7]"}`}>
          <Button
            type="button"
            onClick={onClose}
            className={`flex-1 w-full h-12 px-5 rounded-lg text-sm font-semibold transition-all ${isDark
              ? "bg-[#202020] border border-white/10 text-white hover:bg-[#303030]"
              : "bg-[#F3F4F6] border border-[#E5E5E5] text-black hover:bg-[#E5E7EB]"
              }`}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => router.push("/admin/agreements/create-generate-agreement")}
            className="flex-1 w-full h-12 px-5 rounded-lg text-sm font-semibold bg-[#E8D1AB] text-black hover:bg-[#D5C5A8] transition-all"
          >
            Create New Version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}