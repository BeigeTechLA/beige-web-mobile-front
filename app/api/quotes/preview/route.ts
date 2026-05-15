import { NextRequest, NextResponse } from "next/server";

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

  try {
    const quoteResponse = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/sales/quotes/public/by-key/${encodeURIComponent(quoteKey)}`,
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
