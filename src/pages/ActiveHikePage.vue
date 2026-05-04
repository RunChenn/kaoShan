<template>
  <div class="p2-grid">
    <!-- Map -->
    <div class="p2-map-area">
      <MapPhase2 :theme="appStore.config.theme" />
    </div>

    <!-- Side panel -->
    <aside class="p2-panel">

      <!-- Voice assistant -->
      <div class="card" style="text-align: center">
        <div class="section-label">語音助理</div>
        <button :class="['voice-btn', { listening }]" @click="handleVoice">
          <template v-if="listening"><div class="voice-pulse" />🔴</template>
          <template v-else>🎙</template>
        </button>
        <div v-if="listening" style="font-size: 0.78rem; color: #ef4444; margin-top: 8px; font-weight: 700">聆聽中...</div>
        <div
          v-if="aiReply"
          style="margin-top:10px;padding:9px 12px;background:rgba(34,197,94,0.08);border-radius:10px;border:1px solid rgba(34,197,94,0.2);font-size:0.8rem;color:var(--text-secondary);text-align:left;animation:fadeInUp 0.3s ease"
        >
          🤖 {{ aiReply }}
        </div>
      </div>

      <!-- Alert -->
      <div :class="['alert-banner', `alert-${alert.type}`]" style="animation: fadeInUp 0.4s ease">
        <span>{{ alert.icon }}</span>
        <span style="flex: 1">{{ alert.text }}</span>
      </div>

      <!-- Live stats -->
      <div class="card">
        <div class="section-label">即時數據</div>
        <div class="live-stats-grid">
          <div v-for="s in statTiles" :key="s.label" class="stat-tile">
            <div style="font-size: 18px; margin-bottom: 2px">{{ s.icon }}</div>
            <div class="stat-value" :key="s.value" style="color: var(--text-primary); animation: countUp 0.3s ease">
              {{ s.value }}
            </div>
            <div class="stat-unit">{{ s.unit }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <!-- Fatigue -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
          <div class="section-label" style="margin-bottom: 0">疲勞指數</div>
          <span style="font-size: 1rem; font-weight: 900" :style="{ color: fatigueColor }">{{ Math.round(fatigue) }}%</span>
        </div>
        <div class="fatigue-track">
          <div class="fatigue-fill" :style="{ width: `${fatigue}%`, background: fatigueColor }" />
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px">
          {{ fatigue < 30 ? '✅ 體力良好，繼續保持' : fatigue < 60 ? '⚠ 建議補充能量棒與水分' : '🔴 建議立即休息 10 分鐘' }}
        </div>
      </div>

      <!-- Risk level -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
          <div class="section-label" style="margin-bottom: 0">即時風險</div>
          <span :class="['badge', `badge-${riskLevel}`]">
            {{ riskLevel === 'low' ? '低風險' : riskLevel === 'mid' ? '中風險' : '高風險' }}
          </span>
        </div>
        <div style="height: 6px; border-radius: 99px; background: var(--border)">
          <div :style="{
            height: '100%', borderRadius: '99px',
            width: riskLevel === 'low' ? '30%' : riskLevel === 'mid' ? '62%' : '90%',
            background: `var(--risk-${riskLevel})`,
            transition: 'all 0.5s var(--ease-out)'
          }" />
        </div>
      </div>

      <!-- Timeline -->
      <div class="card">
        <div class="section-label">今日行程</div>
        <div class="timeline">
          <div
            v-for="n in TIMELINE_NODES"
            :key="n.place"
            class="tl-item"
            :class="{ done: n.status === 'done' }"
          >
            <div class="tl-dot" :class="`tl-dot-${n.status}`">
              <svg v-if="n.status === 'done'" width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="tl-text">
              <div class="tl-time">{{ n.time }}</div>
              <div class="tl-place">{{ n.place }} {{ n.note || '' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- SOS -->
      <div class="sos-btn-wrap">
        <div class="sos-ring" />
        <button class="sos-btn" @click="handleSOS">🆘 緊急求救 SOS</button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAppStore } from 'src/stores/app'
import { TIMELINE_NODES, ALERTS_BY_RISK, AI_REPLIES } from 'src/data/hikingRoutes'
import MapPhase2 from 'src/components/MapPhase2.vue'

const appStore = useAppStore()
const riskLevel = computed(() => appStore.config.risk)
const alert     = computed(() => ALERTS_BY_RISK[riskLevel.value] ?? ALERTS_BY_RISK.low)

const listening = ref(false)
const aiReply   = ref<string | null>(null)
const fatigue   = ref(42)
const liveStats = ref({ alt: 2340, spd: 2.3, hr: 118, temp: 14 })

const statTiles = computed(() => [
  { icon: '🏔', label: '海拔', value: liveStats.value.alt, unit: 'm' },
  { icon: '💨', label: '速度', value: liveStats.value.spd, unit: 'km/h' },
  { icon: '❤',  label: '心率', value: liveStats.value.hr,  unit: 'bpm' },
  { icon: '🌡', label: '溫度', value: liveStats.value.temp, unit: '°C' },
])

const fatigueColor = computed(() =>
  fatigue.value < 30 ? 'var(--risk-low)' : fatigue.value < 60 ? 'var(--risk-mid)' : 'var(--risk-high)'
)

let liveTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  liveTimer = setInterval(() => {
    liveStats.value = {
      alt:  Math.round(liveStats.value.alt  + (Math.random() * 20 - 8)),
      spd:  +((liveStats.value.spd + (Math.random() * 0.4 - 0.2)).toFixed(1)),
      hr:   Math.round(liveStats.value.hr   + (Math.random() * 6 - 3)),
      temp: +((liveStats.value.temp + (Math.random() * 0.6 - 0.3)).toFixed(1)),
    }
    fatigue.value = Math.min(95, Math.max(10, fatigue.value + (Math.random() * 3 - 0.5)))
  }, 4000)
})

onUnmounted(() => { if (liveTimer) clearInterval(liveTimer) })

function handleVoice() {
  if (listening.value) return
  listening.value = true
  aiReply.value = null
  setTimeout(() => {
    listening.value = false
    aiReply.value = AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)]
  }, 2500)
}

function handleSOS() {
  if (window.confirm('確定要發送 SOS 緊急求救訊號嗎？\n這將通知救援單位及緊急聯絡人。')) {
    window.alert('✅ SOS 訊號已發送！救援單位正在處理，請保持冷靜，原地等待救援。')
  }
}
</script>
