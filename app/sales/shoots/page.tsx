"use client";
import React, { useState } from 'react';
import SalesShootsTable from '@/components/sales/SalesShootsTable';
import { Calendar } from 'lucide-react';
import { SortDateButton } from '@/components/admin/SortDateButton';

export default function SalesShootsPage() {
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
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-lg lg:text-[32px] font-semibold text-white mb-2 leading-none">Shoots Management</h1>
          <p className="text-[#888888] text-sm lg:text-base leading-none">Track and manage your photography and videography project</p>
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

      <SalesShootsTable externalSelectedDate={selectedDate} />

    </div>
  );
}
