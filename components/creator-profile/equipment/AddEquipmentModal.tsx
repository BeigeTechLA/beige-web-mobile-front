"use client";

import Image from "next/image";
import { useState, type ChangeEvent, type ReactNode } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useResolvedTheme } from "@/lib/useResolvedTheme";
import type {
  EquipmentCategory,
  EquipmentForm,
  ExistingPhoto,
  PendingPhoto,
} from "@/types/equipment";

const field =
  "mt-1.5 w-full rounded-lg border border-[var(--equipment-border)] bg-[var(--equipment-input)] px-3 py-2.5 text-sm text-[var(--equipment-text)] outline-none placeholder:text-[var(--equipment-muted)] focus:border-[#af9c7e]";
type Props = {
  step: number;
  setStep: (step: number | null) => void;
  form: EquipmentForm;
  update: (key: keyof EquipmentForm, value: string | boolean) => void;
  save: () => void;
  editing: boolean;
  existingPhotos: ExistingPhoto[];
  removeExistingPhoto: (photo: ExistingPhoto) => void;
  photos: PendingPhoto[];
  selectPhotos: (event: ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (id: string) => void;
  categories: EquipmentCategory[];
  saving: boolean;
};

export default function AddEquipmentModal({
  step,
  setStep,
  form,
  update,
  save,
  editing,
  existingPhotos,
  removeExistingPhoto,
  photos,
  selectPhotos,
  removePhoto,
  categories,
  saving,
}: Props) {
  const { isDark } = useResolvedTheme();
  const [errors, setErrors] = useState<Set<keyof EquipmentForm>>(new Set());
  const [photoError, setPhotoError] = useState(false);
  const close = () => setStep(null);
  const updateAndClear = (
    key: keyof EquipmentForm,
    value: string | boolean,
  ) => {
    update(key, value);
    setErrors((current) => {
      if (!current.has(key)) return current;
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  };
  const validateCurrentStep = () => {
    const required: Record<number, (keyof EquipmentForm)[]> = {
      1: [
        "name",
        "category",
        "manufacturer",
        "model",
        "modelNumber",
        "serialNumber",
        "description",
      ],
      2: ["marketPrice", "price", "location"],
    };
    if (step === 3) {
      const count = existingPhotos.length + photos.length;
      const invalid = count < 1 || count > 10;
      setPhotoError(invalid);
      if (invalid) toast.error("Keep between 1 and 10 equipment photos");
      return !invalid;
    }
    const empty = (required[step] ?? []).filter(
      (key) => String(form[key] ?? "").trim() === "",
    );
    setErrors(new Set(empty));
    if (empty.length)
      toast.error("Please complete all required equipment details");
    return empty.length === 0;
  };
  const continueStepper = () => {
    if (!validateCurrentStep()) return;
    if (step === 3) void save();
    else setStep(step + 1);
  };
  return (
    <Modal>
      <div className="p-6 sm:p-7">
        <button
          onClick={close}
          className="absolute right-5 top-5 text-[var(--equipment-muted)]"
        >
          <X size={19} />
        </button>
        <h2 className="text-xl font-bold">
          {editing ? "Edit Equipment" : "Add New Equipment"}
        </h2>
        <p className="mt-2 text-[var(--equipment-muted)]">
          {editing
            ? "Update your equipment details, rental settings, or photos."
            : "Add details about your equipment to manage rentals, availability, and maintenance."}
        </p>
        <div className="mt-7 flex gap-4">
          {[1, 2, 3].map((number) => (
            <i
              key={number}
              className={`h-2 flex-1 rounded-full ${number <= step ? "bg-[#ad9b7e]" : "bg-[var(--equipment-soft)]"}`}
            />
          ))}
        </div>
        <div className="mt-8">
          {step === 1 ? (
            <BasicStep
              form={form}
              update={updateAndClear}
              categories={categories}
              errors={errors}
              isDark={isDark}
            />
          ) : step === 2 ? (
            <RentalStep
              form={form}
              update={updateAndClear}
              errors={errors}
              isDark={isDark}
            />
          ) : (
            <PhotosStep
              existingPhotos={existingPhotos}
              removeExistingPhoto={removeExistingPhoto}
              photos={photos}
              selectPhotos={(event) => {
                setPhotoError(false);
                selectPhotos(event);
              }}
              removePhoto={removePhoto}
              invalid={photoError}
            />
          )}
        </div>
        <footer className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-xl border border-[var(--equipment-border)] bg-[var(--equipment-panel)] px-4 py-3 text-[var(--equipment-text)]"
            onClick={close}
          >
            Cancel
          </button>
          {step > 1 && (
            <button
              className="rounded-xl border border-[var(--equipment-border)] bg-[var(--equipment-panel)] px-4 py-3 text-[var(--equipment-text)]"
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          )}
          <button
            disabled={saving}
            className="rounded-xl border border-[var(--equipment-border)] bg-[var(--equipment-primary)] px-4 py-3 text-[var(--equipment-primary-text)] disabled:opacity-50"
            onClick={continueStepper}
          >
            {step === 3
              ? saving
                ? "Saving…"
                : editing
                  ? "Save Changes"
                  : "Add Equipment"
              : "Next"}
          </button>
        </footer>
      </div>
    </Modal>
  );
}

function BasicStep({
  form,
  update,
  categories,
  errors,
  isDark,
}: {
  form: EquipmentForm;
  update: Props["update"];
  categories: EquipmentCategory[];
  errors: Set<keyof EquipmentForm>;
  isDark: boolean;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-xl font-bold">BASIC EQUIPMENT INFORMATION</h3>
      <Field
        label="Equipment name"
        value={form.name}
        set={(v) => update("name", v)}
        placeholder="Sony A7S III etc."
        invalid={errors.has("name")}
      />
      <label className="block text-sm font-medium">
        Category
        <Select
          value={form.category || undefined}
          onValueChange={(value) => update("category", value)}
        >
          <SelectTrigger
            className={`mt-1.5 h-auto w-full rounded-lg px-3 py-2.5 text-sm focus:ring-0 ${errors.has("category") ? "!border-red-500" : isDark ? "border-[#3d3d3d] bg-[#202020] text-white" : "border-[#ece6df] bg-[#fffcf8] text-[#171717]"}`}
          >
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent
            className={
              isDark
                ? "border-[#3d3d3d] bg-[#202020] text-white"
                : "border-[#ece6df] bg-white text-[#171717]"
            }
          >
            {categories.map((category) => (
              <SelectItem
                key={category.id}
                value={String(category.id)}
                className={
                  isDark
                    ? "focus:bg-[#303030] focus:text-white"
                    : "focus:bg-[#E5D5B8] focus:text-black"
                }
              >
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Manufacturer"
          value={form.manufacturer}
          set={(v) => update("manufacturer", v)}
          placeholder="Sony"
          invalid={errors.has("manufacturer")}
        />
        <Field
          label="Model"
          value={form.model}
          set={(v) => update("model", v)}
          placeholder="A7S III"
          invalid={errors.has("model")}
        />
        <Field
          label="Model Number"
          value={form.modelNumber}
          set={(v) => update("modelNumber", v)}
          placeholder="ILCE-7SM3"
          invalid={errors.has("modelNumber")}
        />
        <Field
          label="Serial Number"
          value={form.serialNumber}
          set={(v) => update("serialNumber", v)}
          placeholder="SNYA7S3-984563"
          invalid={errors.has("serialNumber")}
        />
      </div>
      <Field
        label="Description"
        value={form.description}
        set={(v) => update("description", v)}
        placeholder="Briefly describe the condition, usage, or special features of this equipment."
        area
        invalid={errors.has("description")}
      />
    </div>
  );
}

function RentalStep({
  form,
  update,
  errors,
  isDark,
}: {
  form: EquipmentForm;
  update: Props["update"];
  errors: Set<keyof EquipmentForm>;
  isDark: boolean;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">RENTAL & LOCATION DETAILS</h3>
      <Field
        label="Product Actual Market Price"
        value={form.marketPrice}
        set={(v) => update("marketPrice", v)}
        placeholder="$340000"
        invalid={errors.has("marketPrice")}
      />
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Field
          label="Rental price"
          value={form.price}
          set={(v) => update("price", v)}
          placeholder="$34"
          invalid={errors.has("price")}
        />
        <label className="block min-w-[130px] text-sm font-medium">
          Price type
          <Select
            value={form.rentalPriceType}
            onValueChange={(value) => update("rentalPriceType", value)}
          >
            <SelectTrigger
              className={`mt-1.5 h-auto w-full rounded-lg px-3 py-2.5 text-sm focus:ring-0 ${isDark ? "border-[#3d3d3d] bg-[#202020] text-white" : "border-[#ece6df] bg-[#fffcf8] text-[#171717]"}`}
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
              {[
                ["1", "Per hour"],
                ["2", "Per day"],
                ["3", "Per unit"],
              ].map(([value, label]) => (
                <SelectItem
                  key={value}
                  value={value}
                  className={
                    isDark
                      ? "focus:bg-[#303030] focus:text-white"
                      : "focus:bg-[#E5D5B8] focus:text-black"
                  }
                >
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      <label className="flex items-center justify-between rounded-xl bg-[var(--equipment-soft)] px-4 py-4 text-sm font-medium">
        Available for rent
        <button
          type="button"
          onClick={() => update("available", !form.available)}
          className={`h-7 w-11 rounded-full p-1 ${form.available ? "bg-[#6e5941]" : "bg-[#dedad5]"}`}
        >
          <i
            className={`block h-5 w-5 rounded-full bg-white transition-transform ${form.available ? "translate-x-4" : ""}`}
          />
        </button>
      </label>
      <Field
        label="Location of equipment"
        value={form.location}
        set={(v) => update("location", v)}
        placeholder="Enter address"
        invalid={errors.has("location")}
      />
    </div>
  );
}

function Field({
  label,
  value,
  set,
  placeholder,
  area,
  invalid,
}: {
  label: string;
  value: string;
  set: (value: string) => void;
  placeholder: string;
  area?: boolean;
  invalid?: boolean;
}) {
  const className = `${field} ${area ? "min-h-20 resize-none" : ""} ${invalid ? "!border-red-500 focus:!border-red-500" : ""}`;
  return (
    <label className="block text-sm font-medium">
      {label}
      {area ? (
        <textarea
          className={className}
          value={value}
          onChange={(e) => set(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className={className}
          value={value}
          onChange={(e) => set(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function PhotosStep({
  existingPhotos,
  removeExistingPhoto,
  photos,
  selectPhotos,
  removePhoto,
  invalid,
}: Pick<
  Props,
  | "existingPhotos"
  | "removeExistingPhoto"
  | "photos"
  | "selectPhotos"
  | "removePhoto"
> & { invalid: boolean }) {
  return (
    <div>
      <h3 className="text-xl font-bold">EQUIPMENT PHOTOS</h3>
      <label
        className={`mt-4 flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed bg-[var(--equipment-input)] text-center ${invalid ? "border-red-500" : "border-[var(--equipment-border)]"}`}
      >
        <input
          className="sr-only"
          type="file"
          accept="image/*"
          multiple
          onChange={selectPhotos}
        />
        <span className="rounded-xl border border-[#e4cfad] bg-[#fdf7ed] p-5 text-[#a98f6c]">
          <Upload />
        </span>
        <p className="mt-5 font-bold">
          Drag and drop media, or <u>browse</u>
        </p>
        <p className="mt-1 text-sm text-[var(--equipment-muted)]">
          Add 1 to 10 product images
        </p>
        <p className="mt-2 text-xs text-[var(--equipment-muted)]">
          Min 1600 × 1200. Max 10MB (images)
        </p>
      </label>
      {existingPhotos.length + photos.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {existingPhotos.map((photo, index) => (
            <PhotoCard
              key={
                photo.crew_equipment_photo_id ?? `${photo.file_url}-${index}`
              }
              src={photo.file_url}
              alt={`Existing equipment photo ${index + 1}`}
              name={`Uploaded image ${index + 1}`}
              remove={() => removeExistingPhoto(photo)}
            />
          ))}
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              src={photo.url}
              alt={photo.name}
              name={photo.name}
              remove={() => removePhoto(photo.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoCard({
  src,
  alt,
  name,
  remove,
}: {
  src: string;
  alt: string;
  name: string;
  remove: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--equipment-border)] bg-[var(--equipment-soft)]">
      <Image
        src={src}
        alt={alt}
        width={200}
        height={112}
        unoptimized
        className="h-28 w-full object-cover"
      />
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onClick={remove}
        className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white"
      >
        <X size={14} />
      </button>
      <p className="truncate px-2 py-1.5 text-xs text-[var(--equipment-muted)]">
        {name}
      </p>
    </div>
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
