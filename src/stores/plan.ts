import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import type { HikingRoute } from 'src/mocks/routes'
import type { GearItem } from 'src/mocks/gear'

export interface ProfileForm {
  age: number | null
  weight: number | null
  height: number | null
  level: 'beginner' | 'experienced'
  fitness: number
  targetDays: number
  slopeCoefficient: number  // 坡度係數 1-5（個人能承受的坡度能力）
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

  const routes = ref<HikingRoute[]>([])
  const selectedRouteId = ref<string | null>(null)
  const gearResults = ref<GearItem[]>([])
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
    offlineProgress,
    offlineStatus,
    safetyScore,
    safetyLevel,
    selectRoute,
    setGearResults,
    startOfflineDownload,
  }
})
