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
      <div className="bg-[#050505] border border-zinc-800 w-full max-w-md rounded-2xl p-8 shadow-2xl">
        {/* Header Section */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-2 rounded-full bg-amber-500/10">
            <AlertCircle size={24} className="text-[#B38B3F]" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Review Your Add-ons</h2>
            <p className="text-zinc-400 text-sm mt-1">
              Review your selections, make any final changes, then continue to payment.
            </p>
          </div>
        </div>

        {/* Summary Box */}
        <div className="bg-[#161616] rounded-xl overflow-hidden mb-8 border border-zinc-800/50">
          <div className="p-5 space-y-4">
            {selectedItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">
                  {item.name} x {item.quantity}
                </span>
                <span className="text-white font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total Footer Row */}
          <div className="bg-zinc-900/50 p-5 flex justify-between items-center border-t border-zinc-800">
            <span className="text-white font-bold">Total Amount</span>
            <span className="text-[#E8D1AB] text-lg font-bold">
              ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-12 bg-[#1A1A1A] border-none text-white hover:bg-zinc-800"
          >
            No, Cancel
          </Button>
          <Button
            onClick={onContinue}
            className="flex-1 h-12 bg-[#E8D1AB] text-black hover:bg-[#d9c5a0] font-bold"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}