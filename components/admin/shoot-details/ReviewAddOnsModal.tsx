"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/src/components/landing/ui/button";

interface ReviewAddOnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  selectedItems: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
}

export function ReviewAddOnsModal({
  isOpen,
  onClose,
  onContinue,
  selectedItems,
  totalAmount,
}: ReviewAddOnsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#050505] p-8 shadow-2xl">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-full bg-amber-500/10 p-2">
            <AlertCircle size={24} className="text-[#B38B3F]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Review Your Add-ons</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Check the selected add-ons before saving the shoot update.
            </p>
          </div>
        </div>

        <div className="mb-8 overflow-hidden rounded-xl border border-zinc-800/50 bg-[#161616]">
          <div className="space-y-4 p-5">
            {selectedItems.length > 0 ? (
              selectedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">
                    {item.name} x {item.quantity}
                  </span>
                  <span className="font-medium text-white">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No add-ons selected.</p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/50 p-5">
            <span className="font-bold text-white">Total Amount</span>
            <span className="text-lg font-bold text-[#E8D1AB]">
              ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-12 flex-1 border-none bg-[#1A1A1A] text-white hover:bg-zinc-800"
          >
            No, Cancel
          </Button>
          <Button
            onClick={onContinue}
            className="h-12 flex-1 bg-[#E8D1AB] font-bold text-black hover:bg-[#d9c5a0]"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
