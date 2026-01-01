export function formatDate(ts: string | number | Date): string {
  if (!ts) return ''
  try {
    const d = new Date(ts)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return d.toLocaleDateString()
  } catch (e) {
    return String(ts)
  }
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return `Rp ${num.toLocaleString('id-ID')}`
}

export function formatNumber(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return num.toLocaleString('id-ID')
}
