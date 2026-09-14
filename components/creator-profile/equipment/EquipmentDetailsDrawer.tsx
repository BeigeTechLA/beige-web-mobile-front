"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  MapPin,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import type { Equipment, EquipmentIcon } from "@/types/equipment";
import { rentalUnit } from "@/types/equipment";

export default function EquipmentDetailsDrawer({
  item,
  close,
  edit,
  remove,
}: {
  item: Equipment;
  close: () => void;
  edit: () => void;
  remove: () => void;
}) {
  const Icon = item.icon;
  const photos = item.photos ?? [];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(photos.length > 0);
  const previousImage = () => {
    setImageLoading(true);
    setActiveImageIndex(
      (current) => (current - 1 + photos.length) % photos.length,
    );
  };
  const nextImage = () => {
    setImageLoading(true);
    setActiveImageIndex((current) => (current + 1) % photos.length);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/55" onClick={close}>
      <aside
        className="absolute right-0 top-0 h-full w-full max-w-[620px] overflow-y-auto bg-[var(--equipment-panel)] p-6 pb-24 shadow-2xl transition-colors"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="absolute right-5 top-5" onClick={close}>
          <X size={18} />
        </button>
        <h2 className="text-xl font-bold">Equipment Details</h2>
        <div className="relative mt-7 flex h-64 items-center justify-center overflow-hidden rounded-2xl border border-[var(--equipment-border)] bg-gradient-to-b from-[var(--equipment-visual-from)] to-[var(--equipment-visual-to)]">
          <span className="absolute left-4 top-3 z-10 rounded-md border border-[var(--equipment-border)] bg-[var(--equipment-panel)] px-2 py-1 text-xs">
            {item.category}
          </span>
          {photos[activeImageIndex] ? (
            <Image
              key={photos[activeImageIndex].file_url}
              src={photos[activeImageIndex].file_url}
              alt={`${item.name} ${activeImageIndex + 1}`}
              width={600}
              height={500}
              unoptimized
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
              className={`h-full w-full object-cover transition-opacity duration-200 ${imageLoading ? "opacity-0" : "opacity-100"}`}
            />
          ) : (
            <Icon className="h-32 w-32" strokeWidth={1.2} />
          )}
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--equipment-soft)]">
              <span className="h-10 w-10 animate-pulse rounded-full border-4 border-[var(--equipment-border)] border-t-[#ad9b7e]" />
            </div>
          )}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={previousImage}
                className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-white shadow-lg transition-colors hover:bg-black/80"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={nextImage}
                className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-white shadow-lg transition-colors hover:bg-black/80"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
          {photos.length > 0 && (
            <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white">
              {activeImageIndex + 1} / {photos.length}
            </span>
          )}
        </div>
        <div className="mt-7 flex justify-between gap-3">
          <h3 className="font-bold">{item.name}</h3>
          <StatusBadge status={item.status} />
        </div>
        <div className="mt-3 flex justify-between border-b border-[var(--equipment-border)] pb-4 text-sm text-[var(--equipment-muted)]">
          <span className="flex gap-1">
            <MapPin size={16} />
            {item.location}
          </span>
          <span>
            ${item.price}/{rentalUnit(item.rentalPriceType)}
          </span>
        </div>
        <div className="mt-4 rounded-xl border border-[var(--equipment-border)] p-4">
          <h4 className="font-bold text-[#e8d1ab]">Equipment Information</h4>
          <Info label="Description" value={item.description} />
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Info label="Manufacturer" value={item.manufacturer} />
            <Info label="Model" value={item.model} />
            <Info label="Model Number" value={item.modelNumber} />
            <Info label="Serial Number" value={item.serialNumber} />
            <Info label="Market Price" value={`$${item.marketPrice}`} />
            <Info
              label="Rental Price"
              value={`$${item.price} per ${rentalUnit(item.rentalPriceType)}`}
            />
          </div>
          <Info
            label="Available for rent"
            value={item.available ? "Yes" : "No"}
          />
          <Info label="Location of equipment" value={item.location} />
        </div>
        <footer className="fixed bottom-0 right-0 flex w-full max-w-[620px] items-center justify-between border-t border-[var(--equipment-border)] bg-[var(--equipment-panel)] p-4 shadow-[0_-8px_24px_rgba(0,0,0,.18)]">
          <span className="flex items-center gap-2 font-medium">
            <CircleDollarSign size={18} />${item.price}/
            {rentalUnit(item.rentalPriceType)}
          </span>
          <div className="flex gap-2">
            <Action icon={Pencil} label="Edit" click={edit} />
            <Action icon={Trash2} label="Delete" danger click={remove} />
          </div>
        </footer>
      </aside>
    </div>
  );
}

function StatusBadge({ status }: { status: Equipment["status"] }) {
  const available = status === "Available";
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${available ? "bg-[#ecfbf1] text-[#11a952]" : "bg-[#fff0dc] text-[#ff7927]"}`}
    >
      <i className="mr-1 inline-block h-3 w-3 rounded-full border-2 border-current align-[-2px]" />
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
  icon: EquipmentIcon;
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
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 text-sm">
      <p className="font-semibold">{label}</p>
      <p className="mt-1 text-[var(--equipment-muted)]">{value}</p>
    </div>
  );
}
