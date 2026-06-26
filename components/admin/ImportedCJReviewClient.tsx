"use client";

import React, { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  images?: { url: string }[];
  category?: { id: string; name: string } | null;
};

export default function ImportedCJReviewClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, cRes] = await Promise.all([
          fetch('/api/admin/products/imported'),
          fetch('/api/admin/categories')
        ]);
        if (pRes.ok) setProducts(await pRes.json());
        if (cRes.ok) setCategories(await cRes.json());
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    };
    load();
  }, [refreshKey]);

  const reassign = async (productId: string, categoryId: string) => {
    try {
      const res = await fetch('/api/admin/products/reassign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, categoryId })
      });
      if (!res.ok) throw new Error('Failed');
      setRefreshKey(k => k + 1);
    } catch (e) {
      alert('Reassign failed');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Imported (CJ) - Review</h2>
        <button className="btn" onClick={() => setRefreshKey(k => k + 1)}>Refresh</button>
      </div>
      {loading ? <p>Loading...</p> : (
        <div className="space-y-4">
          {products.length === 0 && <p>No imported products found.</p>}
          {products.map(p => (
            <div key={p.id} className="flex items-center space-x-4 p-3 border rounded">
              <img src={p.images?.[0]?.url || '/images/placeholder.jpg'} alt={p.name} className="h-16 w-16 object-cover rounded" />
              <div className="flex-1">
                <div className="font-bold">{p.name}</div>
                <div className="text-sm text-muted-foreground">SKU: {p.sku || '—'}</div>
                <div className="text-sm">Current: {p.category?.name || 'Imported (CJ)'}</div>
              </div>
              <div className="w-64">
                <select defaultValue="" onChange={(e) => { if (e.target.value) reassign(p.id, e.target.value); }} className="w-full p-2 border rounded">
                  <option value="">Select category to assign…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
