"use client";

import React, { useEffect, useRef } from "react";
import { format, isValid } from "date-fns";
import { X } from "lucide-react";


import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import DatePicker from "@/components/ui/Datepicker";
import { Input } from "@/components/ui/input";
import { ClientTypeBadge } from "@/components/generic/ClientTypeBadge";
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
  clientSearch: string;
  targetUserId: string;
  guestEmail: string;
  amount: string;
  creditType: string;
  expiryDate: string;
  reason: string;
  notes: string;
  usageRestrictions: string;
  notifyUser: boolean;
};

export type ClientDropdownItem = {
  client_id?: string | number | null;
  user_id?: string | number | null;
  id?: string | number | null;
  name?: string | number | null;
  client_name?: string | number | null;
  full_name?: string | number | null;
  email?: string | number | null;
  client_email?: string | number | null;
  guest_email?: string | number | null;
  phone?: string | number | null;
  mobile?: string | number | null;
  mobile_number?: string | number | null;
  phone_number?: string | number | null;
  client_phone?: string | number | null;
  client_type?: string | number | null;
};

const pickFirstClientValue = (
  ...values: Array<string | number | null | undefined>
) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;

    const normalized = String(value).trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
};

const getClientDisplayName = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(client?.name, client?.client_name, client?.full_name);

const getClientEmail = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(client?.email, client?.client_email, client?.guest_email);

const getClientPhone = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(
    client?.phone,
    client?.mobile,
    client?.mobile_number,
    client?.phone_number,
    client?.client_phone
  );

const getClientIdentifier = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(
    client?.user_id,
    client?.client_id,
    client?.id,
    getClientDisplayName(client),
    getClientEmail(client)
  );

const parseExpiryDate = (value: string) => {
  if (!value) return null;

  const parsedDate = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};


type AddCreditPointsModalProps = {
  open: boolean;
  form: CreditPointsFormState;
  isSubmitting?: boolean;
  creditTypeOptions: string[];
  clientSuggestions: ClientDropdownItem[];
  selectedClient: ClientDropdownItem | null;
  isLoadingClientSuggestions?: boolean;
  isClientSuggestionOpen?: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: <K extends keyof CreditPointsFormState>(
    key: K,
    value: CreditPointsFormState[K]
  ) => void;
  onClientSelect: (client: ClientDropdownItem) => void;
  onClientSuggestionOpenChange: (open: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function AddCreditPointsModal({
  open,
  form,
  isSubmitting = false,
  creditTypeOptions,
  clientSuggestions,
  selectedClient,
  isLoadingClientSuggestions = false,
  isClientSuggestionOpen = false,
  onOpenChange,
  onChange,
  onClientSelect,
  onClientSuggestionOpenChange,
  onSubmit,
}: AddCreditPointsModalProps) {
  const clientSuggestionRef = useRef<HTMLFieldSetElement | null>(null);

  const handleExpiryDateChange = (date: Date | null) => {
    if (!date || !isValid(date)) {
      onChange("expiryDate", "");
      return;
    }

    onChange("expiryDate", format(date, "yyyy-MM-dd"));
  };


  useEffect(() => {
    if (!open || !isClientSuggestionOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        clientSuggestionRef.current &&
        !clientSuggestionRef.current.contains(event.target as Node)
      ) {
        onClientSuggestionOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open, isClientSuggestionOpen, onClientSuggestionOpenChange]);

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
          className="max-h-[calc(90vh-60px)] overflow-y-auto px-5 py-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="space-y-3.5">
            <fieldset className="rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5">
              <legend className="px-1 text-[11px] leading-none text-white/55">
                Select User Type*
              </legend>
              <Input
                value={form.userType}
                readOnly
                className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-[14px] text-white focus-visible:ring-0"
              />
            </fieldset>

            <fieldset
              ref={clientSuggestionRef}
              className="relative rounded-[8px] border border-white/25 px-4 pb-3 pt-1.5"
            >
              <legend className="px-1 text-[11px] leading-none text-white/55">
                Select Client*
              </legend>
              <Input
                value={form.clientSearch}
                onFocus={() => onClientSuggestionOpenChange(true)}
                onChange={(event) => onChange("clientSearch", event.target.value)}
                placeholder="Type client name or email"
                className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-[14px] text-white placeholder:text-white/35 focus-visible:ring-0"
              />
              {selectedClient && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] text-white/60">
                    {getClientEmail(selectedClient) || "No email"}
                  </p>
                  <ClientTypeBadge
                    clientType={selectedClient.client_type}
                    userId={selectedClient.user_id}
                    isDark
                  />
                </div>
              )}

              {isClientSuggestionOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[8px] border border-white/10 bg-[#111111] shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
                  <div className="max-h-64 overflow-y-auto py-2">
                    {isLoadingClientSuggestions ? (
                      <div className="px-4 py-3 text-sm text-white/60">
                        Searching clients...
                      </div>
                    ) : clientSuggestions.length > 0 ? (
                      clientSuggestions.map((client) => {
                        const clientId = getClientIdentifier(client);
                        const displayName = getClientDisplayName(client) || "Unnamed client";
                        const email = getClientEmail(client);
                        const phone = getClientPhone(client);
                        const isSelected =
                          getClientIdentifier(selectedClient) === clientId;

                        return (
                          <button
                            key={clientId}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => onClientSelect(client)}
                            className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors ${isSelected
                              ? "bg-[#E8D1AB] text-black"
                              : "text-white hover:bg-white/5"
                              }`}
                          >
                            <div className="min-w-0">
                              <div className="flex min-w-0 items-center gap-2">
                                <p className="truncate text-sm font-medium">
                                  {displayName}
                                </p>
                                <ClientTypeBadge
                                  clientType={client.client_type}
                                  userId={client.user_id}
                                  isDark
                                  isSelected={isSelected}
                                />
                              </div>
                              {(email || phone) && (
                                <p
                                  className={`mt-1 truncate text-xs ${isSelected ? "text-black/70" : "text-white/50"
                                    }`}
                                >
                                  {[email, phone].filter(Boolean).join(" | ")}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })
                    ) : form.clientSearch.trim() ? (
                      <div className="px-4 py-3 text-sm text-white/60">
                        No matching clients found.
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-sm text-white/60">
                        Start typing to search clients.
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                <SelectTrigger className="h-9 rounded-none border-0 bg-transparent px-0 py-0 text-left text-[14px] text-white shadow-none focus:ring-0 data-[placeholder]:text-white/35 [&>svg]:text-white [&>svg]:transition-transform [&>svg]:duration-200 [&[data-state=open]>svg]:rotate-180">
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
              <div className="pt-1">
                <DatePicker
                  label=""
                  value={parseExpiryDate(form.expiryDate)}
                  onChange={handleExpiryDateChange}
                  minDate={new Date()}
                  format="MM/dd/yyyy"
                  disablePortal
                  colors={{
                    inputBackground: "transparent",
                    inputBorder: "transparent",
                    inputBorderHover: "transparent",
                    inputBorderFocus: "transparent",
                  }}
                  sx={{
                    height: "40px",
                    borderRadius: "0px",
                    "& fieldset": {
                      border: "0 !important",
                    },
                    "& .MuiOutlinedInput-root": {
                      paddingRight: "0px",
                    },
                    "& .MuiInputBase-input": {
                      padding: "8px 0",
                    },
                    "& .MuiInputAdornment-root": {
                      marginLeft: "0px",
                      marginRight: "-10px",
                    },
                    "& .MuiIconButton-root": {
                      padding: "4px",
                      marginRight: "-6px",
                    },
                  }}
                  isDark
                  labelSx={{ display: "none" }}
                />
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
                className="h-[24px] w-[44px] rounded-[10px] border border-[#4A4A4A] bg-[#3B3B3B] px-[3px] shadow-none transition-colors data-[state=checked]:border-[#E8D1AB] data-[state=checked]:bg-[#E8D1AB] [&>span]:h-[16px] [&>span]:w-[16px] [&>span]:rounded-[6px] [&>span]:bg-[#F8F8F8] [&>span]:shadow-none [&>span]:ring-0 [&>span]:data-[state=checked]:translate-x-[20px]"
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
