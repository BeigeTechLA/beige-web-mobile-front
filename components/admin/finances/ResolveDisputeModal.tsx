"use client";

import React, { useEffect, useRef, useState } from "react";
import { format, isValid, addDays, startOfDay } from "date-fns";
import { X, CreditCard, Coins, FileText, Info, Trash2 } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/src/components/landing/ui/button";
import { TabsSwitcher } from "../TabsSwitcher";

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

type ResolveDisputeModalProps = {
  open: boolean;
  isSubmitting?: boolean;
  isDark?: boolean;
  handleResolvePayment: ()=>void;
};

const tabs = [
  {
    label: (
      <span className="flex items-center">
        <CreditCard className="w-4 h-4 mr-2" /> Auto Transfer (Stripe)
      </span>
    ),
    value: "auto"
  },
  {
    label: (
      <span className="flex items-center">
        <Coins className="w-4 h-4 mr-2" /> Beige Credits
      </span>
    ),
    value: "credits"
  },
  {
    label: (
      <span className="flex items-center">
        <FileText className="w-4 h-4 mr-2" /> Manual Payment
      </span>
    ),
    value: "manual"
  },
];

export default function ResolveDisputeModal({
  open,
  isSubmitting = false,
  isDark = true,
  handleResolvePayment
}: ResolveDisputeModalProps) {
  const clientSuggestionRef = useRef<HTMLFieldSetElement | null>(null);

  const [tab, setTab] = useState("auto");
  const [amountType, setAmountType] = useState("full");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const tomorrow = startOfDay(addDays(new Date(), 1));
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (indexToRemove: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  return (
    <Dialog open={open}>
      {/* Container display configuration set to flex column layout to orchestrate the internal fixed components */}
      <DialogContent className="w-[calc(100vw-24px)] max-w-4xl overflow-hidden rounded-2xl border border-white/40 bg-black p-0 text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)] [&>button]:hidden h-[calc(90vh-50px)] flex flex-col">
        <DialogTitle className="sr-only">Resolve Dispute</DialogTitle>

        {/* Fixed Header */}
        <div className="flex items-center justify-between border-b border-[#CACACA] p-4 lg:p-7 shrink-0">
          <div>
            <h2 className="text-xl lg:text-3xl font-bold leading-none">Resolve Dispute</h2>
            <p className="lg:text-xl font-medium text-[#E8D1AB]">DIS-001 • SH-004 • $5,000</p>
          </div>

          <DialogClose asChild>
            <button
              type="button"
              className="shrink-0 flex h-10 w-10 lg:h-15 lg:w-15 items-center justify-center rounded-full bg-[#2B2525] text-white/90 transition hover:bg-[#3A3333]"
              aria-label="Close"
            >
              <X className="h-4 w-4 lg:h-7 lg:w-7" />
            </button>
          </DialogClose>
        </div>

        {/* Form Wrap with Inner Scroll Mechanics */}
        <form className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Middle Container Segment */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 lg:space-y-5 p-4 lg:p-7">
            <div>
              {/* Lines 118 & 119 Context Theme Customizations Switch Logic */}
              <p className={`text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Select Resolution Type</p>
              <p className={`text-xs lg:text-sm ${isDark ? "text-[#A0A0A0]" : "text-[#606060]"}`}>Choose how you want to process the payment</p>
            </div>

            <TabsSwitcher
              tabs={tabs}
              activeTab={tab}
              onChange={(tab) => setTab(tab)}
              className="w-full"
              textCenter={true}
            />

            {/* Configurable inner container wrapper */}
            <div className={`p-4 lg:p-7 rounded-lg border ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#F9F9F9] border-[#E5E5E5] text-black"}`}>
              {tab === "auto" && (
                <div className="space-y-5 lg:space-y-7">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 lg:h-15 lg:w-15 rounded-full flex items-center justify-center ${isDark ? "bg-[#E8D1AB] text-black" : "bg-[#D9C49E] text-black"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
                        <path d="M15 22.5C13.3343 23.278 11.1463 23.75 8.75 23.75C7.4176 23.75 6.14961 23.6041 5 23.3408C4.26099 23.1715 3.89149 23.0869 3.44873 22.7365C3.19621 22.5367 2.88104 22.1412 2.74264 21.8504C2.5 21.3406 2.5 20.8463 2.5 19.8575V6.39246C2.5 5.16143 3.80004 4.31591 5 4.59075C6.14961 4.85407 7.4176 5 8.75 5C11.1463 5 13.3343 4.52795 15 3.75C16.6657 2.97205 18.8537 2.5 21.25 2.5C22.5824 2.5 23.8504 2.64593 25 2.90925C25.739 3.07851 26.1085 3.16314 26.5513 3.51348C26.8038 3.7133 27.119 4.10882 27.2574 4.39958C27.5 4.90938 27.5 5.40374 27.5 6.39246V19.8575C27.5 21.0886 26.2 21.9341 25 21.6592C23.8504 21.3959 22.5824 21.25 21.25 21.25C18.8537 21.25 16.6657 21.722 15 22.5Z" fill={isDark ? "#000000" : "#fff"} />
                        <path d="M2.5 26.25C4.16567 27.028 6.35366 27.5 8.75 27.5C11.1463 27.5 13.3343 27.028 15 26.25C16.6657 25.472 18.8537 25 21.25 25C23.6463 25 25.8343 25.472 27.5 26.25" stroke={isDark ? "#000000" : "#fff"} strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M18.125 13.125C18.125 14.8509 16.7259 16.25 15 16.25C13.2741 16.25 11.875 14.8509 11.875 13.125C11.875 11.3991 13.2741 10 15 10C16.7259 10 18.125 11.3991 18.125 13.125Z" fill="#E8D1AB" stroke="#E8D1AB" strokeWidth="1.5" />
                        <path d="M6.875 14.375L6.875 14.3862" stroke="#E8D1AB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M23.125 11.8672L23.125 11.8784" stroke="#E8D1AB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <h4 className={`text-base lg:text-lg font-medium ${isDark ? "text-white" : "text-black"}`}>Amount Type - Auto Transfer Configuration</h4>
                      <p className={`text-sm lg:text-base ${isDark ? "text-white/50" : "text-black/50"}`}>Configure automated Stripe transfer</p>
                    </div>
                  </div>

                  <div className={`grid grid-cols-2 rounded-lg border overflow-hidden p-1  ${isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"}`}>
                    <button
                      type="button"
                      onClick={() => setAmountType("full")}
                      className={`p-2.5 text-center border transition-all rounded-md ${amountType === "full"
                        ? (isDark ? "bg-[#E8D1AB]/20 border-[#E8D1AB]" : "bg-[#F0E6D2] border-[#D9C49E]")
                        : "bg-transparent border-transparent"
                        } ${isDark ? "border-[#242222]" : "border-[#E5E5E5]"}`}
                    >
                      <span className="block text-sm lg:text-base text-[#A0A0A0]">Full Payment</span>
                      <span className={` text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>$5,000</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmountType("partial")}
                      className={`p-2.5 text-center border transition-all rounded-md  ${amountType === "partial"
                        ? (isDark ? "bg-[#E8D1AB]/20 border-[#E8D1AB]" : "bg-[#F0E6D2] border-[#D9C49E]")
                        : "bg-transparent border-transparent"
                        } ${isDark ? "border-[#242222]" : "border-[#E5E5E5]"}`}
                    >
                      <span className="block text-sm lg:text-base text-[#A0A0A0]">Partial Payment</span>
                      <span className={` text-sm lg:text-base font-medium ${isDark ? "text-white" : "text-black"}`}>Custom</span>
                    </button>
                  </div>

                  {
                    amountType === "partial" &&
                    <div className="relative">
                      <label className={`absolute -top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-[#171717] text-white/50" : "bg-white text-black/60"}`}>
                        Enter Amount
                      </label>
                      <Input
                        type="text"
                        // value={amount}
                        placeholder="Maximum: $5,800"
                        className={`h-16 lg:h-[82px] rounded-lg lg:rounded-xl pt-1 ${isDark ? "placeholder:text-white/30 text-white bg-[#171717] border-white/50 focus:border-[#E8D1AB]/50" : "text-black border-black/20 bg-[#fff] placeholder:text-black/60 focus:border-[#E8D1AB]"}`}
                      />
                    </div>
                  }

                  <div className="relative">
                    <label className={`absolute -top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-[#171717] text-white/50" : "bg-white text-black/60"}`}>Select Recipient</label>
                    <Select>
                      <SelectTrigger className={`h-16 lg:h-[82px] rounded-lg lg:rounded-xl text-left ${isDark ? "text-white border-white/50 bg-[#171717]" : "text-black border-black/20 bg-[#fff]"}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={`rounded-xl ${isDark ? "border-white/10 bg-[#111111] text-white" : "text-black border-black/20 bg-[#fff]"}`}>
                        <SelectItem value="cp" className={`${isDark ? "focus:bg-[#1B1B1B] focus:text-white " : "focus:bg-[#E8D1AB] focus:text-black"}`}>CP1</SelectItem>
                        <SelectItem value="cp2" className={`${isDark ? "focus:bg-[#1B1B1B] focus:text-white" : "focus:bg-[#E8D1AB] focus:text-black"}`}>CP2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>


                  <div className={`p-4 rounded-xl flex items-start gap-3 border ${isDark ? "bg-[#3B82F6]/5 border-[#3B82F6]/20" : "bg-[#EEF2F6] border-[#D0DDF0]"}`}>
                    <Info className={`w-4 h-4 lg:w-5 lg:h-5 ${isDark ? "text-[#3B82F6]" : "text-[#1E56D9]"}`} />
                    <div className="flex-1 flex justify-between items-start">
                      <div>
                        <p className={`text-sm ${isDark ? "text-white" : "text-black"}`}>Payment Method</p>
                        <p className="text-xs text-[#A0A0A0]">Stripe - Card ending in ****4242</p>
                      </div>
                      <span className="text-xs text-[#A0A0A0]">Processed via Stripe payment gateway</span>
                    </div>
                  </div>
                </div>
              )}

              {tab === "credits" && (
                <div className="space-y-5 lg:space-y-7">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 lg:h-15 lg:w-15 rounded-full flex items-center justify-center ${isDark ? "bg-[#E8D1AB] text-black" : "bg-[#D9C49E] text-black"}`}>
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`text-base lg:text-lg font-medium ${isDark ? "text-white" : "text-black"}`}>Beige Credits Configuration</h4>
                      <p className={`text-sm lg:text-base ${isDark ? "text-white/50" : "text-black/50"}`}>Add credits to user wallet</p>
                    </div>
                  </div>

                  <div className="relative">
                    <label className={`absolute -top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-[#171717] text-white/50" : "bg-white text-black/60"}`}>
                      Enter Credit Amount
                    </label>
                    <div className="relative pt-2">
                      {/* Positioned inside the input track boundaries */}
                      <Coins className="absolute w-4 h-4 lg:w-6 lg:h-6 text-[#D4B896] left-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none" />
                      <Input
                        type="text"
                        placeholder="500 Credits Points"
                        className={`h-16 lg:h-[82px] rounded-lg lg:rounded-xl pl-13 pt-1 ${isDark
                          ? "placeholder:text-white/30 text-white bg-[#171717] border-white/50 focus:border-[#E8D1AB]/50"
                          : "text-black border-black/20 bg-[#fff] placeholder:text-black/60 focus:border-[#E8D1AB]"
                          }`}
                      />
                    </div>
                    <p className={`text-xs lg:text-sm mt-1.5 ${isDark ? "text-[#E8D1AB]" : "text-[#B5965E]"}`}>
                      Equivalent value: $500 USD
                    </p>
                  </div>

                  <div className="relative">
                    <label className={`absolute -top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-[#171717] text-white/50" : "bg-white text-black/60"}`}>Select Recipient</label>
                    <Select>
                      <SelectTrigger className={`h-16 lg:h-[82px] rounded-lg lg:rounded-xl text-left ${isDark ? "text-white border-white/50 bg-[#171717]" : "text-black border-black/20 bg-[#fff]"}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={`rounded-xl ${isDark ? "border-white/10 bg-[#111111] text-white" : "text-black border-black/20 bg-[#fff]"}`}>
                        <SelectItem value="cp" className={`${isDark ? "focus:bg-[#1B1B1B] focus:text-white " : "focus:bg-[#E8D1AB] focus:text-black"}`}>CP1</SelectItem>
                        <SelectItem value="cp2" className={`${isDark ? "focus:bg-[#1B1B1B] focus:text-white" : "focus:bg-[#E8D1AB] focus:text-black"}`}>CP2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={`p-4 rounded-xl flex items-start gap-3 border ${isDark ? "bg-[#E8D1AB]/5 border-[#E8D1AB]/20" : "bg-[#FAF7F2] border-[#E8DFD0]"}`}>
                    <Info className={`w-4 h-4 lg:w-5 lg:h-5 mt-0.5 ${isDark ? "text-[#E8D1AB]" : "text-[#B5965E]"}`} />
                    <div>
                      <p className={`text-sm ${isDark ? "text-white" : "text-black"}`}>Credit Information</p>
                      <p className="text-xs text-[#A0A0A0]">Amount will be added to user wallet as Beige Credits. Credits can be used for future bookings and services.</p>
                    </div>
                  </div>
                </div>
              )}

              {tab === "manual" && (
                <div className="space-y-5 lg:space-y-7">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 lg:h-15 lg:w-15 rounded-full flex items-center justify-center ${isDark ? "bg-[#E8D1AB] text-black" : "bg-[#D9C49E] text-black"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none">
                        <path d="M26.1784 21.0442C25.358 16.1082 22.804 12.4327 20.5837 10.2738C19.9376 9.64553 19.6146 9.33141 18.901 9.04071C18.1874 8.75 17.574 8.75 16.3472 8.75H13.6528C12.426 8.75 11.8126 8.75 11.099 9.04071C10.3854 9.33141 10.0624 9.64553 9.4163 10.2738C7.19602 12.4327 4.64201 16.1082 3.82158 21.0442C3.21116 24.7168 6.59909 27.5 10.3854 27.5H19.6146C23.4009 27.5 26.7888 24.7168 26.1784 21.0442Z" fill={isDark ? "#000000" : "#fff"} />
                        <path d="M15.6413 13.75C15.6413 13.3358 15.3055 13 14.8913 13C14.4771 13 14.1413 13.3358 14.1413 13.75L14.8913 13.75L15.6413 13.75ZM14.1413 22.5C14.1413 22.9142 14.4771 23.25 14.8913 23.25C15.3055 23.25 15.6413 22.9142 15.6413 22.5H14.8913H14.1413ZM16.3813 16.0789C16.632 16.4086 17.1025 16.4727 17.4323 16.2221C17.762 15.9714 17.8262 15.5009 17.5755 15.1711L16.9784 15.625L16.3813 16.0789ZM13.309 20.2675C13.0003 19.9913 12.5262 20.0175 12.2499 20.3262C11.9737 20.6349 12 21.109 12.3086 21.3852L12.8088 20.8264L13.309 20.2675ZM14.8913 17.9992V17.2492C14.0701 17.2492 13.6558 17.1166 13.4625 16.9864C13.3326 16.8989 13.25 16.7822 13.25 16.4868H12.5H11.75C11.75 17.1658 11.9934 17.8054 12.6245 18.2304C13.192 18.6128 13.9734 18.7492 14.8913 18.7492V17.9992ZM12.5 16.4868H13.25C13.25 16.2939 13.3544 16.0577 13.6457 15.8427C13.9368 15.6279 14.3747 15.4724 14.8913 15.4724V14.7224V13.9724C14.0872 13.9724 13.3295 14.2119 12.7551 14.6357C12.181 15.0593 11.75 15.7053 11.75 16.4868H12.5ZM17.5 19.7636H16.75C16.75 20.1116 16.6127 20.3175 16.3497 20.4754C16.0413 20.6607 15.5435 20.778 14.8913 20.778V21.528V22.278C15.6799 22.278 16.4864 22.1431 17.1221 21.7613C17.8033 21.3521 18.25 20.6759 18.25 19.7636H17.5ZM14.8913 17.9992V18.7492C15.7186 18.7492 16.1897 18.8749 16.4381 19.037C16.6191 19.155 16.75 19.3329 16.75 19.7636H17.5H18.25C18.25 18.9339 17.9461 18.2297 17.2575 17.7806C16.6364 17.3755 15.8032 17.2492 14.8913 17.2492V17.9992ZM14.8913 14.7224L15.6413 14.7224L15.6413 13.75L14.8913 13.75L14.1413 13.75L14.1413 14.7224L14.8913 14.7224ZM14.8913 21.528H14.1413V22.5H14.8913H15.6413V21.528H14.8913ZM14.8913 14.7224V15.4724C15.6054 15.4724 16.1425 15.7647 16.3813 16.0789L16.9784 15.625L17.5755 15.1711C16.9955 14.4081 15.9701 13.9724 14.8913 13.9724V14.7224ZM14.8913 21.528V20.778C14.1878 20.778 13.6221 20.5478 13.309 20.2675L12.8088 20.8264L12.3086 21.3852C12.9479 21.9573 13.8934 22.278 14.8913 22.278V21.528Z" fill="#E8D1AB" />
                        <path d="M9.07078 5.55359C8.81289 5.17823 8.43909 4.66874 9.21124 4.55256C10.0049 4.43314 10.829 4.97643 11.6357 4.96526C12.3655 4.95516 12.7373 4.63149 13.1361 4.16935C13.5562 3.68272 14.2065 2.5 15 2.5C15.7935 2.5 16.4438 3.68272 16.8639 4.16935C17.2627 4.63149 17.6345 4.95516 18.3643 4.96526C19.171 4.97643 19.9951 4.43314 20.7888 4.55256C21.5609 4.66874 21.1871 5.17823 20.9292 5.55358L19.7632 7.2508C19.2644 7.97683 19.015 8.33984 18.4931 8.54492C17.9711 8.75 17.2967 8.75 15.9478 8.75H14.0523C12.7033 8.75 12.0289 8.75 11.5069 8.54492C10.985 8.33984 10.7356 7.97683 10.2368 7.2508L9.07078 5.55359Z" fill={isDark ? "#000000" : "#fff"} />
                      </svg>
                    </div>
                    <div>
                      <h4 className={`text-base lg:text-lg font-medium ${isDark ? "text-white" : "text-black"}`}>Manual Payment Configuration</h4>
                      <p className={`text-sm lg:text-base ${isDark ? "text-white/50" : "text-black/50"}`}>Record manual payment with proof</p>
                    </div>
                  </div>

                  <div className="relative">
                    <label className={`absolute -top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-[#171717] text-white/50" : "bg-white text-black/60"}`}>Select Payment Method*</label>
                    <Select>
                      <SelectTrigger className={`h-16 lg:h-[82px] rounded-lg lg:rounded-xl text-left ${isDark ? "text-white border-white/50 bg-[#171717]" : "text-black border-black/20 bg-[#fff]"}`}>
                        <SelectValue placeholder="Eg : UPI, Cash, Bank Transfer, Credit Card and Others..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative">
                    <label className={`absolute -top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-[#171717] text-white/50" : "bg-white text-black/60"}`}>Select Recipient</label>
                    <Select>
                      <SelectTrigger className={`h-16 lg:h-[82px] rounded-lg lg:rounded-xl text-left ${isDark ? "text-white border-white/50 bg-[#171717]" : "text-black border-black/20 bg-[#fff]"}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={`rounded-xl ${isDark ? "border-white/10 bg-[#111111] text-white" : "text-black border-black/20 bg-[#fff]"}`}>
                        <SelectItem value="cp" className={`${isDark ? "focus:bg-[#1B1B1B] focus:text-white " : "focus:bg-[#E8D1AB] focus:text-black"}`}>CP1</SelectItem>
                        <SelectItem value="cp2" className={`${isDark ? "focus:bg-[#1B1B1B] focus:text-white" : "focus:bg-[#E8D1AB] focus:text-black"}`}>CP2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative">
                    <label className={`absolute -top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-[#171717] text-white/50" : "bg-white text-black/60"}`}>Transaction ID*</label>
                    <Input
                      type="text"
                      className={`h-16 lg:h-[82px] rounded-lg lg:rounded-xl pt-1 ${isDark ? "placeholder:text-white/30 text-white bg-[#171717] border-white/50 focus:border-[#E8D1AB]/50" : "text-black border-black/20 bg-[#fff] placeholder:text-black/60 focus:border-[#E8D1AB]"}`}
                    />
                  </div>

                  <div className="relative">
                    <span className={`block text-sm lg:text-base mb-1.5 font-medium ${isDark ? "text-white" : "text-black"}`}>
                      Upload Proof <span className="text-[#E8D1AB]">(Required)</span>
                    </span>
                    {uploadedFiles.length === 0 ? (
                      /* Empty State / Dropzone Trigger */
                      <>
                        <label
                          htmlFor="proof-upload"
                          className={`lg:h-30 flex justify-center items-center border border-dashed rounded-xl p-6 text-center transition cursor-pointer ${isDark ? "border-white/50 hover:bg-[#1C1A1A]" : "border-[#CCCCCC] hover:bg-[#F0F0F0]"
                            }`}
                        >
                          <p className="text-xs lg:text-sm text-[#A0A0A0]">
                            Drag & Drop Your File Here Or <span className={`font-semibold ${isDark ? "text-[#E8D1AB]" : "text-[#B5965E]"}`}>Upload</span>
                          </p>
                        </label>
                        <input
                          id="proof-upload"
                          type="file"
                          multiple
                          accept="image/png,image/jpeg,application/pdf"
                          className="hidden"
                          onChange={handleFileChange}
                          disabled={isSubmitting}
                        />
                      </>
                    ) : (
                      /* Uploaded File List View State */
                      <div className="space-y-2">
                        {uploadedFiles.map((file, idx) => {
                          const fileSizeKB = (file.size / 1024).toFixed(2);
                          return (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${isDark ? "bg-[#0A0A0A] border-[#262626]" : "bg-[#F9F9F9] border-black/10 text-black"
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <FileText className={`w-5 h-5 ${isDark ? "text-[#E8D1AB]" : "text-[#B5965E]"}`} />
                                <div>
                                  <p className={`text-sm font-medium leading-tight ${isDark ? "text-white" : "text-black"}`}>
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-[#A0A0A0] mt-0.5">{fileSizeKB} KB</p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition"
                                aria-label="Remove file"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className={`absolute -top-3 left-4 z-10 px-2 text-sm lg:text-base font-medium transition-colors ${isDark ? "bg-[#171717] text-white/50" : "bg-white text-black/60"}`}>Notes (Optional)</label>
                    <Input
                      placeholder="Add any additional notes..."
                      className={`h-16 lg:h-[82px] rounded-lg lg:rounded-xl pt-1 ${isDark ? "placeholder:text-white/30 text-white bg-[#171717] border-white/50 focus:border-[#E8D1AB]/50" : "text-black border-black/20 bg-[#fff] placeholder:text-black/60 focus:border-[#E8D1AB]"}`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Footer Segment outside the scroll zone */}
          <div className="grid grid-cols-2 gap-3 p-4 lg:p-7 shrink-0 bg-black">
            <Button
              type="button"
              disabled={isSubmitting}
              className="h-12 rounded-sm bg-[#242222] text-sm font-semibold text-white hover:bg-[#2f2b2b]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="beige"
              disabled={isSubmitting}
              onClick={handleResolvePayment}
              className="h-12 rounded-sm bg-[#E8D1AB] text-sm font-semibold text-black hover:bg-[#e0c594]"
            >
              {isSubmitting ? "Submitting..." : "Resolve & Process Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}