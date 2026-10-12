'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  InventoryItem,
  InventoryRequest,
  RequestLine,
  available,
  currency,
  fulfillmentStatusFor,
  formatInventoryDate,
} from '@/components/common/inventory/inventory';
import {
  InventoryButton,
  InventoryImage,
  StatusBadge,
  useInventoryStyle,
} from '@/components/common/inventory/InventoryUI';
import InventoryConditionImagePicker from '@/components/common/inventory/InventoryConditionImagePicker';

type InventoryGroup = {
  id: string;
  name: string;
  description?: string;
  models: InventoryItem[];
};

type Props = {
  selectedGroup: InventoryGroup | null;
  onCloseGroup: () => void;
  onRequestModel: (model: InventoryItem) => void;
  selectedRequest: InventoryRequest | null;
  onCloseRequest: () => void;
  onBeginReturn: (line: RequestLine) => void;
  returnTarget: RequestLine | null;
  returnFiles: File[];
  setReturnFiles: (files: File[]) => void;
  returnBusy: boolean;
  onCancelReturn: () => void;
  onSubmitReturn: () => void;
};

function ModelImagePreview({
  images,
  alt,
}: {
  images: { id?: number; url: string }[];
  alt: string;
}) {
  const [selectedUrl, setSelectedUrl] = React.useState(images[0]?.url || '');

  React.useEffect(() => {
    setSelectedUrl(images[0]?.url || '');
  }, [images]);

  return (
    <div className="w-full space-y-1.5">
      <InventoryImage
        src={selectedUrl}
        alt={alt}
        className="mx-auto block max-h-56 max-w-full w-auto rounded-xl"
        fit="contain"
        transparentBackground
      />
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
          {images.map((image, index) => (
            <button
              key={`${image.id ?? index}-${image.url}`}
              type="button"
              onClick={() => setSelectedUrl(image.url)}
              aria-label={`View ${alt} image ${index + 1}`}
              className={`aspect-square w-full rounded-lg border p-0.5 ${
                selectedUrl === image.url
                  ? 'border-[#BFA780]'
                  : 'border-transparent'
              }`}
            >
              <InventoryImage
                src={image.url}
                alt={`${alt} ${index + 1}`}
                className="h-full w-full rounded-md"
                fit="contain"
                transparentBackground
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : '—';

export default function CreatorInventoryDialogs({
  selectedGroup,
  onCloseGroup,
  onRequestModel,
  selectedRequest,
  onCloseRequest,
  onBeginReturn,
  returnTarget,
  returnFiles,
  setReturnFiles,
  returnBusy,
  onCancelReturn,
  onSubmitReturn,
}: Props) {
  const s = useInventoryStyle();

  // Visual tokens only — no behaviour here
  const line = s.isDark ? 'border-[#262626]' : 'border-[#EAEAEA]';
  const panel = s.isDark ? 'border-[#262626] bg-[#161616]' : 'border-[#EAEAEA] bg-[#FAFAFA]';
  const label = `text-[11px] font-medium uppercase tracking-wider ${s.muted}`;

  const fulfillmentColor = (status?: string) => {
    if (status === 'overdue') return 'bg-red-500/10 text-red-500';
    if (status === 'issued' || status === 'returned') return 'bg-emerald-500/10 text-emerald-500';
    return 'bg-amber-500/10 text-amber-500';
  };

  return (
    <>
      {/* ───────────── Models of a group ───────────── */}
      <Dialog open={!!selectedGroup} onOpenChange={open => !open && onCloseGroup()}>
        <DialogContent
        className={`max-h-[80vh] max-w-lg overflow-y-auto rounded-2xl border p-0 shadow-2xl ${s.surface} [&>button:last-of-type]:top-5 [&>button:last-of-type]:right-5`}
        >
          <DialogHeader className={`border-b px-5 py-4 pr-14 sm:px-6 ${line}`}>
            <DialogTitle className="text-lg font-semibold leading-6 tracking-tight">
              {selectedGroup?.name} Models
            </DialogTitle>
            {selectedGroup?.description && (
              <p className={`mt-1 text-sm leading-5 ${s.muted}`}>
                {selectedGroup.description}
              </p>
            )}
          </DialogHeader>

          {selectedGroup && (
            <ul className={`divide-y px-5 sm:px-6 ${line}`}>
              {selectedGroup.models.map(model => (
                <li
                  key={model.inventory_model_id || model.id}
                  className="flex flex-col items-stretch gap-3.5 py-4"
                >
                  <ModelImagePreview
                    images={model.model_images || []}
                    alt={`${selectedGroup.name} ${model.model_name || model.name}`}
                  />

                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold leading-5">
                      {model.model_name || model.name}
                    </h2>
                    <p className={`mt-1 line-clamp-2 text-xs leading-4 ${s.muted}`}>
                      {model.description || 'No description provided.'}
                    </p>
                    <div className={`mt-3 grid grid-cols-3 divide-x rounded-lg border ${line} ${s.isDark ? 'bg-white/[0.025]' : 'bg-black/[0.02]'}`}>
                      <div className="min-w-0 px-2 py-2">
                        <p className={`text-[10px] uppercase tracking-wide ${s.muted}`}>
                          Hour
                        </p>
                        <p className="mt-0.5 truncate text-xs font-semibold">
                          {currency(model.hourly_rental_rate || 0, model.currency)}
                        </p>
                      </div>
                      <div className="min-w-0 px-2 py-2">
                        <p className={`text-[10px] uppercase tracking-wide ${s.muted}`}>
                          Day
                        </p>
                        <p className="mt-0.5 truncate text-xs font-semibold">
                          {currency(model.daily_rental_rate || 0, model.currency)}
                        </p>
                      </div>
                      <div className="min-w-0 px-2 py-2">
                        <p className={`text-[10px] uppercase tracking-wide ${s.muted}`}>
                          Available
                        </p>
                        <p className="mt-0.5 truncate text-xs font-semibold text-emerald-500">
                          {available(model)} units
                        </p>
                      </div>
                    </div>
                  </div>

                  <InventoryButton
                    variant="beige"
                    className="h-10 w-full rounded-lg px-4 text-sm font-semibold text-black"
                    onClick={() => onRequestModel(model)}
                  >
                    Request
                  </InventoryButton>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {/* ───────────── Request details ───────────── */}
      <Dialog open={!!selectedRequest} onOpenChange={open => !open && onCloseRequest()}>
        <DialogContent
          className={`max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border p-0 shadow-2xl ${s.surface}`}
        >
          <DialogHeader className={`border-b py-3.5 pl-5 pr-14 sm:pl-6 ${line}`}>
            <DialogTitle className="flex flex-wrap items-center justify-between gap-3 text-lg font-semibold tracking-tight">
              Request Details
              {selectedRequest && <StatusBadge status={selectedRequest.status} />}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 px-5 py-5 sm:px-6">
              {/* Summary */}
              <dl className={`grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border p-4 text-sm sm:grid-cols-2 ${panel}`}>
                <div>
                  <dt className={label}>Request ID</dt>
                  <dd className="mt-1 break-all font-medium">{selectedRequest.id}</dd>
                </div>
                <div>
                  <dt className={label}>Purpose</dt>
                  <dd className="mt-1 font-medium">
                    {selectedRequest.request_type === 'shoot' ? 'Assigned Shoot' : 'Personal Use'}
                  </dd>
                </div>
                {selectedRequest.shoot_name && (
                  <div>
                    <dt className={label}>Assigned Shoot</dt>
                    <dd className="mt-1 font-medium">{selectedRequest.shoot_name}</dd>
                  </div>
                )}
                <div>
                  <dt className={label}>Submitted</dt>
                  <dd className="mt-1 font-medium">{formatInventoryDate(selectedRequest.created_at)}</dd>
                </div>
              </dl>

              {/* Items */}
              <section>
                <h3 className={label}>Requested Inventory</h3>

                <ul className={`mt-2 divide-y ${line}`}>
                  {selectedRequest.items.map(item => (
                    <li
                      key={item.request_item_id || item.inventory_model_id}
                      className="flex items-start gap-4 py-4"
                    >
                      <InventoryImage
                        src={item.item_image_snapshot}
                        alt={item.item_name_snapshot}
                        className="h-14 w-14 shrink-0 rounded-lg"
                      />

                      <div className="min-w-0 flex-1">
                        {/* Title + status + amount */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{item.item_name_snapshot}</p>
                            <p className={`mt-0.5 text-xs ${s.muted}`}>
                              Qty {item.quantity} · {item.billing_unit === 'hour' ? 'Hourly rental' : 'Daily rental'}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <p className="text-sm font-bold">
                              {currency(item.total_rent || item.base_rent || item.line_total)}
                            </p>
                            {selectedRequest.status === 'accepted' && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${fulfillmentColor(
                                  item.fulfillment_status,
                                )}`}
                              >
                                {fulfillmentStatusFor(selectedRequest.status, item).replaceAll('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <dl className="mt-3 space-y-1 text-xs">
                          {(
                            [
                              ['Pickup', formatDateTime(item.expected_pickup_at), ''],
                              ['Due', formatDateTime(item.expected_return_at), ''],
                              ['Billing', item.billing_unit || 'rental', 'capitalize'],
                              ...(item.issued_at
                                ? [['Issued', formatDateTime(item.issued_at), 'text-emerald-500']]
                                : []),
                              ...(item.returned_at
                                ? [['Returned', formatDateTime(item.returned_at), 'text-emerald-500']]
                                : []),
                            ] as [string, string, string][]
                          ).map(([k, v, extra]) => (
                            <div key={k} className="flex items-baseline justify-between gap-3">
                              <dt className={s.muted}>{k}</dt>
                              <dd className={`text-right font-medium ${extra}`}>{v}</dd>
                            </div>
                          ))}
                        </dl>

                        {/* Charges */}
                        <dl className={`mt-2 space-y-1 border-t pt-2 text-xs ${line}`}>
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className={s.muted}>Base</dt>
                            <dd className="font-medium">{currency(item.base_rent || 0)}</dd>
                          </div>
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className={s.muted}>Late</dt>
                            <dd className={`font-medium ${item.late_charge ? 'text-red-500' : ''}`}>
                              {currency(item.late_charge || 0)}
                            </dd>
                          </div>
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className={s.muted}>Total</dt>
                            <dd className="font-bold">
                              {currency(item.total_rent || item.base_rent || 0)}
                            </dd>
                          </div>
                        </dl>

                        {/* Photos */}
                        {!!item.handover_images?.length && (
                          <div className="mt-3">
                            <p className={label}>Handover</p>
                            <div className="mt-1.5 flex flex-wrap gap-2">
                              {item.handover_images.map((image, index) => (
                                <InventoryImage
                                  key={image.file_path || String(index)}
                                  src={image.url}
                                  alt="Handover condition"
                                  className="h-12 w-12 rounded-md"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {!!item.return_images?.length && (
                          <div className="mt-3">
                            <p className={label}>Return</p>
                            <div className="mt-1.5 flex flex-wrap gap-2">
                              {item.return_images.map((image, index) => (
                                <InventoryImage
                                  key={image.file_path || String(index)}
                                  src={image.url}
                                  alt="Return condition"
                                  className="h-12 w-12 rounded-md"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notices / actions */}
                        {selectedRequest.status === 'accepted' && !item.issued_at && !item.returned_at && (
                          <p className="mt-3 text-xs font-medium text-amber-500">
                            Waiting for Admin handover. Return will be available after the item is issued.
                          </p>
                        )}

                        {selectedRequest.status === 'accepted' && item.issued_at && !item.returned_at && (
                          <InventoryButton
                            variant="outline"
                            className="mt-3 h-9 rounded-lg px-3 text-xs"
                            onClick={() => onBeginReturn(item)}
                          >
                            Return this item
                          </InventoryButton>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className={`flex items-center justify-between border-t pt-4 text-sm ${line}`}>
                  <span className={`font-medium ${s.muted}`}>
                    Total quantity: {selectedRequest.total_quantity}
                  </span>
                  <span className="text-base font-bold">{currency(selectedRequest.total_amount)}</span>
                </div>
              </section>

              {/* Admin note */}
              {selectedRequest.admin_note && (
                <div className={`rounded-xl border p-4 ${panel}`}>
                  <p className={label}>Admin Note</p>
                  <p className="mt-1 text-sm leading-relaxed">{selectedRequest.admin_note}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ───────────── Return item ───────────── */}
      <Dialog open={!!returnTarget} onOpenChange={open => !open && onCancelReturn()}>
        <DialogContent className={`max-w-lg rounded-2xl border p-0 shadow-2xl ${s.surface}`}>
          <DialogHeader className={`border-b py-3.5 pl-5 pr-14 sm:pl-6 ${line}`}>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Return {returnTarget?.item_name_snapshot}
            </DialogTitle>
            <p className={`mt-1 text-sm ${s.muted}`}>
              Choose up to 8 photos showing the item condition at return.
            </p>
          </DialogHeader>

          <div className="px-5 py-5 sm:px-6">
            <InventoryConditionImagePicker
              files={returnFiles}
              onChange={setReturnFiles}
              disabled={returnBusy}
              label="Return condition photos"
            />
          </div>

          <div className={`flex justify-end gap-2 border-t px-5 py-4 sm:px-6 ${line}`}>
            <InventoryButton variant="outline" onClick={onCancelReturn}>
              Cancel
            </InventoryButton>
            <InventoryButton
              variant="beige"
              disabled={returnBusy || !returnFiles.length}
              onClick={onSubmitReturn}
            >
              {returnBusy ? 'Uploading and recording…' : 'Upload photos & Return'}
            </InventoryButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
