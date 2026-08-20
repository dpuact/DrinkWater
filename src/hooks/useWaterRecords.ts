import { useCallback, useEffect, useRef, useState } from 'react'
import type { WaterRecord } from '../types'
import {
  addWaterRecord,
  batchImportRecords,
  clearAllRecordsAndSettings,
  deleteWaterRecord,
  getAllRecords,
  getRecordsBetween,
  getRecordsByDate,
  updateWaterRecord,
} from '../db/database'
import { getTodayDateString } from '../utils/date'

export function useWaterRecords() {
  const [todayRecords, setTodayRecords] = useState<WaterRecord[]>([])
  const [allRecords, setAllRecords] = useState<WaterRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastIdRef = useRef<{ id: string | null }>({ id: null })

  const loadToday = useCallback(async () => {
    try {
      const today = getTodayDateString()
      const list = await getRecordsByDate(today)
      setTodayRecords(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载今日记录失败')
    }
  }, [])

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      const list = await getAllRecords()
      setAllRecords(list)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载记录失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll().then(() => loadToday())
  }, [loadAll, loadToday])

  const add = useCallback(async (amount: number, when?: Date): Promise<WaterRecord | null> => {
    try {
      const rec = await addWaterRecord(amount, when)
      lastIdRef.current.id = rec.id
      await Promise.all([loadToday(), loadAll()])
      return rec
    } catch (e) {
      setError(e instanceof Error ? e.message : '添加记录失败')
      return null
    }
  }, [loadToday, loadAll])

  const undoLast = useCallback(async (): Promise<boolean> => {
    const id = lastIdRef.current.id
    if (!id) return false
    try {
      await deleteWaterRecord(id)
      lastIdRef.current.id = null
      await Promise.all([loadToday(), loadAll()])
      return true
    } catch {
      return false
    }
  }, [loadToday, loadAll])

  const update = useCallback(async (id: string, patch: { amount?: number; timestamp?: Date }) => {
    try {
      const res = await updateWaterRecord(id, patch)
      await Promise.all([loadToday(), loadAll()])
      return res
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新记录失败')
      return undefined
    }
  }, [loadToday, loadAll])

  const remove = useCallback(async (id: string) => {
    try {
      await deleteWaterRecord(id)
      if (lastIdRef.current.id === id) lastIdRef.current.id = null
      await Promise.all([loadToday(), loadAll()])
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除记录失败')
      return false
    }
  }, [loadToday, loadAll])

  const importJson = useCallback(async (records: WaterRecord[]) => {
    try {
      const added = await batchImportRecords(records)
      await Promise.all([loadToday(), loadAll()])
      return added
    } catch (e) {
      setError(e instanceof Error ? e.message : '导入失败')
      return 0
    }
  }, [loadToday, loadAll])

  const clearAll = useCallback(async () => {
    try {
      await clearAllRecordsAndSettings()
      lastIdRef.current.id = null
      setTodayRecords([])
      setAllRecords([])
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '清空失败')
      return false
    }
  }, [])

  const loadRange = useCallback(async (from: string, to: string): Promise<WaterRecord[]> => {
    return getRecordsBetween(from, to)
  }, [])

  return {
    todayRecords,
    allRecords,
    loading,
    error,
    add,
    update,
    remove,
    importJson,
    clearAll,
    loadRange,
    reload: loadAll,
    reloadToday: loadToday,
    undoLast,
    lastRecordId: lastIdRef.current.id,
  }
}
