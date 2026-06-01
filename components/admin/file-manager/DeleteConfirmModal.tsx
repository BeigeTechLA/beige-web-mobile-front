"use client";

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  itemName: string;
  itemType?: string;
  isDeleting?: boolean;
  isDark?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = "item",
  isDeleting = false,
  isDark = true,
}: DeleteConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`max-w-md p-0 overflow-hidden [&>button]:hidden transition-colors duration-200 border ${
        isDark 
          ? "border-white/10 bg-[#101010] text-white" 
          : "border-[#D7D7D7] bg-white text-black"
      }`}>
        {/* Header Section */}
        <DialogHeader className={`border-b px-6 py-5 text-left transition-colors duration-200 ${
          isDark ? "border-b-white/10" : "border-b-[#D7D7D7]"
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-[#F04438]/20 bg-[#F04438]/10 p-3 shrink-0">
                <AlertTriangle className="text-[#F04438]" size={20} />
              </div>
              <div>
                <DialogTitle className={`text-lg font-semibold transition-colors ${
                  isDark ? "text-white" : "text-black"
                }`}>
                  Delete {itemType}
                </DialogTitle>
                <DialogDescription className={`mt-1 text-sm transition-colors ${
                  isDark ? "text-white/60" : "text-[#727272]"
                }`}>
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`rounded-full p-2 transition-colors ${
                isDark ? "bg-white/5 text-white/60 hover:text-white" : "bg-black/5 text-black/60 hover:text-black"
              }`}
            >
              <X size={18} />
            </button>
          </div>
        </DialogHeader>

        {/* Content Body - Target Info Display */}
        <div className="px-6 py-5">
          <div className={`rounded-2xl border p-4 transition-colors duration-200 ${
            isDark 
              ? "border-white/10 bg-[#171717]" 
              : "border-[#D7D7D7] bg-[#FAFAFA]"
          }`}>
            <p className={`text-sm transition-colors ${isDark ? "text-white/60" : "text-[#727272]"}`}>
              You are about to delete
            </p>
            <p className={`mt-2 break-words text-base font-semibold transition-colors ${
              isDark ? "text-[#E8D1AB]" : "text-[#000]"
            }`}>
              {itemName}
            </p>
          </div>
        </div>

        {/* Footer Actions Panel */}
        <DialogFooter className={`border-t px-6 py-5 sm:justify-end transition-colors duration-200 ${
          isDark ? "border-t-white/10" : "border-t-[#D7D7D7]"
        }`}>
          <div className="flex w-full gap-3 sm:w-auto">
            <Button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className={`flex-1 sm:flex-none font-medium transition-colors ${
                isDark 
                  ? "bg-white text-black hover:bg-white/90" 
                  : "bg-[#F4F5F7] text-black hover:bg-[#E4E5E7]"
              }`}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 bg-[#F04438] text-white hover:bg-[#d7372d] sm:flex-none"
            >
              <Trash2 size={16} />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}