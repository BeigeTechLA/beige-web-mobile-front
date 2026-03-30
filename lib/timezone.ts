export const getBrowserTimeZone = (): string => {
  if (typeof Intl === "undefined" || !Intl.DateTimeFormat) return "UTC";
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
};

const DATE_TIME_REGEX =
  /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?(?:Z|[+-]\d{2}:?\d{2})?$/;

export const splitLocalDateTime = (
  value?: string | null
): { date: string | null; time: string | null } => {
  if (!value) return { date: null, time: null };
  const trimmed = String(value).trim();
  if (!trimmed) return { date: null, time: null };

  const match = trimmed.match(DATE_TIME_REGEX);
  if (!match) return { date: null, time: null };

  const [, y, m, d, hh = "00", mm = "00", ss = "00"] = match;
  return {
    date: `${y}-${m}-${d}`,
    time: `${hh}:${mm}:${ss}`,
  };
};

export const getLocalDatePart = (value?: string | null) =>
  splitLocalDateTime(value).date;

export const getLocalTimePart = (value?: string | null) =>
  splitLocalDateTime(value).time;

