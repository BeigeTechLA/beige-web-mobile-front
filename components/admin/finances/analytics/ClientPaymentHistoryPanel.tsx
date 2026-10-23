"use client";

import { ChevronLeft, ChevronRight, EllipsisVertical, Eye, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type PaymentHistoryRow = {
  id: string;
  bookingId: string;
  shootType: string;
  amount: string;
  invoices: number;
  date: string;
  time: string;
  method: 'Stripe' | 'Bank Transfer';
  status: 'Paid' | 'Remaining';
  action: 'menu' | 'view';
};

const PAYMENT_HISTORY: PaymentHistoryRow[] = [
  { id: '1', bookingId: 'BK-001', shootType: 'Wedding Videography', amount: '$2,500', invoices: 1, date: 'April 15, 2026', time: '11:25 AM', method: 'Stripe', status: 'Paid', action: 'menu' },
  { id: '2', bookingId: 'BK-001', shootType: 'Podcast Shoot', amount: '$8,000', invoices: 1, date: 'April 15, 2026', time: '11:25 AM', method: 'Bank Transfer', status: 'Remaining', action: 'view' },
  { id: '3', bookingId: 'BK-001', shootType: 'Music Video', amount: '$4,000', invoices: 2, date: 'April 15, 2026', time: '11:25 AM', method: 'Stripe', status: 'Remaining', action: 'menu' },
  { id: '4', bookingId: 'BK-001', shootType: 'Podcast Shoot', amount: '$8,000', invoices: 2, date: 'April 15, 2026', time: '11:25 AM', method: 'Bank Transfer', status: 'Remaining', action: 'menu' },
  { id: '5', bookingId: 'BK-001', shootType: 'Corporate Photography', amount: '$12,000', invoices: 1, date: 'April 15, 2026', time: '11:25 AM', method: 'Bank Transfer', status: 'Paid', action: 'view' },
  { id: '6', bookingId: 'BK-001', shootType: 'Podcast Shoot', amount: '$8,000', invoices: 1, date: 'April 15, 2026', time: '11:25 AM', method: 'Stripe', status: 'Paid', action: 'view' },
  { id: '7', bookingId: 'BK-001', shootType: 'Music Video', amount: '$10,000', invoices: 2, date: 'April 15, 2026', time: '11:25 AM', method: 'Bank Transfer', status: 'Paid', action: 'menu' },
];

export default function ClientPaymentHistoryPanel({ open, isDark }: { open: boolean; isDark: boolean }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [month, setMonth] = useState('Month');
  const [method, setMethod] = useState('All');
  const rows = useMemo(() => PAYMENT_HISTORY.filter((row) =>
    (status === 'All' || row.status === status) &&
    (method === 'All' || row.method === method) &&
    (!search || `${row.bookingId} ${row.shootType}`.toLowerCase().includes(search.toLowerCase()))
  ), [search, status, method]);

  return (
    <div className={`col-span-full grid w-full transition-[grid-template-rows] duration-500 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] !mt-0'}`}>
      <div className="min-h-0 overflow-hidden">
        <section className={`overflow-hidden rounded-2xl border transition-all duration-500 ${open ? 'translate-y-0 opacity-100' : '-translate-y-5 opacity-0'} ${isDark ? 'border-[#333333] bg-[#111111] text-white' : 'border-[#E5E5E5] bg-white text-[#202020]'}`}>
          <div className={`flex flex-col gap-4 border-b p-4 lg:p-5 ${isDark ? 'border-[#333333]' : 'border-[#E5E5E5]'}`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2"><span className="h-5 w-[3px] rounded-full bg-[#E5D5B8]" /><h3 className="text-sm font-medium lg:text-base">Payment History</h3></div>
              <div className="flex flex-wrap items-center gap-2">
                <FilterSelect value={status} onChange={setStatus} items={['All', 'Paid', 'Remaining']} placeholder="Status" isDark={isDark} />
                <FilterSelect value={month} onChange={setMonth} items={['Month', 'Last 30 Days', 'This Quarter', 'This Year']} placeholder="Month" isDark={isDark} />
                <FilterSelect value={method} onChange={setMethod} items={['All', 'Stripe', 'Bank Transfer']} placeholder="All" isDark={isDark} />
              </div>
            </div>
            <label className={`flex h-10 items-center gap-3 rounded-lg border px-3 ${isDark ? 'border-[#333] bg-[#1A1A1A] text-white/50' : 'border-[#E5E5E5] bg-[#F7F7F7] text-[#999]'}`}><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by Shoot ID, Name..." className={`w-full bg-transparent text-xs outline-none ${isDark ? 'text-white placeholder:text-white/40' : 'text-[#202020] placeholder:text-[#999]'}`} /></label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed text-left">
              <thead className={isDark ? 'bg-[#101010] text-[#E8D1AB]' : 'bg-[#FFFCF6] text-[#323232]'}><tr className="border-b border-white/10 text-[11px] lg:text-xs"><th className="w-[10%] px-4 py-3 font-medium">Booking ID</th><th className="w-[19%] px-3 py-3 font-medium">Shoot Type</th><th className="w-[12%] px-3 py-3 font-medium">Total Amount</th><th className="w-[14%] px-3 py-3 font-medium">Invoices</th><th className="w-[15%] px-3 py-3 font-medium">Date &amp; Time</th><th className="w-[14%] px-3 py-3 font-medium">Payment Method</th><th className="w-[11%] px-3 py-3 font-medium">Status</th><th className="w-[5%] px-4 py-3 text-right font-medium">Action</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={row.id} className={`border-b ${isDark ? 'border-white/[0.06]' : 'border-[#EEEEEE]'}`}>
                <td className="px-4 py-4 text-xs">{row.bookingId}</td><td className="px-3 py-4 text-xs">{row.shootType}</td><td className="px-3 py-4 text-xs underline underline-offset-2">{row.amount}</td>
                <td className="px-3 py-4"><span className={`whitespace-nowrap rounded-full px-3 py-2 text-[10px] ${isDark ? 'bg-[#292727] text-[#E8D1AB]' : 'bg-[#F2F0EC] text-[#806A45]'}`}>{String(row.invoices).padStart(2, '0')} Invoices</span></td>
                <td className="px-3 py-4 text-xs">{row.date}<br />{row.time}</td><td className="px-3 py-4 text-xs">{row.method}</td>
                <td className="px-3 py-4"><span className={`inline-flex min-w-[68px] justify-center rounded-full px-3 py-1.5 text-[10px] ${row.status === 'Paid' ? 'bg-[#D4FFE4] text-[#087A38]' : 'bg-[#FFF4F2] text-[#C21F16]'}`}>{row.status}</span></td>
                <td className="px-4 py-4 text-right"><button type="button" aria-label={row.action === 'view' ? 'View payment' : 'More payment actions'} className={`inline-flex ${isDark ? 'text-white/70' : 'text-[#555]'}`}>{row.action === 'view' ? <Eye size={18} /> : <EllipsisVertical size={18} />}</button></td>
              </tr>)}{rows.length === 0 && <tr><td colSpan={8} className={`py-8 text-center text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>No payments found.</td></tr>}</tbody>
            </table>
          </div>
          <footer className={`flex items-center justify-between border-t px-4 py-3 text-[11px] ${isDark ? 'border-white/10 text-white/60' : 'border-[#E5E5E5] text-[#777]'}`}><span>Page 1 to 10</span><div className="flex items-center gap-2"><button type="button" aria-label="Previous page" className="p-1 opacity-50"><ChevronLeft size={16} /></button><button type="button" className={`h-8 w-8 rounded-md border ${isDark ? 'border-[#6A5942] text-white' : 'border-[#CDB792] text-[#323232]'}`}>1</button><button type="button" className="h-8 w-8">2</button><button type="button" className="h-8 w-8">3</button><span>…</span><button type="button" aria-label="Next page" className="p-1"><ChevronRight size={16} /></button></div></footer>
        </section>
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, items, placeholder, isDark }: { value: string; onChange: (value: string) => void; items: string[]; placeholder: string; isDark: boolean }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger className={`h-8 w-auto min-w-[70px] rounded-full text-[10px] lg:text-xs ${isDark ? 'border-[#3D3D3D] bg-[#171717] text-white/70' : 'border-[#E3E3E3] bg-white text-[#323232]'}`}><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{items.map((item) => <SelectItem key={item} value={item}>{item === 'All' && placeholder === 'Status' ? 'Status' : item}</SelectItem>)}</SelectContent></Select>;
}
