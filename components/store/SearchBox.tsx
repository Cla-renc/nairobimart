"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type SearchResult = {
  id: string;
  slug: string;
  images?: Array<{ url?: string }>;
  name: string;
  price: number;
};

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    setLoading(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`);
        const data = await res.json();
        setResults(data.products || []);
      } catch (err) {
        console.error("Search request failed", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [query]);

  return (
    <div className="relative">
      <input
        aria-label="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products, categories, brands..."
        className="w-full rounded-md border px-3 py-2"
      />

      {loading && <div className="absolute right-2 top-2 text-sm text-muted-foreground">Searching...</div>}

      {results.length > 0 && (
        <ul className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-md border bg-white shadow-md">
          {results.map((p) => (
            <li
              key={p.id}
              className="cursor-pointer px-3 py-2 hover:bg-gray-50"
              onClick={() => router.push(`/products/${p.slug}`)}
            >
              <div className="flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images?.[0]?.url || '/images/nairobimart-logo.svg'} alt={p.name} className="mr-3 h-10 w-10 object-cover" />
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">KES {Math.round(p.price).toLocaleString()}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
