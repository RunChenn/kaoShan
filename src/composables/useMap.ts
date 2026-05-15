import { onUnmounted, ref } from 'vue'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { registerCachedTileProtocol } from 'src/composables/useMapTileCache'

const DEFAULT_CENTER: [number, number] = [121.5654, 25.033]
const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

export function useMap() {
  const map = ref<MapLibreMap | null>(null)
  const mapLoaded = ref(false)

  async function initMap(container: string | HTMLElement) {
    const ml = await import('maplibre-gl')
    const { Map, Marker } = ml

    registerCachedTileProtocol(ml)

    const instance = new Map({
      container,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['cachedosm://{z}/{x}/{y}'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: DEFAULT_CENTER,
      zoom: 13,
    })

    map.value = instance

    instance.on('load', () => {
      mapLoaded.value = true
      addTrackLayer(instance)
      addHeatmapLayer(instance)
      addDeviationCircle(instance)

      const el = document.createElement('div')
      el.style.cssText = `
        width:24px;height:24px;
        background:#2E7D32;border:3px solid white;
        border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);
      `
      new Marker({ element: el }).setLngLat(DEFAULT_CENTER).addTo(instance)
    })

    return instance
  }

  function addTrackLayer(m: MapLibreMap) {
    m.addSource('track', { type: 'geojson', data: EMPTY_FEATURE_COLLECTION })
  }

  function addHeatmapLayer(m: MapLibreMap) {
    m.addSource('heatmap', { type: 'geojson', data: EMPTY_FEATURE_COLLECTION })
  }

  function addDeviationCircle(_m: MapLibreMap) {
    return
  }

  function updateUserPosition(lng: number, lat: number) {
    map.value?.flyTo({ center: [lng, lat], essential: true })
  }

  function destroyMap() {
    if (map.value) {
      map.value.remove()
      map.value = null
      mapLoaded.value = false
    }
  }

  onUnmounted(destroyMap)

  return { map, mapLoaded, initMap, updateUserPosition, destroyMap }
}
