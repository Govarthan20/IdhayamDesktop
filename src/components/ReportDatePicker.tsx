import React, { useState } from 'react';
import { MdEvent } from 'react-icons/md';

interface Props {
  label: string;
  value: string; // DD-MM-YYYY
  onSelect: (dateStr: string) => void;
}

const ReportDatePicker: React.FC<Props> = ({ label, value, onSelect }) => {
  const [show, setShow] = useState(false);

  const parseToInputValue = (str: string): string => {
    if (!str || str.length < 10) return '';
    const [d, m, y] = str.split('-');
    return `${y}-${m}-${d}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const [y, m, d] = val.split('-');
    onSelect(`${d}-${m}-${y}`);
    setShow(false);
  };

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <div style={{ fontSize: 8, fontWeight: 900, color: '#A0AEC0', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <button
        onClick={() => setShow(!show)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          backgroundColor: '#F8F9FD', borderRadius: 12, padding: '0 8px',
          height: 44, border: '1px solid #EDF2F7', cursor: 'pointer', width: '100%',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: value ? '#1A1A1A' : '#A0AEC0' }}>
          {value || 'DD-MM-YYYY'}
        </span>
        <MdEvent size={20} color="#3861FB" />
      </button>
      {show && (
        <div style={{ position: 'absolute', zIndex: 1000, top: '100%', left: 0, marginTop: 4, backgroundColor: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #EDF2F7' }}>
          <input
            type="date"
            value={parseToInputValue(value)}
            max={new Date().toISOString().split('T')[0]}
            onChange={handleChange}
            style={{ fontSize: 14, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #3861FB', outline: 'none', cursor: 'pointer' }}
          />
        </div>
      )}
    </div>
  );
};

export default ReportDatePicker;
