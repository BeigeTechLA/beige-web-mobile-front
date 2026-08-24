"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CircleDollarSign, Clock, ShieldAlert, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import Topbar from "@/components/admin/Topbar";
import { SortDateButton } from "@/components/admin/SortDateButton";

import { Button } from "@/src/components/landing/ui/button";
import CPPayoutTable, { ShootCPRow } from "@/components/admin/finances/CPPayoutTable";
import FinanceMetricCards from "@/components/affiliate/FinanceMetricCards";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { TabsSwitcher } from "@/components/admin/TabsSwitcher";
import CompensationModal from "@/components/admin/finances/CompensationModal";
import ModifyPayoutModal from "@/components/admin/finances/ModifyPayoutModal";
import RejectPayoutModal from "@/components/admin/finances/RejectPayoutModal";
import ApprovePayoutModal from "@/components/admin/finances/ApprovePayoutModal";
import SuccessModal from "@/components/admin/finances/SuccessModal";
import PaymentMethodSelectionModal from "@/components/admin/finances/PaymentMethodSelection";
import AddReceiptModal, { ReceiptPayload } from "@/components/admin/finances/AddReceiptModal";
import AddCompendationModal from "@/components/admin/finances/AddCompensationModal";
import AdvancePaymentModal from "@/components/admin/finances/AdvancePaymentModal";
import {
  cpCompensationApi,
  type AddCpCompensationPayload,
  type CpCompensationDetails,
  type PendingCompensationShoot,
} from "@/lib/api/cpCompensation";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { useAppSelector } from "@/lib/redux/hooks";
import { getFirstAllowedAdminPath } from "@/lib/permissions";

const metricDropdownOptions = ["Month", "Last 30 Days", "This Quarter", "This Year"];

const MOCK_SHOOT_DATA: ShootCPRow[] = [
  {
    id: "SHT-001",
    shootName: "Nike Summer Campaign",
    totalCP: 5,
    customerName: "Alex Mercer",
    customerEmail: "alex@mercer.com",
    shootBudget: 5000,
    cpPayout: 1200,
    margin: 18.5,
    status: "Approved",
    category: "videography",
    avatarImage: "",
    date: "2026-04-21T12:43:27.000Z"
  },
  {
    id: "SHT-002",
    shootName: "Cyberdyne Corporate Video",
    totalCP: 2,
    customerName: "Sarah Connor",
    customerEmail: "s.connor@cyberdyne.org",
    shootBudget: 3200,
    cpPayout: 850,
    margin: 23.50,
    status: "Pending",
    category: "photography",
    avatarImage: "",
    date: "2026-05-14T09:15:00.000Z"
  },
  {
    id: "SHT-003",
    shootName: "Wayne Manor Drone Coverage",
    totalCP: 3,
    customerName: "Bruce Wayne",
    customerEmail: "bruce@waynecorp.com",
    shootBudget: 12000,
    cpPayout: 3000,
    margin: 9.00,
    status: "Approval Pending",
    category: "videography",
    avatarImage: "",
    date: "2026-06-02T16:30:12.000Z"
  },
  {
    id: "SHT-004",
    shootName: "Oscorp Bio-Tech Interview",
    totalCP: 4,
    customerName: "Norman Osborn",
    customerEmail: "norman@oscorp.com",
    shootBudget: 2500,
    cpPayout: 700,
    margin: 11.00,
    status: "Fully Paid",
    category: "photography",
    avatarImage: "",
    date: "2026-06-10T11:05:45.000Z"
  },
];

const MOCK_CREATORS_DATA: ShootCPRow[] = [
  {
    id: "pay-001",
    shootId: "SHT-2026-8801",
    shootName: "Summer Solstice Campaign",
    creatorName: "Aarav Vardhan",
    creatorRoles: ["Lead Videographer", "Drone Operator"],
    customerName: "Vogue India",
    customerEmail: "finance@vogue.in",
    avatarImage: "",
    category: "videography",
    shootBudget: 12500,
    cpPayout: 2400,
    margin: 18,
    status: "Approved",
    date: "2026-06-15T10:00:00.000Z",
  },
  {
    id: "pay-002",
    shootId: "SHT-2026-4412",
    shootName: "Beige Aesthetics Launch",
    creatorName: "Elena Rostova",
    creatorRoles: ["Creative Director", "Fashion Photographer"],
    customerName: "Beige OS",
    customerEmail: "billing@beige.ai",
    avatarImage: "",
    category: "photography",
    shootBudget: 8500,
    cpPayout: 1850,
    margin: 22,
    status: "Fully Paid",
    date: "2026-06-08T14:30:00.000Z",
  },
  {
    id: "pay-003",
    shootId: "SHT-2026-1099",
    shootName: "Airbox Wireless Pro Commercial",
    creatorName: "Marcus Chen",
    creatorRoles: ["Colorist", "Editor"],
    customerName: "Airbox Tech",
    customerEmail: "ops@airbox.com",
    avatarImage: "",
    category: "videography",
    shootBudget: 24000,
    cpPayout: 4200,
    margin: 14,
    status: "Partially Paid",
    date: "2026-06-20T09:15:00.000Z",
  },
  {
    id: "pay-004",
    shootId: "SHT-2026-3115",
    shootName: "Revurge Core Apparel Shoot",
    creatorName: "Sarah Jenkins",
    creatorRoles: ["Product Photographer"],
    customerName: "Revurge Fitness",
    customerEmail: "campaigns@revurge.io",
    avatarImage: "",
    category: "photography",
    shootBudget: 6000,
    cpPayout: 950,
    margin: 30,
    status: "Pending",
    date: "2026-06-11T11:00:00.000Z",
  },
  {
    id: "pay-005",
    shootId: "SHT-2026-9052",
    shootName: "Ayurvedic Baby Care Pitch Film",
    creatorName: "Rohan Das",
    creatorRoles: ["Grip", "Lighting Assist"],
    customerName: "Nurture Roots Co.",
    customerEmail: "accounts@nurtureroots.in",
    avatarImage: "",
    category: "videography",
    shootBudget: 9800,
    cpPayout: 1100,
    margin: 16,
    status: "Approval Pending",
    date: "2026-05-28T16:00:00.000Z",
  }
];

type TabType = "shoots" | "creators";

const tabs: { label: string; value: TabType }[] = [
  { label: "Shoots", value: "shoots" },
  { label: "Creators", value: "creators" },
];

const formatDateForApi = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AdminFinancesPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useResolvedTheme();
  const { canView, canCreate, canEdit, isLoading: isPermissionLoading } = usePermissions("finances");
  const permissions = useAppSelector((state) => state.auth.permissions);

  const [tableData, setTableData] = useState<ShootCPRow[]>([]);
  const [overviewRows, setOverviewRows] = useState<ShootCPRow[]>([]);
  const [pendingTableData, setPendingTableData] = useState<ShootCPRow[]>([]);
  const [pendingTableLoading, setPendingTableLoading] = useState(false);
  const [pendingShoots, setPendingShoots] = useState<PendingCompensationShoot[]>([]);
  const [details, setDetails] = useState<CpCompensationDetails | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [pendingShootsLoading, setPendingShootsLoading] = useState(false);
  const [isAddSubmitting, setIsAddSubmitting] = useState(false);
  const [activeMetricId, setActiveMetricId] = useState("available");
  const [metricRange, setMetricRange] = useState("Month");
  const [dataType, setDataType] = useState<TabType>("shoots");
  const [selectedRow, setSelectedRow] = useState<ShootCPRow | null>(null);
  const [selectedPaymentEarningId, setSelectedPaymentEarningId] = useState<number | null>(null);
  const [selectedPaymentScope, setSelectedPaymentScope] = useState<"advance" | "final" | null>(null);
  const [selectedPendingAdvance, setSelectedPendingAdvance] = useState<{ advanceId?: number; amount?: number; paymentDate?: string } | null>(null);
  const [selectedActionEarningIds, setSelectedActionEarningIds] = useState<number[]>([]);
  const [selectedPendingShootId, setSelectedPendingShootId] = useState<number | null>(null);

  // Visibility States
  const [isCompOpen, setIsCompOpen] = useState(false);
  const [isAddCompOpen, setIsAddCompOpen] = useState(false);
  const [isModifyOpen, setIsModifyOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isPaymentSelectionOpen, setPaymentSelectionOpen] = useState(false);
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);

  // Submitting Loaders States
  const [isModifySubmitting, setIsModifySubmitting] = useState(false);
  const [isRejectSubmitting, setIsRejectSubmitting] = useState(false);
  const [isApproveSubmitting, setIsApproveSubmitting] = useState(false);
  const [isSuccessSubmitting, setIsSuccessSubmitting] = useState(false);
  const [isReceiptSubmitting, setIsReceiptSubmitting] = useState(false);

  // Success Text States Configuration
  const [successTitle, setSuccessTitle] = useState("");
  const [successSubtext, setSuccessSubtext] = useState("");
  const [successButtonText, setSuccessButtonText] = useState("");

  const metrics = [
    {
      id: "payout",
      label: "Total Payout",
      value: new Intl.NumberFormat("en-US").format(overviewRows.reduce((sum, row) => sum + row.cpPayout, 0)),
      helperText: "Paid",
      icon: CircleDollarSign,
    },
    {
      id: "pending",
      label: "Pending Approval",
      value: new Intl.NumberFormat("en-US").format(overviewRows.filter((row) => row.status === "Approval Pending").length),
      helperText: "Awaiting approval",
      icon: Clock,
    },
    {
      id: "overmargin",
      label: "Over-Margin Shoots",
      value: new Intl.NumberFormat("en-US").format(overviewRows.filter((row) => row.margin < 50).length),
      helperText: "Requires review",
      icon: ShieldAlert,
    },
    {
      id: "partiallypaid",
      label: "Partially Paid",
      value: new Intl.NumberFormat("en-US").format(overviewRows.filter((row) => row.status === "Partially Paid").length),
      helperText: "Shoots paid partially",
      icon: TrendingUp,
    },
  ];

  const loadHistory = useCallback(async (view: TabType) => {
    setLoading(true);
    try {
      if (view === "shoots") {
        const shoots = await cpCompensationApi.list("shoots");
        setTableData(shoots);
        setOverviewRows(shoots);
      } else if (view === "creators") {
        const [creators, shoots] = await Promise.all([
          cpCompensationApi.list("creators"),
          cpCompensationApi.list("shoots"),
        ]);
        setTableData(creators);
        setOverviewRows(shoots);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load CP compensation history",
      );
      setTableData([]);
      setOverviewRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPendingCompensation = useCallback(async () => {
    setPendingTableLoading(true);

    try {
      const pendingCompensation = await cpCompensationApi.pendingShoots();

      const mappedPendingCompensation: ShootCPRow[] = pendingCompensation.map(
        (item) => ({
          id: String(item.booking_id),
          bookingId: item.booking_id,
          shootName: item.shoot_name,
          totalCP: item.creators?.length || 0,
          customerName: item.customer?.name || "Unknown Customer",
          customerEmail: item.customer?.email || "",
          shootBudget: Number(item.shoot_amount || 0),
          cpPayout: 0,
          margin: Number(item.margin_percent || 0),
          status: "Pending",
          category: String(item.shoot_type || item.content_type || "")
            .toLowerCase()
            .includes("photo")
            ? "photography"
            : "videography",
          avatarImage: "",
          date: item.event_date || "",
          sortDate: item.event_date || "",
        }),
      );

      setPendingTableData(mappedPendingCompensation);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load pending compensation shoots",
      );

      setPendingTableData([]);
    } finally {
      setPendingTableLoading(false);
    }
  }, []);

  const loadPendingShoots = async () => {
    setPendingShootsLoading(true);
    try {
      setPendingShoots(await cpCompensationApi.pendingShoots());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load pending compensation shoots");
      setPendingShoots([]);
    } finally {
      setPendingShootsLoading(false);
    }
  };

  const refreshOpenCompensationDetails = useCallback(async () => {
    if (!isCompOpen || !selectedRow) return;

    const bookingId = selectedRow.bookingId || Number(selectedRow.id);
    if (!bookingId) return;

    setDetailsLoading(true);
    try {
      setDetails(await cpCompensationApi.details(bookingId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to refresh compensation details");
    } finally {
      setDetailsLoading(false);
    }
  }, [isCompOpen, selectedRow]);

  const handleRowClick = async (row: ShootCPRow) => {
    setSelectedRow(row);
    setSelectedActionEarningIds([]);
    setSelectedPaymentEarningId(null);
    setSelectedPaymentScope(null);
    setSelectedPendingAdvance(null);
    setIsCompOpen(true);
    setDetails(null);
    const bookingId = row.bookingId || Number(row.id);
    if (!bookingId) return;
    setDetailsLoading(true);
    try {
      setDetails(await cpCompensationApi.details(bookingId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load compensation details");
      setDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewHistory = (row: ShootCPRow) => {
    const bookingId = row.bookingId || Number(row.id);
    if (!bookingId) {
      toast.error("This payout does not have a valid booking ID yet.");
      return;
    }

    router.push(`/admin/finances/cpCompensation/${bookingId}`);
  };

  const handleDueDateChange = async (row: ShootCPRow, dueDate: Date) => {
    if (!canEdit) {
      toast.error("Edit permission not allowed");
      throw new Error("Edit permission not allowed");
    }

    const bookingId = row.bookingId || Number(row.id);
    if (!bookingId) {
      toast.error("This payout does not have a valid booking ID yet.");
      throw new Error("Missing booking ID");
    }

    try {
      await cpCompensationApi.updateDueDate(bookingId, formatDateForApi(dueDate));
      toast.success("Due date updated");
      await loadHistory(dataType);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update due date");
      throw error;
    }
  };

  const handleOpenModify = (creatorEarningIds?: number[]) => {
    if (!canEdit) {
      toast.error("Edit permission not allowed");
      return;
    }
    const earningIds = creatorEarningIds?.filter(Boolean) || [];
    if (earningIds.length > 1) {
      toast.error("Select one Creative Partner to modify payout");
      return;
    }
    setSelectedActionEarningIds(earningIds);
    setIsModifyOpen(true);
    setIsCompOpen(false);
  };

  const handleOpenApprove = (creatorEarningIds?: number[]) => {
    if (!canEdit) {
      toast.error("Edit permission not allowed");
      return;
    }
    setSelectedActionEarningIds(creatorEarningIds?.filter(Boolean) || []);
    setIsApproveOpen(true);
  };

  const handleOpenReject = (creatorEarningIds?: number[]) => {
    if (!canEdit) {
      toast.error("Edit permission not allowed");
      return;
    }
    setSelectedActionEarningIds(creatorEarningIds?.filter(Boolean) || []);
    setIsRejectOpen(true);
  };

  const handleOpenReceipt = () => {
    if (!canEdit) {
      toast.error("Edit permission not allowed");
      return;
    }
    setIsReceiptOpen(true);
    setIsCompOpen(false);
  };

  const handleOpenPayment = (creatorEarningId: number) => {
    if (!canEdit) {
      toast.error("Edit permission not allowed");
      return;
    }
    setSelectedPaymentEarningId(creatorEarningId);
    setSelectedPaymentScope(null);
    setSelectedPendingAdvance(null);
    setIsCompOpen(false);
    setPaymentSelectionOpen(true);
  };

  const handleOpenAdvancePayment = (
    creatorEarningId: number,
    advance?: { advanceId?: number; amount?: number; paymentDate?: string }
  ) => {
    if (!canEdit) {
      toast.error("Edit permission not allowed");
      return;
    }
    setSelectedPaymentEarningId(creatorEarningId);
    setSelectedPaymentScope("advance");
    setSelectedPendingAdvance(advance || null);
    setIsCompOpen(false);
    setPaymentSelectionOpen(true);
  };

  const getPaymentAmount = (earningId: number | null) => {
    if (selectedPaymentScope === "advance" && Number(selectedPendingAdvance?.amount || 0) > 0) {
      return Number(selectedPendingAdvance?.amount || 0);
    }
    const creator = details?.creators.find((item) => item.creator_earning_id === earningId);
    return Number(creator?.remaining_balance || creator?.total_compensation || selectedRow?.cpPayout || 0);
  };

  const getPaymentScope = (amount: number, remainingAmount: number): "advance" | "final" =>
    amount < remainingAmount ? "advance" : "final";

  const handleStripePayment = async () => {
    if (!canEdit) {
      toast.error("Edit permission not allowed");
      return;
    }
    setIsReceiptSubmitting(true);
    try {
      const earningId = selectedPaymentEarningId || getActionEarningIds()[0];
      const amount = getPaymentAmount(earningId);
      if (!earningId || !(amount > 0)) {
        toast.error("No payable compensation balance found");
        return;
      }
      await cpCompensationApi.processPayment(earningId, {
        amount,
        payment_method: "stripe",
        payment_scope: selectedPaymentScope || "final",
        advance_id: selectedPendingAdvance?.advanceId,
      });
      setPaymentSelectionOpen(false);
      setSelectedPaymentEarningId(null);
      setSelectedPaymentScope(null);
      setSelectedPendingAdvance(null);
      await loadHistory(dataType);
      setSuccessTitle("Stripe Payment Started");
      setSuccessSubtext("Creator payout has been sent for Stripe processing.");
      setSuccessButtonText("");
      setIsSuccessOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process Stripe payment");
    } finally {
      setIsReceiptSubmitting(false);
    }
  };

  const handleAddCompensation = () => {
    if (!canCreate) {
      toast.error("Create permission not allowed");
      return;
    }
    setIsAddCompOpen(true);
  };

  const getActionEarningIds = () => {
    if (selectedActionEarningIds.length) return selectedActionEarningIds;
    if (selectedRow?.creatorEarningId) return [selectedRow.creatorEarningId];
    return (details?.creators || []).map((creator) => creator.creator_earning_id);
  };

  const getSelectedActionCreator = () => {
    const earningId = getActionEarningIds()[0];
    return details?.creators.find((creator) => creator.creator_earning_id === earningId) || null;
  };

  // --- SUBMISSION LIFECYCLE INTERCEPTORS ---

  const handleModifySubmit = async (payload: { reason: string; payoutAmount: string }) => {
    if (!canEdit) {
      toast.error("Edit permission not allowed");
      return;
    }
    setIsModifySubmitting(true);
    try {
      const earningId = getActionEarningIds()[0];
      const amount = Number(String(payload.payoutAmount || "0").replace(/[$,]/g, ""));
      if (!earningId || !(amount > 0)) {
        toast.error("Select a compensation record and enter a valid payout amount");
        return;
      }
      await cpCompensationApi.modify(earningId, {
        modification_reason: payload.reason,
        items: [{ label: "Base Payout", amount }],
      });
      setIsModifyOpen(false);
      setSelectedActionEarningIds([]);
      await loadHistory(dataType);

      setSuccessTitle("Payout Modify Successfully");
      setSuccessSubtext(`The payout has been Modified`);
      setSuccessButtonText("");
      setIsSuccessOpen(true);
    } catch (error) {
      toast.error("Failed to alter payout values");
    } finally {
      setIsModifySubmitting(false);
    }
  };

  const handleApproveSubmit = async (payload?: { reason?: string }) => {
    if (!canEdit) {
      toast.error("Edit permission not allowed");
      return;
    }
    setIsApproveSubmitting(true);
    try {
      const earningIds = getActionEarningIds();
      if (!earningIds.length) {
        toast.error("No compensation record found to approve");
        return;
      }
      await Promise.all(earningIds.map((earningId) => cpCompensationApi.approve(earningId, payload?.reason)));
      setIsApproveOpen(false);
      setSelectedActionEarningIds([]);

      setSuccessTitle("Payout Approved Successfully");
      setSuccessSubtext(`The payout has been approved for ${earningIds.length} Creative Partner${earningIds.length === 1 ? "" : "s"} and is now ready for payment processing.`);
      setSuccessButtonText("");
      setIsSuccessOpen(true);

      await Promise.all([loadHistory(dataType), refreshOpenCompensationDetails()]);
    } catch (error) {
      toast.error("Approval transaction failed");
    } finally {
      setIsApproveSubmitting(false);
    }
  };

  const handleRejectSubmit = async (payload: { reason: string }) => {
    if (!canEdit) {
      toast.error("Edit permission not allowed");
      return;
    }
    setIsRejectSubmitting(true);
    try {
      const earningIds = getActionEarningIds();
      if (!earningIds.length) {
        toast.error("No compensation record found to reject");
        return;
      }
      await Promise.all(earningIds.map((earningId) => cpCompensationApi.reject(earningId, payload.reason)));
      setIsRejectOpen(false);
      setSelectedActionEarningIds([]);

      setSuccessTitle("Payout Reject Successfully");
      setSuccessSubtext("The payout has been Rejected");
      setSuccessButtonText("");
      setIsSuccessOpen(true);

      await Promise.all([loadHistory(dataType), refreshOpenCompensationDetails()]);
    } catch (error) {
      toast.error("Rejection workflow error");
    } finally {
      setIsRejectSubmitting(false);
    }
  };

  // <-- 4. Handle Add Receipt Form Submission Async Lifecycle
  const handleReceiptSubmit = async (payload: ReceiptPayload) => {
    if (!canEdit) {
      toast.error("Edit permission not allowed");
      return;
    }
    setIsReceiptSubmitting(true);
    try {
      const earningId = selectedPaymentEarningId || getActionEarningIds()[0];
      const remainingAmount = getPaymentAmount(earningId);
      const amount = Number(payload.amount || 0);
      if (!earningId || !(remainingAmount > 0)) {
        toast.error("No payable compensation balance found");
        return;
      }
      if (!(amount > 0)) {
        toast.error("Enter a valid payment amount");
        return;
      }
      if (amount > remainingAmount) {
        toast.error(`Payment amount cannot exceed remaining balance of ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(remainingAmount)}`);
        return;
      }
      const bookingId = selectedRow?.bookingId || (selectedRow?.id ? Number(selectedRow.id) : null);
      const uploadedProof = payload.proofFile
        ? await cpCompensationApi.uploadPaymentProof(payload.proofFile, { bookingId, earningId })
        : null;
      const proofUrl = uploadedProof?.proof_url || uploadedProof?.file_path || payload.proofFile?.name || payload.transactionId;
      await cpCompensationApi.processPayment(earningId, {
        amount,
        payment_method: "outside_platform",
        payment_mode: payload.paymentMethod === "other"
          ? payload.otherPaymentMethod || payload.paymentMethod
          : payload.paymentMethod,
        proof_url: proofUrl,
        proof_file_path: uploadedProof?.file_path || undefined,
        proof_file_name: payload.proofFile?.name,
        transaction_reference: payload.transactionId,
        notes: payload.notes,
        payment_scope: selectedPaymentScope || getPaymentScope(amount, remainingAmount),
        advance_id: selectedPendingAdvance?.advanceId,
      });
      setIsReceiptOpen(false);
      setSelectedPaymentEarningId(null);
      setSelectedPaymentScope(null);
      setSelectedPendingAdvance(null);
      await loadHistory(dataType);
      if (selectedRow?.bookingId || selectedRow?.id) {
        const bookingId = selectedRow.bookingId || Number(selectedRow.id);
        if (bookingId) {
          setDetails(await cpCompensationApi.details(bookingId));
        }
      }

      setSuccessTitle("Payment Recorded Successfully");
      setSuccessSubtext(amount < remainingAmount ? "Partial creator payment has been recorded." : "Creator payout has been marked as fully paid.");
      setSuccessButtonText(""); // Empty text triggers the outside click to close
      setIsSuccessOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record payment");
    } finally {
      setIsReceiptSubmitting(false);
    }
  };

  const handleAdvanceSubmit = async (payload: { reason: string; advanceAmount: string; paymentDate: Date | null; proofFile?: File | null }) => {
    if (!canEdit) {
      toast.error("Edit permission not allowed");
      return;
    }
    setIsModifySubmitting(true);
    try {
      const earningId = getActionEarningIds()[0];
      const amount = Number(String(payload.advanceAmount || "0").replace(/[$,]/g, ""));
      if (!earningId || !(amount > 0)) {
        toast.error("Select a compensation record and enter a valid advance amount");
        return;
      }
      if (!payload.proofFile) {
        toast.error("Upload payment proof before saving an advance payment");
        return;
      }
      const bookingId = selectedRow?.bookingId || (selectedRow?.id ? Number(selectedRow.id) : null);
      const uploadedProof = await cpCompensationApi.uploadPaymentProof(payload.proofFile, { bookingId, earningId });
      await cpCompensationApi.processPayment(earningId, {
        amount,
        payment_method: "outside_platform",
        payment_mode: "advance_payment",
        proof_url: uploadedProof?.proof_url || uploadedProof?.file_path || payload.proofFile.name,
        proof_file_path: uploadedProof?.file_path || undefined,
        proof_file_name: payload.proofFile.name,
        transaction_reference: `ADV-${earningId}-${Date.now()}`,
        notes: payload.reason,
        payment_scope: "advance",
        payment_date: payload.paymentDate ? formatDateForApi(payload.paymentDate) : undefined,
      });
      setIsAdvanceOpen(false);
      await loadHistory(dataType);
      if (selectedRow?.bookingId || selectedRow?.id) {
        const bookingId = selectedRow.bookingId || Number(selectedRow.id);
        if (bookingId) {
          setDetails(await cpCompensationApi.details(bookingId));
        }
      }
      setSuccessTitle("Advance Added Successfully");
      setSuccessSubtext("The advance payment record has been added.");
      setSuccessButtonText("");
      setIsSuccessOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add advance payment");
    } finally {
      setIsModifySubmitting(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    loadHistory(dataType);
  }, [canView, dataType, loadHistory]);

  useEffect(() => {
    if (!canView) return;
    loadPendingCompensation();
  }, [canView, loadPendingCompensation]);

  useEffect(() => {
    if (isPermissionLoading || canView) return;

    const fallbackPath = getFirstAllowedAdminPath(permissions) || "/admin/dashboard";
    if (fallbackPath && fallbackPath !== pathname) {
      router.replace(fallbackPath);
    }
  }, [canView, isPermissionLoading, pathname, permissions, router]);

  useEffect(() => {
    if (isAddCompOpen && canCreate) {
      loadPendingShoots();
    }
    if (isAddCompOpen && !canCreate) {
      setIsAddCompOpen(false);
    }
  }, [canCreate, isAddCompOpen]);

  const handleAddSubmit = async (payload: AddCpCompensationPayload) => {
    if (!canCreate) {
      toast.error("Create permission not allowed");
      return;
    }
    setIsAddSubmitting(true);
    try {
      await cpCompensationApi.add(payload);
      setIsAddCompOpen(false);
      setSuccessTitle("Compensation Added Successfully");
      setSuccessSubtext("The compensation has been added and approved.");
      setSuccessButtonText("");
      setIsSuccessOpen(true);
      window.setTimeout(() => {
        void Promise.all([loadHistory(dataType), loadPendingCompensation(), loadPendingShoots(),]).catch((error) => {
          toast.error(error instanceof Error ? error.message : "Failed to refresh compensation history",);
        });
      }, 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add compensation");
    } finally {
      setIsAddSubmitting(false);
    }
  };

  if (isPermissionLoading) {
    return null;
  }

  return (
    <>
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={{ cpCompensation: "CP Compensation" }}
        actions={
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="beige"
              className="h-12 rounded-lg px-4 text-sm font-semibold text-black lg:px-6"
              onClick={handleAddCompensation}
              disabled={!canCreate}
              title={canCreate ? "Add Compensation" : "Create permission not allowed"}
            >
              Add Compensation
            </Button>
          </div>
        }
      />

      <div
        className="space-y-5 overflow-hidden p-4 lg:space-y-8 lg:px-10 lg:py-9"
        style={{ fontFamily: "var(--font-instrument-sans)" }}
      >
        <div className="flex justify-between items-start lg:items-end gap-4">
          <div>
            <h1 className={`text-lg lg:text-2xl lg:leading-[32px] font-semibold mb-1 transition-colors duration-100 ${isDark ? "text-white" : "text-[#000]"}`}>
              CP Compensation
            </h1>
            <p className={`text-xs lg:text-sm transition-colors duration-100 ${isDark ? "text-white/70" : "text-[#000000B2]"}`}>
              Manage creative partner compensation, advance payments, approvals, and payout tracking in one place.
            </p>
          </div>
          <SortDateButton
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        <FinanceMetricCards
          metrics={metrics}
          activeId={activeMetricId}
          onSelect={setActiveMetricId}
          dropdownLabel="Month"
          dropdownValue={metricRange}
          dropdownOptions={metricDropdownOptions}
          onDropdownChange={setMetricRange}
          gridSize={4}
        />

        <TabsSwitcher
          tabs={tabs}
          activeTab={dataType}
          buttonSize="large"
          className="rounded-md"
          onChange={(tab) => setDataType(tab)}
        />

        <CPPayoutTable
          rows={tableData}
          loading={loading}
          onRowClick={handleRowClick}
          onViewHistory={handleViewHistory}
          onDueDateChange={handleDueDateChange}
          type={dataType}
        />

        <div className="pt-4 lg:pt-6">
          <div className="mb-4 lg:mb-5">
            <h2 className={`text-lg lg:text-xl font-semibold ${isDark ? "text-white" : "text-[#171717]"}`}>
              Pending Compensation
            </h2>
            <p className={`mt-1 text-xs lg:text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
              Shoots that are ready for compensation setup but do not have compensation
              added yet. Select a shoot below to add compensation for its Creative
              Partners.
            </p>
          </div>

          <CPPayoutTable
            rows={pendingTableData}
            loading={pendingTableLoading}
            onRowClick={(row) => {
              const bookingId = row.bookingId || Number(row.id);
              if (!bookingId) {
                toast.error("This shoot does not have a valid booking ID.");
                return;
              }

              setSelectedPendingShootId(bookingId);
              setIsAddCompOpen(true);
            }}
            type="pending_compansation"
          />
        </div>

        {/* --- FLOATING MOBILE BUTTON --- */}
        <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] ${isDark ? "bg-[#0f0f0f]" : "bg-[#F4F5F7]"}`}>
          <Button
            onClick={handleAddCompensation}
            disabled={!canCreate}
            className="w-full bg-[#E5D5B8] text-black hover:bg-[#d4c3a3] h-14 rounded-md font-semibold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-2 border border-white/20 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Compensation
          </Button>
        </div>
        {/* Modal Components to be rendered on this page */}
        {/* CompensationDetails */}
        <CompensationModal
          isOpen={isCompOpen}
          onClose={() => setIsCompOpen(false)}
          rowContext={selectedRow}
          details={details}
          loading={detailsLoading}
          onModifyClick={handleOpenModify}
          onApproveClick={handleOpenApprove}
          onRejectClick={handleOpenReject}
          onPaymentClick={handleOpenPayment}
          onAdvancePaymentClick={handleOpenAdvancePayment}
          canEditActions={canEdit}
        />

        <AddCompendationModal
          isOpen={isAddCompOpen}
          onClose={() => {
            setIsAddCompOpen(false);
            setSelectedPendingShootId(null);
          }}
          shoots={pendingShoots}
          loading={pendingShootsLoading}
          isSubmitting={isAddSubmitting}
          initialShootId={selectedPendingShootId}
          enableAdvanceProofUpload
          onSubmit={handleAddSubmit}
        />

        {/* Secondary Execution Action Modal Layer */}
        <ModifyPayoutModal
          isOpen={isModifyOpen}
          onClose={() => {
            setIsModifyOpen(false);
            setSelectedActionEarningIds([]); 
          }}
          rowContext={selectedRow}
          creatorName={getSelectedActionCreator()?.creator_name || selectedRow?.creatorName}
          currentPayoutAmount={getSelectedActionCreator()?.total_compensation || selectedRow?.cpPayout || 0}
          isSubmitting={isModifySubmitting}
          onSubmit={handleModifySubmit}
        />

        <RejectPayoutModal
          isOpen={isRejectOpen}
          onClose={() => setIsRejectOpen(false)}
          rowContext={selectedRow}
          isSubmitting={isRejectSubmitting}
          onSubmit={handleRejectSubmit}
        />

        <ApprovePayoutModal
          isOpen={isApproveOpen}
          onClose={() => setIsApproveOpen(false)}
          rowContext={selectedRow}
          isSubmitting={isApproveSubmitting}
          onSubmit={handleApproveSubmit}
        />

        <AddReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          rowContext={selectedRow}
          payableAmount={getPaymentAmount(selectedPaymentEarningId || getActionEarningIds()[0] || null)}
          isSubmitting={isReceiptSubmitting}
          onSubmit={handleReceiptSubmit}
        />

        <SuccessModal
          isSubmitting={isSuccessSubmitting}
          isOpen={isSuccessOpen}
          onSubmit={() => setIsSuccessOpen(false)}
          title={successTitle}
          subtext={successSubtext}
          buttonText={successButtonText}
        />

        <PaymentMethodSelectionModal
          isOpen={isPaymentSelectionOpen}
          onClose={() => setPaymentSelectionOpen(false)}
          onStripeClick={handleStripePayment}
          onExternalClick={() => {
            setPaymentSelectionOpen(false);
            setIsReceiptOpen(true);
          }}
        />

        <AdvancePaymentModal
          isOpen={isAdvanceOpen}
          onClose={() => setIsAdvanceOpen(false)}
          rowContext={selectedRow}
          isSubmitting={isModifySubmitting}
          showProofUpload
          requireProofUpload
          onSubmit={handleAdvanceSubmit}
        />
      </div>
    </>
  );
}
