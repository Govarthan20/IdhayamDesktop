import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getDiscountDetail } from '../api';
import { useSession } from '../context/SessionContext';
import { MdArrowBack, MdInfoOutline } from 'react-icons/md';

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', padding: '6px 0' }}>
    <span style={{ flex: 1.2, fontSize: 11, fontWeight: 900, color: '#334155', letterSpacing: 0.5 }}>{label}</span>
    <span style={{ flex: 2, fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{value}</span>
  </div>
);

const formatValidity = (from: string, to: string) => `${from ? from.split('T')[0] : 'N/A'} TO ${to ? to.split('T')[0] : 'N/A'}`;
const calcAchieved = (sale: any, target: any) => { const s = parseFloat(sale) || 0, t = parseFloat(target) || 1; return ((s / t) * 100).toFixed(2); };
const fmtNum = (val: any) => { const n = parseFloat(val); return isNaN(n) ? (val || '-') : n.toLocaleString('en-IN', { maximumFractionDigits: 2 }); };

const parseOrderItems = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((v: any) => v?.ITEM_DESC || v?.ITEM_NAME || v?.NAME || v?.IG_DISP || String(v)).filter(Boolean);
  const str = String(val).trim();
  if (!str || str === 'null') return [];
  try { const p = JSON.parse(str); if (Array.isArray(p)) return p.map((v: any) => typeof v === 'object' ? (v?.ITEM_DESC || v?.ITEM_NAME || v?.NAME || v?.IG_DISP || JSON.stringify(v)) : String(v)).filter(Boolean); } catch { }
  return str.split(',').map((s: string) => s.trim()).filter(Boolean);
};

const DiscountDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useSession();
  const { items, type, custType, schemeName } = (location.state as any) || {};
  const [slabData, setSlabData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const d = await getDiscountDetail(items, type, session?.custId); setSlabData(d || []); }
      catch { setSlabData([]); }
      finally { setLoading(false); }
    })();
  }, [items, type, session?.custId]);

  const isSD = type === 'SD';
  const isQD = type === 'QD';

  const thStyle: React.CSSProperties = { fontSize: 11, fontWeight: 900, color: '#3861FB', textAlign: 'center', padding: '10px 8px', backgroundColor: '#E8EDF3', borderBottom: '1.5px solid #EDF2F7' };
  const tdStyle: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: '#E53E3E', textAlign: 'center', padding: '12px 8px' };

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#E2E8F0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '22px 36px 18px', backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#E2E8F0', border: 'none', cursor: 'pointer', marginRight: 20, flexShrink: 0 }}>
          <MdArrowBack size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Back</span>
        </button>
        <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>{schemeName}</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 36px 40px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div style={{ width: 36, height: 36, border: '4px solid #EDF2F7', borderTopColor: '#3861FB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : slabData.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80 }}>
            <MdInfoOutline size={60} color="#CBD5E0" />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#A0AEC0', marginTop: 15 }}>No Data Found</p>
          </div>
        ) : slabData.map((slab, sIdx) => {
          const applicableItems = parseOrderItems(slab?.ORDER_ITEMS || slab?.APP_ITEMS || slab?.APPLICABLE_ITEM || slab?.ITEMS || null);
          return (
            <div key={sIdx} style={{ backgroundColor: '#fff', borderRadius: 28, padding: 22, marginBottom: 15, boxShadow: '0 4px 15px rgba(48,79,254,0.05)', border: '1.5px solid #EDF2F7' }}>
              <p style={{ fontSize: 16, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 0.5 }}>{slab?.IG_DISP || schemeName || 'Product Scheme'}</p>

              <div style={{ marginBottom: 20 }}>
                {isSD && <InfoRow label="QUOTA" value={slab?.REMARKS || slab?.FREE_ITEM_REMARKS || 'N/A'} />}
                <InfoRow label="VALIDITY" value={formatValidity(slab?.VALID_FROM, slab?.VALID_TO)} />
                {!isSD && !isQD && <>
                  <InfoRow label="TARGET" value={`${slab?.LTR || '0'} ${slab?.INV_UOM || 'LT'}`} />
                  <InfoRow label="SALE" value={`${slab?.PERIOD_SALE || '0'} ${slab?.INV_UOM || 'LT'}`} />
                  <InfoRow label="ADJUSTMENT" value={`${slab?.ADJUSTMENT || '0'} ${slab?.INV_UOM || 'LT'}`} />
                  <InfoRow label="ADDITIONAL" value={`${slab?.ADDITIONAL || slab?.ADD_LTR || '0'} ${slab?.INV_UOM || 'LT'}`} />
                </>}
                {isQD && slab?.DISCOUNT_DETAIL && slab.DISCOUNT_DETAIL.split(',').map((row: string, ri: number) => {
                  const [from, to, rate] = row.split('#').map((s: string) => s?.trim() || '-');
                  return <InfoRow key={ri} label="SLAB" value={`${from} TO ${to}  —  ${rate}`} />;
                })}
              </div>

              {isSD && (
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #EDF2F7', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                  <thead><tr>
                    <th style={thStyle}>SALES QUOTA</th>
                    <th style={{ ...thStyle, borderLeft: '1px solid #EDF2F7' }}>UTILIZED</th>
                    <th style={{ ...thStyle, borderLeft: '1px solid #EDF2F7' }}>UN UTILIZED</th>
                  </tr></thead>
                  <tbody><tr style={{ borderTop: '1px solid #E2E8F0' }}>
                    <td style={tdStyle}>{slab?.SALES_QUOTA || slab?.LTR || '0'} {slab?.INV_UOM || 'LT'}</td>
                    <td style={{ ...tdStyle, borderLeft: '1px solid #EDF2F7' }}>{slab?.UTILIZED || slab?.PERIOD_SALE || '0'} {slab?.INV_UOM || 'LT'}</td>
                    <td style={{ ...tdStyle, borderLeft: '1px solid #EDF2F7' }}>{slab?.UN_UTILIZED || (parseFloat(slab?.LTR || 0) - parseFloat(slab?.PERIOD_SALE || 0)).toFixed(0)} {slab?.INV_UOM || 'LT'}</td>
                  </tr></tbody>
                </table>
              )}

              {!isSD && !isQD && slab?.DISCOUNT_DETAIL && (
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #EDF2F7', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                  <thead>
                    <tr>
                      <th colSpan={3} style={{ ...thStyle, borderBottom: '1px solid #EDF2F7' }}>ALLOCATION</th>
                      <th style={{ ...thStyle, borderLeft: '1px solid #EDF2F7', fontSize: 10 }}>ACHIEVED<br /><span style={{ fontWeight: 600, color: '#718096' }}>({fmtNum(slab?.PERIOD_SALE)} {slab?.INV_UOM || 'LT'} — {calcAchieved(slab?.PERIOD_SALE, slab?.LTR)}%)</span></th>
                    </tr>
                    <tr>
                      {['FROM', 'TO', 'RATE'].map(h => <th key={h} style={{ ...thStyle, borderTop: '1px solid #EDF2F7' }}>{h}</th>)}
                      <th style={{ ...thStyle, borderTop: '1px solid #EDF2F7', borderLeft: '1px solid #EDF2F7' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {slab.DISCOUNT_DETAIL.split(',').map((row: string, ri: number) => {
                      const cols = row.split('#');
                      return (
                        <tr key={ri} style={{ borderTop: '1px solid #E2E8F0' }}>
                          {[cols[0], cols[1], cols[2]].map((v, ci) => <td key={ci} style={tdStyle}>{v || '-'}</td>)}
                          <td style={{ ...tdStyle, borderLeft: '1px solid #EDF2F7' }}>{fmtNum(cols[3])}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {applicableItems.length > 0 && !isQD && (
                <div style={{ marginTop: 5 }}>
                  <div style={{ display: 'inline-block', backgroundColor: '#FEFCBF', padding: '6px 12px', borderRadius: 8, marginBottom: 15 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#78350F', letterSpacing: 0.5 }}>APPLICABLE ITEMS ({applicableItems.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                    {applicableItems.map((name: string, ii: number) => (
                      <div key={ii} style={{ width: '33.33%', padding: '10px 8px', backgroundColor: '#E2E8F0', border: '1px solid #E2E8F0', textAlign: 'center', boxSizing: 'border-box' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DiscountDetailScreen;
