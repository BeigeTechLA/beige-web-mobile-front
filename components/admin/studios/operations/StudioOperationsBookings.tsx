"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CalendarDays, CheckCircle2, Clock3, MapPin, XCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { studioOperationsApi } from "@/lib/api";

type BookingStatus = "upcoming" | "completed" | "cancelled";
type JsonRecord = Record<string, unknown>;

const tabs: { label: string; value: BookingStatus }[] = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const toNumber = (value: unknown) => {
  const numericValue = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getText = (value: unknown) => (typeof value === "string" ? value : "");

const getPayload = (response: unknown) => (isRecord(response) && "data" in response ? response.data : response);

const getList = (response: unknown) => {
  const payload = getPayload(response);
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];
  for (const key of ["bookings", "rows", "items", "results"]) {
    if (Array.isArray(payload[key])) return payload[key].filter(isRecord);
  }
  return [];
};

const formatDate = (value: unknown) => {
  if (!value) return "Date not set";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (value: unknown) => {
  if (!value) return "";
  const raw = String(value);
  if (!raw.includes(":")) return raw;
  const [hours, minutes] = raw.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes || 0), 0, 0);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const getNestedRecord = (source: JsonRecord, key: string) => (isRecord(source[key]) ? source[key] : undefined);

const getBookingId = (booking: JsonRecord) =>
  Number(booking.id ?? booking.booking_id ?? booking.studio_booking_id ?? booking.operation_booking_id);

const getBookingImage = (booking: JsonRecord) => {
  const studio = getNestedRecord(booking, "studio");
  const media = booking.media || studio?.media || [];
  if (Array.isArray(media) && isRecord(media[0]) && typeof media[0].url === "string") return media[0].url;
  if (Array.isArray(media) && typeof media[0] === "string") return media[0];
  return "/images/details.jpg";
};

const getBookingCounts = (bookings: JsonRecord[]) =>
  bookings.reduce<Record<BookingStatus, number>>(
    (acc, booking) => {
      const status = String(booking.status || "upcoming").toLowerCase() as BookingStatus;
      if (acc[status] !== undefined) acc[status] += 1;
      return acc;
    },
    { upcoming: 0, completed: 0, cancelled: 0 }
  );

export default function StudioOperationsBookings({
  studioId,
  initialBookings,
  month,
  range,
  loading = false,
}: {
  studioId: number | null;
  initialBookings: JsonRecord[];
  month?: string;
  range?: "all" | "week" | "month";
  loading?: boolean;
}) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeStatus, setActiveStatus] = useState<BookingStatus>("upcoming");
  const [bookings, setBookings] = useState<JsonRecord[]>([]);
  const [fetching, setFetching] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";
  const counts = getBookingCounts(initialBookings || []);

  useEffect(() => {
    if (!studioId) {
      setBookings([]);
      return;
    }

    const fetchBookings = async () => {
      try {
        setFetching(true);
        setError("");
        const response = await studioOperationsApi.getBookings(studioId, { status: activeStatus, month, range });
        if (isRecord(response) && response.success === false) {
          setError(getText(response.error) || "Failed to fetch bookings.");
          setBookings([]);
          return;
        }
        setBookings(getList(response));
      } catch (err) {
        console.error("Failed to fetch operation bookings:", err);
        setError("Failed to fetch bookings.");
      } finally {
        setFetching(false);
      }
    };

    fetchBookings();
  }, [studioId, activeStatus, month, range]);

  const updateStatus = async (bookingId: number, status: BookingStatus) => {
    if (!studioId || !bookingId) return;

    try {
      setUpdatingId(bookingId);
      const response = await studioOperationsApi.updateBookingStatus(studioId, bookingId, status);
      if (isRecord(response) && response.success === false) {
        setError(getText(response.error) || "Failed to update booking status.");
        return;
      }

      setBookings((current) => current.filter((booking) => getBookingId(booking) !== bookingId));
    } catch (err) {
      console.error("Failed to update booking status:", err);
      setError("Failed to update booking status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const showLoading = loading || fetching;

  return (
    <section className={`overflow-hidden rounded-xl border ${isDark ? "border-white/10 bg-[#171717] text-white" : "border-[#E5E5E5] bg-white text-[#101010]"}`}>
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-5">
        <div className="flex items-center gap-2">
          <span className="h-5 w-[3px] rounded-full bg-[#E5D5B8]" />
          <h2 className="text-sm font-medium lg:text-base">Overall Bookings</h2>
        </div>
        <p className={`text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>{month ? `Showing ${month}` : "Showing all months"}</p>
      </div>

      <div className={`grid grid-cols-3 border-y text-center text-xs ${isDark ? "border-white/10 text-white/55" : "border-black/10 text-black/55"}`}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveStatus(tab.value)}
            className={`py-3 transition ${activeStatus === tab.value ? "text-[#E5D5B8] shadow-[inset_0_-1px_0_#E5D5B8]" : ""}`}
          >
            {tab.label} ({counts[tab.value]})
          </button>
        ))}
      </div>

      <div className="px-4 py-6 lg:px-8">
        {error && <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-500">{error}</p>}

        {showLoading ? (
          <div className={`rounded-xl py-12 text-center text-sm ${isDark ? "bg-[#101010] text-white/40" : "bg-[#F4F5F7] text-black/40"}`}>
            Loading bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className={`rounded-xl py-12 text-center text-sm ${isDark ? "bg-[#101010] text-white/40" : "bg-[#F4F5F7] text-black/40"}`}>
            No {activeStatus} bookings found.
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => {
              const bookingId = getBookingId(booking);
              const studio = getNestedRecord(booking, "studio");
              const studioInfo = studio ? getNestedRecord(studio, "info") : undefined;
              const studioAddress = studio ? getNestedRecord(studio, "address") : undefined;
              const studioName = getText(booking.studio_name) || getText(studioInfo?.space_title) || getText(studio?.name) || "Studio booking";
              const startTime = formatTime(booking.start_time);
              const endTime = formatTime(booking.end_time);
              const net = booking.net_earnings ?? booking.amount ?? booking.base_revenue ?? 0;

              return (
                <div key={bookingId || `${booking.booking_date}-${booking.project_name}`} className={`rounded-xl border p-4 shadow-sm lg:p-5 ${isDark ? "border-white/10 bg-[#101010]" : "border-black/10 bg-[#F4F5F7]"}`}>
                  <div className="grid gap-5 lg:grid-cols-[220px_1fr_auto] lg:items-start">
                    <div className="relative h-[160px] overflow-hidden rounded-lg bg-[#252525]">
                      <Image src={getBookingImage(booking)} alt={studioName} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 220px" />
                    </div>

                    <div className="min-w-0">
                      <div className="mb-4">
                        <h3 className="mb-3 text-base font-medium">{studioName}</h3>
                        <div className={`flex flex-wrap gap-4 text-xs ${isDark ? "text-white/50" : "text-black/50"}`}>
                          <span className="flex items-center gap-1.5"><Clock3 size={13} />{startTime || "Start"} - {endTime || "End"}</span>
                          <span className="flex items-center gap-1.5"><MapPin size={13} />{getText(booking.location) || getText(studioAddress?.city) || "Studio"}</span>
                          <span className="flex items-center gap-1.5"><CalendarDays size={13} />{formatDate(booking.booking_date || booking.date)}</span>
                        </div>
                      </div>

                      <div className="grid gap-4 text-xs sm:grid-cols-2">
                        <div>
                          <p className={isDark ? "text-white/40" : "text-black/40"}>Project</p>
                          <p className="mt-1 font-medium">{getText(booking.project_name) || "Untitled project"}</p>
                          <p className={`mt-1 ${isDark ? "text-white/40" : "text-black/40"}`}>Crew: {String(booking.crew_count ?? "-")}</p>
                        </div>
                        <div>
                          <p className={isDark ? "text-white/40" : "text-black/40"}>Contact</p>
                          <p className="mt-1 font-medium">{getText(booking.contact_name) || "-"}</p>
                          <p className={`mt-1 break-all ${isDark ? "text-white/40" : "text-black/40"}`}>{getText(booking.contact_email) || "-"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                      <p className="text-lg font-semibold text-[#E5D5B8]">{moneyFormatter.format(toNumber(net))}</p>
                      {activeStatus === "upcoming" && (
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <button
                            onClick={() => updateStatus(bookingId, "completed")}
                            disabled={updatingId === bookingId}
                            className="flex items-center gap-1.5 rounded-lg bg-[#E5D5B8] px-3 py-2 text-xs font-medium text-black disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} />
                            Complete
                          </button>
                          <button
                            onClick={() => updateStatus(bookingId, "cancelled")}
                            disabled={updatingId === bookingId}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-50 ${isDark ? "border-white/10 text-white/70" : "border-black/10 text-black/70"}`}
                          >
                            <XCircle size={14} />
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
