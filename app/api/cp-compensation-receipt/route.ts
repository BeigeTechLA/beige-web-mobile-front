import { NextRequest } from "next/server";

const getAllowedHosts = () => {
  const urls = [
    process.env.NEXT_PUBLIC_IMG_URL_CDN,
    process.env.NEXT_PUBLIC_IMG_URL,
    process.env.NEXT_PUBLIC_S3_PREFIX,
    "https://beige-web-dev.s3.us-east-1.amazonaws.com/beige/",
    "https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/",
  ].filter(Boolean) as string[];

  return new Set(
    urls
      .map((url) => {
        try {
          return new URL(url).host;
        } catch {
          return "";
        }
      })
      .filter(Boolean)
  );
};

const isAllowedReceiptUrl = (url: URL) => {
  if (!["http:", "https:"].includes(url.protocol)) return false;
  if (!getAllowedHosts().has(url.host)) return false;

  const isBeigeS3Host = /^beige-web-(dev|prod)\.s3\.us-east-1\.amazonaws\.com$/i.test(url.host);
  if (isBeigeS3Host) {
    return url.pathname.startsWith("/beige/");
  }

  return true;
};

const sanitizeFilename = (value?: string | null) => {
  const fallback = "cp-receipt.pdf";
  const raw = String(value || fallback).split("?")[0].split("/").filter(Boolean).pop() || fallback;
  return raw.replace(/[^a-zA-Z0-9._-]/g, "_") || fallback;
};

export async function GET(request: NextRequest) {
  const fileUrl = request.nextUrl.searchParams.get("url");
  const disposition = request.nextUrl.searchParams.get("disposition") === "attachment" ? "attachment" : "inline";
  const filename = sanitizeFilename(request.nextUrl.searchParams.get("filename") || fileUrl);

  if (!fileUrl) {
    return new Response("Receipt URL is required", { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(fileUrl);
  } catch {
    return new Response("Invalid receipt URL", { status: 400 });
  }

  if (!isAllowedReceiptUrl(parsedUrl)) {
    return new Response("Receipt host is not allowed", { status: 403 });
  }

  const upstream = await fetch(parsedUrl.toString(), { cache: "no-store" });
  if (!upstream.ok) {
    return new Response("Receipt file could not be loaded", { status: upstream.status });
  }

  const upstreamContentType = upstream.headers.get("content-type") || "";
  const isPdf = /\.pdf(?:$|\?)/i.test(parsedUrl.pathname) || /\.pdf$/i.test(filename);
  const contentType = isPdf || !upstreamContentType || upstreamContentType === "application/octet-stream"
    ? "application/pdf"
    : upstreamContentType;
  const body = await upstream.arrayBuffer();

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": contentType,
      "content-disposition": `${disposition}; filename="${filename}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
