type ReceiptOpenPageProps = {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{
    manual_payment_id?: string;
    payment_id?: string;
  }>;
};

export default async function ReceiptOpenPage({
  params,
  searchParams,
}: ReceiptOpenPageProps) {
  const { bookingId } = await params;
  const query = await searchParams;
  const targetParams = new URLSearchParams();

  targetParams.set("receipt", "1");
  targetParams.set("t", String(Date.now()));

  if (query.manual_payment_id) {
    targetParams.set("manual_payment_id", query.manual_payment_id);
  }

  if (query.payment_id) {
    targetParams.set("payment_id", query.payment_id);
  }

  const receiptUrl = `/beige_invoice/${encodeURIComponent(bookingId)}?${targetParams.toString()}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5] px-6 text-[#171717]">
      <script
        dangerouslySetInnerHTML={{
          __html: `
            const receiptWindow = window.open(${JSON.stringify(receiptUrl)}, "_blank", "noopener,noreferrer");
            if (receiptWindow) {
              window.setTimeout(() => window.history.back(), 300);
            }
          `,
        }}
      />
      <div className="w-full max-w-sm rounded-lg border border-[#e4e4e4] bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">Opening receipt</h1>
        <p className="mt-2 text-sm text-[#666]">
          If the new tab did not open, use the button below.
        </p>
        <a
          href={receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#171717] px-4 text-sm font-semibold text-white"
        >
          Open Receipt
        </a>
      </div>
    </main>
  );
}
