import type { WaterRecord } from '../types'
import { formatTimeShort, parseTimestamp } from '../utils/date'

interface Props {
  record: WaterRecord
  onClick?: (r: WaterRecord) => void
}

export default function WaterRecordItem({ record, onClick }: Props) {
  const t = parseTimestamp(record.timestamp)
  return (
    <button
      type="button"
      onClick={() => onClick?.(record)}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl
                 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors text-left"
    >
      <span className="text-base text-gray-700 dark:text-gray-200 font-medium tabular-nums">
        {formatTimeShort(t)}
      </span>
      <span className="text-base font-semibold text-primary-600 dark:text-primary-400 tabular-nums">
        {record.amount.toLocaleString()} ml
      </span>
    </button>
  )
}
