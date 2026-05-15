"use client";

import React from "react";
import { CalendarDays, X } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/src/components/landing/ui/button";

export type CreditPointsFormState = {
  userType: string;
  targetUserId: string;
  amount: string;
  creditType: string;
  expiryDate: string;
  reason: string;
  notes: string;
  usageRestrictions: string;
  notifyUser: boolean;
};

type AddCreditPointsModalProps = {
  open: boolean;
  form: CreditPointsFormState;
  isSubmitting?: boolean;
  userTypeOptions: string[];
  creditTypeOptions: string[];
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof CreditPointsFormState>(
    key: K,
    value: CreditPointsFormState[K]
  ) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function AddCreditPointsModal({
  open,
  form,
  isSubmitting = false,
  userTypeOptions,
  creditTypeOptions,
  onOpenChange,
  onChange,
  onSubmit,
}: AddCreditPointsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-24px)] max-w-[460px] overflow-hidden rounded-[2px] border border-white/25 bg-black p-0 text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)] sm:max-w-[500px] [&>button]:hidden">
        <DialogTitle className="sr-only">Add Credit Points</DialogTitle>

        <div className="flex items-center justify-between border-b border-white/20 px-5 py-4">
          <h2 className="text-[22px] font-semibold leading-none">Add Credit Points</h2>
          <DialogClose asChild>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2B2525] text-white/90 transition hover:bg-[#3A3333]"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </DialogClose>
        </div>

        <form
          onSubmit={onSubmit}
          className="max-h-[calc(90vh-60px)] overflow-y-auto px-5 py-5"
        >
          <div className="space-y-3.5">
            <fieldset className="rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
              <legend className="px-1 text-[11px] leading-none text-white/55">
                Select User Type*
              </legend>
              <Select
                value={form.userType}
                onValueChange={(value) => onChange("userType", value)}
              >
                <SelectTrigger className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-left text-[14px] text-white shadow-none focus:ring-0 data-[placeholder]:text-white/35">
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#111111] text-white">
                  {userTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </fieldset>

            <fieldset className="rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
              <legend className="px-1 text-[11px] leading-none text-white/55">
                Target User ID*
              </legend>
              <Input
                value={form.targetUserId}
                onChange={(event) => onChange("targetUserId", event.target.value)}
                placeholder="Enter target user id"
                className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-[14px] text-white placeholder:text-white/35 focus-visible:ring-0"
              />
            </fieldset>

            <fieldset className="rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
              <legend className="px-1 text-[11px] leading-none text-white/55">
                Enter Amount*
              </legend>
              <Input
                value={form.amount}
                onChange={(event) => onChange("amount", event.target.value)}
                placeholder="Enter amount"
                className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-[14px] text-white placeholder:text-white/35 focus-visible:ring-0"
              />
            </fieldset>

            <fieldset className="rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
              <legend className="px-1 text-[11px] leading-none text-white/55">
                Credit Type
              </legend>
              <Select
                value={form.creditType}
                onValueChange={(value) => onChange("creditType", value)}
              >
                <SelectTrigger className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-left text-[14px] text-white shadow-none focus:ring-0 data-[placeholder]:text-white/35">
                  <SelectValue placeholder="Select credit type" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#111111] text-white">
                  {creditTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </fieldset>

            <fieldset className="rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
              <legend className="px-1 text-[11px] leading-none text-white/55">
                Enter Expiry Date (Optional)
              </legend>
              <div className="relative">
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(event) => onChange("expiryDate", event.target.value)}
                  className="h-9 rounded-none border-0 bg-transparent px-0 py-0 pr-7 text-[14px] text-white focus-visible:ring-0 [&::-webkit-calendar-picker-indicator]:opacity-0"
                />
                <CalendarDays className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-white/75" />
              </div>
            </fieldset>

            <fieldset className="rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
              <legend className="px-1 text-[11px] leading-none text-white/55">
                Enter Reason*
              </legend>
              <Input
                value={form.reason}
                onChange={(event) => onChange("reason", event.target.value)}
                placeholder="Enter reason"
                className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-[14px] text-white placeholder:text-white/35 focus-visible:ring-0"
              />
            </fieldset>

            <fieldset className="rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
              <legend className="px-1 text-[11px] leading-none text-white/55">
                Notes (Optional)
              </legend>
              <Textarea
                value={form.notes}
                onChange={(event) => onChange("notes", event.target.value)}
                placeholder="Add any additional notes..."
                className="min-h-[48px] resize-none rounded-none border-0 bg-transparent px-0 py-0 text-[13px] text-white placeholder:text-white/35 focus:ring-0"
              />
            </fieldset>

            <fieldset className="rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
              <legend className="px-1 text-[11px] leading-none text-white/55">
                Usage Restrictions (Optional)
              </legend>
              <Textarea
                value={form.usageRestrictions}
                onChange={(event) => onChange("usageRestrictions", event.target.value)}
                className="min-h-[42px] resize-none rounded-none border-0 bg-transparent px-0 py-0 text-[13px] text-white placeholder:text-white/35 focus:ring-0"
              />
            </fieldset>

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[14px] font-medium text-white">Notify User</span>
              <Switch
                checked={form.notifyUser}
                onCheckedChange={(checked) => onChange("notifyUser", checked)}
                className="h-[22px] w-[38px] rounded-full bg-[#3B3636] data-[state=checked]:bg-[#E8D1AB] [&>span]:h-[16px] [&>span]:w-[16px] [&>span]:data-[state=checked]:translate-x-[16px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="h-[38px] rounded-[4px] bg-[#242222] text-[12px] font-medium text-white hover:bg-[#2f2b2b]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="beige"
                disabled={isSubmitting}
                className="h-[38px] rounded-[4px] bg-[#E8D1AB] text-[12px] font-medium text-black hover:bg-[#e0c594]"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
