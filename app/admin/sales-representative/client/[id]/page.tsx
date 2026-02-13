"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { IntentBadge } from "@/components/sales/IntentBadge";
import DottedDivider from "@/components/admin/DottedDivider";
import { UpdateLeadIntentModal } from "@/components/sales/UpdateLeadIntent"; // Adjust path as needed

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  // Modal State Handling
  const [isIntentModalOpen, setIsIntentModalOpen] = useState(false);

  const handleSaveIntent = (intent: string, notes: string) => {
    // Integrate with your API here
    console.log("Saving Intent:", { leadId, intent, notes });

    toast.success(`Lead intent updated to ${intent}`);
    setIsIntentModalOpen(false);
  };

  return (
    <div className="text-white font-sans">
      {/* Back Button */}
      <Button
        onClick={() => router.back()}
        className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-5 p-0"
      >
        <ArrowLeft size={24} />
        <span className="text-sm font-medium">Back</span>
      </Button>

      <div className="">
        {/* Client Informatio  */}
        <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl">
          <div className="flex flex-col lg:flex-row gap-2 lg:justify-between lg:items-center p-5 lg:p-9 !pb-0">
            <h2 className="lg:text-[22px] font-medium text-white">
              Client Information
            </h2>
            <div className="flex gap-4">
              <Button
                className="h-12 w-full bg-[#202020] hover:bg-[#D4C3A3]/5 border border-white/20 text-[#E8D1AB] font-semibold py-3.5 rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setIsIntentModalOpen(true)}
              >
                Update Intent
              </Button>
              <Button
                className="h-12 w-full bg-[#E8D1AB] hover:bg-[#D4C3A3] text-[#101010] font-semibold py-3.5 rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => { console.log("Create Booking") }}
              >
                Create Booking
              </Button>
            </div>
          </div>

          <DottedDivider />

          <div className="flex flex-col gap-3 lg:gap-6 px-5 lg:px-9">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-5">
                <div className="w-13 h-13 lg:w-[84px] lg:h-[84px] rounded-lg lg:rounded-2xl bg-[#FFF6D9] text-[#000000] border border-[#FFF6D9] flex items-center justify-center text-xl lg:text-[30px] font-semibold shrink-0">
                  {/* {initials} */}
                  IN
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <h1 className="lg:text-[22px] font-semibold">
                      {/* {clientName} */}
                      Client Name
                    </h1>
                    <IntentBadge intent={"Hot"} />
                  </div>
                  <div className="text-sm text-[#AAA7A7]">
                    Description : <span className="text-[#D0D0D0]">{"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}</span>
                  </div>
                </div>
              </div>

            </div>
            <div className="flex flex-col lg:flex-row flex-wrap gap-3 lg:gap-y-4 lg:gap-x-8 text-sm text-[#AAA7A7]">
              <p>
                User ID : <span className="text-white">#12345</span>
              </p>
              <div className="w-[1px] h-4 bg-white hidden md:block" />
              <p>
                Email ID : <span className="text-white">email</span>
              </p>
              <div className="w-[1px] h-4 bg-white hidden md:block" />
              <p>
                Phone Number : <span className="text-white">phone</span>
              </p>
              <div className="w-[1px] h-4 bg-white hidden md:block" />
              <p>
                Signup Date : <span className="text-[#E8D1AB]">12 February, 2026</span>
              </p>
            </div>
            <div className="flex flex-col lg:flex-row flex-wrap gap-3 lg:gap-y-4 lg:gap-x-8 text-sm text-[#AAA7A7]">
              <p>
                Location : <span className="text-white">{"1234 Mockingbird Lane Sample City, CA 90000 United States"}</span>
              </p>
            </div>
          </div>

          <DottedDivider />

          <div className="flex flex-col gap-3 p-5 lg:p-9 !pt-0">
            <p className="lg:text-lg font-semibold text-white">Notes</p>
            <p className="text-sm text-[#A2A2A2] bg-[#101010] rounded-lg p-4">
              Interested in corporate event photography. Mentioned budget of $5k. Follow up scheduled for next week.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Integration */}
      <UpdateLeadIntentModal
        isOpen={isIntentModalOpen}
        onClose={() => setIsIntentModalOpen(false)}
        onSave={handleSaveIntent}
        currentIntent="Hot" // Pass the current intent from your data
      />
    </div>
  );
}
