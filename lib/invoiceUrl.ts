type InvoiceUrlOptions = {
  manual?: boolean;
  download?: boolean;
  cacheBust?: boolean;
};

export const buildBeigeInvoiceUrl = (
  bookingId: string | number,
  options: InvoiceUrlOptions = {}
) => {
  const { manual = false, download = false, cacheBust = false } = options;
  const params = new URLSearchParams();

  if (manual) params.set("manual", "1");
  if (download) params.set("download", "1");
  if (cacheBust) params.set("t", String(Date.now()));

  const queryString = params.toString();
  return `/beige_invoice/${encodeURIComponent(String(bookingId))}${queryString ? `?${queryString}` : ""}`;
};
