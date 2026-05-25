import React, { useEffect } from "react";
import { 
  X, Calendar, MapPin, Camera, Users, CheckCircle2, 
  Film, Image as ImageIcon, Info 
} from "lucide-react";
import { motion } from "framer-motion";

export const BookingSummaryModal = ({ isOpen, onClose, data }: any) => {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  const parseDateValue = (value?: string | null) => {
    if (!value) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;

    const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatShortDate = (value: string) => {
    const date = parseDateValue(value);
    if (!date) return value;
    const parts = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).formatToParts(date);
    const day = parts.find((part) => part.type === "day")?.value || "";
    const month = parts.find((part) => part.type === "month")?.value || "";
    const year = parts.find((part) => part.type === "year")?.value || "";
    return `${day} ${month}, ${year}`;
  };

  const formatTime = (value?: string | null) => {
    if (!value) return "";
    const trimmed = String(value).trim();
    if (!trimmed) return "";

    const meridiemMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s)?([AaPp][Mm])$/);
    if (meridiemMatch) {
      const hours = Number(meridiemMatch[1]);
      const minutes = Number(meridiemMatch[2]);
      const suffix = meridiemMatch[3].toUpperCase();

      if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
        const normalizedHours = suffix === "PM" ? (hours % 12) + 12 : hours % 12;
        const date = new Date(2000, 0, 1, normalizedHours, minutes, 0);
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }
    }

    const timeMatch =
      trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/) ||
      trimmed.match(/(?:T|\s)(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z)?$/);

    if (timeMatch) {
      const hours = Number(timeMatch[1]);
      const minutes = Number(timeMatch[2]);
      const seconds = Number(timeMatch[3] || 0);
      const date = new Date(2000, 0, 1, hours, minutes, Number.isNaN(seconds) ? 0 : seconds);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
      }
    }

    const parsed = parseDateValue(trimmed);
    if (!parsed) return trimmed;
    return parsed.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getEditCounts = (items: string[] = []) => {
    const counts = new Map<string, number>();
    items.forEach((item) => {
      const label = String(item || "").trim();
      if (!label) return;
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([label, count]) => ({
      label,
      count,
    }));
  };

  const bookingDays = Array.isArray(data?.booking_days) ? data.booking_days : [];
  const hasMultipleBookingDays = bookingDays.length > 1;
  const toNumber = (value: unknown) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };
  const creditAppliedAmount = Math.max(toNumber(data?.pricing?.credit_applied), 0);
  const cardPaidAmount = Math.max(toNumber(data?.pricing?.total_paid ?? data?.pricing?.total), 0);
  const combinedPaidAmount = Math.max(cardPaidAmount + creditAppliedAmount, 0);
  const displayTotalAmount = toNumber(
    data?.pricing?.payment_summary?.quote_total ??
    data?.pricing?.total_before_discounts ??
    data?.pricing?.total
  );
  const paymentMethodLabel =
    creditAppliedAmount > 0 && cardPaidAmount > 0
      ? "Paid via Card + Account Credit"
      : creditAppliedAmount > 0
        ? "Paid via Account Credit"
        : "Paid via Card";

  return (
    <div 
      id="booking-summary-modal"
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/90 backdrop-blur-xl flex justify-center items-start py-8 sm:py-12 px-4 print:absolute print:inset-0 print:p-0 print:bg-white print:block print:overflow-hidden"
      onClick={onClose}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* 1. Force completely hide ALL scrollbars */
          ::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          * {
            scrollbar-width: none !important; /* Firefox */
            -ms-overflow-style: none !important; /* IE/Edge */
          }

          /* 2. Remove default browser margins */
          @page { 
            size: portrait; 
            margin: 0 !important; 
          }
          
          /* 3. Strictly lock the entire document */
          html, body { 
            width: 100% !important;
            height: 100vh !important; 
            max-height: 100vh !important;
            min-height: 0 !important;
            overflow: hidden !important; 
            margin: 0 !important;
            padding: 0 !important;
            background: white !important; 
            box-sizing: border-box !important;
          }

          body > * {
            max-height: 100vh !important;
            overflow: hidden !important;
          }
          
          /* 4. Hide all background website content */
          body * {
            visibility: hidden;
          }
          
          /* 5. Make ONLY the modal and its children visible */
          #booking-summary-modal, #booking-summary-modal * {
            visibility: visible;
          }
          
          /* 6. Position modal perfectly */
          #booking-summary-modal {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 15mm !important; 
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
          }
          
          /* Helpers */
          .no-print { display: none !important; }
        }
      `}} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#171717] border border-white/10 w-full max-w-3xl rounded-[32px] overflow-hidden shadow-2xl relative print:border-none print:shadow-none print:bg-white print:rounded-none print:max-w-none print:m-0"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
       <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1c1c1c] sticky top-1.5 z-10 relative print:static print:bg-white print:border-gray-200 print:px-0 print:pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-500/20 p-2.5 rounded-full print:bg-green-100">
              <CheckCircle2 className="text-green-500 w-6 h-6 sm:w-7 sm:h-7 print:text-green-600" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-tight print:text-black">
                Booking Confirmation
              </h3>
              <p className="text-[10px] sm:text-xs text-green-500/80 font-medium uppercase tracking-wide print:text-green-600">
                Payment Received
              </p>
            </div>
          </div>

          {/* Close button — absolutely positioned so it doesn't affect flex layout */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all no-print"
          >
            <X size={24} />
          </button>

          {/* Logo — always visible on screen, right-aligned flex sibling */}
          <img
            src="/images/blackBeigeLogo.png"
            alt="Beige Logo"
            className="w-20 h-auto object-contain print:w-24 lg:mr-8"
          />
       </div>

        {/* Modal Content */}
        <div className="p-6 lg:p-10 space-y-8 print:p-0 print:pt-6">
          
          {/* Project Identity */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-6 print:border-gray-200">
            <div>
                <span className="text-[10px] text-[#E8D1AB] uppercase tracking-[3px] font-bold print:text-gray-500">Project Name</span>
                <h2 className="text-2xl lg:text-3xl font-bold text-white mt-1 print:text-black">{data.project_name}</h2>
            </div>
            <div className="text-left sm:text-right">
                <span className="text-[10px] text-white/40 uppercase tracking-[2px] font-bold print:text-gray-500">Reference ID</span>
                <p className="text-white/60 font-mono text-sm print:text-black">#TMP-{data.booking_id.toString().padStart(4, '0')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-10 print:gap-6 print:items-start">
            {/* Left Side: Shoot Details */}
            <div className="space-y-8 print:space-y-6">
              <section className="space-y-5 print:space-y-3">
                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[2px] border-b border-white/5 pb-2 print:text-gray-400 print:border-gray-100">Shoot Details</h4>
                
                <div className="flex items-start gap-4">
                  <div className="bg-white/5 p-3 rounded-2xl text-[#E8D1AB] no-print"><Camera size={18} /></div>
                  <div>
                    <p className="text-white font-medium print:text-black">{data.event_type}</p>
                    <p className="text-[#E8D1AB] text-sm print:text-gray-600">{data.shoot_type}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/5 p-3 rounded-2xl text-[#E8D1AB] no-print"><Calendar size={18} /></div>
                  <div>
                    {hasMultipleBookingDays ? (
                      <div className="space-y-2">
                        {bookingDays.map((day: any, index: number) => {
                          const dateValue = day?.event_date || day?.date || "";
                          const startValue = day?.start_time || day?.startTime || "";
                          const endValue = day?.end_time || day?.endTime || "";

                          return (
                            <div key={`${dateValue}-${startValue}-${endValue}-${index}`}>
                              <p className="text-white font-medium print:text-black">
                                {formatShortDate(dateValue)}
                              </p>
                              <p className="text-white/50 text-sm print:text-gray-600">
                                {formatTime(startValue)} - {formatTime(endValue)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <>
                        <p className="text-white font-medium print:text-black">
                          {formatShortDate(data.date)}
                        </p>
                        <p className="text-white/50 text-sm print:text-gray-600">
                          {formatTime(data.start_time)} - {formatTime(data.end_time)}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/5 p-3 rounded-2xl text-[#E8D1AB] no-print"><MapPin size={18} /></div>
                  <div>
                    <p className="text-white/70 text-sm leading-relaxed print:text-black">{data.location}</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Side: Crew & Pricing */}
            <div className="space-y-6">
              {data.editing?.is_needed && (
                <section className="space-y-5 print:space-y-3">
                  <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[2px] border-b border-white/5 pb-2 print:text-gray-400 print:border-gray-100">Deliverables</h4>
                  
                  {data.editing.video_edits.length > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="bg-[#E8D1AB]/10 p-3 rounded-2xl text-[#E8D1AB] no-print"><Film size={18} /></div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-[#E8D1AB] font-bold uppercase tracking-wider print:text-gray-700">Video Reels</p>
                        {getEditCounts(data.editing.video_edits).map(({ label, count }) => (
                          <p key={label} className="text-white/80 text-sm print:text-black">
                            • {label}{count > 1 ? ` (x${count})` : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.editing.photo_edits.length > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="bg-[#E8D1AB]/10 p-3 rounded-2xl text-[#E8D1AB] no-print"><ImageIcon size={18} /></div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-[#E8D1AB] font-bold uppercase tracking-wider print:text-gray-700">Photography</p>
                        {getEditCounts(data.editing.photo_edits).map(({ label, count }) => (
                          <p key={label} className="text-white/80 text-sm print:text-black">
                            • {label}{count > 1 ? ` (x${count})` : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 lg:p-8 space-y-6 print:bg-gray-50 print:border-gray-200 print:p-6 print:rounded-xl">
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Users size={14} className="text-[#E8D1AB] no-print" />
                        <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest print:text-black">Required Crew</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {data.crew_counts.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-white/5 px-4 py-2 rounded-xl print:bg-white print:border print:border-gray-100">
                                <span className="text-white/60 text-sm print:text-black">{item.role}</span>
                                <span className="text-white font-bold print:text-black">x{item.count}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="pt-6 border-t border-white/10 space-y-3 print:border-gray-200">
                   {/* <div className="flex justify-between text-sm">
                     <span className="text-white/40 print:text-gray-500">Base Shoot Fee</span>
                     <span className="text-white font-medium print:text-black">{formatCurrency(data.pricing.shoot_cost)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-white/40 print:text-gray-500">Post-Production</span>
                     <span className="text-white font-medium print:text-black">{formatCurrency(data.pricing.editing_cost)}</span>
                   </div> */}
                   <div className="flex justify-between text-sm">
                     <span className="text-white/40 print:text-gray-500">Total Amount</span>
                     <span className="text-white font-medium print:text-black">
                       {formatCurrency(displayTotalAmount)}
                     </span>
                   </div>
                   {data.pricing.discount_code && (
                     <div className="flex justify-between text-sm text-white/60 print:text-gray-600">
                        <span>Discount Code</span>
                        <span className="font-medium">{data.pricing.discount_code}</span>
                     </div>
                   )}
                   {data.pricing.discount_code_discount > 0 && (
                     <div className="flex justify-between text-sm text-green-500 font-medium">
                        <span>Discount</span>
                        <span>-{formatCurrency(data.pricing.discount_code_discount)}</span>
                     </div>
                   )}
                   {data.pricing.referral_code && (
                     <div className="flex justify-between text-sm text-white/60 print:text-gray-600">
                        <span>Referral Code</span>
                        <span className="font-medium">{data.pricing.referral_code}</span>
                     </div>
                   )}
                   {data.pricing.referral_discount > 0 && (
                     <div className="flex justify-between text-sm text-green-500 font-medium">
                        <span>Referral Code Discount</span>
                        <span>-{formatCurrency(data.pricing.referral_discount)}</span>
                     </div>
                   )}
	                   {data.pricing.credit_applied > 0 && (
	                     <div className="flex justify-between text-sm text-green-500 font-medium">
	                        <span>Account Credit</span>
	                        <span>-{formatCurrency(data.pricing.credit_applied)}</span>
	                     </div>
	                   )}
                   
                   <div className="pt-4 mt-2 border-t border-white/20 print:border-gray-300">
	                     <div className="flex items-center justify-between gap-6">
	                        <p className="text-white font-bold text-base sm:text-lg leading-none whitespace-nowrap print:text-black">Total Paid</p>
	                        <span className="text-[#E8D1AB] font-bold text-xl sm:text-2xl tabular-nums text-right leading-none whitespace-nowrap print:text-black">
	                           {formatCurrency(combinedPaidAmount)}
	                        </span>
	                     </div>
	                     <p className="mt-2 text-[10px] text-white/35 uppercase font-bold tracking-[0.12em] whitespace-nowrap print:text-gray-400">{paymentMethodLabel}</p>
	                   </div>
	                </section>
	              </div>

              {/* Information Notice */}
              <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl print:bg-white print:border-gray-200">
                <Info size={16} className="text-blue-400 shrink-0 mt-0.5 no-print" />
                <p className="text-[11px] text-blue-200/60 leading-relaxed print:text-gray-600">
                    A confirmation email has been sent to <span className="text-blue-300 font-bold print:text-black">{data.client_email}</span>. Our team will reach out within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer - Hidden on Print */}
        <div className="p-6 lg:p-10 bg-[#1c1c1c] border-t border-white/5 flex flex-col sm:flex-row gap-4 sticky bottom-0 z-10 no-print">
           <button 
            onClick={() => window.location.href = '/'}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
           >
             Back
           </button>
           <button 
            onClick={() => window.print()}
            className="flex-1 py-4 bg-[#E8D1AB] hover:bg-[#dcb98a] text-black font-bold rounded-2xl transition-all shadow-[0_0_30px_-5px_rgba(232,209,171,0.4)]"
           >
             Download Receipt
           </button>
        </div>
      </motion.div>
    </div>
  );
};
