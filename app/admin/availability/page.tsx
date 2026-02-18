"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { AvailabilityTable } from '@/components/admin/availability/AvailabilityTable';

import { Button } from "@/components/ui/button";
import Topbar from "@/components/admin/Topbar";
import { ArrowUpToLine } from "lucide-react";

export default function AvailabilityPage() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <Topbar pathname={pathname}
        actions={
          // more filters and search components to be added here
          <Button className="text-sm font-semibold text-white h-12 px-4 lg:px-7 rounded-lg bg-[#202020] border border-white/20 hover:bg-white/10 transition-colors ">
            <ArrowUpToLine /> Export
          </Button>
        }
      />
      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-6">
        <AvailabilityTable />
      </div>
    </>
  );
}
