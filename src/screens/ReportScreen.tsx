import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack, MdAccountBalanceWallet, MdReceipt, MdShoppingBasket, MdPayment, MdChevronRight, MdInfoOutline } from 'react-icons/md';

const REPORTS = [
  { id: 'mini-statement', Icon: MdAccountBalanceWallet, title: 'Account Copy',       desc: 'Full account statement as PDF',         format: 'PDF',          color: '#3861FB' },
  { id: 'invoice-detail', Icon: MdReceipt,             title: 'Invoice Details',     desc: 'List of invoices — view or download',   format: 'List / PDF',   color: '#00D2D3' },
  { id: 'order-entry-report', Icon: MdShoppingBasket, title: 'Order Report',         desc: 'History of all placed orders',          format: 'List',         color: '#FD79A8' },
  { id: 'credit-debit-note',  Icon: MdPayment,         title: 'Credit / Debit Note', desc: 'CN/DN issued to your account',          format: 'List / PDF',   color: '#FDCB6E' },
];

const ReportScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#F1F5F9', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '22px 36px 18px', backgroundColor: '#fff', borderBottom: '1px solid #F1F5F9' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#F1F5F9', border: 'none', cursor: 'pointer', marginRight: 20, flexShrink: 0 }}>
          <MdArrowBack size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Back</span>
        </button>
        <div>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>Available Reports</p>
          <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, margin: '2px 0 0' }}>View and download statements</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 36px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F0F4FF', borderRadius: 20, padding: 18, marginBottom: 25 }}>
          <MdInfoOutline size={20} color="#3861FB" style={{ marginRight: 12, flexShrink: 0 }} />
          <p style={{ flex: 1, fontSize: 12, lineHeight: 1.5, color: '#3861FB', fontWeight: 800, margin: 0 }}>
            PDF reports are downloaded instantly. List reports offer interactive filtering within the app.
          </p>
        </div>

        {REPORTS.map(r => (
          <button key={r.id} onClick={() => navigate(`/${r.id}`)} style={{ display: 'flex', alignItems: 'center', width: '100%', backgroundColor: '#fff', borderRadius: 28, padding: 22, marginBottom: 15, border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', textAlign: 'left' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: r.color + '10', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 18, flexShrink: 0 }}>
              <r.Icon size={28} color={r.color} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 16, fontWeight: 900, color: '#1A1A1A', margin: '0 0 4px' }}>{r.title}</p>
              <p style={{ fontSize: 12, color: '#A0AEC0', fontWeight: 600, margin: '0 0 8px', lineHeight: 1.4 }}>{r.desc}</p>
              <div style={{ display: 'inline-block', backgroundColor: r.color + '08', border: `1px solid ${r.color}20`, borderRadius: 8, padding: '2px 6px' }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: r.color }}>{r.format}</span>
              </div>
            </div>
            <MdChevronRight size={24} color="#CBD5E0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReportScreen;
