import { ref, onUnmounted } from 'vue'
import { useHikeStore } from 'src/stores/hike'
import { mockCurrentBiometric, mockAiDecision } from 'src/mocks/biometrics'

export function useBiometric() {
  const hikeStore = useHikeStore()
  const current = ref({ ...mockCurrentBiometric })
  let intervalId: ReturnType<typeof setInterval> | null = null

  function startSimulation() {
    hikeStore.updateBiometrics(mockCurrentBiometric)
    hikeStore.setAiDecision(mockAiDecision)

    intervalId = setInterval(() => {
      current.value = {
        timestamp: Date.now(),
        heartRate: Math.round(100 + Math.random() * 30),
        steps: current.value.steps + Math.round(Math.random() * 15 + 5),
        altitude: current.value.altitude + Math.round(Math.random() * 5 - 1),
        speed: parseFloat((1.5 + Math.random() * 2).toFixed(1)),
      }
      hikeStore.updateBiometrics(current.value)
    }, 4000)
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
