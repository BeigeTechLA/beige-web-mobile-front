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
  permissionKeys?: string[];
  permissionAction?: PermissionAction;
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
    { key: "dashboard", name: "Dashboard", icon: LayoutDashboard, link: "/admin/dashboard", permissionKeys: ["admin_dashboard"] },
    { key: "shoots", name: "Shoots", icon: Camera, link: "/admin/shoots", permissionKeys: ["admin_shoots"] },
    { key: "file-manager", name: "File Manager", icon: FolderOpen, link: "/admin/file-manager", permissionKeys: ["admin_file_manager"] },
    { key: "meetings", name: "Meetings", icon: CalendarClock, link: "/admin/meetings", permissionKeys: ["admin_meetings"] },
    { key: "messages", name: "Messages", icon: MessageCircle, link: "/admin/messages", permissionKeys: ["admin_messages"] },
    { key: "availability", name: "Availability", icon: CalendarClock, link: "/admin/availability", permissionKeys: ["admin_availability"] },
    {
      key: "sales-representative",
      name: "Sales Representative",
      icon: CircleDollarSign,
      link: "/admin/sales-representative",
      permissionKeys: ["admin_sales_representative"],
      children: [
        { key: "sales-representative-dashboard", name: "Dashboard", link: "/admin/sales-representative", permissionKeys: ["admin_sales_representative"] },
        { key: "sales-representative-sales-people", name: "Sales People", link: "/admin/sales-representative/sales-people", permissionKeys: ["admin_sales_representative"] },
      ],
    },
    {
      key: "finances",
      name: "Finances",
      icon: DollarSign,
      permissionKeys: ["admin_finances"],
      children: [
        { key: "finances-credit-points", name: "Beige credit points", link: "/admin/finances/creditPoints", permissionKeys: ["admin_finances"] },
      ],
    },
    {
      key: "users",
      name: "Users",
      icon: Users,
      permissionKeys: ["admin_users"],
      children: [
        { key: "users-all", name: "All Users", link: "/admin/users/all", permissionKeys: ["admin_users"] },
        { key: "users-clients", name: "Clients", link: "/admin/users/clients", permissionKeys: ["admin_users"] },
        { key: "users-creative-partners", name: "Creative Partners", link: "/admin/users/creative-partners", permissionKeys: ["admin_users"] },
      ],
    },
    { key: "roles-permissions", name: "Roles & Permissions", icon: Settings, link: "/admin/roles-permissions" },
    {
      key: "quotes",
      name: "Quotes",
      icon: CustomQuotesIcon,
      supportsActiveState: true,
      link: "/admin/quotes",
      permissionKeys: ["admin_quotes"],
      children: [
        { key: "quotes-all", name: "All Quotes", link: "/admin/quotes", permissionKeys: ["admin_quotes"], permissionAction: "view" },
        { key: "quotes-change-requests", name: "Quote Approvals", link: "/admin/quotes/change-requests", permissionKeys: ["admin_quotes"], permissionAction: "edit" },
        { key: "quotes-pricing", name: "Master Pricing", link: "/admin/quotes/pricing", permissionKeys: ["admin_quotes"], permissionAction: "edit" },
      ],
    },
    { key: "invoices", name: "Invoices", icon: Receipt, link: "/admin/invoice", permissionKeys: ["admin_invoices"] },
  ],
  sales: [
    {
      key: "sales",
      name: "Sales",
      icon: LayoutDashboard,
      link: "/sales/dashboard",
      permissionKeys: ["sales_admin_dashboard", "sales_rep_sales"],
      children: [
        { key: "sales-dashboard", name: "Dashboard", link: "/sales/dashboard", permissionKeys: ["sales_admin_dashboard"], visibleForUserTypes: [7] },
        { key: "sales-people", name: "Sales People", link: "/sales/sales-people", permissionKeys: ["sales_admin_sales_people"], visibleForUserTypes: [7] },
      ],
    },
    { key: "availability", name: "Availability", icon: Calendar, link: "/sales/availability", permissionKeys: ["sales_rep_availability"], visibleForUserTypes: [5] },
    { key: "shoots", name: "Shoots", icon: Camera, link: "/sales/shoots", permissionKeys: ["sales_rep_shoots", "sales_admin_shoots"] },
    { key: "file-manager", name: "File Manager", icon: FolderOpen, link: "/sales/file-manager", permissionKeys: ["sales_rep_file_manager", "sales_admin_file_manager"] },
    { key: "meetings", name: "Meetings", icon: CalendarClock, link: "/sales/meetings", permissionKeys: ["sales_rep_meetings", "sales_admin_meetings"] },
    { key: "messages", name: "Messages", icon: MessageCircle, link: "/sales/messages", permissionKeys: ["sales_rep_messages", "sales_admin_messages"] },
    {
      key: "quotes",
      name: "Quotes",
      icon: CustomQuotesIcon,
      supportsActiveState: true,
      link: "/sales/quotes",
      permissionKeys: ["sales_rep_quotes", "sales_admin_quotes"],
      children: [
        { key: "quotes-all", name: "All Quotes", link: "/sales/quotes", permissionKeys: ["sales_rep_quotes", "sales_admin_quotes"], permissionAction: "view", visibleForUserTypes: [7] },
        {
          key: "quotes-change-request",
          name: "Change Request",
          link: "/sales/quotes/change-requests",
          permissionKeys: ["sales_admin_quotes"],
          permissionAction: "edit",
          visibleForUserTypes: [7],
          isVisible: ({ isSalesAdmin }) => isSalesAdmin,
        },
        {
          key: "quotes-pricing",
          name: "Master Pricing",
          link: "/sales/quotes/pricing",
          permissionKeys: ["sales_admin_quotes"],
          permissionAction: "edit",
          visibleForUserTypes: [7],
          isVisible: ({ isSalesAdmin }) => isSalesAdmin,
        },
      ],
    },
    { key: "invoices", name: "Invoices", icon: Receipt, link: "/sales/invoice", permissionKeys: ["sales_admin_invoices"], visibleForUserTypes: [7] },
  ],
  "production-manager": [
    { key: "dashboard", name: "Dashboard", icon: LayoutDashboard, link: "/production-manager/dashboard", permissionKeys: ["production_manager_dashboard"] },
    { key: "creative-partners", name: "Creative Partners", icon: Users, link: "/production-manager/creative-partners", permissionKeys: ["production_manager_creative_partner"] },
    { key: "shoots", name: "Shoots", icon: Camera, link: "/production-manager/shoots", permissionKeys: ["production_manager_shoots"] },
    { key: "file-manager", name: "File Manager", icon: FolderOpen, link: "/production-manager/file-manager", permissionKeys: ["production_manager_file_manager"] },
    { key: "meetings", name: "Meetings", icon: CalendarClock, link: "/production-manager/meetings", permissionKeys: ["production_manager_meetings"] },
    { key: "messages", name: "Messages", icon: MessageCircle, link: "/production-manager/messages", permissionKeys: ["production_manager_messages"] },
    { key: "availability", name: "Availability", icon: CalendarClock, link: "/production-manager/availability", permissionKeys: ["production_manager_availability"] },
  ],
  affiliate: [
    { key: "dashboard", name: "Dashboard", icon: LayoutDashboard, link: "/affiliate/dashboard", permissionKeys: ["client_dashboard"] },
    { key: "overview", name: "Affiliate Overview", icon: Users, link: "/affiliate/overview", permissionKeys: ["client_affiliate_overview"] },
    { key: "file-manager", name: "File Manager", icon: FolderOpen, link: "/affiliate/file-manager", permissionKeys: ["client_file_manager"] },
    { key: "find-yourself", name: "Find Yourself", icon: Search, link: "/affiliate/find-yourself", permissionKeys: ["client_find_yourself"] },
    { key: "meetings", name: "Meetings", icon: Calendar, link: "/affiliate/meetings", permissionKeys: ["client_meetings"] },
    { key: "messages", name: "Messages", icon: MessageCircle, link: "/affiliate/messages", permissionKeys: ["client_messages"] },
    { key: "shoots", name: "Shoots", icon: Camera, link: "/affiliate/shoots", permissionKeys: ["client_shoots"] },
    { key: "quotes", name: "Quotes", icon: CustomQuotesIcon, supportsActiveState: true, link: "/affiliate/quotes", permissionKeys: ["client_quotes"] },
    { key: "book-a-shoot", name: "Book A Shoot", icon: CalendarClock, link: "/book-a-shoot", permissionKeys: ["client_book_a_shoot"] },
    { key: "finances", name: "Finances", icon: DollarSign, link: "/affiliate/finances", permissionKeys: ["client_finances"] },
    { key: "profile", name: "Profile", icon: Settings, link: "/affiliate/profile", permissionKeys: ["client_profile"] },
  ],
};
