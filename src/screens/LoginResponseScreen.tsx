import React, { useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import {
  MdStorefront, MdPlace, MdPhone, MdReceipt,
  MdLocationCity, MdKeyboardArrowRight,
} from 'react-icons/md';
import logoImg from '../assets/logo.png';

const LoginResponseScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useSession();
  const data = (location.state as any)?.data ?? {};

  const branches: any[] = useMemo(() => {
    if (data?.result) {
      if (Array.isArray(data.result)) return data.result;
      if (typeof data.result === 'string') {
        try { const p = JSON.parse(data.result); return Array.isArray(p) ? p : []; } catch { return []; }
      }
    }
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const handleSelectBranch = async (branch: any) => {
    await setSession({
      custId:        String(branch.CUST_ID        ?? branch.custId   ?? ''),
      branchId:      String(branch.BRANCH_ID      ?? branch.branchId ?? ''),
      userId:        String(data.eid              ?? '2937'),
      custName:      String(branch.CUST_NAME_DISPLAY ?? branch.custName ?? 'Distributor'),
      custType:      String(branch.CUST_TYPE      ?? 'CM'),
      partyMudId:    String(branch.PARTY_MUD_ID   ?? ''),
      hubName:       String(branch.HUB_NAME       ?? ''),
      territoryName: String(branch.TERRITORY_NAME ?? ''),
      gstNo:         String(branch.GST_NO         ?? ''),
      pan:           String(data.pan              ?? ''),
      mobile:        String(data.mobile           ?? ''),
      branchName:    String(branch.CUST_NAME_DISPLAY ?? branch.HUB_NAME ?? 'MAIN BRANCH'),
      accountCount:  branches.length,
      loginData:     data,
    });
    navigate('/dashboard', { replace: true });
  };

  useEffect(() => {
    if (branches.length === 1) {
      handleSelectBranch(branches[0]);
    }
  }, [branches]);

  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: '#EEF2F6', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '28px 48px 24px', backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <img src={logoImg} alt="Idhayam" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <div>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: 0 }}>Select Account</p>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0, fontWeight: 500 }}>
            {branches.length > 0
              ? `${branches.length} account${branches.length > 1 ? 's' : ''} linked to your PAN`
              : 'No accounts found'}
          </p>
        </div>
      </div>

      {/* Branch list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px 48px', maxWidth: 900, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {branches.length > 0 ? branches.map((branch: any, idx: number) => (
          <button key={idx} onClick={() => handleSelectBranch(branch)} style={{
            display: 'block', width: '100%', backgroundColor: '#fff', borderRadius: 20,
            padding: '20px 22px', marginBottom: 14, border: '2px solid #E2E8F0',
            cursor: 'pointer', textAlign: 'left',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#3861FB')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#E2E8F0')}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MdStorefront size={22} color="#3861FB" />
              </div>
              <div style={{ flex: 1, marginLeft: 14 }}>
                <p style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  {branch.CUST_NAME_DISPLAY || 'Standard Branch'}
                </p>
                {branch.TERRITORY_NAME && (
                  <p style={{ fontSize: 12, color: '#64748B', fontWeight: 600, margin: '2px 0 0' }}>{branch.TERRITORY_NAME}</p>
                )}
              </div>
              <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MdKeyboardArrowRight size={22} color="#94A3B8" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { Icon: MdPlace,        color: '#3861FB', bg: '#EEF2FF', label: 'LOCATION', val: branch.LOCATION_NAME || branch.HUB_NAME || 'Main HQ' },
                { Icon: MdPhone,        color: '#9333EA', bg: '#F3E8FF', label: 'MOBILE',   val: data.mobile || 'N/A' },
                { Icon: MdReceipt,      color: '#D97706', bg: '#FEF3C7', label: 'GST',      val: branch.GST_NO || branch.GSTNO || 'N/A' },
                ...(branch.ADDRESS || branch.ADDRS ? [{ Icon: MdLocationCity, color: '#16A34A', bg: '#F0FDF4', label: 'ADDRESS', val: (branch.ADDRESS || branch.ADDRS).substring(0, 30) + '...' }] : []),
              ].map(({ Icon, color, bg, label, val }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#EEF2F6', padding: '10px 12px', borderRadius: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} color={color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', letterSpacing: 0.5, margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#334155', margin: 0 }}>{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </button>
        )) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', paddingBottom: 80 }}>
            <MdStorefront size={56} color="#CBD5E0" />
            <p style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A', marginTop: 20 }}>No branches found</p>
            <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 8, maxWidth: 300 }}>
              Contact Idhayam support to link a branch to your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginResponseScreen;
