import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import logoImg from '../assets/logo.png';
import {
  MdDashboard, MdShoppingBasket, MdLocalOffer, MdCurrencyRupee,
  MdBarChart, MdAccountBalance, MdSupportAgent, MdLogout, MdPerson,
} from 'react-icons/md';

const MENU_ITEMS = [
  { path: '/dashboard',     Icon: MdDashboard,       label: 'Dashboard'     },
  { path: '/order-entry',   Icon: MdShoppingBasket,  label: 'Order Entry'   },
  { path: '/discount',      Icon: MdLocalOffer,      label: 'Discounts'     },
  { path: '/price-details', Icon: MdCurrencyRupee,   label: 'Price Details' },
  { path: '/report',        Icon: MdBarChart,        label: 'Reports'       },
  { path: '/bank-details',  Icon: MdAccountBalance,  label: 'Bank Details'  },
  { path: '/contact-us',    Icon: MdSupportAgent,    label: 'Contact Us'    },
];

const REPORT_PATHS = ['/invoice-detail', '/mini-statement', '/order-entry-report', '/credit-debit-note'];

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, clearSession } = useSession();

  const handleLogout = async () => {
    await clearSession();
    navigate('/login', { replace: true });
  };

  const isActive = (path: string) => {
    if (path === '/report' && REPORT_PATHS.includes(location.pathname)) return true;
    if (path === '/discount' && location.pathname === '/discount-detail') return true;
    return location.pathname === path;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#E2E8F0' }}>
      {/* Sidebar */}
      <div style={{
        width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(175deg, #0d1b6e 0%, #1e40af 55%, #3861FB 100%)',
        boxShadow: '4px 0 24px rgba(13,27,110,0.35)',
        zIndex: 10,
      }}>
        {/* Brand */}
        <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src={logoImg} alt="Idhayam" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: 2 }}>IDHAYAM</p>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', margin: 0, fontWeight: 700, letterSpacing: 1 }}>DISTRIBUTOR PORTAL</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, padding: '0 8px', marginBottom: 8 }}>MAIN MENU</p>
          {MENU_ITEMS.map(({ path, Icon, label }) => {
            const active = isActive(path);
            return (
              <button key={path} onClick={() => navigate(path)} style={{
                display: 'flex', alignItems: 'center', gap: 11,
                width: '100%', padding: '11px 14px', borderRadius: 12,
                marginBottom: 2, border: 'none', cursor: 'pointer', textAlign: 'left',
                backgroundColor: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                position: 'relative',
              }}>
                {active && (
                  <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, backgroundColor: '#93c5fd', borderRadius: '0 2px 2px 0' }} />
                )}
                <Icon size={18} color={active ? '#fff' : 'rgba(255,255,255,0.55)'} />
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '12px 14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MdPerson size={18} color="#fff" />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session?.custName || 'User'}
              </p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session?.branchName || session?.hubName || 'Main Branch'}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '9px 13px', borderRadius: 10, cursor: 'pointer',
            backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.22)',
          }}>
            <MdLogout size={15} color="#fca5a5" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5' }}>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
