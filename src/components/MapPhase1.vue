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
}>()

const mapEl = ref<HTMLDivElement>()
let map: L.Map | null = null
let layerGroup: L.LayerGroup | null = null

function tileUrl(theme: string) {
  return theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
}

function drawRoute(r: HikingRoute) {
  if (!map) return
  if (layerGroup) layerGroup.clearLayers()
  const g = L.layerGroup().addTo(map)
  layerGroup = g
  L.polyline(r.polyline, { color: '#00e888', weight: 3, opacity: 0.9 }).addTo(g)
  L.marker(r.start, {
    icon: L.divIcon({ html: '<div style="font-size:22px;line-height:1">⛺</div>', iconSize: [28,28], iconAnchor: [14,14], className: '' })
  }).addTo(g)
  L.marker(r.end, {
    icon: L.divIcon({ html: '<div style="font-size:22px;line-height:1">🏔</div>', iconSize: [28,28], iconAnchor: [14,14], className: '' })
  }).addTo(g)
  map.fitBounds(r.polyline as L.LatLngBoundsExpression, { padding: [40, 40] })
}

onMounted(() => {
  if (!mapEl.value) return
  map = L.map(mapEl.value, { zoomControl: false, attributionControl: false })
  L.tileLayer(tileUrl(props.theme), { subdomains: 'abcd', maxZoom: 16 }).addTo(map)
  L.control.zoom({ position: 'bottomright' }).addTo(map)
  drawRoute(props.selectedRoute ?? ROUTES[0])
})

watch(() => props.selectedRoute, (r) => {
  if (r && map) {
    drawRoute(r)
    map.flyTo(r.center as L.LatLngExpression, 12, { duration: 1 })
  }
})

onUnmounted(() => { if (map) { map.remove(); map = null } })
</script>
