type CrewFileLike = {
  file_type?: unknown;
  file_path?: unknown;
  is_active?: unknown;
  created_at?: unknown;
  crew_files_id?: unknown;
  id?: unknown;
};

export const getLatestCrewFileByType = <T extends CrewFileLike>(
  files: T[] | null | undefined,
  fileType: string
): T | null => {
  if (!Array.isArray(files)) return null;

  const matchingFiles = files.filter((file) => {
    if (!file || file.file_type !== fileType || !file.file_path) return false;
    return file.is_active === undefined || file.is_active === null || Number(file.is_active) === 1;
  });

  if (matchingFiles.length === 0) return null;

  return [...matchingFiles].sort((a, b) => {
    const aCreated = a.created_at ? new Date(String(a.created_at)).getTime() : 0;
    const bCreated = b.created_at ? new Date(String(b.created_at)).getTime() : 0;

    if (bCreated !== aCreated) return bCreated - aCreated;

    const aId = Number(a.crew_files_id ?? a.id ?? 0);
    const bId = Number(b.crew_files_id ?? b.id ?? 0);
    return bId - aId;
  })[0];
};

export const getLatestProfilePhoto = <T extends CrewFileLike>(
  files: T[] | null | undefined
): T | null => getLatestCrewFileByType(files, "profile_photo");
