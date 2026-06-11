import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { getCustomerBalance, getInvoicedVehicleList, getVehicleTracking, getNewTransactionDetailsPdf } from '../api';
import {
  MdLocalShipping, MdSwapHoriz, MdShoppingBasket, MdLocalOffer,
  MdCurrencyRupee, MdBarChart, MdAccountBalance, MdReceiptLong,
  MdSupportAgent, MdNotInterested, MdAccountBalanceWallet, MdArrowForward,
  MdTrendingUp,
} from 'react-icons/md';
import { formatIndianNumber } from '../utils/formatIndianNumber';

const MODULES = [
  { id: 'order-entry',   Icon: MdShoppingBasket, label: 'Order Entry',       sub: 'Create new orders',    color: '#3861FB', bg: '#EEF2FF' },
  { id: 'discount',      Icon: MdLocalOffer,     label: 'Discounts',          sub: 'Active schemes',       color: '#9333EA', bg: '#F3E8FF' },
  { id: 'price-details', Icon: MdCurrencyRupee,  label: 'Price Details',      sub: 'View live rates',      color: '#0EA5E9', bg: '#E0F2FE' },
  { id: 'report',        Icon: MdBarChart,       label: 'Reports',            sub: 'Order & analysis',     color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'bank-details',  Icon: MdAccountBalance, label: 'Bank Details',       sub: 'Virtual accounts',     color: '#10B981', bg: '#D1FAE5' },
  { id: 'transaction',   Icon: MdReceiptLong,    label: 'Transactions',       sub: 'View statements',      color: '#EF4444', bg: '#FEE2E2' },
  { id: 'contact-us',    Icon: MdSupportAgent,   label: 'Contact Us',         sub: 'Support & help',       color: '#6366F1', bg: '#EEF2FF' },
];

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
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleTracking, setVehicleTracking] = useState<Record<string, any>>({});
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [txnLoading, setTxnLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  const fetchVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    try {
      const vehicleList = await getInvoicedVehicleList(session?.custId, session?.branchId);
      const list = Array.isArray(vehicleList) ? vehicleList : [];
      setVehicles(list);
      if (list.length > 0) {
        const trackingEntries = await Promise.all(
          list.map(async (v: any, idx: number) => {
            const key = `${v.tripId}-${v.tripRefNo}` || `vehicle-${idx}`;
            if (!v.tripId || !v.tripRefNo) return [key, null] as const;
            const data = await getVehicleTracking(v.branchId || session?.branchId || '51', v.tripId, v.tripRefNo);
            return [key, data] as const;
          }),
        );
        setVehicleTracking(Object.fromEntries(trackingEntries));
      } else {
        setVehicleTracking({});
      }
    } catch (e) { console.error('Dashboard fetchVehicles error:', e); }
    finally { setVehiclesLoading(false); }
  }, [session]);

  const fetchData = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const bal = await getCustomerBalance(session?.custId);
      setBalanceData({ balance: bal.balance || '0.0', pendingOrder: bal.pendingOrder || '0.0', netBalance: bal.netBalance || '0.0' });
    } catch (e) { console.error('Dashboard fetchData error:', e); }
    finally { setBalanceLoading(false); }
  }, [session]);

  useEffect(() => {
    const t = setTimeout(() => { fetchData(); fetchVehicles(); }, 300);
    return () => clearTimeout(t);
  }, [fetchData, fetchVehicles]);

  const handleTransactionDetails = async () => {
    setTxnLoading(true);
    try {
      const response = await getNewTransactionDetailsPdf(session?.custId);
      if (response?.success && response?.url) {
        navigate('/pdf-viewer', { state: { url: response.url, title: 'Transaction Details' } });
      } else {
        alert(response?.message || 'Failed to fetch transaction details.');
      }
    } catch { alert('An error occurred while fetching the transaction details.'); }
    finally { setTxnLoading(false); }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: '#E2E8F0' }}>
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
            { label: 'Net Balance',      val: balanceData.netBalance,    color: '#10B981', bg: 'linear-gradient(135deg, #10B981, #059669)', icon: MdTrendingUp, textColor: '#fff' },
          ].map(({ label, val, bg, icon: Icon, textColor }, i) => (
            <div key={i} style={{ background: bg, borderRadius: 20, padding: '22px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.5 }}>{label}</span>
                <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color="#fff" />
                </div>
              </div>
              <p style={{ fontSize: 26, fontWeight: 900, color: textColor, margin: 0, letterSpacing: -0.5 }}>
                ₹ {balanceLoading ? '—' : formatIndianNumber(val)}
              </p>
            </div>
          ))}
        </div>

        {/* Vehicle tracking slider */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>Available Vehicles</h2>
            {!vehiclesLoading && vehicles.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>{vehicles.length} active</span>
            )}
          </div>

          {vehiclesLoading ? (
            <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#EEF2FF', animation: 'pulse 1.5s infinite' }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 14, width: '45%', backgroundColor: '#E2E8F0', borderRadius: 6, marginBottom: 8 }} />
                <div style={{ height: 12, width: '70%', backgroundColor: '#E2E8F0', borderRadius: 6 }} />
              </div>
            </div>
          ) : vehicles.length === 0 ? (
            <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
              <MdLocalShipping size={36} color="#CBD5E0" />
              <p style={{ fontSize: 14, fontWeight: 700, color: '#64748B', margin: '10px 0 4px' }}>No active vehicle dispatch</p>
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Live tracking will appear here when a vehicle is dispatched.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vehicles.map((v, idx) => {
                const trackKey = `${v.tripId}-${v.tripRefNo}` || `vehicle-${idx}`;
                const tracking = vehicleTracking[trackKey];
                const status = tracking?.status || 'In Transit';
                const stops = tracking?.stops?.length || 0;
                const displayVehicleNo = tracking?.vehicleNo || v.vehicleNo;
                return (
                  <div
                    key={trackKey}
                    onClick={() => navigate('/vehicle-tracking', { state: { vehicleNo: v.vehicleNo, tripRefNo: v.tripRefNo, tripId: v.tripId, branchId: v.branchId } })}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 16,
                      padding: '16px 20px',
                      cursor: 'pointer',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3861FB, #2752E7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <MdLocalShipping size={22} color="#fff" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', margin: '0 0 4px' }}>{displayVehicleNo}</p>
                          <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, margin: '0 0 6px' }}>
                            Ref: <span style={{ color: '#0F172A', fontWeight: 800 }}>{v.tripRefNo}</span>
                            &nbsp;·&nbsp; Trip: <span style={{ color: '#0F172A', fontWeight: 800 }}>{v.tripId}</span>
                          </p>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#3861FB', backgroundColor: '#EEF2FF', padding: '4px 10px', borderRadius: 8 }}>
                              {status}
                            </span>
                            {stops > 0 && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', backgroundColor: '#ECFDF5', padding: '4px 10px', borderRadius: 8 }}>
                                {stops} stops
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#EEF2FF', padding: '8px 14px', borderRadius: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#3861FB' }}>Track</span>
                        <MdArrowForward size={16} color="#3861FB" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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

      {txnLoading && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(226,232,240,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
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
