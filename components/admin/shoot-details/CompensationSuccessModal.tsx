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
      <DialogContent className="w-[calc(100vw-24px)] max-w-[610px] rounded-[18px] border border-white/15 bg-black px-8 py-14 text-white shadow-[0_30px_90px_rgba(0,0,0,0.7)] [&>button]:hidden">
        <DialogTitle className="sr-only">Request Sent Successfully</DialogTitle>
        <div className="text-center">
          <div className="relative mx-auto mb-16 h-[140px] w-[170px]">
            <span className="absolute left-2 top-8 h-3 w-3 rotate-12 bg-[#3B82F6]" />
            <span className="absolute right-3 top-5 h-3 w-3 rotate-45 bg-[#F0B63F]" />
            <span className="absolute left-7 bottom-5 h-3 w-3 rounded-full bg-[#E8B83E]" />
            <span className="absolute right-5 bottom-8 h-2 w-2 bg-[#EA4335]" />
            <span className="absolute left-10 top-0 h-3 w-3 rotate-45 bg-[#46A57A]" />
            <span className="absolute right-10 top-0 h-2 w-2 rotate-12 bg-[#5474B8]" />
            <div className="absolute left-1/2 top-1/2 flex h-[118px] w-[118px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#E8D1AB]">
              <Check className="h-16 w-16 stroke-[3] text-black" />
            </div>
          </div>
          <h2 className="text-[34px] font-medium leading-tight">Request Sent Successfully</h2>
          <p className="mx-auto mt-6 max-w-[500px] text-[23px] leading-[1.45] text-white/60">
            This compensation request is now sent to the Finance for approval.
          </p>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="mx-auto mt-10 h-[68px] w-full rounded-[12px] bg-[#E8D1AB] text-[20px] font-semibold text-black hover:bg-[#DCC397]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
