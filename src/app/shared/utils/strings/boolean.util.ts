export function isTrue(v: any): boolean {
  return v === '1' || v === 1 || v === true || v === 'true';
}
export function badgeSiNo(v: any): 'Sí' | 'No' {
  return isTrue(v) ? 'Sí' : 'No';
}
