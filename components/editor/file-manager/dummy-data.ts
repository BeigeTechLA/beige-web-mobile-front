import type { ActivityEntry, FileItem, FolderItem, Person, ShootFolderSummary } from "./types";

/* Dummy data for the editor folder-details flow (swap for API data later). */

export const DUMMY_SHOOT_FOLDER: ShootFolderSummary = {
  id: "ws-101",
  shootCode: "#123456",
  service: "Photo Retouching",
  title: "Nike Holiday Campaign",
  initials: "NH",
  projectName: "Nike Holiday Campaign",
  producer: "Sam Rivera",
  editorType: "External Editor",
  reviewerName: "Maya Chen",
  isLinked: true,
  dueInDays: 5,
  linkedOn: "2024-01-15",
  photosToEdit: 180,
  videosToEdit: 20,
  requiredDeliverables: 200,
  deliverableLabel: "Edited photography",
  editing: {
    requirements: "Campaign master + social cutdowns",
    deliverables: "7 final exports and editable archive",
    format: "4K ProRes + H.264 social",
    dueDate: "2026-10-26",
    revisions: "2 rounds included",
    brief: "Match approved treatment and preserve project LUTs, music cues and brand typography across all cutdowns.",
  },
};

const DP: Person = { name: "Daniel Park", initials: "DP" };
export const JOHN: Person = { name: "John Smith", initials: "JS" };

/** File Manager tab – top-level folders */
export const ROOT_FOLDERS: FolderItem[] = [
  { id: "raw", name: "Raw Footage", countLabel: "800 Items", tag: "Holiday Campaign", isLinked: true, opened: { by: DP, label: "Opened 2 hours ago" } },
  { id: "edits", name: "Edits", countLabel: "03 Files", tag: "Holiday Campaign", isLinked: true, opened: { by: DP, label: "Opened 2 hours ago" } },
  { id: "final", name: "Final Deliverables", countLabel: "00 Items", tag: "Holiday Campaign", isLinked: true, opened: { by: DP, label: "Opened 2 hours ago" } },
];

/** Inside "Edits" */
export const EDITS_SUBFOLDERS: FolderItem[] = [
  { id: "selected", name: "Selected for Edits", countLabel: "200 Items", callout: "Edits Needed", info: "Files the client selected for editing", uploaded: { by: JOHN, at: "2026-01-10T10:00:00" } },
  { id: "deliverables", name: "Edited Deliverables", countLabel: "0 Files", callout: "Upload Edited Files", info: "Upload your edited files here for approval", uploaded: { by: JOHN, at: "2026-01-10T10:00:00" } },
  { id: "revisions", name: "Revisions", countLabel: "02 Files", info: "Files sent back with revision notes", uploaded: { by: JOHN, at: "2026-01-10T10:00:00" } },
];

const pad = (n: number, len = 3) => String(n).padStart(len, "0");

/** 200 client-selected files (one image, then mostly videos – like the design) */
export const SELECTED_FILES: FileItem[] = Array.from({ length: 200 }, (_, i) => {
  const n = i + 1;
  const isImage = n % 3 === 1;
  return {
    id: `sel-${n}`,
    code: `#${12345 + i}`,
    name: isImage ? `IMG_${pad(n)}.jpg` : `Video_${pad(n)}.mp4`,
    version: "RAW_V1",
    versionNumber: 1,
    isLatest: true,
    sizeLabel: isImage ? "4.5 MB" : "150.5 MB",
    kind: isImage ? "image" : "video",
    status: "selected_for_edits",
    referenceLink: "https://www.dummywebsite.com",
    referenceMessage: "I need some smooth transitions between the different files/screens and a warmer grade on the hero shots.",
    uploadedBy: JOHN,
    uploadedAt: "2026-01-10T10:00:00",
    updatedAt: "2026-02-14T09:00:00",
    comments: n === 1 ? [] : [{ id: `c-${n}`, author: JOHN, text: "Please keep the skin tones natural.", at: "2026-01-10T10:20:00" }],
  };
});

/** The logged-in editor (uploads are attributed to them) */
export const CURRENT_EDITOR: Person = { name: "Zara Khan", initials: "ZK" };

/** Reviewer who sends revision feedback */
export const REVIEWER: Person = { name: "Maya Chen", initials: "MC" };

/** Files sent back per revision cycle (capped by how many were submitted) */
export const REVISION_BATCH_SIZE = 25;

/** Feedback attached to files sent back for revision */
export const REVISION_FEEDBACK = [
  "Lift the shadows on the face slightly and warm up the skin tones.",
  "Crop tighter on the product – the logo should sit on the left third.",
  "Reduce the grain and match the colour grade of the hero shot.",
];

/** Activity that happened before the editor opened the folder */
export const SEED_ACTIVITY: ActivityEntry[] = [
  { id: "a-assigned", title: "Shoot Assigned for Edits", at: "2026-10-16T16:10:00" },
  { id: "a-raw", title: "Raw File Available", at: "2026-10-16T16:12:00" },
  { id: "a-selection", title: "Client Selection Received", at: "2026-10-16T16:15:00" },
];
