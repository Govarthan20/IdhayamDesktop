/** Indian-style grouping (e.g. 12,34,567.89). Handles negative values as -12,34,567.89 */
export function formatIndianNumber(value: string | number, decimals = 2): string {
  const num = parseFloat(String(value));
  if (isNaN(num)) return '0.00';

  const negative = num < 0;
  const abs = Math.abs(num);
  const [intPart, decPart] = abs.toFixed(decimals).split('.');
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const grouped = rest
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3
    : last3;

  const formatted = decimals > 0 ? `${grouped}.${decPart}` : grouped;
  return negative ? `-${formatted}` : formatted;
}
