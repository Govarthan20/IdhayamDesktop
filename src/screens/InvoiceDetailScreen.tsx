import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoiceList, downloadBillPdf } from '../api';
import { useSession } from '../context/SessionContext';
import { formatForApi, validateDateRange, getCurrentDateDDMMYYYY } from '../utils/dateHelpers';
import ReportDatePicker from '../components/ReportDatePicker';
import { MdArrowBack, MdSearch, MdClose, MdCloudDownload } from 'react-icons/md';

const InvoiceDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const [fromDate, setFromDate] = useState(getCurrentDateDDMMYYYY());
  const [toDate, setToDate] = useState(getCurrentDateDDMMYYYY());
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleSearch = async () => {
    const { fromError, toError } = validateDateRange(fromDate, toDate);
    if (fromError || toError) { alert(fromError || toError); return; }
    setLoading(true);
    try {
      const results = await getInvoiceList(formatForApi(fromDate), formatForApi(toDate), 'SI', session?.branchId, session?.custId);
      if (results?.length > 0) {
        setInvoices(results.map((r: any) => ({
          id: (r.ID > 0) ? String(r.ID) : (r.BILL_ID > 0 ? String(r.BILL_ID) : (r.BILL_NO || '-')),
          billNo: r.BILL_NO || '-',
          date: r.BILL_DATE_STR || (r.BILL_DATE ? r.BILL_DATE.split('T')[0] : '-'),
          amount: parseFloat(r.NET_AMT || r.NET_AMOUNT || '0'),
          branch: r.BRANCH_ID || '-',
        })));
        setSelectedIds([]);
      } else { setInvoices([]); alert('No invoices found for this range.'); }
    } catch { alert('Failed to search invoices.'); }
    finally { setLoading(false); }
  };

  const fetchPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await downloadBillPdf('SI', selectedIds.join(','), session?.branchId);
      if (res?.success && res?.url) { setPdfUrl(res.url); setViewerOpen(true); }
      else alert(res?.message || 'Could not fetch PDF.');
    } catch { alert('PDF download failed.'); }
    finally { setPdfLoading(false); }
  };

  const toggleId = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <div style={{ height: '100%', backgroundColor: '#E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '22px 36px 18px', backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#E2E8F0', border: 'none', cursor: 'pointer', marginRight: 20, flexShrink: 0 }}>
          <MdArrowBack size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Back</span>
        </button>
        <div>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>Invoice Details</p>
          <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, margin: '2px 0 0' }}>Manage your billings</p>
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

        {invoices.length > 0 && (
          <div style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(56,97,251,0.06)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '44px 2fr 2fr 1fr 2fr', backgroundColor: '#EEF2FF', padding: '12px 20px', gap: 8 }}>
              {['', 'INV NO', 'DATE', 'BRANCH', 'AMOUNT'].map((h, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 800, color: '#0F172A', letterSpacing: 0.5, textAlign: i === 4 ? 'right' : 'left' }}>{h}</span>
              ))}
            </div>
            {invoices.map((inv, idx) => {
              const sel = selectedIds.includes(inv.id);
              return (
                <div key={idx} onClick={() => toggleId(inv.id)} style={{ display: 'grid', gridTemplateColumns: '44px 2fr 2fr 1fr 2fr', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #EEF2F6', backgroundColor: sel ? '#EEF2FF' : 'transparent', cursor: 'pointer', gap: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${sel ? '#3861FB' : '#E2E8F0'}`, backgroundColor: sel ? '#3861FB' : 'transparent', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.billNo}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>{inv.date}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>{inv.branch}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#3861FB', textAlign: 'right' }}>₹{(inv.amount || 0).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div style={{ padding: '14px 36px 20px', backgroundColor: '#fff', borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
          <button onClick={fetchPdf} disabled={pdfLoading} style={{ width: '100%', height: 52, borderRadius: 14, background: 'linear-gradient(90deg, #3861FB, #2752E7)', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 800 }}>
            {pdfLoading ? 'Loading PDF...' : `Download PDF (${selectedIds.length} invoice${selectedIds.length > 1 ? 's' : ''})`}
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
            <p style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: 0 }}>Invoice Preview</p>
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

export default InvoiceDetailScreen;
