"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CalendarRange, DollarSign, Save } from "lucide-react";
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

export const CreditPointsSettings = ({
  isDark = true,
}: CreditPointsSettingsProps) => {
  const [form, setForm] = useState<SignupCreditPromotionForm>({
    isEnabled: false,
    amount: "250",
    startDate: "",
    endDate: "",
    isActiveNow: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);

      const response = await adminApi.getSignupCreditPromotion();

      if (response?.error) {
        toast.error(response.error);
        return;
      }

      const data = asRecord(response?.data) || {};

      setForm({
        isEnabled: Boolean(data.is_enabled),
        amount: String(
          pickFirstNumber(data, ["amount"]) || 250
        ),
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

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
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

      setForm({
        isEnabled: Boolean(data.is_enabled),
        amount: String(
          pickFirstNumber(data, ["amount"]) || amount
        ),
        startDate: pickFirstString(data, ["start_date"]).slice(0, 10),
        endDate: pickFirstString(data, ["end_date"]).slice(0, 10),
        isActiveNow: Boolean(data.is_active_now),
      });

      toast.success("Signup credit promotion updated");
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
        <h1
          className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${
            isDark ? "text-white" : "text-[#000]"
          }`}
        >
          New User Sign up Credits
        </h1>

        <p
          className={`text-xs lg:text-sm transition-colors duration-100 ${
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
            <p className="text-sm font-semibold">
              New Client Signup Credits
            </p>

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
                ? form.isActiveNow
                  ? "Active now"
                  : "Scheduled"
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
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                amount: event.target.value,
              }))
            }
            disabled={loading}
            placeholder="250"
            className={`h-9 rounded-none border-0 bg-transparent px-0 py-0 text-[14px] focus-visible:ring-0 ${
              isDark
                ? "text-white placeholder:text-white/35"
                : "text-black placeholder:text-black/35"
            }`}
          />
        </div>
      </fieldset>

      {/* Dates */}
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
            onChange={(date) =>
              setForm((current) => ({
                ...current,
                startDate:
                  date && isValid(date)
                    ? format(date, "yyyy-MM-dd")
                    : "",
              }))
            }
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
              parseIsoDateOnly(form.startDate) || undefined
            }
            disabled={loading}
            placeholder="Select end date"
            isDark={isDark}
          />
        </div>
      </div>

      {/* Save */}
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
    </form>
  );
};
