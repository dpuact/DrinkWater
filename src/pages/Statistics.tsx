import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import type { WaterRecord, UserSettings, StatsRange } from '../types'
import {
  computeStatsSummary,
  getCompletionPercent,
  get30DayDailyStats,
  get7DayDailyStats,
  sumAmount,
  countRecords,
} from '../utils/statistics'
import { formatDateCN, formatTodayHeader, getLastNDates, getWeekdayShort, parseDateString } from '../utils/date'

interface Props {
  allRecords: WaterRecord[]
  settings: UserSettings
}

function StatsCard({ title, value, unit, hint }: { title: string; value: string | number; unit?: string; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-gray-500 dark:text-gray-400">{title}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{value}</span>
        {unit && <span className="text-xs text-gray-500 dark:text-gray-400">{unit}</span>}
      </div>
      {hint && <div className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{hint}</div>}
    </div>
  )
}

export default function Statistics({ allRecords, settings }: Props) {
  const [range, setRange] = useState<StatsRange>('today')

  const today = getLastNDates(1)[0]
  const todayRecords = useMemo(
    () => allRecords.filter((r) => r.date === today),
    [allRecords, today]
  )
  const todayTotal = sumAmount(todayRecords)
  const todayCount = countRecords(todayRecords)
  const todayPct = getCompletionPercent(todayTotal, settings.dailyGoal)
  const todayExactPct = todayTotal === 0 || settings.dailyGoal === 0
    ? 0
    : Math.round((todayTotal / settings.dailyGoal) * 1000) / 10

  const seven = useMemo(() => {
    const dates = getLastNDates(7)
    return get7DayDailyStats(allRecords.filter((r) => dates.includes(r.date)))
  }, [allRecords])
  const sevenSummary = computeStatsSummary(seven, settings.dailyGoal)

  const thirty = useMemo(() => {
    const dates = getLastNDates(30)
    return get30DayDailyStats(allRecords.filter((r) => dates.includes(r.date)))
  }, [allRecords])
  const thirtySummary = computeStatsSummary(thirty, settings.dailyGoal)

  const bar7Option = useMemo(() => {
    const labels = seven.map((d) => getWeekdayShort(d.date))
    return {
      grid: { left: 32, right: 12, top: 20, bottom: 36 },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (v: number) => `${v.toLocaleString()} ml`,
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { color: '#6b7280', fontSize: 11 },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#6b7280', fontSize: 10 },
        splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
      },
      series: [
        {
          type: 'bar',
          data: seven.map((d) => d.total),
          itemStyle: {
            color: '#3b82f6',
            borderRadius: [6, 6, 0, 0],
          },
          barMaxWidth: 32,
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#10b981', type: 'dashed' },
            label: { formatter: `目标 ${settings.dailyGoal}`, color: '#10b981', fontSize: 10 },
            data: [{ yAxis: settings.dailyGoal }],
          },
        },
      ],
    }
  }, [seven, settings.dailyGoal])

  const bar30Option = useMemo(() => {
    const labels = thirty.map((d) => {
      const date = parseDateString(d.date)
      return `${date.getMonth() + 1}/${date.getDate()}`
    })
    return {
      grid: { left: 40, right: 12, top: 20, bottom: 36 },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (v: number) => `${v.toLocaleString()} ml`,
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { color: '#6b7280', fontSize: 10, interval: 2 },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#6b7280', fontSize: 10 },
        splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
      },
      series: [
        {
          type: 'bar',
          data: thirty.map((d) => d.total),
          itemStyle: {
            color: '#60a5fa',
            borderRadius: [4, 4, 0, 0],
          },
          barMaxWidth: 14,
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#10b981', type: 'dashed' },
            label: { formatter: `目标 ${settings.dailyGoal}`, color: '#10b981', fontSize: 10 },
            data: [{ yAxis: settings.dailyGoal }],
          },
        },
      ],
    }
  }, [thirty, settings.dailyGoal])

  const tabs: { key: StatsRange; label: string }[] = [
    { key: 'today', label: '今日' },
    { key: '7days', label: '7天' },
    { key: '30days', label: '30天' },
  ]

  return (
    <div className="page-container">
      <div className="app-shell px-5 pt-6">
        <header className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">统计</h1>
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatTodayHeader(new Date())}</div>
        </header>

        <div className="flex gap-2 mb-5 p-1 bg-gray-100 dark:bg-gray-700 rounded-2xl">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setRange(t.key)}
              className={`flex-1 h-10 rounded-xl font-semibold text-sm transition-all ${
                range === t.key
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {range === 'today' && (
          <section className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatsCard title="今日饮水总量" value={todayTotal.toLocaleString()} unit="ml" />
              <StatsCard title="次数" value={todayCount} unit="次" />
              <StatsCard title="每日目标" value={settings.dailyGoal.toLocaleString()} unit="ml" />
              <StatsCard title="完成度" value={`${todayExactPct}%`} />
            </div>
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">今日进度</h3>
              <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, todayPct)}%` }}
                />
              </div>
              {todayRecords.length === 0 && (
                <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">暂无饮水记录</p>
              )}
            </div>
          </section>
        )}

        {range === '7days' && (
          <section className="space-y-4">
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">最近 7 天</h3>
              <ReactECharts option={bar7Option} style={{ height: 220 }} notMerge />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatsCard title="总饮水量" value={sevenSummary.total.toLocaleString()} unit="ml" />
              <StatsCard title="日均饮水" value={sevenSummary.average.toLocaleString()} unit="ml" />
              <StatsCard title="达标天数" value={sevenSummary.achievedDays} unit={`/ 7 天`} />
              <StatsCard title="达标率" value={`${sevenSummary.achieveRate}%`} />
              <StatsCard title="最高" value={sevenSummary.maxDay.toLocaleString()} unit="ml" />
              <StatsCard title="最低" value={sevenSummary.minDay.toLocaleString()} unit="ml"
                hint={sevenSummary.daysWithData === 0 ? '暂无数据' : undefined}
              />
            </div>
            <div className="card divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
              {seven.slice().reverse().map((d) => (
                <div key={d.date} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {getWeekdayShort(d.date)}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDateCN(d.date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-semibold text-primary-600 dark:text-primary-400 tabular-nums">
                      {d.total.toLocaleString()} ml
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{d.count} 次</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {range === '30days' && (
          <section className="space-y-4">
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">最近 30 天</h3>
              <ReactECharts option={bar30Option} style={{ height: 240 }} notMerge />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatsCard title="总饮水量" value={thirtySummary.total.toLocaleString()} unit="ml" />
              <StatsCard title="日均饮水" value={thirtySummary.average.toLocaleString()} unit="ml"
                hint={thirtySummary.daysWithData === 0 ? '暂无数据' : `${thirtySummary.daysWithData} 天有记录`}
              />
              <StatsCard title="达标天数" value={thirtySummary.achievedDays} unit="/ 30 天" />
              <StatsCard title="达标率" value={`${thirtySummary.achieveRate}%`} />
              <StatsCard title="最高" value={thirtySummary.maxDay.toLocaleString()} unit="ml" />
              <StatsCard title="最低" value={thirtySummary.minDay.toLocaleString()} unit="ml"
                hint={thirtySummary.daysWithData === 0 ? '暂无数据' : undefined}
              />
            </div>
          </section>
        )}

        <div className="h-10" />
      </div>
    </div>
  )
}
