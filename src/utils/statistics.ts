import type { WaterRecord, DailyStat, StatsSummary } from '../types'
import { getDateRange, getLastNDates, parseDateString } from './date'

export function sumAmount(records: WaterRecord[]): number {
  if (!records.length) return 0
  let total = 0
  for (const r of records) {
    if (typeof r.amount === 'number' && isFinite(r.amount)) {
      total += r.amount
    }
  }
  return total
}

export function countRecords(records: WaterRecord[]): number {
  return records.length
}

export function getCompletionPercent(current: number, goal: number): number {
  if (goal <= 0) return 0
  const p = (current / goal) * 100
  if (!isFinite(p)) return 0
  return Math.min(p, 100)
}

export function getExactCompletionPercent(current: number, goal: number): number {
  if (goal <= 0) return 0
  const p = (current / goal) * 100
  if (!isFinite(p)) return 0
  return Math.round(p * 10) / 10
}

export function buildDailyStats(records: WaterRecord[], dates: string[]): DailyStat[] {
  const byDate = new Map<string, { total: number; count: number }>()
  for (const r of records) {
    if (!r.date) continue
    const cur = byDate.get(r.date) ?? { total: 0, count: 0 }
    if (typeof r.amount === 'number' && isFinite(r.amount)) {
      cur.total += r.amount
    }
    cur.count += 1
    byDate.set(r.date, cur)
  }
  return dates.map((d) => {
    const s = byDate.get(d) ?? { total: 0, count: 0 }
    return { date: d, total: s.total, count: s.count }
  })
}

export function computeStatsSummary(daily: DailyStat[], goal: number): StatsSummary {
  let total = 0
  let maxDay = 0
  let minDay: number | null = null
  let achievedDays = 0
  let daysWithData = 0

  for (const d of daily) {
    total += d.total
    if (d.total > maxDay) maxDay = d.total
    if (d.count > 0) {
      daysWithData += 1
      if (minDay === null || d.total < minDay) minDay = d.total
    }
    if (goal > 0 && d.total >= goal) achievedDays += 1
  }

  const avg = daysWithData > 0 ? Math.round(total / daysWithData) : 0
  const rate = daily.length > 0 ? Math.round((achievedDays / daily.length) * 100) : 0

  return {
    total,
    average: avg,
    maxDay,
    minDay: minDay ?? 0,
    achievedDays,
    achieveRate: rate,
    daysWithData,
  }
}

export function get7DayDailyStats(records: WaterRecord[]): DailyStat[] {
  const dates = getLastNDates(7)
  return buildDailyStats(records, dates)
}

export function get30DayDailyStats(records: WaterRecord[]): DailyStat[] {
  const dates = getLastNDates(30)
  return buildDailyStats(records, dates)
}

export function groupRecordsByDate(records: WaterRecord[]): Array<{
  date: string
  total: number
  count: number
  records: WaterRecord[]
}> {
  const groups = new Map<string, WaterRecord[]>()
  for (const r of records) {
    if (!r.date) continue
    if (!groups.has(r.date)) groups.set(r.date, [])
    groups.get(r.date)!.push(r)
  }
  const sortedDates = Array.from(groups.keys()).sort((a, b) => (a < b ? 1 : -1))
  return sortedDates.map((d) => {
    const list = groups.get(d)!
    return {
      date: d,
      total: sumAmount(list),
      count: list.length,
      records: list.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    }
  })
}

export function filterRecordsByRange(
  records: WaterRecord[],
  range: 'today' | 'yesterday' | '7days' | '30days' | 'custom',
  customFrom?: string,
  customTo?: string
): WaterRecord[] {
  const today = getLastNDates(1)[0]
  let from: string
  let to: string
  switch (range) {
    case 'today':
      from = to = today
      break
    case 'yesterday': {
      const d = parseDateString(today)
      d.setDate(d.getDate() - 1)
      const y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      from = to = y
      break
    }
    case '7days': {
      const arr = getLastNDates(7)
      from = arr[0]
      to = arr[arr.length - 1]
      break
    }
    case '30days': {
      const arr = getLastNDates(30)
      from = arr[0]
      to = arr[arr.length - 1]
      break
    }
    case 'custom':
      if (!customFrom || !customTo) return records
      from = customFrom
      to = customTo
      break
  }
  const dates = getDateRange(from, to)
  const set = new Set(dates)
  return records.filter((r) => set.has(r.date))
}
