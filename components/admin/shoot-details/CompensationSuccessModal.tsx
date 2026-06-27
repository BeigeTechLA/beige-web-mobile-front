"use client";

import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CompensationSuccessModal({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-[610px] rounded-[18px] border border-white/15 bg-black px-5 py-9 text-white shadow-[0_30px_90px_rgba(0,0,0,0.7)] sm:px-8 sm:py-14 [&>button]:hidden">
        <DialogTitle className="sr-only">Request Sent Successfully</DialogTitle>
        <div className="text-center">
          <div className="relative mx-auto mb-10 h-[112px] w-[140px] sm:mb-16 sm:h-[140px] sm:w-[170px]">
            <span className="absolute left-2 top-8 h-3 w-3 rotate-12 bg-[#3B82F6]" />
            <span className="absolute right-3 top-5 h-3 w-3 rotate-45 bg-[#F0B63F]" />
            <span className="absolute left-7 bottom-5 h-3 w-3 rounded-full bg-[#E8B83E]" />
            <span className="absolute right-5 bottom-8 h-2 w-2 bg-[#EA4335]" />
            <span className="absolute left-10 top-0 h-3 w-3 rotate-45 bg-[#46A57A]" />
            <span className="absolute right-10 top-0 h-2 w-2 rotate-12 bg-[#5474B8]" />
            <div className="absolute left-1/2 top-1/2 flex h-[92px] w-[92px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#E8D1AB] sm:h-[118px] sm:w-[118px]">
              <Check className="h-12 w-12 stroke-[3] text-black sm:h-16 sm:w-16" />
            </div>
          </div>
          <h2 className="text-[25px] font-medium leading-tight sm:text-[34px]">Request Sent Successfully</h2>
          <p className="mx-auto mt-4 max-w-[500px] text-[16px] leading-[1.45] text-white/60 sm:mt-6 sm:text-[23px]">
            This compensation request is now sent to the Finance for approval.
          </p>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="mx-auto mt-8 h-[54px] w-full rounded-[12px] bg-[#E8D1AB] text-[16px] font-semibold text-black hover:bg-[#DCC397] sm:mt-10 sm:h-[68px] sm:text-[20px]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
