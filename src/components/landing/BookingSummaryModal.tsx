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

  return (
    <div 
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/90 backdrop-blur-xl flex justify-center items-start py-8 sm:py-12 px-4 print:p-0 print:bg-white print:block"
      onClick={onClose}
    >
      {/* Print-specific Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: auto; margin: 10mm; }
          body { 
            background: white !important; 
            color: black !important; 
            overflow: hidden !important; /* Hide scrollbar in print */
          }
          .no-print { display: none !important; }
          .print-border { border: 1px solid #e5e7eb !important; }
          .print-shadow-none { box-shadow: none !important; }
          .print-text-black { color: black !important; }
          .print-text-gray { color: #4b5563 !important; }
          .print-bg-gray { background-color: #f9fafb !important; }
          .print-m-0 { margin: 0 !important; }
          .print-p-0 { padding: 0 !important; }
        }
      `}} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#171717] border border-white/10 w-full max-w-3xl rounded-[32px] overflow-hidden shadow-2xl relative print:border-none print:shadow-none print:bg-white print:rounded-none print:max-w-none print:m-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Gradient Bar - Hidden on print */}
        {/* <div className="h-1.5 w-full bg-gradient-to-r from-[#E8D1AB] via-[#dcb98a] to-[#E8D1AB] sticky top-0 z-20 no-print" /> */}

        {/* Header */}
       <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#1c1c1c] sticky top-1.5 z-10 print:static print:bg-white print:border-gray-200 print:px-0">
  <div className="flex items-center gap-4">
    {/* Green check circle */}
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
  <button
    onClick={onClose}
    className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all no-print"
  >
    <X size={24} />
  </button>

  {/* Logo - Only visible in print */}
  <img
    src="https://beigexmemehouse.s3.eu-north-1.amazonaws.com/beige/beige_logo_vb.png"
    alt="Beige Logo"
    className="hidden print:block print:w-24 print:absolute print:right-4 print:top-7" // Logo positioned at the top-right of the print view
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 print:gap-6">
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
                    <p className="text-white font-medium print:text-black">
                        {new Date(data.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-white/50 text-sm print:text-gray-600">{data.start_time.slice(0, 5)} - {data.end_time.slice(0, 5)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/5 p-3 rounded-2xl text-[#E8D1AB] no-print"><MapPin size={18} /></div>
                  <div>
                    <p className="text-white/70 text-sm leading-relaxed print:text-black">{data.location}</p>
                  </div>
                </div>
              </section>

              {/* Editing Deliverables */}
              {data.editing?.is_needed && (
                <section className="space-y-5 print:space-y-3">
                  <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[2px] border-b border-white/5 pb-2 print:text-gray-400 print:border-gray-100">Deliverables</h4>
                  
                  {data.editing.video_edits.length > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="bg-[#E8D1AB]/10 p-3 rounded-2xl text-[#E8D1AB] no-print"><Film size={18} /></div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-[#E8D1AB] font-bold uppercase tracking-wider print:text-gray-700">Video Reels</p>
                        {data.editing.video_edits.map((edit: string, idx: number) => (
                          <p key={idx} className="text-white/80 text-sm print:text-black">• {edit}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.editing.photo_edits.length > 0 && (
                    <div className="flex items-start gap-4">
                      <div className="bg-[#E8D1AB]/10 p-3 rounded-2xl text-[#E8D1AB] no-print"><ImageIcon size={18} /></div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-[#E8D1AB] font-bold uppercase tracking-wider print:text-gray-700">Photography</p>
                        {data.editing.photo_edits.map((edit: string, idx: number) => (
                          <p key={idx} className="text-white/80 text-sm print:text-black">• {edit}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Right Side: Crew & Pricing */}
            <div className="space-y-6">
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
                   <div className="flex justify-between text-sm">
                     <span className="text-white/40 print:text-gray-500">Base Shoot Fee</span>
                     <span className="text-white font-medium print:text-black">{formatCurrency(data.pricing.shoot_cost)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-white/40 print:text-gray-500">Post-Production</span>
                     <span className="text-white font-medium print:text-black">{formatCurrency(data.pricing.editing_cost)}</span>
                   </div>
                   {data.pricing.discount > 0 && (
                     <div className="flex justify-between text-sm text-green-500 font-medium">
                        <span>Discount Applied</span>
                        <span>-{formatCurrency(data.pricing.discount)}</span>
                     </div>
                   )}
                   
                   <div className="pt-4 mt-2 flex justify-between items-center border-t border-white/20 print:border-gray-300">
                     <div>
                        <p className="text-white font-bold text-lg print:text-black">Total Paid</p>
                        <p className="text-[9px] text-white/30 uppercase font-bold tracking-tight print:text-gray-400">Paid via Card</p>
                     </div>
                     <span className="text-[#E8D1AB] font-bold text-2xl sm:text-3xl tabular-nums print:text-black">
                        {formatCurrency(data.pricing.total)}
                     </span>
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