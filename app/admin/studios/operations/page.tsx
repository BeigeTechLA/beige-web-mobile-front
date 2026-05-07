"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Topbar from "@/components/admin/Topbar";
import DottedDivider from "@/components/admin/DottedDivider";
import { SortDateButton } from "@/components/admin/SortDateButton";
import StudiosTabs from "@/components/admin/studios/StudiosTabs";
import StudioOperationsDashboard from "@/components/admin/studios/operations/StudioOperationsDashboard";
import { Button } from "@/components/ui/button";

export default function StudioOperationsPage() {
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
          <Button
            className="bg-[#E5D5B8] text-sm font-medium text-black hover:bg-[#d8c5a2]"
            onClick={() => router.push("/admin/studios/add")}
          >
            Create or Add Studio
          </Button>
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
        <StudioOperationsDashboard selectedDate={selectedDate} />
      </main>
    </>
  );
}
