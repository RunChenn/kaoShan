import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface HikeHistory {
  id: string
  date: string
  routeName: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  distanceKm: number
  durationMin: number
  elevationGain: number
  calories: number
  maxRiskScore: number
  riskCurve: number[]
  deviationCount?: number
  alertCount?: number
  maxHeartRate?: number
  lowestSpeed?: number
  restStops?: number
  routeScore?: number
  predictedDurationMin?: number
  predictedMaxHR?: number
}

export interface HikeEvents {
  deviationCount: number
  alertCount: number
  maxHeartRate: number
  lowestSpeed: number
  restStops: number
  routeScore: number  // 0-10
}

export interface BaselineComparison {
  predictedDurationMin: number
  actualDurationMin: number
  predictedMaxHR: number
  actualMaxHR: number
  performance: 'ahead' | 'on_track' | 'behind'
  performanceLabel: string
}

export const useAfterStore = defineStore('after', () => {
  const currentSummary = ref<HikeHistory | null>(null)
  const history = ref<HikeHistory[]>([])
  const riskCurveData = ref<number[]>([])
  const events = ref<HikeEvents | null>(null)
  const baseline = ref<BaselineComparison | null>(null)

  function setSummary(data: HikeHistory) {
    currentSummary.value = data
    riskCurveData.value = data.riskCurve

    // 自動生成事件回顧
    events.value = {
      deviationCount: data.deviationCount ?? 2,
      alertCount: data.alertCount ?? 3,
      maxHeartRate: data.maxHeartRate ?? 158,
      lowestSpeed: data.lowestSpeed ?? 0.8,
      restStops: data.restStops ?? 4,
      routeScore: data.routeScore ?? 7,
    }

    // 自動生成基線比較
    const predicted = data.predictedDurationMin ?? Math.round(data.durationMin * 1.08)
    const diff = (data.durationMin - predicted) / predicted
    baseline.value = {
      predictedDurationMin: predicted,
      actualDurationMin: data.durationMin,
      predictedMaxHR: data.predictedMaxHR ?? 140,
      actualMaxHR: data.maxHeartRate ?? 158,
      performance: diff < -0.05 ? 'ahead' : diff > 0.05 ? 'behind' : 'on_track',
      performanceLabel: diff < -0.05 ? '超越預期' : diff > 0.05 ? '低於預期' : '符合預期',
    }
  }

  function setHistory(items: HikeHistory[]) {
    history.value = items
  }

  return { currentSummary, history, riskCurveData, events, baseline, setSummary, setHistory }
})
