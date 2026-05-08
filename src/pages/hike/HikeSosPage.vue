<template>
  <q-page class="sos-page column items-center justify-between">

    <!-- Header -->
    <div class="row full-width items-center q-px-md q-pt-safe">
      <q-btn flat round icon="arrow_back" color="white" style="opacity:0.75" @click="$router.back()" />
      <div class="text-h6 text-white text-weight-bold q-ml-sm" style="letter-spacing: 0.06rem;font-weight:500">
          {{ formatCoords(pos) }}
        </div>
        <div class="text-caption text-white" style="opacity:0.5">
          海拔 {{ pos?.altitude ?? 3245 }}m · 精度 ±{{ pos?.accuracy ?? 8 }}m
        </div>
      </div>

      <!-- Quick call buttons -->
      <div class="row q-gutter-sm">
        <button class="quick-btn col">
          <q-icon name="phone" size="18px" color="white" />
          <span class="text-white text-weight-bold">119</span>
        </button>
        <button class="quick-btn col">
          <q-icon name="phone" size="18px" color="white" />
          <span class="text-white text-weight-bold">110</span>
        </button>
        <button class="quick-btn col" @click="shareLocation">
          <q-icon name="share" size="18px" color="white" />
          <span class="text-white text-weight-bold">分享位置</span>
        </button>
      </div>
    </div>

    <!-- Confirm dialog -->
    <q-dialog v-model="showConfirm" transition-show="jump-up" transition-hide="jump-down">
      <q-card class="sos-dialog">
        <div class="sos-dialog-header">
          <q-icon name="sos" size="2.5rem" color="white" />
          <div class="text-h5 text-white text-weight-bold q-mt-sm" style="letter-spacing: 0.06rem;height:44px;font-weight:600" v-close-popup />
          <q-btn unelevated label="確認發送" color="negative" icon="send" class="col"
                 style="border-radius:12px;height:44px;font-weight:700;box-shadow:0 4px 16px rgba(217,48,37,0.4)"
                 @click="confirmSos" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Success dialog -->
    <q-dialog v-model="showSuccess" transition-show="scale" transition-hide="scale">
      <q-card class="sos-dialog">
        <div class="sos-success-header">
          <div class="success-ring">
            <q-icon name="check" size="2rem" color="white" />
          </div>
          <div class="text-h5 text-white text-weight-bold q-mt-md" style="letter-spacing: 0.06rem;height:46px;font-weight:700;margin:0 auto" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useHikeStore } from 'src/stores/hike'

const hikeStore = useHikeStore()
const pos          = computed(() => hikeStore.currentPosition)
const pressing     = ref(false)
const pressProgress = ref(0)
const showConfirm  = ref(false)
const showSuccess  = ref(false)

let pressTimer: ReturnType<typeof setInterval> | null = null

function startPress() {
  pressing.value = true
  pressProgress.value = 0
  pressTimer = setInterval(() => {
    pressProgress.value += 100 / 30
    if (pressProgress.value >= 100) {
      endPress()
      showConfirm.value = true
    }
  }, 100)
}

function endPress() {
  pressing.value = false
  pressProgress.value = 0
  if (pressTimer) { clearInterval(pressTimer); pressTimer = null }
}

function confirmSos() {
  showConfirm.value = false
  setTimeout(() => { showSuccess.value = true }, 500)
}

function shareLocation() {
  const coord = formatCoords(pos.value)
  if (navigator.share) {
    navigator.share({ title: '我的登山位置', text: `我在：${coord}，海拔 ${pos.value?.altitude}m` })
  }
}

function formatCoords(p: { lng?: number; lat?: number } | null) {
  if (!p) return '23.4700°N, 120.9575°E'
  return `${p.lat?.toFixed(4)}°N, ${p.lng?.toFixed(4)}°E`
}

onUnmounted(endPress)
</script>

<style lang="scss" scoped>
.sos-page {
  min-height: 100dvh;
  background: linear-gradient(160deg, #4A0000 0%, #8B0000 30%, #B71C1C 65%, #C62828 100%);
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 50% 40%, rgba(255,80,80,0.15) 0%, transparent 70%);
    pointer-events: none;
  }
}

.q-pt-safe { padding-top: max(16px, env(safe-area-inset-top, 0px)); }

.sos-status-badge {
  padding: 3px 10px; border-radius: 20px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  color: white; font-size: 0.62rem; font-weight: 800;
  letter-spacing: 0.06rem;
}

.sos-center { position: relative; z-index: 1; }
.sos-hint   { font-size: 0.85rem; letter-spacing: 0.06rem; }

// ── SOS button ────────────────────────────────────────────
.sos-wrapper {
  position: relative;
  width: 210px; height: 210px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; user-select: none; -webkit-user-select: none;
}

.sos-pulse {
  position: absolute; inset: 0; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.2);
  animation: sos-pulse-ring 2.5s ease-out infinite;
}
.sos-pulse-2 { animation-delay: 1.25s; }

@keyframes sos-pulse-ring {
  0%   { transform: scale(1);   opacity: 0.6; }
  100% { transform: scale(1.5); opacity: 0;   }
}

.sos-arc { position: absolute; }

.sos-btn {
  width: 160px; height: 160px; border-radius: 50%;
  background: rgba(255,255,255,0.13);
  border: 3.5px solid rgba(255,255,255,0.75);
  display: flex; align-items: center; justify-content: center;
  box-shadow:
    0 0 50px rgba(255,120,120,0.35),
    0 0 0 8px rgba(255,255,255,0.05),
    inset 0 0 20px rgba(255,255,255,0.06);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  position: relative; z-index: 1;
}

.sos-pressing {
  transform: scale(0.95);
  box-shadow:
    0 0 70px rgba(255,120,120,0.6),
    0 0 0 12px rgba(255,255,255,0.08),
    inset 0 0 30px rgba(255,255,255,0.12) !important;
}

// ── Location card ─────────────────────────────────────────
.location-card {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 20px;
  padding: 16px;
}

.loc-icon-ring {
  width: 32px; height: 32px; border-radius: 10px;
  background: rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center;
}

.gps-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #2ECC71;
  box-shadow: 0 0 0 0 rgba(46,204,113,0.5);
  animation: gps-blink 1.5s ease-in-out infinite;
}
@keyframes gps-blink {
  0%, 100% { box-shadow: 0 0 0 0 rgba(46,204,113,0.5); }
  50%       { box-shadow: 0 0 0 6px rgba(46,204,113,0);   }
}

// ── Quick buttons ─────────────────────────────────────────
.quick-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 12px 8px; border-radius: 16px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  cursor: pointer; font-size: 0.82rem; font-weight: 700;
  backdrop-filter: blur(12px);
  transition: all 0.2s ease;
  &:active { transform: scale(0.95); background: rgba(255,255,255,0.18); }
}

// ── Dialogs ───────────────────────────────────────────────
.sos-dialog { border-radius: 24px !important; overflow: hidden; min-width: 300px; }

.sos-dialog-header {
  background: linear-gradient(135deg, #8B0000, #D93025);
  padding: 28px 24px 20px;
  text-align: center;
}

.sos-success-header {
  background: linear-gradient(135deg, #0D6040, #1A8C55);
  padding: 28px 24px 20px;
  text-align: center;
  display: flex; flex-direction: column; align-items: center;
}

.success-ring {
  width: 64px; height: 64px; border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  animation: breathe-ring 2s ease-in-out infinite;
}
@keyframes breathe-ring {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
  50%       { box-shadow: 0 0 0 12px rgba(255,255,255,0); }
}

.confirm-msg {
  background: rgba(217,48,37,0.06);
  border: 1px solid rgba(217,48,37,0.15);
  border-radius: 12px; padding: 12px 14px;
  font-size: 0.82rem; line-height: 1.6; opacity: 0.8;
}
</style>
