import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransactionList } from '../api';
import { useSession } from '../context/SessionContext';
import { formatForApi, validateDateRange, getCurrentDateDDMMYYYY } from '../utils/dateHelpers';
import ReportDatePicker from '../components/ReportDatePicker';
import { MdArrowBack, MdPictureAsPdf, MdChevronRight, MdClose, MdFileDownload } from 'react-icons/md';

const MiniStatementScreen: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const [fromDate, setFromDate] = useState(getCurrentDateDDMMYYYY());
  const [toDate, setToDate] = useState(getCurrentDateDDMMYYYY());
  const [loading, setLoading] = useState(false);
  const [reportUrl, setReportUrl] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleGetReport = async () => {
    const { fromError, toError } = validateDateRange(fromDate, toDate);
    if (fromError || toError) { alert(fromError || toError); return; }
    setLoading(true);
    try {
      const results = await getTransactionList(formatForApi(fromDate), formatForApi(toDate), session?.custId);
      if (results?.success && results.url) { setReportUrl(results.url); setViewerOpen(true); }
      else alert(results?.message || 'No data found for this range.');
    } catch { alert('Failed to fetch the report.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100%', backgroundColor: '#F1F5F9', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '22px 36px 18px', backgroundColor: '#fff', borderBottom: '1px solid #F1F5F9' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#F1F5F9', border: 'none', cursor: 'pointer', marginRight: 20, flexShrink: 0 }}>
          <MdArrowBack size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Back</span>
        </button>
        <div>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>Account Copy</p>
          <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, margin: '2px 0 0' }}>Statement report</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 36px 40px' }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 25, padding: 20, marginBottom: 25, boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 16, fontWeight: 900, color: '#1A1A1A', margin: '0 0 20px' }}>Filter Statement</p>
          <div style={{ display: 'flex', gap: 20, marginBottom: 25 }}>
            <ReportDatePicker label="FROM DATE" value={fromDate} onSelect={setFromDate} />
            <ReportDatePicker label="TO DATE" value={toDate} onSelect={setToDate} />
          </div>
          <button onClick={handleGetReport} disabled={loading} style={{ width: '100%', background: 'linear-gradient(90deg, #3861FB, #2752E7)', border: 'none', borderRadius: 18, padding: '18px 0', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', letterSpacing: 0.5 }}>
            {loading ? 'Generating...' : 'GENERATE PDF REPORT'}
          </button>
          <p style={{ fontSize: 11, color: '#A0AEC0', textAlign: 'center', marginTop: 12, fontWeight: 600 }}>Note: Data available for the last 6 months only.</p>
        </div>

        {reportUrl && (
          <button onClick={() => setViewerOpen(true)} style={{ display: 'flex', alignItems: 'center', width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: '18px 20px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', textAlign: 'left' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
              <MdPictureAsPdf size={30} color="#3861FB" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 900, color: '#1A1A1A', margin: 0 }}>Report Ready</p>
              <p style={{ fontSize: 12, color: '#718096', fontWeight: 600, margin: '4px 0 0' }}>{fromDate} to {toDate}</p>
            </div>
            <MdChevronRight size={24} color="#3861FB" />
          </button>
        )}
      </div>

      {/* PDF Viewer Modal */}
      {viewerOpen && reportUrl && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#fff', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 15px', borderBottom: '1px solid #F1F5F9' }}>
            <button onClick={() => setViewerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><MdClose size={26} color="#1A1A1A" /></button>
            <p style={{ fontSize: 17, fontWeight: 900, color: '#1A1A1A', margin: 0 }}>Statement Viewer</p>
            <button onClick={() => window.open(reportUrl, '_blank')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><MdFileDownload size={26} color="#3861FB" /></button>
          </div>
          <iframe src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(reportUrl)}`} style={{ flex: 1, border: 'none', width: '100%' }} />
        </div>
      )}
    </div>
  );
};

export default MiniStatementScreen;
