import { ref, onUnmounted } from 'vue'
import { useHikeStore } from 'src/stores/hike'
import { mockCurrentPosition } from 'src/mocks/mapData'

export function useGeolocation() {
  const hikeStore = useHikeStore()
  const error = ref<string | null>(null)
  let intervalId: ReturnType<typeof setInterval> | null = null

  function startMockTracking() {
    let lng = mockCurrentPosition.lng
    let lat = mockCurrentPosition.lat
    let alt = mockCurrentPosition.altitude

    intervalId = setInterval(() => {
      lng += (Math.random() - 0.48) * 0.0003
      lat += (Math.random() - 0.48) * 0.0003
      alt += Math.random() * 5 - 2

      hikeStore.updatePosition({
        lng,
        lat,
        altitude: Math.round(alt),
        accuracy: Math.round(5 + Math.random() * 10),
      })
    }, 3000)
  }

  function stopTracking() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  onUnmounted(stopTracking)

  return { error, startMockTracking, stopTracking }
}
