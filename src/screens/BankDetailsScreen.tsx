import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBankDetails } from '../api';
import { useSession } from '../context/SessionContext';
import { MdArrowBack, MdVerified, MdContentCopy, MdErrorOutline, MdAccountBalance } from 'react-icons/md';

const CopyField = ({ label, value }: { label: string; value: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value || '').then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '14px 16px', backgroundColor: copied ? '#F0F4FF' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #F7FAFC' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', letterSpacing: 0.5, margin: '0 0 4px' }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{value || '—'}</p>
      </div>
      <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MdContentCopy size={16} color={copied ? '#10B981' : '#3861FB'} />
      </div>
    </button>
  );
};

const BankDetailsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBankDetails = async () => {
    setLoading(true); setError('');
    try {
      const result = await getBankDetails(session?.custId);
      if (Array.isArray(result) && result.length > 0) setBanks(result);
      else setError('No bank details found for this account.');
    } catch { setError('Failed to load bank details.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBankDetails(); }, []);

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#E2E8F0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '22px 36px 18px', backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#E2E8F0', border: 'none', cursor: 'pointer', marginRight: 20, flexShrink: 0 }}>
          <MdArrowBack size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Back</span>
        </button>
        <div>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>Bank Details</p>
          <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, margin: '2px 0 0' }}>Virtual account &amp; payment info</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 36px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F0F4FF', borderRadius: 20, padding: 18, marginBottom: 20, border: '1px solid #D0D9FF' }}>
          <MdVerified size={20} color="#3861FB" style={{ marginRight: 12, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#3861FB', fontWeight: 800, margin: 0, lineHeight: 1.5 }}>Always verify bank details before making any payment. Tap any field to copy.</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '4px solid #EDF2F7', borderTopColor: '#3861FB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 60 }}>
            <MdErrorOutline size={40} color="#E3001B" />
            <p style={{ fontSize: 14, color: '#4A5568', fontWeight: 600, marginTop: 12 }}>{error}</p>
            <button onClick={fetchBankDetails} style={{ marginTop: 16, backgroundColor: '#F0F4FF', border: 'none', borderRadius: 12, padding: '10px 24px', color: '#3861FB', fontWeight: 800, cursor: 'pointer' }}>Retry</button>
          </div>
        ) : banks.map((bank, i) => {
          const bankName = bank.BANK_NAME ?? '—';
          const accName = bank.ACC_NAME ?? bank.PARTY_NAME ?? '—';
          const virtualAccNo = bank.VIRTUAL_ACCOUNT ?? bank.VIRTUAL_ACCOUNT_NO ?? bank.VIRTUAL_ACCOUNT_NUMBER ?? '—';
          const ifsc = bank.IFSC_CODE ?? '—';
          return (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: 28, marginBottom: 20, boxShadow: '0 4px 20px rgba(56,97,251,0.06)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                    <MdAccountBalance size={22} color="#3861FB" />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 900, color: '#1A1A1A', margin: 0 }}>{bankName}</p>
                </div>
                <div style={{ backgroundColor: '#ECFDF5', padding: '4px 10px', borderRadius: 10 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: '#10B981' }}>ACTIVE</span>
                </div>
              </div>
              <div style={{ height: 1, backgroundColor: '#E2E8F0' }} />
              <CopyField label="Account Name" value={accName} />
              <CopyField label="Virtual Account No" value={virtualAccNo} />
              <CopyField label="IFSC Code" value={ifsc} />
            </div>
          );
        })}

        <div style={{ backgroundColor: '#fff', borderRadius: 24, padding: 20, boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 14, fontWeight: 900, color: '#1A1A1A', margin: '0 0 14px' }}>Usage Instructions</p>
          {['Direct transfers to virtual accounts reflect instantly.'].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3861FB', marginTop: 6, marginRight: 10, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: '#718096', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>{t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BankDetailsScreen;
