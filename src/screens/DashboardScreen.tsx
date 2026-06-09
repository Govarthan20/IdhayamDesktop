import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { getCustomerBalance, getInvoicedVehicleList, getNewTransactionDetailsPdf } from '../api';
import {
  MdLocalShipping, MdSwapHoriz, MdShoppingBasket, MdLocalOffer,
  MdCurrencyRupee, MdBarChart, MdAccountBalance, MdReceiptLong,
  MdSupportAgent, MdNotInterested, MdAccountBalanceWallet, MdArrowForward,
  MdTrendingDown, MdTrendingUp,
} from 'react-icons/md';

const MODULES = [
  { id: 'order-entry',   Icon: MdShoppingBasket, label: 'Order Entry',       sub: 'Create new orders',    color: '#3861FB', bg: '#EEF2FF' },
  { id: 'discount',      Icon: MdLocalOffer,     label: 'Discounts',          sub: 'Active schemes',       color: '#9333EA', bg: '#F3E8FF' },
  { id: 'price-details', Icon: MdCurrencyRupee,  label: 'Price Details',      sub: 'View live rates',      color: '#0EA5E9', bg: '#E0F2FE' },
  { id: 'report',        Icon: MdBarChart,       label: 'Reports',            sub: 'Order & analysis',     color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'bank-details',  Icon: MdAccountBalance, label: 'Bank Details',       sub: 'Virtual accounts',     color: '#10B981', bg: '#D1FAE5' },
  { id: 'transaction',   Icon: MdReceiptLong,    label: 'Transactions',       sub: 'View statements',      color: '#EF4444', bg: '#FEE2E2' },
  { id: 'contact-us',    Icon: MdSupportAgent,   label: 'Contact Us',         sub: 'Support & help',       color: '#6366F1', bg: '#EEF2FF' },
];

const formatCurrency = (val: string | number) => {
  const num = parseFloat(String(val)) || 0;
  const parts = num.toFixed(2).split('.');
  let int = parts[0];
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  if (rest) int = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  return `${int}.${parts[1]}`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const [balanceData, setBalanceData] = useState({ balance: '0.0', pendingOrder: '0.0', netBalance: '0.0' });
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [bal, vehicles] = await Promise.all([
        getCustomerBalance(session?.custId),
        getInvoicedVehicleList(session?.custId, session?.branchId),
      ]);
      setBalanceData({ balance: bal.balance || '0.0', pendingOrder: bal.pendingOrder || '0.0', netBalance: bal.netBalance || '0.0' });
      if (vehicles) setVehicleData(vehicles);
    } catch (e) { console.error('Dashboard fetchData error:', e); }
    finally { setLoading(false); }
  }, [session]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const handleTransactionDetails = async () => {
    setLoading(true);
    try {
      const response = await getNewTransactionDetailsPdf(session?.custId);
      if (response?.success && response?.url) {
        navigate('/pdf-viewer', { state: { url: response.url, title: 'Transaction Details' } });
      } else {
        alert(response?.message || 'Failed to fetch transaction details.');
      }
    } catch { alert('An error occurred while fetching the transaction details.'); }
    finally { setLoading(false); }
  };

  const netVal = parseFloat(balanceData.netBalance);
  const netIsNeg = netVal < 0;

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: '#F1F5F9' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 36px 48px' }}>
        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#64748B', margin: '0 0 4px' }}>{getGreeting()},</p>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: 0 }}>{session?.custName || 'Distributor'}</h1>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 0', fontWeight: 600 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          {(session?.accountCount ?? 0) > 1 && (
            <button onClick={() => navigate('/login-response', { state: { data: session?.loginData } })}
              style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#fff', padding: '10px 16px', borderRadius: 12, border: '1px solid #E2E8F0', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <MdSwapHoriz size={18} color="#3861FB" />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#3861FB' }}>Switch Account</span>
            </button>
          )}
        </div>

        {/* Balance stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Account Balance',  val: balanceData.balance,      color: '#3861FB', bg: 'linear-gradient(135deg, #3861FB, #2752E7)', icon: MdAccountBalanceWallet, textColor: '#fff' },
            { label: 'Pending Orders',   val: balanceData.pendingOrder,  color: '#F59E0B', bg: 'linear-gradient(135deg, #F59E0B, #D97706)', icon: MdShoppingBasket,      textColor: '#fff' },
            { label: 'Net Balance',      val: balanceData.netBalance,    color: netIsNeg ? '#EF4444' : '#10B981', bg: netIsNeg ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #10B981, #059669)', icon: netIsNeg ? MdTrendingDown : MdTrendingUp, textColor: '#fff' },
          ].map(({ label, val, bg, icon: Icon, textColor }, i) => (
            <div key={i} style={{ background: bg, borderRadius: 20, padding: '22px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5 }}>{label}</span>
                <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color="#fff" />
                </div>
              </div>
              <p style={{ fontSize: 26, fontWeight: 900, color: textColor, margin: 0, letterSpacing: -0.5 }}>
                ₹ {loading ? '—' : formatCurrency(val)}
              </p>
            </div>
          ))}
        </div>

        {/* Vehicle tracking */}
        {vehicleData && (
          <div onClick={() => navigate('/vehicle-tracking', { state: { vehicleNo: vehicleData.vehicleNo, tripRefNo: vehicleData.tripRefNo, tripId: vehicleData.tripId } })}
            style={{ backgroundColor: '#fff', borderRadius: 20, padding: '20px 24px', marginBottom: 28, cursor: 'pointer', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, #3861FB, #2752E7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MdLocalShipping size={24} color="#fff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <p style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0 }}>Live Vehicle Dispatch</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: '#FEF2F2', padding: '2px 8px', borderRadius: 20 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#EF4444', animation: 'pulse 1.5s infinite' }} />
                    <span style={{ fontSize: 9, fontWeight: 900, color: '#EF4444' }}>LIVE</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, margin: 0 }}>
                  Vehicle: <span style={{ color: '#0F172A', fontWeight: 800 }}>{vehicleData.vehicleNo}</span>
                  {vehicleData.tripRefNo && <> &nbsp;·&nbsp; Ref: <span style={{ color: '#0F172A', fontWeight: 800 }}>{vehicleData.tripRefNo}</span></>}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#EEF2FF', padding: '8px 14px', borderRadius: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#3861FB' }}>Track Now</span>
              <MdArrowForward size={16} color="#3861FB" />
            </div>
          </div>
        )}

        {/* Module grid */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Quick Access</h2>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>7 modules</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {MODULES.map(m => (
              <button key={m.id}
                onClick={() => m.id === 'transaction' ? handleTransactionDetails() : navigate(`/${m.id}`)}
                style={{ backgroundColor: '#fff', borderRadius: 18, border: '1px solid #E2E8F0', cursor: 'pointer', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(56,97,251,0.12)'; e.currentTarget.style.borderColor = m.color; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <m.Icon size={22} color={m.color} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>{m.label}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', margin: 0 }}>{m.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(241,245,249,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '28px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#3861FB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ marginTop: 14, fontSize: 14, fontWeight: 700, color: '#3861FB' }}>Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardScreen;
