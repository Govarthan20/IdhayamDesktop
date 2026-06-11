import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdArrowBack, MdFileDownload } from 'react-icons/md';

const PdfViewerScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { url, title } = (location.state as any) || {};
  const [loading, setLoading] = useState(true);

  const pdfUrl = url ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}` : '';

  return (
    <div style={{ height: '100%', backgroundColor: '#E2E8F0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '18px 36px', backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#E2E8F0', border: 'none', cursor: 'pointer', marginRight: 20, flexShrink: 0 }}>
          <MdArrowBack size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Back</span>
        </button>
        <p style={{ flex: 1, fontSize: 18, fontWeight: 900, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title || 'Document Viewer'}
        </p>
        <button onClick={() => url && window.open(url, '_blank')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#EEF2FF', border: 'none', cursor: 'pointer' }}>
          <MdFileDownload size={16} color="#3861FB" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#3861FB' }}>Open</span>
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8EDF3', zIndex: 1 }}>
            <div style={{ width: 40, height: 40, border: '4px solid #EDF2F7', borderTopColor: '#3861FB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: '#718096' }}>Loading Document...</p>
          </div>
        )}
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            onLoad={() => setLoading(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PdfViewerScreen;
