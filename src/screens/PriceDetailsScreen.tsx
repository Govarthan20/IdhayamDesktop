import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPriceList } from '../api';
import { useSession } from '../context/SessionContext';
import { MdArrowBack, MdSearch } from 'react-icons/md';

const PriceDetailsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPriceList(session?.custId);
        setProducts(data || []);
        if (data?.length > 0) {
          const catMap = new Map<string, number>();
          data.forEach((p: any) => { if (p.category && !catMap.has(p.category)) catMap.set(p.category, p.igSort || 9999); });
          const cats = Array.from(catMap.entries()).sort((a, b) => a[1] - b[1]).map(e => e[0]);
          if (cats.length > 0) setSelectedCat(cats[0]);
        }
      } catch (e) { console.error('Price fetch error:', e); }
      finally { setLoading(false); }
    })();
  }, []);

  const categories = useMemo(() => {
    const catMap = new Map<string, number>();
    products.forEach(p => { if (p.category && !catMap.has(p.category)) catMap.set(p.category, p.igSort || 9999); });
    return Array.from(catMap.entries()).sort((a, b) => a[1] - b[1]).map(e => e[0]);
  }, [products]);

  const filtered = useMemo(() => products
    .filter(p => p.category === selectedCat && (p.name || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.imSort ?? 9999) - (b.imSort ?? 9999))
  , [products, search, selectedCat]);

  const thStyle: React.CSSProperties = { fontSize: 14, fontWeight: 900, color: '#1d1e1f', textAlign: 'center', padding: '0 0 12px' };

  return (
    <div style={{ height: '100%', backgroundColor: '#E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '22px 36px 18px', backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#E2E8F0', border: 'none', cursor: 'pointer', marginRight: 20, flexShrink: 0 }}>
          <MdArrowBack size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Back</span>
        </button>
        <div>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>Price Details</p>
          <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, margin: '2px 0 0' }}>Search products / categories</p>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding: '12px 25px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: '0 15px', height: 46, border: '1px solid #EDF2F7' }}>
          <MdSearch size={20} color="#A0AEC0" style={{ marginRight: 8 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#1A1A1A', border: 'none', outline: 'none', backgroundColor: 'transparent' }} />
        </div>
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', overflowX: 'auto', padding: '15px 25px', gap: 10, scrollbarWidth: 'none', flexShrink: 0 }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCat(cat)} style={{ padding: '10px 20px', borderRadius: 20, backgroundColor: selectedCat === cat ? '#3861FB' : '#fff', border: `1px solid ${selectedCat === cat ? '#3861FB' : '#EDF2F7'}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: selectedCat === cat ? '#fff' : '#718096' }}>{cat}</span>
          </button>
        ))}
      </div>

      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.5fr 1fr 1.4fr', padding: '0 25px 12px', borderBottom: '2px solid #EDF2F7', flexShrink: 0 }}>
        <span style={{ ...thStyle, textAlign: 'left', color: '#1A1A1A' }}>MRP (₹)</span>
        <span style={{ ...thStyle, textAlign: 'center' }}>ITEM</span>
        <span style={{ ...thStyle, textAlign: 'center' }}>TAX %</span>
        <span style={{ ...thStyle, textAlign: 'right', color: '#1A1A1A' }}>PRICE (₹)</span>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 36, height: 36, border: '4px solid #EDF2F7', borderTopColor: '#3861FB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((item, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.5fr 1fr 1.4fr', alignItems: 'center', padding: '12px 25px', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#3861FB', textAlign: 'left' }}>₹{item.mrp}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', textAlign: 'center', paddingLeft: 8, paddingRight: 8 }}>{item.name}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', textAlign: 'center' }}>{item.tax}</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#16A34A', textAlign: 'right' }}>₹{item.appPrice}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PriceDetailsScreen;
