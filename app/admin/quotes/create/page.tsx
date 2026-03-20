"use client";

import React, { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  Search,
  Plus,
  Save,
  Check,
  User,
  MoreVertical,
  Calendar
} from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DottedDivider from "@/components/admin/DottedDivider";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, parseISO, isValid } from "date-fns";

const clients = [
  { id: 1, name: "Jaymin Patel", email: "jaymin@example.com", phone: "+1 (555) 123-4567" },
  { id: 2, name: "Harsh Panchal", email: "harsh@example.com", phone: "+1 (555) 987-6543" },
  { id: 3, name: "Parth Patel", email: "parth@example.com", phone: "+1 (555) 000-1111" },
  { id: 4, name: "Raj Yadav", email: "raj@example.com", phone: "+1 (555) 222-3333" },
];

export default function CreateQuotePage() {
  const pathname = usePathname();
  const router = useRouter();
  
  // Views: 'selection' | 'details'
  const [view, setView] = useState<'selection' | 'details'>('selection');
  
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [clientName, setClientName] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [validityDays, setValidityDays] = useState<number | 'custom'>(7);
  const [validUntil, setValidUntil] = useState(format(addDays(new Date(), 7), "yyyy-MM-dd"));
  const validUntilInputRef = useRef<HTMLInputElement>(null);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleValiditySelect = (days: number | 'custom') => {
    setValidityDays(days);
    if (days !== 'custom') {
      const newDate = addDays(new Date(), days);
      setValidUntil(format(newDate, "yyyy-MM-dd"));
    }
  };

  const formattedValidUntil = (() => {
    if (!validUntil) return "";
    const parsedDate = parseISO(validUntil);
    return isValid(parsedDate) ? format(parsedDate, "dd-MM-yyyy") : validUntil;
  })();

  const handleContinue = () => {
    if (view === 'selection' && selectedClient) {
      setClientName(selectedClient.name);
      setEmailId(selectedClient.email || "");
      setPhoneNumber(selectedClient.phone || "");
      setView('details');
    } else {
      // Logic for next major step (Step 2)
      console.log("Moving to Step 2...");
    }
  };

  const handleBack = () => {
    if (view === 'details') {
      setView('selection');
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          "create": "Creating New Quote"
        }}
        actions={
          <Button className="bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] font-medium">
            View Quote Summary
          </Button>
        }
      />

      <div className="p-4 lg:p-10 max-w-6xl mx-auto">
        {/* Navigation & Progress Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
          >
            <ChevronLeft size={20} />
            Back
          </button>

          <div className="text-right">
            <span className="text-sm font-bold text-white">
              Step 1 - {view === 'selection' ? '0%' : '10%'} Completed
            </span>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="flex gap-4 mb-10">
          <div className="h-[2.5px] flex-1 bg-zinc-800 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-[#E5D5B8] transition-all duration-500 rounded-full" 
              style={{ width: view === 'selection' ? '0%' : '20%' }} 
            />
          </div>
          <div className="h-[2.5px] flex-1 bg-zinc-800 rounded-full"></div>
          <div className="h-[2.5px] flex-1 bg-zinc-800 rounded-full"></div>
        </div>

        {/* Main Card */}
        <div className="bg-[#0A0A0A] border border-zinc-800 rounded-3xl p-10 mb-10">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-1">Client Information</h2>
            <p className="text-zinc-500 text-sm">Select an existing client or create a new one</p>
          </div>

          <DottedDivider className="mb-12 opacity-40" />

          {view === 'selection' ? (
            /* Client Selector View */
            <div className="relative max-w-full">
              <div className="absolute -top-3 left-6 z-10 px-2 bg-[#0A0A0A]">
                <span className="text-xs text-zinc-400 font-medium tracking-wide">Select Client</span>
              </div>

              <div className="relative border border-zinc-800 rounded-2xl bg-transparent">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full group bg-transparent rounded-2xl px-6 py-7 flex justify-between items-center transition-all ${isDropdownOpen ? 'ring-1 ring-[#E5D5B8]/30' : ''}`}
                >
                  <span className={selectedClient ? "text-white text-lg font-medium" : "text-zinc-500 text-lg font-medium"}>
                    {selectedClient ? selectedClient.name : "Choose a Client..."}
                  </span>
                  <ChevronDown size={24} className={`text-zinc-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.99, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.99, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0F0F0F] border border-zinc-800 rounded-2xl overflow-hidden z-50 shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
                    >
                      <div className="max-h-80 overflow-y-auto custom-scrollbar p-3">
                        {filteredClients.map((client) => (
                          <div
                            key={client.id}
                            onClick={() => {
                              setSelectedClient(client);
                              setIsDropdownOpen(false);
                            }}
                            className={`flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all mb-1 ${selectedClient?.id === client.id
                                ? 'bg-[#FFF9EE] text-[#101010]'
                                : 'hover:bg-white/5 text-zinc-400'
                              }`}
                          >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedClient?.id === client.id
                                ? 'border-[#101010]'
                                : 'border-zinc-700'
                              }`}>
                              {selectedClient?.id === client.id && (
                                <div className="w-2.5 h-2.5 bg-[#101010] rounded-sm" />
                              )}
                            </div>
                            <span className="font-semibold text-lg">{client.name}</span>
                          </div>
                        ))}

                        <button className="w-full flex items-center gap-4 px-5 py-4 text-[#E5D5B8] hover:bg-[#E5D5B8]/5 transition-all rounded-xl mt-2 border-t border-zinc-800/50 pt-6">
                          <div className="w-6 h-6 rounded border border-[#E5D5B8]/40 flex items-center justify-center bg-[#E5D5B8]/10">
                            <Plus size={16} />
                          </div>
                          <span className="font-semibold text-lg">Create New Client</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            /* Client Details View */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative">
                  <div className="absolute -top-3 left-4 z-10 px-2 bg-[#0A0A0A]">
                    <span className="text-xs text-zinc-400 font-medium">Client Name*</span>
                  </div>
                  <Input 
                    value={clientName} 
                    onChange={(e) => setClientName(e.target.value)}
                    className="h-16 bg-transparent border-zinc-800 rounded-xl focus:border-[#E5D5B8]/50 transition-all pl-6"
                  />
                </div>
                <div className="relative">
                  <div className="absolute -top-3 left-4 z-10 px-2 bg-[#0A0A0A]">
                    <span className="text-xs text-zinc-400 font-medium">Email ID*</span>
                  </div>
                  <Input 
                    value={emailId} 
                    onChange={(e) => setEmailId(e.target.value)}
                    className="h-16 bg-transparent border-zinc-800 rounded-xl focus:border-[#E5D5B8]/50 transition-all pl-6"
                  />
                </div>
                <div className="relative">
                  <div className="absolute -top-3 left-4 z-10 px-2 bg-[#0A0A0A]">
                    <span className="text-xs text-zinc-400 font-medium">Phone Number*</span>
                  </div>
                  <Input 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-16 bg-transparent border-zinc-800 rounded-xl focus:border-[#E5D5B8]/50 transition-all pl-6"
                  />
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-3 left-4 z-10 px-2 bg-[#0A0A0A]">
                  <span className="text-xs text-zinc-400 font-medium">Address*</span>
                </div>
                <Input 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="567 Mission Street, San Francisco, CA 94105"
                  className="h-16 bg-transparent border-zinc-800 rounded-xl focus:border-[#E5D5B8]/50 transition-all pl-6"
                />
              </div>

              <div className="relative">
                <div className="absolute -top-3 left-4 z-10 px-2 bg-[#0A0A0A]">
                  <span className="text-xs text-zinc-400 font-medium">Project Description*</span>
                </div>
                <Textarea 
                  value={projectDescription} 
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe the project scope and requirements....."
                  className="min-h-[120px] bg-transparent border-zinc-800 rounded-xl focus:border-[#E5D5B8]/50 transition-all p-6 pt-8"
                />
              </div>

              <div className="pt-4">
                <h3 className="text-xl font-semibold mb-6">Quote Validity</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[3, 5, 7].map((days: number) => (
                    <button
                      key={days}
                      onClick={() => handleValiditySelect(days)}
                      className={`h-14 rounded-xl font-semibold transition-all border ${
                        validityDays === days 
                        ? 'bg-[#E5D5B8]/10 border-[#E5D5B8]/40 text-[#E5D5B8]' 
                        : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                  <button
                    onClick={() => handleValiditySelect('custom')}
                    className={`h-14 rounded-xl font-semibold transition-all border ${
                      validityDays === 'custom' 
                      ? 'bg-[#E5D5B8]/10 border-[#E5D5B8]/40 text-[#E5D5B8]' 
                      : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    Add Custom Date
                  </button>
                </div>
                
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-8">
                  <Check size={16} className="text-[#E5D5B8]" />
                  <span className="text-[#E5D5B8]/80 font-medium">This quote is valid for {validityDays === 'custom' ? 'X' : validityDays} days from today.</span>
                </div>

                <div className="relative">
                  <div className="absolute -top-3 left-4 z-10 px-2 bg-[#0A0A0A]">
                    <span className="text-xs text-zinc-400 font-medium tracking-wide">Quote Valid Until*</span>
                  </div>
                  <div className="relative">
                    <Input 
                      ref={validUntilInputRef}
                      type={validityDays === 'custom' ? 'date' : 'text'}
                      value={validityDays === 'custom' ? validUntil : formattedValidUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      placeholder="DD-MM-YYYY"
                      readOnly={validityDays !== 'custom'}
                      className={`h-16 border-zinc-800 rounded-xl transition-all pl-6 pr-14 text-white font-medium ${
                        validityDays === 'custom'
                          ? 'bg-transparent focus:border-[#E5D5B8]/50'
                          : 'bg-zinc-900/40 text-zinc-500 cursor-not-allowed'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (validityDays !== 'custom') return;
                        validUntilInputRef.current?.showPicker?.();
                        validUntilInputRef.current?.focus();
                      }}
                      className={`absolute right-6 top-1/2 -translate-y-1/2 text-zinc-500 ${
                        validityDays === 'custom' ? 'cursor-pointer hover:text-[#E5D5B8]' : 'cursor-not-allowed'
                      }`}
                    >
                      <Calendar size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center mt-12 pb-10">
          <div className="flex gap-5">
            <Button
              variant="outline"
              className="border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800 h-16 px-12 rounded-2xl text-xl font-bold bg-transparent transition-all"
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              className={`${(view === 'selection' ? selectedClient : clientName) ? 'bg-[#E5D5B8] text-black shadow-[0_0_20px_rgba(229,213,184,0.3)]' : 'bg-[#2A2B2D] text-zinc-600'} hover:opacity-90 h-16 px-16 rounded-2xl text-xl font-bold transition-all`}
              disabled={!(view === 'selection' ? selectedClient : clientName)}
              onClick={handleContinue}
            >
              Continue
            </Button>
          </div>

          <Button className="bg-white text-black hover:bg-zinc-200 h-16 px-10 rounded-2xl flex items-center gap-4 text-xl font-bold transition-all group shadow-lg">
            <div className="flex items-center justify-center">
              <svg 
                className="w-6 h-6 group-hover:scale-110 transition-transform" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
            </div>
            Save as Draft
          </Button>
        </div>
      </div>
    </div>
  );
}
