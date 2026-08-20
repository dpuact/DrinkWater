import { Navigate, Route, Routes } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import BottomNavigation from './components/BottomNavigation'
import Home from './pages/Home'
import Statistics from './pages/Statistics'
import Records from './pages/Records'
import Settings from './pages/Settings'
import { useWaterRecords } from './hooks/useWaterRecords'
import { useSettings } from './hooks/useSettings'
import { useTheme } from './hooks/useTheme'

function Onboarding({ onStart }: { onStart: (goal: number) => void | Promise<void> }) {
  const [step, setStep] = useState<'welcome' | 'goal'>('welcome')
  const [goal, setGoal] = useState('2000')

  return (
    <div className="page-container">
      <div className="app-shell px-6 flex flex-col items-center justify-center min-h-[100dvh] text-center -mt-16">
        {step === 'welcome' ? (
          <>
            <div className="text-7xl mb-6">💧</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">喝水记录</h1>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              简单记录每一次喝水。
              <br />
              每天喝多少，一目了然。
            </p>
            <button
              type="button"
              onClick={() => setStep('goal')}
              className="btn-primary w-full max-w-xs h-14 mt-12 text-lg"
            >
              开始使用
            </button>
          </>
        ) : (
          <>
            <div className="text-5xl mb-6">🎯</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">你的每日饮水目标</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              之后可以随时在「设置」中修改
            </p>
            <div className="flex items-center gap-2 w-full max-w-xs">
              <input
                type="number"
                min={500}
                max={10000}
                autoFocus
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="input-field flex-1 text-xl text-center h-16"
              />
              <span className="text-gray-500 dark:text-gray-400 text-lg">ml</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const n = Number(goal)
                const ok = isFinite(n) && Number.isInteger(n) && n >= 500 && n <= 10000 ? n : 2000
                onStart(ok)
              }}
              className="btn-primary w-full max-w-xs h-14 text-lg mt-8"
            >
              开始记录
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const {
    todayRecords,
    allRecords,
    loading: loadingRec,
    add,
    update,
    remove,
    importJson,
    clearAll,
    undoLast,
  } = useWaterRecords()

  const {
    settings,
    loading: loadingSettings,
    update: updateSettings,
  } = useSettings()

  useTheme(settings?.theme)

  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [installReady, setInstallReady] = useState<any>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallReady(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    const saved = localStorage.getItem('dw_install_prompt_dismissed')
    if (!saved) {
      const t = setTimeout(() => setShowInstallPrompt(true), 8000)
      return () => {
        clearTimeout(t)
        window.removeEventListener('beforeinstallprompt', handler)
      }
    }
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismissInstall = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('dw_install_prompt_dismissed', '1')
  }

  const doInstall = async () => {
    if (installReady && typeof installReady.prompt === 'function') {
      await installReady.prompt()
    }
    dismissInstall()
  }

  const finishOnboarding = useCallback(
    (goal: number) => {
      void updateSettings({ onboardingDone: true, dailyGoal: goal })
    },
    [updateSettings]
  )

  // Wait for loading to complete before deciding to show onboarding
  const showOnboarding = !loadingSettings && !loadingRec && settings && !settings.onboardingDone

  if (loadingRec || loadingSettings || !settings) {
    return (
      <div className="page-container">
        <div className="app-shell flex items-center justify-center min-h-[100dvh]">
          <div className="text-center text-gray-400">
            <div className="text-5xl mb-3 animate-pulse">💧</div>
            <div className="text-sm">加载中...</div>
          </div>
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return <Onboarding onStart={(goal) => finishOnboarding(goal)} />
  }

  return (
    <div className="min-h-full">
      <Routes>
        <Route
          path="/"
          element={
            <Home
              records={todayRecords}
              settings={settings}
              onAdd={add}
              onUpdate={update}
              onRemove={remove}
              onUndo={undoLast}
            />
          }
        />
        <Route path="/stats" element={<Statistics allRecords={allRecords} settings={settings} />} />
        <Route path="/records" element={<Records allRecords={allRecords} onUpdate={update} onRemove={remove} />} />
        <Route
          path="/settings"
          element={
            <Settings
              settings={settings}
              records={allRecords}
              onUpdateSettings={updateSettings}
              onImportRecords={importJson}
              onClearAll={clearAll}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNavigation />

      {showInstallPrompt && (
        <div
          className="fixed bottom-[4.5rem] left-1/2 -translate-x-1/2 z-40 w-full max-w-[480px] px-4"
          style={{ paddingBottom: 'var(--safe-area-inset-bottom)' }}
        >
          <div className="bg-primary-500/95 text-white rounded-2xl p-4 shadow-xl backdrop-blur">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📱</div>
              <div className="flex-1 text-sm">
                <div className="font-semibold">把「喝水」添加到手机桌面</div>
                <div className="mt-1 text-white/80">以后打开手机就能快速记录喝水。</div>
                {installReady ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={dismissInstall}
                      className="px-3 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
                    >
                      以后再说
                    </button>
                    <button
                      type="button"
                      onClick={doInstall}
                      className="px-4 h-9 rounded-lg bg-white text-primary-600 font-semibold text-sm"
                    >
                      添加到主屏幕
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-white/70">
                    点击浏览器菜单 → 添加到主屏幕
                  </div>
                )}
              </div>
              <button
                type="button"
                aria-label="关闭"
                onClick={dismissInstall}
                className="text-white/70 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
