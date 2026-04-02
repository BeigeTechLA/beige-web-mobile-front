"use client";

import React, { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronDown,
  Search,
  Plus,
  Save,
  Check,
  MoreVertical,
  Calendar,
  Minus,
  Trash2,
  Video,
  Camera,
  Scissors,
  Radio,
  MapPin,
  Info,
  Percent,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import Topbar from "@/components/admin/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DottedDivider from "@/components/admin/DottedDivider";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  addDays,
  parseISO,
  isValid,
  differenceInDays,
  startOfDay,
} from "date-fns";
import { DatePicker } from "@/components/ui/Datepicker";
import Image from "next/image";
import QuotePreviewModal from "@/components/quotes/QuotePreviewModal";
import { salesApi, type SalesQuoteDetailData } from "@/lib/api";
import { formatQuoteItemDisplayName } from "@/lib/quoteDetail";
import {
  buildQuoteEditorHydrationState,
  normalizeQuoteEditorView,
  readQuoteEditorNavigationCache,
} from "@/lib/quoteEdit";
import {
  buildQuoteDraftPayload,
  buildQuoteUpdatePayload,
} from "@/lib/quoteDraft";
import {
  ADMIN_QUOTE_SUMMARY_STORAGE_KEY,
  buildQuoteSummarySnapshot,
  getQuoteValidationMessage,
  persistQuoteSummarySnapshot,
  validateQuoteForReview,
  validateQuoteStep,
} from "@/lib/quoteSummary";
import {
  extractQuoteIdFromResponse,
  unwrapSalesQuoteDetail,
} from "@/lib/salesQuotePreview";
import { toast } from "sonner";
import { DeleteConfirmationModal } from "@/components/admin/DeleteConfirmationModal";

const clients = [
  // Dynamic client fetching replaces hardcoded array
];

type CatalogSectionItem = {
  catalog_item_id?: string | number | null;
  name?: string;
  effective_rate?: string | number | null;
  created_at?: string | null;
};

type ShootTypeApiItem = {
  sales_shoot_type_id?: string | number | null;
  shoot_type_id?: string | number | null;
  shootTypeId?: string | number | null;
  id?: string | number | null;
  project_type_id?: string | number | null;
  projectTypeId?: string | number | null;
  quote_shoot_type_id?: string | number | null;
  name?: string | null;
  created_at?: string | null;
  is_system_default?: string | number | boolean | null;
  isSystemDefault?: string | number | boolean | null;
};

type ShootTypeOption = {
  id: string;
  apiId: string | null;
  label: string;
  createdAt: string | null;
  isSystemDefault: boolean;
  originalIndex: number;
};

type ShootTypeKind = "video" | "photo";

type ClientDropdownItem = {
  client_id?: string | number | null;
  id?: string | number | null;
  name?: string | number | null;
  client_name?: string | number | null;
  full_name?: string | number | null;
  email?: string | number | null;
  client_email?: string | number | null;
  guest_email?: string | number | null;
  phone?: string | number | null;
  mobile?: string | number | null;
  mobile_number?: string | number | null;
  phone_number?: string | number | null;
  client_phone?: string | number | null;
  address?: string | number | null;
  client_address?: string | number | null;
  location?: string | number | null;
  client_location?: string | number | null;
  street_address?: string | number | null;
  full_address?: string | number | null;
};

const PROTECTED_SERVICE_ORDER = [
  "videography",
  "photography",
  "ai editing",
  "livestream production",
  "studio",
] as const;

const PROTECTED_ADDON_LABELS = [
  "4k camera upgrade",
  "drone footage",
  "additional crew member",
  "lighting package",
  "audio recording kit",
  "green screen setup",
  "teleprompter",
  "hair and makeup artist",
  "hair & makeup artist",
] as const;

const PROTECTED_LINE_ITEM_LABELS = ["rush delivery"] as const;

const LINE_ITEM_SECTION_KEYS = [
  "line_item",
  "line_items",
  "custom_line_item",
  "custom_line_items",
  "customlineitems",
  "customLineItems",
] as const;

const normalizeServiceLabel = (label: string) => label.trim().toLowerCase();
const normalizeAddonLabel = (label: string) => label.trim().toLowerCase();
const normalizeLineItemLabel = (label: string) => label.trim().toLowerCase();
const getServiceDisplayLabel = (label: string) => formatQuoteItemDisplayName(label);

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatAddonDisplayValue = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const pickFirstClientValue = (
  ...values: Array<string | number | null | undefined>
) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;

    const normalized = String(value).trim();
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return "";
};

const getClientDisplayName = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(client?.name, client?.client_name, client?.full_name);

const getClientEmail = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(
    client?.email,
    client?.client_email,
    client?.guest_email,
  );

const getClientPhone = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(
    client?.phone,
    client?.mobile,
    client?.mobile_number,
    client?.phone_number,
    client?.client_phone,
  );

const getClientAddress = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(
    client?.address,
    client?.client_address,
    client?.location,
    client?.client_location,
    client?.street_address,
    client?.full_address,
  );

const getClientIdentifier = (client: ClientDropdownItem | null | undefined) =>
  pickFirstClientValue(
    client?.client_id,
    client?.id,
    getClientDisplayName(client),
    getClientEmail(client),
  );

const resolveShootTypeApiId = (item: ShootTypeApiItem) => {
  const preferredId =
    item.sales_shoot_type_id ??
    item.shoot_type_id ??
    item.shootTypeId ??
    item.project_type_id ??
    item.projectTypeId ??
    item.quote_shoot_type_id ??
    item.id;

  const preferredNumericId = Number(preferredId);
  if (Number.isInteger(preferredNumericId) && preferredNumericId > 0) {
    return String(preferredNumericId);
  }

  for (const [key, value] of Object.entries(item)) {
    if (!/(^id$|shoot.*id|type.*id)/i.test(key)) continue;

    const numericValue = Number(value);
    if (Number.isInteger(numericValue) && numericValue > 0) {
      return String(numericValue);
    }
  }

  return null;
};

const resolveShootTypeId = (item: ShootTypeApiItem, idx: number) => {
  return resolveShootTypeApiId(item) ?? `st-${idx}`;
};

const isValidShootTypeId = (id: string | number) => {
  const numericId = Number(id);
  return Number.isInteger(numericId) && numericId > 0;
};

const isSystemDefaultShootType = (item: ShootTypeApiItem) =>
  Number(item.is_system_default ?? item.isSystemDefault ?? 0) === 1;

const canDeleteShootTypeItem = (item: {
  id?: string | number | null;
  apiId?: string | number | null;
  isSystemDefault?: boolean;
}) => !item.isSystemDefault && isValidShootTypeId(item.apiId ?? item.id ?? "");

const isVideoServiceLabel = (label: string) =>
  normalizeServiceLabel(label) === "videography";
const isPhotoServiceLabel = (label: string) =>
  normalizeServiceLabel(label) === "photography";

const resolveServiceShootTypeKind = (label: string): ShootTypeKind | null => {
  if (isVideoServiceLabel(label)) return "video";
  if (isPhotoServiceLabel(label)) return "photo";
  return null;
};

const mapShootTypeOptions = (items: ShootTypeApiItem[]): ShootTypeOption[] => {
  const mappedShootTypes = items.map((item, idx) => {
    const apiId = resolveShootTypeApiId(item);

    return {
      id: apiId ?? resolveShootTypeId(item, idx),
      apiId,
      label: item.name || "",
      createdAt: item.created_at || null,
      isSystemDefault: isSystemDefaultShootType(item),
      originalIndex: idx,
    };
  });

  return [...mappedShootTypes].sort((a, b) => {
    const aCreatedAt = a.createdAt
      ? new Date(a.createdAt).getTime()
      : Number.NaN;
    const bCreatedAt = b.createdAt
      ? new Date(b.createdAt).getTime()
      : Number.NaN;

    if (
      Number.isFinite(aCreatedAt) &&
      Number.isFinite(bCreatedAt) &&
      aCreatedAt !== bCreatedAt
    ) {
      return aCreatedAt - bCreatedAt;
    }

    const aNumericId = Number(a.id);
    const bNumericId = Number(b.id);

    if (
      Number.isFinite(aNumericId) &&
      Number.isFinite(bNumericId) &&
      aNumericId !== bNumericId
    ) {
      return aNumericId - bNumericId;
    }

    return a.originalIndex - b.originalIndex;
  });
};

const normalizeShootTypeLabelKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");

const findMatchingShootTypeLabel = (
  shootTypeOptions: Array<{ label: string }>,
  label: string,
) => {
  const normalizedLabel = normalizeShootTypeLabelKey(label);
  if (!normalizedLabel) {
    return null;
  }

  return (
    shootTypeOptions
      .find(
        (shootType) =>
          normalizeShootTypeLabelKey(shootType.label) === normalizedLabel,
      )
      ?.label?.trim() || null
  );
};

const getSelectedShootTypeLabel = (
  shootTypeOptions: ShootTypeOption[],
  selectedId: string,
) =>
  shootTypeOptions.find((type) => type.id === selectedId)?.label?.trim() || "";

const parseStoredShootTypeLabels = (value: string) => {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return { video: "", photo: "" };
  }

  const parts = normalizedValue
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);

  let video = "";
  let photo = "";

  parts.forEach((part) => {
    const [rawPrefix, ...restParts] = part.split(":");
    const prefix = rawPrefix.trim().toLowerCase();
    const label = restParts.join(":").trim();

    if (!label) {
      return;
    }

    if (prefix === "video") {
      video = label;
    } else if (prefix === "photo") {
      photo = label;
    }
  });

  if (video && photo) {
    return { video, photo };
  }

  if (!video && !photo) {
    return { video: normalizedValue, photo: normalizedValue };
  }

  return {
    video: video || photo,
    photo: photo || video,
  };
};

const buildStoredShootTypeLabel = ({
  hasVideoService,
  hasPhotoService,
  videoShootTypeLabel,
  photoShootTypeLabel,
}: {
  hasVideoService: boolean;
  hasPhotoService: boolean;
  videoShootTypeLabel: string;
  photoShootTypeLabel: string;
}) => {
  const normalizedVideoLabel = videoShootTypeLabel.trim();
  const normalizedPhotoLabel = photoShootTypeLabel.trim();

  if (hasVideoService && hasPhotoService) {
    if (normalizedVideoLabel && normalizedPhotoLabel) {
      if (
        normalizeShootTypeLabelKey(normalizedVideoLabel) ===
        normalizeShootTypeLabelKey(normalizedPhotoLabel)
      ) {
        return normalizedVideoLabel;
      }

      return `Video: ${normalizedVideoLabel} | Photo: ${normalizedPhotoLabel}`;
    }

    return normalizedVideoLabel || normalizedPhotoLabel;
  }

  if (hasVideoService) {
    return normalizedVideoLabel;
  }

  if (hasPhotoService) {
    return normalizedPhotoLabel;
  }

  return "";
};

const isProtectedServiceLabel = (label: string) =>
  PROTECTED_SERVICE_ORDER.includes(
    normalizeServiceLabel(label) as (typeof PROTECTED_SERVICE_ORDER)[number],
  );

const isProtectedAddonLabel = (label: string) =>
  PROTECTED_ADDON_LABELS.includes(
    normalizeAddonLabel(label) as (typeof PROTECTED_ADDON_LABELS)[number],
  );

const isProtectedLineItemLabel = (label: string) =>
  PROTECTED_LINE_ITEM_LABELS.includes(
    normalizeLineItemLabel(
      label,
    ) as (typeof PROTECTED_LINE_ITEM_LABELS)[number],
  );

export default function CreateQuotePage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editQuoteId = searchParams.get("quoteId");
  const isEditMode = Boolean(editQuoteId);
  const requestedEditView = normalizeQuoteEditorView(
    searchParams.get("view"),
    isEditMode ? "details" : "selection",
  );

  // Views: 'selection' | 'details' | 'services' | 'addons' | 'logistics'
  const [view, setView] = useState<
    | "selection"
    | "details"
    | "services"
    | "addons"
    | "logistics"
    | "customlineitems"
    | "discounts"
    | "tax"
  >(requestedEditView);

  const [selectedClient, setSelectedClient] =
    useState<ClientDropdownItem | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDetailsClientDropdownOpen, setIsDetailsClientDropdownOpen] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<ClientDropdownItem[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Form State
  const [clientName, setClientName] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [validityDays, setValidityDays] = useState<number | "custom">(7);
  const [validUntil, setValidUntil] = useState(
    format(addDays(new Date(), 7), "yyyy-MM-dd"),
  );

  // Step 2: Services & Config State
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedVideoShootType, setSelectedVideoShootType] =
    useState<string>("");
  const [selectedPhotoShootType, setSelectedPhotoShootType] =
    useState<string>("");
  const [customServiceName, setCustomServiceName] = useState("");
  const [customServiceCost, setCustomServiceCost] = useState("");
  const [customShootType, setCustomShootType] = useState("");
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [activeShootTypeForm, setActiveShootTypeForm] =
    useState<ShootTypeKind | null>(null);
  const [selectedEditingType, setSelectedEditingType] = useState<string>(
    "social_media_reel_30_90",
  );
  const [showAddEditingTypeForm, setShowAddEditingTypeForm] = useState(false);
  const [customEditingType, setCustomEditingType] = useState("");
  const [isVideoShootTypeExpanded, setIsVideoShootTypeExpanded] =
    useState(true);
  const [isPhotoShootTypeExpanded, setIsPhotoShootTypeExpanded] =
    useState(true);
  const [isEditingTypeExpanded, setIsEditingTypeExpanded] = useState(true);

  // Step 3: Add-ons State
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [addonConfigs, setAddonConfigs] = useState<
    Record<string, { quantity: number; price: number }>
  >({});
  const [appliedAddonConfigs, setAppliedAddonConfigs] = useState<
    Record<string, { quantity: number; price: number }>
  >({});
  const [showAddAddonForm, setShowAddAddonForm] = useState(false);
  const [customAddonName, setCustomAddonName] = useState("");
  const [customAddonCost, setCustomAddonCost] = useState("");

  // Step 4: Logistics State
  const [logisticsItems, setLogisticsItems] = useState<any[]>([]);
  const [logisticsConfigs, setLogisticsConfigs] = useState<
    Record<string, { price: number }>
  >({});
  const [appliedLogisticsConfigs, setAppliedLogisticsConfigs] = useState<
    Record<string, { price: number }>
  >({});
  const [customLogisticsName, setCustomLogisticsName] = useState("");
  const [customLogisticsCost, setCustomLogisticsCost] = useState("");

  //Step 5: Custom Line Items State
  const [customItemName, setCustomItemName] = useState("");
  const [customItemCost, setCustomItemCost] = useState("");
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [lineItemConfigs, setLineItemConfigs] = useState<
    Record<string, { price: number }>
  >({});
  const [appliedLineItemConfigs, setAppliedLineItemConfigs] = useState<
    Record<string, { price: number }>
  >({});

  // Step 6: Discount
  type DiscountType = "percentage" | "fixed";
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState<number | string>(0);

  // Step 7: Discount
  const [selectedTax, setSelectedTax] = useState<0 | 5 | 8.5 | 10>(0);
  const [taxRate, setTaxRate] = useState<number | string>(0);
  const [taxtType, setTaxType] = useState("");

  // Configuration for each selected service
  const [serviceConfigs, setServiceConfigs] = useState<
    Record<
      string,
      {
        quantity: number;
        duration: number;
        crewSize: number;
        estimatedPrice: number;
      }
    >
  >({});

  const [services, setServices] = useState<any[]>([]);
  const [videoShootTypes, setVideoShootTypes] = useState<ShootTypeOption[]>([]);
  const [photoShootTypes, setPhotoShootTypes] = useState<ShootTypeOption[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingShootTypes, setLoadingShootTypes] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "service" | "addon" | "logistics" | "line_item" | "shoot_type";
    label: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<SalesQuoteDetailData | null>(
    null,
  );
  const [previewQuoteId, setPreviewQuoteId] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [quoteToEdit, setQuoteToEdit] =
    React.useState<SalesQuoteDetailData | null>(null);
  const [isLoadingQuoteToEdit, setIsLoadingQuoteToEdit] = React.useState(false);
  const [isHydratingQuoteToEdit, setIsHydratingQuoteToEdit] =
    React.useState(false);
  const [isCatalogLoaded, setIsCatalogLoaded] = React.useState(false);
  const hydratedQuoteIdRef = React.useRef<string | null>(null);
  const hydratingQuoteIdRef = React.useRef<string | null>(null);
  const servicesRef = React.useRef(services);
  const addonsRef = React.useRef(addons);
  const logisticsItemsRef = React.useRef(logisticsItems);
  const lineItemsRef = React.useRef(lineItems);

  const serviceIcons: Record<string, React.ReactNode> = {
    videography: <Video size={20} />,
    photography: <Camera size={20} />,
    ai_editing: <Scissors size={20} />,
    "ai editing": <Scissors size={20} />,
    livestream: <Radio size={20} />,
    "livestream production": <Radio size={20} />,
    studio: <MapPin size={20} />,
  };

  const fetchClients = async (query?: string) => {
    setLoadingClients(true);
    try {
      const res = await salesApi.getClientDropdown(query);
      if (!res.error && Array.isArray(res.data)) {
        setClients(res.data as ClientDropdownItem[]);
      }
    } catch (error) {
      console.error("Failed to fetch clients", error);
    } finally {
      setLoadingClients(false);
    }
  };

  const applyClientSelection = React.useCallback(
    (client: ClientDropdownItem | null) => {
      setSelectedClient(client);

      if (!client) {
        setClientName("");
        setEmailId("");
        setPhoneNumber("");
        setAddress("");
        return;
      }

      setClientName(getClientDisplayName(client));
      setEmailId(getClientEmail(client));
      setPhoneNumber(getClientPhone(client));
      setAddress(getClientAddress(client));
    },
    [],
  );

  React.useEffect(() => {
    if (!selectedClient) {
      return;
    }

    setClientName(getClientDisplayName(selectedClient));
    setEmailId(getClientEmail(selectedClient));
    setPhoneNumber(getClientPhone(selectedClient));
    setAddress(getClientAddress(selectedClient));
  }, [selectedClient]);

  React.useEffect(() => {
    fetchClients();
  }, []);

  // Debounced search for clients
  React.useEffect(() => {
    if (view !== "selection" && !isDetailsClientDropdownOpen) return;
    const timer = setTimeout(() => {
      fetchClients(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [isDetailsClientDropdownOpen, searchQuery, view]);

  React.useEffect(() => {
    fetchCatalog();
  }, []);

  React.useEffect(() => {
    servicesRef.current = services;
    addonsRef.current = addons;
    logisticsItemsRef.current = logisticsItems;
    lineItemsRef.current = lineItems;
  }, [addons, lineItems, logisticsItems, services]);

  const fetchShootTypes = React.useCallback(
    async (
      ids: string[],
      availableServices: Array<{ id: string; label: string }> = services,
    ) => {
      const hasVideo =
        ids.some((id) =>
          isVideoServiceLabel(
            availableServices.find((service) => service.id === id)?.label || "",
          ),
        ) || ids.includes("videography");
      const hasPhoto =
        ids.some((id) =>
          isPhotoServiceLabel(
            availableServices.find((service) => service.id === id)?.label || "",
          ),
        ) || ids.includes("photography");

      if (!hasVideo) {
        setVideoShootTypes([]);
      }

      if (!hasPhoto) {
        setPhotoShootTypes([]);
      }

      if (!hasVideo && !hasPhoto) {
        return {
          video: [] as ShootTypeOption[],
          photo: [] as ShootTypeOption[],
        };
      }

      setLoadingShootTypes(true);
      try {
        const [videoResponse, photoResponse] = await Promise.all([
          hasVideo ? salesApi.getShootTypes(1) : Promise.resolve(null),
          hasPhoto ? salesApi.getShootTypes(2) : Promise.resolve(null),
        ]);

        const nextVideoShootTypes =
          hasVideo &&
          videoResponse &&
          !videoResponse.error &&
          Array.isArray(videoResponse.data)
            ? mapShootTypeOptions(videoResponse.data as ShootTypeApiItem[])
            : [];
        const nextPhotoShootTypes =
          hasPhoto &&
          photoResponse &&
          !photoResponse.error &&
          Array.isArray(photoResponse.data)
            ? mapShootTypeOptions(photoResponse.data as ShootTypeApiItem[])
            : [];

        setVideoShootTypes(nextVideoShootTypes);
        setPhotoShootTypes(nextPhotoShootTypes);
        setSelectedVideoShootType((currentValue) => {
          if (nextVideoShootTypes.length === 0) {
            return "";
          }

          return nextVideoShootTypes.some((type) => type.id === currentValue)
            ? currentValue
            : nextVideoShootTypes[0].id;
        });
        setSelectedPhotoShootType((currentValue) => {
          if (nextPhotoShootTypes.length === 0) {
            return "";
          }

          return nextPhotoShootTypes.some((type) => type.id === currentValue)
            ? currentValue
            : nextPhotoShootTypes[0].id;
        });

        return {
          video: nextVideoShootTypes,
          photo: nextPhotoShootTypes,
        };
      } catch (error) {
        console.error("Failed to fetch shoot types", error);
      } finally {
        setLoadingShootTypes(false);
      }

      return { video: [], photo: [] };
    },
    [services],
  );

  React.useEffect(() => {
    if (!editQuoteId) {
      setQuoteToEdit(null);
      setIsLoadingQuoteToEdit(false);
      hydratedQuoteIdRef.current = null;
      hydratingQuoteIdRef.current = null;
      return;
    }

    let isMounted = true;
    const cachedQuoteToEdit = readQuoteEditorNavigationCache(editQuoteId);
    hydratedQuoteIdRef.current = null;
    hydratingQuoteIdRef.current = null;
    setQuoteToEdit(cachedQuoteToEdit);
    setIsLoadingQuoteToEdit(!cachedQuoteToEdit);

    const fetchQuoteToEdit = async () => {
      try {
        const response = await salesApi.getQuoteDetail(editQuoteId);

        if (response?.error || response?.success === false) {
          throw new Error(
            typeof response?.error === "string"
              ? response.error
              : "Failed to fetch quote details",
          );
        }

        const quoteDetail = unwrapSalesQuoteDetail(response?.data ?? null);
        if (!quoteDetail) {
          throw new Error("Quote details are unavailable");
        }

        if (!isMounted) {
          return;
        }

        setQuoteToEdit(quoteDetail);
      } catch (error) {
        console.error("Failed to load quote for edit", error);

        if (!isMounted) {
          return;
        }

        setQuoteToEdit(null);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load quote details",
        );
      } finally {
        if (isMounted) {
          setIsLoadingQuoteToEdit(false);
        }
      }
    };

    void fetchQuoteToEdit();

    return () => {
      isMounted = false;
    };
  }, [editQuoteId]);

  React.useEffect(() => {
    if (!editQuoteId || !quoteToEdit || !isCatalogLoaded) {
      return;
    }

    if (
      hydratedQuoteIdRef.current === editQuoteId ||
      hydratingQuoteIdRef.current === editQuoteId
    ) {
      return;
    }

    let isMounted = true;
    hydratingQuoteIdRef.current = editQuoteId;
    setIsHydratingQuoteToEdit(true);

    const hydrateQuoteEditor = async () => {
      try {
        const hydratedState = buildQuoteEditorHydrationState({
          quote: quoteToEdit,
          services: servicesRef.current,
          addons: addonsRef.current,
          logisticsItems: logisticsItemsRef.current,
          lineItems: lineItemsRef.current,
        });

        if (!isMounted) {
          return;
        }

        setSelectedClient(hydratedState.selectedClient);
        setClientName(hydratedState.clientName);
        setEmailId(hydratedState.emailId);
        setPhoneNumber(hydratedState.phoneNumber);
        setAddress(hydratedState.address);
        setProjectDescription(hydratedState.projectDescription);
        setValidityDays(hydratedState.validityDays);
        setValidUntil(hydratedState.validUntil);
        setDiscountEnabled(hydratedState.discountEnabled);
        setDiscountType(hydratedState.discountType);
        setDiscountValue(hydratedState.discountValue);
        setTaxRate(hydratedState.taxRate);
        setSelectedTax(
          hydratedState.taxRate === 5 ||
            hydratedState.taxRate === 8.5 ||
            hydratedState.taxRate === 10
            ? (hydratedState.taxRate as 5 | 8.5 | 10)
            : 0,
        );
        setTaxType(hydratedState.taxType);
        setServices(hydratedState.services);
        setSelectedServices(hydratedState.selectedServices);
        setServiceConfigs(hydratedState.serviceConfigs);
        setAddons(hydratedState.addons);
        setSelectedAddons(hydratedState.selectedAddons);
        setAddonConfigs(hydratedState.addonConfigs);
        setAppliedAddonConfigs(hydratedState.appliedAddonConfigs);
        setLogisticsItems(hydratedState.logisticsItems);
        setLogisticsConfigs(hydratedState.logisticsConfigs);
        setAppliedLogisticsConfigs(hydratedState.appliedLogisticsConfigs);
        setLineItems(hydratedState.lineItems);
        setLineItemConfigs(hydratedState.lineItemConfigs);
        setAppliedLineItemConfigs(hydratedState.appliedLineItemConfigs);
        setIsDropdownOpen(false);
        setSearchQuery("");

        const availableShootTypes =
          hydratedState.selectedServices.length > 0
            ? await fetchShootTypes(
                hydratedState.selectedServices,
                hydratedState.services,
              )
            : { video: [], photo: [] };

        if (!isMounted) {
          return;
        }

        const hydratedHasVideoService =
          hydratedState.selectedServices.some((id) =>
            isVideoServiceLabel(
              hydratedState.services.find((service) => service.id === id)
                ?.label || "",
            ),
          ) || hydratedState.selectedServices.includes("videography");
        const hydratedHasPhotoService =
          hydratedState.selectedServices.some((id) =>
            isPhotoServiceLabel(
              hydratedState.services.find((service) => service.id === id)
                ?.label || "",
            ),
          ) || hydratedState.selectedServices.includes("photography");
        const parsedShootTypeLabels = parseStoredShootTypeLabels(
          hydratedState.shootTypeLabel,
        );
        const assignHydratedShootType = (
          kind: ShootTypeKind,
          options: ShootTypeOption[],
          label: string,
        ) => {
          const normalizedLabel = label.trim();
          if (!normalizedLabel) {
            return;
          }

          const matchedShootType = options.find(
            (type) =>
              normalizeShootTypeLabelKey(type.label) ===
              normalizeShootTypeLabelKey(normalizedLabel),
          );

          if (matchedShootType) {
            if (kind === "video") {
              setSelectedVideoShootType(matchedShootType.id);
            } else {
              setSelectedPhotoShootType(matchedShootType.id);
            }
            return;
          }

          const fallbackShootTypeId = `edit_${kind}_shoot_type_${editQuoteId}`;
          const setShootTypeOptions =
            kind === "video" ? setVideoShootTypes : setPhotoShootTypes;
          const setSelectedShootType =
            kind === "video"
              ? setSelectedVideoShootType
              : setSelectedPhotoShootType;

          setShootTypeOptions((prev) => {
            if (findMatchingShootTypeLabel(prev, normalizedLabel)) {
              return prev;
            }

            return [
              ...prev,
              {
                id: fallbackShootTypeId,
                apiId: null,
                label: normalizedLabel,
                createdAt: quoteToEdit.created_at || null,
                isSystemDefault: false,
                originalIndex: prev.length,
              },
            ];
          });
          setSelectedShootType(fallbackShootTypeId);
        };

        if (hydratedHasVideoService) {
          assignHydratedShootType(
            "video",
            availableShootTypes.video,
            parsedShootTypeLabels.video || hydratedState.shootTypeLabel,
          );
        }

        if (hydratedHasPhotoService) {
          assignHydratedShootType(
            "photo",
            availableShootTypes.photo,
            parsedShootTypeLabels.photo || hydratedState.shootTypeLabel,
          );
        }

        setView(requestedEditView);
        hydratedQuoteIdRef.current = editQuoteId;
      } catch (error) {
        console.error("Failed to hydrate quote editor", error);
        toast.error("Failed to preload quote details");
      } finally {
        if (hydratingQuoteIdRef.current === editQuoteId) {
          hydratingQuoteIdRef.current = null;
        }

        if (isMounted) {
          setIsHydratingQuoteToEdit(false);
        }
      }
    };

    void hydrateQuoteEditor();

    return () => {
      isMounted = false;
    };
  }, [
    editQuoteId,
    fetchShootTypes,
    isCatalogLoaded,
    quoteToEdit,
    requestedEditView,
  ]);

  React.useEffect(() => {
    if (!editQuoteId || hydratedQuoteIdRef.current !== editQuoteId) {
      return;
    }

    setView(requestedEditView);
  }, [editQuoteId, requestedEditView]);

  const editingTypes = [
    {
      id: "social_media_reel_15_30",
      label: "Social Media Reel (15 sec-30 sec)",
    },
    {
      id: "social_media_reel_30_90",
      label: "Social Media Reel (30 sec-90 sec)",
    },
    { id: "mini_highlight_video", label: "Mini Highlight Video (1-2 mins)" },
    { id: "highlight_video", label: "Highlight Video (4-7 min)" },
    { id: "feature_video", label: "Feature Video (30-40 min)" },
  ];

  const handleConfigUpdate = (
    serviceId: string,
    field: string,
    value: number,
  ) => {
    setServiceConfigs((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: Math.max(0, value),
      },
    }));
  };

  const handleAddonConfigUpdate = (
    addonId: string,
    field: string,
    value: number,
  ) => {
    const nextValue =
      field === "quantity" ? Math.max(1, value) : Math.max(0, value);

    setAddonConfigs((prev) => ({
      ...prev,
      [addonId]: {
        ...prev[addonId],
        [field]: nextValue,
      },
    }));
  };

  const removeSelectedAddon = (addonId: string) => {
    setSelectedAddons((prev) => prev.filter((id) => id !== addonId));
    setAddonConfigs((prev) => {
      const newConfigs = { ...prev };
      delete newConfigs[addonId];
      return newConfigs;
    });
    setAppliedAddonConfigs((prev) => {
      const newConfigs = { ...prev };
      delete newConfigs[addonId];
      return newConfigs;
    });
  };

  const applyAddonChanges = (addonId: string, addonLabel: string) => {
    const config = addonConfigs[addonId];
    if (!config) return;

    setAppliedAddonConfigs((prev) => ({
      ...prev,
      [addonId]: { ...config },
    }));
    toast.success(`${addonLabel} changes applied!`);
  };

  const hasPendingAddonChanges = (addonId: string) => {
    const draftConfig = addonConfigs[addonId];
    const appliedConfig = appliedAddonConfigs[addonId];

    if (!draftConfig) return false;
    if (!appliedConfig) return true;

    return (
      draftConfig.quantity !== appliedConfig.quantity ||
      draftConfig.price !== appliedConfig.price
    );
  };

  const getAddonDraftPrice = (addonId: string) => {
    const config = addonConfigs[addonId];
    if (!config) return 0;
    return config.price;
  };

  const handleAddonPriceUpdate = (addonId: string, value: string) => {
    const config = addonConfigs[addonId];
    if (!config) return;

    const nextPrice = parseFloat(value.replace(/\$/g, "").trim()) || 0;
    handleAddonConfigUpdate(addonId, "price", nextPrice);
  };

  const removeLogisticsItem = (itemId: string) => {
    setLogisticsItems((prev) => prev.filter((item) => item.id !== itemId));
    setLogisticsConfigs((prev) => {
      const newConfigs = { ...prev };
      delete newConfigs[itemId];
      return newConfigs;
    });
    setAppliedLogisticsConfigs((prev) => {
      const newConfigs = { ...prev };
      delete newConfigs[itemId];
      return newConfigs;
    });
  };

  const applyLogisticsChanges = (itemId: string, itemLabel: string) => {
    const config = logisticsConfigs[itemId];
    if (!config) return;

    setAppliedLogisticsConfigs((prev) => ({
      ...prev,
      [itemId]: { ...config },
    }));
    toast.success(`${itemLabel} changes applied!`);
  };

  const hasPendingLogisticsChanges = (itemId: string) => {
    const draftConfig = logisticsConfigs[itemId];
    const appliedConfig = appliedLogisticsConfigs[itemId];

    if (!draftConfig) return false;
    if (!appliedConfig) return true;

    return draftConfig.price !== appliedConfig.price;
  };

  const removeLineItem = (itemId: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== itemId));
    setLineItemConfigs((prev) => {
      const newConfigs = { ...prev };
      delete newConfigs[itemId];
      return newConfigs;
    });
    setAppliedLineItemConfigs((prev) => {
      const newConfigs = { ...prev };
      delete newConfigs[itemId];
      return newConfigs;
    });
  };

  const applyLineItemChanges = (itemId: string, itemLabel: string) => {
    const config = lineItemConfigs[itemId];
    if (!config) return;

    setAppliedLineItemConfigs((prev) => ({
      ...prev,
      [itemId]: { ...config },
    }));
    toast.success(`${itemLabel} changes applied!`);
  };

  const hasPendingLineItemChanges = (itemId: string) => {
    const draftConfig = lineItemConfigs[itemId];
    const appliedConfig = appliedLineItemConfigs[itemId];

    if (!draftConfig) return false;
    if (!appliedConfig) return true;

    return draftConfig.price !== appliedConfig.price;
  };

  const handleServiceSelect = (serviceId: string, price: number) => {
    setSelectedServices((prev) => {
      const isSelected = prev.includes(serviceId);
      let newSelected;
      if (isSelected) {
        newSelected = prev.filter((id) => id !== serviceId);
        // Remove config if no services selected
        if (newSelected.length === 0) {
          setServiceConfigs({});
        }
      } else {
        newSelected = [...prev, serviceId];
        // Initialize config for the new service
        if (!serviceConfigs[serviceId]) {
          setServiceConfigs((prevConfigs) => ({
            ...prevConfigs,
            [serviceId]: {
              quantity: 1,
              duration: 4,
              crewSize: 1,
              estimatedPrice: price,
            },
          }));
        }
      }

      // Fetch shoot types if video or photo is selected
      fetchShootTypes(newSelected);

      return newSelected;
    });
  };

  const handleDiscountToggle = () => {
    const newState = !discountEnabled;
    setDiscountEnabled(newState);
  };

  const filteredClients = clients; // Now filtered by API
  const closeClientDropdowns = () => {
    setIsDropdownOpen(false);
    setIsDetailsClientDropdownOpen(false);
  };

  const renderClientDropdownContent = ({
    onClose,
    advanceToDetails,
  }: {
    onClose: () => void;
    advanceToDetails: boolean;
  }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.99, y: -5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.99, y: -5 }}
      transition={{ duration: 0.2 }}
      className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0F0F0F] border border-zinc-800 rounded-2xl overflow-hidden z-50 shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
    >
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 bg-[#1A1A1F] border border-[#3B3B46] rounded-xl px-4 py-2.5">
          <Search size={16} className="text-[#6B6B6B] shrink-0" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-white text-sm outline-none flex-1 placeholder:text-[#6B6B6B]"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-[#6B6B6B] hover:text-white"
            >
              x
            </button>
          )}
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto custom-scrollbar p-3">
        {loadingClients ? (
          <div className="py-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E8D1AB]"></div>
          </div>
        ) : (filteredClients || []).length === 0 ? (
          <div className="py-6 text-center text-[#6B6B6B] text-sm">
            No clients found
          </div>
        ) : (
          (filteredClients || []).map((client) => {
            const clientId = getClientIdentifier(client);
            const isSelectedClient =
              getClientIdentifier(selectedClient) === clientId;

            return (
              <div
                key={clientId}
                onClick={() => {
                  applyClientSelection(client);
                  onClose();
                  setSearchQuery("");
                  if (advanceToDetails) {
                    setView("details");
                  }
                }}
                className={`group flex items-center gap-4 px-5 py-3 lg:py-4 rounded-xl cursor-pointer transition-all mb-1 ${
                  isSelectedClient
                    ? "bg-[#FFFCE8] text-[#171717]"
                    : "hover:bg-[#FFFCE8] hover:text-[#171717] text-[#FFFFFF85]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    isSelectedClient
                      ? "border-[#E8D1AB] bg-[#E8D1AB]"
                      : "border-[#FFFFFF85] group-hover:border-[#171717]"
                  }`}
                >
                  {isSelectedClient && (
                    <div className="w-2.5 h-2.5 bg-[#101010] rounded-sm" />
                  )}
                </div>
                <span className="font-semibold text-lg">
                  {getClientDisplayName(client)}
                </span>
              </div>
            );
          })
        )}

        <button
          onClick={() => {
            applyClientSelection(null);
            onClose();
            setSearchQuery("");
            if (advanceToDetails) {
              setView("details");
            }
          }}
          className="w-full flex items-center gap-4 px-5 py-4 text-[#E8D1AB] hover:bg-[#E8D1AB]/5 transition-all rounded-xl mt-2 border-t border-zinc-800/50 pt-6"
        >
          <div className="w-6 h-6 rounded border border-[#E8D1AB]/40 flex items-center justify-center bg-[#E8D1AB]">
            <Plus size={16} className="text-[#171717]" />
          </div>
          <span className="font-semibold text-lg">Create New Client</span>
        </button>
      </div>
    </motion.div>
  );

  const renderShootTypeSection = ({
    kind,
    isExpanded,
    onToggleExpanded,
    shootTypeOptions,
    selectedId,
  }: {
    kind: ShootTypeKind;
    isExpanded: boolean;
    onToggleExpanded: () => void;
    shootTypeOptions: ShootTypeOption[];
    selectedId: string;
  }) => {
    const isFormOpen = activeShootTypeForm === kind;
    const sectionLabel =
      kind === "video" ? "Video Shoot Type" : "Photo Shoot Type";
    const fieldLabel =
      activeShootTypeForm === "photo"
        ? "Photo Shoot Type Name"
        : "Video Shoot Type Name";

    return (
      <section className="px-4 pt-4 pb-5 lg:px-8 lg:pb-10">
        <button
          onClick={onToggleExpanded}
          className="w-full flex justify-between items-center mb-6 bg-transparent border-0 outline-none group cursor-pointer"
        >
          <h2 className="text-base lg:text-xl font-medium text-white">
            {sectionLabel}
          </h2>
          <div className="text-zinc-600 transition-transform duration-300">
            {isExpanded ? (
              <ChevronDown size={22} className="rotate-180" />
            ) : (
              <ChevronDown size={22} />
            )}
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {loadingShootTypes ? (
                  <div className="col-span-4 py-5 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E8D1AB]"></div>
                  </div>
                ) : shootTypeOptions.length === 0 ? (
                  <div className="col-span-4 py-5 text-sm text-[#9A9AA4]">
                    No shoot types found.
                  </div>
                ) : (
                  shootTypeOptions.map((type) => {
                    const canDeleteShootType = canDeleteShootTypeItem(type);

                    return (
                      <div key={type.id} className="relative">
                        <button
                          onClick={() => {
                            if (kind === "video") {
                              setSelectedVideoShootType(type.id);
                            } else {
                              setSelectedPhotoShootType(type.id);
                            }
                          }}
                          className={`h-[52px] w-full rounded-[14px] px-5 pr-11 font-normal transition-all border text-sm tracking-tight text-left flex items-center ${
                            selectedId === type.id
                              ? "bg-[#262118] border-[#9F7B43] text-[#E1C48B] shadow-inner"
                              : "bg-transparent border-[#4A4A4A] text-[#A1A1AA] hover:border-zinc-700"
                          }`}
                        >
                          <span className="truncate">{type.label}</span>
                        </button>
                        {canDeleteShootType && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteShootType(kind, type.id);
                            }}
                            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-zinc-500 transition-colors hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-8 space-y-6">
                <Button
                  onClick={() =>
                    setActiveShootTypeForm(isFormOpen ? null : kind)
                  }
                  className="bg-[#F0DCB1] text-black hover:bg-[#e7d09e] h-10 px-5 rounded-[8px] flex items-center gap-2 font-medium text-sm tracking-tight shadow-none"
                >
                  <Plus size={16} strokeWidth={3} />
                  {`Add ${sectionLabel}`}
                </Button>

                <AnimatePresence>
                  {isFormOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex gap-4 items-end"
                    >
                      <div className="flex-1 relative">
                        <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                          <span className="text-xs text-[#8A8A8A] font-normal">
                            {fieldLabel}
                          </span>
                        </div>
                        <Input
                          placeholder="Eg : Real Estate"
                          value={customShootType}
                          onChange={(e) => setCustomShootType(e.target.value)}
                          className="h-15 lg:h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                        />
                      </div>
                      <button
                        onClick={() =>
                          activeShootTypeForm &&
                          handleCreateShootType(activeShootTypeForm)
                        }
                        disabled={
                          isSubmittingShootType ||
                          !customShootType ||
                          !activeShootTypeForm
                        }
                        className={`flex-none w-[52px] h-[52px] lg:w-[84px] lg:h-[84px] rounded-[14px] flex items-center justify-center transition-all ${
                          isSubmittingShootType ||
                          !customShootType ||
                          !activeShootTypeForm
                            ? "bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50"
                            : "bg-[#0DC752] text-black hover:bg-[#0bb54a]"
                        }`}
                      >
                        {isSubmittingShootType ? (
                          <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                          <Check size={24} strokeWidth={3} />
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    );
  };

  const handleValiditySelect = (days: number | "custom") => {
    setValidityDays(days);
    if (days !== "custom") {
      const newDate = addDays(new Date(), days);
      setValidUntil(format(newDate, "yyyy-MM-dd"));
    }
  };

  const formattedValidUntil = (() => {
    if (!validUntil) return "";
    const parsedDate = parseISO(validUntil);
    return isValid(parsedDate) ? format(parsedDate, "dd-MM-yyyy") : validUntil;
  })();

  const progressValue =
    view === "selection"
      ? 0
      : view === "details"
        ? 10
        : view === "services"
          ? selectedServices.length > 0
            ? 30
            : 10
          : view === "addons"
            ? 50
            : view === "logistics"
              ? 65
              : view === "customlineitems"
                ? 80
                : view === "discounts"
                  ? 90
                  : 100;

  const progressLabel = `${progressValue}%`;

  const stepNumber = ["selection", "details", "services", "addons"].includes(
    view,
  )
    ? 1
    : ["logistics", "customlineitems"].includes(view)
      ? 2
      : 3;

  const progressSegmentWidths = [0, 1, 2].map((segmentIndex) => {
    const segmentSize = 100 / 3;
    const segmentStart = segmentIndex * segmentSize;
    const segmentFill = Math.max(
      0,
      Math.min(((progressValue - segmentStart) / segmentSize) * 100, 100),
    );

    return `${segmentFill}%`;
  });

  const currentStepValidation = validateQuoteStep({
    view,
    selectedClient,
    clientName,
    emailId,
    phoneNumber,
    address,
    projectDescription,
    validUntil,
    selectedServices,
  });

  const quoteReviewValidation = validateQuoteForReview({
    selectedClient,
    clientName,
    emailId,
    phoneNumber,
    address,
    projectDescription,
    validUntil,
    selectedServices,
  });

  const canContinueToNextStep = currentStepValidation.isValid;
  const canPrimaryAction =
    view === "tax" ? quoteReviewValidation.isValid : canContinueToNextStep;
  const canOpenQuoteSummary = quoteReviewValidation.isValid;

  const handleContinue = async () => {
    if (!currentStepValidation.isValid) {
      toast.error(getQuoteValidationMessage(currentStepValidation));
      return;
    }

    if (view === "selection" && selectedClient) {
      applyClientSelection(selectedClient);
      setView("details");
    } else if (view === "details") {
      setView("services");
    } else if (view === "services") {
      setView("addons");
    } else if (view === "addons") {
      setView("logistics");
    } else if (view === "logistics") {
      setView("customlineitems");
    } else if (view === "customlineitems") {
      setView("discounts");
    } else if (view === "discounts") {
      setView("tax");
    } else {
      await handlePreviewQuote();
    }
  };

 const handleBack = () => {
    if (view === 'details') {
      setView('selection');
    } else if (view === 'services') {
      setView('details');
    } else if (view === 'addons') {
      setView('services');
    } else if (view === 'logistics') {
      setView('addons');
    } else if (view === 'customlineitems') {
      setView('logistics');
    } else if (view === 'discounts') {
      setView('customlineitems');
       } else if (view === 'tax') {
      setView('discounts');
      // Further steps to be added form customlineitems on wards
    } else {
      router.back();
    }
  };

  const handleDiscountTypeSelect = (type: DiscountType) => {
    setDiscountType(type);
  };

  const handleWholeNumberInput = (value: string) => {
    return value.replace(/\D/g, "");
  };

  const handleDecimalInput = (value: string) => {
    const normalizedValue = value.replace(/[^\d.]/g, "");
    const firstDecimalIndex = normalizedValue.indexOf(".");

    if (firstDecimalIndex === -1) {
      return normalizedValue;
    }

    const integerPart = normalizedValue.slice(0, firstDecimalIndex + 1);
    const decimalPart = normalizedValue
      .slice(firstDecimalIndex + 1)
      .replace(/\./g, "");
    return `${integerPart}${decimalPart}`;
  };

  // const handleTaxRate = (taxRate) => {
  //   setDiscountType(taxRate);
  // };

  const hasVideoService =
    selectedServices.some(
      (id) =>
        services.find((s) => s.id === id)?.label.toLowerCase() ===
        "videography",
    ) || selectedServices.includes("videography");
  const hasPhotoService =
    selectedServices.some(
      (id) =>
        services.find((s) => s.id === id)?.label.toLowerCase() ===
        "photography",
    ) || selectedServices.includes("photography");
  const hasAiEditingService =
    selectedServices.some(
      (id) =>
        services.find((s) => s.id === id)?.label.toLowerCase() === "ai editing",
    ) || selectedServices.includes("ai_editing");
  const selectedVideoShootTypeLabel = getSelectedShootTypeLabel(
    videoShootTypes,
    selectedVideoShootType,
  );
  const selectedPhotoShootTypeLabel = getSelectedShootTypeLabel(
    photoShootTypes,
    selectedPhotoShootType,
  );
  const storedShootTypeLabel = buildStoredShootTypeLabel({
    hasVideoService,
    hasPhotoService,
    videoShootTypeLabel: selectedVideoShootTypeLabel,
    photoShootTypeLabel: selectedPhotoShootTypeLabel,
  });
  const quoteDraftShootTypes = storedShootTypeLabel
    ? [{ id: "__selected_shoot_type__", label: storedShootTypeLabel }]
    : [];
  const quoteDraftSelectedShootType = storedShootTypeLabel
    ? "__selected_shoot_type__"
    : "";
  const totalAddOnsCost = selectedAddons.reduce((total, addonId) => {
    const config = addonConfigs[addonId] ?? appliedAddonConfigs[addonId];
    if (!config) return total;
    return total + config.quantity * config.price;
  }, 0);
  const totalLogisticsCost = logisticsItems.reduce((total, item) => {
    const config = appliedLogisticsConfigs[item.id];
    if (!config) return total;
    return total + config.price;
  }, 0);
  const totalLineItemsCost = lineItems.reduce((total, item) => {
    const config = appliedLineItemConfigs[item.id];
    if (!config) return total;
    return total + config.price;
  }, 0);
  const totalServicesCost = selectedServices.reduce((total, serviceId) => {
    const config = serviceConfigs[serviceId];
    if (!config) return total;
    return total + config.duration * config.crewSize * config.estimatedPrice;
  }, 0);

  React.useEffect(() => {
    if (activeShootTypeForm === "video" && !hasVideoService) {
      setActiveShootTypeForm(null);
    }

    if (activeShootTypeForm === "photo" && !hasPhotoService) {
      setActiveShootTypeForm(null);
    }
  }, [activeShootTypeForm, hasPhotoService, hasVideoService]);

  const quoteSubtotal =
    totalServicesCost +
    totalAddOnsCost +
    totalLogisticsCost +
    totalLineItemsCost;
  const normalizedTaxRate = Math.max(0, Number(taxRate) || selectedTax || 0);
  const taxAmount = quoteSubtotal * (normalizedTaxRate / 100);
  const totalAfterTax = quoteSubtotal + taxAmount;
  const normalizedDiscountValue = Math.max(0, Number(discountValue) || 0);
  const rawDiscountAmount = !discountEnabled
    ? 0
    : discountType === "percentage"
      ? totalAfterTax * (normalizedDiscountValue / 100)
      : normalizedDiscountValue;
  const discountAmount = Math.min(rawDiscountAmount, totalAfterTax);
  const totalAfterDiscount = Math.max(totalAfterTax - discountAmount, 0);
  const taxLabel = taxtType.trim() || "Sales Tax";
  const [isSubmittingService, setIsSubmittingService] = React.useState(false);
  const [isCreatingQuoteDraft, setIsCreatingQuoteDraft] = React.useState(false);
  const [activeQuoteAction, setActiveQuoteAction] = React.useState<
    "preview" | "save" | "draft" | null
  >(null);

  const getQuoteDraftPayload = (maxStep?: typeof view) =>
    buildQuoteDraftPayload({
      selectedClient,
      clientName,
      emailId,
      phoneNumber,
      address,
      projectDescription,
      validityDays,
      validUntil,
      discountEnabled,
      discountType,
      discountValue,
      taxLabel,
      normalizedTaxRate,
      selectedShootType: quoteDraftSelectedShootType,
      shootTypes: quoteDraftShootTypes,
      selectedServices,
      services,
      serviceConfigs,
      selectedAddons,
      addons,
      appliedAddonConfigs,
      logisticsItems,
      appliedLogisticsConfigs,
      lineItems,
      appliedLineItemConfigs,
      maxStep,
    });

  const getQuoteUpdatePayload = (maxStep?: typeof view) =>
    buildQuoteUpdatePayload({
      selectedClient,
      clientName,
      emailId,
      phoneNumber,
      address,
      projectDescription,
      validityDays,
      validUntil,
      discountEnabled,
      discountType,
      discountValue,
      taxLabel,
      normalizedTaxRate,
      selectedShootType: quoteDraftSelectedShootType,
      shootTypes: quoteDraftShootTypes,
      selectedServices,
      services,
      serviceConfigs,
      selectedAddons,
      addons,
      appliedAddonConfigs,
      logisticsItems,
      appliedLogisticsConfigs,
      lineItems,
      appliedLineItemConfigs,
      maxStep,
    });

  const getQuoteSummarySnapshot = () =>
    buildQuoteSummarySnapshot({
      selectedClient,
      clientName,
      emailId,
      phoneNumber,
      address,
      projectDescription,
      validityDays,
      validUntil,
      discountEnabled,
      discountType,
      discountValue,
      taxLabel,
      normalizedTaxRate,
      selectedShootType: quoteDraftSelectedShootType,
      shootTypes: quoteDraftShootTypes,
      selectedServices,
      services,
      serviceConfigs,
      selectedAddons,
      addons,
      appliedAddonConfigs,
      logisticsItems,
      appliedLogisticsConfigs,
      lineItems,
      appliedLineItemConfigs,
    });

  const delayAfterSuccessToast = () =>
    new Promise((resolve) => window.setTimeout(resolve, 450));

  const saveQuoteDraft = async (action: "preview" | "save" | "draft") => {
    if (isCreatingQuoteDraft) return;

    const isUpdatingExistingQuote = Boolean(isEditMode && editQuoteId);
    const basePayload = getQuoteDraftPayload(
      action === "draft" ? view : undefined,
    );
    const payload = isUpdatingExistingQuote
      ? getQuoteUpdatePayload(action === "draft" ? view : undefined)
      : action === "save"
        ? {
            ...basePayload,
            is_draft: false,
          }
        : basePayload;

    setIsCreatingQuoteDraft(true);
    setActiveQuoteAction(action);

    if (action === "preview") {
      setPreviewQuote(null);
      setPreviewQuoteId(null);
      setIsPreviewModalOpen(true);
    }

    let savedQuoteId: string | null = null;

    try {
      const response = isUpdatingExistingQuote
        ? await salesApi.updateQuote(editQuoteId as string, payload)
        : await salesApi.createQuoteDraft(payload);
      const persistedQuoteSource =
        response && typeof response === "object" && "data" in response
          ? (response.data as SalesQuoteDetailData | null | undefined)
          : (response as SalesQuoteDetailData | null | undefined);
      const persistedQuote = unwrapSalesQuoteDetail(persistedQuoteSource);

      if (response?.error || response?.success === false) {
        throw new Error(
          typeof response?.error === "string"
            ? response.error
            : isUpdatingExistingQuote
              ? "Failed to update quote"
              : "Failed to create quote draft",
        );
      }

      savedQuoteId =
        (isUpdatingExistingQuote && editQuoteId ? String(editQuoteId) : null) ??
        extractQuoteIdFromResponse(response) ??
        extractQuoteIdFromResponse(persistedQuote);

      if (persistedQuote) {
        setQuoteToEdit(persistedQuote);
      }

      if (action === "save") {
        toast.success(
          isUpdatingExistingQuote
            ? "Quote updated successfully"
            : "Quote saved successfully",
        );
        await delayAfterSuccessToast();
        router.push("/admin/quotes");
        return;
      }

      if (action === "draft") {
        toast.success(
          isUpdatingExistingQuote
            ? "Draft updated successfully"
            : "Draft saved successfully",
        );
        return;
      }

      if (!savedQuoteId) {
        if (persistedQuote) {
          setPreviewQuoteId(extractQuoteIdFromResponse(persistedQuote));
          setPreviewQuote(persistedQuote);
          toast.success("Quote preview loaded");
          return;
        }

        throw new Error("Quote draft was saved, but no quote id was returned");
      }

      const detailResponse = await salesApi.getQuoteDetail(savedQuoteId);

      if (detailResponse?.error || detailResponse?.success === false) {
        if (persistedQuote) {
          setPreviewQuoteId(savedQuoteId);
          setPreviewQuote(persistedQuote);
          toast.success("Quote preview loaded");
          return;
        }

        throw new Error(
          typeof detailResponse?.error === "string"
            ? detailResponse.error
            : "Failed to fetch quote detail",
        );
      }

      const quoteDetail =
        unwrapSalesQuoteDetail(detailResponse?.data ?? null) ?? persistedQuote;

      if (!quoteDetail) {
        throw new Error("Quote preview could not be loaded");
      }

      setPreviewQuoteId(savedQuoteId);
      setPreviewQuote(quoteDetail);
      toast.success("Quote preview loaded");
    } catch (error) {
      console.error(
        action === "preview"
          ? "Failed to load quote preview"
          : action === "draft"
            ? "Failed to save draft"
            : "Failed to save quote",
        error,
      );

      if (action === "preview") {
        setIsPreviewModalOpen(false);
      }

      const fallbackMessage =
        action === "preview" && savedQuoteId
          ? "Quote saved, but preview could not be loaded"
          : action === "preview"
            ? "Failed to load quote preview"
            : action === "draft"
              ? isUpdatingExistingQuote
                ? "Failed to update draft"
                : "Failed to save draft"
              : isUpdatingExistingQuote
                ? "Failed to update quote"
                : "Failed to save quote";

      toast.error(error instanceof Error ? error.message : fallbackMessage);
    } finally {
      setIsCreatingQuoteDraft(false);
      setActiveQuoteAction(null);
    }
  };

  const handlePreviewQuote = async () => {
    if (!quoteReviewValidation.isValid) {
      toast.error(getQuoteValidationMessage(quoteReviewValidation));
      return;
    }

    await saveQuoteDraft("preview");
  };

  const handleSaveQuote = async () => {
    if (!quoteReviewValidation.isValid) {
      toast.error(getQuoteValidationMessage(quoteReviewValidation));
      return;
    }

    await saveQuoteDraft("save");
  };

  const handleSaveAsDraft = async () => {
    await saveQuoteDraft("draft");
  };

  const handleOpenQuoteSummary = () => {
    if (!quoteReviewValidation.isValid) {
      toast.error(getQuoteValidationMessage(quoteReviewValidation));
      return;
    }

    persistQuoteSummarySnapshot(
      ADMIN_QUOTE_SUMMARY_STORAGE_KEY,
      getQuoteSummarySnapshot(),
    );
    router.push("/admin/quotes/summary");
  };

  const fetchCatalog = async () => {
    setIsCatalogLoaded(false);
    setLoadingServices(true);
    try {
      const res = await salesApi.getQuoteCatalog();
      if (!res.error && res.data) {
        const { service, addon, logistics } = res.data;

        if (service) {
          const mappedServices = service.map((item: any, idx: number) => {
            const name =
              item.name.toLowerCase() === "location" ? "Studio" : item.name;
            return {
              id: (item.catalog_item_id || `svc-${idx}`).toString(),
              label: name,
              price: parseFloat(item.effective_rate) || 0,
              icon: serviceIcons[name.toLowerCase()] || <Plus size={20} />,
              createdAt: item.created_at || null,
              originalIndex: idx,
            };
          });

          const sortedServices = [...mappedServices].sort((a, b) => {
            const aLabel = normalizeServiceLabel(a.label);
            const bLabel = normalizeServiceLabel(b.label);
            const aProtected = isProtectedServiceLabel(a.label);
            const bProtected = isProtectedServiceLabel(b.label);

            if (aProtected && bProtected) {
              return (
                PROTECTED_SERVICE_ORDER.indexOf(
                  aLabel as (typeof PROTECTED_SERVICE_ORDER)[number],
                ) -
                PROTECTED_SERVICE_ORDER.indexOf(
                  bLabel as (typeof PROTECTED_SERVICE_ORDER)[number],
                )
              );
            }

            if (aProtected !== bProtected) {
              return aProtected ? -1 : 1;
            }

            const aCreatedAt = a.createdAt
              ? new Date(a.createdAt).getTime()
              : Number.NaN;
            const bCreatedAt = b.createdAt
              ? new Date(b.createdAt).getTime()
              : Number.NaN;

            if (
              Number.isFinite(aCreatedAt) &&
              Number.isFinite(bCreatedAt) &&
              aCreatedAt !== bCreatedAt
            ) {
              return aCreatedAt - bCreatedAt;
            }

            const aNumericId = Number(a.id);
            const bNumericId = Number(b.id);

            if (
              Number.isFinite(aNumericId) &&
              Number.isFinite(bNumericId) &&
              aNumericId !== bNumericId
            ) {
              return aNumericId - bNumericId;
            }

            return a.originalIndex - b.originalIndex;
          });

          setServices(sortedServices);
        }

        if (addon) {
          const mappedAddons = addon.map((item: any, idx: number) => ({
            id: (item.catalog_item_id || `add-${idx}`).toString(),
            label: item.name,
            price: parseFloat(item.effective_rate) || 0,
            createdAt: item.created_at || null,
            originalIndex: idx,
          }));

          const sortedAddons = [...mappedAddons].sort((a, b) => {
            const aProtected = isProtectedAddonLabel(a.label);
            const bProtected = isProtectedAddonLabel(b.label);

            if (aProtected !== bProtected) {
              return aProtected ? -1 : 1;
            }

            if (aProtected && bProtected) {
              return a.originalIndex - b.originalIndex;
            }

            const aCreatedAt = a.createdAt
              ? new Date(a.createdAt).getTime()
              : Number.NaN;
            const bCreatedAt = b.createdAt
              ? new Date(b.createdAt).getTime()
              : Number.NaN;

            if (
              Number.isFinite(aCreatedAt) &&
              Number.isFinite(bCreatedAt) &&
              aCreatedAt !== bCreatedAt
            ) {
              return aCreatedAt - bCreatedAt;
            }

            const aNumericId = Number(a.id);
            const bNumericId = Number(b.id);

            if (
              Number.isFinite(aNumericId) &&
              Number.isFinite(bNumericId) &&
              aNumericId !== bNumericId
            ) {
              return aNumericId - bNumericId;
            }

            return a.originalIndex - b.originalIndex;
          });

          setAddons(sortedAddons);
        }

        if (logistics) {
          const mappedLogistics = logistics.map((item: any, idx: number) => ({
            id: (item.catalog_item_id || `log-${idx}`).toString(),
            label: item.name,
            basePrice: parseFloat(item.effective_rate) || 0,
            createdAt: item.created_at || null,
            originalIndex: idx,
          }));

          const sortedLogistics = [...mappedLogistics].sort((a, b) => {
            const aCreatedAt = a.createdAt
              ? new Date(a.createdAt).getTime()
              : Number.NaN;
            const bCreatedAt = b.createdAt
              ? new Date(b.createdAt).getTime()
              : Number.NaN;

            if (
              Number.isFinite(aCreatedAt) &&
              Number.isFinite(bCreatedAt) &&
              aCreatedAt !== bCreatedAt
            ) {
              return aCreatedAt - bCreatedAt;
            }

            const aNumericId = Number(a.id);
            const bNumericId = Number(b.id);

            if (
              Number.isFinite(aNumericId) &&
              Number.isFinite(bNumericId) &&
              aNumericId !== bNumericId
            ) {
              return aNumericId - bNumericId;
            }

            return a.originalIndex - b.originalIndex;
          });

          setLogisticsItems(sortedLogistics);

          // Initialize logistics configs
          const configs: Record<string, { price: number }> = {};
          sortedLogistics.forEach((item: any) => {
            configs[item.id] = { price: item.basePrice };
          });
          setLogisticsConfigs(configs);
          setAppliedLogisticsConfigs(configs);
        }

        const lineItemSection = LINE_ITEM_SECTION_KEYS.map(
          (key) => (res.data as Record<string, unknown>)[key],
        ).find((section): section is CatalogSectionItem[] =>
          Array.isArray(section),
        );

        if (lineItemSection) {
          const mappedLineItems = lineItemSection.map(
            (item: CatalogSectionItem, idx: number) => ({
              id: (item.catalog_item_id || `line-${idx}`).toString(),
              label: item.name,
              basePrice: parseFloat(item.effective_rate) || 0,
              createdAt: item.created_at || null,
              originalIndex: idx,
            }),
          );

          const sortedLineItems = [...mappedLineItems].sort((a, b) => {
            const aProtected = isProtectedLineItemLabel(a.label);
            const bProtected = isProtectedLineItemLabel(b.label);

            if (aProtected !== bProtected) {
              return aProtected ? -1 : 1;
            }

            if (aProtected && bProtected) {
              return a.originalIndex - b.originalIndex;
            }

            const aCreatedAt = a.createdAt
              ? new Date(a.createdAt).getTime()
              : Number.NaN;
            const bCreatedAt = b.createdAt
              ? new Date(b.createdAt).getTime()
              : Number.NaN;

            if (
              Number.isFinite(aCreatedAt) &&
              Number.isFinite(bCreatedAt) &&
              aCreatedAt !== bCreatedAt
            ) {
              return aCreatedAt - bCreatedAt;
            }

            const aNumericId = Number(a.id);
            const bNumericId = Number(b.id);

            if (
              Number.isFinite(aNumericId) &&
              Number.isFinite(bNumericId) &&
              aNumericId !== bNumericId
            ) {
              return aNumericId - bNumericId;
            }

            return a.originalIndex - b.originalIndex;
          });

          setLineItems((prev) => {
            const localItems = prev.filter((item) =>
              item.id?.startsWith("custom_"),
            );
            return [...sortedLineItems, ...localItems];
          });

          setLineItemConfigs((prev) => {
            const configs: Record<string, { price: number }> = {};
            Object.entries(prev).forEach(([id, value]) => {
              if (id.startsWith("custom_")) {
                configs[id] = value;
              }
            });
            sortedLineItems.forEach((item) => {
              configs[item.id] = { price: item.basePrice };
            });
            return configs;
          });

          setAppliedLineItemConfigs((prev) => {
            const configs: Record<string, { price: number }> = {};
            Object.entries(prev).forEach(([id, value]) => {
              if (id.startsWith("custom_")) {
                configs[id] = value;
              }
            });
            sortedLineItems.forEach((item) => {
              configs[item.id] = { price: item.basePrice };
            });
            return configs;
          });
        } else {
          setLineItems((prev) =>
            prev.filter((item) => item.id?.startsWith("custom_")),
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch catalog", error);
    } finally {
      setLoadingServices(false);
      setIsCatalogLoaded(true);
    }
  };

  const handleCreateService = async () => {
    if (!customServiceName || !customServiceCost) return;

    setIsSubmittingService(true);
    try {
      const res = await salesApi.createQuoteCatalog({
        section_type: "service",
        name: customServiceName,
        default_rate:
          parseFloat(customServiceCost.replace(/[^0-9.]/g, "")) || 0,
        rate_type: "per_hour",
        rate_unit: "per hour",
      });

      if (res && !res.error) {
        // Success
        setCustomServiceName("");
        setCustomServiceCost("");
        setShowAddServiceForm(false);
        // Refetch the catalog to show the new service
        await fetchCatalog();
      } else {
        console.error(
          "Failed to create service:",
          res?.error || "Unknown error",
        );
      }
    } catch (error) {
      console.error("Error creating service:", error);
    } finally {
      setIsSubmittingService(false);
    }
  };

  const handleDeleteCatalogItem = (
    id: string,
    type: "service" | "addon" | "logistics" | "line_item",
  ) => {
    const item =
      type === "service"
        ? services.find((s) => s.id === id)
        : type === "addon"
          ? addons.find((a) => a.id === id)
          : type === "logistics"
            ? logisticsItems.find((item) => item.id === id)
            : lineItems.find((item) => item.id === id);

    if (item) {
      if (type === "service" && isProtectedServiceLabel(item.label)) {
        toast.error("Default services can't be deleted");
        return;
      }

      if (type === "line_item" && isProtectedLineItemLabel(item.label)) {
        toast.error("Default line items can't be deleted");
        return;
      }

      setItemToDelete({ id, type, label: item.label });
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteShootType = (kind: ShootTypeKind, id: string) => {
    const shootTypeOptions =
      kind === "video" ? videoShootTypes : photoShootTypes;
    const item = shootTypeOptions.find((type) => type.id === id);
    if (!item) return;

    if (item.isSystemDefault) {
      toast.error("Default shoot types can't be deleted");
      return;
    }

    const shootTypeId = item.apiId ?? item.id;

    if (!canDeleteShootTypeItem(item)) {
      toast.error("Invalid shoot type id. Please refresh and try again.");
      return;
    }

    setItemToDelete({
      id: String(shootTypeId),
      type: "shoot_type",
      label: item.label,
    });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    if (
      itemToDelete.type === "line_item" &&
      itemToDelete.id.startsWith("custom_")
    ) {
      removeLineItem(itemToDelete.id);
      toast.success("Line item deleted successfully");
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      return;
    }

    if (itemToDelete.type === "shoot_type") {
      const shootTypeItem = [...videoShootTypes, ...photoShootTypes].find(
        (type) =>
          String(type.id) === itemToDelete.id ||
          String(type.apiId ?? "") === itemToDelete.id,
      );

      if (shootTypeItem?.isSystemDefault) {
        toast.error("Default shoot types can't be deleted");
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        return;
      }
    }

    setIsDeleting(true);
    try {
      const res =
        itemToDelete.type === "shoot_type"
          ? await salesApi.deleteShootType(itemToDelete.id)
          : await salesApi.deleteQuoteCatalog(itemToDelete.id);
      if (res && !res.error) {
        toast.success(
          `${itemToDelete.type === "service" ? "Service" : itemToDelete.type === "addon" ? "Add-on" : itemToDelete.type === "logistics" ? "Logistics item" : itemToDelete.type === "shoot_type" ? "Shoot type" : "Line item"} deleted successfully`,
        );
        if (itemToDelete.type === "shoot_type") {
          await fetchShootTypes(selectedServices);
        } else {
          // Refresh catalog
          await fetchCatalog();
          // Remove from selected if it was selected
          if (itemToDelete.type === "service") {
            setSelectedServices((prev) =>
              prev.filter((sid) => sid !== itemToDelete.id),
            );
          } else if (itemToDelete.type === "addon") {
            removeSelectedAddon(itemToDelete.id);
          } else if (itemToDelete.type === "logistics") {
            removeLogisticsItem(itemToDelete.id);
          } else {
            removeLineItem(itemToDelete.id);
          }
        }
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      } else {
        toast.error(`Failed to delete: ${res?.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error(`Error deleting item:`, error);
      toast.error("An error occurred while deleting the item");
    } finally {
      setIsDeleting(false);
    }
  };

  const [isSubmittingShootType, setIsSubmittingShootType] =
    React.useState(false);

  const handleCreateShootType = async (kind: ShootTypeKind) => {
    if (!customShootType) return;

    setIsSubmittingShootType(true);
    try {
      const res = await salesApi.createShootType({
        name: customShootType,
        content_type: kind === "video" ? 1 : 2,
      });

      if (res && !res.error) {
        setCustomShootType("");
        setActiveShootTypeForm(null);
        await fetchShootTypes(selectedServices);
      } else {
        console.error(
          "Failed to create shoot type:",
          res?.error || "Unknown error",
        );
      }
    } catch (error) {
      console.error("Error creating shoot type:", error);
    } finally {
      setIsSubmittingShootType(false);
    }
  };

  const [isSubmittingAddon, setIsSubmittingAddon] = React.useState(false);

  const handleCreateAddon = async () => {
    if (!customAddonName || !customAddonCost) return;

    setIsSubmittingAddon(true);
    try {
      const res = await salesApi.createQuoteCatalog({
        section_type: "addon",
        name: customAddonName,
        default_rate: parseFloat(customAddonCost.replace(/[^0-9.]/g, "")) || 0,
        rate_type: "fixed",
        rate_unit: "fixed",
      });

      if (res && !res.error) {
        setCustomAddonName("");
        setCustomAddonCost("");
        setShowAddAddonForm(false);
        // Refresh catalog
        await fetchCatalog();
      } else {
        console.error("Failed to create addon:", res?.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error creating addon:", error);
    } finally {
      setIsSubmittingAddon(false);
    }
  };

  const [isSubmittingLogistics, setIsSubmittingLogistics] =
    React.useState(false);

  const handleCreateLogisticsItem = async () => {
    if (!customLogisticsName || !customLogisticsCost) return;

    setIsSubmittingLogistics(true);
    try {
      const res = await salesApi.createQuoteCatalog({
        section_type: "logistics",
        name: customLogisticsName,
        default_rate:
          parseFloat(customLogisticsCost.replace(/[^0-9.]/g, "")) || 0,
        rate_type: "fixed",
        rate_unit: "fixed",
      });

      if (res && !res.error) {
        setCustomLogisticsName("");
        setCustomLogisticsCost("");
        await fetchCatalog();
      } else {
        console.error(
          "Failed to create logistics item:",
          res?.error || "Unknown error",
        );
      }
    } catch (error) {
      console.error("Error creating logistics item:", error);
    } finally {
      setIsSubmittingLogistics(false);
    }
  };

  const [isSubmittingLineItem, setIsSubmittingLineItem] = React.useState(false);

  const handleCreateLineItem = async () => {
    if (!customItemName || !customItemCost) return;

    setIsSubmittingLineItem(true);
    try {
      const newId = `custom_${Date.now()}`;
      const cost = parseFloat(customItemCost.replace(/[^0-9.]/g, "")) || 0;

      setLineItems((prev) => [
        ...prev,
        {
          id: newId,
          label: customItemName,
          basePrice: cost,
          createdAt: new Date().toISOString(),
        },
      ]);
      setLineItemConfigs((prev) => ({ ...prev, [newId]: { price: cost } }));
      setAppliedLineItemConfigs((prev) => ({
        ...prev,
        [newId]: { price: cost },
      }));
      setCustomItemName("");
      setCustomItemCost("");
    } catch (error) {
      console.error("Error creating line item:", error);
    } finally {
      setIsSubmittingLineItem(false);
    }
  };

  const quoteEditorBreadcrumbs = React.useMemo(
    () => ({
      create: isEditMode ? "Edit Quote" : "Creating New Quote",
    }),
    [isEditMode],
  );

  if (isEditMode && !quoteToEdit && (isLoadingQuoteToEdit || isHydratingQuoteToEdit)) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white">
        <Topbar
          pathname={pathname}
          breadcrumbOverrides={quoteEditorBreadcrumbs}
          actions={
            <Button
              type="button"
              onClick={handleOpenQuoteSummary}
              disabled={!canOpenQuoteSummary}
              className="bg-[#E5D5B8] text-black disabled:opacity-60"
            >
              View Quote Summary
            </Button>
          }
        />

        <div className="px-4 pb-12 pt-6 lg:px-9 lg:pt-8">
          <div className="flex min-h-[420px] items-center justify-center rounded-[18px] border border-[#3D3D3D] bg-[#171717]">
            <div className="flex items-center gap-3 text-sm text-white/70">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E8D1AB] border-t-transparent" />
              Loading quote details...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <Topbar
        pathname={pathname}
        breadcrumbOverrides={quoteEditorBreadcrumbs}
        actions={
          <Button
            type="button"
            onClick={handleOpenQuoteSummary}
            disabled={!canOpenQuoteSummary}
            className="bg-[#E5D5B8] text-black disabled:opacity-60"
          >
            View Quote Summary
          </Button>
        }
      />

      <div className="px-4 pb-30 pt-6 lg:px-9 lg:pb-12 lg:pt-8 mx-auto">
        {/* Navigation & Progress Header */}
        <div className="flex justify-between items-center mb-7">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-base text-[#D4D4D4] hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="text-right">
            <Button
              type="button"
              onClick={handleOpenQuoteSummary}
              disabled={!canOpenQuoteSummary}
              className="block lg:hidden bg-[#E5D5B8] text-sm h-8 text-black disabled:opacity-60"
            >
              View Quote Summary
            </Button>
            <span className="hidden lg:block text-base font-semibold text-white">
              Step {stepNumber} - {progressLabel} Completed
            </span>
          </div>
        </div>

        <div className="block lg:hidden mb-2">
          <span className="text-sm font-semibold text-white">
            Step {stepNumber} - {progressLabel} Completed
          </span>
        </div>
        {/* Progress Bars */}
        <div className="flex gap-3 mb-8 lg:mb-9">
          <div className="h-1 flex-1 bg-[#5B5B5B] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-500 rounded-full"
              style={{ width: progressSegmentWidths[0] }}
            />
          </div>
          <div className="h-1 flex-1 bg-[#5B5B5B] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-500 rounded-full"
              style={{ width: progressSegmentWidths[1] }}
            />
          </div>
          <div className="h-1 flex-1 bg-[#5B5B5B] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#E8D1AB] transition-all duration-500 rounded-full"
              style={{ width: progressSegmentWidths[2] }}
            />
          </div>
        </div>

        {/* Main Card */}
        {/* <div className={`border rounded-[18px] mb-8 bg-[#171717] border-[#3D3D3D] ${view === 'selection' ? 'overflow-visible' : 'p-10 overflow-hidden'}`}> */}
        <div
          className={`border rounded-[18px] mb-8 bg-[#171717] border-[#3D3D3D] overflow-visible`}
        >
          {view === "logistics" ? (
            <div className="">
              <section>
                <div className="p-4 pt-5 lg:p-8 lg:pt-10">
                  <h2 className="lg:text-xl font-medium leading-none mb-2 text-white">
                    Logistics
                  </h2>
                  <p className="text-[#A1A1AA] text-sm font-normal leading-none">
                    Manage travel, equipment, permits, and other logistical
                    costs
                  </p>
                </div>
                <hr className="border-t border-[#3D3D3D]" />

                <div className="space-y-4 p-4 lg:p-9">
                  {logisticsItems.map((item) => {
                    const config = logisticsConfigs[item.id];
                    const hasPendingChanges = hasPendingLogisticsChanges(
                      item.id,
                    );
                    return (
                      <div
                        key={item.id}
                        className="bg-[#0F0F0F] border border-[#4A4A4A] rounded-[14px] p-4 lg:p-5 relative overflow-hidden"
                      >
                        <div className="flex flex-col lg:flex-row gap-4 lg:justify-between lg:items-center">
                          <div className="flex lg:flex-col justify-between lg:gap-1">
                            <h3 className="text-sm lg:text-base font-medium text-white leading-none">
                              {item.label}
                            </h3>
                            <p className="text-[#F0DCB1] text-sm font-semibold tracking-tight leading-none">
                              ${item.basePrice.toFixed(2)}
                            </p>
                          </div>

                          <hr className="lg:hidden border-t border-[#3D3D3D]" />

                          <div className="flex items-center gap-6">
                            <div className="relative w-2/3 lg:w-36">
                              <Input
                                value={`$ ${config?.price || 0}`}
                                onChange={(e) => {
                                  const val =
                                    parseFloat(
                                      e.target.value.replace("$ ", ""),
                                    ) || 0;
                                  setLogisticsConfigs((prev) => ({
                                    ...prev,
                                    [item.id]: { price: val },
                                  }));
                                }}
                                className="h-9 bg-[#1A1A1F] border-[#3B3B46] rounded-[8px] text-white text-sm pl-3"
                              />
                            </div>
                            <div className="flex items-center gap-6 lg:gap-4">
                              <button
                                onClick={() =>
                                  handleDeleteCatalogItem(item.id, "logistics")
                                }
                                className="text-red-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  applyLogisticsChanges(item.id, item.label)
                                }
                                className={`transition-colors ${hasPendingChanges ? "text-green-500 hover:text-green-400" : "text-green-700/70 hover:text-green-600"}`}
                              >
                                <Check size={18} strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <hr className="border-t border-[#3D3D3D]" />

                <div className="p-4 lg:p-9">
                  <h3 className="lg:text-xl font-medium text-white mb-6">
                    Add Custom Logistics Item
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-12 flex flex-col md:flex-row gap-6 items-end">
                      <div className="flex-1 relative w-full">
                        <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                          <span className="text-xs text-[#8A8A8A] font-normal">
                            Item Name
                          </span>
                        </div>
                        <Input
                          placeholder="Eg : Cleaning Services"
                          value={customLogisticsName}
                          onChange={(e) =>
                            setCustomLogisticsName(e.target.value)
                          }
                          className="h-15 lg:h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                        />
                      </div>
                      <div className="flex-none w-full md:w-1/3 relative flex gap-4 items-center">
                        <div className="flex-1 relative">
                          <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                            <span className="text-xs text-[#8A8A8A] font-normal">
                              Cost
                            </span>
                          </div>
                          <Input
                            placeholder="$ 0.00"
                            value={customLogisticsCost}
                            onChange={(e) =>
                              setCustomLogisticsCost(e.target.value)
                            }
                            className="h-15 lg:h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                          />
                        </div>
                        <button
                          onClick={handleCreateLogisticsItem}
                          disabled={
                            isSubmittingLogistics ||
                            !customLogisticsName ||
                            !customLogisticsCost
                          }
                          className={`flex-none w-[52px] h-[52px] lg:w-[84px] lg:h-[84px] rounded-[14px] flex items-center justify-center transition-all ${
                            isSubmittingLogistics ||
                            !customLogisticsName ||
                            !customLogisticsCost
                              ? "bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50"
                              : "bg-[#0DC752] text-black hover:bg-[#0bb54a]"
                          }`}
                        >
                          {isSubmittingLogistics ? (
                            <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          ) : (
                            <Check size={24} strokeWidth={3} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="m-4 lg:m-9 mt-0 lg:mt-0 bg-[#282727] rounded-xl p-4 lg:p-6 flex justify-between items-center border border-zinc-800/50">
                  <span className="text-sm lg:text-xl font-medium text-[#FFF]">
                    Total Logistics Cost
                  </span>
                  <span className="text-lg lg:text-2xl font-bold text-[#E8D1AB] tracking-tight">
                    $
                    {totalLogisticsCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </section>
            </div>
          ) : view === "addons" ? (
            <div className="">
              <section>
                <div className="p-4 pt-5 lg:p-8 lg:pt-10">
                  <h2 className="text-base lg:text-xl font-medium leading-none mb-2 text-white">
                    Add-ons
                  </h2>
                  <p className="text-[#A1A1AA] text-sm font-normal leading-none">
                    Select additional items to enhance your service offering
                  </p>
                </div>
                <hr className="border-t border-[#3D3D3D]" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 p-4 lg:p-9">
                  {(addons || []).map((addon) => {
                    return (
                      <div key={addon.id} className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            const isSelected = selectedAddons.includes(
                              addon.id,
                            );
                            if (isSelected) {
                              removeSelectedAddon(addon.id);
                            } else {
                              const initialConfig = {
                                quantity: 1,
                                price: addon.price,
                              };
                              setSelectedAddons((prev) => [...prev, addon.id]);
                              setAddonConfigs((prev) => ({
                                ...prev,
                                [addon.id]: initialConfig,
                              }));
                              setAppliedAddonConfigs((prev) => ({
                                ...prev,
                                [addon.id]: initialConfig,
                              }));
                            }
                          }}
                          className={`relative flex h-[78px] w-full flex-col items-start rounded-xl border p-5 text-left transition-all group lg:h-[98px] lg:rounded-2xl lg:p-6 ${
                            selectedAddons.includes(addon.id)
                              ? "bg-[#131313] border-[#8E826A]/60 ring-1 ring-[#8E826A]/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                              : "bg-transparent border-[#303030] hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-start gap-4 w-full">
                            <div
                              className={`w-6 h-6 rounded-[4px] border-[1.5px] mt-0.5 flex items-center justify-center transition-all ${
                                selectedAddons.includes(addon.id)
                                  ? "bg-[#E8D1AB] border-[#E8D1AB] text-black"
                                  : "border-zinc-700 bg-transparent"
                              }`}
                            >
                              {selectedAddons.includes(addon.id) && (
                                <Check size={14} strokeWidth={4} />
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="font-medium text-base text-white leading-none">
                                {addon.label}
                              </div>
                              <div className="text-[#F0DCB1] text-sm font-semibold tracking-tight leading-none">
                                ${formatAddonDisplayValue(addon.price)}
                              </div>
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteCatalogItem(addon.id, "addon")
                          }
                          className="absolute top-6 right-6 z-10 text-zinc-500 transition-colors hover:text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-6 p-4 lg:p-9 pt-0">
                  <Button
                    onClick={() => setShowAddAddonForm(!showAddAddonForm)}
                    className="bg-[#F0DCB1] text-black hover:bg-[#e7d09e] h-10 px-5 rounded-[8px] flex items-center gap-2 font-medium text-sm tracking-tight shadow-none w-full lg:w-fit"
                  >
                    <Plus size={16} strokeWidth={3} />
                    Add More Add-ons
                  </Button>

                  <AnimatePresence>
                    {showAddAddonForm && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-12 gap-6"
                      >
                        <div className="md:col-span-12 flex flex-col md:flex-row gap-6 items-end">
                          <div className="flex-1 relative w-full">
                            <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                              <span className="text-xs text-[#8A8A8A] font-normal">
                                Add-on Name
                              </span>
                            </div>
                            <Input
                              placeholder="Eg : 4K RAW Recording"
                              value={customAddonName}
                              onChange={(e) =>
                                setCustomAddonName(e.target.value)
                              }
                              className="h-15 lg:h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                            />
                          </div>
                          <div className="flex-none w-full md:w-1/3 relative flex gap-4 items-center">
                            <div className="flex-1 relative">
                              <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                                <span className="text-xs text-[#8A8A8A] font-normal">
                                  Cost
                                </span>
                              </div>
                              <Input
                                placeholder="$ 0.00"
                                value={customAddonCost}
                                onChange={(e) =>
                                  setCustomAddonCost(e.target.value)
                                }
                                className="h-15 lg:h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                              />
                            </div>
                            <button
                              onClick={handleCreateAddon}
                              disabled={
                                isSubmittingAddon ||
                                !customAddonName ||
                                !customAddonCost
                              }
                              className={`flex-none w-[52px] h-[52px] lg:w-[84px] lg:h-[84px] rounded-[14px] flex items-center justify-center transition-all ${
                                isSubmittingAddon ||
                                !customAddonName ||
                                !customAddonCost
                                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50"
                                  : "bg-[#0DC752] text-black hover:bg-[#0bb54a]"
                              }`}
                            >
                              {isSubmittingAddon ? (
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                              ) : (
                                <Check size={24} strokeWidth={3} />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* Selected Add-Ons Section */}
              {selectedAddons.length > 0 && (
                <>
                  <hr className="border-t border-[#3D3D3D]" />
                  <section className="p-4 lg:p-9">
                    <div className="mb-4 lg:mb-8">
                      <h2 className="text-base lg:text-xl font-medium text-white">
                        Selected Add-Ons
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {selectedAddons.map((addonId) => {
                        const addon = addons.find((a) => a.id === addonId);
                        const config = addonConfigs[addonId];
                        const hasPendingChanges =
                          hasPendingAddonChanges(addonId);
                        if (!addon || !config) return null;

                        return (
                          <div
                            key={addonId}
                            className="bg-[#0F0F0F] border border-[#4A4A4A] rounded-[18px] p-5 lg:px-8 lg:py-7 relative overflow-hidden"
                          >
                            {/* desktop version */}
                            <div className="hidden lg:flex justify-between items-center gap-6">
                              <div className="space-y-2 min-w-0">
                                <h3 className="text-[18px] font-medium text-white leading-none">
                                  {addon.label}
                                </h3>
                                <p className="text-[#F0DCB1] text-[15px] font-semibold tracking-tight leading-none">
                                  {formatCurrency(addon.price)}
                                </p>
                              </div>

                              <div className="flex items-center gap-4">
                                {/* Quantity Controls */}
                                <div className="flex items-center gap-4">
                                  <button
                                    onClick={() =>
                                      handleAddonConfigUpdate(
                                        addonId,
                                        "quantity",
                                        config.quantity - 1,
                                      )
                                    }
                                    className="h-[50px] w-[58px] flex items-center justify-center bg-[#F0DCB1] rounded-[14px] text-black hover:opacity-90 transition-all active:scale-95"
                                  >
                                    <Minus size={16} strokeWidth={2.5} />
                                  </button>
                                  <div className="h-[50px] min-w-[92px] rounded-[14px] border border-[#3B3B46] bg-[#1A1A1F] px-4 flex flex-col items-center justify-center">
                                    {/* <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-[#8A8A8A]">
                                      Qty
                                    </span> */}
                                    <span className="text-base font-medium text-white leading-none">
                                      {config.quantity}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleAddonConfigUpdate(
                                        addonId,
                                        "quantity",
                                        config.quantity + 1,
                                      )
                                    }
                                    className="h-[50px] w-[58px] flex items-center justify-center bg-[#F0DCB1] rounded-[14px] text-black hover:opacity-90 transition-all active:scale-95"
                                  >
                                    <Plus size={16} strokeWidth={2.5} />
                                  </button>
                                </div>

                                {/* Price Override */}
                                <div className="relative w-[190px]">
                                  <Input
                                    value={`$ ${formatAddonDisplayValue(getAddonDraftPrice(addonId))}`}
                                    onChange={(e) =>
                                      handleAddonPriceUpdate(
                                        addonId,
                                        e.target.value,
                                      )
                                    }
                                    className="h-[50px] bg-[#1A1A1F] border-[#3B3B46] rounded-[14px] text-white text-base pl-5"
                                  />
                                </div>

                                <div className="flex items-center gap-5 ml-2">
                                  <button
                                    onClick={() => removeSelectedAddon(addonId)}
                                    className="text-red-500 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      applyAddonChanges(addonId, addon.label)
                                    }
                                    className={`transition-colors ${hasPendingChanges ? "text-green-500 hover:text-green-400" : "text-green-500/40 hover:text-green-500/70"}`}
                                  >
                                    <Check size={18} strokeWidth={3} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* mobile version */}
                            <div className="flex flex-col lg:hidden gap-4">
                              <div className="space-y-1">
                                <h3 className="text-sm font-medium text-white leading-none">
                                  {addon.label}
                                </h3>
                                <p className="text-[#F0DCB1] text-sm font-semibold tracking-tight leading-none">
                                  {formatCurrency(addon.price)}
                                </p>
                              </div>
                              <hr className="border-t border-[#3D3D3D]" />
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() =>
                                    handleAddonConfigUpdate(
                                      addonId,
                                      "quantity",
                                      config.quantity - 1,
                                    )
                                  }
                                  className="w-10 h-10 shrink-0 flex items-center justify-center bg-[#F0DCB1] rounded-[10px] text-black hover:opacity-90 transition-all active:scale-95"
                                >
                                  <Minus size={16} strokeWidth={2.5} />
                                </button>
                                <div className="h-10 min-w-[84px] rounded-[10px] border border-[#3B3B46] bg-[#1A1A1F] px-3 flex flex-col items-center justify-center">
                                  <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-[#8A8A8A]">
                                    Qty
                                  </span>
                                  <span className="text-sm font-medium text-white leading-none">
                                    {config.quantity}
                                  </span>
                                </div>
                                <button
                                  onClick={() =>
                                    handleAddonConfigUpdate(
                                      addonId,
                                      "quantity",
                                      config.quantity + 1,
                                    )
                                  }
                                  className="w-10 h-10 shrink-0 flex items-center justify-center bg-[#F0DCB1] rounded-[10px] text-black hover:opacity-90 transition-all active:scale-95"
                                >
                                  <Plus size={16} strokeWidth={2.5} />
                                </button>
                              </div>
                              <div className="flex gap-3 items-center">
                                <div className="relative flex-1">
                                  <Input
                                    value={`$ ${formatAddonDisplayValue(getAddonDraftPrice(addonId))}`}
                                    onChange={(e) =>
                                      handleAddonPriceUpdate(
                                        addonId,
                                        e.target.value,
                                      )
                                    }
                                    className="h-10 bg-[#1A1A1F] border-[#3B3B46] rounded-[10px] text-white text-sm pl-4"
                                  />
                                </div>
                                <button
                                  onClick={() => removeSelectedAddon(addonId)}
                                  className="text-red-500 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={18} />
                                </button>
                                <button
                                  onClick={() =>
                                    applyAddonChanges(addonId, addon.label)
                                  }
                                  className={`transition-colors ${hasPendingChanges ? "text-green-500 hover:text-green-400" : "text-green-500/40 hover:text-green-500/70"}`}
                                >
                                  <Check size={18} strokeWidth={3} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 rounded-[14px] bg-[#2A2A2A] px-5 py-4 lg:px-6 lg:py-5 flex items-center justify-between">
                      <span className="text-base font-medium text-white">
                        Total Add-Ons
                      </span>
                      <span className="text-xl font-semibold tracking-tight text-[#F0DCB1]">
                        ${formatAddonDisplayValue(totalAddOnsCost)}
                      </span>
                    </div>
                  </section>
                </>
              )}
            </div>
          ) : view === "services" ? (
            <div className="">
              {/* Services Section */}
              <section>
                <div className="px-5 pt-5 lg:px-8 lg:pt-8 mb-7">
                  <h2 className="text-base lg:text-xl font-medium leading-none mb-2 text-white">
                    Services
                  </h2>
                  <p className="text-[#A1A1AA] text-sm font-normal leading-none">
                    Select services and configure pricing
                  </p>
                </div>
                <div className="my-4 lg:my-8 border-t border-[#FFFFFF80]" />

                <div className="px-5 pt-4 pb-5 lg:px-8 lg:pb-10 space-y-4 lg:space-y-8 ">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    {loadingServices ? (
                      <div className="col-span-3 py-10 flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E8D1AB]"></div>
                      </div>
                    ) : (
                      (services || []).map((service) => {
                        const isProtectedService = isProtectedServiceLabel(
                          service.label,
                        );

                        return (
                          <div key={service.id} className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                handleServiceSelect(service.id, service.price)
                              }
                              className={`relative flex h-[78px] w-full flex-col items-start rounded-xl border p-5 text-left transition-all group lg:h-[98px] lg:rounded-2xl lg:p-6 ${
                                selectedServices.includes(service.id)
                                  ? "bg-[#131313] border-[#8E826A]/60 ring-1 ring-[#8E826A]/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                                  : "bg-transparent border-[#303030] hover:border-zinc-700"
                              }`}
                            >
                              <div className="font-medium text-base text-white mb-2 leading-none">
                                {getServiceDisplayLabel(service.label)}
                              </div>
                              <div className="text-[#F0DCB1] text-sm font-semibold tracking-tight leading-none">
                                ${service.price.toFixed(2)}{" "}
                                <span className="text-[#71717B] font-medium text-xs lowercase ml-1">
                                  per hour
                                </span>
                              </div>
                              {selectedServices.includes(service.id) && (
                                <div
                                  className={`absolute top-6 bg-[#0DC752] text-[#09090B] text-xs font-medium px-4 py-1 rounded-[6px] leading-none ${isProtectedService ? "right-6" : "right-12"}`}
                                >
                                  Selected
                                </div>
                              )}
                            </button>
                            {!isProtectedService && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteCatalogItem(service.id, "service")
                                }
                                className="absolute top-6 right-6 text-zinc-500 transition-colors hover:text-red-500"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-5 lg:mt-7 space-y-6">
                    <Button
                      onClick={() => setShowAddServiceForm(!showAddServiceForm)}
                      className="bg-[#F0DCB1] text-black hover:bg-[#e7d09e] h-[42px] px-5 rounded-[8px] flex items-center gap-2 font-medium text-sm tracking-tight shadow-none w-full lg:w-fit"
                    >
                      <Plus size={16} strokeWidth={3} />
                      Add Services
                    </Button>

                    <AnimatePresence>
                      {showAddServiceForm && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="grid grid-cols-1 md:grid-cols-12 gap-6"
                        >
                          <div className="md:col-span-12 flex flex-col md:flex-row gap-6 items-end">
                            <div className="flex-1 relative w-full">
                              <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                                <span className="text-xs text-[#8A8A8A] font-normal">
                                  Service Name
                                </span>
                              </div>
                              <Input
                                placeholder="Eg : Post Production Editing"
                                value={customServiceName}
                                onChange={(e) =>
                                  setCustomServiceName(e.target.value)
                                }
                                className="h-15 lg:h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-sm lg:text-base text-white placeholder:text-[#666666]"
                              />
                            </div>
                            <div className="flex-none w-full md:w-1/3 relative flex gap-4 items-center">
                              <div className="flex-1 relative">
                                <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                                  <span className="text-xs text-[#8A8A8A] font-normal">
                                    Cost
                                  </span>
                                </div>
                                <Input
                                  placeholder="$ 0.00"
                                  value={customServiceCost}
                                  onChange={(e) =>
                                    setCustomServiceCost(e.target.value)
                                  }
                                  className="h-15 lg:h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-sm lg:text-base text-white placeholder:text-[#666666]"
                                />
                              </div>
                              <button
                                onClick={handleCreateService}
                                disabled={
                                  isSubmittingService ||
                                  !customServiceName ||
                                  !customServiceCost
                                }
                                className={`flex-none w-[52px] h-[52px] lg:w-[84px] lg:h-[84px] rounded-[14px] flex items-center justify-center transition-all ${
                                  isSubmittingService ||
                                  !customServiceName ||
                                  !customServiceCost
                                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50"
                                    : "bg-[#0DC752] text-black hover:bg-[#0bb54a]"
                                }`}
                              >
                                {isSubmittingService ? (
                                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                ) : (
                                  <Check size={24} strokeWidth={3} />
                                )}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </section>

              {/* Conditional Sections based on selection */}
              {selectedServices.length > 0 && (
                <>
                  <div className="space-y-4 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Shoot Type Section */}
                    {(hasVideoService || hasPhotoService) && (
                      <div className="">
                        <hr className="border-t border-[#3D3D3D]" />
                        {hasVideoService &&
                          renderShootTypeSection({
                            kind: "video",
                            isExpanded: isVideoShootTypeExpanded,
                            onToggleExpanded: () =>
                              setIsVideoShootTypeExpanded((prev) => !prev),
                            shootTypeOptions: videoShootTypes,
                            selectedId: selectedVideoShootType,
                          })}
                        {hasPhotoService && (
                          <>
                            {hasVideoService && (
                              <hr className="border-t border-[#3D3D3D]" />
                            )}
                            {renderShootTypeSection({
                              kind: "photo",
                              isExpanded: isPhotoShootTypeExpanded,
                              onToggleExpanded: () =>
                                setIsPhotoShootTypeExpanded((prev) => !prev),
                              shootTypeOptions: photoShootTypes,
                              selectedId: selectedPhotoShootType,
                            })}
                          </>
                        )}
                      </div>
                    )}

                    {/* Editing Types Section - Only shown if Editing is selected */}
                    {hasAiEditingService && (
                      <div className="">
                        <hr className="border-t border-[#3D3D3D]" />
                        <section className="px-4 pt-4 pb-5 lg:pt-8 lg:px-8 lg:pb-10">
                          <button
                            onClick={() =>
                              setIsEditingTypeExpanded(!isEditingTypeExpanded)
                            }
                            className="w-full flex justify-between items-center mb-6 bg-transparent border-0 outline-none group cursor-pointer"
                          >
                            <h2 className="text-base lg:text-xl font-medium text-white">
                              Editing Types
                            </h2>
                            <div className="text-zinc-600 transition-transform duration-300">
                              {isEditingTypeExpanded ? (
                                <ChevronDown size={22} className="rotate-180" />
                              ) : (
                                <ChevronDown size={22} />
                              )}
                            </div>
                          </button>

                          <AnimatePresence>
                            {isEditingTypeExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {(editingTypes || []).map((type) => (
                                    <button
                                      key={type.id}
                                      onClick={() =>
                                        setSelectedEditingType(type.id)
                                      }
                                      className={`h-10 lg:h-[52px] px-6 rounded-xl font-normal transition-all border text-sm text-center lg:text-left leading-tight tracking-tight ${
                                        selectedEditingType === type.id
                                          ? "bg-[#1D1A15] border-[#E8D1AB] text-[#E8D1AB] shadow-inner"
                                          : "bg-transparent border-[#4A4A4A] text-[#A1A1AA] hover:border-zinc-700"
                                      }`}
                                    >
                                      {type.label}
                                    </button>
                                  ))}
                                </div>

                                <div className="mt-8 space-y-6">
                                  <Button
                                    onClick={() =>
                                      setShowAddEditingTypeForm(
                                        !showAddEditingTypeForm,
                                      )
                                    }
                                    className="bg-[#F0DCB1] text-black hover:bg-[#e7d09e] h-10 px-5 rounded-[8px] flex items-center gap-2 font-medium text-sm tracking-tight shadow-none"
                                  >
                                    <Plus size={16} strokeWidth={3} />
                                    Add Editing Types
                                  </Button>

                                  <AnimatePresence>
                                    {showAddEditingTypeForm && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="relative"
                                      >
                                        <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                                          <span className="text-xs text-[#8A8A8A] font-normal">
                                            Editing Type Name
                                          </span>
                                        </div>
                                        <Input
                                          placeholder="Eg : Reel Editing..."
                                          value={customEditingType}
                                          onChange={(e) =>
                                            setCustomEditingType(e.target.value)
                                          }
                                          className="h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                                        />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </section>
                      </div>
                    )}

                    {/* Configure Selected Services */}
                    <>
                      <hr className="border-t border-[#3D3D3D]" />
                      <section className="px-4 pb-5 lg:pt-8 lg:px-8 lg:pb-10">
                        <div className="mb-4 lg:mb-8">
                          <h2 className="text-base lg:text-xl font-medium text-white">
                            Configure Selected Services
                          </h2>
                        </div>

                        <div className="space-y-4 lg:space-y-6">
                          {(selectedServices || []).map((serviceId) => {
                            const service = services.find(
                              (s) => s.id === serviceId,
                            );
                            const config = serviceConfigs[serviceId];
                            if (!service || !config) return null;

                            const shootTypeKind = resolveServiceShootTypeKind(
                              service.label,
                            );
                            const shootTypeLabel =
                              shootTypeKind === "video"
                                ? selectedVideoShootTypeLabel
                                : shootTypeKind === "photo"
                                  ? selectedPhotoShootTypeLabel
                                  : "";
                            const editingTypeLabel = editingTypes.find(
                              (t) => t.id === selectedEditingType,
                            )?.label;
                            const serviceTotal =
                              config.duration *
                              config.crewSize *
                              config.estimatedPrice;

                            return (
                              <div
                                key={serviceId}
                                className="bg-[#0F0F0F] border border-[#4A4A4A] rounded-[18px] p-6 lg:px-7 lg:py-6 relative overflow-hidden"
                              >
                                <div className="flex justify-between items-start mb-4 lg:mb-8">
                                  <div className="space-y-2">
                                    <h3 className="text-[16px] font-medium text-white flex items-center gap-1.5 leading-none">
                                      {serviceId === "ai_editing" ? (
                                        <>
                                          Editing Type -{" "}
                                          <span className="text-[#8E826A]">
                                            {editingTypeLabel}
                                          </span>
                                        </>
                                      ) : shootTypeLabel ? (
                                        <>
                                          {getServiceDisplayLabel(service.label)} -{" "}
                                          <span className="text-[#8E826A]">
                                            ({shootTypeLabel})
                                          </span>
                                        </>
                                      ) : (
                                        <>{getServiceDisplayLabel(service.label)}</>
                                      )}
                                    </h3>
                                    <p className="text-[#8A8A8A] text-xs font-normal">
                                      Base: ${service.price.toFixed(2)} per hour
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-5">
                                    <div className="hidden lg:flex flex-col items-end gap-1">
                                      <span className="text-[#7B7B85] text-xs font-normal">
                                        Total
                                      </span>
                                      <span className="text-xl font-semibold text-[#F0DCB1] tracking-tight leading-none">
                                        ${serviceTotal.toLocaleString()}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() =>
                                        setSelectedServices((prev) =>
                                          prev.filter((id) => id !== serviceId),
                                        )
                                      }
                                      className="w-10 h-10 rounded-full bg-[#2A2A2A] border border-transparent flex items-center justify-center text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>

                                <div className="my-4 lg:my-8 border-t border-[#303030]" />

                                <div className="flex lg:hidden justify-between  items-center gap-1">
                                  <span className="text-[#7B7B85] text-sm font-normal">
                                    Total
                                  </span>
                                  <span className="font-semibold text-[#F0DCB1] tracking-tight leading-none">
                                    ${serviceTotal.toLocaleString()}
                                  </span>
                                </div>
                                <div className="lg:hidden my-4 lg:my-8 border-t border-[#303030]" />

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-6">
                                  {/* Duration */}
                                  <div className="space-y-3">
                                    <span className="text-sm font-normal text-[#9A9AA4] mb-1.5">
                                      Duration (hours)
                                    </span>
                                    <div className="flex items-center gap-2 h-9">
                                      <button
                                        onClick={() =>
                                          handleConfigUpdate(
                                            serviceId,
                                            "duration",
                                            config.duration - 1,
                                          )
                                        }
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Minus size={16} strokeWidth={2.5} />
                                      </button>
                                      <div className="flex-1 h-full flex items-center justify-center bg-[#1A1A1F] border border-[#3B3B46] rounded-[8px] text-white font-normal text-sm">
                                        {config.duration}
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleConfigUpdate(
                                            serviceId,
                                            "duration",
                                            config.duration + 1,
                                          )
                                        }
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Plus size={16} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Crew Size */}
                                  <div className="space-y-3">
                                    <span className="text-sm font-normal text-[#9A9AA4] mb-1.5">
                                      Crew Size
                                    </span>
                                    <div className="flex items-center gap-2 h-9">
                                      <button
                                        onClick={() =>
                                          handleConfigUpdate(
                                            serviceId,
                                            "crewSize",
                                            config.crewSize - 1,
                                          )
                                        }
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Minus size={16} strokeWidth={2.5} />
                                      </button>
                                      <div className="flex-1 h-full flex items-center justify-center bg-[#1A1A1F] border border-[#3B3B46] rounded-[8px] text-white font-normal text-sm">
                                        {config.crewSize}
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleConfigUpdate(
                                            serviceId,
                                            "crewSize",
                                            config.crewSize + 1,
                                          )
                                        }
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Plus size={16} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Estimated Pricing */}
                                  <div className="space-y-3">
                                    <span className="text-sm font-normal text-[#9A9AA4] mb-1.5">
                                      Estimated Pricing
                                    </span>
                                    <div className="flex items-center gap-2 h-9">
                                      <button
                                        onClick={() =>
                                          handleConfigUpdate(
                                            serviceId,
                                            "estimatedPrice",
                                            config.estimatedPrice - 50,
                                          )
                                        }
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Minus size={16} strokeWidth={2.5} />
                                      </button>
                                      <div className="flex-1 h-full flex items-center justify-center bg-[#1A1A1F] border border-[#3B3B46] rounded-[8px] text-white font-normal text-sm">
                                        ${config.estimatedPrice}
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleConfigUpdate(
                                            serviceId,
                                            "estimatedPrice",
                                            config.estimatedPrice + 50,
                                          )
                                        }
                                        className="w-10 h-full flex items-center justify-center bg-[#F0DCB1] rounded-[8px] text-black hover:opacity-90 transition-all active:scale-95"
                                      >
                                        <Plus size={16} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    </>
                  </div>
                </>
              )}
            </div>
          ) : view === "selection" ? (
            /* Client Selector View */
            <div>
              <div className="px-7 pt-7 lg:px-8 lg:pt-8">
                <h2 className="text-base lg:text-xl font-medium text-white mb-1">
                  Client Information
                </h2>
                <p className="text-sm text-[#A1A1AA]">
                  Select an existing client or create a new one
                </p>
              </div>

              <div className="my-4 lg:my-8 border-t border-[#FFFFFF80]" />

              <div className="px-7 pb-9 lg:px-8 lg:pb-10">
                <div className="relative max-w-full">
                  <div className="absolute -top-3 left-5 z-10 px-3 bg-[#171717]">
                    <span className="text-sm text-[#A1A1AA] font-normal tracking-[0.01em]">
                      Select Client
                    </span>
                  </div>

                  <div className="relative border border-[#4A4A4A] rounded-[14px] bg-transparent">
                    <button
                      onClick={() => {
                        setIsDetailsClientDropdownOpen(false);
                        setIsDropdownOpen(!isDropdownOpen);
                      }}
                      className={`w-full group bg-transparent rounded-[14px] px-6 py-6 flex justify-between items-center transition-all ${isDropdownOpen ? "ring-1 ring-[#8E826A]/30" : ""}`}
                    >
                      <span
                        className={
                          selectedClient
                            ? "text-white text-[16px] font-normal"
                            : "text-[#6B6B6B] text-[16px] font-normal"
                        }
                      >
                        {selectedClient
                          ? getClientDisplayName(selectedClient)
                          : "Choose a Client..."}
                      </span>
                      <ChevronDown
                        size={20}
                        className={`text-[#E5E5E5] transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen &&
                        renderClientDropdownContent({
                          onClose: closeClientDropdowns,
                          advanceToDetails: true,
                        })}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          ) : view === "customlineitems" ? (
            <div>
              <div className="p-4 pt-5 lg:p-8 lg:pt-10">
                <h2 className="text-base lg:text-xl font-medium text-white mb-1">
                  Custom Line Items
                </h2>
                <p className="text-sm text-[#A1A1AA]">
                  Add any custom charges or fees not covered by services or
                  add-ons
                </p>
              </div>
              <div className="border-t border-dashed border-[#3D3D3D]" />

              <div className="p-4 lg:p-9">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-12 flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 relative w-full">
                      <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                        <span className="text-xs text-[#8A8A8A] font-normal">
                          Item Name
                        </span>
                      </div>
                      <Input
                        placeholder="Eg : Consulting Fee, Rush Delivery..."
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        className="h-15 lg:h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                      />
                    </div>
                    <div className="flex-none w-full md:w-1/3 relative flex gap-4 items-center">
                      <div className="flex-1 relative">
                        <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                          <span className="text-xs text-[#8A8A8A] font-normal">
                            Cost
                          </span>
                        </div>
                        <Input
                          placeholder="$ 0.00"
                          value={customItemCost}
                          onChange={(e) => setCustomItemCost(e.target.value)}
                          className="h-15 lg:h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                        />
                      </div>
                      <button
                        onClick={handleCreateLineItem}
                        disabled={
                          isSubmittingLineItem ||
                          !customItemName ||
                          !customItemCost
                        }
                        className={`flex-none w-[52px] h-[52px] lg:w-[84px] lg:h-[84px] rounded-[14px] flex items-center justify-center transition-all ${
                          isSubmittingLineItem ||
                          !customItemName ||
                          !customItemCost
                            ? "bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50"
                            : "bg-[#0DC752] text-black hover:bg-[#0bb54a]"
                        }`}
                      >
                        {isSubmittingLineItem ? (
                          <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        ) : (
                          <Check size={24} strokeWidth={3} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-dashed border-[#3D3D3D]" />

              <div className="space-y-4 p-4 lg:p-9">
                {lineItems.map((item) => {
                  const config = lineItemConfigs[item.id];
                  const hasPendingChanges = hasPendingLineItemChanges(item.id);
                  const isProtectedLineItem = isProtectedLineItemLabel(
                    item.label,
                  );

                  return (
                    <div
                      key={item.id}
                      className="bg-[#0F0F0F] border border-[#4A4A4A] rounded-[14px] p-4 lg:p-5 relative overflow-hidden"
                    >
                      <div className="flex flex-col lg:flex-row gap-4 lg:justify-between lg:items-center">
                        <div className="flex lg:flex-col justify-between lg:gap-1">
                          <h3 className="text-base font-medium text-white leading-none">
                            {item.label}
                          </h3>
                          <p className="text-[#F0DCB1] text-sm font-semibold tracking-tight leading-none">
                            $
                            {item.basePrice.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>

                        <hr className="lg:hidden border-t border-[#3D3D3D]" />

                        <div className="flex items-center gap-6">
                          <div className="relative w-2/3 lg:w-36">
                            <Input
                              value={`$ ${config?.price || 0}`}
                              onChange={(e) => {
                                const val =
                                  parseFloat(
                                    e.target.value.replace("$ ", ""),
                                  ) || 0;
                                setLineItemConfigs((prev) => ({
                                  ...prev,
                                  [item.id]: { price: val },
                                }));
                              }}
                              className="h-9 bg-[#1A1A1F] border-[#3B3B46] rounded-[8px] text-white text-sm pl-3"
                            />
                          </div>
                          <div className="flex items-center gap-4">
                            {!isProtectedLineItem && (
                              <button
                                onClick={() =>
                                  handleDeleteCatalogItem(item.id, "line_item")
                                }
                                className="text-red-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                applyLineItemChanges(item.id, item.label)
                              }
                              className={`transition-colors ${hasPendingChanges ? "text-green-500 hover:text-green-400" : "text-green-700/70 hover:text-green-600"}`}
                            >
                              <Check size={18} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="m-4 lg:m-9 mt-0 bg-[#282727] rounded-xl p-4 lg:p-6 flex justify-between items-center border border-zinc-800/50">
                <span className="text-sm lg:text-xl font-medium text-[#FFF]">
                  Total Custom Line Items
                </span>
                <span className="text-lg lg:text-2xl font-bold text-[#E8D1AB] tracking-tight">
                  $
                  {totalLineItemsCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          ) : view === "discounts" ? (
            <div>
              <div className="p-4 pt-5 lg:p-8 lg:pt-10">
                <h2 className="text-base lg:text-xl font-medium text-white mb-1">
                  Discounts
                </h2>
                <p className="text-sm text-[#A1A1AA]">
                  Add any custom charges or fees not covered by services or
                  add-ons
                </p>
              </div>
              <hr className="border-t border-[#3D3D3D]" />

              <div className="p-4 lg:p-9">
                <div
                  className={`w-full p-4 lg:p-5 rounded-2xl border transition-colors duration-300 flex items-center justify-between bg-[#171717] border-[#222222]`}
                  style={{
                    fontFamily: "var(--font-instrument-sans), sans-serif",
                  }}
                >
                  <div className="lg:space-y-1">
                    <h3
                      className={`text-sm lg:text-lg font-medium tracking-tight text-white`}
                    >
                      Apply Discount
                    </h3>
                    <p className={`text-sm text-[#888888]`}>
                      Add a discount to this quotation
                    </p>
                  </div>

                  {/* Custom Toggle Switch */}
                  <button
                    onClick={handleDiscountToggle}
                    className={`relative w-12 h-[28px] rounded-lg p-1 transition-colors duration-300 flex items-center ${
                      discountEnabled ? "bg-[#E8D1AB]" : "bg-[#333333]"
                    }`}
                  >
                    <motion.div
                      animate={{ x: discountEnabled ? 24 : 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className={`w-5 h-5 rounded-md shadow-sm transition-colors duration-300 ${
                        discountEnabled ? "bg-white" : "bg-white"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {discountEnabled ? (
                <>
                  <hr className="border-t border-[#3D3D3D]" />
                  <div className="p-4 lg:p-9">
                    <h3
                      className={`text-base lg:text-lg font-medium tracking-tight text-white`}
                    >
                      Discount Type
                    </h3>

                    <div className="flex flex-col md:flex-row gap-4 mt-3 lg:mt-6 mb-6 lg:mb-8">
                      {/* Percentage Option */}
                      <button
                        onClick={() => handleDiscountTypeSelect("percentage")}
                        className={`flex-1 flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${
                          discountType === "percentage"
                            ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]"
                            : "bg-[#171717] border-[#222222] hover:border-[#333333]"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center transition-colors ${
                            discountType === "percentage"
                              ? "bg-[#E8D1AB] text-black"
                              : "bg-[#3F3F47] text-[#888888]"
                          }`}
                        >
                          <Percent size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h4 className={`font-semibold text-base text-white`}>
                            Percentage
                          </h4>
                          <p className={`text-xs mt-0.5 text-[#888888]`}>
                            % off total after tax
                          </p>
                        </div>
                      </button>

                      {/* Fixed Amount Option */}
                      <button
                        onClick={() => handleDiscountTypeSelect("fixed")}
                        className={`flex-1 flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${
                          discountType === "fixed"
                            ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]"
                            : "bg-[#171717] border-[#222222] hover:border-[#333333]"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center transition-colors ${
                            discountType === "fixed"
                              ? "bg-[#E8D1AB] text-black"
                              : "bg-[#3F3F47] text-[#888888]"
                          }`}
                        >
                          <DollarSign size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h4 className={`font-semibold text-base text-white`}>
                            Fixed Amount
                          </h4>
                          <p className={`text-xs mt-0.5 text-[#888888]`}>
                            $ off total after tax
                          </p>
                        </div>
                      </button>
                    </div>

                    <div className="md:col-span-8 relative">
                      <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                        <span className="text-xs text-[#8A8A8A] font-normal">
                          Discount Value
                        </span>
                      </div>
                      <Input
                        placeholder="0.00"
                        value={discountValue}
                        onChange={(e) =>
                          setDiscountValue(parseFloat(e.target.value) || 0)
                        }
                        className="h-15 lg:h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                      />
                    </div>

                    <div className="my-6 flex flex-col gap-2">
                      <div className="flex justify-between text-[#9F9FA9] ">
                        <p>Subtotal</p>
                        <p>{formatCurrency(quoteSubtotal)}</p>
                      </div>
                      <div className="flex justify-between text-[#E8D1AB] font-medium ">
                        <p>Discount Applied </p>
                        <p>- {formatCurrency(discountAmount)}</p>
                      </div>
                    </div>

                    <div className="bg-[#282727] rounded-xl p-4 lg:p-6 flex justify-between items-center ">
                      <span className="text-sm lg:text-xl font-medium text-white">
                        After Discount
                      </span>
                      <span className="text-lg lg:text-2xl font-semibold text-[#E8D1AB] tracking-tight">
                        {formatCurrency(totalAfterDiscount)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-5 items-center justify-center my-4 lg:my-12">
                  <Image
                    src={"/images/misc/DiscountTag.svg"}
                    width={132}
                    height={132}
                    alt="Discount Tag"
                  />
                  <p className="text-white text-base">
                    No discount applied to this quote
                  </p>
                </div>
              )}
            </div>
          ) : view === "tax" ? (
            <div>
              <div className="p-4 pt-5 lg:p-8 lg:pt-10">
                <h2 className="text-base lg:text-xl font-medium text-white mb-1">
                  Tax
                </h2>
                <p className="text-sm text-[#A1A1AA]">
                  Configure tax rate and type for this quotation
                </p>
              </div>
              <hr className="border-t border-[#3D3D3D]" />

              <div className="p-4 lg:p-9">
                <h3
                  className={`text-base lg:text-lg font-medium tracking-tight text-white`}
                >
                  Common Tax Rates
                </h3>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-3 lg:mt-6 ">
                  <button
                    onClick={() => {
                      setSelectedTax(0);
                      setTaxRate(0);
                    }}
                    className={`flex-1 flex items-center justify-center lg:justify-start gap-4 p-3 lg:p-4 rounded-xl border transition-all duration-300 text-left ${
                      selectedTax === 0
                        ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]"
                        : "bg-[#171717] border-[#222222] hover:border-[#333333]"
                    }`}
                  >
                    <div>
                      <p
                        className={`${selectedTax === 0 ? "text-[#E8D1AB]" : "text-white"} font-semibold text-sm lg:text-base `}
                      >
                        0 %
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTax(5);
                      setTaxRate(5);
                    }}
                    className={`flex-1 flex items-center justify-center lg:justify-start gap-4 p-3 lg:p-4 rounded-xl border transition-all duration-300 text-left ${
                      selectedTax === 5
                        ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]"
                        : "bg-[#171717] border-[#222222] hover:border-[#333333]"
                    }`}
                  >
                    <div>
                      <p
                        className={`${selectedTax === 5 ? "text-[#E8D1AB]" : "text-white"} font-semibold text-sm lg:text-base `}
                      >
                        5 %
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTax(8.5);
                      setTaxRate(8.5);
                    }}
                    className={`flex-1 flex items-center justify-center lg:justify-start gap-4 p-3 lg:p-4 rounded-xl border transition-all duration-300 text-left ${
                      selectedTax === 8.5
                        ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]"
                        : "bg-[#171717] border-[#222222] hover:border-[#333333]"
                    }`}
                  >
                    <div>
                      <p
                        className={`${selectedTax === 8.5 ? "text-[#E8D1AB]" : "text-white"} font-semibold text-sm lg:text-base `}
                      >
                        8.5 %
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTax(10);
                      setTaxRate(10);
                    }}
                    className={`flex-1 flex items-center justify-center lg:justify-start gap-4 p-3 lg:p-4 rounded-xl border transition-all duration-300 text-left ${
                      selectedTax === 10
                        ? "bg-[#1A1A1A] border-[#E8D1AB]/40 shadow-[0_0_15px_rgba(232,209,171,0.05)]"
                        : "bg-[#171717] border-[#222222] hover:border-[#333333]"
                    }`}
                  >
                    <div>
                      <p
                        className={`${selectedTax === 10 ? "text-[#E8D1AB]" : "text-white"} font-semibold text-sm lg:text-base `}
                      >
                        10 %
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <hr className="border-t border-[#3D3D3D]" />
              <div className="p-4 lg:p-9">
                <h3
                  className={`text-base lg:text-lg font-medium tracking-tight text-white mb-3 lg:mb-6`}
                >
                  Tax Calculation
                </h3>

                <div className="bg-[#282727] rounded-xl p-4 lg:p-6 ">
                  <div className="flex justify-between items-center ">
                    <span className="text-sm lg:text-base text-[#9F9FA9]">
                      Subtotal
                    </span>
                    <span className="text-sm lg:text-base text-[#9F9FA9] tracking-tight">
                      {formatCurrency(quoteSubtotal)}
                    </span>
                  </div>
                  <div className="my-4 lg:my-6 border-t border-[#FFFFFF33]" />
                  <div className="flex justify-between items-center ">
                    <span className="text-sm lg:text-base text-[#9F9FA9]">{`${taxLabel} (${normalizedTaxRate}%)`}</span>
                    <span className="text-sm lg:text-base text-[#9F9FA9] tracking-tight">
                      {formatCurrency(taxAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-2 mb-2">
                    <span className="text-sm lg:text-base text-white font-medium">
                      Amount After Tax
                    </span>
                    <span className="text-sm lg:text-base text-white font-medium tracking-tight">
                      {formatCurrency(totalAfterTax)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm lg:text-base text-[#9F9FA9]">
                      Discount Applied
                    </span>
                    <span className="text-sm lg:text-base text-[#9F9FA9] tracking-tight">
                      - {formatCurrency(discountAmount)}
                    </span>
                  </div>

                  <div className="my-4 lg:my-6 border-t border-[#FFFFFF33]" />

                  <div className="flex justify-between items-center ">
                    <span className="text-sm lg:text-xl font-medium text-white">
                      Final Total
                    </span>
                    <span className="text-sm lg:text-2xl font-semibold text-[#E8D1AB] tracking-tight">
                      {formatCurrency(totalAfterDiscount)}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-t border-[#3D3D3D]" />
              <div className="w-full p-4 pt-6 lg:p-9">
                <h2 className="text-base lg:text-xl font-medium text-white mb-5 lg:mb-6">
                  Custom Tax Rate
                </h2>
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-3 w-full">
                  <div className="w-full relative">
                    <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                      <span className="text-xs text-[#8A8A8A] font-normal">
                        Tax Rate (%)
                      </span>
                    </div>
                    <Input
                      placeholder="0.00"
                      value={taxRate}
                      onChange={(e) => {
                        const nextTaxRate = parseFloat(e.target.value) || 0;
                        const presetTaxRate =
                          nextTaxRate === 5 ||
                          nextTaxRate === 8.5 ||
                          nextTaxRate === 10
                            ? (nextTaxRate as 5 | 8.5 | 10)
                            : 0;
                        setTaxRate(nextTaxRate);
                        setSelectedTax(presetTaxRate);
                      }}
                      className="h-15 lg:h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                    />
                  </div>
                  <div className="w-full relative">
                    <div className="absolute -top-3 left-4 z-10 px-3 bg-[#171717]">
                      <span className="text-xs text-[#8A8A8A] font-normal">
                        Tax Type
                      </span>
                    </div>
                    <Input
                      placeholder="Sales Tax"
                      value={taxtType}
                      onChange={(e) => setTaxType(e.target.value)}
                      className="h-15 lg:h-[84px] bg-transparent border-[#4A4A4A] rounded-[14px] focus:border-[#A78857] pl-7 text-base text-white placeholder:text-[#666666]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Client Details View */
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="px-5 pt-5 lg:px-8 lg:pt-8">
                <h2 className="text-base lg:text-xl font-medium text-white mb-1">
                  Client Information
                </h2>
                <p className="text-sm text-[#A1A1AA]">
                  Select an existing client or create a new one
                </p>
              </div>
              <div className="my-4 lg:my-8 border-t border-[#FFFFFF80]" />

              <div className="px-5 pt-4 pb-5 lg:px-8 lg:pb-10 space-y-6 lg:space-y-8 ">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative">
                    <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                      <span className="text-sm text-[#D3D3D3] font-medium">
                        Client Name*
                      </span>
                    </div>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="h-16 bg-transparent border-zinc-800 rounded-xl focus:border-[#E8D1AB]/50 transition-all pl-6 pr-14 text-sm lg:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsDetailsClientDropdownOpen((prev) => !prev);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#E5E5E5] transition-colors hover:text-white"
                    >
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-300 ${isDetailsClientDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {isDetailsClientDropdownOpen &&
                        renderClientDropdownContent({
                          onClose: closeClientDropdowns,
                          advanceToDetails: false,
                        })}
                    </AnimatePresence>
                  </div>
                  <div className="relative">
                    <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                      <span className="text-sm text-[#D3D3D3] font-medium">
                        Email ID*
                      </span>
                    </div>
                    <Input
                      value={emailId}
                      onChange={(e) => setEmailId(e.target.value)}
                      className="h-16 bg-transparent border-zinc-800 rounded-xl focus:border-[#E8D1AB]/50 transition-all pl-6 text-sm lg:text-base"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                      <span className="text-sm text-[#D3D3D3] font-medium">
                        Phone Number*
                      </span>
                    </div>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="h-16 bg-transparent border-zinc-800 rounded-xl focus:border-[#E8D1AB]/50 transition-all pl-6 text-sm lg:text-base"
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                    <span className="text-sm text-[#D3D3D3] font-medium">
                      Address*
                    </span>
                  </div>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="567 Mission Street, San Francisco, CA 94105"
                    className="h-16 bg-transparent border-zinc-800 rounded-xl focus:border-[#E8D1AB]/30 transition-all pl-6 text-sm lg:text-base placeholder-zinc-600"
                  />
                </div>

                <div className="relative">
                  <div className="absolute -top-3 left-4 z-10 px-2 bg-[#171717]">
                    <span className="text-sm text-[#D3D3D3] font-medium">
                      Project Description*
                    </span>
                  </div>
                  <Textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe the project scope and requirements....."
                    className="min-h-[120px]0 bg-[#111111] dark:bg-[#171717] rounded-xl focus:border-[#E8D1AB]/50 transition-all p-6 pt-8 text-sm lg:text-base"
                  />
                </div>
                {/* <div className="relative">
                  <div className="absolute -top-3 left-4 z-10 px-2 bg-[#0A0A0A]">
                    <span className="text-xs text-zinc-400 font-medium">Phone Number*</span>
                  </div>
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                    className="h-16 bg-transparent border-zinc-800 rounded-xl focus:border-[#E5D5B8]/50 transition-all pl-6"
                  />
                </div> */}
                <div>
                  <h3 className="lg:text-xl font-semibold mb-6">
                    Quote Validity
                  </h3>
                  {(() => {
                    const isCustomValiditySelected = validityDays === "custom";

                    return (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          {[3, 5, 7].map((days: number) => (
                            <button
                              key={days}
                              onClick={() => handleValiditySelect(days)}
                              className={`text-sm lg:text-base h-12 lg:h-14 rounded-xl font-semibold transition-all border ${
                                validityDays === days
                                  ? "bg-[#1D1A15] border-[#E8D1AB]/40 text-[#E8D1AB]"
                                  : "bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700"
                              }`}
                            >
                              {days} Days
                            </button>
                          ))}
                          <button
                            onClick={() => handleValiditySelect("custom")}
                            className={`text-sm lg:text-base h-12 lg:h-14 rounded-xl font-semibold transition-all border ${
                              validityDays === "custom"
                                ? "bg-[#1D1A15] border-[#E8D1AB]/40 text-[#E8D1AB]"
                                : "bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700"
                            }`}
                          >
                            Add Custom Date
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-zinc-400 text-sm mb-8">
                          <Check size={16} className="text-[#E8D1AB]" />
                          <span className="text-[#E8D1AB]/80 font-medium">
                            This quote is valid for{" "}
                            {validityDays === "custom"
                              ? differenceInDays(
                                  startOfDay(parseISO(validUntil)),
                                  startOfDay(new Date()),
                                )
                              : validityDays}{" "}
                            days from today.
                          </span>
                        </div>

                        <div className="relative pt-4">
                          <DatePicker
                            label="Quote Valid Until*"
                            value={parseISO(validUntil)}
                            onChange={(date) => {
                              if (date && isValid(date)) {
                                setValidUntil(format(date, "yyyy-MM-dd"));
                              }
                            }}
                            disabled={validityDays !== "custom"}
                            format="dd-MM-yyyy"
                            colors={{
                              inputBackground: isCustomValiditySelected
                                ? "#1D1A15"
                                : "transparent",
                              inputText: isCustomValiditySelected
                                ? "#E8D1AB"
                                : "#F5F5F5",
                              inputDisabled: "rgba(214, 195, 157, 0.9)",
                              iconColor: isCustomValiditySelected
                                ? "#E8D1AB"
                                : "#FFFFFF",
                              labelText: isCustomValiditySelected
                                ? "#E8D1AB"
                                : "rgba(113, 113, 122, 1)",
                              inputBorder: isCustomValiditySelected
                                ? "rgba(232, 209, 171, 0.4)"
                                : "rgba(39, 39, 42, 1)",
                              inputBorderHover: isCustomValiditySelected
                                ? "#E8D1AB"
                                : "rgba(63, 63, 70, 1)",
                              inputBorderFocus: "#E8D1AB",
                            }}
                            sx={{
                              height: "64px", // h-16
                              borderRadius: "12px", // rounded-xl
                              "& .MuiOutlinedInput-root": {
                                backgroundColor: isCustomValiditySelected
                                  ? "#1D1A15"
                                  : "transparent",
                                borderRadius: "12px",
                                paddingLeft: "10px",
                                "& fieldset": {
                                  borderWidth: "1px",
                                },
                              },
                              "& .MuiInputBase-input": {
                                fontSize: "16px",
                                fontWeight: "500", // font-medium
                                color: isCustomValiditySelected
                                  ? "#E8D1AB"
                                  : "rgba(113, 113, 122, 1)",
                              },
                              "& .MuiInputBase-input.Mui-disabled": {
                                WebkitTextFillColor: "rgba(214, 195, 157, 0.9)",
                                color: "rgba(214, 195, 157, 0.9)",
                                opacity: 1,
                              },
                              "& .MuiSvgIcon-root": {
                                color: isCustomValiditySelected
                                  ? "#E8D1AB"
                                  : "#FFFFFF",
                              },
                              "& .Mui-disabled .MuiSvgIcon-root": {
                                color: "#FFFFFF",
                                opacity: 1,
                              },
                            }}
                            labelSx={{
                              position: "absolute",
                              top: "-10px",
                              left: "16px",
                              zIndex: 10,
                              backgroundColor: isCustomValiditySelected
                                ? "#1D1A15"
                                : "#171717",
                              padding: "0 8px",
                              fontSize: "12px", // text-xs
                              fontWeight: "500", // font-medium
                              color: isCustomValiditySelected
                                ? "#E8D1AB"
                                : "rgba(113, 113, 122, 1)",
                            }}
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            // </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="hidden lg:flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-8 pb-4">
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="border border-[#363636] text-[#7A7A7A] hover:text-white hover:bg-[#181818] h-[62px] min-w-[166px] rounded-xl text-xl font-medium bg-transparent transition-all"
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              className={`${
                view === "tax"
                  ? "bg-white text-[#1B1B1B] hover:bg-zinc-100 border-0 shadow-lg"
                  : canPrimaryAction
                    ? "bg-[#E8D1AB] text-[#101010]"
                    : "bg-[#2A2B2D] text-zinc-600"
              } h-[62px] min-w-[166px] rounded-xl text-xl font-bold transition-all shadow-md`}
              disabled={!canPrimaryAction || isCreatingQuoteDraft}
              onClick={view === "tax" ? handleSaveQuote : handleContinue}
            >
              {view === "tax"
                ? isCreatingQuoteDraft && activeQuoteAction === "save"
                  ? "Saving Quote..."
                  : "Save Quote"
                : "Continue"}
            </Button>
          </div>

          <div className="flex gap-4 self-start sm:self-auto">
            <Button
              type="button"
              onClick={handleSaveAsDraft}
              disabled={isCreatingQuoteDraft}
              className="bg-white text-[#1B1B1B] hover:bg-zinc-100 h-[62px] px-8 rounded-xl flex items-center gap-3 text-xl font-bold transition-all group border-0 shadow-lg disabled:opacity-70"
            >
              <div className="flex items-center justify-center">
                <Save
                  size={20}
                  className="group-hover:scale-110 transition-transform"
                />
              </div>
              {isCreatingQuoteDraft && activeQuoteAction === "draft"
                ? "Saving Draft..."
                : "Save as Draft"}
            </Button>
            {view === "tax" ? (
              <Button
                type="button"
                onClick={handlePreviewQuote}
                disabled={
                  isCreatingQuoteDraft || !quoteReviewValidation.isValid
                }
                className="bg-[#E8D1AB] text-[#101010] hover:opacity-90 h-[62px] px-8 rounded-xl flex items-center gap-3 text-xl font-bold transition-all border-0 shadow-lg disabled:opacity-70"
              >
                {isCreatingQuoteDraft && activeQuoteAction === "preview"
                  ? "Loading Preview..."
                  : "Preview Quote"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* --- FLOATING MOBILE BUTTON --- */}
      <div className={`lg:hidden fixed flex gap-2 bottom-0 left-0 right-0 px-6 pb-6 pt-4 z-[40] bg-[#0f0f0f]`}>
        {view === "tax" ? (
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleSaveAsDraft}
              disabled={isCreatingQuoteDraft}
              className="bg-white text-[#1B1B1B] hover:bg-zinc-100 h-14 min-w-[166px] rounded-xl text-sm font-medium transition-all disabled:opacity-70"
            >
              {isCreatingQuoteDraft && activeQuoteAction === "draft"
                ? "Saving Draft..."
                : "Save as Draft"}
            </Button>
            <Button
              type="button"
              onClick={handlePreviewQuote}
              disabled={isCreatingQuoteDraft || !quoteReviewValidation.isValid}
              className="bg-[#E8D1AB] text-[#101010] hover:opacity-90 h-14 min-w-[166px] rounded-xl text-sm font-medium transition-all disabled:opacity-70"
            >
              {isCreatingQuoteDraft && activeQuoteAction === "preview"
                ? "Loading Preview..."
                : "Preview Quote"}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={handleSaveAsDraft}
            disabled={isCreatingQuoteDraft}
            className="underline text-[#FFF] hover:text-white hover:bg-[#181818] bg-transparent h-14 min-w-[166px] rounded-xl text-sm font-medium transition-all disabled:opacity-70"
          >
            <div className="flex items-center justify-center">
              <Save
                size={20}
                className="group-hover:scale-110 transition-transform"
              />
            </div>
            {isCreatingQuoteDraft && activeQuoteAction === "draft"
              ? "Saving Draft..."
              : "Save as Draft"}
          </Button>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border border-[#363636] text-[#FFF] hover:text-white hover:bg-[#181818] h-14 min-w-[166px] rounded-xl text-sm font-medium bg-transparent transition-all"
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            className={`${
              canPrimaryAction
                ? view === "tax"
                  ? "bg-white text-[#1B1B1B]"
                  : "bg-[#E8D1AB] text-[#101010]"
                : "bg-[#2A2B2D] text-zinc-600"
            } hover:opacity-90 h-14 min-w-[166px] rounded-xl text-sm font-bold transition-all shadow-md`}
            disabled={!canPrimaryAction || isCreatingQuoteDraft}
            onClick={view === "tax" ? handleSaveQuote : handleContinue}
          >
            {view === "tax"
              ? isCreatingQuoteDraft && activeQuoteAction === "save"
                ? "Saving Quote..."
                : "Save Quote"
              : "Continue"}
          </Button>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={`Delete ${itemToDelete?.type === "service" ? "Service" : itemToDelete?.type === "addon" ? "Add-on" : itemToDelete?.type === "logistics" ? "Logistics Item" : itemToDelete?.type === "shoot_type" ? "Shoot Type" : "Line Item"}`}
        description={`Are you sure you want to delete this ${itemToDelete?.type === "service" ? "service" : itemToDelete?.type === "addon" ? "add-on" : itemToDelete?.type === "logistics" ? "logistics item" : itemToDelete?.type === "shoot_type" ? "shoot type" : "line item"}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
      <QuotePreviewModal
        open={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        quote={previewQuote}
        quoteId={previewQuoteId}
        isLoading={isCreatingQuoteDraft && activeQuoteAction === "preview"}
      />
    </div>
  );
}
