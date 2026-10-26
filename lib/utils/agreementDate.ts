import { getBrowserTimeZone, getBrowserTimeZoneLabel } from "@/lib/timezone";

export function formatAgreementDate(value?: string | null, withTime = false): string {
  if (!value) return "—";

  // Keep production dates without a time on their stated calendar day.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const timeZone = getBrowserTimeZone();
  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(date);
  if (!withTime) return datePart;

  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(date);
  return `${datePart}, ${timePart} ${getBrowserTimeZoneLabel(date)}`;
}
