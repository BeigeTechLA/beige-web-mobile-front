"use client";

import React from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { ArrowLeft, } from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/admin/Topbar";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import QuotesOverdueWidget from "@/components/admin/quotes/QuotesOverdue";
import OpenPipelineWidget from "@/components/admin/quotes/OpenPipeline";
import ConversionPerformanceWidget from "@/components/admin/quotes/ConversionPerformance";
import QuotePerformanceWidget from "@/components/admin/quotes/QuotePerformance";
import { DealColumn, DealColumnData } from "@/components/admin/quotes/DealColumn";
import Image from "next/image";

const DUMMY_DEAL_COLUMN: DealColumnData = {
  title: "Deal Won",
  count: 12,
  deals: [
    {
      id: "1",
      initials: "EC",
      name: "Ethan Carter",
      quoteId: "QT-01",
      email: "ethan155@gmail.com",
      status: "Accepted",
      project: "Corporate video pro...",
      bookingStatus: "Converted to Booking",
      amount: "$13,475.70",
      paid: "$10,475.70",
      pending: "$3000.00",
      validity: "April 15, 2026",
    },
    {
      id: "2",
      initials: "EC",
      name: "Ethan Carter",
      quoteId: "QT-01",
      email: "ethan155@gmail.com",
      status: "Accepted",
      project: "Corporate video pro...",
      bookingStatus: "Converted to Booking",
      amount: "$13,475.70",
      paid: "$10,475.70",
      pending: "$3000.00",
      validity: "April 15, 2026",
    },
    {
      id: "3",
      initials: "EC",
      name: "Ethan Carter",
      quoteId: "QT-01",
      email: "ethan155@gmail.com",
      status: "Accepted",
      project: "Corporate video pro...",
      bookingStatus: "Converted to Booking",
      amount: "$13,475.70",
      paid: "$10,475.70",
      pending: "$3000.00",
      validity: "April 15, 2026",
    },
    {
      id: "4",
      initials: "EC",
      name: "Ethan Carter",
      quoteId: "QT-01",
      email: "ethan155@gmail.com",
      status: "Accepted",
      project: "Corporate video pro...",
      bookingStatus: "Converted to Booking",
      amount: "$13,475.70",
      paid: "$10,475.70",
      pending: "$3000.00",
      validity: "April 15, 2026",
    },
  ],
};

const DUMMY_DEAL_Overdue: DealColumnData = {
  title: "Deal Won",
  count: 1,
  deals: [
    {
      id: "1",
      initials: "EC",
      name: "Ethan Carter",
      quoteId: "QT-01",
      email: "ethan155@gmail.com",
      status: "Accepted",
      project: "Corporate video pro...",
      bookingStatus: "Converted to Booking",
      amount: "$13,475.70",
      paid: "$10,475.70",
      pending: "$3000.00",
      validity: "April 15, 2026",
    },
  ],
};

export default function QuoteSalesRepDetailsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useResolvedTheme();

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{ create: "Master Pricing" }}
      />

      <div
        className="overflow-hidden p-4 pb-20 lg:p-6 lg:px-10 lg:py-9 space-y-6"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex items-start lg:items-center gap-4 min-w-0">
          <button
            onClick={() => router.back()}
            className={`transition-colors flex items-center gap-2 ${isDark ? "text-white hover:text-[#E0E0E0]" : "text-black hover:text-black/70"}`}
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

        </div>
        <div className={`flex items-center gap-4 p-3 lg:p-5 border rounded-lg lg:rounded-2xl ${isDark ? "border-[#3D3D3D] bg-[#101010]" : "bg-black/5 border-black/20"}`}>
          <div className="relative h-15 w-15 lg:h-21 lg:w-21 rounded-lg">
            <Image
              src="/images/crew/CREW(5).png"
              alt="John Smith"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <p className="text-base lg:text-xl font-medium">John Smith</p>
        </div>

        <div className="space-y-3 lg:space-y-6">
          <div className="w-full flex flex-col lg:flex-row gap-5">
            <div className="w-full lg:w-3/5 h-full">
              <QuotePerformanceWidget />
            </div>
            <div className="w-full lg:w-2/5 h-full">
              <ConversionPerformanceWidget />
            </div>
          </div>
          <div>
            <OpenPipelineWidget />
          </div>
          <div>
            <QuotesOverdueWidget />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-6">
            <DealColumn data={DUMMY_DEAL_COLUMN} isDark={isDark} />
            <DealColumn data={DUMMY_DEAL_Overdue} isDark={isDark} />
          </div>
        </div>

        {/* --- FLOATING MOBILE BUTTON PANEL --- */}
        {/* <div className={`lg:hidden w-full fixed flex items-center justify-center gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] transition-colors duration-100 ${isDark ? "bg-[#0f0f0f]" : "bg-white"}`}>

        </div> */}
      </div>
    </>
  );
}
