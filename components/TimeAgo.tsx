import { formatDate } from '../utils/format'

interface TimeAgoProps {
  date: string
  className?: string
}

export default function TimeAgo({ date, className = '' }: TimeAgoProps) {
  return (
    <span className={className} title={new Date(date).toLocaleString()}>
      {formatDate(date)}
    </span>
  )
}