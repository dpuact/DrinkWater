export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9)
}

export function getTodayDateString(): string {
  const now = new Date()
  return formatDateString(now)
}

export function formatDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatTimestamp(date: Date): string {
  const tz = -date.getTimezoneOffset()
  const sign = tz >= 0 ? '+' : '-'
  const tzH = String(Math.floor(Math.abs(tz) / 60)).padStart(2, '0')
  const tzM = String(Math.abs(tz) % 60).padStart(2, '0')
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d}T${h}:${min}:${s}${sign}${tzH}:${tzM}`
}

export function parseTimestamp(ts: string): Date {
  return new Date(ts)
}

export function formatTimeShort(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function formatDateTimeFull(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d} ${formatTimeShort(date)}`
}

export function formatDateCN(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日`
}

export function formatTodayHeader(date: Date): string {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const m = date.getMonth() + 1
  const d = date.getDate()
  const w = weekdays[date.getDay()]
  return `${m}月${d}日 ${w}`
}

export function getDateDaysAgo(dateStr: string, days: number): string {
  const d = parseDateString(dateStr)
  d.setDate(d.getDate() - days)
  return formatDateString(d)
}

export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function getDateRange(fromDate: string, toDate: string): string[] {
  const dates: string[] = []
  const from = parseDateString(fromDate)
  const to = parseDateString(toDate)
  const cur = new Date(from)
  while (cur <= to) {
    dates.push(formatDateString(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export function getLastNDates(n: number): string[] {
  const today = getTodayDateString()
  const dates: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    dates.push(getDateDaysAgo(today, i))
  }
  return dates
}

export function getWeekdayShort(dateStr: string): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const d = parseDateString(dateStr)
  return weekdays[d.getDay()]
}
