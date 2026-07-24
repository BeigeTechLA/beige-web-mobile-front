"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from "next/navigation";
import { CreativePartnersTable } from '@/components/admin/users/CreativePartnersTable';
import Topbar from "@/components/admin/Topbar";
import { ArrowUpToLine, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DatePicker from "@/components/ui/Datepicker";
import { useTheme } from 'next-themes';
import { usePermissions } from "@/lib/hooks/usePermissions";
import { startOfDay } from 'date-fns';

export default function CreativePartnersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { canCreate } = usePermissions("shoots");

  useEffect(() => setMounted(true), []);
  const isDark = !mounted || theme === "dark";

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <>
            {/* Need to add search bar, filters  */}
            {/* <Button className={`text-sm font-semibold h-12 px-4 lg:px-7 rounded-lg ${isDark ? "text-white bg-[#202020] border-white/20 hover:bg-white/10" : "text-[#323232] bg-[#F0F0F0] border-[#E3E3E3] hover:bg-[#E3E3E3]"} border transition-colors `}>
                            <ArrowUpToLine /> Export
                        </Button> */}
            <Button
              onClick={() => router.push("/book-a-shoot")}
              disabled={!canCreate}
              title={canCreate ? "Book a Shoot" : "Create permission not allowed"}
              className="bg-[#E5D5B8] text-black h-12 px-4 lg:px-7"
            >
              Book a Shoot
            </Button>
          </>
        }
      />

      <div className="overflow-hidden p-4 pb-30 lg:px-10 lg:py-9 space-y-4 lg:space-y-8">
        <CreativePartnersTable />

        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#101010]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={() => router.push("/book-a-shoot")}
            disabled={!canCreate}
            title={canCreate ? "Book a Shoot" : "Create permission not allowed"}
            className="bg-[#E8D1AB] text-sm font-medium text-black h-14 px-4 lg:px-7 w-full"
          >
            Book a Shoot
          </Button>
        </div>
      </div>
    </>
  );
}