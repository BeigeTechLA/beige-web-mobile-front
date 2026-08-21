"use client";

import type { AdminStudioDetail } from "@/lib/api";
import { safeJsonParse } from "@/lib/safeJsonParse";

const card = "rounded-2xl border border-white/10 bg-[#171717] p-5";
const chip = "rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/75";
const label = (value: string) => value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const text = (value: unknown) => value == null || value === "" ? "Not specified" : String(value);
const list = (value: unknown) => safeJsonParse<unknown[]>(value, []).filter((item): item is string => typeof item === "string" && item.trim().length > 0);
const object = (value: unknown) => safeJsonParse<Record<string, unknown>>(value, {});
const money = (value: unknown) => value == null || value === "" ? "Not specified" : `$${Number(value).toLocaleString()}`;

const BoolRow = ({ name, value }: { name: string; value: unknown }) => <div className="flex justify-between gap-4 border-b border-white/5 py-2 text-sm last:border-0"><span className="text-white/65">{label(name)}</span><span className={value === true || value === 1 || value === "true" || value === "1" ? "text-emerald-400" : "text-white/45"}>{value === true || value === 1 || value === "true" || value === "1" ? "Yes" : "No"}</span></div>;
const Chips = ({ values }: { values: string[] }) => values.length ? <div className="flex flex-wrap gap-2">{values.map((value) => <span className={chip} key={value}>{label(value)}</span>)}</div> : <p className="text-sm text-white/45">None added</p>;

export default function StudioDetails({ studio }: { studio: AdminStudioDetail }) {
  const basics = object(studio.space_basics);
  const pricing = object(studio.pricing_settings);
  const rules = object(studio.house_rules);
  const policies = object(studio.policies);
  const facilities = object(studio.facility_features);
  const categories = Array.isArray(pricing.categories) ? pricing.categories.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")) : [];
  const equipment = Array.isArray(pricing.equipment) ? pricing.equipment.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")) : [];
  const dimensions = [["Address", [studio.address_line1, studio.address_line2, studio.city, studio.state, studio.zip_code, studio.country].filter(Boolean).join(", ")], ["Timezone", studio.timezone], ["Square feet", studio.square_feet], ["Height", studio.height], ["Width", studio.width], ["Length", studio.length], ["Capacity min", studio.capacity_min], ["Capacity max", studio.capacity_max], ["Floor", studio.main_floor_number]].filter(([, value]) => value != null && value !== "");
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const hours = Array.isArray(studio.operating_hours) ? studio.operating_hours : [];
  const time = (value: unknown) => { const match = String(value || "").match(/^(\d{1,2}):(\d{2})/); if (!match) return "Not specified"; const hour = Number(match[1]); return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`; };
  const policyGroups = ["cancellation_and_refund", "safety", "cleanliness", "additional"];
  const basicsPresent = [basics.guests, basics.bedrooms, basics.beds, basics.bathrooms].some((value) => Number(value || 0) > 0);
  const review = studio.review_summary;

  return <div className="space-y-5">
    <section className={card}><h2 className="mb-4 text-xl font-semibold">Address &amp; Location</h2><div className="grid gap-4 sm:grid-cols-2">{dimensions.map(([name, value]) => <div key={String(name)}><p className="text-xs text-white/45">{name}</p><p className="mt-1 text-sm">{text(value)}</p></div>)}</div></section>
    <section className={card}><h2 className="mb-4 text-xl font-semibold">Pricing &amp; Packages</h2><div className="grid gap-4 lg:grid-cols-2">{categories.map((item, i) => <div className="rounded-xl border border-white/10 p-4" key={i}><div className="flex justify-between"><span>{text(item.name)}</span><span className="text-[#E5D5B8]">{money(item.price)}</span></div><div className="mt-3"><Chips values={list(item.includes)} /></div><p className="mt-3 text-xs text-white/45">{item.minHours != null ? `${item.minHours} min hours` : ""}{item.maxPeopleAllowed != null ? ` · ${item.maxPeopleAllowed} max people` : ""}</p></div>)}</div><p className="mb-2 mt-5 text-sm text-white/55">Equipment</p><Chips values={equipment.map((item) => `${text(item.name)}${item.cost != null ? ` · ${money(item.cost)}` : ""}`)} /></section>
    <section className={card}><h2 className="mb-4 text-xl font-semibold">Space Basics</h2>{basicsPresent ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{[["Guests", basics.guests], ["Bedrooms", basics.bedrooms], ["Beds", basics.beds], ["Bathrooms", basics.bathrooms]].map(([name, value]) => <div key={String(name)}><p className="text-xs text-white/45">{String(name)}</p><p className="mt-1">{text(value)}</p></div>)}</div> : <p className="text-sm text-white/45">Not specified</p>}</section>
    <section className={card}><h2 className="mb-4 text-xl font-semibold">Facility Features</h2>{Object.entries(facilities).map(([name, value]) => list(value).length ? <div className="mb-4" key={name}><p className="mb-2 text-sm text-white/50">{label(name)}</p><Chips values={list(value)} /></div> : null)}</section>
    <section className={card}><h2 className="mb-4 text-xl font-semibold">Parking, Access &amp; Activities</h2><div className="grid gap-4 sm:grid-cols-2"><div><p className="mb-2 text-sm text-white/50">Parking</p><Chips values={list(studio.parking_options)} />{studio.parking_description && <p className="mt-2 text-sm text-white/60">{studio.parking_description}</p>}</div><div><p className="mb-2 text-sm text-white/50">Access</p><Chips values={list(studio.access_features)} /></div><div><p className="mb-2 text-sm text-white/50">Supported shoot types</p><Chips values={list(studio.supported_shoot_types)} /></div><div><p className="mb-2 text-sm text-white/50">Activities</p><Chips values={list(studio.activities)} /></div></div></section>
    <section className={card}><h2 className="mb-4 text-xl font-semibold">House Rules</h2>{Object.entries(rules).filter(([name]) => name !== "custom_rules").map(([name, value]) => <BoolRow key={name} name={name} value={value} />)}{list(rules.custom_rules).length > 0 && <ul className="mt-3 list-disc pl-5 text-sm text-white/65">{list(rules.custom_rules).map((rule) => <li key={rule}>{rule}</li>)}</ul>}</section>
    <section className={card}><h2 className="mb-4 text-xl font-semibold">Policies</h2><div className="grid gap-4 sm:grid-cols-2">{policyGroups.map((group) => <div key={group}><p className="mb-2 text-sm text-white/50">{label(group)}</p>{Object.entries(object(policies[group])).map(([name, value]) => <BoolRow key={name} name={name} value={value} />)}</div>)}</div></section>
    <section className={card}><h2 className="mb-4 text-xl font-semibold">Rates &amp; Security</h2><div className="grid grid-cols-2 gap-4 sm:grid-cols-4"><div><p className="text-xs text-white/45">Hourly</p><p>{money(studio.hourly_rate)}</p></div><div><p className="text-xs text-white/45">Overtime</p><p>{money(studio.overtime_rate)}</p></div><div><p className="text-xs text-white/45">Minimum booking</p><p>{text(studio.minimum_booking_hours)} hours</p></div><div><p className="text-xs text-white/45">Buffer</p><p>{text(studio.buffer_time_minutes)} minutes</p></div></div><div className="mt-5 grid gap-2 sm:grid-cols-2"><BoolRow name="Overnight stays allowed" value={studio.overnight_stays_allowed} /><BoolRow name="Security recording enabled" value={studio.security_recording_enabled} /></div>{studio.security_recording_description && <p className="mt-3 text-sm text-white/60">{studio.security_recording_description}</p>}<p className="mt-3 text-sm text-white/60">WiFi: {text(studio.wifi_name)}</p></section>
    <section className={card}><h2 className="mb-4 text-xl font-semibold">Operating Hours</h2>{days.map((day, index) => { const hour = hours.find((item) => Number(item.day_of_week) === index); return <div className="flex justify-between border-b border-white/5 py-2 text-sm last:border-0" key={day}><span>{day}</span><span className="text-white/55">{hour?.is_open ? `${time(hour.opens_at)} - ${time(hour.closes_at)}` : "Closed"}</span></div>; })}</section>
    <section className={card}><h2 className="mb-4 text-xl font-semibold">Status &amp; Reviews</h2><div className="flex flex-wrap gap-2"><span className={chip}>Status: {text(studio.status)}</span><span className={chip}>Verification: {text(studio.verification_status)}</span><span className={chip}>Active: {studio.is_active ? "Yes" : "No"}</span></div>{!review || review.total_reviews === 0 ? <p className="mt-4 text-sm text-white/45">No reviews yet</p> : <p className="mt-4 text-sm">{review.average_rating ?? "Not specified"} average from {review.total_reviews} reviews</p>}</section>
  </div>;
}
