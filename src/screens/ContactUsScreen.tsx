import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getContactInfo } from '../api';
import { useSession } from '../context/SessionContext';
import { MdArrowBack, MdPhone, MdErrorOutline } from 'react-icons/md';

const ROLES = ['Technical Support', 'Office Support', 'Field Support', 'Relationship Mgr', 'General Care'];

const buildRows = (c: any) => {
  const pairs = [
    { name: c.A, phone: c.B }, { name: c.C, phone: c.D }, { name: c.E, phone: c.F },
    { name: c.G, phone: c.H }, { name: c.I, phone: c.J },
  ];
  return pairs.filter(({ phone }) => !!phone).map(({ name, phone }, i) => ({
    role: ROLES[i] || 'Support',
    name: name || `Contact Person ${i + 1}`,
    phone: String(phone),
  }));
};

const ContactUsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchContactInfo = async () => {
    setLoading(true); setError('');
    try {
      const result = await getContactInfo(session?.custId, session?.branchId, session?.custType);
      if (Array.isArray(result) && result.length > 0) setContacts(result);
      else setError('No contact details available.');
    } catch { setError('Failed to load contact details.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchContactInfo(); }, []);

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#E2E8F0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '22px 36px 18px', backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#E2E8F0', border: 'none', cursor: 'pointer', marginRight: 20, flexShrink: 0 }}>
          <MdArrowBack size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Back</span>
        </button>
        <div>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>Contact Us</p>
          <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, margin: '2px 0 0' }}>Help is just a call away</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 36px 40px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '4px solid #EDF2F7', borderTopColor: '#3861FB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60 }}>
            <MdErrorOutline size={40} color="#E3001B" />
            <p style={{ fontSize: 14, color: '#4A5568', fontWeight: 600, marginTop: 12 }}>{error}</p>
            <button onClick={fetchContactInfo} style={{ marginTop: 16, backgroundColor: '#F0F4FF', border: 'none', borderRadius: 12, padding: '10px 24px', color: '#3861FB', fontWeight: 800, cursor: 'pointer' }}>Retry</button>
          </div>
        ) : contacts.map((c, ci) => {
          const rows = buildRows(c);
          const sectionName = c.DEPT_NAME ?? c.HUB_NAME ?? c.SECTION ?? 'Helpdesk';
          return (
            <div key={ci} style={{ marginBottom: 25 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
                <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
                <span style={{ fontSize: 12, fontWeight: 900, color: '#718096', padding: '0 16px', letterSpacing: 0.5 }}>{sectionName}</span>
                <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
              </div>
              {rows.map((row, ri) => (
                <div key={ri} style={{ backgroundColor: '#fff', borderRadius: 20, padding: '16px 20px', marginBottom: 10, boxShadow: '0 4px 15px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 15, flexShrink: 0 }}>
                    <MdPhone size={20} color="#3861FB" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', letterSpacing: 0.5, margin: '0 0 4px' }}>{row.role.toUpperCase()}</p>
                    <p style={{ fontSize: 14, fontWeight: 900, color: '#1A1A1A', margin: '0 0 3px' }}>{row.name}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#3861FB', margin: 0 }}>{row.phone}</p>
                  </div>
                  <a href={`tel:${row.phone.replace(/\s/g, '')}`} style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #3861FB, #2752E7)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0 }}>
                    <MdPhone size={20} color="#fff" />
                  </a>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContactUsScreen;
