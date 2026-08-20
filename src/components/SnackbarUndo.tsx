import { useEffect, useState } from 'react'

interface Props {
  amount: number
  onUndo: () => boolean | Promise<boolean>
  durationMs?: number
}

export default function SnackbarUndo({ amount, onUndo, durationMs = 4000 }: Props) {
  const [visible, setVisible] = useState(false)
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (amount <= 0) return
    setVisible(true)
    setKey((k) => k + 1)
    const t = setTimeout(() => setVisible(false), durationMs)
    return () => clearTimeout(t)
  }, [amount, durationMs])

  if (!visible) return null
  return (
    <div
      key={key}
      className="fixed left-1/2 -translate-x-1/2 z-50 px-4"
      style={{
        bottom: 'calc(4.5rem + var(--safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-900/90 dark:bg-gray-700/95 text-white shadow-xl backdrop-blur">
        <span className="text-sm font-medium">已记录 {amount.toLocaleString()}ml</span>
        <button
          type="button"
          onClick={async () => {
            const ok = await onUndo()
            if (ok) setVisible(false)
          }}
          className="text-primary-300 font-semibold text-sm px-2 py-1 rounded-lg hover:bg-white/10"
        >
          撤销
        </button>
      </div>
    </div>
  )
}
