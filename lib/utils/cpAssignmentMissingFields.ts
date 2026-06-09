type UnknownRecord = Record<string, unknown>;

const FIELD_LABELS: Record<string, string> = {
  event_location: "Shoot location",
  location: "Shoot location",
  event_date: "Shoot date",
  date: "Shoot date",
  start_time: "Start time",
  event_start_time: "Start time",
  end_time: "End time",
  event_end_time: "End time",
  onboarding_form: "Onboarding form",
};

const isPresent = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
};

const asRecord = (value: unknown): UnknownRecord | null => {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : null;
};

const getNested = (source: UnknownRecord, keys: string[]) => {
  for (const key of keys) {
    const value = source?.[key];
    if (isPresent(value)) return value;
  }
  return undefined;
};

const collectMissingFieldKeys = (source: UnknownRecord | null | undefined) => {
  if (!source) return [];

  const candidates: UnknownRecord[] = [
    source,
    asRecord(source.data),
    asRecord(source.project),
    asRecord(source.booking),
    asRecord(source.booking_details),
    asRecord(source.converted_booking_details),
    asRecord(source.lead),
    asRecord(source.client_lead),
  ].filter((item): item is UnknownRecord => Boolean(item));

  const explicitMissing = candidates.flatMap((item) => {
    const needsAttention = asRecord(item.needs_attention) || asRecord(item.needsAttention);
    const missingFields = needsAttention?.missing_fields || needsAttention?.missingFields || item.missing_fields;
    return Array.isArray(missingFields) ? missingFields : [];
  });

  const merged = Object.assign({}, ...candidates);
  const bookingDays = Array.isArray(merged.booking_days) ? merged.booking_days.map(asRecord).filter(Boolean) : [];
  const hasBookingDays = bookingDays.some((day) => isPresent(day?.date || day?.event_date));

  const inferredMissing = [
    !isPresent(getNested(merged, ["event_location", "location"])) ? "event_location" : "",
    !isPresent(getNested(merged, ["event_date", "date", "start_date"])) && !hasBookingDays ? "event_date" : "",
    !isPresent(getNested(merged, ["start_time", "event_start_time"])) && !bookingDays.some((day) => isPresent(day?.start_time)) ? "start_time" : "",
    !isPresent(getNested(merged, ["end_time", "event_end_time"])) && !bookingDays.some((day) => isPresent(day?.end_time)) ? "end_time" : "",
  ].filter(Boolean);

  return [...explicitMissing, ...inferredMissing].map((field) => String(field).trim()).filter(Boolean);
};

export const getCpAssignmentMissingDetails = (source: UnknownRecord | null | undefined) => {
  const seen = new Set<string>();

  return collectMissingFieldKeys(source)
    .map((field) => FIELD_LABELS[field.toLowerCase()] || field.replace(/_/g, " "))
    .filter((label) => {
      const key = label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};
