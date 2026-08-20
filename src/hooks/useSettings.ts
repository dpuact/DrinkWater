import { useCallback, useEffect, useState } from 'react'
import type { UserSettings } from '../types'
import { getSettings, updateSettings } from '../db/database'

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const s = await getSettings()
      setSettings(s)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载设置失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const update = useCallback(async (patch: Partial<UserSettings>) => {
    const next = await updateSettings(patch)
    setSettings(next)
    return next
  }, [])

  return { settings, loading, error, reload: load, update }
}
