import type { WaterRecord, UserSettings } from '../types'
import { formatDateCN, formatTimeShort, parseTimestamp } from './date'

export function buildJsonExport(records: WaterRecord[], settings: UserSettings): string {
  const payload = {
    version: 1,
    exportDate: new Date().toISOString().slice(0, 10),
    settings,
    records,
  }
  return JSON.stringify(payload, null, 2)
}

export function buildCsvExport(records: WaterRecord[]): string {
  const header = '日期,时间,饮水量(ml)\n'
  const sorted = [...records].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
  const rows = sorted.map((r) => {
    const d = parseTimestamp(r.timestamp)
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const time = formatTimeShort(d)
    return `${date},${time},${r.amount}`
  })
  return header + rows.join('\n')
}

export function triggerDownload(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function exportJson(records: WaterRecord[], settings: UserSettings): void {
  const date = new Date()
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const content = buildJsonExport(records, settings)
  triggerDownload(`drink-water-${stamp}.json`, content, 'application/json')
}

export function exportCsv(records: WaterRecord[]): void {
  const date = new Date()
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const content = buildCsvExport(records)
  triggerDownload(`drink-water-${stamp}.csv`, content, 'text/csv;charset=utf-8')
}

export interface JsonImportResult {
  records: WaterRecord[]
  settings?: Partial<UserSettings>
  exportDate?: string
}

export function parseJsonImport(text: string): JsonImportResult {
  const data = JSON.parse(text)
  if (!data || typeof data !== 'object') throw new Error('无效的 JSON 数据')
  const records: WaterRecord[] = Array.isArray(data.records) ? data.records : []
  const valid: WaterRecord[] = records.filter((r) => {
    return (
      r &&
      typeof r === 'object' &&
      typeof r.id === 'string' &&
      typeof r.amount === 'number' &&
      isFinite(r.amount) &&
      typeof r.timestamp === 'string' &&
      typeof r.date === 'string'
    )
  })
  return {
    records: valid,
    settings: data.settings && typeof data.settings === 'object' ? data.settings : undefined,
    exportDate: typeof data.exportDate === 'string' ? data.exportDate : undefined,
  }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error || new Error('读取文件失败'))
    reader.readAsText(file, 'utf-8')
  })
}

export function dateToCn(dateStr: string): string {
  return formatDateCN(dateStr)
}
