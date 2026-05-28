"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowLeft, CalendarDays, FileText } from "lucide-react";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminApi } from "@/lib/api";

const filterOptions = ["Month", "Last 30 Days", "This Quarter", "This Year"];
const typeOptions = ["All", "Used", "Available"];

type CreditActivityItem = {
  id: string;
  title: string;
  date: string;
  reference: string;
  amount: string;
  status?: string;
  isExpired?: boolean;
  shootId?: string;
  invoiceId?: string;
};

type CreditUserDetails = {
  clientName: string;
  email: string;
  initials: string;
  avatarColor: string;
  totalCreditPoints: string;
  currentBalance: string;
  totalUsed: string;
  activities: CreditActivityItem[];
};

const avatarPalette = [
  "#F0C4E3",
  "#F5E4BC",
  "#CFF3B9",
  "#F1DFC3",
  "#D5D9E8",
  "#F4F4F4",
  "#FFE0C7",
  "#D7E6FF",
];

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const getArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value)
    ? value.map((item) => asRecord(item)).filter(Boolean) as Record<string, unknown>[]
    : [];

const pickFirstValue = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
};

const pickFirstString = (source: Record<string, unknown>, keys: string[]) => {
  const value = pickFirstValue(source, keys);
  return value === undefined ? "" : String(value);
};

const pickFirstNumber = (source: Record<string, unknown>, keys: string[]) => {
  const value = pickFirstValue(source, keys);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumber = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const hasFraction = Math.abs(safeValue % 1) > 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(safeValue);
};

const formatDisplayDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "NA";

const isTruthyFlag = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
};

const mapUserDetails = (payload: unknown, fallbackKey: string): CreditUserDetails => {
  const root = asRecord(payload) || {};
  const data = asRecord(pickFirstValue(root, ["data"])) || root;
  const summary = asRecord(pickFirstValue(data, ["summary", "overview", "stats"])) || data;
  const profile = asRecord(pickFirstValue(data, ["user", "profile", "client", "details"])) || data;
  const ledger = asRecord(pickFirstValue(data, ["ledger"])) || {};
  const activitiesRaw = getArray(
    pickFirstValue(ledger, ["rows"]) ||
      pickFirstValue(data, ["history", "credit_history", "activities", "rows", "items", "transactions"])
  );

  const clientName =
    pickFirstString(profile, ["name", "client_name", "user_name"]) ||
    pickFirstString(summary, ["name", "client_name", "user_name"]) ||
    "User";

  const email =
    pickFirstString(profile, ["email", "client_email", "guest_email"]) ||
    pickFirstString(summary, ["email", "client_email", "guest_email"]) ||
    "-";

  const currentBalance = pickFirstNumber(summary, [
    "current_balance",
    "available_balance",
    "remaining_balance",
    "total_credits_available",
    "total_available_credits",
  ]);

  const totalUsed = pickFirstNumber(summary, [
    "total_used",
    "total_credits_used",
    "total_used_credits",
    "used_total",
  ]);

  const nonExpiredTotalFromLedger = activitiesRaw.reduce((total, item) => {
    const isExpired =
      isTruthyFlag(item.is_expired) ||
      pickFirstString(item, ["status"]).toLowerCase() === "expired";
    if (isExpired) return total;

    const status = pickFirstString(item, ["status"]).toLowerCase();
    if (status && status !== "approved") return total;

    const direction = pickFirstString(item, ["direction"]).toLowerCase();
    if (direction && direction !== "credit") return total;

    const creditedAmount = pickFirstNumber(item, ["credited_amount", "amount"]);
    const usedAmount = pickFirstNumber(item, ["used_amount"]);
    const remainingBalance = pickFirstNumber(item, ["remaining_balance"]);

    if (creditedAmount > 0) return total + creditedAmount;
    if (remainingBalance > 0 || usedAmount > 0) return total + remainingBalance + usedAmount;

    return total;
  }, 0);

  const totalCreditPoints =
    nonExpiredTotalFromLedger > 0
      ? nonExpiredTotalFromLedger
      : currentBalance + totalUsed;

  const activities: CreditActivityItem[] = activitiesRaw.map((item, index) => {
    const amountNumber = pickFirstNumber(item, ["amount", "used_amount", "credited_amount"]);
    const direction = pickFirstString(item, ["direction", "entry_type"]).toLowerCase();
    const isDebit = direction.includes("debit") || direction.includes("used") || amountNumber < 0;

    return {
      id: pickFirstString(item, ["id", "account_credit_ledger_id", "reference", "entry_id"]) || `${index + 1}`,
      title:
        pickFirstString(item, ["title", "reason", "notes", "entry_type", "source_type"]) ||
        "Credit Activity",
      date: formatDisplayDate(pickFirstString(item, ["transaction_date", "date", "created_at", "approved_at"])),
      reference:
        pickFirstString(item, ["reference", "source_quote_number", "entry_type"]) ||
        `CR-${index + 1}`,
      amount: `${isDebit ? "-" : "+"}${formatNumber(Math.abs(amountNumber))}`,
      status: pickFirstString(item, ["status"]) || undefined,
      isExpired:
        isTruthyFlag(item.is_expired) ||
        pickFirstString(item, ["status"]).toLowerCase() === "expired",
      shootId: pickFirstString(item, ["source_booking_id"]) || undefined,
      invoiceId: pickFirstString(item, ["invoice_number", "invoice_id"]) || undefined,
    };
  });

  return {
    clientName,
    email,
    initials: getInitials(clientName),
    avatarColor: avatarPalette[Math.abs(fallbackKey.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % avatarPalette.length],
    totalCreditPoints: formatNumber(totalCreditPoints),
    currentBalance: formatNumber(currentBalance),
    totalUsed: formatNumber(totalUsed),
    activities,
  };
};

export default function AdminCreditPointDetailsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [monthFilter, setMonthFilter] = useState("Month");
  const [typeFilter, setTypeFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<CreditUserDetails | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);

        let routeId = "";
        try {
          routeId = decodeURIComponent(params.id || "").trim();
        } catch {
          routeId = String(params.id || "").trim();
        }
        const queryGuestEmail = (searchParams.get("guest_email") || "").trim();

        let response: { error?: string; data?: unknown } | null = null;

        const numericId = Number(routeId);
        if (Number.isInteger(numericId) && numericId > 0) {
          response = await adminApi.getCreditPointsUserById(numericId);
        } else {
          const guestEmail = queryGuestEmail || (routeId.includes("@") ? routeId : "");
          if (guestEmail) {
            response = await adminApi.getCreditPointsUserByGuestEmail(guestEmail);
          }
        }

        if (!response) {
          toast.error("Missing user id or guest email");
          setUserDetails(null);
          return;
        }

        if (response.error) {
          toast.error(response.error);
          setUserDetails(null);
          return;
        }

        setUserDetails(mapUserDetails(response.data, params.id));
      } catch (error: any) {
        const message = String(error?.message || "").toLowerCase();
        const isAbortLike =
          error?.name === "AbortError" ||
          error?.code === "ERR_CANCELED" ||
          message.includes("aborted") ||
          message.includes("canceled");
        if (isAbortLike) {
          return;
        }
        console.error("Failed to fetch credit points user details:", error);
        toast.error("Failed to fetch credit points user details");
        setUserDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [params.id, searchParams]);

  const isDark = !mounted || resolvedTheme === "dark" || theme === "dark";

  const filteredActivities = useMemo(() => {
    if (!userDetails) return [];
    if (typeFilter === "All") return userDetails.activities;
    return userDetails.activities.filter((activity) =>
      typeFilter === "Used" ? activity.amount.startsWith("-") : activity.amount.startsWith("+")
    );
  }, [typeFilter, userDetails]);

  if (!loading && !userDetails) {
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
                    style={{ backgroundColor: userDetails?.avatarColor || "#F0C4E3" }}
                  >
                    {userDetails?.initials || "NA"}
                  </div>
                  <div>
                    <p className={`text-[18px] font-medium ${isDark ? "text-white" : "text-[#171717]"}`}>
                      {userDetails?.clientName || "-"}
                    </p>
                    <p className={`mt-1 text-sm ${isDark ? "text-white/50" : "text-[#6F6F6F]"}`}>{userDetails?.email || "-"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[600px]">
                  <MetricCard
                    label="Total Credit Points"
                    value={userDetails?.totalCreditPoints || "0"}
                    isDark={isDark}
                    accent
                    helperTooltip="Excluding expired credits. Only approved and used (non-expired) credits are included in this total."
                  />
                  <MetricCard label="Current Balance" value={userDetails?.currentBalance || "0"} isDark={isDark} accent />
                  <MetricCard label="Total Used" value={userDetails?.totalUsed || "0"} isDark={isDark} />
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

              {loading ? (
                <div className={`rounded-[14px] border px-4 py-6 text-sm ${isDark ? "border-[#2A2A2A] text-white/70" : "border-[#E5D9CB] text-[#6F6F6F]"}`}>
                  Loading credit activity...
                </div>
              ) : (
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
                            {activity.isExpired ? (
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                                  isDark
                                    ? "border-red-400/35 bg-red-500/10 text-red-300"
                                    : "border-red-200 bg-red-50 text-red-600"
                                }`}
                              >
                                Expired
                              </span>
                            ) : null}
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
                  {filteredActivities.length === 0 && (
                    <div className={`rounded-[14px] border px-4 py-6 text-sm ${isDark ? "border-[#2A2A2A] text-white/70" : "border-[#E5D9CB] text-[#6F6F6F]"}`}>
                      No credit activity found.
                    </div>
                  )}
                </div>
              )}
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
  helperTooltip,
}: {
  label: string;
  value: string;
  isDark: boolean;
  accent?: boolean;
  helperTooltip?: string;
}) {
  return (
    <div
      className={`min-w-[190px] rounded-2xl border p-4 ${
        isDark ? "border-[#1F1F1F] bg-[#151515]" : "border-[#E8DEC9] bg-[rgba(255,255,255,0.75)] backdrop-blur"
      }`}
    >
      <div className="flex items-center gap-2">
        <p className={`text-sm ${isDark ? "text-white/55" : "text-[#7A6A52]"}`}>{label}</p>
        {helperTooltip ? <InfoTooltip message={helperTooltip} isDark={isDark} align="right" /> : null}
      </div>
      <p className={`mt-2 text-[22px] font-semibold ${accent ? (isDark ? "text-[#E5D5B8]" : "text-[#A27B3A]") : isDark ? "text-white" : "text-[#171717]"}`}>
        {value}
      </p>
    </div>
  );
}
