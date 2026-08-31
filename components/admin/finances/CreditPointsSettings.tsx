"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { 
  CalendarRange, 
  DollarSign, 
  History, 
  Loader2, 
  Save } from "lucide-react";
import { toast } from "sonner";
import { format, isValid, parseISO } from "date-fns";

import DatePicker from "@/components/ui/Datepicker";
import { Input } from "@/components/ui/input";
import { Button } from "@/src/components/landing/ui/button";
import { adminApi } from "@/lib/api";

type CreditPointsSettingsProps = {
  isDark?: boolean;
};

type SignupCreditPromotionForm = {
  isEnabled: boolean;
  amount: string;
  startDate: string;
  endDate: string;
  isActiveNow: boolean;
};

type CreditPromotionHistoryChange = {
  field: string;
  before: unknown;
  after: unknown;
};

type CreditPromotionHistoryEntry = {
  signup_credit_promo_history_id: number;
  changed_at: string | null;
  change_reason: string | null;
  changed_by_user_id: number | null;
  changed_by: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
  changes: CreditPromotionHistoryChange[];
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const pickFirstValue = (
  source: Record<string, unknown>, 
  keys: string[]
) => {
  for (const key of keys) {
    const value = source[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
};

const pickFirstString = (
  source: Record<string, unknown>, 
  keys: string[]
) => {
  const value = pickFirstValue(source, keys);
  return value === undefined ? "" : String(value);
};

const pickFirstNumber = (
  source: Record<string, unknown>, 
  keys: string[]
) => {
  const value = pickFirstValue(source, keys);
  const parsed = Number(value);
  
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseIsoDateOnly = (value: string) => {
  if (!value) return null;

  const parsed = parseISO(value);
  
  return isValid(parsed) ? parsed : null;
};

const formatDisplayDate = (value: string | null) => {
  if (!value) return "-";
  const parsed = parseISO(value);
  if (!isValid(parsed)) return value;
  return format(parsed, "MMM d, yyyy - h:mm a");
};

const formatValue = (value: unknown) => {
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (value === null || value === undefined || value === "") return "Not set";
  return String(value);
};

const formatChangeLabel = (field: string) => {
  switch (field) {
    case "is_enabled":
      return "Signup credits enabled status changed";
    case "amount":
      return "Credit amount changed";
    case "start_date":
      return "Start date changed";
    case "end_date":
      return "End date changed";
    case "setting":
      return "Initial setting created";
    default:
      return `${field.replace(/_/g, " ")} changed`;
  }
};

const formatFieldChangeText = (change: CreditPromotionHistoryChange) => {
  if (change.field === "setting") {
    return `${formatValue(change.before)} to ${formatValue(change.after)}`;
  }

  if (change.field === "start_date" || change.field === "end_date") {
    const label = change.field === "start_date" ? "Start date" : "End date";
    const before = formatValue(change.before);
    const after = formatValue(change.after);

    if (before === "Not set" && after !== "Not set") {
      return `${label} set to ${after}`;
    }

    if (before !== "Not set" && after === "Not set") {
      return `${label} cleared`;
    }

    return `${label} changed from ${before} to ${after}`;
  }

  return `${formatValue(change.before)} to ${formatValue(change.after)}`;
};

export const CreditPointsSettings = ({ 
  isDark = true 
}: CreditPointsSettingsProps) => {
  const [form, setForm] = useState<SignupCreditPromotionForm>({
    isEnabled: false,
    amount: "250.00",
    startDate: "",
    endDate: "",
    isActiveNow: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showChangeHistory, setShowChangeHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [changeHistory, setChangeHistory] = useState<CreditPromotionHistoryEntry[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const response = await adminApi.getSignupCreditPromotionHistory({
        page: 1,
        limit: 1000,
      });

      if (response?.error) {
        toast.error(response.error);
        return;
      }

      const data = asRecord(response?.data) || {};
      const rows = Array.isArray(data.rows) ? data.rows : [];

      setChangeHistory(
        rows.map((row, index) => {
          const item = asRecord(row) || {};
          const changedBy = asRecord(item.changed_by);
          const rawChanges = Array.isArray(item.changes) ? item.changes : [];

          return {
            signup_credit_promo_history_id: Number(
              item.signup_credit_promo_history_id || index
            ),
            changed_at: item.changed_at ? String(item.changed_at) : null,
            change_reason: item.change_reason ? String(item.change_reason) : null,
            changed_by_user_id: item.changed_by_user_id ? Number(item.changed_by_user_id) : null,
            changed_by: changedBy
              ? {
                  name: changedBy.name ? String(changedBy.name) : null,
                  email: changedBy.email ? String(changedBy.email) : null,
                  role: changedBy.role ? String(changedBy.role) : null,
                }
              : null,
            changes: rawChanges.map((change) => {
              const changeItem = asRecord(change) || {};
              return {
                field: changeItem.field ? String(changeItem.field) : "setting",
                before: changeItem.before ?? null,
                after: changeItem.after ?? null,
              };
            }),
            before: asRecord(item.before),
            after: asRecord(item.after),
          };
        })
      );
    } catch (error) {
      console.error("Failed to load signup credit history:", error);
      toast.error("Failed to load signup credit history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);

      const response = await adminApi.getSignupCreditPromotion();

      if (response?.error) {
        toast.error(response.error);
        return;
      }

      const data = asRecord(response?.data) || {};

      const rawAmount = pickFirstNumber(data, ["amount"]) || 250;
      setForm({
        isEnabled: Boolean(data.is_enabled),
        amount: rawAmount.toFixed(2),
        startDate: pickFirstString(data, ["start_date"]).slice(0, 10),
        endDate: pickFirstString(data, ["end_date"]).slice(0, 10),
        isActiveNow: Boolean(data.is_active_now),
      });
    } catch (error) {
      console.error(
        "Failed to load signup credit promotion:", 
        error
      );

      toast.error("Failed to load signup credit promotion");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (showChangeHistory) {
      void loadHistory();
    }
  }, [loadHistory, showChangeHistory]);

  const historyLabel = useMemo(() => {
    if (historyLoading) return "Loading history...";
    if (changeHistory.length === 0) return "No change history yet";
    return "Complete activity history for signup credits";
  }, [changeHistory.length, historyLoading]);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const rawValue = form.amount.trim();
    const amount = parseFloat(rawValue);

    if (rawValue === "" || Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid signup credit amount");
      return;
    }

   if (
    form.startDate && 
    form.endDate &&
     form.startDate > form.endDate
    ) {
      toast.error("Start date must be before end date");
      return;
    }

    try {
      setSaving(true);

      const response = 
      await adminApi.updateSignupCreditPromotion({
        is_enabled: form.isEnabled,
        amount,
        start_date: form.startDate || null,
        end_date: form.endDate || null,
      });

      if (response?.error) {
        toast.error(response.error);
        return;
      }

      const data = asRecord(response?.data) || {};
      const savedAmount = pickFirstNumber(data, ["amount"]) || amount;
      setForm({
        isEnabled: Boolean(data.is_enabled),
        amount: savedAmount.toFixed(2),
        startDate: pickFirstString(data, ["start_date"]).slice(0, 10),
        endDate: pickFirstString(data, ["end_date"]).slice(0, 10),
        isActiveNow: Boolean(data.is_active_now),
      });

      toast.success("Signup credit promotion updated");
      if (showChangeHistory) {
        await loadHistory();
      }
    } catch (error) {
      console.error(
        "Failed to update signup credit promotion:", 
        error
      );
      toast.error("Failed to update signup credit promotion");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[700px] space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1
            className={`mb-1 text-lg font-semibold transition-colors duration-100 lg:text-2xl lg:leading-[32px] ${
              isDark ? "text-white" : "text-[#000]"
            }`}
          >
            New User Sign up Credits
          </h1>

          <button
            type="button"
            onClick={() => setShowChangeHistory(true)}
            title="View change history"
            aria-label="View change history"
            className={`mb-1 flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              isDark
                ? "bg-white/10 text-white/70 hover:bg-white/15 hover:text-[#E8D1AB]"
                : "bg-black/5 text-black/60 hover:bg-black/10 hover:text-black"
            }`}
          >
            <History size={14} />
          </button>
        </div>

        <p
          className={`text-xs transition-colors duration-100 lg:text-sm ${
            isDark ? "text-white/70" : "text-[#000000B2]"
          }`}
        >
          Credits apply only to users who sign up during the selected date range while this setting is enabled.
        </p>
      </div>

      {/* Enable / Disable */}
      <div
        className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-4 ${
          isDark 
          ? "border-white/15 bg-[#101010]" 
          : "border-[#E5E5E5] bg-[#FAFAFA]"
        }`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">New Client Signup Credits</p>

            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                form.isEnabled && form.isActiveNow
                  ? "bg-emerald-500/15 text-emerald-400"
                  : form.isEnabled
                    ? "bg-amber-500/15 text-amber-300"
                    : isDark
                      ? "bg-white/10 text-white/60"
                      : "bg-black/5 text-black/60"
              }`}
            >
              {form.isEnabled 
              ? (form.isActiveNow 
              ? "Active now" 
              : "Scheduled") 
              : "Disabled"}
            </span>
          </div>

          <p 
          className={`mt-1 text-xs ${
            isDark ? "text-white/55" : "text-black/55"
            }`}
            >
            Credits apply only to users who sign up during the selected date range while this setting is enabled.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={form.isEnabled}
          disabled={loading}
          onClick={() =>
            setForm((current) => ({
              ...current,
              isEnabled: !current.isEnabled,
            }))
          }
          className={`relative h-7 w-12 shrink-0 rounded-full border transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            form.isEnabled
              ? "border-[#E8D1AB] bg-[#E8D1AB]"
              : isDark
                ? "border-white/15 bg-[#242424]"
                : "border-black/15 bg-[#E9E9E9]"
          }`}
        >
          <span
            className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full shadow-sm transition-all ${
              form.isEnabled
                ? "left-[22px] bg-black"
                : isDark
                  ? "left-1 bg-white/70"
                  : "left-1 bg-white"
            }`}
          />
        </button>
      </div>

      {/* Credit Amount */}
      <fieldset
        className={`w-fit rounded-lg border px-4 pb-3 pt-1.5 ${
          isDark ? "border-white/25" : "border-black/20"
        }`}
      >
        <legend
          className={`px-1 text-[11px] leading-none ${
            isDark 
            ? "text-white/55" 
            : "text-black/55"
          }`}
        >
          Credit Amount*
        </legend>

        <div className="flex items-center gap-2">
          <DollarSign 
          size={18} 
          className={
            isDark 
          ? "text-[#E8D1AB]" 
          : "text-black/60"
          }
           />

          <Input
            type="text"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) => {
              const val = event.target.value;
              if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                setForm((current) => ({
                  ...current,
                  amount: val,
                }));
              }
            }}
            onBlur={() => {
              if (form.amount && !Number.isNaN(Number(form.amount))) {
                setForm((prev) => ({
                  ...prev,
                  amount: parseFloat(prev.amount).toFixed(2),
                }));
              }
            }}
            disabled={loading}
            placeholder="250.00"
            className={`h-9 rounded-none border-0 bg-transparent px-0 py-0 text-[14px] focus-visible:ring-0 ${
              isDark
                ? "text-white placeholder:text-white/35"
                : "text-black placeholder:text-black/35"
            }`}
          />
        </div>
      </fieldset>

      <div className="space-y-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div
              className={`flex items-center gap-2 text-xs font-semibold ${
                isDark 
                ? "text-white/65" 
                : "text-black/65"
              }`}
            >
              <CalendarRange size={15} />
              Start Date
            </div>

            <DatePicker
              label=""
              value={parseIsoDateOnly(form.startDate)}
              onChange={(date) => {
                const newStart = date && isValid(date) ? format(date, "yyyy-MM-dd") : "";
                setForm((current) => ({
                  ...current,
                  startDate: newStart,
                  endDate: current.endDate && newStart && current.endDate < newStart ? "" : current.endDate,
                }));
              }}
              minDate={new Date()}
              disabled={loading}
              placeholder="Select start date"
              isDark={isDark}
            />
          </div>

          <div className="space-y-2">
            <div
              className={`flex items-center gap-2 text-xs font-semibold ${
                isDark 
                ? "text-white/65" 
                : "text-black/65"
              }`}
            >
              <CalendarRange size={15} />
              End Date
            </div>

            <DatePicker
              label=""
              value={parseIsoDateOnly(form.endDate)}
              onChange={(date) =>
                setForm((current) => ({
                  ...current,
                  endDate: 
                  date && isValid(date) 
                  ? format(date, "yyyy-MM-dd") 
                  : "",
                }))
              }
              minDate={
                parseIsoDateOnly(form.startDate) || new Date()
              }
              disabled={loading}
              placeholder="Select end date"
              isDark={isDark}
            />
            {(form.startDate || form.endDate) && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, startDate: "", endDate: "" }))}
                  className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    isDark ? "text-white/50 hover:text-white" : "text-black/45 hover:text-black"
                  }`}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`flex justify-end border-t pt-4 ${
          isDark 
          ? "border-white/10" 
          : "border-[#E5E5E5]"
        }`}
      >
        <Button
          type="submit"
          variant="beige"
          disabled={loading || saving}
          className="h-11 rounded-lg px-5 text-sm font-semibold text-black"
        >
          <Save size={17} />

          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
      
      {/* Change History Modal */}
      {showChangeHistory && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowChangeHistory(false)}
        >
          <div
            className={`relative max-h-[85vh] w-full max-w-[650px] overflow-hidden rounded-xl border shadow-2xl ${
              isDark
                ? "border-white/15 bg-[#101010] text-white"
                : "border-[#E5E5E5] bg-white text-black"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between border-b px-5 py-4 ${
                isDark ? "border-white/10" : "border-[#E5E5E5]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    isDark ? "bg-white/10" : "bg-black/5"
                  }`}
                >
                  <History
                    size={18}
                    className={
                      isDark ? "text-[#E8D1AB]" : "text-black/60"
                    }
                  />
                </div>

                <div>
                  <h2 className="text-base font-semibold">Change History</h2>
                  <p 
                  className={`text-xs ${
                    isDark ? "text-white/45" : "text-black/45"
                    }`}
                    >
                    {historyLabel}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowChangeHistory(false)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors ${
                  isDark
                    ? "text-white/50 hover:bg-white/10 hover:text-white"
                    : "text-black/40 hover:bg-black/5 hover:text-black"
                }`}
                aria-label="Close change history"
              >
                x
              </button>
            </div>

            {/* Modal Content */}
            <div className="max-h-[65vh] overflow-y-auto">
              {historyLoading ? (
                <div className="flex items-center justify-center px-5 py-10">
                  <Loader2
                    size={20}
                    className={`animate-spin ${isDark ? "text-[#E8D1AB]" : "text-black/60"}`}
                  />
                </div>
              ) : changeHistory.length === 0 ? (
                <div className={`px-5 py-8 text-sm ${isDark ? "text-white/60" : "text-black/60"}`}>
                  No history records found yet.
                </div>
              ) : (
                changeHistory.map((entry) => {
                  const changedByName =
                    entry.changed_by?.name || entry.changed_by?.email || "Unknown";

                  const resolvedChanges = entry.changes.length
                    ? entry.changes
                    : entry.before && entry.after
                      ? Object.keys(entry.after).map((field) => ({
                          field,
                          before: entry.before?.[field],
                          after: entry.after?.[field],
                        }))
                      : [];

                  return (
                    <div
                      key={entry.signup_credit_promo_history_id}
                      className={`border-b px-5 py-4 last:border-b-0 ${
                        isDark ? "border-white/10" : "border-[#E5E5E5]"
                      }`}
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold">{changedByName}</p>
                          <p className={`text-xs ${isDark ? "text-white/45" : "text-black/45"}`}>
                            {formatDisplayDate(entry.changed_at)}
                          </p>
                        </div>

                        <span
                          className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            isDark ? "bg-white/10 text-white/60" : "bg-black/5 text-black/50"
                          }`}
                        >
                          {resolvedChanges.length}{" "}
                          {resolvedChanges.length === 1 ? "change" : "changes"}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {resolvedChanges.map((change, index) => (
                          <div
                            key={`${entry.signup_credit_promo_history_id}-${change.field}-${index}`}
                            className={`flex items-start gap-2 text-xs ${
                              isDark 
                              ? "text-white/70" 
                              : "text-black/65"
                            }`}
                          >
                            <span
                              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                isDark ? "bg-[#E8D1AB]" : "bg-black/40"
                              }`}
                            />

                            <span>
                              <strong>{formatChangeLabel(change.field)}:</strong>{" "}
                              {formatFieldChangeText(change)}
                            </span>
                          </div>
                        ))}
                        {resolvedChanges.length === 0 && (
                          <div className={`text-xs ${isDark ? "text-white/60" : "text-black/60"}`}>
                            No detailed field changes available.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div
              className={`flex justify-end border-t px-5 py-3 ${
                isDark 
                ? "border-white/10" 
                : "border-[#E5E5E5]"
              }`}
            >
              <Button
                type="button"
                variant="beige"
                onClick={() => setShowChangeHistory(false)}
                className="h-9 rounded-lg px-4 text-xs font-semibold text-black"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

    </form>
  );
};
