"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { CalendarRange, DollarSign, Plus, Save, Search, Settings, X } from "lucide-react";
import { toast } from "sonner";
import { format, isValid, parseISO } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";

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
import { usePermissions } from "@/lib/hooks/usePermissions";
import { adminApi, salesApi } from "@/lib/api";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import DatePicker from "@/components/ui/Datepicker";
import { Input } from "@/components/ui/input";
const historyMonthOptions = ["All Time", "Last 30 Days", "This Quarter", "This Year"];
const historyStatusOptions = ["All", "Used", "Available"];
const creditTypeOptions = ["Promo", "Refund", "Compensation"];

type CreditPointsDashboardResponse = {
  success?: boolean;
  data?: unknown;
  error?: string;
};

type SignupCreditPromotionForm = {
  isEnabled: boolean;
  amount: string;
  startDate: string;
  endDate: string;
  isActiveNow: boolean;
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
    pagination: asRecord(pickFirstValue(history || data, ["pagination"])) || {},
  };
};

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseIsoDateOnly = (value: string) => {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
};

const buildHistoryDateParams = (month: string, selectedDate: Date | null) => {
  if (selectedDate) {
    const iso = toIsoDate(selectedDate);
    return { date_from: iso, date_to: iso };
  }

  if (month === "All Time") {
    return {};
  }

  const now = new Date();
  if (month === "Last 30 Days") {
    const from = new Date(now);
    from.setDate(now.getDate() - 30);
    return { date_from: toIsoDate(from), date_to: toIsoDate(now) };
  }

  if (month === "This Quarter") {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const from = new Date(now.getFullYear(), quarterStartMonth, 1);
    return { date_from: toIsoDate(from), date_to: toIsoDate(now) };
  }

  if (month === "This Year") {
    const from = new Date(now.getFullYear(), 0, 1);
    return { date_from: toIsoDate(from), date_to: toIsoDate(now) };
  }

  return {};
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
  const { canCreate } = usePermissions("finances");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyMonth, setHistoryMonth] = useState("All Time");
  const [historyStatus, setHistoryStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [creditHistoryRows, setCreditHistoryRows] = useState<CreditHistoryRow[]>([]);
  const [historyTotalRecords, setHistoryTotalRecords] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const historyPageSize = 10;
  const [isAddCreditModalOpen, setIsAddCreditModalOpen] = useState(false);
  const [isSignupSettingsOpen, setIsSignupSettingsOpen] = useState(false);
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
  const [signupPromotionForm, setSignupPromotionForm] =
    useState<SignupCreditPromotionForm>({
      isEnabled: false,
      amount: "250",
      startDate: "",
      endDate: "",
      isActiveNow: false,
    });
  const [isLoadingSignupPromotion, setIsLoadingSignupPromotion] = useState(true);
  const [isSavingSignupPromotion, setIsSavingSignupPromotion] = useState(false);

  useEffect(() => setMounted(true), []);

  const fetchSignupCreditPromotion = useCallback(async () => {
    try {
      setIsLoadingSignupPromotion(true);
      const response = await adminApi.getSignupCreditPromotion();
      if (response?.error) {
        toast.error(response.error);
        return;
      }

      const data = asRecord(response?.data) || {};
      setSignupPromotionForm({
        isEnabled: Boolean(data.is_enabled),
        amount: String(pickFirstNumber(data, ["amount"]) || 250),
        startDate: pickFirstString(data, ["start_date"]).slice(0, 10),
        endDate: pickFirstString(data, ["end_date"]).slice(0, 10),
        isActiveNow: Boolean(data.is_active_now),
      });
    } catch (error) {
      console.error("Failed to load signup credit promotion:", error);
      toast.error("Failed to load signup credit promotion");
    } finally {
      setIsLoadingSignupPromotion(false);
    }
  }, []);

  useEffect(() => {
    fetchSignupCreditPromotion();
  }, [fetchSignupCreditPromotion]);

  const fetchCreditPointsDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const dateParams = buildHistoryDateParams(historyMonth, selectedDate);
      const dashboardResponse = await adminApi.getCreditPointsDashboard({
        page: historyCurrentPage,
        limit: historyPageSize,
        search: debouncedSearch.trim() || undefined,
        status: historyStatus === "All" ? undefined : historyStatus.toLowerCase(),
        ...dateParams,
      });

      if (dashboardResponse?.error) {
        toast.error(dashboardResponse.error);
        setCreditHistoryRows([]);
        setHistoryTotalRecords(0);
        setHistoryTotalPages(0);
        return;
      }

      const { rows, pagination } = extractDashboardPayload(dashboardResponse);
      setCreditHistoryRows(rows.map(mapDashboardHistoryRow));
      setHistoryTotalRecords(pagination?.total ? Number(pagination.total) : rows.length);
      setHistoryTotalPages(pagination?.total_pages ? Number(pagination.total_pages) : 1);
    } catch (error) {
      console.error("Failed to load credit points dashboard:", error);
      toast.error("Failed to load credit points dashboard");
      setCreditHistoryRows([]);
      setHistoryTotalRecords(0);
      setHistoryTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, historyCurrentPage, historyMonth, historyPageSize, historyStatus, selectedDate]);

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

  const handleSignupPromotionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(signupPromotionForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid signup credit amount");
      return;
    }

    if (
      signupPromotionForm.startDate &&
      signupPromotionForm.endDate &&
      signupPromotionForm.startDate > signupPromotionForm.endDate
    ) {
      toast.error("Start date must be before end date");
      return;
    }

    try {
      setIsSavingSignupPromotion(true);
      const response = await adminApi.updateSignupCreditPromotion({
        is_enabled: signupPromotionForm.isEnabled,
        amount,
        start_date: signupPromotionForm.startDate || null,
        end_date: signupPromotionForm.endDate || null,
      });

      if (response?.error) {
        toast.error(response.error);
        return;
      }

      const data = asRecord(response?.data) || {};
      setSignupPromotionForm({
        isEnabled: Boolean(data.is_enabled),
        amount: String(pickFirstNumber(data, ["amount"]) || amount),
        startDate: pickFirstString(data, ["start_date"]).slice(0, 10),
        endDate: pickFirstString(data, ["end_date"]).slice(0, 10),
        isActiveNow: Boolean(data.is_active_now),
      });
      toast.success("Signup credit promotion updated");
      setIsSignupSettingsOpen(false);
    } catch (error) {
      console.error("Failed to update signup credit promotion:", error);
      toast.error("Failed to update signup credit promotion");
    } finally {
      setIsSavingSignupPromotion(false);
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
              disabled={!canCreate}
              title={canCreate ? "Add Credit Points" : "Create permission not allowed"}
            >
              <Plus size={18} />
              Add Credit Points
            </Button>
            {/* <Button
              type="button"
              className={`h-12 w-12 rounded-lg border p-0 transition-colors ${
                isDark
                  ? "border-white/15 bg-[#202020] text-white hover:bg-white/10"
                  : "border-[#E5E5E5] bg-white text-black hover:bg-black/5"
              }`}
              onClick={() => setIsSignupSettingsOpen(true)}
              title="New User Sign up Credits"
              aria-label="New User Sign up Credits"
            >
              <Settings size={19} />
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
            onDateChange={(date) => {
              setSelectedDate(date);
              setHistoryCurrentPage(1);
            }}
          />
        </div>

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
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setHistoryCurrentPage(1);
            }}
            placeholder="Search by client name, email, or user id..."
            className={`h-12 w-full rounded-lg border pl-10 pr-4 text-sm transition-colors focus:outline-none ${
              isDark
                ? "bg-zinc-900 border-[#333333] text-white focus:border-[#E8D1AB]"
                : "bg-white border-[#E5E5E5] text-black focus:border-[#E8D1AB]"
            }`}
          />
        </div>

        <CreditHistoryTable
          rows={creditHistoryRows}
          loading={loading}
          currentPage={historyCurrentPage}
          totalPages={historyTotalPages}
          totalRecords={historyTotalRecords}
          onPageChange={setHistoryCurrentPage}
          monthValue={historyMonth}
          monthOptions={historyMonthOptions}
          onMonthChange={(value) => {
            setHistoryMonth(value);
            setSelectedDate(null);
            setHistoryCurrentPage(1);
          }}
          statusValue={historyStatus}
          statusOptions={historyStatusOptions}
          onStatusChange={(value) => {
            setHistoryStatus(value);
            setHistoryCurrentPage(1);
          }}
          onRowClick={handleCreditHistoryRowClick}
          itemsPerPage={historyPageSize}
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
      <Dialog open={isSignupSettingsOpen} onOpenChange={setIsSignupSettingsOpen}>
        <DialogContent
          className={`w-[calc(100vw-24px)] max-w-[560px] overflow-visible rounded-[2px] border p-0 shadow-[0_18px_60px_rgba(0,0,0,0.55)] [&>button]:hidden ${
            isDark ? "border-white/25 bg-black text-white" : "border-[#D7D7D7] bg-white text-black"
          }`}
        >
          <DialogTitle className="sr-only">New User Sign up Credits</DialogTitle>

          <div
            className={`flex items-center justify-between border-b px-5 py-4 ${
              isDark ? "border-white/20" : "border-[#E5E5E5]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isDark ? "bg-[#2B2525] text-[#E8D1AB]" : "bg-[#F5E8D0] text-black"
                }`}
              >
                <Settings size={19} />
              </span>
              <div>
                <h2 className="text-[20px] font-semibold leading-none">
                  New User Sign up Credits
                </h2>
                <p className={`mt-1 text-xs ${isDark ? "text-white/55" : "text-black/55"}`}>
                  Credits apply only to users who sign up during the selected date range while this setting is enabled.
                </p>
              </div>
            </div>
            <DialogClose asChild>
              <button
                type="button"
                className={`flex h-8 w-10 items-center justify-center rounded-full transition ${
                  isDark
                    ? "bg-[#2B2525] text-white/90 hover:bg-[#3A3333]"
                    : "bg-black/5 text-black hover:bg-black/10"
                }`}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </div>

          <form onSubmit={handleSignupPromotionSubmit} className="space-y-5 px-5 py-5">
            <div
              className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 ${
                isDark ? "border-white/15 bg-[#101010]" : "border-[#E5E5E5] bg-[#FAFAFA]"
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">New Client Signup Credits</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      signupPromotionForm.isEnabled && signupPromotionForm.isActiveNow
                        ? "bg-emerald-500/15 text-emerald-400"
                        : signupPromotionForm.isEnabled
                          ? "bg-amber-500/15 text-amber-300"
                          : isDark
                            ? "bg-white/10 text-white/60"
                            : "bg-black/5 text-black/60"
                    }`}
                  >
                    {signupPromotionForm.isEnabled
                      ? signupPromotionForm.isActiveNow
                        ? "Active now"
                        : "Scheduled"
                      : "Disabled"}
                  </span>
                </div>
                <p className={`mt-1 text-xs ${isDark ? "text-white/55" : "text-black/55"}`}>
                  Credits apply only to users who sign up during the selected date range while this setting is enabled.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={signupPromotionForm.isEnabled}
                disabled={isLoadingSignupPromotion || !canCreate}
                onClick={() =>
                  setSignupPromotionForm((current) => ({
                    ...current,
                    isEnabled: !current.isEnabled,
                  }))
                }
                className={`relative h-7 w-12 shrink-0 rounded-full border transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                  signupPromotionForm.isEnabled
                    ? "border-[#E8D1AB] bg-[#E8D1AB]"
                    : isDark
                      ? "border-white/15 bg-[#242424]"
                      : "border-black/15 bg-[#E9E9E9]"
                }`}
              >
                <span
                  className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full shadow-sm transition-all ${
                    signupPromotionForm.isEnabled
                      ? "left-[22px] bg-black"
                      : isDark
                        ? "left-1 bg-white/70"
                        : "left-1 bg-white"
                  }`}
                />
              </button>
            </div>

            <fieldset
              className={`rounded-lg border px-4 pb-3 pt-1.5 ${
                isDark ? "border-white/25" : "border-black/20"
              }`}
            >
              <legend className={`px-1 text-[11px] leading-none ${isDark ? "text-white/55" : "text-black/55"}`}>
                Credit Amount*
              </legend>
              <div className="flex items-center gap-2">
                <DollarSign size={18} className={isDark ? "text-[#E8D1AB]" : "text-black/60"} />
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={signupPromotionForm.amount}
                  onChange={(event) =>
                    setSignupPromotionForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  disabled={isLoadingSignupPromotion || !canCreate}
                  placeholder="250"
                  className={`h-9 rounded-none border-0 bg-transparent px-0 py-0 text-[14px] focus-visible:ring-0 ${
                    isDark ? "text-white placeholder:text-white/35" : "text-black placeholder:text-black/35"
                  }`}
                />
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className={`flex items-center gap-2 text-xs font-semibold ${isDark ? "text-white/65" : "text-black/65"}`}>
                  <CalendarRange size={15} />
                  Start Date
                </div>
                <DatePicker
                  label=""
                  value={parseIsoDateOnly(signupPromotionForm.startDate)}
                  onChange={(date) =>
                    setSignupPromotionForm((current) => ({
                      ...current,
                      startDate: date && isValid(date) ? format(date, "yyyy-MM-dd") : "",
                    }))
                  }
                  disabled={isLoadingSignupPromotion || !canCreate}
                  placeholder="Select start date"
                  isDark={isDark}
                  disablePortal
                />
              </div>

              <div className="space-y-2">
                <div className={`flex items-center gap-2 text-xs font-semibold ${isDark ? "text-white/65" : "text-black/65"}`}>
                  <CalendarRange size={15} />
                  End Date
                </div>
                <DatePicker
                  label=""
                  value={parseIsoDateOnly(signupPromotionForm.endDate)}
                  onChange={(date) =>
                    setSignupPromotionForm((current) => ({
                      ...current,
                      endDate: date && isValid(date) ? format(date, "yyyy-MM-dd") : "",
                    }))
                  }
                  minDate={parseIsoDateOnly(signupPromotionForm.startDate) || undefined}
                  disabled={isLoadingSignupPromotion || !canCreate}
                  placeholder="Select end date"
                  isDark={isDark}
                  disablePortal
                />
              </div>
            </div>

            <div
              className={`flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end ${
                isDark ? "border-white/10" : "border-[#E5E5E5]"
              }`}
            >
              <DialogClose asChild>
                <Button
                  type="button"
                  className={`h-11 rounded-lg px-5 text-sm font-semibold ${
                    isDark
                      ? "border border-white/15 bg-[#202020] text-white hover:bg-white/10"
                      : "border border-[#E5E5E5] bg-white text-black hover:bg-black/5"
                  }`}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                variant="beige"
                disabled={isLoadingSignupPromotion || isSavingSignupPromotion || !canCreate}
                className="h-11 rounded-lg px-5 text-sm font-semibold text-black"
              >
                <Save size={17} />
                {isSavingSignupPromotion ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <CreditPointsSuccessModal
        open={isCreditSuccessModalOpen}
        details={submittedCreditForm}
        onOpenChange={setIsCreditSuccessModalOpen}
      />
    </>
  );
}
