import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_ENDPOINT || "https://revure-api.beige.app/v1/";

const normalizeQuoteId = (value: unknown) => {
  const normalized = String(value ?? "").trim();

  if (!normalized || !/^\d+$/.test(normalized)) {
    return null;
  }

  return normalized;
};

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("revure_token")?.value;

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const quoteId = normalizeQuoteId(body?.quoteId);

    if (!quoteId) {
      return NextResponse.json(
        { success: false, error: "A valid quote id is required." },
        { status: 400 }
      );
    }

    const quoteResponse = await fetch(
      `${API_BASE_URL.replace(/\/$/, "")}/sales/quotes/${quoteId}/preview-link`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const responseData = await quoteResponse.json().catch(() => null);

    if (!quoteResponse.ok || responseData?.success === false) {
      return NextResponse.json(
        {
          success: false,
          error:
            typeof responseData?.message === "string"
              ? responseData.message
              : "Failed to create quote preview link.",
        },
        { status: quoteResponse.status }
      );
    }

    const quoteKey = String(responseData?.data?.quote_key ?? "").trim();
    if (!quoteKey) {
      return NextResponse.json(
        { success: false, error: "Quote preview link is unavailable." },
        { status: 500 }
      );
    }

    const previewUrl = `/quotes/preview?quoteKey=${encodeURIComponent(quoteKey)}`;

    return NextResponse.json({
      success: true,
      data: {
        quoteKey,
        previewUrl,
      },
    });
  } catch (error) {
    console.error("Failed to create quote preview token", error);

    return NextResponse.json(
      { success: false, error: "Failed to create quote preview link." },
      { status: 500 }
    );
  }
}
