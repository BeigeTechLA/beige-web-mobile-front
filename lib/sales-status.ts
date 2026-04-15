"use client";

export type SalesStatusPayload = {
  is_available?: unknown;
  isAvailable?: unknown;
  available?: unknown;
  reason?: unknown;
  unavailable_reason?: unknown;
  unavailableReason?: unknown;
};

export type SalesStatusResponse = {
  data?: SalesStatusPayload;
  is_available?: unknown;
  isAvailable?: unknown;
  success?: boolean;
  error?: string;
};

export type SalesUserLike = {
  user_type_id?: unknown;
  userTypeId?: unknown;
  role?: unknown;
  userRole?: unknown;
} | null | undefined;

export const parseSalesAvailabilityStatus = (
  response: SalesStatusResponse | null | undefined
) => {
  const payload = response?.data ?? response ?? {};
  const rawAvailability =
    payload.is_available ??
    payload.isAvailable ??
    payload.available ??
    response?.is_available ??
    response?.isAvailable;
  const rawReason =
    payload.reason ??
    payload.unavailable_reason ??
    payload.unavailableReason;

  return {
    isAvailable:
      rawAvailability === true ||
      rawAvailability === 1 ||
      rawAvailability === "1",
    reason: typeof rawReason === "string" ? rawReason.trim() : "",
  };
};

export const getCurrentUserTypeId = (currentUser: SalesUserLike): number | null => {
  const normalizedUserTypeId = Number(
    currentUser?.user_type_id ?? currentUser?.userTypeId
  );

  return Number.isFinite(normalizedUserTypeId) ? normalizedUserTypeId : null;
};

export const canManageLiveSalesStatus = (currentUser: SalesUserLike): boolean => {
  const normalizedRole = String(
    currentUser?.role ?? currentUser?.userRole ?? ""
  ).trim().toLowerCase();
  const userTypeId = getCurrentUserTypeId(currentUser);

  return userTypeId === 5 || normalizedRole === "sales_rep";
};

export const isSalesRouteAllowedWhileInactive = (
  pathname: string | null | undefined
) => {
  if (!pathname) {
    return false;
  }

  return (
    pathname === "/sales/dashboard" ||
    pathname.startsWith("/sales/dashboard/") ||
    pathname === "/sales/availability" ||
    pathname.startsWith("/sales/availability/")
  );
};
