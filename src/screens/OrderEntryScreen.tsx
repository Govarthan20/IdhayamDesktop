import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrderItems, submitOrder } from '../api';
import { useSession } from '../context/SessionContext';
import { MdArrowBack, MdInventory, MdChevronRight } from 'react-icons/md';
import { formatIndianNumber } from '../utils/formatIndianNumber';

const GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1fr',
  columnGap: 16,
  alignItems: 'center',
  padding: '0 25px',
};

const PRICE_CELL: React.CSSProperties = {
  width: 88,
  textAlign: 'right',
  justifySelf: 'start',
};

const ItemRow = React.memo(({ item, qty, onUpdate }: any) => {
  const appPrice = parseFloat(item?.appPrice || item?.raw?.APP_PRICE || '0');
  const isZero = appPrice === 0;
  const hasQty = (qty?.box && qty.box !== '0' && qty.box !== '') || (qty?.pcs && qty.pcs !== '0' && qty.pcs !== '');

  return (
    <div style={{ ...GRID_STYLE, padding: '10px 25px', backgroundColor: hasQty ? '#F0F4FF' : 'transparent', borderBottom: '1px solid #E2E8F0' }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
        <p style={{ fontSize: 13, fontWeight: 900, color: '#3861FB', margin: '2px 0 0' }}>₹{item.mrp}</p>
      </div>
      <p style={{ ...PRICE_CELL, fontSize: 13, fontWeight: 900, color: '#16A34A', margin: 0 }}>₹{appPrice.toFixed(2)}</p>
      <input type="text" inputMode="numeric" value={qty?.box || ''} onChange={e => onUpdate(item?.id, 'box', e.target.value.replace(/[^0-9]/g, ''))} disabled={isZero}
        style={{ width: '100%', height: 36, borderRadius: 8, border: '1.5px solid #EDF2F7', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#1A1A1A', outline: 'none', backgroundColor: isZero ? '#E2E8F0' : '#fff', boxSizing: 'border-box' }} />
      <input type="text" inputMode="numeric" value={qty?.pcs || ''} onChange={e => onUpdate(item?.id, 'pcs', e.target.value.replace(/[^0-9]/g, ''))} disabled={isZero}
        style={{ width: '100%', height: 36, borderRadius: 8, border: '1.5px solid #EDF2F7', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#1A1A1A', outline: 'none', backgroundColor: isZero ? '#E2E8F0' : '#fff', boxSizing: 'border-box' }} />
    </div>
  );
});

const OrderEntryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const [page, setPage] = useState<1 | 2>(1);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('');
  const [orders, setOrders] = useState<Record<string, { box: string; pcs: string }>>({});

  useEffect(() => {
    (async () => {
      try {
        const data = await getOrderItems(session?.custId);
        setProducts(data || []);
        if (data?.length > 0) {
          const catMap = new Map<string, number>();
          data.forEach((p: any) => { if (p.category && !catMap.has(p.category)) catMap.set(p.category, p.igSort || 9999); });
          const cats = Array.from(catMap.entries()).sort((a, b) => a[1] - b[1]).map(e => e[0]);
          if (cats.length > 0) setSelectedCat(cats[0]);
        }
      } catch { alert('Failed to load menu items.'); }
      finally { setLoading(false); }
    })();
  }, []);

  const categories = useMemo(() => {
    const catMap = new Map<string, number>();
    products.forEach(p => { if (p.category && !catMap.has(p.category)) catMap.set(p.category, p.igSort || 9999); });
    return Array.from(catMap.entries()).sort((a, b) => a[1] - b[1]).map(e => e[0]);
  }, [products]);

  const updateOrder = useCallback((id: string, field: 'box' | 'pcs', value: string) => {
    if (!id) return;
    setOrders(prev => ({ ...prev, [id]: { ...(prev[id] || { box: '', pcs: '' }), [field]: value } }));
  }, []);

  const activeOrders = useMemo(() => products.map(p => {
    const o = orders[p.id];
    if (!o || (o.box === '' && o.pcs === '')) return null;
    const box = parseInt(o.box || '0', 10);
    const pcs = parseInt(o.pcs || '0', 10);
    const convFactor = parseFloat(p.raw?.CONV_FACTOR || '1');
    const totalPcs = (box * convFactor) + pcs;
    if (totalPcs <= 0) return null;
    const appPrice = parseFloat(p.appPrice || p.raw?.APP_PRICE || '0');
    return { ...p, box, pcs, totalPcs, appPrice, amount: totalPcs * appPrice };
  }).filter(Boolean), [products, orders]);

  const totalAmount = useMemo(() => activeOrders.reduce((s, o: any) => s + (o.amount || 0), 0), [activeOrders]);

  const filteredData = useMemo(() => products.filter(p => p.category === selectedCat).sort((a, b) => (a.imSort || 9999) - (b.imSort || 9999)), [products, selectedCat]);

  const executeSubmit = async () => {
    if (!activeOrders.length) { alert('No items in order.'); return; }
    setLoading(true);
    try {
      const res = await submitOrder(session?.custId || '', activeOrders, session?.branchId, session?.userId);
      if (res.success) { alert(`Order #${res.orderId} recorded.`); navigate(-1); }
      else alert(res.message || 'Failed to place order.');
    } catch (e: any) { alert(e?.message || 'An error occurred.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ height: '100%', backgroundColor: '#E2E8F0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '22px 36px 18px', backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <button onClick={() => page === 2 ? setPage(1) : navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#E2E8F0', border: 'none', cursor: 'pointer', marginRight: 20, flexShrink: 0 }}>
          <MdArrowBack size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>{page === 2 ? 'Edit Order' : 'Back'}</span>
        </button>
        <div>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>{page === 1 ? 'Order Entry' : 'Review Order'}</p>
          <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, margin: '2px 0 0' }}>{page === 1 ? 'Select products to order' : 'Verify your items'}</p>
        </div>
      </div>

      {page === 1 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Category chips */}
          <div style={{ display: 'flex', overflowX: 'auto', padding: '15px 25px', gap: 10, scrollbarWidth: 'none' }}>
            {categories.map(cat => {
              const hasOrder = products.some(p => p.category === cat && ((orders[p.id]?.box && orders[p.id].box !== '0') || (orders[p.id]?.pcs && orders[p.id].pcs !== '0')));
              return (
                <button key={cat} onClick={() => setSelectedCat(cat)} style={{ padding: '10px 20px', borderRadius: 20, backgroundColor: selectedCat === cat ? '#3861FB' : '#fff', border: `1px solid ${selectedCat === cat ? '#3861FB' : '#EDF2F7'}`, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: selectedCat === cat ? '#fff' : '#718096' }}>{cat}</span>
                  {hasOrder && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: selectedCat === cat ? '#fff' : '#3861FB' }} />}
                </button>
              );
            })}
          </div>

          {/* Table header */}
          <div style={{ ...GRID_STYLE, paddingBottom: 12, borderBottom: '2px solid #EDF2F7' }}>
            {['ITEM / MRP', 'PRICE (₹)', 'BOX', 'PCS'].map((h, i) => (
              <span key={h} style={{ fontSize: 14, fontWeight: 900, color: '#1d1e1f', ...(i === 1 ? PRICE_CELL : {}), textAlign: i === 0 ? 'left' : i === 1 ? 'right' : 'center' }}>{h}</span>
            ))}
          </div>

          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 36, height: 36, border: '4px solid #EDF2F7', borderTopColor: '#3861FB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredData.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
                  <MdInventory size={48} color="#E2E8F0" />
                  <p style={{ color: '#A0AEC0', marginTop: 10, fontWeight: 600 }}>No products found</p>
                </div>
              ) : filteredData.map((item, idx) => (
                <ItemRow key={item.id || idx} item={item} qty={orders[item.id]} onUpdate={updateOrder} />
              ))}
            </div>
          )}

          {totalAmount > 0 && (
            <button onClick={() => setPage(2)} style={{ margin: 15, border: 'none', cursor: 'pointer', borderRadius: 20, background: 'linear-gradient(90deg, #3861FB, #2752E7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 25px' } as any}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700, margin: 0 }}>Total Amount</p>
                <p style={{ color: '#fff', fontSize: 18, fontWeight: 900, margin: '2px 0 0' }}>₹ {formatIndianNumber(totalAmount)}</p>
              </div>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>Review & Confirm →</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px 20px' }}>
            {(activeOrders as any[]).map((item: any) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 900, color: '#94A3B8', letterSpacing: 1, margin: 0 }}>{item.category}</p>
                  <p style={{ fontSize: 15, fontWeight: 900, color: '#1A1A1A', margin: '4px 0' }}>{item.name}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#718096', margin: 0 }}>{item.box || 0} Box + {item.pcs || 0} Pcs</p>
                </div>
                <p style={{ fontSize: 16, fontWeight: 900, color: '#3861FB', margin: 0 }}>₹{formatIndianNumber(item.amount)}</p>
              </div>
            ))}
            <div style={{ backgroundColor: '#ECFDF5', borderRadius: 16, padding: 20, display: 'flex', justifyContent: 'space-between', border: '1px solid #A7F3D0' }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#1A1A1A' }}>Grand Total</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#16A34A' }}>₹ {formatIndianNumber(totalAmount)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, padding: 15 }}>
            <button onClick={() => setPage(1)} style={{ flex: 1, background: 'linear-gradient(90deg, #3861FB, #2752E7)', border: 'none', borderRadius: 18, padding: '18px 0', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>BACK</button>
            <button onClick={executeSubmit} disabled={loading} style={{ flex: 2, background: 'linear-gradient(90deg, #3861FB, #2752E7)', border: 'none', borderRadius: 18, padding: '18px 0', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>
              {loading ? 'Placing...' : 'PLACE ORDER NOW'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderEntryScreen;
