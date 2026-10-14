import React, { useMemo, useState } from 'react';
import type { Product } from '../types';
import { getProductImageUrls } from '../utils/productPresentation';
import { getProductPrice } from '../utils/pricing';

export const SaleProductPicker: React.FC<{ products: Product[]; selectedIds: string[]; shopId: string; onChange: (ids: string[]) => void }> = ({ products, selectedIds, shopId, onChange }) => {
  const [search, setSearch] = useState('');
  const selected = new Set(selectedIds);
  const visible = useMemo(() => products.filter(product => (!shopId || product.shopId === shopId) && `${product.name} ${product.id} ${product.sku || ''}`.toLowerCase().includes(search.trim().toLowerCase())), [products, shopId, search]);
  const row = (product: Product) => <span className="flex min-w-0 items-center gap-3">
    <img src={getProductImageUrls(product)[0]} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
    <span className="min-w-0"><span className="block text-sm font-semibold">{product.name}</span><span className="block break-all text-xs text-stone-500">₹{getProductPrice(product, 'retail').toLocaleString('en-IN')} · {product.id} · {product.status}</span></span>
  </span>;
  return <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
    <h3 className="font-bold">Sale Products</h3>
    <p className="text-xs text-stone-500">Only selected products appear in this sale. The optional division filter narrows the selection further. Prices come from each product record; banner discount text does not change prices.</p>
    <label className="block text-xs font-bold">Search sale products<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name, product ID or SKU" className="mt-1 w-full rounded-lg border p-2 text-sm font-normal" /></label>
    <div className="flex flex-wrap gap-3 text-xs"><button type="button" onClick={() => onChange([...new Set([...selectedIds, ...visible.map(product => product.id)])])} className="rounded-lg border px-3 py-2">Select All Shown ({visible.length})</button><button type="button" onClick={() => onChange([])} className="rounded-lg border px-3 py-2">Clear Selection</button><span className="self-center">{selectedIds.length} selected</span></div>
    <div className="max-h-72 space-y-2 overflow-y-auto">{visible.map(product => <label key={product.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-2"><input type="checkbox" aria-label={`Select ${product.name}`} checked={selected.has(product.id)} onChange={event => onChange(event.target.checked ? [...selectedIds, product.id] : selectedIds.filter(id => id !== product.id))} />{row(product)}</label>)}{!visible.length && <p className="text-sm text-stone-500">No matching products.</p>}</div>
    <h4 className="text-sm font-bold">Selected products</h4>
    <div className="max-h-72 space-y-2 overflow-y-auto">{selectedIds.map(id => {
      const product = products.find(item => item.id === id);
      return <div key={id} className="flex items-center justify-between gap-3 rounded-lg border p-2">{product ? row(product) : <span className="break-all text-xs">Unavailable product · {id}</span>}<button type="button" aria-label={`Remove ${product?.name || id}`} onClick={() => onChange(selectedIds.filter(value => value !== id))} className="text-xs text-red-700">Remove</button></div>;
    })}</div>
    {!!shopId && products.some(product => selected.has(product.id) && product.shopId !== shopId) && <p className="text-xs text-amber-800">Selected products outside the chosen division remain saved but will not appear until the division filter is cleared.</p>}
  </section>;
};
