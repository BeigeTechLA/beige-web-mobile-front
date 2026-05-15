import { NextRequest, NextResponse } from "next/server";
import { verifyQuotePreviewToken } from "@/lib/server/quotePreviewToken";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const quoteKey = String(body?.quoteKey || "").trim();

    if (!quoteKey) {
      return NextResponse.json(
        { success: false, error: "A quote key is required." },
        { status: 400 }
      );
    }

    const payload = verifyQuotePreviewToken(quoteKey);
    if (!payload?.qid) {
      return NextResponse.json(
        { success: false, error: "This quote link is invalid or expired." },
        { status: 401 }
      );
    }

    const convertResponse = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/sales/quotes/public/${encodeURIComponent(
        String(payload.qid)
      )}/convert-to-booking`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body?.payload || {}),
        cache: "no-store",
      }
    );

    const responseData = await convertResponse.json().catch(() => null);
    if (!convertResponse.ok) {
      return NextResponse.json(
        responseData || {
          success: false,
          error: "Failed to convert quote to booking.",
        },
        { status: convertResponse.status }
      );
    }

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Failed to convert public quote to booking", error);
    return NextResponse.json(
      { success: false, error: "Failed to convert quote to booking." },
      { status: 500 }
    );
  }
}
