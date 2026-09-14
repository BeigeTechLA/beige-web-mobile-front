"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
} from "react";
import Topbar from "@/components/admin/Topbar";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import { creatorEquipmentApi } from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";
import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddEquipmentModal from "@/components/creator-profile/equipment/AddEquipmentModal";
import EquipmentDetailsDrawer from "@/components/creator-profile/equipment/EquipmentDetailsDrawer";
import type {
  Equipment,
  EquipmentCategory as Category,
  EquipmentForm as Form,
  EquipmentIcon as Icon,
  ExistingPhoto,
  PendingPhoto as Photo,
} from "@/types/equipment";
import {
  Camera,
  CircleDollarSign,
  Eye,
  Grip,
  Lightbulb,
  Mic,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

type ApiEquipment = {
  crew_equipment_id: number;
  equipment_name: string;
  category_id: number | string | null;
  description?: string | null;
  rental_price?: number | string | null;
  rental_price_type?: number | string | null;
  is_available_for_rent?: boolean | number | null;
  manufacturer?: string | null;
  model?: string | null;
  model_number?: string | null;
  serial_number?: string | null;
  market_price?: number | string | null;
  storage_location?: string | null;
  crew_equipment_photos?: {
    crew_equipment_photo_id?: number;
    file_url: string;
  }[];
};
const icons: Record<string, Icon> = {
  Microphone: Mic,
  Lighting: Lightbulb,
  Camera,
  Tripod: Grip,
};
const blank: Form = {
  name: "",
  category: "",
  description: "",
  price: "",
  status: "Available",
  manufacturer: "",
  model: "",
  modelNumber: "",
  serialNumber: "",
  marketPrice: "",
  rentalPriceType: "1",
  location: "",
  available: true,
};
const seed = [
  {
    id: 1,
    name: "Rode NTG3 Shotgun Mic",
    category: "Microphone",
    description: "High-quality microphone suitable for film shoots.",
    price: "50",
    status: "Available",
    icon: Mic,
    manufacturer: "RØDE",
    model: "NTG3",
    marketPrice: "699",
    location: "Los Angeles, CA",
    available: true,
  },
  {
    id: 2,
    name: "Aputure 120D LED Light",
    category: "Lighting",
    description: "Bright and versatile lighting for studio work.",
    price: "75",
    status: "On Rent",
    icon: Lightbulb,
    manufacturer: "Aputure",
    model: "120D",
    marketPrice: "1090",
    location: "Los Angeles, CA",
    available: false,
  },
  {
    id: 3,
    name: "CAMTREE Camera Rig",
    category: "Camera",
    description: "Sony FX6 Cinema Camera Kit",
    price: "200",
    status: "Available",
    icon: Camera,
    manufacturer: "CAMTREE",
    model: "FX6 Rig",
    marketPrice: "340000",
    location: "Downtown Studio",
    available: true,
  },
  {
    id: 4,
    name: "Manfrotto MT055 Tripod",
    category: "Tripod",
    description: "Sturdy and adjustable tripod for stable shots.",
    price: "30",
    status: "Available",
    icon: Grip,
    manufacturer: "Manfrotto",
    model: "MT055",
    marketPrice: "350",
    location: "Los Angeles, CA",
    available: true,
  },
  {
    id: 5,
    name: "Canon EOS 5D Mark IV",
    category: "Camera",
    description: "Professional full-frame camera body and lens.",
    price: "200",
    status: "Available",
    icon: Camera,
    manufacturer: "Canon",
    model: "EOS 5D Mark IV",
    marketPrice: "2500",
    location: "Los Angeles, CA",
    available: true,
  },
  {
    id: 6,
    name: "INSTA360 ONE X",
    category: "Camera",
    description: "Compact 360 camera for immersive content.",
    price: "200",
    status: "Available",
    icon: Camera,
    manufacturer: "Insta360",
    model: "ONE X",
    marketPrice: "430",
    location: "Los Angeles, CA",
    available: true,
  },
];
export default function EquipmentPage() {
  const pathname = usePathname();
  const [items, setItems] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Equipment");
  const [status, setStatus] = useState("Status");
  const { isDark } = useResolvedTheme();
  const themeStyle = {
    "--equipment-page": isDark ? "#101010" : "#faf8f5",
    "--equipment-panel": isDark ? "#171717" : "#ffffff",
    "--equipment-border": isDark ? "#3d3d3d" : "#ece6df",
    "--equipment-text": isDark ? "#ffffff" : "#171717",
    "--equipment-muted": isDark ? "#a0a0a0" : "#77716b",
    "--equipment-input": isDark ? "#202020" : "#fffcf8",
    "--equipment-soft": isDark ? "#252525" : "#f6f6f6",
    "--equipment-visual-from": isDark ? "#3a342d" : "#e9dfd4",
    "--equipment-visual-to": isDark ? "#1d1b19" : "#fffdfb",
    "--equipment-primary": isDark ? "#E5D5B8" : "#171717",
    "--equipment-primary-text": isDark ? "#171717" : "#ffffff",
  } as CSSProperties;
  const [step, setStep] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<number[]>([]);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [selected, setSelected] = useState<Equipment | null>(null);
  const [deleting, setDeleting] = useState<Equipment | null>(null);
  const toEquipment = (
    entry: ApiEquipment,
    categoryList: Category[],
  ): Equipment => {
    const categoryName =
      categoryList.find(
        (category) => String(category.id) === String(entry.category_id),
      )?.name ?? "Equipment";
    return {
      id: entry.crew_equipment_id,
      name: entry.equipment_name,
      category: categoryName,
      description: entry.description ?? "",
      price: String(entry.rental_price ?? "0"),
      status: entry.is_available_for_rent ? "Available" : "On Rent",
      icon: icons[categoryName] ?? Camera,
      manufacturer: entry.manufacturer ?? "",
      model: entry.model ?? "",
      modelNumber: entry.model_number ?? "",
      serialNumber: entry.serial_number ?? "",
      marketPrice: String(entry.market_price ?? ""),
      rentalPriceType: String(entry.rental_price_type ?? "1") as
        "1" | "2" | "3",
      location: entry.storage_location ?? "",
      available: Boolean(entry.is_available_for_rent),
      photos: entry.crew_equipment_photos ?? [],
    };
  };
  const loadEquipment = async () => {
    try {
      setLoading(true);
      const [categoryData, equipmentData] = await Promise.all([
        creatorEquipmentApi.getCategories(),
        creatorEquipmentApi.getMine(),
      ]);
      const categoryList = categoryData as Category[];
      setCategories(categoryList);
      setItems(
        (equipmentData as ApiEquipment[]).map((entry) =>
          toEquipment(entry, categoryList),
        ),
      );
    } catch {
      toast.error("Could not load equipment");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void loadEquipment();
  }, []);
  const viewEquipment = async (equipmentId: number) => {
    try {
      const entry = (await creatorEquipmentApi.getById(
        equipmentId,
      )) as ApiEquipment;
      setSelected(toEquipment(entry, categories));
    } catch {
      toast.error("Could not load equipment details");
    }
  };
  const list = useMemo(
    () =>
      items.filter(
        (x) =>
          x.name.toLowerCase().includes(query.toLowerCase()) &&
          (category === "All Equipment" || x.category === category) &&
          (status === "Status" || x.status === status),
      ),
    [items, query, category, status],
  );
  const update = (key: keyof Form, value: string | boolean) =>
    setForm((old) => ({ ...old, [key]: value }));
  const add = () => {
    setEditing(null);
    setForm(blank);
    setPhotos([]);
    setExistingPhotos([]);
    setRemovedPhotoIds([]);
    setStep(1);
  };
  const edit = (item: Equipment) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: String(
        categories.find((category) => category.name === item.category)?.id ??
          "",
      ),
      description: item.description,
      price: item.price,
      status: item.status,
      manufacturer: item.manufacturer,
      model: item.model,
      modelNumber: item.modelNumber,
      serialNumber: item.serialNumber,
      marketPrice: item.marketPrice,
      rentalPriceType: item.rentalPriceType,
      location: item.location,
      available: item.available,
      photos: item.photos,
    });
    setPhotos([]);
    setExistingPhotos(item.photos ?? []);
    setRemovedPhotoIds([]);
    setSelected(null);
    setStep(1);
  };
  const selectPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );
    setPhotos((current) => [
      ...current,
      ...files
        .slice(0, Math.max(0, 10 - existingPhotos.length - current.length))
        .map((file) => ({
          id: `${file.name}-${file.lastModified}`,
          name: file.name,
          url: URL.createObjectURL(file),
          file,
        })),
    ]);
    event.target.value = "";
  };
  const removeExistingPhoto = (photo: ExistingPhoto) => {
    setExistingPhotos((current) => current.filter((entry) => entry !== photo));
    if (photo.crew_equipment_photo_id)
      setRemovedPhotoIds((current) => [
        ...current,
        photo.crew_equipment_photo_id as number,
      ]);
  };
  const save = async () => {
    if (
      !form.name ||
      !form.category ||
      !form.manufacturer ||
      !form.model ||
      !form.modelNumber ||
      !form.serialNumber ||
      !form.description ||
      !form.marketPrice ||
      !form.price ||
      !form.location
    )
      return toast.error("Please complete all required fields");
    const photoCount = existingPhotos.length + photos.length;
    if (photoCount < 1 || photoCount > 10)
      return toast.error("Keep between 1 and 10 equipment photos");
    const user = JSON.parse(localStorage.getItem("revure_user") || "{}");
    if (!user?.crew_member_id)
      return toast.error("Creator profile was not found");
    try {
      setSaving(true);
      const saved = await creatorEquipmentApi.create({
        crew_equipment_id: editing?.id,
        crew_member_id: Number(user.crew_member_id),
        equipment_name: form.name,
        category_id: Number(form.category),
        manufacturer: form.manufacturer,
        model: form.model,
        model_number: form.modelNumber,
        serial_number: form.serialNumber,
        description: form.description,
        market_price: Number(form.marketPrice),
        rental_price: Number(form.price),
        rental_price_type: Number(form.rentalPriceType),
        is_available_for_rent: form.available,
        storage_location: form.location,
      });
      if (removedPhotoIds.length)
        await Promise.all(
          removedPhotoIds.map((photoId) =>
            creatorEquipmentApi.deletePhoto(photoId),
          ),
        );
      if (photos.length)
        await creatorEquipmentApi.uploadPhotos(
          saved.crew_equipment_id,
          photos.map((photo) => photo.file),
        );
      toast.success(
        editing
          ? "Equipment updated successfully"
          : "Equipment added successfully",
      );
      setStep(null);
      setPhotos([]);
      setExistingPhotos([]);
      setRemovedPhotoIds([]);
      setEditing(null);
      await loadEquipment();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Could not save equipment");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      style={themeStyle}
      className="min-h-full bg-[var(--equipment-page)] text-[var(--equipment-text)] transition-colors duration-300"
    >
      <Topbar pathname={pathname} />
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6">
        <section
          className={`rounded-[24px] border bg-[var(--equipment-panel)] p-6 transition-all duration-700 sm:p-9 ${isDark ? "border-[#E8D1AB]/40 shadow-[inset_0_0_12px_rgba(232,209,171,0.1),0_0_2px_rgba(232,209,171,0.8),0_0_15px_rgba(232,209,171,0.3),0_0_40px_rgba(232,209,171,0.15)]" : "border-[var(--equipment-border)] shadow-sm"}`}
        >
          <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-[30px] font-bold">Equipment</h1>
              <p className="mt-2 text-[17px] text-[var(--equipment-muted)]">
                Manage your equipment inventory, rentals, and maintenance.
              </p>
            </div>
            <button
              onClick={add}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--equipment-primary)] px-5 py-3 font-medium text-[var(--equipment-primary-text)]"
            >
              <Plus size={20} />
              Add Equipment
            </button>
          </header>
          <div className="mt-6 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <label className="flex w-full max-w-[288px] items-center gap-2 rounded-xl border border-[var(--equipment-border)] px-4 py-3 text-[var(--equipment-muted)]">
              <Search size={20} />
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                placeholder="Search equipment..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="flex gap-3">
              <Select
                value={category}
                values={[
                  "All Equipment",
                  ...categories.map((entry) => entry.name),
                ]}
                set={setCategory}
                isDark={isDark}
              />
              <Select
                value={status}
                values={["Status", "Available", "On Rent"]}
                set={setStatus}
                isDark={isDark}
              />
            </div>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <p className="text-[var(--equipment-muted)]">
                Loading equipment…
              </p>
            ) : list.length === 0 ? (
              <div className="col-span-full flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--equipment-border)] bg-[var(--equipment-input)] px-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--equipment-soft)] text-[var(--equipment-muted)]">
                  <Camera size={27} strokeWidth={1.5} />
                </span>
                <h2 className="mt-4 text-lg font-semibold">
                  {items.length === 0
                    ? "No equipment added yet"
                    : "No matching equipment found"}
                </h2>
                <p className="mt-1 max-w-md text-sm text-[var(--equipment-muted)]">
                  {items.length === 0
                    ? "Add your equipment to manage its availability, rental pricing, and details."
                    : "Try changing your search, category, or status filters."}
                </p>
                {items.length === 0 && (
                  <button
                    onClick={add}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--equipment-primary)] px-5 py-3 font-medium text-[var(--equipment-primary-text)]"
                  >
                    <Plus size={18} />
                    Add Equipment
                  </button>
                )}
              </div>
            ) : (
              list.map((item) => (
                <Card
                  key={item.id}
                  item={item}
                  view={() => void viewEquipment(item.id)}
                  edit={() => edit(item)}
                  remove={() => setDeleting(item)}
                />
              ))
            )}
          </div>
        </section>
      </main>
      {step && (
        <AddEquipmentModal
          step={step}
          setStep={setStep}
          form={form}
          update={update}
          save={save}
          editing={Boolean(editing)}
          existingPhotos={existingPhotos}
          removeExistingPhoto={removeExistingPhoto}
          photos={photos}
          selectPhotos={selectPhotos}
          removePhoto={(id) =>
            setPhotos((current) => current.filter((photo) => photo.id !== id))
          }
          categories={categories}
          saving={saving}
        />
      )}{" "}
      {selected && (
        <EquipmentDetailsDrawer
          item={selected}
          close={() => setSelected(null)}
          edit={() => edit(selected)}
          remove={() => {
            setDeleting(selected);
            setSelected(null);
          }}
        />
      )}{" "}
      {deleting && (
        <Delete
          item={deleting}
          close={() => setDeleting(null)}
          remove={async () => {
            try {
              await creatorEquipmentApi.remove(deleting.id);
              toast.success("Equipment deleted");
              setDeleting(null);
              await loadEquipment();
            } catch {
              toast.error("Could not delete equipment");
            }
          }}
        />
      )}
    </div>
  );
}
function Select({
  value,
  values,
  set,
  isDark,
}: {
  value: string;
  values: string[];
  set: (v: string) => void;
  isDark: boolean;
}) {
  return (
    <UiSelect value={value} onValueChange={set}>
      <SelectTrigger
        className={`h-12 min-w-[138px] rounded-xl px-4 text-sm focus:ring-0 ${isDark ? "border-[#3d3d3d] bg-[#202020] text-white" : "border-[#ece6df] bg-white text-[#171717]"}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        className={
          isDark
            ? "border-[#3d3d3d] bg-[#202020] text-white"
            : "border-[#ece6df] bg-white text-[#171717]"
        }
      >
        {values.map((option) => (
          <SelectItem
            key={option}
            value={option}
            className={
              isDark
                ? "focus:bg-[#303030] focus:text-white"
                : "focus:bg-[#E5D5B8] focus:text-black"
            }
          >
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </UiSelect>
  );
}
function Card({
  item,
  view,
  edit,
  remove,
}: {
  item: Equipment;
  view: () => void;
  edit: () => void;
  remove: () => void;
}) {
  const Icon = item.icon;
  const firstPhoto = item.photos?.[0]?.file_url;
  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--equipment-border)] bg-[var(--equipment-panel)] shadow-sm transition-colors">
      <div className="relative flex h-[205px] items-center justify-center overflow-hidden bg-gradient-to-b from-[var(--equipment-visual-from)] to-[var(--equipment-visual-to)]">
        <span className="absolute left-4 top-4 z-10 rounded-lg bg-[var(--equipment-panel)] px-3 py-1 text-sm font-medium shadow-sm">
          {item.category}
        </span>
        {firstPhoto ? (
          <Image
            src={firstPhoto}
            alt={item.name}
            width={520}
            height={410}
            unoptimized
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon className="h-28 w-28" strokeWidth={1.2} />
        )}
      </div>
      <div className="p-6 pb-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold">{item.name}</h2>
            <p className="mt-1 truncate text-[15px] text-[var(--equipment-muted)]">
              {item.description}
            </p>
          </div>
          <Badge status={item.status} />
        </div>
      </div>
      <footer className="flex items-center justify-between border-t border-[var(--equipment-border)] px-6 py-3.5">
        <span className="flex items-center gap-2 font-medium">
          <CircleDollarSign size={20} />${item.price}/
          {rentalUnit(item.rentalPriceType)}
        </span>
        <div className="flex gap-2">
          <Action icon={Eye} label="View" click={view} />
          <Action icon={Pencil} label="Edit" click={edit} />
          <Action icon={Trash2} label="Delete" danger click={remove} />
        </div>
      </footer>
    </article>
  );
}
function rentalUnit(type: Equipment["rentalPriceType"]) {
  return type === "1" ? "hour" : type === "3" ? "unit" : "day";
}
function Badge({ status }: { status: Equipment["status"] }) {
  const available = status === "Available";
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${available ? "bg-[#ecfbf1] text-[#11a952]" : "bg-[#fff0dc] text-[#ff7927]"}`}
    >
      {status}
    </span>
  );
}
function Action({
  icon: Icon,
  label,
  click,
  danger,
}: {
  icon: Icon;
  label: string;
  click: () => void;
  danger?: boolean;
}) {
  return (
    <button
      aria-label={label}
      onClick={click}
      className={`rounded-xl bg-[var(--equipment-soft)] p-2.5 ${danger ? "text-[#ff4c52]" : ""}`}
    >
      <Icon size={19} />
    </button>
  );
}
function Delete({
  close,
  remove,
}: {
  item: Equipment;
  close: () => void;
  remove: () => void;
}) {
  return (
    <Modal>
      <div className="p-6">
        <button
          className="absolute right-5 top-5 text-[var(--equipment-muted)]"
          onClick={close}
        >
          <X />
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-red-400 text-red-500">
          <Trash2 size={18} />
        </span>
        <h2 className="mt-4 text-lg font-bold">Delete Equipment</h2>
        <p className="mt-1 text-sm text-[var(--equipment-muted)]">
          Remove this equipment from your inventory.
        </p>
        <div className="mt-7 flex gap-3">
          <button
            className="flex-1 rounded-lg bg-[var(--equipment-soft)] py-2.5 text-[var(--equipment-text)]"
            onClick={close}
          >
            Cancel
          </button>
          <button
            className="flex-1 rounded-lg bg-[#fa454c] py-2.5 text-white"
            onClick={remove}
          >
            <Trash2 className="mr-2 inline" size={16} />
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
function Modal({ children }: { children: ReactNode }) {
  return (
    <div
      data-equipment-modal
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
    >
      <div className="relative max-h-[94vh] w-full max-w-[500px] overflow-y-auto rounded-2xl bg-[var(--equipment-panel)] text-[var(--equipment-text)] shadow-2xl transition-colors">
        {children}
      </div>
      <style jsx>{`
        [data-equipment-modal] footer button:first-child {
          background: var(--equipment-soft) !important;
          color: var(--equipment-text);
        }
        [data-equipment-modal] footer button:nth-child(2) {
          border-color: var(--equipment-border) !important;
        }
      `}</style>
    </div>
  );
}
