import { useEffect } from 'react'
import type { UserSettings } from '../types'

function applyTheme(theme: UserSettings['theme']) {
  const root = document.documentElement
  root.classList.remove('dark')
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const shouldDark = theme === 'dark' || (theme === 'system' && sysDark)
  if (shouldDark) root.classList.add('dark')
}

export function useTheme(theme: UserSettings['theme'] | null | undefined) {
  useEffect(() => {
    if (!theme) return
    applyTheme(theme)
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])
}
