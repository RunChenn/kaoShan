<template>
  <div ref="mapEl" style="width: 100%; height: 100%" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import type { HikingRoute } from 'src/data/hikingRoutes'
import { ROUTES } from 'src/data/hikingRoutes'

const props = defineProps<{
  selectedRoute?: HikingRoute
  theme: 'dark' | 'light'
  gpxTrack?: {
    name: string
    points: [number, number][]
  } | null
}>()

const mapEl = ref<HTMLDivElement>()
let map: L.Map | null = null
let layerGroup: L.LayerGroup | null = null

function tileUrl(theme: string) {
  return theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
}

function drawMap() {
  if (!map) return
  if (layerGroup) layerGroup.clearLayers()
  const g = L.layerGroup().addTo(map)
  layerGroup = g

  const route = props.selectedRoute ?? ROUTES[0]
  const bounds = L.latLngBounds([])

  L.polyline(route.polyline, { color: '#00e888', weight: 3, opacity: 0.82 }).addTo(g)
  route.polyline.forEach((point) => bounds.extend(point))
  L.marker(route.start, {
    icon: L.divIcon({ html: '<div style="font-size:22px;line-height:1">⛺</div>', iconSize: [28,28], iconAnchor: [14,14], className: '' })
  }).addTo(g)
  L.marker(route.end, {
    icon: L.divIcon({ html: '<div style="font-size:22px;line-height:1">🏔</div>', iconSize: [28,28], iconAnchor: [14,14], className: '' })
  }).addTo(g)

  if (props.gpxTrack?.points.length) {
    L.polyline(props.gpxTrack.points, {
      color: '#fb923c',
      weight: 4,
      opacity: 0.95,
      dashArray: '8 6',
    }).addTo(g)
    props.gpxTrack.points.forEach((point) => bounds.extend(point))
    L.marker(props.gpxTrack.points[0]!, {
      icon: L.divIcon({ html: '<div class="gpx-marker gpx-marker-start">GPX</div>', iconSize: [42,24], iconAnchor: [21,12], className: '' })
    }).addTo(g)
    L.marker(props.gpxTrack.points[props.gpxTrack.points.length - 1]!, {
      icon: L.divIcon({ html: '<div class="gpx-marker gpx-marker-end">END</div>', iconSize: [42,24], iconAnchor: [21,12], className: '' })
    }).addTo(g)
  }

  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [48, 48] })
  }
}

onMounted(() => {
  if (!mapEl.value) return
  map = L.map(mapEl.value, { zoomControl: false, attributionControl: false })
  L.tileLayer(tileUrl(props.theme), { subdomains: 'abcd', maxZoom: 16 }).addTo(map)
  L.control.zoom({ position: 'bottomright' }).addTo(map)
  drawMap()
})

watch([() => props.selectedRoute, () => props.gpxTrack], () => drawMap(), { deep: true })

onUnmounted(() => { if (map) { map.remove(); map = null } })
</script>

<style scoped>
:deep(.gpx-marker) {
  min-width: 42px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #111827;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);
}

:deep(.gpx-marker-start) {
  background: #fb923c;
}

:deep(.gpx-marker-end) {
  background: #fde68a;
}
</style>
