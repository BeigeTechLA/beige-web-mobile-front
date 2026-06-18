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
  request.nextUrl.searchParams.forEach((value, key) => {
    if (key === "t" || key === "download") return;
    sourceUrl.searchParams.set(key, value);
  });

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

    const contentType =
      upstreamResponse.headers.get("content-type") || "application/pdf";
    const upstreamDisposition = upstreamResponse.headers.get("content-disposition") || "";
    const upstreamFilename = upstreamDisposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1];
    const isPdfResponse =
      contentType.toLowerCase().includes("application/pdf") ||
      String(upstreamFilename || "").toLowerCase().endsWith(".pdf");

    if (!isPdfResponse) {
      const errorText = await upstreamResponse.text().catch(() => "");
      return NextResponse.json(
        {
          success: false,
          error: errorText || "Invoice PDF endpoint did not return a PDF",
        },
        { status: 502 }
      );
    }

    const pdfBuffer = await upstreamResponse.arrayBuffer();
    const safeFilename = decodeURIComponent(
      String(upstreamFilename || `beige-invoice-${parsedBookingId}.pdf`).replace(/"/g, "")
    );
    const contentDisposition = `inline; filename="${safeFilename}"`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "X-Content-Type-Options": "nosniff",
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
