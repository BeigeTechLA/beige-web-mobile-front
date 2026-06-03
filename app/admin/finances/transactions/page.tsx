"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { ArrowUpToLine } from "lucide-react";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import { Button } from "@/src/components/landing/ui/button";
import TransactionIdTable from "@/components/admin/finances/TransactionIdTable";
import ShootIdTable from "@/components/admin/finances/ShootIdTable";
import DottedDivider from "@/components/admin/DottedDivider";

export default function AdminTransactionsPage() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<"Transactions ID" | "Shoot ID">("Transactions ID");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <Button className="text-sm font-semibold text-white h-12 px-4 lg:px-7 rounded-lg bg-[#202020] border border-white/20 hover:bg-white/10 transition-colors">
            <ArrowUpToLine /> Export
          </Button>
        }
      />

      <div
        className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-4 lg:space-y-8"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex justify-between items-start lg:items-end gap-4">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
              Transactions
            </h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              Manage your transactions, and payment history
            </p>
          </div>
          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        <DottedDivider />

        <div
          className={`flex items-center gap-1 p-1 rounded-xl w-fit border transition-colors ${
            isDark ? "bg-[#111] border-[#333]" : "bg-[#F0F0F0] border-[#E3E3E3]"
          }`}
        >
          {(["Transactions ID", "Shoot ID"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setView(option)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                view === option
                  ? "bg-[#E5D5B8] text-black shadow-lg"
                  : isDark
                  ? "text-[#777] hover:text-white"
                  : "text-[#666] hover:text-black"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {view === "Transactions ID" ? (
          <TransactionIdTable selectedDate={selectedDate} />
        ) : (
          <ShootIdTable selectedDate={selectedDate} />
        )}
      </div>
    </>
  );
}
