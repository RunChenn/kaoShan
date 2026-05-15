import { onUnmounted, ref } from 'vue'
import { useHikeStore } from 'src/stores/hike'

const DEFAULT_POSITION = {
  lng: 121.5654,
  lat: 25.033,
  altitude: 0,
  accuracy: 50,
}

export function useGeolocation() {
  const hikeStore = useHikeStore()
  const error = ref<string | null>(null)
  let watchId: number | null = null

  function startMockTracking() {
    stopTracking()

    if (!navigator.geolocation) {
      error.value = '目前瀏覽器不支援定位'
      hikeStore.updatePosition({ ...DEFAULT_POSITION })
      return
    }

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        error.value = null
        hikeStore.updatePosition({
          lng: position.coords.longitude,
          lat: position.coords.latitude,
          altitude: position.coords.altitude ?? 0,
          accuracy: position.coords.accuracy ?? 0,
        })
      },
      (err) => {
        error.value = err.message
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 15_000,
      },
    )
  }

  function stopTracking() {
    if (watchId != null && navigator.geolocation?.clearWatch) {
      navigator.geolocation.clearWatch(watchId)
    }
    watchId = null
  }

  onUnmounted(stopTracking)

  return { error, startMockTracking, stopTracking }
}
