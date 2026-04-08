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
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = "item",
  isDeleting = false,
}: DeleteConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-white/10 bg-[#101010] p-0 text-white overflow-hidden">
        <DialogHeader className="border-b border-white/10 px-6 py-5 text-left">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-[#F04438]/20 bg-[#F04438]/10 p-3">
                <AlertTriangle className="text-[#F04438]" size={20} />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white">
                  Delete {itemType}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-white/60">
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full bg-white/5 p-2 text-white/60 transition-colors hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 py-5">
          <div className="rounded-2xl border border-white/10 bg-[#171717] p-4">
            <p className="text-sm text-white/60">You are about to delete</p>
            <p className="mt-2 break-words text-base font-semibold text-[#E8D1AB]">
              {itemName}
            </p>
          </div>
        </div>

        <DialogFooter className="border-t border-white/10 px-6 py-5 sm:justify-end">
          <div className="flex w-full gap-3 sm:w-auto">
            <Button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 bg-white text-black hover:bg-white/90 sm:flex-none"
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
