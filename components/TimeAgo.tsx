import { useState, useEffect, memo, useCallback } from 'react'
import { useLocale } from '../context/LocaleContext'

interface TimeAgoProps {
  date: string
  className?: string
}

function TimeAgo({ date, className = '' }: TimeAgoProps) {
  const { t } = useLocale()
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())

    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const formatDate = useCallback(
    (ts: string) => {
      if (!ts || !now) return ''

      const d = new Date(ts)
      if (isNaN(d.getTime())) return ts

      let diffMs = now.getTime() - d.getTime()

      if (diffMs < 0) diffMs = 0

      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return t('now') ?? 'now'
      if (diffMins < 60) return `${diffMins}${t('m') ?? 'm'}`
      if (diffHours < 24) return `${diffHours}${t('h') ?? 'h'}`

      if (diffDays < 7) {
        const hours = diffHours % 24
        return hours === 0
          ? `${diffDays}${t('d') ?? 'd'}`
          : `${diffDays}${t('d') ?? 'd'} ${hours}${t('h') ?? 'h'}`
      }

      return d.toLocaleDateString()
    },
    [now, t]
  )

  if (!now) return null

  return (
    <span className={className} title={new Date(date).toLocaleString()}>
      {formatDate(date)}
    </span>
  )
}

export default memo(TimeAgo)
