import { useMemo } from 'react'
import type { WaterRecord } from '../types'
import { countRecords, getCompletionPercent, getExactCompletionPercent, sumAmount } from '../utils/statistics'

export function useTodayStats(records: WaterRecord[], goal: number) {
  return useMemo(() => {
    const total = sumAmount(records)
    const count = countRecords(records)
    const percent = getCompletionPercent(total, goal)
    const exactPercent = getExactCompletionPercent(total, goal)
    const over = Math.max(total - goal, 0)
    return { total, count, percent, exactPercent, over }
  }, [records, goal])
}
