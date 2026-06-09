import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDiscountSummary } from '../api';
import { useSession } from '../context/SessionContext';
import { MdArrowBack, MdStars, MdLabelOff, MdChevronRight } from 'react-icons/md';

const DiscountScreen: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const [schemeData, setSchemeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDiscountSummary(session?.custId)
      .then(data => {
        const rows = Array.isArray(data) ? data : (data?.data ?? []);
        setSchemeData(rows.map((r: any) => ({
          type: String(r?.DMOBNO || ''),
          custType: String(r?.NAME || ''),
          items: String(r?.MOBNO || ''),
        })));
      })
      .catch(() => setSchemeData([]))
      .finally(() => setLoading(false));
  }, [session?.custId]);

  const getSchemeName = (type: string) =>
    type === 'SD' ? 'Scheme Discount' : type === 'TD' ? 'Target Discount' : type === 'QD' ? 'Quantity Discount' : type || 'Standard Scheme';

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#F1F5F9', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '22px 36px 18px', backgroundColor: '#fff', borderBottom: '1px solid #F1F5F9' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#F1F5F9', border: 'none', cursor: 'pointer', marginRight: 20, flexShrink: 0 }}>
          <MdArrowBack size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Back</span>
        </button>
        <div>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>Discount Details</p>
          <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, margin: '2px 0 0' }}>Active schemes &amp; offers</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 36px 40px' }}>
        {/* Notice */}
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F0F4FF', borderRadius: 16, padding: '14px 18px', marginBottom: 20, border: '1px solid #D0D9FF' }}>
          <MdStars size={20} color="#3861FB" style={{ marginRight: 12, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#4A5568', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>Tap on a scheme to view detailed slab information and eligibility.</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '4px solid #EDF2F7', borderTopColor: '#3861FB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : schemeData.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
            <MdLabelOff size={60} color="#CBD5E0" />
            <p style={{ fontSize: 16, fontWeight: 700, color: '#A0AEC0', marginTop: 15 }}>No active discounts found</p>
          </div>
        ) : (
          schemeData.map((s, i) => (
            <button key={i} onClick={() => navigate('/discount-detail', { state: { items: s.items, type: s.type, custType: s.custType, schemeName: getSchemeName(s.type) } })}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: '20px 22px', marginBottom: 12, border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'left' }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>{getSchemeName(s.type)}</p>
              <MdChevronRight size={24} color="#CBD5E0" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default DiscountScreen;
