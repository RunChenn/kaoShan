import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BiometricSnapshot, AiDecision } from 'src/mocks/biometrics'

export interface Position {
  lng: number
  lat: number
  altitude: number
  accuracy: number
}

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'foggy' | 'storm'

export interface LiveWeather {
  condition: WeatherCondition
  temp: number
  windSpeed: number
  humidity: number
  riskLevel: 'low' | 'medium' | 'high'
}

export const useHikeStore = defineStore('hike', () => {
  const isHiking = ref(false)
  const currentPosition = ref<Position | null>(null)
  const track = ref<[number, number][]>([])
  const biometrics = ref<BiometricSnapshot | null>(null)
  const deviationAlert = ref(false)
  const aiDecision = ref<AiDecision | null>(null)
  const familyWatchEnabled = ref(false)

  // 天氣相關
  const liveWeather = ref<LiveWeather>({
    condition: 'sunny',
    temp: 16,
    windSpeed: 10,
    humidity: 65,
    riskLevel: 'low',
  })
  const weatherAlert = ref<{ type: 'thunder' | 'rain' | 'fog'; message: string } | null>(null)

  // 疲勞指數 (0-100)
  const fatigueIndex = ref(18)
  const speedHistory = ref<number[]>([2.8, 2.6, 2.5, 2.3, 2.1, 1.9])

  // 離線模式
  const isOfflineMode = ref(false)

  // 統計
  const deviationCount = ref(0)
  const alertCount = ref(0)
  const elapsedMinutes = ref(0)

  function startHike() {
    isHiking.value = true
    deviationCount.value = 0
    alertCount.value = 0
    elapsedMinutes.value = 0
  }

  function stopHike() {
    isHiking.value = false
  }

  function updatePosition(pos: Position) {
    currentPosition.value = pos
    track.value.push([pos.lng, pos.lat])
  }

  function updateBiometrics(data: BiometricSnapshot) {
    biometrics.value = data
    // 更新速度歷史（最多 10 筆）
    speedHistory.value.push(data.speed)
    if (speedHistory.value.length > 10) speedHistory.value.shift()
    // 計算疲勞指數
    const avgSpeed = speedHistory.value.reduce((a, b) => a + b, 0) / speedHistory.value.length
    const hrFactor = Math.max(0, (data.heartRate - 100) / 60) // 0-1 when HR 100-160
    const speedFactor = Math.max(0, 1 - avgSpeed / 3.0) // 0-1 as speed drops
    fatigueIndex.value = Math.round(Math.min(100, (hrFactor * 50 + speedFactor * 50)))
  }

  function setAiDecision(decision: AiDecision) {
    aiDecision.value = decision
  }

  function setDeviationAlert(active: boolean) {
    deviationAlert.value = active
    if (active) {
      deviationCount.value++
      alertCount.value++
    }
  }

  function setWeatherAlert(alert: { type: 'thunder' | 'rain' | 'fog'; message: string } | null) {
    weatherAlert.value = alert
    if (alert) alertCount.value++
  }

  function clearWeatherAlert() {
    weatherAlert.value = null
  }

  function updateWeather(w: Partial<LiveWeather>) {
    liveWeather.value = { ...liveWeather.value, ...w }
  }

  function toggleFamilyWatch() {
    familyWatchEnabled.value = !familyWatchEnabled.value
  }

  function toggleOfflineMode() {
    isOfflineMode.value = !isOfflineMode.value
  }

  function incrementElapsed() {
    elapsedMinutes.value++
  }

  return {
    isHiking,
    currentPosition,
    track,
    biometrics,
    deviationAlert,
    aiDecision,
    familyWatchEnabled,
    liveWeather,
    weatherAlert,
    fatigueIndex,
    speedHistory,
    isOfflineMode,
    deviationCount,
    alertCount,
    elapsedMinutes,
    startHike,
    stopHike,
    updatePosition,
    updateBiometrics,
    setAiDecision,
    setDeviationAlert,
    setWeatherAlert,
    clearWeatherAlert,
    updateWeather,
    toggleFamilyWatch,
    toggleOfflineMode,
    incrementElapsed,
  }
})
