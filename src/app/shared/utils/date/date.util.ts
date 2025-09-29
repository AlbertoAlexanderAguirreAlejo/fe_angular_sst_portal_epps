export function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatFecha(
  iso?: string | Date,
  timeZone = 'UTC',
  pattern = 'dd/MM/yyyy, HH:mm',
  locale: string | string[] = 'es-PE'
): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d).reduce<Record<string,string>>((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  const map: Record<string,string> = {
    yyyy: parts['year'], MM: parts['month'], dd: parts['day'],
    HH: parts['hour'], mm: parts['minute'],
  };
  return pattern.replace(/yyyy|MM|dd|HH|mm/g, m => map[m] ?? m);
}

export function isValidRange(r?: Date[] | null) {
  return !!(r && r.length === 2 && r[0] && r[1] && r[0].getTime() <= r[1].getTime());
}
