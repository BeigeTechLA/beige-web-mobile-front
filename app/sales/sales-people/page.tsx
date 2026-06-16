"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import Topbar from "@/components/sales/Topbar";
import SalesPeoplePanel from "@/components/admin/sales-representative/SalesPeoplePanel";
import { salesApi as salesService } from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";
import { useRequireModulePermission } from "@/lib/hooks/useRequireModulePermission";

type SalesPersonData = {
  id: number | string;
  name: string;
  email: string;
  user_type?: number | string;
  status?: string;
  is_active?: number | boolean;
};

export default function SalesPeoplePage() {
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const { token } = useAppSelector((state) => state.auth);
  const { allowed, isLoading: isPermissionLoading } = useRequireModulePermission(
    "sales_representative",
    "view",
    "/sales/dashboard",
  );
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [salesPeople, setSalesPeople] = useState<SalesPersonData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!token || !allowed) {
      setSalesPeople([]);
      setLoading(false);
      return;
    }

    const fetchSalesPeople = async () => {
      setLoading(true);
      try {
        const result = await salesService.getSalesReps({ includeInactive: true });
        if (result?.success && Array.isArray(result.data)) {
          setSalesPeople(result.data);
        } else {
          setSalesPeople([]);
        }
      } catch (error) {
        console.error("Failed to fetch sales people:", error);
        setSalesPeople([]);
        toast.error("Failed to load sales people");
      } finally {
        setLoading(false);
      }
    };

    void fetchSalesPeople();
  }, [allowed, token]);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  if (!mounted || isPermissionLoading || !allowed) return null;

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <div className="relative flex-1 max-w-lg">
            <Search className={`absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 w-3 lg:w-4 h-3 lg:h-4 transition-colors ${isDark ? "text-white/40" : "text-black/40"}`} />
            <input
              type="text"
              placeholder="Search sales people..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={`w-full pl-8 lg:pl-10 pr-4 py-2 lg:py-2.5 rounded-lg border text-sm transition-colors ${isDark ? "bg-[#202020] border-white/10 text-white placeholder:text-white/40" : "bg-white border-[#E3E3E3] text-black placeholder:text-black/40"}`}
            />
          </div>
        }
      />

      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 space-y-6">
        <div>
          <h1 className={`text-lg lg:text-2xl font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}>
            Sales People
          </h1>
          <p className={`text-xs lg:text-sm ${isDark ? "text-white/70" : "text-black/60"}`}>
            View all sales representatives and inspect their status activity.
          </p>
        </div>

        <SalesPeoplePanel
          salesPeople={salesPeople}
          loading={loading}
          searchQuery={searchQuery}
          isDark={isDark}
          detailBasePath="/sales/sales-people"
        />
      </div>
    </>
  );
}
