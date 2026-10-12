'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, UploadCloud, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InventoryItem, InventoryModel, inventoryApi } from '@/components/common/inventory/inventory';
import { inventoryHttpApi } from '@/lib/api';
import { InventoryButton, InventoryImage, useInventoryStyle } from '@/components/common/inventory/InventoryUI';

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif';

export default function AdminInventoryItemForm({ open, item, modelId, onClose, onSaved }: { open: boolean; item: InventoryItem | null; modelId?: string; onClose: () => void; onSaved: () => void }) {
  const s = useInventoryStyle();
  type EditableModel = InventoryModel;
  const blankModel = useCallback((): EditableModel => ({ name: '', description: '', price: 0, hourly_rental_rate: 0, daily_rental_rate: 0, total_quantity: 1, available_quantity: 0, requested_quantity: 0, assigned_quantity: 0, is_active: 1, unit_ids: [], images: [], image_urls: [] }), []);
  const [name, setName] = useState('');
  const [models, setModels] = useState<EditableModel[]>([blankModel()]);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    setName(item?.name || '');
    setModels(item?.models || [blankModel()]);
  }, [item, open, blankModel]);

  const patchModel = (index: number, patch: Partial<EditableModel>) => setModels(current => current.map((model, i) => i === index ? { ...model, ...patch } : model));
  const setQuantity = (index: number, quantity: number) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 250) return;
    patchModel(index, { total_quantity: quantity });
  };
  const uploadImages = async (index: number, fileList: FileList | null) => {
    if (uploadingImages || saving) return;
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length) return;
    const model = models[index];
    if (model.image_urls.length + files.length > 8) return toast.error('Each model can have up to 8 images.');
    if (files.some(file => !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5 * 1024 * 1024)) return toast.error('Choose JPG, PNG, WebP, or GIF images under 5MB.');
    setUploadingImages(true);
    try {
      const result = await inventoryHttpApi.uploadAdminModelImages(files);
      const uploaded = Array.isArray(result?.data) ? result.data as { url: string; file_path: string }[] : [];
      if (uploaded.length !== files.length || uploaded.some(image => !image.file_path)) throw new Error('Some model images did not upload. Please try again.');
      patchModel(index, { images: [...model.images, ...uploaded], image_urls: [...model.image_urls, ...uploaded.map(image => image.file_path)] });
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to upload model images.'); }
    finally { setUploadingImages(false); }
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || uploadingImages) return;
    if (!name.trim()) return toast.error('Inventory item name is required.');
    if (!models.length || models.some(model => !model.name.trim() || !Number.isSafeInteger(Number(model.total_quantity)) || Number(model.total_quantity) < 1 || (Number(model.hourly_rental_rate) <= 0 && Number(model.daily_rental_rate) <= 0))) return toast.error('Enter each model name, quantity, and at least one rental rate.');
    if (models.some(model => model.image_urls.length < 1 || model.image_urls.length > 8)) return toast.error('Each model must have 1 to 8 images.');
    setSaving(true);
    try {
      await inventoryApi.saveItem({ name: name.trim(), models: models.map(model => ({ ...model, price: 0 })), status: 'active' }, item?.id);
      toast.success(item ? 'Inventory item updated' : 'Inventory item created');
      onSaved();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to save item.'); }
    finally { setSaving(false); }
  };

  const busy = uploadingImages || saving;
  const dividerClass = s.isDark ? 'border-white/10' : 'border-black/10';
  const cardClass = s.isDark ? 'border-[#303030] bg-[#151515]' : 'border-[#EAEAEA] bg-[#FAFAFA]';
  const dropzoneTone = s.isDark
    ? 'border-white/15 bg-white/[0.03] hover:border-[#BFA780]/60 hover:bg-white/[0.06]'
    : 'border-black/15 bg-black/[0.02] hover:border-[#BFA780] hover:bg-black/[0.04]';

  return <Dialog open={open} onOpenChange={value => !value && onClose()}>
    <DialogContent className={`max-h-[90vh] max-w-3xl gap-0 overflow-y-auto rounded-2xl border p-0 ${s.surface}`}>
      <DialogHeader className={`border-b px-6 py-5 text-left ${dividerClass}`}>
        <DialogTitle className="text-xl font-bold tracking-tight">{modelId ? 'Edit Inventory Model' : item ? 'Edit Inventory Item' : 'Add New Inventory Item'}</DialogTitle>
        <DialogDescription className={`text-sm ${s.muted}`}>
          {modelId ? 'Update this model’s details and availability.' : 'Add the item, its models, rental rates and images.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={event => void save(event)} className="space-y-6 px-6 py-5">
        {/* Item details */}
        {!modelId && <Field label="Inventory Item Name" value={name} onChange={setName} s={s} placeholder="e.g. Canon Camera" />}

        {/* Models */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">Models and Physical Units</h3>
              <p className={`text-xs ${s.muted}`}>{modelId ? 'Editing one model' : `${models.length} ${models.length === 1 ? 'model' : 'models'}`}</p>
            </div>
            {!modelId && <InventoryButton
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={busy}
              onClick={() => setModels(current => [...current, blankModel()])}
            >
              <Plus size={15} className="mr-1" />
              Add Model
            </InventoryButton>}
          </div>

          {models.map((model, index) => ({ model, index })).filter(({ model }) => !modelId || String(model.id) === modelId).map(({ model, index }) => (
            <section
              key={model.id || `new-${index}`}
              className={`space-y-4 rounded-2xl border p-5 shadow-sm ${cardClass}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#BFA780]/20 text-xs font-bold text-[#BFA780]">
                    {index + 1}
                  </span>
                  <h4 className="font-semibold">Model {index + 1}</h4>
                </div>
                {!modelId && models.length > 1 && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setModels(current => current.filter((_, i) => i !== index))}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    Remove model
                  </button>
                )}
              </div>

              <label className="block max-w-xs text-sm font-semibold">
                Model Status
                <select
                  value={model.is_active === 0 ? 'inactive' : 'active'}
                  onChange={event => patchModel(index, { is_active: event.target.value === 'active' ? 1 : 0 })}
                  className={`mt-1.5 block h-[42px] w-full rounded-xl border px-2.5 text-sm font-medium ${s.field}`}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Field
                    label="Model Name"
                    value={model.name}
                    onChange={value => patchModel(index, { name: value })}
                    s={s}
                    placeholder="Canon DD"
                  />
                </div>
                <Field
                  label="Quantity"
                  value={String(model.total_quantity)}
                  onChange={value => setQuantity(index, Number(value))}
                  type="number"
                  step="1"
                  s={s}
                />
              </div>

              <Field
                label="Model Description"
                value={model.description || ''}
                onChange={value => patchModel(index, { description: value })}
                s={s}
                placeholder="Description unique to this model"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Rental rate per hour ($)"
                  value={String(model.hourly_rental_rate || '')}
                  onChange={value => patchModel(index, { hourly_rental_rate: Number(value) })}
                  type="number"
                  step="any"
                  s={s}
                />
                <Field
                  label="Rental rate per day ($)"
                  value={String(model.daily_rental_rate || '')}
                  onChange={value => patchModel(index, { daily_rental_rate: Number(value) })}
                  type="number"
                  step="any"
                  s={s}
                />
              </div>

              <p className={`text-xs ${s.muted}`}>{model.total_quantity} units; numeric unit IDs are generated automatically.</p>

              <div className={`space-y-3 border-t pt-4 ${dividerClass}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm font-semibold">Model Images</label>
                  <span className={`inline-flex items-center gap-2 text-xs ${s.muted}`}>
                    {uploadingImages && (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#BFA780]" />
                        Uploading images…
                      </>
                    )}
                    {model.image_urls.length}/8 images · Max 5MB each
                  </span>
                </div>

                {model.image_urls.length === 0 ? (
                  <label className={`flex h-36 flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition ${busy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${dropzoneTone}`}>
                    <UploadCloud className="mb-2 h-7 w-7 text-[#BFA780]" />
                    <span className="text-sm font-semibold">Upload model images</span>
                    <span className={`mt-1 text-xs ${s.muted}`}>
                      JPG, PNG, WebP, or GIF · Up to 8 images
                    </span>
                    <input
                      type="file"
                      accept={ACCEPTED_IMAGE_TYPES}
                      multiple
                      disabled={busy}
                      className="hidden"
                      onChange={event => {
                        void uploadImages(index, event.target.files);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {model.images.map(image => (
                      <div
                        key={image.file_path || image.url}
                        className={`group relative aspect-square overflow-hidden rounded-xl border ${dividerClass}`}
                      >
                        <InventoryImage
                          src={image.url}
                          alt={`${model.name} model`}
                          className="h-full w-full"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            patchModel(index, {
                              images: model.images.filter(value => value.file_path !== image.file_path),
                              image_urls: model.image_urls.filter(value => value !== image.file_path),
                            })
                          }
                          className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition hover:bg-black group-hover:opacity-100"
                          aria-label="Remove model image"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {model.image_urls.length < 8 && (
                      <label
                        className={`flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed transition ${busy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${dropzoneTone}`}
                      >
                        <Plus className="mb-1 h-6 w-6 text-[#BFA780]" />
                        <span className={`text-xs ${s.muted}`}>Add more</span>
                        <input
                          type="file"
                          accept={ACCEPTED_IMAGE_TYPES}
                          multiple
                          disabled={busy}
                          className="hidden"
                          onChange={event => {
                            void uploadImages(index, event.target.files);
                            event.currentTarget.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 border-t pt-4 ${dividerClass}`}>
          <InventoryButton
            type="button"
            variant="outline"
            className="rounded-xl px-5"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </InventoryButton>
          <InventoryButton
            type="submit"
            variant="beige"
            className="rounded-xl px-6 font-bold text-black"
            disabled={busy}
          >
            {saving
              ? 'Saving…'
              : uploadingImages
                ? 'Uploading images…'
                : item
                  ? 'Save Changes'
                  : 'Create Item'}
          </InventoryButton>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}

function Field({
  label,
  value,
  onChange,
  s,
  invalid = false,
  errorMessage,
  ...inputProps
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  s: ReturnType<typeof useInventoryStyle>;
  invalid?: boolean;
  errorMessage?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        {...inputProps}
        value={value}
        onChange={event => onChange(event.target.value)}
        aria-invalid={invalid}
        className={`mt-1.5 block h-[42px] w-full rounded-xl border px-3 text-sm font-medium outline-none transition focus:border-[#BFA780] ${s.field} ${invalid ? 'border-red-500 focus:border-red-500' : ''}`}
      />
      {invalid && errorMessage && <span className="mt-1 block text-xs font-normal text-red-500">{errorMessage}</span>}
    </label>
  );
}
