import { useMemo, useState } from 'react'
import type { WaterRecord, UserSettings } from '../types'
import QuickAmountButtons from '../components/QuickAmountButtons'
import WaterProgress from '../components/WaterProgress'
import WaterRecordItem from '../components/WaterRecordItem'
import ConfirmDialog from '../components/ConfirmDialog'
import { CustomAmountDialog, RecordEditDialog } from '../components/Dialogs'
import SnackbarUndo from '../components/SnackbarUndo'
import { useTodayStats } from '../hooks/useTodayStats'
import { formatTodayHeader, formatTimeShort, getTodayDateString, parseTimestamp } from '../utils/date'

interface Props {
  records: WaterRecord[]
  settings: UserSettings
  onAdd: (amount: number) => Promise<WaterRecord | null>
  onUpdate: (id: string, patch: { amount?: number; timestamp?: Date }) => Promise<WaterRecord | undefined>
  onRemove: (id: string) => Promise<boolean>
  onUndo: () => boolean | Promise<boolean>
}

export default function Home({ records, settings, onAdd, onUpdate, onRemove, onUndo }: Props) {
  const stats = useTodayStats(records, settings.dailyGoal)
  const todayLabel = useMemo(() => formatTodayHeader(new Date()), [])

  const [customOpen, setCustomOpen] = useState(false)
  const [editing, setEditing] = useState<WaterRecord | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<WaterRecord | null>(null)
  const [snackAmount, setSnackAmount] = useState(0)
  const [busy, setBusy] = useState(false)

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    [records]
  )

  const handleQuickAdd = async (amount: number) => {
    if (busy) return
    setBusy(true)
    try {
      const rec = await onAdd(amount)
      if (rec) setSnackAmount(amount)
    } finally {
      setBusy(false)
    }
  }

  const handleCustomConfirm = async (amount: number) => {
    setCustomOpen(false)
    await handleQuickAdd(amount)
  }

  const handleSaveEdit = async (amount: number, dt: Date) => {
    if (!editing) return
    const ok = await onUpdate(editing.id, { amount, timestamp: dt })
    if (ok) setEditing(null)
  }

  const handleDeleteClick = () => {
    if (!editing) return
    setDeleteConfirm(editing)
    setEditing(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    await onRemove(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  const editingDefault = editing
    ? {
        amount: editing.amount,
        date: editing.date,
        time: formatTimeShort(parseTimestamp(editing.timestamp)),
      }
    : { amount: 0, date: getTodayDateString(), time: '09:00' }

  return (
    <div className="page-container">
      <div className="app-shell px-5 pt-6">
        <header className="mb-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">{todayLabel}</div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">今天喝水</h1>
        </header>

        <section className="text-center py-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-6xl sm:text-7xl font-extrabold tracking-tight text-primary-600 dark:text-primary-400 tabular-nums">
              {stats.total.toLocaleString()}
            </span>
            <span className="text-2xl font-medium text-gray-500 dark:text-gray-400">ml</span>
          </div>
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            目标 {settings.dailyGoal.toLocaleString()} ml
          </div>
          <div className="mt-2 flex items-baseline justify-center gap-3">
            <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 tabular-nums">
              {Math.round(stats.percent)}%
            </div>
            {stats.over > 0 && (
              <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                超出 {stats.over.toLocaleString()} ml
              </div>
            )}
          </div>
          <div className="mt-5">
            <WaterProgress current={stats.total} goal={settings.dailyGoal} percent={stats.percent} />
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
            今日 {stats.count} 次
          </div>
        </section>

        <section className="mt-2">
          <QuickAmountButtons
            amounts={settings.quickAmounts}
            onAdd={handleQuickAdd}
            disabled={busy}
          />
          <button
            type="button"
            className="mt-3 w-full h-12 btn-secondary text-primary-500 dark:text-primary-300"
            onClick={() => setCustomOpen(true)}
          >
            ＋ 自定义
          </button>
        </section>

        <section className="mt-8 mb-6">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">今日记录</h2>
          <div className="card divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
            {sortedRecords.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-5xl mb-3">💧</div>
                <div className="text-gray-500 dark:text-gray-400">今天还没有喝水记录</div>
                <div className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                  开始记录你的第一杯水吧
                </div>
              </div>
            ) : (
              sortedRecords.map((r) => (
                <WaterRecordItem key={r.id} record={r} onClick={(rec) => setEditing(rec)} />
              ))
            )}
          </div>
        </section>
      </div>

      <CustomAmountDialog
        open={customOpen}
        onCancel={() => setCustomOpen(false)}
        onConfirm={handleCustomConfirm}
      />

      <RecordEditDialog
        open={!!editing}
        defaultAmount={editingDefault.amount}
        defaultDate={editingDefault.date}
        defaultTime={editingDefault.time}
        onCancel={() => setEditing(null)}
        onSave={handleSaveEdit}
        onDelete={handleDeleteClick}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="确定删除这条饮水记录？"
        message={
          deleteConfirm ? (
            <div>
              <div className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                {deleteConfirm.amount.toLocaleString()} ml
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatTimeShort(parseTimestamp(deleteConfirm.timestamp))}
              </div>
            </div>
          ) : null
        }
        confirmText="删除"
        cancelText="取消"
        danger
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
      />

      <SnackbarUndo amount={snackAmount} onUndo={onUndo} />
    </div>
  )
}
