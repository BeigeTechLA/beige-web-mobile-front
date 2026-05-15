"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { ArrowUpToLine, BadgeDollarSign, Coins, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import AddCreditPointsModal, {
  type CreditPointsFormState,
} from "@/components/admin/finances/AddCreditPointsModal";
import CreditPointsSuccessModal from "@/components/admin/finances/CreditPointsSuccessModal";

import { Button } from "@/src/components/landing/ui/button";
import CreditHistoryTable, {
  type CreditHistoryRow,
} from "@/components/affiliate/CreditHistoryTable";
import FinanceMetricCards from "@/components/affiliate/FinanceMetricCards";
import { adminApi } from "@/lib/api";
const metricDropdownOptions = ["Month", "Last 30 Days", "This Quarter", "This Year"];
const historyMonthOptions = ["Month", "Last 30 Days", "This Quarter", "This Year"];
const historyStatusOptions = ["All", "Used", "Available"];
const creditUserTypeOptions = ["Client", "Creative Partner"];
const creditTypeOptions = ["Promo", "Refund", "Compensation"];

type CreditPointsDashboardResponse = {
  success?: boolean;
  data?: unknown;
  error?: string;
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

const formatPoints = (value: number) =>
  `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} Points`;

const formatDisplayDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatActivityDate = (value?: string) => {
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

const toCreditTypeApiValue = (value: string) => value.trim().toLowerCase();

const parseRestrictionContexts = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const matchesRange = (value: string, range: string) => {
  if (!value) return false;
  const rowDate = new Date(value);
  if (Number.isNaN(rowDate.getTime())) return false;

  const now = new Date();
  if (range === "Last 30 Days") {
    const from = new Date(now);
    from.setDate(now.getDate() - 30);
    return rowDate >= from;
  }
  if (range === "This Quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const from = new Date(now.getFullYear(), quarterStartMonth, 1);
    return rowDate >= from;
  }
  if (range === "This Year") {
    return rowDate.getFullYear() === now.getFullYear();
  }

  return (
    rowDate.getMonth() === now.getMonth() &&
    rowDate.getFullYear() === now.getFullYear()
  );
};

const extractDashboardPayload = (response: CreditPointsDashboardResponse) => {
  const data = asRecord(response?.data) || {};

  return {
    metrics: asRecord(
      pickFirstValue(data, ["summary", "metrics", "overview", "stats"]) || data
    ) || {},
    rows: getArray(
      pickFirstValue(data, [
        "history",
        "rows",
        "clients",
        "users",
        "items",
        "list",
        "dashboard",
      ])
    ),
  };
};

const mapDashboardRow = (
  item: Record<string, unknown>,
  index: number
): CreditHistoryRow => {
  const clientName = pickFirstString(item, [
    "client_name",
    "name",
    "user_name",
    "full_name",
  ]) || `User ${index + 1}`;
  const availablePoints = pickFirstNumber(item, [
    "available_points",
    "total_credit_points_available",
    "credit_points_available",
    "balance",
    "current_balance",
  ]);
  const usedPoints = pickFirstNumber(item, [
    "used_points",
    "total_credit_points_used",
    "credit_points_used",
    "credits_used",
  ]);

  return {
    id:
      pickFirstString(item, ["id", "user_id", "client_id", "account_id"]) ||
      String(index + 1),
    date: formatDisplayDate(
      pickFirstString(item, ["created_at", "date", "credited_at", "updated_at"])
    ),
    clientName,
    email: pickFirstString(item, ["email", "email_id", "user_email"]) || "-",
    availablePoints: formatPoints(availablePoints),
    usedPoints: usedPoints > 0 ? `-${formatPoints(usedPoints)}` : formatPoints(usedPoints),
    lastActivity: formatActivityDate(
      pickFirstString(item, [
        "last_activity",
        "last_activity_at",
        "updated_at",
        "created_at",
      ])
    ),
    initials: getInitials(clientName),
    avatarColor: avatarPalette[index % avatarPalette.length],
    avatarImage: pickFirstString(item, ["avatar", "avatar_url", "profile_image"]) || undefined,
  };
};

export default function AdminFinancesPage() {
  const pathname = usePathname();
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMetricId, setActiveMetricId] = useState("available");
  const [metricRange, setMetricRange] = useState("Month");
  const [historyMonth, setHistoryMonth] = useState("Month");
  const [historyStatus, setHistoryStatus] = useState("All");
  const [dashboardMetrics, setDashboardMetrics] = useState<Record<string, unknown>>({});
  const [creditHistoryRows, setCreditHistoryRows] = useState<CreditHistoryRow[]>([]);
  const [isAddCreditModalOpen, setIsAddCreditModalOpen] = useState(false);
  const [isCreditSuccessModalOpen, setIsCreditSuccessModalOpen] = useState(false);
  const [isSubmittingCredit, setIsSubmittingCredit] = useState(false);
  const [submittedCreditForm, setSubmittedCreditForm] = useState<CreditPointsFormState | null>(
    null
  );
  const [creditForm, setCreditForm] = useState<CreditPointsFormState>({
    userType: "",
    targetUserId: "",
    amount: "",
    creditType: "",
    expiryDate: "",
    reason: "",
    notes: "",
    usageRestrictions: "",
    notifyUser: false,
  });

  useEffect(() => setMounted(true), []);

  const fetchCreditPointsDashboard = useCallback(async () => {
    try {
      setLoading(true);

      const response = await adminApi.getCreditPointsDashboard();
      if (response?.error) {
        toast.error(response.error);
        setDashboardMetrics({});
        setCreditHistoryRows([]);
        return;
      }

      const { metrics, rows } = extractDashboardPayload(response);
      setDashboardMetrics(metrics);
      setCreditHistoryRows(rows.map(mapDashboardRow));
    } catch (error) {
      console.error("Failed to load credit points dashboard:", error);
      toast.error("Failed to load credit points dashboard");
      setDashboardMetrics({});
      setCreditHistoryRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreditPointsDashboard();
  }, [fetchCreditPointsDashboard]);

  const isDark = !mounted || theme === "dark";

  const filteredRows = useMemo(() => {
    return creditHistoryRows.filter((row) => {
      const rowHasUsedPoints = row.usedPoints.startsWith("-");

      if (historyStatus === "Used" && !rowHasUsedPoints) return false;
      if (historyStatus === "Available" && rowHasUsedPoints) return false;
      if (historyMonth !== "Month" && !matchesRange(row.date, historyMonth)) return false;

      if (selectedDate) {
        const rowDate = new Date(row.date);
        if (
          Number.isNaN(rowDate.getTime()) ||
          rowDate.getDate() !== selectedDate.getDate() ||
          rowDate.getMonth() !== selectedDate.getMonth() ||
          rowDate.getFullYear() !== selectedDate.getFullYear()
        ) {
          return false;
        }
      }

      return true;
    });
  }, [creditHistoryRows, historyMonth, historyStatus, selectedDate]);

  const metrics = useMemo(
    () => [
      {
        id: "available",
        label: "Total Credits Available",
        value: new Intl.NumberFormat("en-US").format(
          pickFirstNumber(dashboardMetrics, [
            "total_available_credits",
            "total_credit_points_available",
            "available_points",
            "available_credits",
          ])
        ),
        helperText: "Across all users",
        icon: Coins,
      },
      {
        id: "used",
        label: "Total Credits Used",
        value: new Intl.NumberFormat("en-US").format(
          pickFirstNumber(dashboardMetrics, [
            "total_used_credits",
            "total_credit_points_used",
            "used_points",
            "used_credits",
          ])
        ),
        helperText: "All-time usage",
        icon: BadgeDollarSign,
      },
      {
        id: "users",
        label: "Active Users with Credits",
        value: new Intl.NumberFormat("en-US").format(
          pickFirstNumber(dashboardMetrics, [
            "active_users_with_credits",
            "users_with_credits",
            "active_credit_users",
            "active_users",
          ])
        ),
        helperText: "Currently holding credits",
        icon: Users,
      },
    ],
    [dashboardMetrics]
  );

  const updateCreditForm = <K extends keyof typeof creditForm>(
    key: K,
    value: (typeof creditForm)[K]
  ) => {
    setCreditForm((current) => ({ ...current, [key]: value }));
  };

  const resetCreditForm = () => {
    setCreditForm({
      userType: "",
      targetUserId: "",
      amount: "",
      creditType: "",
      expiryDate: "",
      reason: "",
      notes: "",
      usageRestrictions: "",
      notifyUser: false,
    });
  };

  const handleCreditModalChange = (open: boolean) => {
    setIsAddCreditModalOpen(open);
    if (!open) {
      resetCreditForm();
    }
  };

  const handleCreditFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedTargetUserId = Number(creditForm.targetUserId);
    const parsedAmount = Number(creditForm.amount);
    if (!Number.isInteger(parsedTargetUserId) || parsedTargetUserId <= 0) {
      toast.error("Enter a valid target user id");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    if (!creditForm.userType || !creditForm.reason || !creditForm.creditType) {
      toast.error("Fill all required fields");
      return;
    }

    try {
      setIsSubmittingCredit(true);

      const allowedUsageContexts = parseRestrictionContexts(
        creditForm.usageRestrictions
      );

      const response = await adminApi.createManualCreditPoint({
        user_type: creditForm.userType.toLowerCase().replace(/\s+/g, "_"),
        target_user_id: parsedTargetUserId,
        amount: parsedAmount,
        credit_type: toCreditTypeApiValue(creditForm.creditType),
        expires_at: creditForm.expiryDate || undefined,
        reason: creditForm.reason.trim(),
        notes: creditForm.notes.trim() || undefined,
        restrictions_json: allowedUsageContexts.length
          ? { allowed_usage_contexts: allowedUsageContexts }
          : undefined,
        notify_user: creditForm.notifyUser,
      });

      if (response?.error) {
        toast.error(response.error);
        return;
      }

      setSubmittedCreditForm(creditForm);
      handleCreditModalChange(false);
      setIsCreditSuccessModalOpen(true);
      fetchCreditPointsDashboard();
    } catch (error) {
      console.error("Failed to create credit point:", error);
      toast.error("Failed to create credit point");
    } finally {
      setIsSubmittingCredit(false);
    }
  };

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
              onClick={() => setIsAddCreditModalOpen(true)}
            >
              <Plus size={18} />
              Add Credit Points
            </Button>
            <Button className="text-sm font-semibold text-white h-12 px-4 lg:px-7 rounded-lg bg-[#202020] border border-white/20 hover:bg-white/10 transition-colors ">
              <ArrowUpToLine size={18} />
              Export
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
            <h1
              className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${
                isDark ? "text-white" : "text-[#000]"
              }`}
            >
              Credit Points
            </h1>
            <p
              className={`text-xs lg:text-sm transition-colors duration-100 ${
                isDark ? "text-white/70" : "text-[#000000B2]"
              }`}
            >
              Track credit points usage across shoots and invoices
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
        />

        <CreditHistoryTable
          rows={filteredRows}
          loading={loading}
          monthValue={historyMonth}
          monthOptions={historyMonthOptions}
          onMonthChange={setHistoryMonth}
          statusValue={historyStatus}
          statusOptions={historyStatusOptions}
          onStatusChange={setHistoryStatus}
        />
      </div>

      <AddCreditPointsModal
        open={isAddCreditModalOpen}
        form={creditForm}
        isSubmitting={isSubmittingCredit}
        userTypeOptions={creditUserTypeOptions}
        creditTypeOptions={creditTypeOptions}
        onOpenChange={handleCreditModalChange}
        onChange={updateCreditForm}
        onSubmit={handleCreditFormSubmit}
      />
      <CreditPointsSuccessModal
        open={isCreditSuccessModalOpen}
        details={submittedCreditForm}
        onOpenChange={setIsCreditSuccessModalOpen}
      />
    </>
  );
}
