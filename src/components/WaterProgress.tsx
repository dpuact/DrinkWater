interface Props {
  current: number
  goal: number
  percent: number
}

export default function WaterProgress({ current, goal, percent }: Props) {
  const safePct = Math.max(0, Math.min(100, isFinite(percent) ? percent : 0))
  return (
    <div className="w-full">
      <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
          style={{ width: `${safePct}%` }}
        />
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>
          {current.toLocaleString()} ml
        </span>
        <span>
          目标 {goal.toLocaleString()} ml
        </span>
      </div>
    </div>
  )
}
