"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BasicDropdown } from "@/components/admin/BasicDropdown";
import { Search, SlidersHorizontal, ChevronDown, Pen, ArrowLeft } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/redux/hooks";
import { useTheme } from "next-themes";
import { TabsSwitcher } from "@/components/admin/TabsSwitcher";
import Topbar from "@/components/admin/Topbar";
import { usePermissions } from "@/lib/hooks/usePermissions";
import GeneralAgreementHistoryTable from "@/components/admin/agreements/AgreementsTable";

type TabType = "All" | "Pending" | "Accepted" | "Rejected" | "Cancelled";

const SALES_REP_PRESERVE_KEY = "sales_rep_preserve_key";

const tabs: { label: string; value: TabType }[] = [
  { label: "All", value: "All" },
  { label: "Pending", value: "Pending" },
  { label: "Accepted", value: "Accepted" },
  { label: "Rejected", value: "Rejected" },
  { label: "Cancelled", value: "Cancelled" },
];

const normalizeStatusValue = (value: unknown): string =>
  String(value || "")
    .replace(/\u2013|\u2014/g, "-")
    .trim()
    .toLowerCase();

const isClosedLostStatus = (value: unknown): boolean => {
  const normalized = normalizeStatusValue(value);
  return normalized.includes("closed - lost") || normalized === "cancelled";
};

export default function AdminSaleRepManagerPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();
  const { token } = useAppSelector((state: any) => state.auth);
  const [mounted, setMounted] = useState(false);
  const { canCreate } = usePermissions("admin_sales_representative_dashboard");

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [activeTab, setActiveTab] = useState<TabType>("All");

  const [, setLeadsCurrentPage] = useState(1);
  const [, setUsersCurrentPage] = useState(1);
  const [showBookingGridFilters, setShowBookingGridFilters] = useState(false);

  // Filters state
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [cpFilter, setCpFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [agreementVersionFilter, setAgreementVersionFilter] = useState<string>("");
  const [adminFilter, setAdminFilter] = useState<string>("");

  const [menuAnchor, setMenuAnchor] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    client: string,
    id: number | string,
    bookingStatus?: string | null,
  ) => {
    e.stopPropagation();
    if (isClosedLostStatus(bookingStatus)) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const menuHeight = 150;
    const horizontalGap = 8;
    const viewportPadding = 12;
    const centeredY = rect.top + rect.height / 2 - menuHeight / 2;

    setMenuAnchor({
      x: Math.max(viewportPadding, rect.left - menuWidth - horizontalGap),
      y: Math.max(
        viewportPadding,
        Math.min(centeredY, window.innerHeight - menuHeight - viewportPadding)
      ),
    });
  };

  const handleRowClick = (leadId: number) => {
    window.sessionStorage.setItem(SALES_REP_PRESERVE_KEY, "true");
    router.push(`/admin/sales-representative/${leadId}`);
  };

  if (!mounted) return null;

  return (
    <>
      <Topbar pathname={pathname}
        actions={
          <>
            <Button
              onClick={() => router.push("/admin/sales-representative/create-new-deal")}
              disabled={!canCreate}
              title={canCreate ? "Create New Lead" : "Create permission not allowed"}
              className={`h-12 px-4 lg:px-7 transition-colors font-medium ${isDark ? "bg-[#E5D5B8] text-black hover:bg-[#D4C3A3]" : "bg-[#E8D1AB] text-black hover:bg-[#D9C19A]"
                }`}
            >
              Create General Agreement
            </Button>
          </>
        }
      />

      <div className={`overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 font-sans mb-20 transition-colors ${isDark ? "text-white" : "text-black"}`}>
        <Button
          onClick={() => router.back()}
          className={`transition-colors flex items-center gap-2 mb-5 p-0 ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/70"}`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back</span>
        </Button>

        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start w-full">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors ${isDark ? "text-white" : "text-black"}`}>
              Create General Agreement
            </h1>
            <p className={`text-xs lg:text-sm transition-colors ${isDark ? "text-white/70" : "text-black/60"}`}>
              Define the agreement details and add the sections that make up your agreement.
            </p>
          </div>
        </div>

        <div
          className={`border rounded-lg p-4 lg:px-6 w-full transition-colors duration-300 mt-5 lg:mt-9 flex flex-col lg:flex-row lg:justify-between ${
            isDark
            ? "bg-[#0E0E0D] border-[#252523] text-white"
            : "bg-white border-[#E5E5E5] text-[#202020]"
            }`}
        >
          Agreements Details
        </div>

      
        {/* Floating Mobile Button */}
        <div
          className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${
            isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"
          }`}
        >
          <Button
            onClick={() => router.push("/admin/sales-representative/create-new-deal")}
            disabled={!canCreate}
            title={canCreate ? "Create New Lead" : "Create permission not allowed"}
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform"
          >
            Save & Send
          </Button>
        </div>
      </div>
    </>
  );
}