const toTitleCaseWord = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
};

const getFirstName = (value?: string | null) =>
  String(value || "")
    .replace(/#/g, " ")
    .split(/[\s_]+/)
    .map((part) => part.trim())
    .find(Boolean) || "";

export const formatChatRoomDisplayName = (value?: string | null) => {
  const roomName = String(value || "").trim();
  const isDirectRoomName = /^direct[\s_]+/i.test(roomName);
  const directName = roomName.replace(/^direct[\s_]+/i, "").trim();
  if (isDirectRoomName && directName) return directName;

  const hashId = String(roomName.match(/#\s*([A-Za-z0-9-]+)/)?.[1] || "").trim();
  const roomNameWithoutId = roomName.replace(/#\s*[A-Za-z0-9-]+/g, " ");
  const nameSegments = roomNameWithoutId
    .split("_")
    .map((part) => part.trim())
    .filter(Boolean);
  const clientNameSegment = nameSegments[nameSegments.length - 1] || roomNameWithoutId;
  const firstName = toTitleCaseWord(getFirstName(clientNameSegment));

  if (firstName && hashId) return `${firstName}_#${hashId.replace(/^#/, "")}`;
  if (firstName) return firstName;
  if (roomName) return roomName;
  return "Messages";
};
