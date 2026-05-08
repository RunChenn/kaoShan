<template>
  <q-page class="hike-map-page">
    <div ref="mapContainer" class="map-container" />

    <!-- Top info chips -->
    <div class="top-bar">
      <div class="info-chips">
        <div class="info-chip">
          <q-icon name="terrain" size="13px" color="white" />
          <span>{{ hikeStore.currentPosition?.altitude ?? 3245 }}m</span>
        </div>
        <div class="info-chip">
          <q-icon name="speed" size="13px" color="white" />
          <span>{{ hikeStore.biometrics?.speed ?? 2.3 }} km/h</span>
        </div>
        <div class="info-chip" :class="weatherChipClass">
          <q-icon :name="weatherIcon" size="13px" color="white" />
          <span>{{ hikeStore.liveWeather.temp }}°C</span>
        </div>
      </div>

      <div class="top-right-controls">
        <q-btn dense round unelevated
               :icon="hikeStore.isOfflineMode ? 'wifi_off' : 'wifi'"
               :color="hikeStore.isOfflineMode ? 'orange' : 'positive'"
               size="sm" class="map-fab q-mr-sm"
               @click="toggleOffline">
          <q-tooltip>{{ hikeStore.isOfflineMode ? '離線模式' : '有訊號' }}</q-tooltip>
        </q-btn>
        <q-btn dense round unelevated
               icon="record_voice_over"
               color="white" text-color="dark"
               size="sm" class="map-fab"
               @click="speakStatus">
          <q-tooltip>語音播報</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Alert banners -->
    <transition name="banner-slide">
      <div v-if="hikeStore.deviationAlert" class="map-banner banner-danger">
        <q-icon name="gps_off" color="white" size="18px" />
        <span class="text-white text-weight-bold" style="font-size:0.85rem">偏離路線警告！請確認位置</span>
        <q-btn flat dense icon="close" color="white" size="sm" class="q-ml-auto"
               @click="hikeStore.setDeviationAlert(false)" />
      </div>
    </transition>
    <transition name="banner-slide">
      <div v-if="hikeStore.weatherAlert" class="map-banner banner-info" style="top:48px">
        <q-icon :name="weatherAlertIcon" color="white" size="18px" />
        <span class="text-white text-weight-bold" style="font-size:0.85rem">{{ hikeStore.weatherAlert.message }}</span>
        <q-btn flat dense icon="close" color="white" size="sm" class="q-ml-auto"
               @click="hikeStore.clearWeatherAlert()" />
      </div>
    </transition>
    <transition name="banner-slide">
      <div v-if="hikeStore.isOfflineMode" class="map-banner banner-offline">
        <q-icon name="wifi_off" color="white" size="16px" />
        <span class="text-white" style="font-size:0.8rem;font-weight:600">離線模式 · 地圖快取中運作</span>
      </div>
    </transition>

    <!-- FAB group -->
    <div class="fab-group">
      <q-btn fab-mini icon="my_location"  color="white" text-color="primary"
             class="map-fab q-mb-sm" @click="centerMap" />
      <q-btn fab-mini icon="add"          color="white" text-color="dark"
             class="map-fab q-mb-sm" @click="zoomIn" />
      <q-btn fab-mini icon="remove"       color="white" text-color="dark"
             class="map-fab" @click="zoomOut" />
    </div>

    <!-- Bottom nav bar -->
    <div class="map-bottom-nav">
      <button class="map-nav-btn" @click="$router.push('/hike/status')">
        <q-icon name="monitor_heart" size="20px" color="white" />
        <span>狀態</span>
      </button>
      <button class="sos-center-btn" @click="$router.push('/hike/sos')">
        <q-icon name="sos" size="22px" color="white" />
      </button>
      <button class="map-nav-btn" @click="$router.push('/')">
        <q-icon name="arrow_back" size="20px" color="white" />
        <span>返回</span>
      </button>
    </div>

    <!-- Sheet toggle -->
    <q-btn v-if="!showSheet" unelevated color="white" text-color="dark"
           icon="expand_less" label="生理摘要"
           class="sheet-toggle-btn" @click="showSheet = true" />

    <!-- Bottom sheet -->
    <q-bottom-sheet v-model="showSheet" seamless>
      <q-card class="sheet-card">
        <div class="sheet-handle" />
        <q-card-section class="q-py-sm q-px-lg">
          <div class="sheet-row">
            <div class="sheet-row-icon ring-danger"><q-icon name="monitor_heart" color="negative" size="18px" /></div>
            <span class="text-subtitle2">心率</span>
            <div class="q-ml-auto row items-center gap-2">
              <span class="text-h6 text-weight-bold text-negative">
                {{ hikeStore.biometrics?.heartRate ?? 118 }}
              </span>
              <span class="text-caption" style="opacity:0.5">bpm</span>
            </div>
          </div>
          <div class="sheet-divider" />
          <div class="sheet-row">
            <div class="sheet-row-icon ring-primary"><q-icon name="directions_walk" color="primary" size="18px" /></div>
            <span class="text-subtitle2">步數</span>
            <span class="text-h6 text-weight-bold q-ml-auto">
              {{ (hikeStore.biometrics?.steps ?? 12450).toLocaleString() }}
            </span>
          </div>
          <div class="sheet-divider" />
          <div class="sheet-row">
            <div class="sheet-row-icon" :class="`ring-${fatigueColor}`">
              <q-icon name="battery_alert" :color="fatigueColor" size="18px" />
            </div>
            <span class="text-subtitle2">疲勞指數</span>
            <div class="q-ml-auto row items-center" style="gap:10px">
              <q-linear-progress
                :value="hikeStore.fatigueIndex / 100"
                :color="fatigueColor"
                track-color="grey-3"
                rounded size="6px"
                style="width:70px"
              />
              <span class="text-subtitle2 text-weight-bold" :class="`text-${fatigueColor}`">
                {{ hikeStore.fatigueIndex }}%
              </span>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-px-lg q-pb-md">
          <q-btn flat label="查看完整狀態" color="primary" style="font-weight:600"
                 @click="$router.push('/hike/status')" />
        </q-card-actions>
      </q-card>
    </q-bottom-sheet>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useHikeStore } from 'src/stores/hike'
import { useMap } from 'src/composables/useMap'
import { useGeolocation } from 'src/composables/useGeolocation'
import { useBiometric } from 'src/composables/useBiometric'
import { conditionIcon as condIcons } from 'src/mocks/weather'

const hikeStore = useHikeStore()
const { initMap, map } = useMap()
const { startMockTracking } = useGeolocation()
const { startSimulation } = useBiometric()
const mapContainer = ref<HTMLElement>()
const showSheet = ref(false)
let weatherTimer: ReturnType<typeof setTimeout> | null = null
let elapsedTimer: ReturnType<typeof setInterval> | null = null

const weatherIcon = computed(() => condIcons[hikeStore.liveWeather.condition] ?? 'wb_sunny')
const weatherChipClass = computed(() => {
  const r = hikeStore.liveWeather.riskLevel
  return r === 'high' ? 'chip-danger' : r === 'medium' ? 'chip-warn' : ''
})
const weatherAlertIcon = computed(() => {
  const t = hikeStore.weatherAlert?.type
  return t === 'thunder' ? 'thunderstorm' : t === 'rain' ? 'grain' : t === 'fog' ? 'foggy' : 'warning'
})
const fatigueColor = computed(() => {
  const f = hikeStore.fatigueIndex
  return f < 30 ? 'positive' : f < 60 ? 'warning' : 'negative'
})

onMounted(async () => {
  if (mapContainer.value) await initMap(mapContainer.value)
  startMockTracking()
  startSimulation()
  hikeStore.startHike()
  setTimeout(() => hikeStore.setDeviationAlert(true), 5000)
  setTimeout(() => hikeStore.setDeviationAlert(false), 10000)
  weatherTimer = setTimeout(() => {
    hikeStore.setWeatherAlert({ type: 'rain', message: '預計 30 分鐘後降雨，請注意路面濕滑' })
  }, 14000)
  setTimeout(() => {
    hikeStore.updateWeather({ condition: 'cloudy', riskLevel: 'medium', temp: 14 })
  }, 20000)
  elapsedTimer = setInterval(() => hikeStore.incrementElapsed(), 60000)
})

onUnmounted(() => {
  hikeStore.stopHike()
  if (weatherTimer) clearTimeout(weatherTimer)
  if (elapsedTimer) clearInterval(elapsedTimer)
})

function centerMap() {
  const pos = hikeStore.currentPosition
  if (pos && map.value) map.value.flyTo({ center: [pos.lng, pos.lat], zoom: 14 })
}
function zoomIn()  { map.value?.zoomIn() }
function zoomOut() { map.value?.zoomOut() }
function toggleOffline() { hikeStore.toggleOfflineMode() }

function speakStatus() {
  if (!('speechSynthesis' in window)) return
  const bio = hikeStore.biometrics
  const text = `目前心率${bio?.heartRate ?? 118}，速度${bio?.speed ?? 2.3}公里，疲勞指數${hikeStore.fatigueIndex}%，請注意體力狀況。`
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'zh-TW'; u.rate = 0.9
  speechSynthesis.speak(u)
}
</script>

<style lang="scss" scoped>
.hike-map-page { height: 100dvh; position: relative; overflow: hidden; }
.map-container { width: 100%; height: 100%; }

// ── Top bar ───────────────────────────────────────────────
.top-bar {
  position: absolute;
  top: 12px; left: 12px; right: 12px;
  display: flex; align-items: flex-start; justify-content: space-between;
  z-index: 10;
}

.info-chips { display: flex; flex-direction: column; gap: 5px; }
.top-right-controls { display: flex; align-items: center; }

.info-chip {
  background: rgba(4, 16, 28, 0.72);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  color: white;
  padding: 5px 12px;
  border-radius: 24px;
  display: flex; align-items: center; gap: 5px;
  font-size: 0.78rem; font-weight: 700;
  border: 1px solid rgba(255,255,255,0.1);
  letter-spacing: 0.06rem;
}

.chip-warn   { background: rgba(200,144,42,0.88) !important; border-color: transparent !important; }
.chip-danger { background: rgba(190,30,30,0.88)  !important; border-color: transparent !important;
               animation: pulse-ring 1.5s infinite; }

.map-fab {
  box-shadow: 0 3px 16px rgba(0,0,0,0.25) !important;
  backdrop-filter: blur(12px);
}

// ── Alert banners ────────────────────────────────────────
.map-banner {
  position: absolute; top: 0; left: 0; right: 0;
  padding: 10px 16px;
  display: flex; align-items: center; gap: 10px;
  z-index: 20;
  font-weight: 600;
}
.banner-danger  {
  background: linear-gradient(90deg, #8B0000, #D93025);
  box-shadow: 0 4px 20px rgba(217,48,37,0.4);
}
.banner-info    {
  background: linear-gradient(90deg, #0D47A1, #1565C0);
  box-shadow: 0 4px 20px rgba(21,101,192,0.35);
}
.banner-offline {
  background: rgba(200,144,42,0.92);
  backdrop-filter: blur(8px);
}

.banner-slide-enter-active, .banner-slide-leave-active { transition: transform 0.3s cubic-bezier(0.34,1.1,0.64,1); }
.banner-slide-enter-from, .banner-slide-leave-to       { transform: translateY(-100%); }

// ── FAB group ────────────────────────────────────────────
.fab-group {
  position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
  display: flex; flex-direction: column; z-index: 10;
}

// ── Bottom nav ────────────────────────────────────────────
.map-bottom-nav {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(4, 16, 28, 0.88);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border-top: 1px solid rgba(255,255,255,0.07);
  padding: 10px 24px max(16px, env(safe-area-inset-bottom));
  display: flex; align-items: center; justify-content: space-around;
  z-index: 10;
}

.map-nav-btn {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.65); font-size: 0.65rem; font-weight: 600;
  padding: 4px 16px; border-radius: 12px;
  transition: all 0.2s ease;
  &:active { transform: scale(0.9); color: white; }
}

.sos-center-btn {
  width: 54px; height: 54px; border-radius: 50%;
  background: linear-gradient(135deg, #8B0000, #D93025);
  border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 20px rgba(217,48,37,0.6), 0 4px 12px rgba(0,0,0,0.3);
  transition: all 0.2s ease;
  &:active { transform: scale(0.93); }
}

// ── Sheet toggle ─────────────────────────────────────────
.sheet-toggle-btn {
  position: absolute; bottom: 84px; right: 16px;
  border-radius: 20px !important; z-index: 10;
  box-shadow: 0 4px 20px rgba(0,0,0,0.22) !important;
  font-size: 0.75rem !important; font-weight: 600 !important;
}

// ── Bottom sheet ─────────────────────────────────────────
.sheet-card { border-radius: 24px 24px 0 0 !important; }
.sheet-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: rgba(0,0,0,0.15); margin: 10px auto 0;
}
.sheet-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0;
}
.sheet-divider { height: 1px; background: rgba(0,0,0,0.06); margin: 0 -4px; }
:global(.body--dark) .sheet-divider { background: rgba(255,255,255,0.05); }

.sheet-row-icon {
  width: 34px; height: 34px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.ring-danger   { background: rgba(217,48,37,0.10); }
.ring-primary  { background: rgba(26,140,85,0.10);  }
.ring-warning  { background: rgba(230,126,34,0.10); }
.ring-positive { background: rgba(46,204,113,0.10); }
.ring-negative { background: rgba(217,48,37,0.10); }
</style>
