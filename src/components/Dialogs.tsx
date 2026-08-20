import { useEffect, useState } from 'react'
import ConfirmDialog from './ConfirmDialog'

interface CustomAmountProps {
  open: boolean
  onCancel: () => void
  onConfirm: (amount: number) => void
}

export function CustomAmountDialog({ open, onCancel, onConfirm }: CustomAmountProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValue('')
      setError(null)
    }
  }, [open])

  const handleConfirm = () => {
    const n = Number(value)
    if (!value || !isFinite(n) || !Number.isInteger(n) || n < 1 || n > 5000) {
      setError('请输入 1～5000ml 的整数')
      return
    }
    onConfirm(n)
  }

  return (
    <ConfirmDialog
      open={open}
      title="自定义饮水量"
      message={
        <div className="text-left">
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">请输入饮水量</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={5000}
              autoFocus
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm()
              }}
              className="input-field flex-1 text-lg"
              placeholder="例如 250"
            />
            <span className="text-gray-500 dark:text-gray-400">ml</span>
          </div>
          {error ? (
            <p className="mt-2 text-xs text-red-500">{error}</p>
          ) : (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">允许范围：1～5000ml</p>
          )}
        </div>
      }
      confirmText="确定"
      cancelText="取消"
      onCancel={onCancel}
      onConfirm={handleConfirm}
    />
  )
}

interface RecordEditProps {
  open: boolean
  defaultAmount: number
  defaultDate: string
  defaultTime: string
  onCancel: () => void
  onSave: (amount: number, datetime: Date) => void
  onDelete?: () => void
}

export function RecordEditDialog({
  open,
  defaultAmount,
  defaultDate,
  defaultTime,
  onCancel,
  onSave,
  onDelete,
}: RecordEditProps) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setAmount(String(defaultAmount))
      setDate(defaultDate)
      setTime(defaultTime)
      setError(null)
    }
  }, [open, defaultAmount, defaultDate, defaultTime])

  const handleSave = () => {
    const n = Number(amount)
    if (!amount || !isFinite(n) || !Number.isInteger(n) || n < 1 || n > 5000) {
      setError('饮水量必须是 1～5000ml 的整数')
      return
    }
    if (!date || !time) {
      setError('请填写完整的日期和时间')
      return
    }
    const [y, m, d] = date.split('-').map(Number)
    const [h, min] = time.split(':').map(Number)
    if ([y, m, d, h, min].some((x) => !isFinite(x))) {
      setError('日期或时间格式不正确')
      return
    }
    const dt = new Date(y, m - 1, d, h, min, 0, 0)
    onSave(n, dt)
  }

  return (
    <ConfirmDialog
      open={open}
      title="修改饮水记录"
      message={
        <div className="space-y-4 text-left">
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">饮水量 (ml)</label>
            <input
              type="number"
              min={1}
              max={5000}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setError(null)
              }}
              className="input-field text-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  setError(null)
                }}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">时间</label>
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value)
                  setError(null)
                }}
                className="input-field"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="w-full mt-2 py-2 text-sm text-red-500 font-medium
                         hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
            >
              删除这条记录
            </button>
          )}
        </div>
      }
      confirmText="保存"
      cancelText="取消"
      onCancel={onCancel}
      onConfirm={handleSave}
    />
  )
}
