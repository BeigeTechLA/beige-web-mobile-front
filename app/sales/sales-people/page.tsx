"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import Topbar from "@/components/sales/Topbar";
import SalesPeoplePanel from "@/components/admin/sales-representative/SalesPeoplePanel";
import { salesApi as salesService } from "@/lib/api";
import { useAppSelector } from "@/lib/redux/hooks";

type SalesPersonData = {
  id: number | string;
  name: string;
  email: string;
  user_type?: number | string;
  status?: string;
  is_active?: number | boolean;
};

const canAccessSalesPeoplePage = (user: Record<string, unknown> | null) => {
  if (!user) return false;

  return Number(user.user_type_id ?? user.userTypeId) === 7;
};

export default function SalesPeoplePage() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const { token } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [canViewPage, setCanViewPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [salesPeople, setSalesPeople] = useState<SalesPersonData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const storedUser = localStorage.getItem("revure_user");
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const hasAccess = canAccessSalesPeoplePage(parsedUser);

      setCanViewPage(hasAccess);

      if (!hasAccess) {
        router.replace("/sales/dashboard");
      }
    } catch (error) {
      console.error("Failed to read sales people page access state", error);
      router.replace("/sales/dashboard");
    }
  }, [router]);

  useEffect(() => {
    if (!token || !canViewPage) {
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
  }, [canViewPage, token]);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  if (!mounted || !canViewPage) return null;

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
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`h-12 w-full pl-6 lg:pl-9 pr-4 py-1.5 lg:py-2.5 border rounded-lg text-xs lg:text-sm transition-all focus:outline-none focus:ring-1 ${isDark
                ? "bg-[#18181b] border-white/10 text-white placeholder:text-white/40 focus:ring-[#E8D1AB]"
                : "bg-white border-black/10 text-black placeholder:text-black/40 focus:ring-[#E8D1AB]"
                }`}
            />
          </div>
        }
      />

      <div className={`min-h-screen pb-30 p-4 lg:p-6 lg:px-10 lg:py-9 transition-colors duration-300 ${isDark ? "bg-transparent" : "bg-[#F3F4F6]"}`}>
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start w-full">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors ${isDark ? "text-white" : "text-black"}`}>
              Sales People
            </h1>
            <p className={`text-xs lg:text-sm transition-colors ${isDark ? "text-white/70" : "text-black/60"}`}>
              View all sales people and inspect their status activity.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <SalesPeoplePanel
            salesPeople={salesPeople}
            loading={loading}
            searchQuery={searchQuery}
            isDark={isDark}
            detailBasePath="/sales/sales-people"
          />
        </div>
      </div>
    </>
  );
}
