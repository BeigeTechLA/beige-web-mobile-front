"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Topbar from "@/components/admin/Topbar";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { useRequireModulePermission } from "@/lib/hooks/useRequireModulePermission";
import { adminApi, salesApi } from "@/lib/api";
import { formatQuoteStatusLabel } from "@/lib/quoteStatus";
import {
  ReassignRecordsPage,
  type AssignmentHistoryItem,
  type ReassignRecord,
  type SalesRep,
} from "@/components/admin/roles-permissions/ReassignRecordsPage";

const REASSIGN_PAGE_SIZE = 10;

const formatRoleLabel = (value: unknown) =>
  String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatLeadStatus = (lead: Record<string, unknown>) => {
  const paymentStatus = String(lead.payment_status || "").toLowerCase();
  if (["partially_paid", "partial_paid", "approval_pending"].includes(paymentStatus)) {
    return "Partially Paid";
  }

  const rawStatus = String(lead.lead_status || "open").toLowerCase();
  const statusLabels: Record<string, string> = {
    booking_in_progress: "Booking In Progress",
    in_progress_self_serve: "Booking In Progress",
    in_progress_sales_assisted: "Booking In Progress",
    ready_for_payment: "Ready for Payment",
    payment_link_sent: "Payment Link Sent",
    payment_sent: "Payment Sent",
    proposal_sent: "Proposal Sent",
    book_a_shoot_lead_created: "Book a shoot - Lead Created",
    manual_lead_created: "Manual - Lead Created",
    signed_up_lead_created: "Signed Up - Lead Created",
    booked: "Booked",
    closed_lost: "Closed - Lost",
    cancelled: "Cancelled",
  };

  return statusLabels[rawStatus] || rawStatus.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const mapReassignmentRecords = (data: any): ReassignRecord[] => {
  const orderedRecords = Array.isArray(data?.records)
    ? data.records
    : [
        ...(data?.leads ?? []).map((lead: any) => ({ ...lead, record_type: "lead" })),
        ...(data?.quotes ?? []).map((quote: any) => ({ ...quote, record_type: "quote" })),
      ];

  return orderedRecords.map((record: any) => record.record_type === "lead"
    ? {
        id: `L-${record.lead_id}`,
        clientName: record.client_name || record.guest_email || "—",
        type: "Lead",
        status: formatLeadStatus(record),
        amount: Number(record.quote_total || 0),
      }
    : {
        id: `Q-${record.quote_number || record.sales_quote_id}`,
        clientName: record.client_name || "—",
        type: "Quote",
        status: formatQuoteStatusLabel(String(record.status || "Open")),
        amount: Number(record.total || 0),
      });
};

function ReassignRecordsContent() {
  const pathname = usePathname();
  const router = useRouter();
  const userId = useSearchParams().get("user_id");
  const [user, setUser] = useState({ name: "User", roleLabel: "" });
  const [records, setRecords] = useState<ReassignRecord[]>([]);
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [history, setHistory] = useState<AssignmentHistoryItem[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<"all" | "Lead" | "Quote">("all");
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalQuotes, setTotalQuotes] = useState(0);
  const { allowed, isLoading } = useRequireModulePermission(
    "roles_permissions",
    "edit",
    "/admin/roles-permissions",
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let isActive = true;

    const loadUser = async () => {
      if (!userId) return;
      const response = await adminApi.getUserRoleDetails(userId);
      if (!isActive || !response?.success || !response?.data?.user) return;

      setUser({
        name: response.data.user.name || "User",
        roleLabel: formatRoleLabel(response.data.display_role || response.data.role?.name),
      });
    };

    void loadUser();
    return () => {
      isActive = false;
    };
  }, [userId]);

  useEffect(() => {
    let isActive = true;
    const loadHistory = async () => {
      if (!userId) return;
      const response = await adminApi.getUserReassignmentHistory(userId);
      if (!isActive) return;
      if (!response?.success || !Array.isArray(response.data)) {
        setHistory([]);
        return;
      }
      setHistory(response.data.map((row: any) => ({
        recordId: row.record_id,
        action: `${String(row.record_type || "record").replace(/^./, (letter: string) => letter.toUpperCase())} reassigned${row.actor_name ? ` by ${row.actor_name}` : ""}`,
        from: row.from_name || "Unknown user",
        to: row.to_name || "Unknown user",
        date: (row.created_at_utc || row.created_at) ? new Date(row.created_at_utc || row.created_at).toLocaleString("en-US", {
          month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
        }) : "—",
      })));
    };
    void loadHistory();
    return () => { isActive = false; };
  }, [userId]);

  useEffect(() => {
    let isActive = true;

    const loadRecords = async () => {
      if (!userId) {
        setRecordsError("User ID is missing.");
        setRecordsLoading(false);
        return;
      }

      setRecordsLoading(true);
      setRecordsError("");
      const response = await adminApi.getUserReassignments(userId, {
        search: debouncedSearch,
        page,
        limit: REASSIGN_PAGE_SIZE,
        type: typeFilter,
      });
      if (!isActive) return;

      if (!response?.success || !response?.data) {
        setRecordsError(response?.error || response?.message || "Failed to fetch open records.");
        setRecords([]);
        setTotalRecords(0);
        setTotalLeads(0);
        setTotalQuotes(0);
        setRecordsLoading(false);
        return;
      }

      setRecords(mapReassignmentRecords(response.data));
      setTotalRecords(Number(response.total_count ?? (response.count || 0) + (response.quote_count || 0)));
      setTotalLeads(Number(response.count || 0));
      setTotalQuotes(Number(response.quote_count || 0));
      if (Number(response.page) && Number(response.page) !== page) setPage(Number(response.page));
      setRecordsLoading(false);
    };

    void loadRecords();
    return () => {
      isActive = false;
    };
  }, [userId, debouncedSearch, page, typeFilter]);

  useEffect(() => {
    let isActive = true;

    const loadSalesReps = async () => {
      const response = await salesApi.getSalesReps();
      if (!isActive) return;

      if (!response?.success || !Array.isArray(response.data)) {
        setReps([]);
        return;
      }

      setReps(
        response.data
          .filter((rep: any) => String(rep.id) !== String(userId))
          .map((rep: any) => ({
            id: String(rep.id),
            name: rep.name || `${rep.first_name || ""} ${rep.last_name || ""}`.trim() || `Representative #${rep.id}`,
            email: rep.email || rep.user_email || "",
            roleLabel: formatRoleLabel(rep.role) || "Sales Rep",
          })),
      );
    };

    void loadSalesReps();
    return () => {
      isActive = false;
    };
  }, [userId]);

  if (isLoading || !allowed) return null;

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{
          "roles-permissions": "User Roles & Permissions Management",
          "reassign-records": "Reassign Records",
        }}
      />
      <ReassignRecordsPage
        user={user}
        records={records}
        reps={reps}
        totalRecords={totalRecords}
        totalLeads={totalLeads}
        totalQuotes={totalQuotes}
        page={page}
        typeFilter={typeFilter}
        pageSize={REASSIGN_PAGE_SIZE}
        history={history}
        recordsLoading={recordsLoading}
        recordsError={recordsError}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        onPageChange={setPage}
        onTypeFilterChange={(value) => {
          setTypeFilter(value);
          setPage(1);
        }}
        onReassign={async (assignments) => {
          if (!userId) throw new Error("User ID is missing.");
          const response = await adminApi.reassignUserSalesRecords(userId, assignments);
          if (!response?.success) throw new Error(response?.error || response?.message || "Failed to reassign records.");

          const refreshedRecordsResponse = await adminApi.getUserReassignments(userId, {
            search: debouncedSearch,
            page,
            limit: REASSIGN_PAGE_SIZE,
            type: typeFilter,
          });
          if (refreshedRecordsResponse?.success && refreshedRecordsResponse?.data) {
            setRecords(mapReassignmentRecords(refreshedRecordsResponse.data));
            setTotalRecords(Number(refreshedRecordsResponse.total_count || 0));
            setTotalLeads(Number(refreshedRecordsResponse.count || 0));
            setTotalQuotes(Number(refreshedRecordsResponse.quote_count || 0));
            if (Number(refreshedRecordsResponse.page) && Number(refreshedRecordsResponse.page) !== page) {
              setPage(Number(refreshedRecordsResponse.page));
            }
          }

          const historyResponse = await adminApi.getUserReassignmentHistory(userId);
          if (historyResponse?.success && Array.isArray(historyResponse.data)) {
            setHistory(historyResponse.data.map((row: any) => ({
              recordId: row.record_id,
              action: `${String(row.record_type || "record").replace(/^./, (letter: string) => letter.toUpperCase())} reassigned${row.actor_name ? ` by ${row.actor_name}` : ""}`,
              from: row.from_name || "Unknown user",
              to: row.to_name || "Unknown user",
              date: (row.created_at_utc || row.created_at) ? new Date(row.created_at_utc || row.created_at).toLocaleString("en-US", {
                month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
              }) : "—",
            })));
          }
          return Number(refreshedRecordsResponse?.total_count ?? Math.max(0, totalRecords - assignments.length));
        }}
        onAllReassigned={() => {
          if (!userId) return;
          router.push(`/admin/roles-permissions/edit-details?user_id=${encodeURIComponent(userId)}&open_delete=1`);
        }}
      />
    </>
  );
}

export default function ReassignRecordsRoute() {
  return (
    <Suspense fallback={null}>
      <PermissionGuard module="roles_permissions" action="edit">
        <ReassignRecordsContent />
      </PermissionGuard>
    </Suspense>
  );
}
