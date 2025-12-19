export function formatDate(ts: string | number | Date): string {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    return d.toLocaleString()
  } catch (e) {
    return String(ts)
  }
}
