import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MdChevronLeft, MdChevronRight, MdEvent } from 'react-icons/md';
import { parseDDMMYYYY } from '../utils/dateHelpers';

interface Props {
  label: string;
  value: string; // DD-MM-YYYY
  onSelect: (dateStr: string) => void;
  iconRight?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const toDDMMYYYY = (day: number, month: number, year: number): string =>
  `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;

const ReportDatePicker: React.FC<Props> = ({ label, value, onSelect, iconRight = false }) => {
  const [show, setShow] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();

  const parsed = useMemo(() => {
    const d = parseDDMMYYYY(value);
    return d && !isNaN(d.getTime()) ? d : today;
  }, [value, today]);

  const [viewMonth, setViewMonth] = useState(parsed.getMonth());
  const [viewYear, setViewYear] = useState(parsed.getFullYear());

  useEffect(() => {
    if (show) {
      setViewMonth(parsed.getMonth());
      setViewYear(parsed.getFullYear());
    }
  }, [show, parsed]);

  useEffect(() => {
    if (!show) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [show]);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear; y >= currentYear - 15; y--) list.push(y);
    return list;
  }, [currentYear]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewMonth, viewYear]);

  const isFuture = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(23, 59, 59, 999);
    return d > today;
  };

  const isSelected = (day: number) => {
    const [vd, vm, vy] = value.split('-').map(Number);
    return vd === day && vm === viewMonth + 1 && vy === viewYear;
  };

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const selectDay = (day: number) => {
    if (isFuture(day)) return;
    onSelect(toDDMMYYYY(day, viewMonth + 1, viewYear));
    setShow(false);
  };

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    if (next.getFullYear() > currentYear || (next.getFullYear() === currentYear && next.getMonth() > today.getMonth())) return;
    setViewMonth(next.getMonth());
    setViewYear(next.getFullYear());
  };

  return (
    <div ref={rootRef} style={{ flex: 1, position: 'relative' }}>
      <div style={{ fontSize: 8, fontWeight: 900, color: '#A0AEC0', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <button
        type="button"
        onClick={() => setShow(!show)}
        style={{
          display: 'flex', alignItems: 'center',
          justifyContent: iconRight ? 'space-between' : 'center',
          gap: iconRight ? 0 : 6,
          backgroundColor: '#E8EDF3', borderRadius: 12, padding: iconRight ? '0 12px' : '0 8px',
          height: 44, border: '1px solid #EDF2F7', cursor: 'pointer', width: '100%',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: value ? '#1A1A1A' : '#A0AEC0', textAlign: iconRight ? 'left' : 'center', flex: iconRight ? 1 : undefined }}>
          {value || 'DD-MM-YYYY'}
        </span>
        <MdEvent size={20} color="#3861FB" style={{ flexShrink: 0 }} />
      </button>

      {show && (
        <div style={{
          position: 'absolute', zIndex: 1000, top: '100%', left: 0, marginTop: 4,
          backgroundColor: '#fff', borderRadius: 14, padding: 14,
          boxShadow: '0 8px 30px rgba(0,0,0,0.14)', border: '1px solid #EDF2F7',
          width: 280,
        }}>
          {/* Month / Year selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <button type="button" onClick={() => shiftMonth(-1)} style={navBtnStyle}>
              <MdChevronLeft size={18} color="#3861FB" />
            </button>

            <select
              value={viewMonth}
              onChange={e => setViewMonth(parseInt(e.target.value, 10))}
              style={selectStyle}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i} disabled={viewYear === currentYear && i > today.getMonth()}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={viewYear}
              onChange={e => {
                const y = parseInt(e.target.value, 10);
                setViewYear(y);
                if (y === currentYear && viewMonth > today.getMonth()) setViewMonth(today.getMonth());
              }}
              style={{ ...selectStyle, width: 82 }}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button type="button" onClick={() => shiftMonth(1)} style={navBtnStyle}>
              <MdChevronRight size={18} color="#3861FB" />
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {WEEKDAYS.map(w => (
              <span key={w} style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textAlign: 'center', padding: '4px 0' }}>{w}</span>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {calendarDays.map((day, idx) => (
              <button
                key={idx}
                type="button"
                disabled={!day || isFuture(day)}
                onClick={() => day && selectDay(day)}
                style={{
                  height: 32,
                  border: 'none',
                  borderRadius: 8,
                  cursor: day && !isFuture(day) ? 'pointer' : 'default',
                  fontSize: 12,
                  fontWeight: day && isSelected(day) ? 900 : 700,
                  color: !day ? 'transparent' : isFuture(day) ? '#CBD5E0' : isSelected(day) ? '#fff' : isToday(day) ? '#3861FB' : '#1A1A1A',
                  backgroundColor: day && isSelected(day) ? '#3861FB' : day && isToday(day) ? '#EEF2FF' : 'transparent',
                }}
              >
                {day || ''}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const navBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, border: '1px solid #EDF2F7',
  backgroundColor: '#F8FAFC', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0,
};

const selectStyle: React.CSSProperties = {
  flex: 1, height: 32, borderRadius: 8, border: '1.5px solid #3861FB',
  fontSize: 12, fontWeight: 700, color: '#1A1A1A', backgroundColor: '#fff',
  cursor: 'pointer', outline: 'none', padding: '0 6px',
};

export default ReportDatePicker;
