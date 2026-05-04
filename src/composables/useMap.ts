import { ref, onUnmounted } from 'vue'
import { trackGeoJSON, heatmapGeoJSON, deviationCircle, mockCurrentPosition } from 'src/mocks/mapData'
import type { Map as MapLibreMap } from 'maplibre-gl'

export function useMap() {
  const map = ref<MapLibreMap | null>(null)
  const mapLoaded = ref(false)

  async function initMap(container: string | HTMLElement) {
    const ml = await import('maplibre-gl')
    const { Map, Marker } = ml

    const instance = new Map({
      container,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [mockCurrentPosition.lng, mockCurrentPosition.lat],
      zoom: 13,
    })

    map.value = instance

    instance.on('load', () => {
      mapLoaded.value = true
      addTrackLayer(instance)
      addHeatmapLayer(instance)
      addDeviationCircle(instance)

      // 使用者標記
      const el = document.createElement('div')
      el.style.cssText = `
        width:24px;height:24px;
        background:#2E7D32;border:3px solid white;
        border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);
      `
      new Marker({ element: el })
        .setLngLat([mockCurrentPosition.lng, mockCurrentPosition.lat])
        .addTo(instance)
    })

    return instance
  }

  function addTrackLayer(m: MapLibreMap) {
    m.addSource('track', { type: 'geojson', data: trackGeoJSON })
    m.addLayer({
      id: 'track-line',
      type: 'line',
      source: 'track',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#1565C0', 'line-width': 4, 'line-opacity': 0.85 },
    })
  }

  function addHeatmapLayer(m: MapLibreMap) {
    m.addSource('heatmap', { type: 'geojson', data: heatmapGeoJSON })
    m.addLayer({
      id: 'risk-heatmap',
      type: 'heatmap',
      source: 'heatmap',
      paint: {
        'heatmap-weight': ['get', 'intensity'],
        'heatmap-intensity': 1.5,
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(0,0,255,0)',
          0.3, 'rgba(255,165,0,0.5)',
          1, 'rgba(198,40,40,0.9)',
        ],
        'heatmap-radius': 40,
        'heatmap-opacity': 0.7,
      },
    })
  }

  function addDeviationCircle(m: MapLibreMap) {
    if (!deviationCircle.active) return
    const circleData = createCircleGeoJSON(deviationCircle.center, deviationCircle.radius)
    m.addSource('deviation', { type: 'geojson', data: circleData })
    m.addLayer({
      id: 'deviation-circle',
      type: 'fill',
      source: 'deviation',
      paint: { 'fill-color': '#C62828', 'fill-opacity': 0.2 },
    })
    m.addLayer({
      id: 'deviation-circle-border',
      type: 'line',
      source: 'deviation',
      paint: { 'line-color': '#C62828', 'line-width': 2 },
    })
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

function createCircleGeoJSON(center: [number, number], radiusInMeters: number): GeoJSON.FeatureCollection {
  const points = 64
  const coords: [number, number][] = []
  const distanceX = radiusInMeters / (111320 * Math.cos((center[1] * Math.PI) / 180))
  const distanceY = radiusInMeters / 110574

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * 2 * Math.PI
    coords.push([center[0] + distanceX * Math.cos(theta), center[1] + distanceY * Math.sin(theta)])
  }
  coords.push(coords[0])

  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [coords] },
    }],
  }
}
