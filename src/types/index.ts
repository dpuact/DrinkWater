export interface WaterRecord {
  id: string
  amount: number
  timestamp: string
  date: string
  createdAt: string
  updatedAt: string
}

export interface UserSettings {
  id: 'settings'
  dailyGoal: number
  quickAmounts: number[]
  reminderEnabled: boolean
  reminderStartTime: string
  reminderEndTime: string
  reminderInterval: number
  theme: 'system' | 'light' | 'dark'
  onboardingDone: boolean
}

export type StatsRange = 'today' | '7days' | '30days'

export interface DailyStat {
  date: string
  total: number
  count: number
}

export interface StatsSummary {
  total: number
  average: number
  maxDay: number
  minDay: number
  achievedDays: number
  achieveRate: number
  daysWithData: number
}

export const DEFAULT_SETTINGS: Omit<UserSettings, 'id'> = {
  dailyGoal: 2000,
  quickAmounts: [100, 150, 200, 250, 300, 500],
  reminderEnabled: false,
  reminderStartTime: '09:00',
  reminderEndTime: '21:00',
  reminderInterval: 90,
  theme: 'system',
  onboardingDone: false,
}

export const RECORDS_TABLE = 'waterRecords'
export const SETTINGS_TABLE = 'settings'
