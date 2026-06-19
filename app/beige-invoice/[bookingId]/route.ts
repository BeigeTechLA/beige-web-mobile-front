import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  const parsedBookingId = Number(bookingId);

  if (!Number.isInteger(parsedBookingId) || parsedBookingId <= 0) {
    return NextResponse.json(
      { success: false, error: "Invalid booking ID" },
      { status: 400 }
    );
  }

  const sourceUrl = new URL(
    `${API_BASE_URL.replace(/\/$/, "")}/sales/invoice-pdf/${parsedBookingId}`
  );
  const manual = request.nextUrl.searchParams.get("manual");
  const receipt = request.nextUrl.searchParams.get("receipt");
  const manualPaymentId = request.nextUrl.searchParams.get("manual_payment_id");
  const paymentId = request.nextUrl.searchParams.get("payment_id");
  const stripe = request.nextUrl.searchParams.get("stripe");
  const download = request.nextUrl.searchParams.get("download");

  if (manual) sourceUrl.searchParams.set("manual", manual);
  if (receipt) sourceUrl.searchParams.set("receipt", receipt);
  if (manualPaymentId) sourceUrl.searchParams.set("manual_payment_id", manualPaymentId);
  if (paymentId) sourceUrl.searchParams.set("payment_id", paymentId);
  if (stripe) sourceUrl.searchParams.set("stripe", stripe);
  if (download) sourceUrl.searchParams.set("download", download);

  try {
    const upstreamResponse = await fetch(sourceUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text().catch(() => "");
      return NextResponse.json(
        {
          success: false,
          error: errorText || "Failed to fetch invoice PDF",
        },
        { status: upstreamResponse.status }
      );
    }

    const pdfBuffer = await upstreamResponse.arrayBuffer();
    const contentType =
      upstreamResponse.headers.get("content-type") || "application/pdf";
    const contentDisposition =
      upstreamResponse.headers.get("content-disposition") ||
      `inline; filename="beige-invoice-${parsedBookingId}.pdf"`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Failed to proxy beige invoice", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoice PDF" },
      { status: 500 }
    );
  }
}
