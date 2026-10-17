import type { EditorFileCardData } from "@/components/admin/file-manager/EditorFileCard";

export const editorProjects = [
  { id: "123456", name: "Nike Holiday Campaign", service: "Photo Retouching", files: "50/200", status: "In Progress", progress: 25, tint: "from-[#702c25]/55" },
  { id: "234567", name: "Aesop Winter Editorial", service: "Photo Retouching", files: "10/25", status: "Revision Requested", progress: 40, tint: "from-[#92705b]/55" },
  { id: "345678", name: "Rimowa City Stories", service: "Video Editing", files: "48/48", status: "Submitted for Approval", progress: 100, tint: "from-[#354c58]/55" },
  { id: "456789", name: "Studio Product Launch", service: "Photo Retouching", files: "75/200", status: "Submitted for Approval", progress: 38, tint: "from-[#58463b]/55" },
  { id: "567890", name: "Arc'teryx Field Notes", service: "Photo + Video", files: "86/86", status: "Resubmitted", progress: 100, tint: "from-[#3c5940]/45" },
  { id: "678901", name: "Muuto Spring Objects", service: "Photo Retouching", files: "10/25", status: "Approved", progress: 100, tint: "from-[#78613c]/50" },
  { id: "789012", name: "Kinfolk Autumn Collection", service: "Photo + Video", files: "25/25", status: "Completed", progress: 100, tint: "from-[#4a4a3b]/50" },
];

export const editorStatusTabs = [
  "All",
  "In Progress (1)",
  "Submitted for Approval (2)",
  "Revision Requested (1)",
  "Resubmitted (1)",
  "Approved (1)",
  "Completed (1)",
];

export const editorStatusColors: Record<string, string> = {
  "In Progress": "border-[#6d7fd2] text-[#9eafff] bg-[#5363ad]/15",
  "Revision Requested": "border-[#b94a4a] text-[#ed7777] bg-[#b94a4a]/10",
  "Submitted for Approval": "border-[#a345a8] text-[#e077e8] bg-[#a345a8]/10",
  Resubmitted: "border-[#138d94] text-[#20b9c0] bg-[#138d94]/10",
  "Client Review": "border-[#138d94] text-[#20b9c0] bg-[#138d94]/10",
  Approved: "border-[#098d41] text-[#16c05b] bg-[#098d41]/10",
  Completed: "border-[#098d41] text-[#16c05b] bg-[#098d41]/10",
};

export const editorFileCounts = {
  raw: 800,
  selected: 200,
  editedRequired: 200,
  editedUploaded: 75,
  revisionFolders: 2,
  revisionFiles: 25,
};
export const editorLinkedDate = "Jan 15, 2024";
export const editorActivityTime = "October 16 - 4:10PM";

export const editorFileManagerFolders = [
  { title: "Raw Footage", fileCount: editorFileCounts.raw, selected: false },
  { title: "Edits", fileCount: 3, selected: true },
  { title: "Final Deliverables", fileCount: 0, selected: false },
];

export const editorEditSubfolders = [
  { title: "Selected for Edits", fileCount: editorFileCounts.selected },
  { title: "Edited Deliverables", fileCount: 0 },
  { title: "Revisions", fileCount: editorFileCounts.revisionFolders },
];

const editorFileBase: Pick<EditorFileCardData, "id" | "uploaderName" | "uploaderInitials" | "uploadedAt" | "commentCount"> = {
  id: "12345",
  uploaderName: "John Smith",
  uploaderInitials: "JS",
  uploadedAt: "10 Jan, 2026 - 10:00 AM",
  commentCount: 1,
};

export const selectedForEditsFiles: EditorFileCardData[] = [
  {
    ...editorFileBase,
    title: "IMG_001.jpg - RAW_V1",
    contentType: "image/jpeg",
    previewUrl: "/images/details.jpg",
    fileSizeMb: 4.5,
    statusLabel: "File Selected For Edits",
    versionLabel: "Latest",
    referenceLink: "https://www.dummywebsite.com",
    referenceMessage: "I need some smooth transitions between the different files/screens...",
  },
  {
    ...editorFileBase,
    title: "Video_001.mp4 - RAW_V1",
    contentType: "video/mp4",
    fileSizeMb: 150.5,
    statusLabel: "File Selected For Edits",
    versionLabel: "Latest",
    referenceLink: "https://www.dummywebsite.com",
  },
  {
    ...editorFileBase,
    title: "Video_002.mp4 - RAW_V1",
    contentType: "video/mp4",
    fileSizeMb: 150.5,
    statusLabel: "File Selected For Edits",
    versionLabel: "Latest",
    referenceMessage: "I need some smooth transitions between the different files/screens...",
  },
];

export const editedDeliverableFiles: EditorFileCardData[] = [
  {
    ...editorFileBase,
    title: "IMG_001.jpg - RAW_V1",
    contentType: "image/jpeg",
    previewUrl: "/images/details.jpg",
    fileSizeMb: 4.5,
    statusLabel: "Ready for Approval",
    versionLabel: "V1 Latest",
  },
  {
    ...editorFileBase,
    title: "Video_001.mp4 - RAW_V1",
    contentType: "video/mp4",
    fileSizeMb: 150.5,
    statusLabel: "Ready for Approval",
    versionLabel: "V1 Latest",
    uploadedAt: "10 Jan, 2026 - 10:15 AM",
  },
  {
    ...editorFileBase,
    title: "Video_002.mp4 - RAW_V1",
    contentType: "video/mp4",
    fileSizeMb: 150.5,
    statusLabel: "Ready for Approval",
    versionLabel: "V1 Latest",
    uploadedAt: "10 Jan, 2026 - 10:15 AM",
  },
];

export const reviewFiles: EditorFileCardData[] = Array.from({ length: 6 }, (_, index) => ({
  ...editorFileBase,
  id: "12345",
  title: index === 0 || index === 3 ? "IMG_001.jpg - RAW_V1" : "Video_001.mp4 - RAW_V1",
  contentType: index === 0 || index === 3 ? "image/jpeg" : "video/mp4",
  ...(index === 0 || index === 3 ? { previewUrl: "/images/details.jpg" } : {}),
  fileSizeMb: index === 0 || index === 3 ? 4.5 : 150.5,
  versionLabel: "V1 Latest",
  statusLabel: "Waiting for Approval",
}));

export const revisionFiles: EditorFileCardData[] = selectedForEditsFiles.map((file) => ({
  ...file,
  versionLabel: "V1 Latest",
  statusLabel: "Revision Requested",
}));

export const editorActivityItems = [
  { label: "25 Revision Files Uploaded to Version 2", badge: "Waiting for Approval" },
  { label: "25 Revision Files Downloaded from Version 1" },
  { label: "Client Requested Revision" },
  { label: "75 Edited Files Uploaded" },
  { label: "Editing Started Automatically" },
  { label: "Client Selection Received" },
  { label: "Raw File Available" },
  { label: "Shoot Assigned for Edits" },
];
