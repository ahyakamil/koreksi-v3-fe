import { useLocale } from '../context/LocaleContext'

interface TimeAgoProps {
  date: string
  className?: string
}

export default function TimeAgo({ date, className = '' }: TimeAgoProps) {
  const { t } = useLocale()

  const formatDate = (ts: string) => {
    if (!ts) return ''
    try {
      const d = new Date(ts)
      const now = new Date()
      const diffMs = now.getTime() - d.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffMins < 1) return t('now') || 'now'
      if (diffMins < 60) return `${diffMins}${t('m') || 'm'}`
      if (diffHours < 24) return `${diffHours}${t('h') || 'h'}`
      if (diffDays < 7) return `${diffDays}${t('d') || 'd'}`
      return d.toLocaleDateString()
    } catch (e) {
      return String(ts)
    }
  }

  return (
    <span className={className} title={new Date(date).toLocaleString()}>
      {formatDate(date)}
    </span>
  )
}