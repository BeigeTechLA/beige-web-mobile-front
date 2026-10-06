export type NotificationCategory = "Files" | "Payments" | "Messages" | "Shoots" | "Proposals" | "System";
export type NotificationPriority = "Critical" | "High" | "Medium" | "Low";

export type AdminNotification = {
  id: number;
  title: string;
  description: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  timeLabel: string;
  unread: boolean;
  actionLabel: string;
  accent: string;
  initials: string;
  avatarClass: string;
  mention?: boolean;
};

export const defaultAdminNotifications: AdminNotification[] = [
  {
    id: 1,
    title: "Sarah Chen uploaded final deliverables for Summer Campaign 2026",
    description: "12 high-res images ready for client review",
    category: "Files",
    priority: "Critical",
    timeLabel: "5m ago",
    unread: true,
    actionLabel: "Review Files",
    accent: "#FF5A5F",
    initials: "SC",
    avatarClass: "bg-[#F5D8CE] text-[#513429]",
  },
  {
    id: 2,
    title: "Marcus Johnson generated invoice for Project #2847",
    description: "Invoice #INV-2847 - $12,500.00 due June 15, 2026",
    category: "Payments",
    priority: "High",
    timeLabel: "15m ago",
    unread: true,
    actionLabel: "View Invoice",
    accent: "#FFB11B",
    initials: "MJ",
    avatarClass: "bg-[#D8DEEF] text-[#26324A]",
  },
  {
    id: 3,
    title: "Emily Rodriguez mentioned you in Brand Guidelines Discussion",
    description: '"@you Can we adjust the color palette for accessibility?"',
    category: "Messages",
    priority: "High",
    timeLabel: "30m ago",
    unread: true,
    actionLabel: "View Message",
    accent: "#FFB11B",
    initials: "ER",
    avatarClass: "bg-[#D6F0D8] text-[#1D5B35]",
    mention: true,
  },
  {
    id: 4,
    title: "David Kim scheduled a shoot for Product Photography Session",
    description: "May 20, 2026 at 10:00 AM - Studio B",
    category: "Shoots",
    priority: "Medium",
    timeLabel: "1h ago",
    unread: false,
    actionLabel: "View Details",
    accent: "#4776FF",
    initials: "DK",
    avatarClass: "bg-[#E4EFE9] text-[#31483D]",
  },
  {
    id: 5,
    title: "Lisa Anderson approved the proposal for Q3 Marketing Strategy",
    description: "Budget approved: $85,000",
    category: "Proposals",
    priority: "Medium",
    timeLabel: "3h ago",
    unread: false,
    actionLabel: "Open Proposal",
    accent: "#4776FF",
    initials: "LA",
    avatarClass: "bg-[#DCCFEA] text-[#4E3865]",
  },
  {
    id: 6,
    title: "System backup completed successfully",
    description: "All project data was backed up successfully",
    category: "System",
    priority: "Low",
    timeLabel: "4h ago",
    unread: false,
    actionLabel: "View Details",
    accent: "#7B7B7B",
    initials: "SY",
    avatarClass: "bg-[#E2E2E2] text-[#4D4D4D]",
  },
  {
    id: 7,
    title: "Alicia Perez shared new project files",
    description: "8 files added to Brand Refresh 2026",
    category: "Files",
    priority: "Medium",
    timeLabel: "5h ago",
    unread: false,
    actionLabel: "Review Files",
    accent: "#4776FF",
    initials: "AP",
    avatarClass: "bg-[#F4E0D2] text-[#5D3F31]",
  },
  {
    id: 8,
    title: "Payment received for Project #2804",
    description: "$6,800.00 payment received from Northline Studio",
    category: "Payments",
    priority: "Low",
    timeLabel: "7h ago",
    unread: false,
    actionLabel: "View Payment",
    accent: "#7B7B7B",
    initials: "PA",
    avatarClass: "bg-[#D7EFE3] text-[#2C5D47]",
  },
  {
    id: 9,
    title: "New comment in Creative Review",
    description: "A new comment was added to the project discussion",
    category: "Messages",
    priority: "Low",
    timeLabel: "8h ago",
    unread: false,
    actionLabel: "View Message",
    accent: "#7B7B7B",
    initials: "CR",
    avatarClass: "bg-[#E7DDEE] text-[#503B61]",
    mention: true,
  },
  {
    id: 10,
    title: "Shoot details updated for Studio Campaign",
    description: "Call time has been updated to 8:30 AM",
    category: "Shoots",
    priority: "Low",
    timeLabel: "1d ago",
    unread: false,
    actionLabel: "View Details",
    accent: "#7B7B7B",
    initials: "SC",
    avatarClass: "bg-[#DDE8F3] text-[#344B61]",
  },
];

export const ADMIN_NOTIFICATIONS_STORAGE_KEY = "beige-admin-notifications-v1";
export const ADMIN_NOTIFICATION_PREFS_STORAGE_KEY = "beige-admin-notification-prefs-v1";
