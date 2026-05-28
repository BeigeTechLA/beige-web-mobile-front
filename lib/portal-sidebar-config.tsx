"use client";

import type { ComponentType } from "react";
import {
  Calendar,
  CalendarClock,
  Camera,
  CircleDollarSign,
  DollarSign,
  FolderOpen,
  LayoutDashboard,
  MessageCircle,
  Receipt,
  Search,
  Settings,
  Users,
} from "lucide-react";

import type { PermissionAction } from "@/lib/permissions";

export type PortalKey = "admin" | "sales" | "production-manager" | "affiliate";

type SidebarIconProps = {
  size?: number;
  isActive?: boolean;
};

export type SidebarContextState = {
  currentUserTypeId: number | null;
  isSalesAdmin: boolean;
};

export type SidebarItem = {
  key: string;
  name: string;
  icon: ComponentType<SidebarIconProps>;
  supportsActiveState?: boolean;
  link?: string;
  permissionKeys?: string[];
  permissionAction?: PermissionAction;
  visibleForUserTypes?: number[];
  children?: SidebarItemChild[];
};

export type SidebarItemChild = {
  key: string;
  name: string;
  link: string;
  visibleForUserTypes?: number[];
  isVisible?: (context: SidebarContextState) => boolean;
  matchStartsWith?: string[];
};

const CustomQuotesIcon = ({ size = 24, isActive = false }: SidebarIconProps) => {
  const inactiveIcon = "/images/misc/Quotes.svg";
  const activeIcon = "/images/misc/QuotesActive.svg";

  return (
    <div
      style={{
        width: size,
        height: size,
        ...(isActive
          ? {
              backgroundImage: `url('${activeIcon}')`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
              backgroundPosition: "center",
            }
          : {
              backgroundColor: "currentColor",
              WebkitMaskImage: `url('${inactiveIcon}')`,
              maskImage: `url('${inactiveIcon}')`,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "contain",
              maskSize: "contain",
            }),
      }}
    />
  );
};

export const portalLabels: Record<PortalKey, string> = {
  admin: "Admin",
  sales: "Sales User",
  "production-manager": "Production Manager",
  affiliate: "Affiliate",
};

export const portalSidebarItems: Record<PortalKey, SidebarItem[]> = {
  admin: [
    { key: "dashboard", name: "Dashboard", icon: LayoutDashboard, link: "/admin/dashboard", permissionKeys: ["dashboard"] },
    { key: "shoots", name: "Shoots", icon: Camera, link: "/admin/shoots", permissionKeys: ["shoots"] },
    { key: "file-manager", name: "File Manager", icon: FolderOpen, link: "/admin/file-manager", permissionKeys: ["file_manager"] },
    { key: "meetings", name: "Meetings", icon: CalendarClock, link: "/admin/meetings", permissionKeys: ["meetings"] },
    { key: "messages", name: "Messages", icon: MessageCircle, link: "/admin/messages", permissionKeys: ["messages"] },
    { key: "availability", name: "Availability", icon: CalendarClock, link: "/admin/availability", permissionKeys: ["availability"] },
    {
      key: "sales-representative",
      name: "Sales Representative",
      icon: CircleDollarSign,
      link: "/admin/sales-representative",
      permissionKeys: ["sales_representative"],
      children: [
        { key: "sales-representative-dashboard", name: "Dashboard", link: "/admin/sales-representative" },
        { key: "sales-representative-sales-people", name: "Sales People", link: "/admin/sales-representative/sales-people" },
      ],
    },
    {
      key: "finances",
      name: "Finances",
      icon: DollarSign,
      children: [
        { key: "finances-credit-points", name: "Beige credit points", link: "/admin/finances/creditPoints" },
      ],
    },
    {
      key: "users",
      name: "Users",
      icon: Users,
      permissionKeys: ["users"],
      children: [
        { key: "users-all", name: "All Users", link: "/admin/users/all" },
        { key: "users-clients", name: "Clients", link: "/admin/users/clients" },
        { key: "users-creative-partners", name: "Creative Partners", link: "/admin/users/creative-partners" },
      ],
    },
    { key: "roles-permissions", name: "Roles & Permissions", icon: Settings, link: "/admin/roles-permissions" },
    {
      key: "quotes",
      name: "Quotes",
      icon: CustomQuotesIcon,
      supportsActiveState: true,
      link: "/admin/quotes",
      permissionKeys: ["quotes"],
      children: [
        { key: "quotes-all", name: "All Quotes", link: "/admin/quotes" },
        { key: "quotes-change-requests", name: "Quote Approvals", link: "/admin/quotes/change-requests" },
        { key: "quotes-pricing", name: "Master Pricing", link: "/admin/quotes/pricing" },
      ],
    },
    { key: "invoices", name: "Invoices", icon: Receipt, link: "/admin/invoice", permissionKeys: ["invoices"] },
  ],
  sales: [
    {
      key: "sales",
      name: "Sales",
      icon: LayoutDashboard,
      link: "/sales/dashboard",
      permissionKeys: ["dashboard"],
      children: [
        { key: "sales-dashboard", name: "Dashboard", link: "/sales/dashboard", visibleForUserTypes: [7] },
        { key: "sales-people", name: "Sales People", link: "/sales/sales-people", visibleForUserTypes: [7] },
      ],
    },
    { key: "availability", name: "Availability", icon: Calendar, link: "/sales/availability", permissionKeys: ["availability"], visibleForUserTypes: [5] },
    { key: "shoots", name: "Shoots", icon: Camera, link: "/sales/shoots", permissionKeys: ["shoots"] },
    { key: "file-manager", name: "File Manager", icon: FolderOpen, link: "/sales/file-manager", permissionKeys: ["file_manager"] },
    { key: "meetings", name: "Meetings", icon: CalendarClock, link: "/sales/meetings", permissionKeys: ["meetings"] },
    { key: "messages", name: "Messages", icon: MessageCircle, link: "/sales/messages", permissionKeys: ["messages"] },
    {
      key: "quotes",
      name: "Quotes",
      icon: CustomQuotesIcon,
      supportsActiveState: true,
      link: "/sales/quotes",
      permissionKeys: ["quotes"],
      children: [
        { key: "quotes-all", name: "All Quotes", link: "/sales/quotes", visibleForUserTypes: [7] },
        {
          key: "quotes-change-request",
          name: "Change Request",
          link: "/sales/quotes/change-requests",
          visibleForUserTypes: [7],
          isVisible: ({ isSalesAdmin }) => isSalesAdmin,
        },
        {
          key: "quotes-pricing",
          name: "Master Pricing",
          link: "/sales/quotes/pricing",
          visibleForUserTypes: [7],
          isVisible: ({ isSalesAdmin }) => isSalesAdmin,
        },
      ],
    },
    { key: "invoices", name: "Invoices", icon: Receipt, link: "/sales/invoice", permissionKeys: ["invoices"], visibleForUserTypes: [7] },
  ],
  "production-manager": [
    { key: "dashboard", name: "Dashboard", icon: LayoutDashboard, link: "/production-manager/dashboard", permissionKeys: ["dashboard"] },
    { key: "creative-partners", name: "Creative Partners", icon: Users, link: "/production-manager/creative-partners", permissionKeys: ["users"] },
    { key: "shoots", name: "Shoots", icon: Camera, link: "/production-manager/shoots", permissionKeys: ["shoots"] },
    { key: "file-manager", name: "File Manager", icon: FolderOpen, link: "/production-manager/file-manager", permissionKeys: ["file_manager"] },
    { key: "meetings", name: "Meetings", icon: CalendarClock, link: "/production-manager/meetings", permissionKeys: ["meetings"] },
    { key: "messages", name: "Messages", icon: MessageCircle, link: "/production-manager/messages", permissionKeys: ["messages"] },
    { key: "availability", name: "Availability", icon: CalendarClock, link: "/production-manager/availability", permissionKeys: ["availability"] },
  ],
  affiliate: [
    { key: "dashboard", name: "Dashboard", icon: LayoutDashboard, link: "/affiliate/dashboard", permissionKeys: ["dashboard"] },
    { key: "overview", name: "Affiliate Overview", icon: Users, link: "/affiliate/overview", permissionKeys: ["users"] },
    { key: "file-manager", name: "File Manager", icon: FolderOpen, link: "/affiliate/file-manager", permissionKeys: ["file_manager"] },
    { key: "find-yourself", name: "Find Yourself", icon: Search, link: "/affiliate/find-yourself", permissionKeys: ["shoots"] },
    { key: "meetings", name: "Meetings", icon: Calendar, link: "/affiliate/meetings", permissionKeys: ["meetings"] },
    { key: "messages", name: "Messages", icon: MessageCircle, link: "/affiliate/messages", permissionKeys: ["messages"] },
    { key: "shoots", name: "Shoots", icon: Camera, link: "/affiliate/shoots", permissionKeys: ["shoots"] },
    { key: "quotes", name: "Quotes", icon: CustomQuotesIcon, supportsActiveState: true, link: "/affiliate/quotes", permissionKeys: ["quotes"] },
    { key: "book-a-shoot", name: "Book A Shoot", icon: CalendarClock, link: "/book-a-shoot", permissionKeys: ["shoots"] },
    { key: "finances", name: "Finances", icon: DollarSign, link: "/affiliate/finances", permissionKeys: ["invoices"] },
    { key: "profile", name: "Profile", icon: Settings, link: "/affiliate/profile", permissionKeys: ["settings"] },
  ],
};
