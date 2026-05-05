import {
  PermissionMatrixRow,
  PermissionUser,
  RoleCardData,
} from "@/components/admin/roles-permissions/types";

export const roleCards: RoleCardData[] = [
  {
    id: "admin-1",
    name: "Admin",
    usersLabel: "Total 4 users",
    description:
      "Full access to all functionalities & settings. Can manage users, roles, & configurations.",
    members: [
      { id: "al", label: "AL", tone: "bg-[#E7DDD0] text-[#161616]", avatarSrc: "/images/avatar.png" },
      { id: "mr", label: "MR", tone: "bg-[#F1C7E6] text-[#161616]", avatarSrc: "/images/avatar2.png" },
      { id: "jl", label: "JL", tone: "bg-[#D9D0FF] text-[#161616]", avatarSrc: "/images/misc/profile.png" },
      { id: "sk", label: "SK", tone: "bg-[#D8ECF8] text-[#161616]", avatarSrc: "/images/avatar.png" },
    ],
  },
  {
    id: "admin-2",
    name: "Admin",
    usersLabel: "Total 7 users",
    description:
      "Full access to all functionalities & settings. Can manage users, roles, & configurations.",
    members: [
      { id: "al", label: "AL", tone: "bg-[#E7DDD0] text-[#161616]", avatarSrc: "/images/avatar.png" },
      { id: "mr", label: "MR", tone: "bg-[#F1C7E6] text-[#161616]", avatarSrc: "/images/avatar2.png" },
      { id: "jl", label: "JL", tone: "bg-[#D9D0FF] text-[#161616]", avatarSrc: "/images/misc/profile.png" },
      { id: "more", label: "+4", tone: "bg-[#ECD7AD] text-[#161616]", isCountBadge: true },
    ],
  },
  {
    id: "admin-3",
    name: "Admin",
    usersLabel: "Total 10 users",
    description:
      "Full access to all functionalities & settings. Can manage users, roles, & configurations.",
    members: [
      { id: "al", label: "AL", tone: "bg-[#F3E8C6] text-[#161616]", avatarSrc: "/images/avatar.png" },
      { id: "mr", label: "MR", tone: "bg-[#F1C7E6] text-[#161616]", avatarSrc: "/images/avatar2.png" },
      { id: "jl", label: "JL", tone: "bg-[#D9D0FF] text-[#161616]", avatarSrc: "/images/misc/profile.png" },
      { id: "more", label: "+7", tone: "bg-[#ECD7AD] text-[#161616]", isCountBadge: true },
    ],
  },
  {
    id: "admin-4",
    name: "Admin",
    usersLabel: "Total 6 users",
    description:
      "Full access to all functionalities & settings. Can manage users, roles, & configurations.",
    members: [
      { id: "al", label: "AL", tone: "bg-[#F3E8C6] text-[#161616]", avatarSrc: "/images/avatar.png" },
      { id: "mr", label: "MR", tone: "bg-[#F1C7E6] text-[#161616]", avatarSrc: "/images/avatar2.png" },
      { id: "jl", label: "JL", tone: "bg-[#D9D0FF] text-[#161616]", avatarSrc: "/images/misc/profile.png" },
      { id: "more", label: "+3", tone: "bg-[#ECD7AD] text-[#161616]", isCountBadge: true },
    ],
  },
  {
    id: "admin-5",
    name: "Admin",
    usersLabel: "Total 8 users",
    description:
      "Full access to all functionalities & settings. Can manage users, roles, & configurations.",
    members: [
      { id: "al", label: "AL", tone: "bg-[#E7DDD0] text-[#161616]", avatarSrc: "/images/avatar.png" },
      { id: "mr", label: "MR", tone: "bg-[#F1C7E6] text-[#161616]", avatarSrc: "/images/avatar2.png" },
      { id: "jl", label: "JL", tone: "bg-[#D9D0FF] text-[#161616]", avatarSrc: "/images/misc/profile.png" },
      { id: "more", label: "+5", tone: "bg-[#ECD7AD] text-[#161616]", isCountBadge: true },
    ],
  },
];

export const permissionUsers: PermissionUser[] = [
  {
    id: 1,
    name: "Prince Carter",
    subtitle: "Jan 13, 2026",
    role: "Admin",
    created: "02/02/2026 - 2:30PM",
    updated: "06/03/2025 - 1:00PM",
    status: "Active",
    badge: "PC",
    badgeTone: "bg-[#F1C7E6] text-[#161616]",
  },
  {
    id: 2,
    name: "Ethan Carter",
    subtitle: "Jan 13, 2026",
    role: "Sales",
    created: "02/02/2026 - 2:30PM",
    updated: "06/03/2025 - 1:00PM",
    status: "In-Active",
    badge: "EC",
    badgeTone: "bg-[#F6E8C6] text-[#161616]",
  },
  {
    id: 3,
    name: "Maya Ross",
    subtitle: "Jan 13, 2026",
    role: "User",
    created: "02/02/2026 - 2:30PM",
    updated: "06/03/2025 - 1:00PM",
    status: "Active",
    badge: "MR",
    badgeTone: "bg-[#D9F6BE] text-[#161616]",
  },
  {
    id: 4,
    name: "Daniel Roberts",
    subtitle: "Jan 13, 2026",
    role: "Production",
    created: "02/02/2026 - 2:30PM",
    updated: "06/03/2025 - 1:00PM",
    status: "Active",
    badge: "DR",
    badgeTone: "bg-[#F5F5F5] text-[#161616]",
  },
  {
    id: 5,
    name: "John Lee",
    subtitle: "Jan 13, 2026",
    role: "Admin",
    created: "02/02/2026 - 2:30PM",
    updated: "06/03/2025 - 1:00PM",
    status: "In-Active",
    badge: "JL",
    badgeTone: "bg-[#F2E7D3] text-[#161616]",
  },
  {
    id: 6,
    name: "Jake Ross",
    subtitle: "Jan 13, 2026",
    role: "User",
    created: "02/02/2026 - 2:30PM",
    updated: "06/03/2025 - 1:00PM",
    status: "In-Active",
    badge: "JR",
    badgeTone: "bg-[#D9F6BE] text-[#161616]",
  },
  {
    id: 7,
    name: "Sophia Johnson",
    subtitle: "Jan 13, 2026",
    role: "Sales",
    created: "02/02/2026 - 2:30PM",
    updated: "06/03/2025 - 1:00PM",
    status: "Active",
    badge: "SJ",
    badgeTone: "bg-[#D8D0C9] text-[#161616]",
  },
];

export const basePermissions: PermissionMatrixRow[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    selected: true,
    access: { view: true, create: true, edit: true, delete: true },
  },
  {
    id: "shoots",
    label: "Shoots",
    selected: true,
    access: { view: true, create: false, edit: false, delete: false },
  },
  {
    id: "file-manager",
    label: "File Manager",
    selected: true,
    access: { view: true, create: false, edit: false, delete: false },
  },
  {
    id: "messages",
    label: "Messages",
    selected: true,
    access: { view: true, create: false, edit: false, delete: false },
  },
  {
    id: "availability",
    label: "Availability",
    selected: false,
    access: { view: false, create: false, edit: false, delete: false },
  },
  {
    id: "meetings",
    label: "Meetings",
    selected: true,
    access: { view: true, create: false, edit: false, delete: false },
  },
  {
    id: "studios",
    label: "Studios",
    selected: true,
    access: { view: true, create: false, edit: false, delete: false },
  },
  {
    id: "sales-representative",
    label: "Sales Representative",
    selected: true,
    access: { view: true, create: false, edit: false, delete: false },
  },
  {
    id: "users",
    label: "Users",
    selected: true,
    access: { view: true, create: false, edit: false, delete: false },
  },
];
