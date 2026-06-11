"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpToLine, BadgeDollarSign, Coins, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";
import AddCreditPointsModal, {
  type ClientDropdownItem,
  type CreditPointsFormState,
} from "@/components/admin/finances/AddCreditPointsModal";
import CreditPointsSuccessModal from "@/components/admin/finances/CreditPointsSuccessModal";

import { Button } from "@/src/components/landing/ui/button";
import CreditHistoryTable, {
  type CreditHistoryRow,
} from "@/components/affiliate/CreditHistoryTable";
import FinanceMetricCards from "@/components/affiliate/FinanceMetricCards";
import { adminApi, salesApi } from "@/lib/api";
const metricDropdownOptions = ["Month", "Last 30 Days", "This Quarter", "This Year"];
const historyMonthOptions = ["Month", "Last 30 Days", "This Quarter", "This Year"];
const historyStatusOptions = ["All", "Used", "Available"];
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

const formatPoints = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const hasFraction = Math.abs(safeValue % 1) > 0;
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(safeValue)} Points`;
};

const pickFirstClientValue = (
  ...values: Array<string | number | null | undefined>
) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;

    const normalized = String(value).trim();
    if (normalized) {
      return normalized;
    }
  }

  return "";
};

const getClientDisplayName = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(client?.name, client?.client_name, client?.full_name);

const getClientEmail = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(client?.email, client?.client_email, client?.guest_email);

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

const normalizeRestrictionContext = (value: string) => {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  const aliases: Record<string, string> = {
    booking_payment: "shoot_payment",
    payment: "shoot_payment",
    shoot: "shoot_payment",
    shoot_payment_credit_used: "shoot_payment",
    manual_credits_usage: "shoot_payment",
    manual_credit_usage: "shoot_payment",
    manual_credits: "shoot_payment",
  };

  return aliases[normalized] || normalized;
};

const parseRestrictionContexts = (value: string) =>
  value
    .split(",")
    .map((item) => normalizeRestrictionContext(item))
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
  const history = asRecord(pickFirstValue(data, ["credit_points_history", "history"]));

  return {
    metrics: asRecord(
      pickFirstValue(data, ["summary", "metrics", "overview", "stats"]) || data
    ) || {},
    rows: getArray(
      pickFirstValue(history || data, [
        "rows",
        "history",
        "clients",
        "users",
        "items",
        "list",
        "dashboard",
      ])
    ),
  };
};

const mapDashboardHistoryRow = (
  item: Record<string, unknown>,
  index: number
): CreditHistoryRow => {
  const clientName = pickFirstString(item, ["name", "client_name", "user_name"]) || `User ${index + 1}`;
  const availableValue = pickFirstNumber(item, [
    "total_credits_available",
    "total_credit_points_available",
    "available_points",
    "available_credits",
  ]);
  const usedValue = pickFirstNumber(item, [
    "total_credits_used",
    "total_credit_points_used",
    "used_points",
    "used_credits",
  ]);

  return {
    id:
      pickFirstString(item, ["user_id", "id", "account_credit_ledger_id"]) ||
      String(index + 1),
    userId: (() => {
      const raw = pickFirstValue(item, ["user_id"]);
      const parsed = Number(raw);
      return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    })(),
    guestEmail: pickFirstString(item, ["guest_email"]) || "",
    date: formatDisplayDate(
      pickFirstString(item, ["date", "created_at", "transaction_date", "approved_at"])
    ),
    clientName,
    email:
      pickFirstString(item, ["email", "client_email", "guest_email"]) || "-",
    availablePoints: formatPoints(availableValue),
    usedPoints: usedValue > 0 ? `-${formatPoints(usedValue)}` : formatPoints(usedValue),
    lastActivity: formatActivityDate(
      pickFirstString(item, ["last_activity_at", "date", "approved_at", "created_at"])
    ),
    initials: getInitials(clientName),
    avatarColor: avatarPalette[index % avatarPalette.length],
    avatarImage: pickFirstString(item, ["avatar", "avatar_url", "profile_image"]) || undefined,
  };
};

export default function AdminFinancesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMetricId, setActiveMetricId] = useState("available");
  const [metricRange, setMetricRange] = useState("Month");
  const [historyMonth, setHistoryMonth] = useState("Month");
  const [historyStatus, setHistoryStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardMetrics, setDashboardMetrics] = useState<Record<string, unknown>>({});
  const [creditHistoryRows, setCreditHistoryRows] = useState<CreditHistoryRow[]>([]);
  const [isAddCreditModalOpen, setIsAddCreditModalOpen] = useState(false);
  const [isCreditSuccessModalOpen, setIsCreditSuccessModalOpen] = useState(false);
  const [isSubmittingCredit, setIsSubmittingCredit] = useState(false);
  const [clientSuggestions, setClientSuggestions] = useState<ClientDropdownItem[]>([]);
  const [selectedClientSuggestion, setSelectedClientSuggestion] =
    useState<ClientDropdownItem | null>(null);
  const [isClientSuggestionOpen, setIsClientSuggestionOpen] = useState(false);
  const [isLoadingClientSuggestions, setIsLoadingClientSuggestions] = useState(false);
  const [submittedCreditForm, setSubmittedCreditForm] = useState<CreditPointsFormState | null>(
    null
  );
  const [creditForm, setCreditForm] = useState<CreditPointsFormState>({
    userType: "Client",
    clientSearch: "",
    targetUserId: "",
    guestEmail: "",
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

      const dashboardResponse = await adminApi.getCreditPointsDashboard();

      if (dashboardResponse?.error) {
        toast.error(dashboardResponse.error);
        setDashboardMetrics({});
        setCreditHistoryRows([]);
        return;
      }

      const { metrics, rows } = extractDashboardPayload(dashboardResponse);
      setDashboardMetrics(metrics);
      setCreditHistoryRows(rows.map(mapDashboardHistoryRow));
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

  useEffect(() => {
    const trimmedQuery = creditForm.clientSearch.trim();

    if (!isAddCreditModalOpen || !isClientSuggestionOpen || trimmedQuery.length === 0) {
      setClientSuggestions([]);
      setIsLoadingClientSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingClientSuggestions(true);
      try {
        const result = await salesApi.getClientDropdown(trimmedQuery);
        if (!result?.error && Array.isArray(result.data)) {
          setClientSuggestions(result.data as ClientDropdownItem[]);
        } else {
          setClientSuggestions([]);
        }
      } catch (error) {
        console.error("Failed to fetch client suggestions:", error);
        setClientSuggestions([]);
      } finally {
        setIsLoadingClientSuggestions(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [creditForm.clientSearch, isAddCreditModalOpen, isClientSuggestionOpen]);

  const isDark = !mounted || theme === "dark";

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

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

      if (normalizedSearch) {
        const searchableValue = [
          row.clientName,
          row.email,
          row.userId ? String(row.userId) : "",
          row.guestEmail || "",
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableValue.includes(normalizedSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [creditHistoryRows, historyMonth, historyStatus, searchQuery, selectedDate]);

  const metrics = useMemo(
    () => [
      {
        id: "available",
        label: "Total Credits Available",
        value: new Intl.NumberFormat("en-US").format(
          pickFirstNumber(dashboardMetrics, [
            "total_credits_available",
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
            "total_credits_used",
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
            "active_users_holding_credits",
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

  const handleCreditHistoryRowClick = useCallback((row: CreditHistoryRow) => {
    if (row.userId && row.userId > 0) {
      router.push(`/admin/finances/creditPoints/${row.userId}`);
      return;
    }

    if (row.guestEmail) {
      const encodedEmail = encodeURIComponent(row.guestEmail);
      router.push(
        `/admin/finances/creditPoints/${encodedEmail}?guest_email=${encodedEmail}`
      );
      return;
    }

    toast.error("No user id or guest email found for this row");
  }, [router]);

  const updateCreditForm = <K extends keyof typeof creditForm>(
    key: K,
    value: (typeof creditForm)[K]
  ) => {
    setCreditForm((current) => {
      if (key === "clientSearch") {
        return {
          ...current,
          clientSearch: String(value),
          targetUserId: "",
          guestEmail: "",
        };
      }

      return { ...current, [key]: value };
    });

    if (key === "clientSearch") {
      setSelectedClientSuggestion(null);
      setIsClientSuggestionOpen(true);
    }
  };

  const resetCreditForm = () => {
    setCreditForm({
      userType: "Client",
      clientSearch: "",
      targetUserId: "",
      guestEmail: "",
      amount: "",
      creditType: "",
      expiryDate: "",
      reason: "",
      notes: "",
      usageRestrictions: "",
      notifyUser: false,
    });
    setClientSuggestions([]);
    setSelectedClientSuggestion(null);
    setIsClientSuggestionOpen(false);
    setIsLoadingClientSuggestions(false);
  };

  const handleCreditModalChange = (open: boolean) => {
    setIsAddCreditModalOpen(open);
    if (!open) {
      resetCreditForm();
      return;
    }

    setCreditForm((current) => ({ ...current, userType: "Client" }));
  };

  const handleClientSuggestionSelect = (client: ClientDropdownItem) => {
    const resolvedUserId = pickFirstClientValue(client.user_id);
    const resolvedGuestEmail = resolvedUserId ? "" : getClientEmail(client);

    setSelectedClientSuggestion(client);
    setCreditForm((current) => ({
      ...current,
      userType: "Client",
      clientSearch: getClientDisplayName(client) || getClientEmail(client),
      targetUserId: resolvedUserId,
      guestEmail: resolvedGuestEmail,
    }));
    setIsClientSuggestionOpen(false);
  };

  const handleCreditFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedAmount = Number(creditForm.amount);
    if (!selectedClientSuggestion) {
      toast.error("Select a client from suggestions");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    if (!creditForm.reason || !creditForm.creditType) {
      toast.error("Fill all required fields");
      return;
    }

    const parsedTargetUserId = Number(creditForm.targetUserId);
    const hasRegisteredUser = Number.isInteger(parsedTargetUserId) && parsedTargetUserId > 0;
    const resolvedGuestEmail = creditForm.guestEmail.trim();

    if (!hasRegisteredUser && !resolvedGuestEmail) {
      toast.error("Selected client must have a user id or guest email");
      return;
    }

    try {
      setIsSubmittingCredit(true);

      const allowedUsageContexts = parseRestrictionContexts(
        creditForm.usageRestrictions
      );

      const response = await adminApi.createManualCreditPoint({
        user_type: "client",
        ...(hasRegisteredUser
          ? { target_user_id: parsedTargetUserId }
          : { guest_email: resolvedGuestEmail }),
        amount: parsedAmount,
        credit_type: toCreditTypeApiValue(creditForm.creditType),
        expires_at: creditForm.expiryDate
          ? `${creditForm.expiryDate}T23:59:59+05:30`
          : undefined,
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
            {/* <Button
              type="button"
              className="text-sm font-semibold text-white h-12 px-4 lg:px-7 rounded-lg bg-[#202020] border border-white/20 hover:bg-white/10 transition-colors "
            >
              <ArrowUpToLine size={18} />
              Export
            </Button> */}
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

        {/* <FinanceMetricCards
          metrics={metrics}
          activeId={activeMetricId}
          onSelect={setActiveMetricId}
          dropdownLabel="Month"
          dropdownValue={metricRange}
          dropdownOptions={metricDropdownOptions}
          onDropdownChange={setMetricRange}
        /> */}

        <div className="relative flex w-full items-center lg:w-[420px] xl:w-[500px]">
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 ${
              isDark ? "text-[#666]" : "text-[#999]"
            }`}
            size={18}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by client name, email, or user id..."
            className={`h-12 w-full rounded-lg border pl-10 pr-4 text-sm transition-colors focus:outline-none ${
              isDark
                ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]"
                : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
            }`}
          />
        </div>

        <CreditHistoryTable
          rows={filteredRows}
          loading={loading}
          monthValue={historyMonth}
          monthOptions={historyMonthOptions}
          onMonthChange={setHistoryMonth}
          statusValue={historyStatus}
          statusOptions={historyStatusOptions}
          onStatusChange={setHistoryStatus}
          onRowClick={handleCreditHistoryRowClick}
        />
      </div>

      <AddCreditPointsModal
        open={isAddCreditModalOpen}
        form={creditForm}
        isSubmitting={isSubmittingCredit}
        creditTypeOptions={creditTypeOptions}
        clientSuggestions={clientSuggestions}
        selectedClient={selectedClientSuggestion}
        isLoadingClientSuggestions={isLoadingClientSuggestions}
        isClientSuggestionOpen={isClientSuggestionOpen}
        onOpenChange={handleCreditModalChange}
        onChange={updateCreditForm}
        onClientSelect={handleClientSuggestionSelect}
        onClientSuggestionOpenChange={setIsClientSuggestionOpen}
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
