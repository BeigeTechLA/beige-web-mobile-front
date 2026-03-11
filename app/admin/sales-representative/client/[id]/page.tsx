"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { ArrowLeft, Mail, Phone, Calendar, MapPin, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { IntentBadge } from "@/components/sales/IntentBadge";
import DottedDivider from "@/components/admin/DottedDivider";
import { UpdateLeadIntentModal } from "@/components/sales/UpdateLeadIntent";
import Link from "next/link";
import Topbar from "@/components/admin/Topbar";
import { adminApi } from "@/lib/api"; 
import { format } from "date-fns";
import { useTheme } from "next-themes";

export default function ClientFullDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const userId = params.id as string;
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isIntentModalOpen, setIsIntentModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const res = await adminApi.getClientFullDetails(userId);
      if (res && !res.error) {
        setData(res.data);
      } else {
        toast.error(res.message || "Failed to load client data");
      }
      setLoading(false);
    };

    if (userId) loadData();
  }, [userId]);

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[60vh] transition-colors duration-300 ${isDark ? "text-white" : "text-black"}`}>
        <Loader2 className={`w-10 h-10 animate-spin ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`} />
        <p className={`mt-4 font-medium ${isDark ? "text-white/40" : "text-black/40"}`}>Loading full client details...</p>
      </div>
    );
  }

  if (!data) return <div className={`p-10 text-center ${isDark ? "text-white" : "text-black"}`}>No client found.</div>;

  const { profile, stats, projects } = data;
  const { user, affiliate } = profile;
  
  // Combine projects for the list
  const shootList = [...(projects.paid || []), ...(projects.unpaid_or_draft || [])];

  const initials = user.name
    ? user.name.split(" ").map((n: any) => n[0]).join("").toUpperCase()
    : "??";

  return (
    <>
      <Topbar pathname={pathname} />
      <div className={`overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 font-sans transition-colors duration-300 ${isDark ? "text-white" : "text-black"}`}>
        
        <Button
          onClick={() => router.back()}
          className={`transition-colors flex items-center gap-2 mb-6 p-0 bg-transparent border-none hover:bg-transparent ${isDark ? "text-white hover:text-white/80" : "text-black hover:text-black/60"}`}
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back to Management</span>
        </Button>

        <div className="space-y-6">
          {/* 1. PROFILE HEADER CARD */}
          <div className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
            isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"
          }`}>
            <div className={`flex flex-col lg:flex-row gap-4 lg:justify-between lg:items-center p-6 lg:p-9 pb-0`}>
              <h2 className="text-xl font-medium">Client Information</h2>
              <div className="flex gap-3">
                {/* <Button 
                   onClick={() => setIsIntentModalOpen(true)}
                   className="h-11 bg-zinc-800 border border-white/10 text-[#E8D1AB] px-5 rounded-lg text-sm"
                >
                  Update Intent
                </Button> */}
                <Link
                  href={`/admin/sales-representative/client/${userId}/create-booking`}
                  className={`h-11 font-semibold flex items-center px-5 rounded-lg text-sm transition-all bg-[#E8D1AB] text-black hover:bg-[#D4C3A3] `}
                >
                  Create Booking
                </Link>
              </div>
            </div>

            {/* <DottedDivider /> */}

            <div className="px-6 lg:px-9 pb-8 space-y-6">
              <div className="flex items-center gap-5">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold transition-colors ${
                  isDark ? "bg-[#E8D1AB] text-black" : "bg-[#FFF6D9] text-[#B45309]"
                }`}>
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <IntentBadge intent="Hot" />
                  </div>
                  <p className={`text-sm ${isDark ? "text-white/40" : "text-black/40"}`}>
                    User ID: <span className={isDark ? "text-white" : "text-black font-semibold"}>#{user.id}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Email", val: user.email, icon: <Mail size={14}/> },
                  { label: "Phone", val: user.phone_number || "N/A", icon: <Phone size={14}/> },
                  { label: "Member Since", val: format(new Date(user.created_at), "PPP"), icon: <Calendar size={14}/> },
                  { label: "Referral Code", val: affiliate?.referral_code || "None", icon: <Wallet size={14}/>, mono: true },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-white/40" : "text-[#999]"}`}>{item.label}</p>
                    <p className={`text-sm flex items-center gap-2 ${item.mono ? "font-mono" : ""}`}>
                      <span className={isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}>{item.icon}</span> 
                      {item.val}
                    </p>
                </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. STATS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Active", val: stats.total_active },
              { label: "Upcoming", val: stats.total_upcoming },
              { label: "Completed", val: stats.total_completed },
              { label: "Drafts", val: stats.total_draft },
              { label: "Cancelled", val: stats.total_cancelled },
            ].map((item) => (
              <div key={item.label} className={`border p-5 rounded-2xl transition-all duration-300 ${
                isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-[#FFFCF6] border-[#E5E5E5]"
              }`}>
                <p className={`text-[10px] uppercase font-bold mb-1 ${isDark ? "text-white/40" : "text-[#999]"}`}>{item.label}</p>
                <p className="text-2xl font-bold">{item.val}</p>
              </div>
            ))}
          </div>

          {/* 3. BOOKINGS LIST */}
          <div className={`border rounded-2xl p-6 lg:p-9 transition-all duration-300 ${
            isDark ? "bg-[#171717] border-[#3D3D3D]" : "bg-white border-[#E5E5E5]"
          }`}>
            <h2 className="text-xl font-medium mb-6">Booking History</h2>
            <div className="space-y-4">
              {shootList.length === 0 ? (
                <div className={`text-center py-10 border-2 border-dashed rounded-2xl ${
                  isDark ? "text-white/20 border-white/5" : "text-black/20 border-black/5"
                }`}>
                  No bookings found for this client.
                </div>
              ) : (
                shootList.map((proj: any) => (
                  <div key={proj.stream_project_booking_id} className={`border p-5 rounded-xl flex flex-col lg:flex-row justify-between gap-4 transition-colors ${
                    isDark ? "bg-[#101010] border-white/5" : "bg-[#FFFCF6] border-[#F0F0F0]"
                  }`}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-lg">{proj.project_name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                          proj.is_draft 
                          ? (isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-400') 
                          : (isDark ? 'bg-[#E8D1AB]/10 text-[#E8D1AB]' : 'bg-[#BFA780]/10 text-[#BFA780]')
                        }`}>
                          {proj.is_draft ? "Draft" : "Confirmed"}
                        </span>
                      </div>
                      <div className={`flex flex-wrap gap-4 text-sm ${isDark ? "text-white/50" : "text-black/50"}`}>
                        <span className="flex items-center gap-2"><Calendar size={14}/> {proj.event_date || 'No Date Set'}</span>
                        <span className="flex items-center gap-2"><MapPin size={14}/> {proj.event_location_formatted || 'No Location'}</span>
                      </div>
                    </div>
                    <div className="flex items-center lg:items-end flex-row lg:flex-col justify-between">
                       <div className="text-right">
                          <p className={`text-[10px] uppercase ${isDark ? "text-white/40" : "text-[#999]"}`}>Paid Amount</p>
                          <p className={`text-lg font-bold ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`}>${proj.total_paid_amount || '0.00'}</p>
                       </div>
                       <Link 
                        href={`/admin/bookings/${proj.stream_project_booking_id}`}
                        className={`text-xs hover:underline mt-1 ${isDark ? "text-[#E8D1AB]" : "text-[#BFA780]"}`}
                       >
                         View Details
                       </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <UpdateLeadIntentModal
          isOpen={isIntentModalOpen}
          onClose={() => setIsIntentModalOpen(false)}
          onSave={() => setIsIntentModalOpen(false)}
          currentIntent="Hot"
        />
      </div>
    </>
  );
}