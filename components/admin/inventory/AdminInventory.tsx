'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, ArrowLeft, RotateCcw, MoreVertical, Eye, Pencil, Power, Trash2 } from 'lucide-react';
import Topbar from '@/components/admin/Topbar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InventoryItem, InventoryRequest, inventoryApi, available, currency, ListParams } from '@/components/common/inventory/inventory';
import { InventoryImage, RequestDetailsModal, StatusBadge, useInventoryStyle } from '@/components/common/inventory/InventoryUI';
const pageSize = 10;
export default function AdminInventory({ mode }: {mode: 'requests' | 'items'}) {
 const s = useInventoryStyle(); const pathname = usePathname(); const router = useRouter();
 const [search, setSearch] = useState(''); const [status, setStatus] = useState('all'); const [type, setType] = useState('all'); const [page, setPage] = useState(1); const [rows, setRows] = useState<InventoryRequest[]>([]); const [items, setItems] = useState<InventoryItem[]>([]); const [total, setTotal] = useState(0); const [busy, setBusy] = useState(false); const [working, setWorking] = useState(false); const [error, setError] = useState(''); const [selected, setSelected] = useState<InventoryRequest | null>(null); const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null); const [showForm, setShowForm] = useState(false); const [detailItem, setDetailItem] = useState<InventoryItem | null>(null); const [summary, setSummary] = useState<{total_items:number; total_quantity:number; available_quantity:number; requested_quantity:number; assigned_quantity:number} | null>(null); const [reject, setReject] = useState(false); const [reason, setReason] = useState(''); const [confirmAction, setConfirmAction] = useState<'accept' | 'reject' | null>(null);
 const load = useCallback(async () => {setBusy(true);setError('');try{const params: ListParams = {page,limit:pageSize,search,status,type}; if(mode === 'requests'){const response = await inventoryApi.adminRequests(params);setRows(response.data || []);setTotal(response.total || 0);} else {const [response, stock] = await Promise.all([inventoryApi.adminItems(params),inventoryApi.stock()]);setItems(response.data || []);setTotal(response.total || 0);setSummary(stock);}}catch(e){setError(e instanceof Error ? e.message : 'Unable to load inventory');}finally{setBusy(false);}},[mode,page,search,status,type]);
 useEffect(()=>{void load();},[load]);
 const view = async (id:string)=>{setWorking(true);try{setSelected(await inventoryApi.adminRequest(id));}catch(e){toast.error(e instanceof Error?e.message:'Unable to load request');}finally{setWorking(false);}};
 const transition = async ()=>{if(!selected || !confirmAction)return;if(confirmAction==='reject' && !reason.trim())return toast.error('Rejection reason is required');setWorking(true);try{if(confirmAction==='accept')await inventoryApi.approve(selected.id);else await inventoryApi.reject(selected.id,reason.trim());toast.success(confirmAction==='accept'?'Inventory request accepted':'Inventory request rejected');setSelected(null);setConfirmAction(null);setReason('');await load();}catch(e){toast.error(e instanceof Error?e.message:'Action failed');}finally{setWorking(false);}};
 const itemAction = async (item:InventoryItem, action:'status'|'delete')=>{if(!window.confirm(action==='delete'?'Archive this inventory item?': `${item.status==='active'?'Deactivate':'Activate'} this inventory item?`))return;setWorking(true);try{if(action==='delete')await inventoryApi.deleteItem(item.id);else await inventoryApi.setStatus(item.id,item.status==='active'?'inactive':'active');toast.success('Inventory updated');await load();}catch(e){toast.error(e instanceof Error?e.message:'Action failed');}finally{setWorking(false);}};
 const primary = `rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${s.primary}`; const secondary = `rounded-lg px-4 py-2 text-sm disabled:opacity-50 ${s.secondary}`;
 return <><Topbar pathname={pathname} title={mode==='requests'?'Inventory Requests':'Manage Inventory'} actions={<button className={primary} onClick={()=>mode==='requests'?router.push('/admin/inventory/items'):(setSelectedItem(null),setShowForm(true))}>{mode==='requests'?'Manage Inventory':'Add Inventory Item'}</button>}/><main className="p-4 lg:px-10 lg:py-9 space-y-6"><div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"><div><h1 className="text-xl lg:text-2xl font-semibold">{mode==='requests'?'Inventory Requests':'Manage Inventory'}</h1><p className={`mt-1 text-sm ${s.muted}`}>{mode==='requests'?'Review and manage inventory requests from Creative Partners.':'Manage inventory items, stock and availability.'}</p></div><div className="flex flex-wrap items-center gap-2">{mode==='items'&&<button type="button" className={`${secondary} inline-flex items-center gap-2`} onClick={()=>router.push('/admin/inventory')}><ArrowLeft size={16}/> Inventory Requests</button>}<div className="lg:hidden flex gap-2"><button className={primary} onClick={()=>mode==='requests'?router.push('/admin/inventory/items'):(setSelectedItem(null),setShowForm(true))}>{mode==='requests'?'Manage Inventory':'Add Inventory Item'}</button></div></div></div>{mode==='items' && <><div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{Object.entries({ 'Total Items':summary?.total_items,'Total Stock':summary?.total_quantity,'Available':summary?.available_quantity,'Requested':summary?.requested_quantity,'Assigned':summary?.assigned_quantity}).map(([label,value])=><div key={label} className={`p-4 rounded-xl border ${s.surface}`}><p className={`text-sm ${s.muted}`}>{label}</p><p className="text-2xl font-semibold mt-2">{value??'—'}</p></div>)}</div></>}
 <section className={`rounded-xl border p-4 lg:p-6 ${s.surface}`}><div className="flex flex-wrap gap-3 mb-5"><label className="relative flex-1 min-w-48"><Search size={16} className="absolute left-3 top-3 opacity-50"/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder={mode==='requests'?'Search request ID or CP':'Search inventory items'} className={`rounded-lg border pl-9 pr-3 py-2 w-full outline-none ${s.field}`}/></label><select aria-label="Filter status" value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}} className={`rounded-lg border p-2 ${s.field}`}>{(mode==='requests'?['all','pending','accepted','rejected','cancelled']:['all','active','inactive']).map(x=><option value={x} key={x}>{x==='all'?'All Status':x}</option>)}</select>{mode==='requests'&&<select aria-label="Filter type" value={type} onChange={e=>{setType(e.target.value);setPage(1);}} className={`rounded-lg border p-2 ${s.field}`}><option value="all">All Types</option><option value="personal">Personal Use</option><option value="shoot">Assigned Shoot</option></select>}<button title="Refresh" className={secondary} onClick={()=>void load()}><RotateCcw size={16}/></button></div>{error&&<div role="alert" className="mb-4 text-red-500">{error} <button onClick={()=>void load()} className="underline">Retry</button></div>}{busy?<p className={`py-12 text-center ${s.muted}`}>Loading inventory...</p>:<div className="overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className={`border-b border-current/10 ${s.muted}`}><tr>{(mode==='requests'?['Request ID','Creative Partner','Type / Shoot','Items','Quantity','Amount','Request Date','Status','Actions']:['Item','Price','Total','Available','Requested','Assigned','Status','Actions']).map(col=><th key={col} className="px-3 py-3 font-medium">{col}</th>)}</tr></thead><tbody>{mode==='requests'?rows.map(r=><tr key={r.id} className="border-b border-current/10 hover:bg-zinc-500/5 cursor-pointer" onClick={()=>void view(r.id)}><td className="px-3 py-4 font-medium">{r.id}</td><td className="px-3 py-4">{r.creator_name||r.creator_id}</td><td className="px-3 py-4">{r.request_type==='shoot'?'Assigned Shoot':'Personal Use'}<div className={s.muted}>{r.shoot_name||r.shoot_id||'—'}</div></td><td className="px-3 py-4">{r.total_items}</td><td className="px-3 py-4">{r.total_quantity}</td><td className="px-3 py-4">{currency(r.total_amount)}</td><td className="px-3 py-4">{new Date(r.created_at).toLocaleDateString()}</td><td className="px-3 py-4"><StatusBadge status={r.status}/></td><td className="px-3 py-4"><button type="button" aria-label="View request details" className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-white/10 transition-colors"><Eye size={18}/></button></td></tr>):items.map(item=><tr key={item.id} className="border-b border-current/10"><td className="px-3 py-4"><div className="flex items-center gap-3"><InventoryImage src={item.image_url} alt={item.name}/><div><b>{item.name}</b><p className={`max-w-40 truncate ${s.muted}`}>{item.description}</p></div></div></td><td className="px-3 py-4">{currency(item.unit_price,item.currency)}</td><td className="px-3 py-4">{item.total_quantity}</td><td className="px-3 py-4">{available(item)}</td><td className="px-3 py-4">{item.requested_quantity}</td><td className="px-3 py-4">{item.assigned_quantity}</td><td className="px-3 py-4"><StatusBadge status={item.status}/></td><td className="px-3 py-4"><InventoryItemActions item={item} disabled={working} onView={()=>setDetailItem(item)} onEdit={()=>{setSelectedItem(item);setShowForm(true);}} onStatus={()=>void itemAction(item,'status')} onDelete={()=>void itemAction(item,'delete')}/></td></tr>)}{(mode==='requests'?rows.length:items.length)===0&&<tr><td colSpan={9} className={`text-center py-12 ${s.muted}`}>No inventory records found.</td></tr>}</tbody></table></div>}<div className="flex items-center justify-between gap-3 pt-5 text-sm"><span className={s.muted}>{total} records · Page {page} of {Math.max(1,Math.ceil(total/pageSize))}</span><div className="flex gap-2"><button className={secondary} disabled={page===1||busy} onClick={()=>setPage(n=>n-1)}>Previous</button><button className={secondary} disabled={page*pageSize>=total||busy} onClick={()=>setPage(n=>n+1)}>Next</button></div></div></section></main>
 <RequestDetailsModal open={!!selected} request={selected} onClose={()=>setSelected(null)} actions={selected?.status==='pending'?<div className="flex gap-3 justify-end"><button disabled={working} className={secondary} onClick={()=>{setConfirmAction('reject');setReject(true);}}>Reject</button><button disabled={working} className={primary} onClick={()=>setConfirmAction('accept')}>Accept</button></div>:undefined}/>
 <Dialog open={!!confirmAction} onOpenChange={(v)=>{if(!v){setConfirmAction(null);setReject(false);setReason('');}}}><DialogContent className={`max-w-md border ${s.surface}`}><DialogHeader><DialogTitle>{confirmAction==='accept'?'Accept Inventory Request':'Reject Inventory Request'}</DialogTitle></DialogHeader><p className="text-sm">{confirmAction==='accept'?'Confirm that reserved items should be assigned?':'Please provide a rejection reason. Reserved quantities will be released.'}</p>{reject&&<textarea aria-label="Rejection reason" placeholder="Reason for rejection" value={reason} onChange={e=>setReason(e.target.value)} className={`w-full min-h-24 border rounded-lg p-3 ${s.field}`}/>}<div className="flex justify-end gap-2"><button className={secondary} onClick={()=>{setConfirmAction(null);setReject(false);}}>Cancel</button><button disabled={working||reject&&!reason.trim()} className={primary} onClick={()=>void transition()}>{working?'Saving...':'Confirm'}</button></div></DialogContent></Dialog>
 <ItemFormModal open={showForm} item={selectedItem} onClose={()=>setShowForm(false)} onSaved={()=>{setShowForm(false);void load();}}/><Dialog open={!!detailItem} onOpenChange={v=>!v&&setDetailItem(null)}><DialogContent className={`border max-w-md ${s.surface}`}><DialogHeader><DialogTitle>{detailItem?.name}</DialogTitle></DialogHeader>{detailItem&&<div className="space-y-3"><InventoryImage src={detailItem.image_url} alt={detailItem.name} className="w-full h-44"/><p>{detailItem.description}</p><p>Unit Price: {currency(detailItem.unit_price,detailItem.currency)}</p><p>Total: {detailItem.total_quantity} · Available: {available(detailItem)}</p><p>Requested: {detailItem.requested_quantity} · Assigned: {detailItem.assigned_quantity}</p><StatusBadge status={detailItem.status}/></div>}</DialogContent></Dialog></>;
}
function ItemFormModal({open,item,onClose,onSaved}:{open:boolean;item:InventoryItem|null;onClose:()=>void;onSaved:()=>void}){const s=useInventoryStyle();const [name,setName]=useState('');const [description,setDescription]=useState('');const [price,setPrice]=useState('0');const [quantity,setQuantity]=useState('0');const [status,setStatus]=useState<'active'|'inactive'>('active');const [image,setImage]=useState<File|null>(null);const [preview,setPreview]=useState('');const [saving,setSaving]=useState(false);useEffect(()=>{setName(item?.name||'');setDescription(item?.description||'');setPrice(String(item?.unit_price??0));setQuantity(String(item?.total_quantity??0));setStatus(item?.status||'active');setImage(null);setPreview(item?.image_url||'');},[item,open]);useEffect(()=>()=>{if(preview.startsWith('blob:'))URL.revokeObjectURL(preview);},[preview]);const save=async(e:React.FormEvent)=>{e.preventDefault();const n=Number(quantity),p=Number(price);if(!name.trim()||!Number.isFinite(p)||p<0||!Number.isSafeInteger(n)||n<0)return toast.error('Enter a valid name, price, and whole-number quantity');if(item&&n<item.requested_quantity+item.assigned_quantity)return toast.error('Total cannot be below reserved and assigned stock');if(image&&(!image.type.startsWith('image/')||image.size>5*1024*1024))return toast.error('Choose an image under 5MB');setSaving(true);try{await inventoryApi.saveItem({name:name.trim(),description,unit_price:p,total_quantity:n,status,image},item?.id);toast.success(item?'Inventory item updated':'Inventory item created');onSaved();}catch(error){toast.error(error instanceof Error?error.message:'Failed to save item');}finally{setSaving(false);}};return <Dialog open={open} onOpenChange={v=>!v&&onClose()}><DialogContent className={`max-w-lg max-h-[90vh] overflow-y-auto border ${s.surface}`}><DialogHeader><DialogTitle>{item?'Edit Inventory Item':'Add Inventory Item'}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-3">{[['Item Name',name,setName],['Description',description,setDescription],['Unit Price',price,setPrice],['Total Quantity',quantity,setQuantity]] .map(([label,value,change])=><label key={label as string} className="block text-sm"><span className="block mb-1">{label as string}</span><input required={label==='Item Name'} type={label==='Unit Price'||label==='Total Quantity'?'number':'text'} min={label==='Unit Price'||label==='Total Quantity'?0:undefined} step={label==='Unit Price'?'0.01':label==='Total Quantity'?'1':undefined} value={value as string} onChange={e=>(change as (value:string)=>void)(e.target.value)} className={`w-full rounded-lg border p-2.5 ${s.field}`}/></label>)}<label className="block text-sm">Item Image<input type="file" accept="image/*" className="block w-full mt-2" onChange={e=>{const file=e.target.files?.[0]||null;setImage(file);setPreview(file?URL.createObjectURL(file):item?.image_url||'');}}/></label>{preview&&<InventoryImage src={preview} alt="Preview" className="h-32 w-32"/>}<label className="block text-sm">Status<select value={status} onChange={e=>setStatus(e.target.value as 'active'|'inactive')} className={`block w-full rounded-lg border p-2.5 mt-1 ${s.field}`}><option value="active">Active</option><option value="inactive">Inactive</option></select></label><div className="flex justify-end gap-2 pt-2"><button type="button" className={`rounded-lg px-4 py-2 ${s.secondary}`} onClick={onClose}>Cancel</button><button disabled={saving} type="submit" className={`rounded-lg px-4 py-2 ${s.primary}`}>{saving?'Saving...':item?'Save Changes':'Create Item'}</button></div></form></DialogContent></Dialog>}

function InventoryItemActions({ item, disabled, onView, onEdit, onStatus, onDelete }: {
  item: InventoryItem;
  disabled: boolean;
  onView: () => void;
  onEdit: () => void;
  onStatus: () => void;
  onDelete: () => void;
}) {
  const s = useInventoryStyle();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    const closeOnScroll = () => setOpen(false);
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('scroll', closeOnScroll, true);
    window.addEventListener('resize', closeOnScroll);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('scroll', closeOnScroll, true);
      window.removeEventListener('resize', closeOnScroll);
    };
  }, [open]);

  const toggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = 190;
      setPosition({
        top: rect.bottom + menuHeight > window.innerHeight ? rect.top - menuHeight - 6 : rect.bottom + 6,
        left: Math.max(12, Math.min(rect.right - 192, window.innerWidth - 204)),
      });
    }
    setOpen(value => !value);
  };

  const options = [
    { label: 'View Details', icon: Eye, action: onView },
    { label: 'Edit Item', icon: Pencil, action: onEdit },
    { label: item.status === 'active' ? 'Deactivate' : 'Activate', icon: Power, action: onStatus },
    { label: 'Delete Item', icon: Trash2, action: onDelete, danger: true },
  ];

  return <>
    <button
      ref={buttonRef}
      type="button"
      aria-label={`Actions for ${item.name}`}
      aria-haspopup="menu"
      aria-expanded={open}
      disabled={disabled}
      onClick={toggle}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-50 hover:bg-black/10 dark:hover:bg-white/10 ${s.muted}`}
    >
      <MoreVertical size={20} />
    </button>
    {open && typeof document !== 'undefined' && createPortal(
      <div
        ref={menuRef}
        role="menu"
        aria-label={`Actions for ${item.name}`}
        style={{ position: 'fixed', top: position.top, left: position.left, width: 192, zIndex: 1000 }}
        className={`rounded-xl border p-1.5 shadow-2xl ${s.surface}`}
      >
        {options.map(option => <button
          key={option.label}
          type="button"
          role="menuitem"
          disabled={disabled}
          onClick={() => { setOpen(false); option.action(); }}
          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-50 hover:bg-black/10 dark:hover:bg-white/10 ${option.danger ? 'text-red-500' : ''}`}
        >
          <option.icon size={16}/>{option.label}
        </button>)}
      </div>,
      document.body
    )}
  </>;
}
