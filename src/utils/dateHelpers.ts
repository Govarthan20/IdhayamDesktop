export const isValidDate = (dateStr: string): boolean => {
  const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = dateStr.match(regex);
  if (!match) return false;
  const day = parseInt(match[1], 10), month = parseInt(match[2], 10), year = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000 || year > 2100) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
};

export const parseDDMMYYYY = (dateStr: string): Date | null => {
  const [d, m, y] = dateStr.split('-');
  if (!d || !m || !y) return null;
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
};

export const getCurrentDateDDMMYYYY = (): string => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
};

export const getMonthRangeDDMMYYYY = (month: number, year: number): { from: string; to: string } => {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const mm = String(month + 1).padStart(2, '0');
  return {
    from: `01-${mm}-${year}`,
    to: `${String(lastDay).padStart(2, '0')}-${mm}-${year}`,
  };
};

export const autoFormatDate = (text: string, prev: string): string => {
  if (text.length < prev.length) return text;
  const digits = text.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0,2)}-${digits.slice(2)}`;
  return `${digits.slice(0,2)}-${digits.slice(2,4)}-${digits.slice(4,8)}`;
};

export const formatForApi = (dateStr: string): string => {
  const [d, m, y] = dateStr.split('-');
  if (d && m && y) return `${m}/${d}/${y}`;
  return dateStr;
};

export const validateDateRange = (fromDate: string, toDate: string): { fromError: string; toError: string } => {
  let fromError = '', toError = '';
  if (!fromDate || fromDate.length < 10 || !isValidDate(fromDate)) fromError = 'Enter a valid date (DD-MM-YYYY)';
  if (!toDate || toDate.length < 10 || !isValidDate(toDate)) toError = 'Enter a valid date (DD-MM-YYYY)';
  if (!fromError && !toError) {
    const from = parseDDMMYYYY(fromDate), to = parseDDMMYYYY(toDate);
    const today = new Date(); today.setHours(23, 59, 59, 999);
    if (from && to) {
      if (from > to) fromError = 'From date must be before To date';
      else if (to > today) toError = 'To date cannot be in the future';
    }
  }
  return { fromError, toError };
};
