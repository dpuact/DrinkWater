import { useRef, useState } from 'react'
import type { WaterRecord, UserSettings } from '../types'
import ConfirmDialog from '../components/ConfirmDialog'
import { exportCsv, exportJson, parseJsonImport, readFileAsText } from '../utils/export'

interface Props {
  settings: UserSettings
  records: WaterRecord[]
  onUpdateSettings: (patch: Partial<UserSettings>) => Promise<UserSettings>
  onImportRecords: (records: WaterRecord[]) => Promise<number>
  onClearAll: () => Promise<boolean>
}

type ThemeKey = UserSettings['theme']

const THEME_OPTIONS: { key: ThemeKey; label: string }[] = [
  { key: 'system', label: '跟随系统' },
  { key: 'light', label: '浅色' },
  { key: 'dark', label: '深色' },
]

export default function Settings({
  settings,
  records,
  onUpdateSettings,
  onImportRecords,
  onClearAll,
}: Props) {
  const [goal, setGoal] = useState(String(settings.dailyGoal))
  const [goalError, setGoalError] = useState<string | null>(null)

  const [quickAmounts, setQuickAmounts] = useState<number[]>(settings.quickAmounts)
  const [adding, setAdding] = useState('')
  const [quickError, setQuickError] = useState<string | null>(null)

  const [clearStep, setClearStep] = useState<0 | 1 | 2>(0)
  const [importAlert, setImportAlert] = useState<string | null>(null)
  const [importConfirm, setImportConfirm] = useState<{ count: number; data: WaterRecord[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSaveGoal = async () => {
    const n = Number(goal)
    if (!goal || !isFinite(n) || !Number.isInteger(n) || n < 500 || n > 10000) {
      setGoalError('请输入 500～10000ml 的整数')
      return
    }
    setGoalError(null)
    await onUpdateSettings({ dailyGoal: n })
  }

  const handleAddQuick = () => {
    const n = Number(adding)
    if (!adding || !isFinite(n) || !Number.isInteger(n) || n < 1 || n > 5000) {
      setQuickError('请输入 1～5000 的整数')
      return
    }
    if (quickAmounts.includes(n)) {
      setQuickError('该数值已存在')
      return
    }
    if (quickAmounts.length >= 6) {
      setQuickError('最多设置 6 个快捷按钮')
      return
    }
    const next = [...quickAmounts, n].sort((a, b) => a - b)
    setQuickAmounts(next)
    setAdding('')
    setQuickError(null)
    onUpdateSettings({ quickAmounts: next })
  }

  const handleRemoveQuick = async (n: number) => {
    const next = quickAmounts.filter((x) => x !== n)
    setQuickAmounts(next)
    await onUpdateSettings({ quickAmounts: next })
  }

  const handleExportJson = () => exportJson(records, settings)
  const handleExportCsv = () => exportCsv(records)

  const handleImportFile = async (file: File | null) => {
    if (!file) return
    try {
      const text = await readFileAsText(file)
      const result = parseJsonImport(text)
      if (result.records.length === 0) {
        setImportAlert('未找到可导入的记录')
        return
      }
      setImportConfirm({ count: result.records.length, data: result.records })
    } catch (e) {
      setImportAlert(e instanceof Error ? e.message : '导入失败')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleConfirmImport = async () => {
    if (!importConfirm) return
    const added = await onImportRecords(importConfirm.data)
    setImportConfirm(null)
    setImportAlert(`已导入 ${added} 条记录（跳过 ${importConfirm.count - added} 条重复）`)
  }

  const handleClearStep1 = () => setClearStep(1)
  const handleClearStep2 = () => setClearStep(2)
  const handleClearCancel = () => setClearStep(0)
  const handleClearConfirm = async () => {
    const ok = await onClearAll()
    if (ok) {
      setClearStep(0)
      setGoal('2000')
      setQuickAmounts([100, 150, 200, 250, 300, 500])
    }
  }

  return (
    <div className="page-container">
      <div className="app-shell px-5 pt-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">设置</h1>
        </header>

        <section className="mb-6">
          <h2 className="px-1 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            饮水
          </h2>
          <div className="card overflow-hidden">
            <div className="setting-cell">
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-100">每日饮水目标</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">默认 2000ml，建议范围 500～10000ml</div>
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={500}
                  max={10000}
                  value={goal}
                  onChange={(e) => {
                    setGoal(e.target.value)
                    setGoalError(null)
                  }}
                  onBlur={handleSaveGoal}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  }}
                  className="input-field flex-1 text-lg"
                />
                <span className="text-gray-500 dark:text-gray-400">ml</span>
                <button type="button" onClick={handleSaveGoal} className="btn-primary px-4 h-12 text-sm">
                  保存
                </button>
              </div>
              {goalError && <p className="mt-2 text-xs text-red-500">{goalError}</p>}
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="px-1 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            快捷饮水量
          </h2>
          <div className="card overflow-hidden">
            <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
              当前 {quickAmounts.length} / 6 个，点击可删除
            </div>
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {quickAmounts.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => handleRemoveQuick(a)}
                  className="px-3 h-9 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium
                             text-gray-700 dark:text-gray-200 hover:bg-red-50 hover:text-red-500
                             dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                  title="点击删除"
                >
                  {a}ml ✕
                </button>
              ))}
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={adding}
                  onChange={(e) => {
                    setAdding(e.target.value)
                    setQuickError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddQuick()
                  }}
                  placeholder="添加新数值，例如 350"
                  className="input-field flex-1"
                />
                <button type="button" onClick={handleAddQuick} className="btn-primary px-4 h-12 text-sm">
                  添加
                </button>
              </div>
              {quickError && <p className="mt-2 text-xs text-red-500">{quickError}</p>}
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="px-1 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            外观
          </h2>
          <div className="card overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            <div className="setting-cell">
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-100">主题</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  当前：{THEME_OPTIONS.find((t) => t.key === settings.theme)?.label}
                </div>
              </div>
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                {THEME_OPTIONS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => onUpdateSettings({ theme: t.key })}
                    className={`px-3 h-8 rounded-lg text-xs font-medium transition-all ${
                      settings.theme === t.key
                        ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="px-1 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            数据管理
          </h2>
          <p className="px-1 mb-2 text-xs text-gray-400 dark:text-gray-500">
            你的饮水记录默认只保存在当前设备。建议定期导出数据进行备份。
          </p>
          <div className="card overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            <button
              type="button"
              onClick={handleExportJson}
              className="setting-cell w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700/60"
            >
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-100">导出数据 · JSON</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">包含记录和设置，可用于导入恢复</div>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="setting-cell w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700/60"
            >
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-100">导出数据 · CSV</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">用 Excel / Numbers 打开分析</div>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="setting-cell w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700/60"
            >
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-100">导入数据</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">选择之前导出的 JSON 文件（合并数据）</div>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => handleImportFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={handleClearStep1}
              className="setting-cell w-full text-left hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <div>
                <div className="font-medium text-red-500">清空所有数据</div>
                <div className="text-xs text-red-400/80 mt-0.5">删除所有饮水记录和设置，无法恢复</div>
              </div>
              <span className="text-red-400">›</span>
            </button>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="px-1 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            关于
          </h2>
          <div className="card overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            <div className="setting-cell">
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-100">喝水记录</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Version 1.0 · 记录每一杯水
                </div>
              </div>
              <span className="text-sm text-primary-500 font-semibold">💧</span>
            </div>
          </div>
        </section>

        <div className="h-8" />
      </div>

      <ConfirmDialog
        open={clearStep === 1}
        title="清空所有数据"
        message={
          <>
            即将删除所有饮水记录和设置。
            <br />
            <br />
            此操作无法恢复。是否继续？
          </>
        }
        confirmText="下一步"
        cancelText="取消"
        danger
        onCancel={handleClearCancel}
        onConfirm={handleClearStep2}
      />
      <ConfirmDialog
        open={clearStep === 2}
        title="再次确认"
        message={
          <>
            此操作无法恢复。
            <br />
            <br />
            将删除所有饮水记录和设置。
            <br />
            <br />
            确定删除？
          </>
        }
        confirmText="确定删除"
        cancelText="取消"
        danger
        onCancel={handleClearCancel}
        onConfirm={handleClearConfirm}
      />

      <ConfirmDialog
        open={!!importConfirm}
        title="导入数据"
        message={
          importConfirm ? (
            <>
              检测到 <b className="text-primary-600 dark:text-primary-400">{importConfirm.count}</b> 条饮水记录。
              <br />
              <br />
              导入数据会将记录合并到当前设备，不会覆盖现有数据。
              <br />
              <br />
              是否继续？
            </>
          ) : null
        }
        confirmText="继续导入"
        cancelText="取消"
        onCancel={() => setImportConfirm(null)}
        onConfirm={handleConfirmImport}
      />

      <ConfirmDialog
        open={!!importAlert}
        title="提示"
        message={importAlert ?? ''}
        confirmText="好的"
        cancelText=""
        onCancel={() => setImportAlert(null)}
        onConfirm={() => setImportAlert(null)}
      />
    </div>
  )
}
