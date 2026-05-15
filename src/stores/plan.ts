import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import type { RouteViewRoute } from 'src/services/routes'

export interface GearItem {
  name: string
  detected: boolean
  confidence: number
  brand?: string | null
  model?: string | null
  primary_use?: string | null
  waterproof?: boolean | null
  notes?: string | null
}

export interface ProfileForm {
  age: number | null
  weight: number | null
  height: number | null
  level: 'beginner' | 'experienced'
  fitness: number
  targetDays: number
  slopeCoefficient: number  // 坡度係數 1-5（個人能承受的坡度能力）
}

export interface ShoeRecognition {
  item_type: string
  brand: string | null
  model: string | null
  primary_use: string | null
  terrain_suitability: string[]
  waterproof: boolean | null
  ankle_support: string | null
  confidence: number
  notes: string | null
}

export interface GearAssessResponse {
  score: number
  level: string
  summary: string
  tips: string[]
  model_used: string
  fallback?: boolean
}

export interface WeatherForecastData {
  temp: number
  condition: string
  windSpeed: number
  humidity: number
  riskLevel: 'low' | 'medium' | 'high'
  forecast: Array<{
    time: string
    temp: number
    condition: string
    windSpeed: number
    humidity: number
    alert: string
  }>
  departureSuggestion: string
  accidents: Array<{ year: number; type: string; desc: string }>
  source: 'api'
}

export const usePlanStore = defineStore('plan', () => {
  const currentStep = ref(0)

  const profileForm = reactive<ProfileForm>({
    age: null,
    weight: null,
    height: null,
    level: 'beginner',
    fitness: 3,
    targetDays: 1,
    slopeCoefficient: 3,
  })

  const routes = ref<RouteViewRoute[]>([])
  const selectedRouteId = ref<string | null>(null)
  const gearResults = ref<GearItem[]>([])
  const gearPhoto = ref<string | null>(null)
  const gearShoe = ref<ShoeRecognition | null>(null)
  const routeSafety = ref<GearAssessResponse | null>(null)
  const weatherData = ref<WeatherForecastData | null>(null)

  // 保留但標記廢棄，PlanOfflinePage 已不再呼叫
  const offlineProgress = ref(0)
  const offlineStatus = ref<'idle' | 'downloading' | 'done'>('idle')

  // 安全等級評分 (0-100)
  const safetyScore = computed(() => {
    if (!profileForm.age || !profileForm.weight) return null
    let score = profileForm.fitness * 20  // 20-100

    // 登山經驗加成
    if (profileForm.level === 'experienced') score += 15

    // 坡度係數加成
    const slopeBonus = [0, 0, 0, 5, 10, 15]
    score += slopeBonus[profileForm.slopeCoefficient] ?? 0

    // 年齡扣分
    const age = profileForm.age
    if (age > 60) score -= 15
    else if (age > 45) score -= 8
    else if (age < 18) score -= 5

    // 目標天數扣分
    if (profileForm.targetDays > 2) score -= (profileForm.targetDays - 2) * 8

    return Math.max(0, Math.min(100, Math.round(score)))
  })

  const safetyLevel = computed(() => {
    const s = safetyScore.value
    if (s === null) return null
    if (s >= 85) return { label: '高安全', color: 'positive', icon: 'verified' }
    if (s >= 70) return { label: '中高安全', color: 'green-6', icon: 'check_circle' }
    if (s >= 50) return { label: '中安全', color: 'warning', icon: 'info' }
    if (s >= 30) return { label: '中低安全', color: 'orange', icon: 'warning' }
    return { label: '低安全', color: 'negative', icon: 'dangerous' }
  })

  function selectRoute(id: string) {
    selectedRouteId.value = id
  }

  function setGearResults(items: GearItem[]) {
    gearResults.value = items
  }

  function setGearPhoto(base64: string | null) {
    gearPhoto.value = base64
  }

  function setGearShoe(shoe: ShoeRecognition | null) {
    gearShoe.value = shoe
  }

  function setRouteSafety(data: GearAssessResponse | null) {
    routeSafety.value = data
  }

  function setWeatherData(data: WeatherForecastData | null) {
    weatherData.value = data
  }

  /** @deprecated PlanOfflinePage 改用 useOfflinePackage.buildAndSave() */
  function startOfflineDownload() {
    offlineStatus.value = 'downloading'
    offlineProgress.value = 0
    const timer = setInterval(() => {
      offlineProgress.value += Math.random() * 8 + 2
      if (offlineProgress.value >= 100) {
        offlineProgress.value = 100
        offlineStatus.value = 'done'
        clearInterval(timer)
      }
    }, 300)
  }

  return {
    currentStep,
    profileForm,
    routes,
    selectedRouteId,
    gearResults,
    gearPhoto,
    gearShoe,
    routeSafety,
    weatherData,
    offlineProgress,
    offlineStatus,
    safetyScore,
    safetyLevel,
    selectRoute,
    setGearResults,
    setGearPhoto,
    setGearShoe,
    setRouteSafety,
    setWeatherData,
    startOfflineDownload,
  }
})
