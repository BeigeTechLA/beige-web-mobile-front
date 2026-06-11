"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpToLine, BadgeDollarSign, CircleDollarSign, Clock, Coins, Plus, Search, ShieldAlert, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";

import { Button } from "@/src/components/landing/ui/button";
import CPPayoutTable, { ShootCPRow } from "@/components/affiliate/CPPayoutTable";
import FinanceMetricCards from "@/components/affiliate/FinanceMetricCards";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { TabsSwitcher } from "@/components/admin/TabsSwitcher";

const metricDropdownOptions = ["Month", "Last 30 Days", "This Quarter", "This Year"];

const MOCK_SHOOT_DATA: ShootCPRow[] = [
  {
    id: "SHT-001",
    shootName: "Nike Summer Campaign",
    totalCP: 5,
    customerName: "Alex Mercer",
    customerEmail: "alex@mercer.com",
    shootBudget: 5000,
    cpPayout: 1200,
    margin: 18.5,
    status: "Approved",
    category: "videography",
    avatarImage: "",
    date: "2026-04-21T12:43:27.000Z"
  },
  {
    id: "SHT-002",
    shootName: "Cyberdyne Corporate Video",
    totalCP: 2,
    customerName: "Sarah Connor",
    customerEmail: "s.connor@cyberdyne.org",
    shootBudget: 3200,
    cpPayout: 850,
    margin: 23.50,
    status: "Pending",
    category: "photography",
    avatarImage: "",
    date: "2026-05-14T09:15:00.000Z"
  },
  {
    id: "SHT-003",
    shootName: "Wayne Manor Drone Coverage",
    totalCP: 3,
    customerName: "Bruce Wayne",
    customerEmail: "bruce@waynecorp.com",
    shootBudget: 12000,
    cpPayout: 3000,
    margin: 9.00,
    status: "Finance Approval",
    category: "videography",
    avatarImage: "",
    date: "2026-06-02T16:30:12.000Z"
  },
  {
    id: "SHT-004",
    shootName: "Oscorp Bio-Tech Interview",
    totalCP: 4,
    customerName: "Norman Osborn",
    customerEmail: "norman@oscorp.com",
    shootBudget: 2500,
    cpPayout: 700,
    margin: 11.00,
    status: "Fully Paid",
    category: "photography",
    avatarImage: "",
    date: "2026-06-10T11:05:45.000Z"
  },
];

const MOCK_CREATORS_DATA: ShootCPRow[] = [
  {
    id: "pay-001",
    shootId: "SHT-2026-8801",
    shootName: "Summer Solstice Campaign",
    creatorName: "Aarav Vardhan",
    creatorRoles: ["Lead Videographer", "Drone Operator"],
    customerName: "Vogue India",
    customerEmail: "finance@vogue.in",
    avatarImage: "",
    category: "videography",
    shootBudget: 12500,
    cpPayout: 2400,
    margin: 18,
    status: "Approved",
    date: "2026-06-15T10:00:00.000Z",
  },
  {
    id: "pay-002",
    shootId: "SHT-2026-4412",
    shootName: "Beige Aesthetics Launch",
    creatorName: "Elena Rostova",
    creatorRoles: ["Creative Director", "Fashion Photographer"],
    customerName: "Beige OS",
    customerEmail: "billing@beige.ai",
    avatarImage: "",
    category: "photography",
    shootBudget: 8500,
    cpPayout: 1850,
    margin: 22,
    status: "Fully Paid",
    date: "2026-06-08T14:30:00.000Z",
  },
  {
    id: "pay-003",
    shootId: "SHT-2026-1099",
    shootName: "Airbox Wireless Pro Commercial",
    creatorName: "Marcus Chen",
    creatorRoles: ["Colorist", "Editor"],
    customerName: "Airbox Tech",
    customerEmail: "ops@airbox.com",
    avatarImage:  "",
    category: "videography",
    shootBudget: 24000,
    cpPayout: 4200,
    margin: 14,
    status: "Partially Paid",
    date: "2026-06-20T09:15:00.000Z",
  },
  {
    id: "pay-004",
    shootId: "SHT-2026-3115",
    shootName: "Revurge Core Apparel Shoot",
    creatorName: "Sarah Jenkins",
    creatorRoles: ["Product Photographer"],
    customerName: "Revurge Fitness",
    customerEmail: "campaigns@revurge.io",
    avatarImage:  "",
    category: "photography",
    shootBudget: 6000,
    cpPayout: 950,
    margin: 30,
    status: "Pending",
    date: "2026-06-11T11:00:00.000Z",
  },
  {
    id: "pay-005",
    shootId: "SHT-2026-9052",
    shootName: "Ayurvedic Baby Care Pitch Film",
    creatorName: "Rohan Das",
    creatorRoles: ["Grip", "Lighting Assist"],
    customerName: "Nurture Roots Co.",
    customerEmail: "accounts@nurtureroots.in",
    avatarImage: "",
    category: "videography",
    shootBudget: 9800,
    cpPayout: 1100,
    margin: 16,
    status: "Finance Approval",
    date: "2026-05-28T16:00:00.000Z",
  }
];

type TabType = "shoots" | "creators";

const tabs: { label: string; value: TabType }[] = [
  { label: "Shoots", value: "shoots" },
  { label: "Creators", value: "creators" },
];

export default function AdminFinancesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useResolvedTheme();

  const [tableData, setTableData] = useState<ShootCPRow[]>(MOCK_SHOOT_DATA);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeMetricId, setActiveMetricId] = useState("available");
  const [metricRange, setMetricRange] = useState("Month");
  const [dataType, setDataType] = useState<TabType>("shoots");

  const metrics = [
    {
      id: "payout",
      label: "Total Payout",
      value: new Intl.NumberFormat("en-US").format(69500),
      helperText: "Paid",
      icon: CircleDollarSign,
    },
    {
      id: "pending",
      label: "Pending Approval",
      value: new Intl.NumberFormat("en-US").format(2),
      helperText: "Awaiting approval",
      icon: Clock,
    },
    {
      id: "overmargin",
      label: "Over-Margin Shoots",
      value: new Intl.NumberFormat("en-US").format(6),
      helperText: "Requires review",
      icon: ShieldAlert,
    },
    {
      id: "partiallypaid",
      label: "Partially Paid",
      value: new Intl.NumberFormat("en-US").format(265),
      helperText: "Shoots paid partially",
      icon: TrendingUp,
    },
  ];

  const handleRowClick = useCallback((id: string) => {
    if (id) {
      console.log("Clicked Row ID:", id);
      return;
    }
    toast.error("Invalid entry key targeted");
  }, []);

  useEffect(() => {
    if (dataType === "shoots") {
      setTableData(MOCK_SHOOT_DATA);
    } else {
      setTableData(MOCK_CREATORS_DATA);
    }
  }, [dataType]);

  return (
    <>
      <Topbar
        pathname={pathname}
        actions={
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="beige"
              className="h-12 rounded-lg px-4 text-sm font-semibold text-black lg:px-6"
              onClick={() => { }}
            >
              Add Compensation
            </Button>
          </div>
        }
      />

      <div
        className="space-y-5 overflow-hidden p-4 lg:space-y-8 lg:px-10 lg:py-9"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex justify-between items-start lg:items-end gap-4">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
              CP Compensation
            </h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              Manage creative partner compensation, advance payments, approvals, and payout tracking in one place.
            </p>
          </div>
          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        <FinanceMetricCards
          metrics={metrics}
          activeId={activeMetricId}
          onSelect={setActiveMetricId}
          dropdownLabel="Month"
          dropdownValue={metricRange}
          dropdownOptions={metricDropdownOptions}
          onDropdownChange={setMetricRange}
          gridSize={4}
        />

        <TabsSwitcher
          tabs={tabs}
          activeTab={dataType}
          buttonSize="large"
          className="rounded-md"
          onChange={(tab) => setDataType(tab)}
        />

        <CPPayoutTable
          rows={tableData} // Change 'initialRows' to 'rows'
          loading={loading}
          onRowClick={handleRowClick}
          type={dataType}
        />
      </div>
    </>
  );
}