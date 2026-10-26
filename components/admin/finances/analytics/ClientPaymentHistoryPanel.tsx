"use client";

import { ChevronLeft, ChevronRight, EllipsisVertical, Eye, Loader2, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { financeTransactionsApi, type FinanceTransactionApiRow } from '@/lib/api/financeTransactions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PAGE_SIZE = 10;
type PaymentHistoryRow = FinanceTransactionApiRow & { rowKey: string };

const getPeriodRange = (period: string): { date_from?: string; date_to?: string } => {
  if (period === 'Month') return {};
  const end = new Date();
  const start = new Date(end);
  if (period === 'Last 30 Days') start.setTime(subDays(end, 29).getTime());
  else if (period === 'This Quarter') start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
  else if (period === 'This Year') start.setMonth(0, 1);
  return { date_from: format(start, 'yyyy-MM-dd'), date_to: format(end, 'yyyy-MM-dd') };
};

const formatAmount = (amount: number | string | null | undefined, currency = 'USD') => {
  const value = Number(amount);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0);
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return { date: '—', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '—', time: '' };
  return { date: format(date, 'MMMM d, yyyy'), time: format(date, 'h:mm a') };
};

export default function ClientPaymentHistoryPanel({ open, isDark, startDate = null, endDate = null }: { open: boolean; isDark: boolean; startDate?: string | null; endDate?: string | null }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [month, setMonth] = useState('Month');
  const [method, setMethod] = useState('All');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PaymentHistoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const periodRange = useMemo(() => getPeriodRange(month), [month]);
  const dateFrom = startDate && periodRange.date_from ? (startDate > periodRange.date_from ? startDate : periodRange.date_from) : startDate || periodRange.date_from;
  const dateTo = endDate && periodRange.date_to ? (endDate < periodRange.date_to ? endDate : periodRange.date_to) : endDate || periodRange.date_to;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch, status, month, method, startDate, endDate]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setRows([]);
    setTotal(0);
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setLoading(false);
      return () => { cancelled = true; };
    }
    void financeTransactionsApi.listTransactions({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: status === 'All' ? undefined : status.toLowerCase(),
      payment_method: method === 'All' ? undefined : method,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    }).then((response) => {
      if (cancelled) return;
      const nextRows = response.data?.rows ?? [];
      setRows(nextRows.map((row, index) => ({
        ...row,
        rowKey: String(row.finance_transaction_id ?? row.transaction_id ?? `${row.booking_id ?? 'payment'}-${page}-${index}`),
      })));
      const pagination = response.data?.pagination;
      setTotal(Number(pagination?.total ?? nextRows.length));
      if (pagination?.page && pagination.page !== page) setPage(pagination.page);
      if (!response.success) setError(response.message || 'Could not load payment history.');
    }).catch(() => {
      if (cancelled) return;
      setRows([]);
      setTotal(0);
      setError('Could not load payment history.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [open, page, debouncedSearch, status, method, dateFrom, dateTo]);

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((number) => number === 1 || number === totalPages || Math.abs(number - page) <= 1);

  return (
    <div className={`col-span-full grid w-full transition-[grid-template-rows] duration-500 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] !mt-0'}`}>
      <div className="min-h-0 overflow-hidden">
        <section className={`overflow-hidden rounded-2xl border transition-all duration-500 ${open ? 'translate-y-0 opacity-100' : '-translate-y-5 opacity-0'} ${isDark ? 'border-[#333333] bg-[#111111] text-white' : 'border-[#E5E5E5] bg-white text-[#202020]'}`}>
          <div className={`flex flex-col gap-4 border-b p-4 lg:p-5 ${isDark ? 'border-[#333333]' : 'border-[#E5E5E5]'}`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2"><span className="h-5 w-[3px] rounded-full bg-[#E5D5B8]" /><h3 className="text-sm font-medium lg:text-base">Payment History</h3></div>
              <div className="flex flex-wrap items-center gap-2">
                <FilterSelect value={status} onChange={setStatus} items={['All', 'Paid', 'Pending', 'Failed']} placeholder="Status" isDark={isDark} />
                <FilterSelect value={month} onChange={setMonth} items={['Month', 'Last 30 Days', 'This Quarter', 'This Year']} placeholder="Month" isDark={isDark} />
                <FilterSelect value={method} onChange={setMethod} items={['All', 'Stripe', 'Bank Transfer', 'Cash', 'ACH']} placeholder="All" isDark={isDark} />
              </div>
            </div>
            <label className={`flex h-10 items-center gap-3 rounded-lg border px-3 ${isDark ? 'border-[#333] bg-[#1A1A1A] text-white/50' : 'border-[#E5E5E5] bg-[#F7F7F7] text-[#999]'}`}><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by Shoot ID, Name..." className={`w-full bg-transparent text-xs outline-none ${isDark ? 'text-white placeholder:text-white/40' : 'text-[#202020] placeholder:text-[#999]'}`} /></label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed text-left">
              <thead className={isDark ? 'bg-[#101010] text-[#E8D1AB]' : 'bg-[#FFFCF6] text-[#323232]'}><tr className="border-b border-white/10 text-[11px] lg:text-xs"><th className="w-[10%] px-4 py-3 font-medium">Booking ID</th><th className="w-[19%] px-3 py-3 font-medium">Shoot Type</th><th className="w-[12%] px-3 py-3 font-medium">Total Amount</th><th className="w-[14%] px-3 py-3 font-medium">Invoices</th><th className="w-[15%] px-3 py-3 font-medium">Date &amp; Time</th><th className="w-[14%] px-3 py-3 font-medium">Payment Method</th><th className="w-[11%] px-3 py-3 font-medium">Status</th><th className="w-[5%] px-4 py-3 text-right font-medium">Action</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan={8} aria-live="polite" className="py-8 text-center"><Loader2 size={20} aria-label="Loading" className="mx-auto animate-spin text-[#E8D1AB]" /></td></tr>}
                {!loading && error && <tr><td colSpan={8} className="py-8 text-center text-sm text-red-400">{error}</td></tr>}
                {!loading && !error && rows.map((row) => {
                  const dateTime = formatDateTime(row.transaction_date);
                  const normalizedStatus = String(row.status || 'Pending').toLowerCase();
                  const statusLabel = normalizedStatus === 'paid' || normalizedStatus === 'succeeded' ? 'Paid' : normalizedStatus === 'failed' ? 'Failed' : 'Pending';
                  const receiptUrl = row.receipt_download_url || row.receipt_url;
                  const invoiceCount = Number(row.invoices_count || 0);
                  return <tr key={row.rowKey} className={`border-b ${isDark ? 'border-white/[0.06]' : 'border-[#EEEEEE]'}`}>
                    <td className="px-4 py-4 text-xs">#{row.booking_id ?? row.shoot_id ?? '—'}</td><td className="truncate px-3 py-4 text-xs" title={row.shoot_type || ''}>{row.shoot_type || row.project_name || '—'}</td><td className="px-3 py-4 text-xs underline underline-offset-2">{formatAmount(row.total_amount, row.currency || 'USD')}</td>
                    <td className="px-3 py-4"><span className={`whitespace-nowrap rounded-full px-3 py-2 text-[10px] ${isDark ? 'bg-[#292727] text-[#E8D1AB]' : 'bg-[#F2F0EC] text-[#806A45]'}`}>{String(invoiceCount).padStart(2, '0')} Invoices</span></td>
                    <td className="px-3 py-4 text-xs">{dateTime.date}<br />{dateTime.time}</td><td className="px-3 py-4 text-xs">{row.payment_method || '—'}</td>
                    <td className="px-3 py-4"><span className={`inline-flex min-w-[68px] justify-center rounded-full px-3 py-1.5 text-[10px] ${statusLabel === 'Paid' ? 'bg-[#D4FFE4] text-[#087A38]' : statusLabel === 'Failed' ? 'bg-[#FEE2E2] text-[#B91C1C]' : 'bg-[#FFF4C9] text-[#BA6605]'}`}>{statusLabel}</span></td>
                    <td className="px-4 py-4 text-right">{receiptUrl ? <a href={receiptUrl} target="_blank" rel="noreferrer" aria-label="View payment receipt" className={`inline-flex ${isDark ? 'text-white/70' : 'text-[#555]'}`}><Eye size={18} /></a> : <button type="button" disabled aria-label="No receipt available" className="inline-flex cursor-not-allowed text-white/40"><EllipsisVertical size={18} /></button>}</td>
                  </tr>;
                })}
                {!loading && !error && rows.length === 0 && <tr><td colSpan={8} className={`py-8 text-center text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>No payments found.</td></tr>}
              </tbody>
            </table>
          </div>
          <footer className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-[11px] ${isDark ? 'border-white/10 text-white/60' : 'border-[#E5E5E5] text-[#777]'}`}>
            <span>{total === 0 ? 'Showing 0 entries' : `Showing ${(page - 1) * PAGE_SIZE + 1} to ${Math.min(page * PAGE_SIZE, total)} of ${total} entries`}</span>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="p-1 disabled:opacity-30"><ChevronLeft size={16} /></button>
              {pageNumbers.map((number, index) => <span key={number}>{index > 0 && number - pageNumbers[index - 1] > 1 && <span className="px-1">…</span>}<button type="button" aria-current={number === page ? 'page' : undefined} onClick={() => setPage(number)} className={`h-8 w-8 rounded-md ${number === page ? `border ${isDark ? 'border-[#6A5942] text-white' : 'border-[#CDB792] text-[#323232]'}` : ''}`}>{number}</button></span>)}
              <button type="button" aria-label="Next page" disabled={page >= totalPages || loading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="p-1 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, items, placeholder, isDark }: { value: string; onChange: (value: string) => void; items: string[]; placeholder: string; isDark: boolean }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger className={`h-8 w-auto min-w-[70px] rounded-full text-[10px] lg:text-xs ${isDark ? 'border-[#3D3D3D] bg-[#171717] text-white/70' : 'border-[#E3E3E3] bg-white text-[#323232]'}`}><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{items.map((item) => <SelectItem key={item} value={item}>{item === 'All' && placeholder === 'Status' ? 'Status' : item}</SelectItem>)}</SelectContent></Select>;
}
