"use client";
import React, { useState } from 'react';
import { ShootsTable } from '@/components/admin/ShootsTable';
import { Calendar } from 'lucide-react';
import { SortDateButton } from '@/components/admin/SortDateButton';
import { Button } from '@/src/components/landing/ui/button';
import { useRouter } from 'next/navigation';

export default function ShootsPage() {
  const router = useRouter()
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
    <div className="space-y-4 lg:space-y-8" style={{ fontFamily: 'var(--font-instrument-sans)' }}>
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

      {/* Divider */}
      <div
        className="h-[1px] w-full my-4 lg:my-9"
        style={{
          backgroundImage: `linear-gradient(to right, #3f3f46 50%, transparent 50%)`,
          backgroundSize: '30px 1px',
          backgroundRepeat: 'repeat-x'
        }}
      />

      <ShootsTable externalSelectedDate={selectedDate} />

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
  );
}
