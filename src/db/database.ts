import Dexie, { Table } from 'dexie'
import type { WaterRecord, UserSettings } from '../types'
import { DEFAULT_SETTINGS, SETTINGS_TABLE, RECORDS_TABLE } from '../types'
import { formatDateString, formatTimestamp, generateId, getTodayDateString } from '../utils/date'

export class WaterDatabase extends Dexie {
  [RECORDS_TABLE]!: Table<WaterRecord, string>
  [SETTINGS_TABLE]!: Table<UserSettings, string>

  constructor() {
    super('DrinkWaterDB')
    this.version(1).stores({
      [RECORDS_TABLE]: 'id, date, timestamp',
      [SETTINGS_TABLE]: 'id',
    })
  }

  async ensureSettings(): Promise<UserSettings> {
    const existing = await this[SETTINGS_TABLE].get('settings')
    if (existing) return existing
    const def: UserSettings = { id: 'settings', ...DEFAULT_SETTINGS }
    await this[SETTINGS_TABLE].put(def)
    return def
  }
}

export const db = new WaterDatabase()

// ------- Settings operations -------

export async function getSettings(): Promise<UserSettings> {
  return db.ensureSettings()
}

export async function updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings()
  const next: UserSettings = { ...current, ...patch }
  await db[SETTINGS_TABLE].put(next)
  return next
}

// ------- Record operations -------

export async function addWaterRecord(amount: number, when?: Date): Promise<WaterRecord> {
  const time = when ?? new Date()
  const ts = formatTimestamp(time)
  const rec: WaterRecord = {
    id: generateId(),
    amount,
    timestamp: ts,
    date: formatDateString(time),
    createdAt: ts,
    updatedAt: ts,
  }
  await db[RECORDS_TABLE].add(rec)
  return rec
}

export async function updateWaterRecord(
  id: string,
  patch: { amount?: number; timestamp?: Date }
): Promise<WaterRecord | undefined> {
  const existing = await db[RECORDS_TABLE].get(id)
  if (!existing) return undefined
  const now = formatTimestamp(new Date())
  const next: WaterRecord = { ...existing, updatedAt: now }
  if (patch.amount !== undefined) next.amount = patch.amount
  if (patch.timestamp) {
    next.timestamp = formatTimestamp(patch.timestamp)
    next.date = formatDateString(patch.timestamp)
  }
  await db[RECORDS_TABLE].put(next)
  return next
}

export async function deleteWaterRecord(id: string): Promise<void> {
  await db[RECORDS_TABLE].delete(id)
}

export async function clearAllRecordsAndSettings(): Promise<void> {
  await db[RECORDS_TABLE].clear()
  await db[SETTINGS_TABLE].clear()
}

export async function getRecordsByDate(date: string): Promise<WaterRecord[]> {
  const list = await db[RECORDS_TABLE].where('date').equals(date).reverse().sortBy('timestamp')
  return list.reverse() as WaterRecord[]
}

export async function getRecordsBetween(fromDate: string, toDate: string): Promise<WaterRecord[]> {
  const all = await db[RECORDS_TABLE].toArray()
  return all
    .filter((r) => r.date >= fromDate && r.date <= toDate)
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
}

export async function getAllRecords(): Promise<WaterRecord[]> {
  const all = await db[RECORDS_TABLE].toArray()
  return all.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
}

export async function batchImportRecords(records: WaterRecord[]): Promise<number> {
  if (!records.length) return 0
  // Merge: if id already exists, skip to avoid overwriting user data
  const existingIds = new Set((await db[RECORDS_TABLE].toArray()).map((r) => r.id))
  const toAdd = records.filter((r) => r.id && !existingIds.has(r.id))
  if (toAdd.length) {
    await db[RECORDS_TABLE].bulkAdd(toAdd)
  }
  return toAdd.length
}

export async function getTodayRecords(): Promise<WaterRecord[]> {
  return getRecordsByDate(getTodayDateString())
}
