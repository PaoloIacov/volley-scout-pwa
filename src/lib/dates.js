/** Utilità di formattazione delle date (ISO <-> formato italiano). */

/** Converte "gg/mm/aaaa" o "aaaa-mm-gg" in ISO "aaaa-mm-gg". */
export function toISO(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('-')) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  return dateStr;
}

/** Converte ISO "aaaa-mm-gg" nel formato italiano "gg/mm/aaaa". */
export function toItalianDate(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

/** Parsa una data ISO/italiana in un oggetto Date locale (mezzanotte locale). */
export function parseDate(dateStr) {
  if (!dateStr) return new Date(NaN);
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Data odierna in formato ISO (senza orario). */
export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

/** { day: '14', month: 'OTT' } da una data ISO. */
export function dayMonth(dateStr) {
  const date = parseDate(dateStr);
  if (Number.isNaN(date.getTime())) return { day: '--', month: '--' };
  const month = new Intl.DateTimeFormat('it-IT', { month: 'short' })
    .format(date)
    .replace('.', '')
    .toUpperCase();
  return { day: String(date.getDate()).padStart(2, '0'), month };
}

/** "sabato 14 ottobre 2026" da una data ISO. */
export function longDate(dateStr) {
  const date = parseDate(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** "Sab 14 Ott" (breve) da una data ISO. */
export function shortDate(dateStr) {
  const date = parseDate(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}
