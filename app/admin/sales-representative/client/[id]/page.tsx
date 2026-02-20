"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { ArrowLeft, Mail, Phone, Calendar, MapPin, Loader2, User, Wallet, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { IntentBadge } from "@/components/sales/IntentBadge";
import DottedDivider from "@/components/admin/DottedDivider";
import { UpdateLeadIntentModal } from "@/components/sales/UpdateLeadIntent";
import Link from "next/link";
import Topbar from "@/components/admin/Topbar";
import { adminApi } from "@/lib/api"; 
import { format } from "date-fns";

export default function ClientFullDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const userId = params.id as string; // The ID passed from the management table

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#E8D1AB]" />
        <p className="mt-4 text-white/40 font-medium">Loading full client details...</p>
      </div>
    );
  }

  if (!data) return <div className="p-10 text-white text-center">No client found.</div>;

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
      <div className="overflow-hidden p-4 lg:p-6 lg:px-10 lg:py-9 text-white font-sans">
        
        <Button
          onClick={() => router.back()}
          className="text-white hover:text-white/80 transition-colors flex items-center gap-2 mb-6 p-0 bg-transparent border-none"
        >
          <ArrowLeft size={24} />
          <span className="text-sm font-medium">Back to Management</span>
        </Button>

        <div className="space-y-6">
          {/* 1. PROFILE HEADER CARD */}
          <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-4 lg:justify-between lg:items-center p-6 lg:p-9 pb-0">
              <h2 className="text-xl font-medium">Client Information</h2>
              <div className="flex gap-3">
                <Button 
                   onClick={() => setIsIntentModalOpen(true)}
                   className="h-11 bg-zinc-800 border border-white/10 text-[#E8D1AB] px-5 rounded-lg text-sm"
                >
                  Update Intent
                </Button>
                <Link
                  href={`/admin/sales-representative/client/${userId}/create-booking`}
                  className="h-11 bg-[#E8D1AB] hover:bg-[#D4C3A3] text-black font-semibold flex items-center px-5 rounded-lg text-sm transition-all"
                >
                  Create Booking
                </Link>
              </div>
            </div>

            <DottedDivider />

            <div className="px-6 lg:px-9 pb-8 space-y-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-[#E8D1AB] text-black flex items-center justify-center text-2xl font-bold">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <IntentBadge intent="Hot" />
                  </div>
                  <p className="text-sm text-white/40">User ID: <span className="text-white">#{user.id}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-white/40 font-bold tracking-wider">Email</p>
                  <p className="text-sm flex items-center gap-2"><Mail size={14} className="text-[#E8D1AB]"/> {user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-white/40 font-bold tracking-wider">Phone</p>
                  <p className="text-sm flex items-center gap-2"><Phone size={14} className="text-[#E8D1AB]"/> {user.phone_number || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-white/40 font-bold tracking-wider">Member Since</p>
                  <p className="text-sm flex items-center gap-2"><Calendar size={14} className="text-[#E8D1AB]"/> {format(new Date(user.created_at), "PPP")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase text-white/40 font-bold tracking-wider">Referral Code</p>
                  <p className="text-sm flex items-center gap-2 font-mono"><Wallet size={14} className="text-[#E8D1AB]"/> {affiliate?.referral_code || "None"}</p>
                </div>
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
              <div key={item.label} className="bg-[#171717] border border-[#3D3D3D] p-5 rounded-2xl">
                <p className="text-[10px] uppercase text-white/40 font-bold mb-1">{item.label}</p>
                <p className="text-2xl font-bold">{item.val}</p>
              </div>
            ))}
          </div>

          {/* 3. BOOKINGS LIST */}
          <div className="bg-[#171717] border border-[#3D3D3D] rounded-2xl p-6 lg:p-9">
            <h2 className="text-xl font-medium mb-6">Booking History</h2>
            <div className="space-y-4">
              {shootList.length === 0 ? (
                <div className="text-center py-10 text-white/20 border-2 border-dashed border-white/5 rounded-2xl">
                  No bookings found for this client.
                </div>
              ) : (
                shootList.map((proj: any) => (
                  <div key={proj.stream_project_booking_id} className="bg-[#101010] border border-white/5 p-5 rounded-xl flex flex-col lg:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-lg">{proj.project_name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${proj.is_draft ? 'bg-zinc-800 text-zinc-500' : 'bg-[#E8D1AB]/10 text-[#E8D1AB]'}`}>
                          {proj.is_draft ? "Draft" : "Confirmed"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-white/50">
                        <span className="flex items-center gap-2"><Calendar size={14}/> {proj.event_date || 'No Date Set'}</span>
                        <span className="flex items-center gap-2"><MapPin size={14}/> {proj.event_location_formatted || 'No Location'}</span>
                      </div>
                    </div>
                    <div className="flex items-center lg:items-end flex-row lg:flex-col justify-between">
                       <div className="text-right">
                          <p className="text-[10px] uppercase text-white/40">Paid Amount</p>
                          <p className="text-lg font-bold text-[#E8D1AB]">${proj.total_paid_amount || '0.00'}</p>
                       </div>
                       <Link 
                        href={`/admin/bookings/${proj.stream_project_booking_id}`}
                        className="text-xs text-[#E8D1AB] hover:underline mt-1"
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