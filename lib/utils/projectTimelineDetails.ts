import type { PostProductionTimelineDetails, RevisionVersionTimelineDetails } from "@/lib/types";

type TimelineDetailsSource = Record<string, unknown> | null | undefined;

const asRecord = (value: unknown): Record<string, unknown> | null => {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
};

const getRecordValue = (source: TimelineDetailsSource, keys: string[]) => {
  if (!source) return null;

  for (const key of keys) {
    const value = source[key];
    const record = asRecord(value);
    if (record) return record;
  }

  return null;
};

const getArrayValue = (source: TimelineDetailsSource, keys: string[]) => {
  if (!source) return null;

  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) return value;
  }

  return null;
};

export const getProjectTimelineDetails = (...sources: TimelineDetailsSource[]) => {
  const expandedSources = sources.flatMap((source) => {
    const record = asRecord(source);
    if (!record) return [];

    return [
      record,
      asRecord(record.data),
      asRecord(record.project),
      asRecord(asRecord(record.data)?.project),
    ].filter(Boolean) as Record<string, unknown>[];
  });

  for (const source of expandedSources) {
    const postProduction = getRecordValue(source, [
      "postProduction",
      "post_production",
      "postproduction",
    ]);
    const revisionVersions = getArrayValue(source, [
      "revisionVersions",
      "revision_versions",
      "revisions",
    ]);

    if (postProduction || revisionVersions) {
      return {
        postProduction: (postProduction || null) as PostProductionTimelineDetails | null,
        revisionVersions: (revisionVersions || []) as RevisionVersionTimelineDetails[],
      };
    }
  }

  return {
    postProduction: null,
    revisionVersions: [],
  };
};

const normalizeText = (value: unknown) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const getNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getTimelineDetailsFromPostProductionFiles = (source: unknown) => {
  const record = asRecord(source);
  const data = asRecord(record?.data);
  const folders = (Array.isArray(record?.folders) ? record?.folders : data?.folders) || [];
  const files = (Array.isArray(record?.files) ? record?.files : data?.files) || [];

  const rawFilesUploaded = folders.some((folder) => {
    const folderRecord = asRecord(folder);
    const name = normalizeText(folderRecord?.title ?? folderRecord?.name ?? folderRecord?.path);
    const count = getNumber(
      folderRecord?.fileCount ??
      folderRecord?.file_count ??
      folderRecord?.files_count ??
      folderRecord?.items_count ??
      folderRecord?.count
    );

    return name.includes("rawfootage") && count > 0;
  }) || files.some((file) => {
    const fileRecord = asRecord(file);
    return normalizeText(fileRecord?.path ?? fileRecord?.filepath ?? fileRecord?.folder ?? fileRecord?.name).includes("rawfootage");
  });

  return {
    postProduction: rawFilesUploaded
      ? {
        rawFilesUploaded: true,
      }
      : null,
    revisionVersions: [],
  };
};

const getVersionNumberFromValue = (value: unknown) => {
  const text = String(value || "");
  const explicitVersion = text.match(/version[\s_-]*(\d+)/i);
  if (explicitVersion?.[1]) return Number(explicitVersion[1]);

  const shortVersion = text.match(/(?:^|[^a-z])v[\s_-]*(\d+)/i);
  if (shortVersion?.[1]) return Number(shortVersion[1]);

  return null;
};

export const getTimelineDetailsFromRevisionFiles = (source: unknown) => {
  const record = asRecord(source);
  const data = asRecord(record?.data);
  const folders = (Array.isArray(record?.folders) ? record?.folders : data?.folders) || [];
  const files = (Array.isArray(record?.files) ? record?.files : data?.files) || [];
  const versions = new Set<number>();

  [...folders, ...files].forEach((item) => {
    const itemRecord = asRecord(item);
    const directVersion =
      itemRecord?.versionNumber ??
      itemRecord?.version_number ??
      itemRecord?.version ??
      itemRecord?.currentVersion ??
      itemRecord?.current_version ??
      asRecord(itemRecord?.metadata)?.currentVersion ??
      asRecord(itemRecord?.metadata)?.current_version;

    const parsedDirect = Number(directVersion);
    if (Number.isFinite(parsedDirect) && parsedDirect > 0) {
      versions.add(parsedDirect);
      return;
    }

    const parsedFromText = getVersionNumberFromValue(
      itemRecord?.title ?? itemRecord?.name ?? itemRecord?.path ?? itemRecord?.filepath
    );
    if (parsedFromText) {
      versions.add(parsedFromText);
    }
  });

  return {
    postProduction: null,
    revisionVersions: [...versions]
      .sort((a, b) => a - b)
      .map((versionNumber) => ({ versionNumber })),
  };
};

export const mergeProjectTimelineDetails = (
  primary: ReturnType<typeof getProjectTimelineDetails>,
  fallback: ReturnType<typeof getTimelineDetailsFromPostProductionFiles>
) => {
  return {
    postProduction: {
      ...(fallback.postProduction || {}),
      ...(primary.postProduction || {}),
      rawFilesUploaded:
        primary.postProduction?.rawFilesUploaded ??
        primary.postProduction?.raw_files_uploaded ??
        fallback.postProduction?.rawFilesUploaded,
    } as PostProductionTimelineDetails | null,
    revisionVersions: primary.revisionVersions.length > 0
      ? primary.revisionVersions
      : fallback.revisionVersions,
  };
};
