/** Shared class tokens for the editor file-manager screens (dark + light). */
export const fmTheme = (isDark: boolean) => ({
  strong: isDark ? "text-white" : "text-[#111111]",
  body: isDark ? "text-[#D8D8D8]" : "text-[#333333]",
  muted: isDark ? "text-white/60" : "text-black/60",
  faint: isDark ? "text-[#848484]":"text-black/70",
  gold: isDark ? "text-[#E8D1AB]" : "text-[#9C7B45]",
  /** Outer section shells */
  panel: isDark ? "bg-[#171717] border-[#3A3A3A]" : "bg-white border-[#E5E5E5]",
  /** Cards inside a panel */
  card: isDark ? "bg-[#1C1C1C] border-white/5" : "bg-[#FAFAFA] border-[#ECECEC]",
  cardHover: isDark ? "hover:border-[#E8D1AB]/40" : "hover:border-[#D9C7A0]",
  /** Boxes nested in cards (linked-to box, stats) */
  inset: isDark ? "bg-[#111111] border-white/10" : "bg-white border-[#E5E5E5]",
  divider: isDark ? "border-white/10" : "border-[#EEEEEE]",
  dashed: isDark ? "border-white/20" : "border-black/15",
  control: isDark
    ? "bg-[#1C1C1C] border-white/10 text-white placeholder:text-white/40"
    : "bg-white border-[#E5E5E5] text-black placeholder:text-black/40",
  menu: isDark ? "border-[#3A3A3A] bg-[#171717] text-white" : "border-[#E5E5E5] bg-white text-[#222222]",
  menuItem: isDark ? "hover:bg-white/10" : "hover:bg-[#F8F4EA]",
  primaryBtn: "bg-[#E8D1AB] text-[#171717] hover:bg-[#EEDCBC]",
  secondaryBtn: isDark ? "bg-white text-black hover:bg-white/90" : "bg-[#111111] text-white hover:bg-[#222222]",
  ghostBtn: isDark ? "bg-[#1F1F1F] text-white hover:bg-[#2A2A2A]" : "bg-[#F0F0F0] text-[#202020] hover:bg-[#E5E5E5]",
});

export type FmTheme = ReturnType<typeof fmTheme>;

export const formatDate = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** "10 Jan, 2026 - 10:00 AM" */
export const formatStamp = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/(\d+) (\w+) (\d+)/, "$1 $2, $3");
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${date} - ${time}`;
};

/** "Feb 14, 9:00 AM" */
export const formatShort = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
};
