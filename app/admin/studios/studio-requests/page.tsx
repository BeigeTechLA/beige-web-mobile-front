"use client"
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import DottedDivider from "@/components/admin/DottedDivider";
import { SortDateButton } from "@/components/admin/SortDateButton";
import Topbar from "@/components/admin/Topbar";
import StudioRequestsTable from "@/components/admin/studios/StudioRequestsTable";
import StudiosTabs from "@/components/admin/studios/StudiosTabs";
import { Button } from "@/components/ui/button";

export default function StudioRequestsPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <>
            <div className={`relative hidden h-11 w-[360px] xl:block ${isDark ? "text-white/40" : "text-black/40"}`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} />
              <input
                type="text"
                placeholder="Search Studio by name or shoot..."
                className={`h-full w-full rounded-lg border pl-10 pr-4 text-sm outline-none transition-colors ${isDark ? "border-white/10 bg-[#171717] text-white placeholder:text-white/35" : "border-black/10 bg-[#F4F5F7] text-[#101010] placeholder:text-black/35"}`}
              />
            </div>
            <button className={`hidden h-11 items-center gap-2 rounded-lg border px-4 text-sm lg:flex ${isDark ? "border-white/10 bg-[#171717] text-white/80" : "border-black/10 bg-[#F4F5F7] text-black/70"}`}>
              All Status
              <ChevronDown size={16} />
            </button>
            <button className={`hidden h-11 items-center gap-2 rounded-lg border px-4 text-sm lg:flex ${isDark ? "border-white/10 bg-[#171717] text-white/80" : "border-black/10 bg-[#F4F5F7] text-black/70"}`}>
              <ArrowUpRight size={16} />
              Export
            </button>
            <Button
              className="h-11 bg-[#E5D5B8] text-sm font-medium text-black hover:bg-[#d8c5a2]"
              onClick={() => router.push("/admin/studios/add")}
            >
              Create or Add Studio
            </Button>
          </>
        }
      />

      <main className="overflow-hidden p-4 lg:px-10 lg:py-9">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className={`mb-1 text-lg font-semibold lg:text-2xl ${isDark ? "text-white" : "text-[#101010]"}`}>
              Studio Management
            </h1>
            <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/60"}`}>
              Manage availability, bookings, and studio operations in one place.
            </p>
          </div>
          <SortDateButton selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        <DottedDivider />
        <StudiosTabs />
        <StudioRequestsTable />
      </main>
    </>
  );
}
