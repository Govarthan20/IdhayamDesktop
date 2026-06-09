import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrderList } from '../api';
import { useSession } from '../context/SessionContext';
import { formatForApi, validateDateRange, getCurrentDateDDMMYYYY } from '../utils/dateHelpers';
import ReportDatePicker from '../components/ReportDatePicker';
import { MdArrowBack, MdSearch, MdKeyboardArrowDown, MdKeyboardArrowUp, MdInbox } from 'react-icons/md';

const fmtAmt = (v: number) => {
  const [i, d] = v.toFixed(2).split('.');
  const l3 = i.slice(-3), rest = i.slice(0, -3);
  return (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + l3 : l3) + '.' + d;
};

const OrderEntryReportScreen: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const [fromDate, setFromDate] = useState(getCurrentDateDDMMYYYY());
  const [toDate, setToDate] = useState(getCurrentDateDDMMYYYY());
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    const { fromError, toError } = validateDateRange(fromDate, toDate);
    if (fromError || toError) { alert(fromError || toError); return; }
    setHasSearched(true); setLoading(true);
    try {
      const results = await getOrderList(formatForApi(fromDate), formatForApi(toDate), session?.custId, session?.branchId);
      setOrders(results || []);
      if (results?.length > 0) setExpandedOrders(new Set([String(results[0].raw?.SO_ID || results[0].id)]));
    } catch { alert('Failed to fetch order report.'); }
    finally { setLoading(false); }
  };

  const groupedOrders = useMemo(() => {
    const map = new Map<string, any[]>();
    orders.forEach(o => { const k = String(o.raw?.SO_ID || o.id); if (!map.has(k)) map.set(k, []); map.get(k)!.push(o); });
    return Array.from(map.entries()).map(([soId, items]) => ({
      orderId: soId,
      orderNo: items[0].orderNo,
      date: items[0].date,
      amount: items.reduce((s: number, o: any) => s + (parseFloat(o.amount) || 0), 0),
      status: items[0].status,
      items,
    }));
  }, [orders]);

  const totalAmount = groupedOrders.reduce((s, g) => s + (g.amount || 0), 0);

  const getStatusStyle = (status: string = '') => {
    const s = status.toUpperCase();
    if (s.includes('INVOICED')) return { bg: '#E1F9F1', color: '#059669' };
    if (s.includes('CANCEL')) return { bg: '#FEE2E2', color: '#DC2626' };
    return { bg: '#FFF4E6', color: '#FF8C00' };
  };

  return (
    <div style={{ height: '100%', backgroundColor: '#F1F5F9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '22px 36px 18px', backgroundColor: '#fff', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#F1F5F9', border: 'none', cursor: 'pointer', marginRight: 20, flexShrink: 0 }}>
          <MdArrowBack size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Back</span>
        </button>
        <div>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>Order Report</p>
          <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, margin: '2px 0 0' }}>History of placed orders</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 36px 40px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 25, padding: 15, marginBottom: 20, boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <ReportDatePicker label="FROM" value={fromDate} onSelect={setFromDate} />
            <ReportDatePicker label="TO" value={toDate} onSelect={setToDate} />
            <button onClick={handleSearch} disabled={loading} style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#3861FB', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              {loading ? <div style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <MdSearch size={18} color="#fff" />}
            </button>
          </div>
        </div>

        {hasSearched && !loading && groupedOrders.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60 }}>
            <MdInbox size={48} color="#E2E8F0" />
            <p style={{ color: '#A0AEC0', marginTop: 12, fontWeight: 600 }}>No orders found for this range.</p>
          </div>
        )}

        {groupedOrders.length > 0 && (
          <div style={{ backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1.1fr 1fr 1fr 1fr 1fr', backgroundColor: '#3861FB', padding: '16px', gap: 4 }}>
              {['ITEM', 'PER\nBOX', 'PRICE', 'ORD\nBOX', 'ORD\nPCS', 'CNF\nBOX', 'CNF\nPCS'].map((h, i) => (
                <span key={i} style={{ fontSize: 13, fontWeight: 900, color: '#fff', textAlign: 'center', letterSpacing: 0.3, whiteSpace: 'pre' }}>{h}</span>
              ))}
            </div>

            {groupedOrders.map((group, gIdx) => {
              const expanded = expandedOrders.has(group.orderId);
              const { bg, color } = getStatusStyle(group.status);
              return (
                <div key={gIdx}>
                  <div onClick={() => setExpandedOrders(prev => { const n = new Set(prev); n.has(group.orderId) ? n.delete(group.orderId) : n.add(group.orderId); return n; })}
                    style={{ display: 'flex', alignItems: 'center', backgroundColor: '#EEF2FF', padding: '10px', borderTop: '1px solid #E0E7FF', cursor: 'pointer', gap: 6 }}>
                    {expanded ? <MdKeyboardArrowUp size={18} color="#3861FB" /> : <MdKeyboardArrowDown size={18} color="#3861FB" />}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.orderNo} - {group.items[0]?.group || ''}</p>
                      <p style={{ fontSize: 13, color: '#475569', fontWeight: 700, margin: '3px 0 0' }}>{group.date} • <span style={{ color: '#059669', fontWeight: 900 }}>₹ {fmtAmt(group.amount || 0)}</span></p>
                    </div>
                    <div style={{ backgroundColor: bg, padding: '4px 8px', borderRadius: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{group.status || 'PENDING'}</span>
                    </div>
                  </div>
                  {expanded && group.items.map((item: any, iIdx: number) => (
                    <div key={iIdx} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1.1fr 1fr 1fr 1fr 1fr', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #F1F5F9', backgroundColor: iIdx % 2 === 0 ? '#FAFBFF' : '#fff', gap: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#4A5568', textAlign: 'left' }}>{item.itemName || '—'}</span>
                      {[item.perBox, parseFloat(item.price || 0).toFixed(2), item.ordBox, item.ordPcs, item.cnfBox, item.cnfPcs].map((val, vi) => (
                        <span key={vi} style={{ fontSize: 13, fontWeight: vi === 1 ? 800 : 700, color: vi === 1 ? '#059669' : '#4A5568', textAlign: 'center' }}>{val ?? '—'}</span>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}

            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#E3001B', padding: 12, backgroundColor: '#FFF5F5' }}>*** Amount Changes applicable ***</div>
          </div>
        )}
      </div>

      {groupedOrders.length > 0 && (
        <div style={{ flexShrink: 0, backgroundColor: '#fff', padding: '12px 36px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#A0AEC0', letterSpacing: 1, margin: 0 }}>TOTAL ORDERS</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', margin: '4px 0 0' }}>{groupedOrders.length}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#A0AEC0', letterSpacing: 1, margin: 0 }}>TOTAL VALUE</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: '#3861FB', margin: '4px 0 0' }}>₹{fmtAmt(totalAmount)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderEntryReportScreen;
