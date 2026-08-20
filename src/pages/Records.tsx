import { useMemo, useState } from 'react'
import type { WaterRecord } from '../types'
import WaterRecordItem from '../components/WaterRecordItem'
import ConfirmDialog from '../components/ConfirmDialog'
import { RecordEditDialog } from '../components/Dialogs'
import { filterRecordsByRange, groupRecordsByDate, sumAmount } from '../utils/statistics'
import { formatDateCN, formatTimeShort, getTodayDateString, parseDateString, parseTimestamp } from '../utils/date'

type FilterKey = 'today' | 'yesterday' | '7days' | '30days' | 'custom'

interface Props {
  allRecords: WaterRecord[]
  onUpdate: (id: string, patch: { amount?: number; timestamp?: Date }) => Promise<WaterRecord | undefined>
  onRemove: (id: string) => Promise<boolean>
}

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'today', label: '今天' },
  { key: 'yesterday', label: '昨天' },
  { key: '7days', label: '最近7天' },
  { key: '30days', label: '最近30天' },
  { key: 'custom', label: '自定义' },
]

export default function Records({ allRecords, onUpdate, onRemove }: Props) {
  const [filter, setFilter] = useState<FilterKey>('30days')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [editing, setEditing] = useState<WaterRecord | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<WaterRecord | null>(null)

  const filtered = useMemo(() => {
    let f = fromDate
    let t = toDate
    if (filter === 'custom') {
      const today = getTodayDateString()
      if (!f) f = today
      if (!t) t = today
    }
    return filterRecordsByRange(allRecords, filter, f, t)
  }, [allRecords, filter, fromDate, toDate])

  const groups = useMemo(() => groupRecordsByDate(filtered), [filtered])

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
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">记录</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            共 {filtered.length} 条记录
          </p>
        </header>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 mb-4 -mx-5 px-5">
          {FILTER_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setFilter(o.key)}
              className={`shrink-0 px-4 h-10 rounded-full font-medium text-sm transition-all ${
                filter === o.key
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {filter === 'custom' && (
          <div className="card p-4 mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">开始日期</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">结束日期</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="card py-16 text-center">
            <div className="text-5xl mb-3">📋</div>
            <div className="text-gray-500 dark:text-gray-400">暂无饮水记录</div>
            <div className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              换个筛选条件再试试吧
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((g) => (
              <section key={g.date}>
                <div className="flex items-baseline justify-between px-1 mb-2">
                  <div>
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                      {formatDateCN(g.date)}
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {(() => {
                        const d = parseDateString(g.date)
                        const wd = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
                        return `星期${wd}`
                      })()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary-600 dark:text-primary-400 tabular-nums">
                      总计 {sumAmount(g.records).toLocaleString()}ml
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {g.records.length} 次
                    </div>
                  </div>
                </div>
                <div className="card divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
                  {g.records.map((r) => (
                    <WaterRecordItem key={r.id} record={r} onClick={(rec) => setEditing(rec)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="h-10" />
      </div>

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
    </div>
  )
}
