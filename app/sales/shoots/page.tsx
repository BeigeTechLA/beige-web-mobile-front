"use client";
import React, { useState } from 'react';
import { ShootsTable } from '@/components/admin/ShootsTable';
import { ArrowUpToLine } from 'lucide-react';
import { SortDateButton } from '@/components/admin/SortDateButton';
import { Button } from '@/src/components/landing/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import Topbar from "@/components/admin/Topbar";

export default function SalesShootsPage() {
  const router = useRouter()
  const pathname = usePathname();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateSort = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      console.log(date);
    } else {
      console.log("unfiltered");
    }
  };

  return (
    <>
      <Topbar pathname={pathname}
        actions={
          <>
            {/* Need to add search bar, filters  */}
            <Button className="text-sm font-semibold text-white h-12 px-4 lg:px-7 rounded-lg bg-[#202020] border border-white/20 hover:bg-white/10 transition-colors ">
              <ArrowUpToLine /> Export
            </Button>
            <Button onClick={() => router.push("/book-a-shoot")} className="bg-[#E5D5B8] text-black h-12 px-4 lg:px-7">
              Book a Shoot
            </Button>
          </>
        }
      />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
        {/* Header */}
        <div className="flex justify-between items-start lg:items-end">
          <div>
            <h1 className="text-lg lg:text-[32px] font-semibold text-white mb-2 leading-none">Shoots Management</h1>
            <p className="text-[#888888] text-xs lg:text-base leading-none">Track and manage your photography and videography project</p>
          </div>
          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={handleDateSort}
          />
        </div>

        {/* <DottedDivider /> */}

        <ShootsTable
          externalSelectedDate={selectedDate}
          detailBasePath="/sales/shoots"
          enablePriceSort={false}
        />

        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className="lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 z-[40] bg-[#0f0f0f]">
          <Button
            onClick={() => router.push('/book-a-shoot')}
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            Book a Shoot
          </Button>
        </div>
      </div>
    </>
  );
}
