const storageKey = (bookingId: number | string) => `guest_booking_access:${bookingId}`;

export type GuestBookingAccess = {
  token: string;
  guestEmail: string;
};

type GuestBookingAccessResponse = {
  booking_id?: number | string;
  guest_email?: string | null;
  guest_booking_access_token?: string | null;
};

export const persistGuestBookingAccess = (
  response: GuestBookingAccessResponse,
  fallbackGuestEmail?: string | null,
) => {
  if (typeof window === "undefined") return false;

  const bookingId = response.booking_id;
  const token = response.guest_booking_access_token?.trim();
  const guestEmail = (response.guest_email || fallbackGuestEmail)?.trim().toLowerCase();
  if (!bookingId || !token || !guestEmail) return false;

  localStorage.setItem(storageKey(bookingId), JSON.stringify({ token, guestEmail }));
  return true;
};

export const getGuestBookingAccess = (bookingId: number | string): GuestBookingAccess | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey(bookingId)) || "null") as GuestBookingAccess | null;
    return stored?.token && stored?.guestEmail ? stored : null;
  } catch {
    return null;
  }
};
