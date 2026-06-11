import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCreditDebitNotes, downloadBillPdf } from '../api';
import { useSession } from '../context/SessionContext';
import { formatForApi, validateDateRange, getCurrentDateDDMMYYYY } from '../utils/dateHelpers';
import ReportDatePicker from '../components/ReportDatePicker';
import { MdArrowBack, MdSearch, MdClose, MdCloudDownload } from 'react-icons/md';

const CreditDebitNoteScreen: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const [fromDate, setFromDate] = useState(getCurrentDateDDMMYYYY());
  const [toDate, setToDate] = useState(getCurrentDateDDMMYYYY());
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleSearch = async () => {
    const { fromError, toError } = validateDateRange(fromDate, toDate);
    if (fromError || toError) { alert(fromError || toError); return; }
    setLoading(true);
    try {
      const results = await getCreditDebitNotes(formatForApi(fromDate), formatForApi(toDate), session?.branchId, session?.custId);
      setNotes(results || []);
      setSelectedIds([]);
      if (!results?.length) alert('No credit/debit notes found.');
    } catch { alert('Failed to fetch notes.'); }
    finally { setLoading(false); }
  };

  const fetchPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await downloadBillPdf('CNDN', selectedIds.join(','), session?.branchId);
      if (res?.success && res?.url) { setPdfUrl(res.url); setViewerOpen(true); }
      else alert(res?.message || 'Could not fetch PDF.');
    } catch { alert('PDF download failed.'); }
    finally { setPdfLoading(false); }
  };

  const isCN = (type: string) => { const t = String(type).toUpperCase(); return t === 'CN' || (t.startsWith('CN') && !t.startsWith('CND')); };
  const totalCredit = notes.filter(n => isCN(n.type)).reduce((s, n) => s + (parseFloat(n.amount) || 0), 0);
  const totalDebit  = notes.filter(n => !isCN(n.type)).reduce((s, n) => s + (parseFloat(n.amount) || 0), 0);

  return (
    <div style={{ height: '100%', backgroundColor: '#E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '22px 36px 18px', backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#E2E8F0', border: 'none', cursor: 'pointer', marginRight: 20, flexShrink: 0 }}>
          <MdArrowBack size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Back</span>
        </button>
        <div>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>CN / DN Report</p>
          <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, margin: '2px 0 0' }}>Credit &amp; Debit note list</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 36px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <ReportDatePicker label="FROM" value={fromDate} onSelect={setFromDate} iconRight />
            <ReportDatePicker label="TO" value={toDate} onSelect={setToDate} iconRight />
            <button onClick={handleSearch} disabled={loading} style={{ height: 44, padding: '0 20px', borderRadius: 12, backgroundColor: '#3861FB', display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              {loading ? <div style={{ width: 16, height: 16, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <MdSearch size={16} color="#fff" />}
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Search</span>
            </button>
          </div>
        </div>

        {notes.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div style={{ backgroundColor: '#F0FDF4', borderRadius: 14, padding: '16px 20px', border: '1px solid #BBF7D0' }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', margin: 0, letterSpacing: 0.5 }}>TOTAL CREDIT (CN)</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#15803D', margin: '8px 0 0' }}>₹{totalCredit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
              <div style={{ backgroundColor: '#FFF7ED', borderRadius: 14, padding: '16px 20px', border: '1px solid #FED7AA' }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: '#D97706', margin: 0, letterSpacing: 0.5 }}>TOTAL DEBIT (DN)</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#C2410C', margin: '8px 0 0' }}>₹{totalDebit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(56,97,251,0.06)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '44px 2fr 2fr 1.2fr 2fr', backgroundColor: '#EEF2FF', padding: '12px 20px', gap: 8 }}>
                {['', 'NOTE NO', 'DATE', 'TYPE', 'AMOUNT'].map((h, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 800, color: '#3861FB', textAlign: i === 4 ? 'right' : 'left' }}>{h}</span>
                ))}
              </div>
              {notes.map((note, idx) => {
                const cn = isCN(note.type);
                const color = cn ? '#16A34A' : '#D97706';
                const sel = selectedIds.includes(note.billId);
                return (
                  <div key={idx} onClick={() => setSelectedIds(prev => prev.includes(note.billId) ? prev.filter(i => i !== note.billId) : [...prev, note.billId])}
                    style={{ display: 'grid', gridTemplateColumns: '44px 2fr 2fr 1.2fr 2fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #EEF2F6', backgroundColor: sel ? '#EEF2FF' : 'transparent', cursor: 'pointer', gap: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${sel ? '#3861FB' : '#E2E8F0'}`, backgroundColor: sel ? '#3861FB' : 'transparent', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.billNo || note.billId}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>{note.date}</span>
                    <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: color + '15', borderRadius: 6, padding: '3px 8px' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color }}>{note.type}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 900, color, textAlign: 'right' }}>₹{parseFloat(note.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div style={{ padding: '14px 36px 20px', backgroundColor: '#fff', borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
          <button onClick={fetchPdf} disabled={pdfLoading} style={{ width: '100%', height: 52, borderRadius: 14, background: 'linear-gradient(90deg, #3861FB, #2752E7)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 800 }}>
            {pdfLoading ? 'Loading PDF...' : `Download PDF (${selectedIds.length} note${selectedIds.length > 1 ? 's' : ''})`}
          </button>
        </div>
      )}

      {viewerOpen && pdfUrl && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#fff', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #E2E8F0' }}>
            <button onClick={() => setViewerOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#E2E8F0', border: 'none', cursor: 'pointer' }}>
              <MdClose size={16} color="#64748B" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Close</span>
            </button>
            <p style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: 0 }}>CN/DN Preview</p>
            <button onClick={() => window.open(pdfUrl, '_blank')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#EEF2FF', border: 'none', cursor: 'pointer' }}>
              <MdCloudDownload size={16} color="#3861FB" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#3861FB' }}>Open</span>
            </button>
          </div>
          <iframe src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`} style={{ flex: 1, border: 'none', width: '100%' }} />
        </div>
      )}
    </div>
  );
};

export default CreditDebitNoteScreen;
