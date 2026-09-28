const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function monthLabel(value, style = 'long') {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value || '');
  if (!match) return '—';

  const monthIndex = Number(match[2]) - 1;
  const month = style === 'short' ? MONTHS_SHORT[monthIndex] : MONTHS_LONG[monthIndex];
  return `${month} ${match[1]}`;
}
