import type { SalesQuoteDetailData } from "@/lib/api";

export type QuotePreProductionFile = {
  name: string;
  type: string;
  size?: number | string | null;
  content?: string | null;
  path?: string | null;
  url?: string | null;
};

const getText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const S3_PREFIX =
  process.env.NEXT_PUBLIC_S3_PREFIX ||
  "https://beige-web-prod.s3.us-east-1.amazonaws.com/beige/";

const buildS3AssetUrl = (value: string) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return null;
  }

  if (/^https?:\/\//i.test(normalizedValue) && !/localhost|127\.0\.0\.1|::1/i.test(normalizedValue)) {
    return normalizedValue;
  }

  const baseUrl = S3_PREFIX.replace(/\/+$/, "");
  const assetPath = normalizedValue
    .replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/?/i, "")
    .replace(/^\/+/, "");

  return assetPath ? `${baseUrl}/${assetPath}` : null;
};

export const getQuotePreProductionNotes = (
  quote: SalesQuoteDetailData | null | undefined
) =>
  getText(
    quote?.pre_production_notes,
    quote?.preProductionNotes,
    (quote as Record<string, unknown> | null | undefined)?.pre_production_note
  );

export const getQuotePreProductionFile = (
  quote: SalesQuoteDetailData | null | undefined
): QuotePreProductionFile | null => {
  if (!quote) {
    return null;
  }

  const record = quote as Record<string, unknown>;
  const nestedFile =
    record.pre_production_file && typeof record.pre_production_file === "object"
      ? (record.pre_production_file as Record<string, unknown>)
      : {};
  const name = getText(
    record.pre_production_file_name,
    record.preProductionFileName,
    nestedFile.name
  );
  const content = getText(
    record.pre_production_file_content,
    record.preProductionFileContent,
    nestedFile.content
  );
  const url = getText(
    record.pre_production_file_url,
    record.preProductionFileUrl,
    nestedFile.url
  );
  const filePath = getText(
    record.pre_production_file_path,
    record.preProductionFilePath,
    nestedFile.path
  );

  if (!name && !content && !url && !filePath) {
    return null;
  }

  return {
    name: name || "pre-production-file",
    type:
      getText(
        record.pre_production_file_type,
        record.preProductionFileType,
        nestedFile.type
      ) || "application/octet-stream",
    size:
      (record.pre_production_file_size as number | string | null | undefined) ??
      (nestedFile.size as number | string | null | undefined) ??
      null,
    content,
    path: filePath,
    url,
  };
};

export const buildQuotePreProductionFileHref = (
  file: QuotePreProductionFile | null
) => {
  if (!file) {
    return null;
  }

  if (file.path) {
    return buildS3AssetUrl(String(file.path));
  }

  if (file.url) {
    return buildS3AssetUrl(file.url);
  }

  if (!file.content) {
    return null;
  }

  const content = file.content.replace(/^data:.*;base64,/, "").trim();
  return `data:${file.type || "application/octet-stream"};base64,${content}`;
};
