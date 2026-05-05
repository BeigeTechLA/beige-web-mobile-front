"use client";

import { usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import { RoleEditDetailsPage } from "@/components/admin/roles-permissions/RoleEditDetailsPage";

export default function AdminRoleEditDetailsRoute() {
  const pathname = usePathname();

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          "roles-permissions": "User Roles & Permissions Management",
          "edit-details": "Edit Details",
        }}
      />
      <RoleEditDetailsPage />
    </>
  );
}
