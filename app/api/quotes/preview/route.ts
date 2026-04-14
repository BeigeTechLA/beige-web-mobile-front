import { NextRequest, NextResponse } from "next/server";

import { verifyQuotePreviewToken } from "@/lib/server/quotePreviewToken";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/";

export async function GET(request: NextRequest) {
  const quoteKey = request.nextUrl.searchParams.get("quoteKey");

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

  try {
    const quoteResponse = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/sales/quotes/public/${payload.qid}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const responseData = await quoteResponse.json().catch(() => null);

    if (!quoteResponse.ok) {
      return NextResponse.json(
        responseData || {
          success: false,
          error: "Failed to fetch quote preview.",
        },
        { status: quoteResponse.status }
      );
    }

    return NextResponse.json(responseData, {
      status: quoteResponse.status,
    });
  } catch (error) {
    console.error("Failed to fetch quote preview by key", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch quote preview." },
      { status: 500 }
    );
  }
}
