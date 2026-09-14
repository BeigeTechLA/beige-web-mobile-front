import type { ComponentType } from "react";

export type EquipmentIcon = ComponentType<{
  className?: string;
  size?: number;
  strokeWidth?: number;
}>;

export type ExistingPhoto = {
  crew_equipment_photo_id?: number;
  file_url: string;
};

export type Equipment = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: string;
  status: "Available" | "On Rent";
  icon: EquipmentIcon;
  manufacturer: string;
  model: string;
  modelNumber: string;
  serialNumber: string;
  marketPrice: string;
  rentalPriceType: "1" | "2" | "3";
  location: string;
  available: boolean;
  photos?: ExistingPhoto[];
};

export type EquipmentForm = Omit<Equipment, "id" | "icon">;

export type PendingPhoto = {
  id: string;
  name: string;
  url: string;
  file: File;
};

export type EquipmentCategory = { id: number; name: string };

export const rentalUnit = (type: Equipment["rentalPriceType"]) =>
  type === "1" ? "hour" : type === "3" ? "unit" : "day";
