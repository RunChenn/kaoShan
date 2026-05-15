import { onUnmounted, ref } from 'vue'
import { useHikeStore } from 'src/stores/hike'

export interface BiometricSnapshot {
  timestamp: number
  heartRate: number
  steps: number
  altitude: number
  speed: number
}

export interface AiDecision {
  action: 'proceed' | 'rest' | 'retreat'
  confidence: number
  reason: string
  riskScore: number
}

const EMPTY_BIOMETRIC: BiometricSnapshot = {
  timestamp: Date.now(),
  heartRate: 0,
  steps: 0,
  altitude: 0,
  speed: 0,
}

export function useBiometric() {
  const hikeStore = useHikeStore()
  const current = ref<BiometricSnapshot>({ ...EMPTY_BIOMETRIC })
  let intervalId: ReturnType<typeof setInterval> | null = null

  function startSimulation() {
    hikeStore.updateBiometrics(current.value)
    if (hikeStore.aiDecision === null) {
      hikeStore.setAiDecision(null)
    }
  }

  function stopSimulation() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  onUnmounted(stopSimulation)

  return { current, startSimulation, stopSimulation }
}
