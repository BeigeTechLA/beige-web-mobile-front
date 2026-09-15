const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  mxf: "application/mxf",
};

/**
 * Browsers leave File.type empty for many professional and binary formats.
 * Upload APIs still require a non-empty Content-Type, so preserve a known MIME
 * type where one exists and use the standard binary fallback for everything else.
 */
export const getUploadContentType = (file: Pick<File, "name" | "type">) => {
  const browserType = String(file.type || "").trim();
  if (browserType) return browserType;

  const extension = String(file.name || "").split(".").pop()?.toLowerCase() || "";
  return MIME_TYPE_BY_EXTENSION[extension] || "application/octet-stream";
};
