"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, CalendarDays, FileText } from "lucide-react";

import Topbar from "@/components/admin/Topbar";
import type { CreditHistoryRow } from "@/components/affiliate/CreditHistoryTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const filterOptions = ["Month", "Last 30 Days", "This Quarter", "This Year"];
const typeOptions = ["All", "Used", "Available"];

type CreditActivityItem = {
  id: string;
  title: string;
  date: string;
  reference: string;
  amount: string;
  shootId?: string;
  invoiceId?: string;
};

type CreditUserDetails = {
  totalCreditPoints: string;
  currentBalance: string;
  totalUsed: string;
  activities: CreditActivityItem[];
};

const adminCreditHistoryRows: CreditHistoryRow[] = [
  {
    id: "1",
    date: "Apr 23, 2026",
    clientName: "Alex Morgan",
    email: "alex.morgan@example.com",
    availablePoints: "3,500 Points",
    usedPoints: "-850 Points",
    lastActivity: "22-04-2026",
    initials: "AM",
    avatarColor: "#F0C4E3",
  },
  {
    id: "2",
    date: "Apr 10, 2026",
    clientName: "Ethan Carter",
    email: "ethancarter@gmail.com",
    availablePoints: "4,000 Points",
    usedPoints: "-400 Points",
    lastActivity: "12-04-2026",
    initials: "EC",
    avatarColor: "#F5E4BC",
    avatarImage: "/images/avatar.png",
  },
  {
    id: "3",
    date: "Mar 31, 2026",
    clientName: "Maya Ross",
    email: "mayaross@gmail.com",
    availablePoints: "5,500 Points",
    usedPoints: "-100 Points",
    lastActivity: "01-04-2026",
    initials: "MR",
    avatarColor: "#CFF3B9",
  },
  {
    id: "4",
    date: "Mar 12, 2026",
    clientName: "John Lee",
    email: "johnlee@outlook.com",
    availablePoints: "3,000 Points",
    usedPoints: "-200 Points",
    lastActivity: "21-03-2026",
    initials: "JL",
    avatarColor: "#F1DFC3",
    avatarImage: "/images/avatar.png",
  },
  {
    id: "5",
    date: "Mar 4, 2026",
    clientName: "Raj Yadhav",
    email: "rajyadhav@outlook.com",
    availablePoints: "2,450 Points",
    usedPoints: "-550 Points",
    lastActivity: "06-03-2026",
    initials: "RY",
    avatarColor: "#D5D9E8",
    avatarImage: "/images/avatar.png",
  },
  {
    id: "6",
    date: "Feb 8, 2026",
    clientName: "Daniel Roberts",
    email: "danielr@gmail.com",
    availablePoints: "2,450 Points",
    usedPoints: "-600 Points",
    lastActivity: "15-02-2026",
    initials: "DR",
    avatarColor: "#F4F4F4",
  },
  {
    id: "7",
    date: "Jan 30, 2026",
    clientName: "Sophia Bennett",
    email: "sophiab@gmail.com",
    availablePoints: "6,100 Points",
    usedPoints: "0 Points",
    lastActivity: "31-01-2026",
    initials: "SB",
    avatarColor: "#FFE0C7",
  },
  {
    id: "8",
    date: "Jan 14, 2026",
    clientName: "Noah Walker",
    email: "noahwalker@gmail.com",
    availablePoints: "1,900 Points",
    usedPoints: "0 Points",
    lastActivity: "16-01-2026",
    initials: "NW",
    avatarColor: "#D7E6FF",
  },
];

const adminCreditUserDetailsMap: Record<string, CreditUserDetails> = {
  "1": {
    totalCreditPoints: "3500",
    currentBalance: "2,450",
    totalUsed: "850",
    activities: [
      { id: "CR-045", title: "Used for Shoot Payment", date: "22-04-2026", reference: "CR-045", amount: "-250", shootId: "SH-012", invoiceId: "INV-012-A" },
      { id: "CR-041", title: "Referral Bonus", date: "20-04-2026", reference: "CR-041", amount: "+500" },
      { id: "CR-038", title: "Used for Shoot Payment", date: "18-04-2026", reference: "CR-038", amount: "-200", shootId: "SH-009", invoiceId: "INV-009-B" },
      { id: "CR-032", title: "Monthly Loyalty Reward", date: "15-04-2026", reference: "CR-032", amount: "+300" },
      { id: "CR-028", title: "Used for Studio Rental", date: "12-04-2026", reference: "CR-028", amount: "-150", shootId: "SH-007", invoiceId: "INV-007-A" },
    ],
  },
  "2": {
    totalCreditPoints: "4000",
    currentBalance: "3,600",
    totalUsed: "400",
    activities: [
      { id: "CR-044", title: "Used for Shoot Payment", date: "12-04-2026", reference: "CR-044", amount: "-150", shootId: "SH-010", invoiceId: "INV-010-B" },
      { id: "CR-039", title: "Credit Top-Up", date: "10-04-2026", reference: "CR-039", amount: "+550" },
      { id: "CR-033", title: "Used for Editing Service", date: "08-04-2026", reference: "CR-033", amount: "-250", shootId: "SH-006", invoiceId: "INV-006-C" },
    ],
  },
  "3": {
    totalCreditPoints: "5500",
    currentBalance: "5,400",
    totalUsed: "100",
    activities: [
      { id: "CR-036", title: "Welcome Bonus", date: "01-04-2026", reference: "CR-036", amount: "+500" },
      { id: "CR-031", title: "Used for Shoot Payment", date: "31-03-2026", reference: "CR-031", amount: "-100", shootId: "SH-004", invoiceId: "INV-004-A" },
    ],
  },
  "4": {
    totalCreditPoints: "3000",
    currentBalance: "2,800",
    totalUsed: "200",
    activities: [
      { id: "CR-029", title: "Used for Studio Rental", date: "21-03-2026", reference: "CR-029", amount: "-200", shootId: "SH-008", invoiceId: "INV-008-A" },
    ],
  },
  "5": {
    totalCreditPoints: "2450",
    currentBalance: "1,900",
    totalUsed: "550",
    activities: [
      { id: "CR-027", title: "Used for Shoot Payment", date: "06-03-2026", reference: "CR-027", amount: "-550", shootId: "SH-005", invoiceId: "INV-005-A" },
    ],
  },
  "6": {
    totalCreditPoints: "2450",
    currentBalance: "1,850",
    totalUsed: "600",
    activities: [
      { id: "CR-024", title: "Used for Shoot Payment", date: "15-02-2026", reference: "CR-024", amount: "-600", shootId: "SH-003", invoiceId: "INV-003-A" },
    ],
  },
  "7": {
    totalCreditPoints: "6100",
    currentBalance: "6,100",
    totalUsed: "0",
    activities: [
      { id: "CR-019", title: "Monthly Loyalty Reward", date: "31-01-2026", reference: "CR-019", amount: "+300" },
      { id: "CR-016", title: "Referral Bonus", date: "28-01-2026", reference: "CR-016", amount: "+500" },
    ],
  },
  "8": {
    totalCreditPoints: "1900",
    currentBalance: "1,900",
    totalUsed: "0",
    activities: [
      { id: "CR-013", title: "Credit Top-Up", date: "16-01-2026", reference: "CR-013", amount: "+400" },
    ],
  },
};

export default function AdminCreditPointDetailsPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [monthFilter, setMonthFilter] = useState("Month");
  const [typeFilter, setTypeFilter] = useState("All");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme === "dark" || theme === "dark";

  const userRow = adminCreditHistoryRows.find((row) => row.id === params.id);
  const userDetails = adminCreditUserDetailsMap[params.id];

  const filteredActivities = useMemo(() => {
    if (!userDetails) return [];
    if (typeFilter === "All") return userDetails.activities;
    return userDetails.activities.filter((activity) =>
      typeFilter === "Used" ? activity.amount.startsWith("-") : activity.amount.startsWith("+")
    );
  }, [typeFilter, userDetails]);

  if (!userRow || !userDetails) {
    return (
      <>
        <Topbar
          pathname={pathname}
          breadcrumbOverrides={{
            creditPoints: "Beige Credit Points",
            [params.id]: "User Credit Details",
          }}
        />
        <div
          className={`min-h-screen p-6 lg:px-10 lg:py-9 ${isDark ? "bg-[#111111]" : "bg-[#F7F3EC]"}`}
          style={{ fontFamily: "var(--font-instrument-sans)" }}
        >
          <button
            type="button"
            onClick={() => router.push("/admin/finances/creditPoints")}
            className={`mb-6 inline-flex items-center gap-2 ${isDark ? "text-white/80" : "text-[#171717]"}`}
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div
            className={`rounded-3xl border p-8 ${isDark ? "border-white/10 bg-[#111111] text-white" : "border-[#E6DCCB] bg-white text-[#171717]"}`}
          >
            User credit details not found.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          creditPoints: "Beige Credit Points",
          [params.id]: "User Credit Details",
        }}
      />

      <div
        className={`min-h-screen space-y-6 overflow-hidden p-4 lg:px-10 lg:py-9 ${isDark ? "bg-[#111111]" : "bg-[#F7F3EC]"}`}
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <button
          type="button"
          onClick={() => router.push("/admin/finances/creditPoints")}
          className={`inline-flex items-center gap-2 text-sm transition-colors ${
            isDark ? "text-white hover:text-[#E5D5B8]" : "text-[#171717] hover:text-[#8B6B36]"
          }`}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <section
          className={`rounded-[24px] border ${
            isDark ? "border-[#2D2D2D] bg-[#171717]" : "border-[#E4D9C7] bg-[#FDFBF7] shadow-[0_18px_50px_rgba(129,103,58,0.08)]"
          }`}
        >
          <div className={`border-b px-5 py-5 lg:px-6 ${isDark ? "border-[#2A2A2A]" : "border-[#E9DECD]"}`}>
            <div className="flex items-center gap-3">
              <div className="h-7 w-[3px] rounded-full bg-[#E5D5B8]" />
              <h2 className={`text-lg font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>Details</h2>
            </div>
          </div>

          <div className="space-y-6 p-5 lg:p-6">
            <div
              className={`rounded-[22px] border p-5 lg:p-6 ${
                isDark
                  ? "border-[#463D31] bg-[radial-gradient(circle_at_top_left,_rgba(229,213,184,0.10),_transparent_45%),#221F1C]"
                  : "border-[#E6D5BB] bg-[radial-gradient(circle_at_top_left,_rgba(229,213,184,0.42),_transparent_42%),linear-gradient(135deg,#FFF7EA_0%,#F7F0E5_100%)]"
              }`}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-[66px] w-[66px] items-center justify-center rounded-full text-[30px] font-medium text-[#171717]"
                    style={{ backgroundColor: rowAvatarColor(userRow.avatarColor) }}
                  >
                    {userRow.initials}
                  </div>
                  <div>
                    <p className={`text-[18px] font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                      {userRow.clientName}
                    </p>
                    <p className={`mt-1 text-sm ${isDark ? "text-white/50" : "text-[#6F6F6F]"}`}>{userRow.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[600px]">
                  <MetricCard label="Total Credit Points" value={userDetails.totalCreditPoints} isDark={isDark} accent />
                  <MetricCard label="Current Balance" value={userDetails.currentBalance} isDark={isDark} accent />
                  <MetricCard label="Total Used" value={userDetails.totalUsed} isDark={isDark} />
                </div>
              </div>
            </div>

            <div>
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h3 className={`text-[18px] font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                  Recent Credit Activity
                </h3>
                <div className="flex items-center gap-2 self-start lg:self-auto">
                  <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger className={`h-9 w-[110px] rounded-full text-xs focus:ring-0 ${isDark ? "border-[#3D3D3D] bg-zinc-900 text-white/70" : "border-[#DCCFB9] bg-white text-[#5C4B2D]"}`}>
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "border-[#3D3D3D] bg-[#111111]" : "border-[#DCCFB9] bg-white text-[#171717]"}>
                      {filterOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className={`h-9 w-[90px] rounded-full text-xs focus:ring-0 ${isDark ? "border-[#3D3D3D] bg-zinc-900 text-white/70" : "border-[#DCCFB9] bg-white text-[#5C4B2D]"}`}>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className={isDark ? "border-[#3D3D3D] bg-[#111111]" : "border-[#DCCFB9] bg-white text-[#171717]"}>
                      {typeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredActivities.map((activity) => (
                  <article
                    key={activity.id}
                    className={`rounded-[14px] border px-4 py-4 lg:px-5 ${
                      isDark ? "border-[#2A2A2A] bg-[#221F1F]" : "border-[#E5D9CB] bg-white shadow-[0_10px_30px_rgba(117,92,49,0.05)]"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className={`text-[16px] ${isDark ? "text-white" : "text-[#171717]"}`}>{activity.title}</p>
                        <div className={`mt-2 flex flex-wrap items-center gap-3 text-sm ${isDark ? "text-white/50" : "text-[#6F6F6F]"}`}>
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays size={14} />
                            {activity.date}
                          </span>
                          <span>{activity.reference}</span>
                        </div>
                      </div>
                      <p className={`text-[18px] font-semibold ${activity.amount.startsWith("-") ? "text-[#FF8A80]" : "text-[#00C48C]"}`}>
                        {activity.amount}
                      </p>
                    </div>

                    {(activity.shootId || activity.invoiceId) && (
                      <div className={`mt-4 flex flex-wrap items-center gap-4 border-t pt-4 text-sm ${isDark ? "border-[#2A2A2A] text-white/65" : "border-[#EEE4D6] text-[#6F6F6F]"}`}>
                        {activity.shootId && (
                          <span className="inline-flex items-center gap-2">
                            <FileText size={14} />
                            Shoot:
                            <span className="text-[#D3B98A]">{activity.shootId}</span>
                          </span>
                        )}
                        {activity.invoiceId && (
                          <span className="inline-flex items-center gap-2">
                            <FileText size={14} />
                            Invoice:
                            <span className="text-[#D3B98A]">{activity.invoiceId}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-[14px] bg-[#E5D5B8] px-4 py-5 text-sm font-medium text-[#171717]">
              This is a view-only screen. Credit balances are managed automatically through the system.
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  isDark,
  accent = false,
}: {
  label: string;
  value: string;
  isDark: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`min-w-[190px] rounded-2xl border p-4 ${
        isDark ? "border-[#1F1F1F] bg-[#151515]" : "border-[#E8DEC9] bg-[rgba(255,255,255,0.75)] backdrop-blur"
      }`}
    >
      <p className={`text-sm ${isDark ? "text-white/55" : "text-[#7A6A52]"}`}>{label}</p>
      <p className={`mt-2 text-[22px] font-semibold ${accent ? (isDark ? "text-[#E5D5B8]" : "text-[#A27B3A]") : isDark ? "text-white" : "text-[#171717]"}`}>
        {value}
      </p>
    </div>
  );
}

function rowAvatarColor(color: string) {
  return color;
}
