"use client";

import { usePathname } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import { RoleCreatePage } from "@/components/admin/roles-permissions/RoleCreatePage";

export default function AdminAddNewRoleRoute() {
  const pathname = usePathname();

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          "roles-permissions": "User Roles & Permissions Management",
          "add-new-role": "Add New Role",
        }}
      />
      <RoleCreatePage />
    </>
  );
}
