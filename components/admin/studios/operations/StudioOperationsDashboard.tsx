"use client";

import Cookies from "js-cookie";
import { useEffect, useMemo, useState } from "react";
import { studioApi, studioOperationsApi } from "@/lib/api";
import StudioOperationsBookings from "./StudioOperationsBookings";
import StudioOperationsLedger from "./StudioOperationsLedger";
import StudioOperationsOverview from "./StudioOperationsOverview";

type JsonRecord = Record<string, unknown>;

type OperationsState = {
  overview: unknown;
  bookings: JsonRecord[];
  ledger: JsonRecord[];
};

export type OperationsDateFilter = "all" | "week" | "month";
type OperationsRequestParams = {
  range: OperationsDateFilter;
  month?: string;
};

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getPayload = (response: unknown) => (isRecord(response) && "data" in response ? response.data : response);

const getList = (response: unknown, keys: string[]) => {
  const payload = getPayload(response);
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }

  return [];
};

const formatMonth = (date: Date | null) => {
  if (!date) return undefined;
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
};

const getCurrentMonth = () => formatMonth(new Date());

const getText = (value: unknown) => (typeof value === "string" ? value : "");

const getStudioName = (studio: JsonRecord) => {
  const info = isRecord(studio.info) ? studio.info : {};
  return (
    getText(info.space_title) ||
    getText(info.brand_name) ||
    getText(studio.studio_name) ||
    getText(studio.name) ||
    `Studio ${studio.id ?? ""}`.trim()
  );
};

export default function StudioOperationsDashboard({ selectedDate }: { selectedDate?: Date | null }) {
  const [selectedStudioId, setSelectedStudioId] = useState<number | null>(null);
  const [loadingStudios, setLoadingStudios] = useState(true);
  const [loadingOperations, setLoadingOperations] = useState(false);
  const [dateFilter, setDateFilter] = useState<OperationsDateFilter>(selectedDate ? "month" : "all");
  const [error, setError] = useState("");
  const [operations, setOperations] = useState<OperationsState>({
    overview: null,
    bookings: [],
    ledger: [],
  });

  const month = useMemo(() => {
    if (selectedDate) return formatMonth(selectedDate);
    return dateFilter === "month" ? getCurrentMonth() : undefined;
  }, [dateFilter, selectedDate]);

  const operationsParams = useMemo<OperationsRequestParams>(() => ({
    range: selectedDate ? "month" : dateFilter,
    ...(month ? { month } : {}),
  }), [dateFilter, month, selectedDate]);

  useEffect(() => {
    if (selectedDate) setDateFilter("month");
  }, [selectedDate]);

  useEffect(() => {
    const fetchStudios = async () => {
      try {
        setLoadingStudios(true);
        const userCookie = Cookies.get("revure_user");
        const user = userCookie ? JSON.parse(userCookie) : null;
        const userId = user?.id || user?.user_id;

        if (!userId) {
          setError("User not found. Please login again.");
          return;
        }

        const res = await studioApi.getStudiosByUser(Number(userId));
        if (!res?.success) {
          setError(res?.error || "Failed to fetch studios.");
          return;
        }

        const rawStudios = Array.isArray(res.data)
          ? (res.data as unknown[]).filter(isRecord)
          : [];
        const userStudios = rawStudios.filter(
          (studio) => Number(studio.user_id) === Number(userId)
        );

    

        const studioList = userStudios
          .map((studio) => ({
            id: Number(studio.id),
            name: getStudioName(studio),
          }))
          .filter((studio) => Number.isFinite(studio.id));
        setSelectedStudioId((current) => current ?? studioList[0]?.id ?? null);
      } catch (err) {
        console.error("Failed to fetch studio list:", err);
        setError("Failed to fetch studios.");
      } finally {
        setLoadingStudios(false);
      }
    };

    fetchStudios();
  }, []);

  useEffect(() => {
    if (!selectedStudioId) return;

    const fetchOperations = async () => {
      try {
        setLoadingOperations(true);
        setError("");

        const [overviewRes, bookingsRes, ledgerRes] = await Promise.all([
          studioOperationsApi.getOverview(selectedStudioId, operationsParams),
          studioOperationsApi.getBookings(selectedStudioId, operationsParams),
          studioOperationsApi.getLedger(selectedStudioId, operationsParams),
        ]);

        const failed = [overviewRes, bookingsRes, ledgerRes].find((res) => isRecord(res) && res.success === false);
        if (failed) {
          setError(getText(isRecord(failed) ? failed.error : "") || "Failed to fetch studio operations.");
        }

        setOperations({
          overview: getPayload(overviewRes),
          bookings: getList(bookingsRes, ["bookings", "rows", "items", "results"]),
          ledger: getList(ledgerRes, ["ledger", "rows", "items", "transactions", "results"]),
        });
      } catch (err) {
        console.error("Failed to fetch studio operations:", err);
        setError("Failed to fetch studio operations.");
      } finally {
        setLoadingOperations(false);
      }
    };

    fetchOperations();
  }, [selectedStudioId, operationsParams]);

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {error}
        </p>
      )}

      <StudioOperationsOverview
        data={operations.overview}
        loading={loadingOperations || loadingStudios}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
      />
      <StudioOperationsBookings
        studioId={selectedStudioId}
        initialBookings={operations.bookings}
        month={month}
        range={operationsParams.range}
        loading={loadingOperations || loadingStudios}
      />
      <StudioOperationsLedger rows={operations.ledger} loading={loadingOperations || loadingStudios} />
    </div>
  );
}
