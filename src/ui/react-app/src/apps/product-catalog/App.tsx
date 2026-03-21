/**
 * Product Catalog — Card grid of products with search and filtering.
 */
import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { CardGrid } from '../../components/data/CardGrid';
import type { CardGridItem } from '../../types';
import '../../styles/base.css';
import '../../styles/interactive.css';

function extractData(result: CallToolResult): any {
  const sc = (result as any).structuredContent;
  if (sc) return sc;
  for (const item of result.content || []) {
    if (item.type === 'text') {
      try { return JSON.parse(item.text); } catch {}
    }
  }
  return null;
}

function formatCurrency(n: number, currency = 'USD'): string {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n); }
  catch { return `$${n.toFixed(2)}`; }
}

function statusVariant(status?: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'published') return 'active';
  if (s === 'draft') return 'draft';
  if (s === 'archived' || s === 'inactive') return 'draft';
  if (s === 'out_of_stock' || s === 'out of stock') return 'error';
  return 'active';
}

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const { isConnected, error } = useApp({
    appInfo: { name: 'Product Catalog', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (a) => {
      a.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  const products: any[] = data.products || [];
  const currency = data.currency || 'USD';

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const p of products) {
      if (p.category) cats.add(p.category);
      if (p.type) cats.add(p.type);
    }
    return ['all', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (activeFilter !== 'all') {
      result = result.filter((p: any) =>
        (p.category || '').toLowerCase() === activeFilter.toLowerCase() ||
        (p.type || '').toLowerCase() === activeFilter.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p: any) =>
        (p.name || p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, activeFilter, searchQuery]);

  const cards: CardGridItem[] = filteredProducts.map((p: any) => ({
    title: p.name || p.title || 'Untitled Product',
    subtitle: formatCurrency(p.price ?? 0, p.currency || currency),
    description: p.description,
    imageUrl: p.imageUrl || p.image,
    status: p.status || 'Active',
    statusVariant: statusVariant(p.status),
    action: 'View',
  }));

  return (
    <div>
      <PageHeader title="Product Catalog" subtitle={`${products.length} product${products.length !== 1 ? 's' : ''}`} />

      <div className="search-bar" style={{ marginBottom: 12 }}>
        <input type="text" className="search-input" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      {categories.length > 1 && (
        <div className="filter-chips" style={{ marginBottom: 16 }}>
          {categories.map((cat) => (
            <button key={cat} className={`chip ${activeFilter === cat ? 'chip-active' : ''}`} onClick={() => setActiveFilter(cat)}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      )}

      {cards.length > 0 ? (
        <CardGrid cards={cards} columns={2} />
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>{searchQuery ? 'No products match your search' : 'No products available'}</p>
        </div>
      )}
    </div>
  );
}
