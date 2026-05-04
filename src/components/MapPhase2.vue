<template>
  <div ref="mapEl" style="width: 100%; height: 100%" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import { ROUTES } from 'src/data/hikingRoutes'

const props = defineProps<{ theme: 'dark' | 'light' }>()

const mapEl   = ref<HTMLDivElement>()
let map: L.Map | null = null
let liveMarker: L.Marker | null = null
let timer: ReturnType<typeof setInterval> | null = null
let posIdx = 0
const routePts = ROUTES[0].polyline

onMounted(() => {
  if (!mapEl.value) return
  map = L.map(mapEl.value, { zoomControl: false, attributionControl: false })
  const tile = props.theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  L.tileLayer(tile, { subdomains: 'abcd', maxZoom: 16 }).addTo(map)
  L.control.zoom({ position: 'bottomright' }).addTo(map)

  L.polyline(routePts as L.LatLngExpression[], { color: '#00e888', weight: 3, opacity: 0.7, dashArray: '6 4' }).addTo(map)
  L.marker(routePts[0] as L.LatLngExpression, {
    icon: L.divIcon({ html: '<div style="font-size:20px">⛺</div>', iconSize: [24,24], iconAnchor: [12,12], className: '' })
  }).addTo(map)
  L.marker(routePts[routePts.length - 1] as L.LatLngExpression, {
    icon: L.divIcon({ html: '<div style="font-size:20px">🏔</div>', iconSize: [24,24], iconAnchor: [12,12], className: '' })
  }).addTo(map)

  const glowIcon = L.divIcon({
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#00e888;box-shadow:0 0 12px #00e888,0 0 0 6px rgba(0,232,136,0.3)"></div>`,
    iconSize: [18,18], iconAnchor: [9,9], className: ''
  })
  liveMarker = L.marker(routePts[0] as L.LatLngExpression, { icon: glowIcon }).addTo(map)
  map.fitBounds(routePts as L.LatLngBoundsExpression, { padding: [30, 30] })

  timer = setInterval(() => {
    posIdx = (posIdx + 1) % routePts.length
    liveMarker?.setLatLng(routePts[posIdx] as L.LatLngExpression)
  }, 4000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (map) { map.remove(); map = null }
})
</script>
