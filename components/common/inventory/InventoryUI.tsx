'use client';

import React from 'react';
import { useResolvedTheme } from '@/lib/useResolvedTheme';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InventoryRequest, InventoryItem, currency, available, formatInventoryDate, requestTotals } from './inventory';

export function useInventoryStyle() {
  const { isDark } = useResolvedTheme();
  return {
    isDark,
    surface: isDark ? 'bg-[#101010] border-[#3D3D3D] text-white' : 'bg-white border-[#E5E5E5] text-[#202020]',
    field: isDark ? 'bg-[#202020] border-[#FFFFFF33] text-white placeholder:text-white/40 focus:border-[#E8D1AB]' : 'bg-white border-[#E5E5E5] text-[#202020] placeholder:text-[#666666] focus:border-[#E8D1AB]',
    muted: isDark ? 'text-zinc-400' : 'text-zinc-500',
    primary: 'bg-[#E8D1AB] text-black hover:bg-[#DFC79F]',
    secondary: isDark ? 'border border-white/10 bg-[#1A1A1A] text-white/80 hover:bg-white/10' : 'border border-[#E5E5E5] bg-white text-[#333] hover:bg-zinc-50',
  };
}

export function InventoryButton({ variant = 'default', size = 'default', className, ...props }: ButtonProps) {
  const s = useInventoryStyle();
  const sizeClass = size === 'icon' ? 'h-9 w-9 rounded-lg p-0' : size === 'sm' ? 'h-9 rounded-lg px-3 text-xs font-semibold' : 'h-10 rounded-lg px-4 text-sm font-semibold';
  const variantClass = variant === 'beige'
    ? 'bg-[#E5D5B8] text-black hover:bg-[#E5D5B8]/90 font-medium'
    : variant === 'outline'
      ? `border ${s.isDark ? 'border-[#333333] bg-[#202020] text-white/70 hover:text-white' : 'border-[#E5E5E5] bg-white text-[#666666] hover:text-black'}`
      : variant === 'ghost'
        ? 'text-[#32323299] hover:bg-black/5 hover:text-[#101010] dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white'
        : '';
  return <Button {...props} variant={variant} size={size} className={`shadow-none ${sizeClass} ${variantClass} ${className || ''}`}/>;
}

export function InventoryImage({ src, alt, className = 'h-14 w-14' }: { src?: string; alt: string; className?: string }) {
  const [hasError, setHasError] = React.useState(false);
  React.useEffect(() => setHasError(false), [src]);

  return src && !hasError
    ? <img src={src} alt={alt} className={`${className} rounded-lg bg-zinc-200 object-cover`} onError={() => setHasError(true)}/>
    : <div className={`${className} flex items-center justify-center rounded-lg bg-zinc-500/10 text-xs text-zinc-400`}>Image unavailable</div>;
}

export function StatusBadge({ status }: { status: string }) {
  const s = useInventoryStyle();
  const isDark = s.isDark;

  const normalized = status.toLowerCase();
  let badgeStyle = isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700';

  if (normalized === 'accepted' || normalized === 'active' || normalized === 'completed') {
    badgeStyle = isDark ? 'bg-[#1B2E1E] text-[#69DB7C]' : 'bg-[#E6FCF5] text-[#0CA678]';
  } else if (normalized === 'pending') {
    badgeStyle = isDark ? 'bg-[#332A15] text-[#FFD43B]' : 'bg-[#FFF9DB] text-[#F59F00]';
  } else if (normalized === 'rejected' || normalized === 'inactive' || normalized === 'cancelled') {
    badgeStyle = isDark ? 'bg-[#371B1B] text-[#FF8787]' : 'bg-[#FFF0F0] text-[#F03E3E]';
  }

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${badgeStyle}`}>{status}</span>;
}

export function RequestDetailsModal({ request, open, onClose, actions, loading }: {
  request: InventoryRequest | null; open: boolean; onClose: () => void; actions?: React.ReactNode; loading?: boolean;
}) {
  const s = useInventoryStyle();
  const totals = requestTotals(request?.items || []);
  return <Dialog open={open} onOpenChange={value => !value && onClose()}>
    <DialogContent className={`max-h-[90vh] w-[calc(100vw-24px)] max-w-[680px] overflow-y-auto rounded-2xl border ${s.surface}`}>
      <DialogHeader><DialogTitle>Inventory Request Details</DialogTitle></DialogHeader>
      {loading ? <p>Loading request…</p> : request && <div className="space-y-5 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div><p className={s.muted}>Request ID</p><p className="break-all font-medium">{request.id}</p></div>
          <div><p className={s.muted}>Status</p><StatusBadge status={request.status}/></div>
          <div><p className={s.muted}>Creative Partner</p><p>{request.creator_name || request.creator_id}</p></div>
          <div><p className={s.muted}>Request Type</p><p>{request.request_type === 'shoot' ? 'Assigned Shoot' : 'Personal Use'}</p></div>
          {request.shoot_id && <div className="col-span-2"><p className={s.muted}>Assigned Shoot</p><p>{request.shoot_name || request.shoot_id} {request.shoot_date ? formatInventoryDate(request.shoot_date) : ''}</p></div>}
          <div><p className={s.muted}>Requested</p><p>{formatInventoryDate(request.created_at)}</p></div>
          {request.admin_id != null && <div><p className={s.muted}>Admin ID</p><p>{request.admin_id}</p></div>}
        </div>
        {request.admin_note && <p className={`break-words ${request.status === 'rejected' ? 'text-red-500' : ''}`}>Admin note: {request.admin_note}</p>}
        <h3 className="font-semibold">Requested Items</h3>
        <div className="space-y-3">{request.items.map(line => <div key={line.inventory_item_id} className="flex items-center gap-3 border-b border-current/10 pb-3">
          <InventoryImage src={line.item_image_snapshot} alt={line.item_name_snapshot}/>
          <div className="min-w-0 flex-1"><p className="truncate font-semibold">{line.item_name_snapshot}</p><p className={s.muted}>{currency(line.unit_price_snapshot)} × {line.quantity}</p></div>
          <strong>{currency(line.line_total)}</strong>
        </div>)}</div>
        <div className="grid grid-cols-2 gap-2 border-t border-current/10 pt-4 text-center">
          <div><p className={s.muted}>Items</p><strong>{totals.total_items}</strong></div><div><p className={s.muted}>Quantity</p><strong>{totals.total_quantity}</strong></div>
        </div>
        {actions}
      </div>}
    </DialogContent>
  </Dialog>;
}

export function InventoryCard({ item, onClick, selected }: { item: InventoryItem; onClick: () => void; selected?: boolean }) {
  const s = useInventoryStyle();
  return <button disabled={available(item) < 1 || item.status !== 'active'} onClick={onClick} className={`overflow-hidden rounded-2xl border p-3 text-left shadow-sm transition-colors hover:border-[#E8D1AB] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 ${s.surface} ${selected ? 'ring-2 ring-[#E8D1AB]' : ''}`}>
    <InventoryImage src={item.image_url} alt={item.name} className="h-32 w-full sm:h-40"/>
    <p className="mt-3 truncate font-semibold">{item.name}</p><p className={`truncate text-xs ${s.muted}`}>{item.description || 'No description'}</p>
    <div className="mt-2 flex justify-between gap-2 text-sm"><span>{currency(item.unit_price, item.currency)}</span><span className={s.muted}>{available(item)} available</span></div>
  </button>;
}
