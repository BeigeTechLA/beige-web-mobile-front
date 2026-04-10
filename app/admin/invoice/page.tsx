"use client";
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from 'next/navigation';
import Topbar from "@/components/admin/Topbar";
import { InvoiceTable } from "@/components/admin/InvoiceTable";

export default function InvoicePage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const pathname = usePathname();

  // Constant default to dark
  const isDark = !mounted || theme === "dark";

  return (
    <>
      <Topbar pathname={pathname}
        
      />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
        {/* Header */}
        <div className="flex justify-between items-start lg:items-end">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"
              }`}>Invoice History</h1>
           {  <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"
              }`}>keep track of your billing history.</p> }
          </div>
          {/* <SortDateButton
            selectedDate={selectedDate}
            onDateChange={handleDateSort}
          /> */}
        </div>

        {/* <DottedDivider className="my-0" />  */}

        <InvoiceTable />
      </div>
    </>
  );
}
