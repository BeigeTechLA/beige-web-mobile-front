import { newshootTypes } from "@/app/data/shootData";

export const V4_SHOOT_TYPES = newshootTypes.filter((type) => type.key !== "coachella");
export const DEFAULT_V4_SHOOT_TYPE = V4_SHOOT_TYPES[0]?.key || "wedding";
