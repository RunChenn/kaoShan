<template>
  <q-page class="hike-status-bg" style="min-height: 100dvh">
    <!-- 頂部導航 -->
    <div class="row items-center q-pa-md q-pt-safe">
      <q-btn
        flat
        round
        icon="arrow_back"
        color="white"
        @click="$router.back()"
      />
      <div class="text-h6 text-white text-weight-bold q-ml-sm">登山狀態</div>
      <q-space />
      <q-btn
        flat
        round
        icon="record_voice_over"
        color="white"
        @click="speakStatus"
      >
        <q-tooltip class="bg-dark">語音播報</q-tooltip>
      </q-btn>
      <q-btn
        flat
        round
        icon="map"
        color="white"
        @click="$router.push('/hike/map')"
      />
    </div>

    <div class="q-px-md q-pb-xl">
      <!-- 即時天氣條 -->
      <div class="weather-bar row items-center q-pa-sm q-mb-md rounded-borders">
        <q-icon :name="weatherIcon" color="white" size="20px" class="q-mr-sm" />
        <span class="text-white text-weight-medium">{{
          conditionLabel[hikeStore.liveWeather.condition]
        }}</span>
        <span class="text-white opacity-80 q-ml-sm"
          >{{ hikeStore.liveWeather.temp }}°C</span
        >
        <q-space />
        <q-icon name="air" color="white" size="16px" class="q-mr-xs" />
        <span class="text-white text-caption"
          >{{ hikeStore.liveWeather.windSpeed }}km/h</span
        >
        <q-badge
          class="q-ml-sm"
          :color="weatherRiskColor"
          :label="weatherRiskLabel"
        />
      </div>

      <!-- 生理儀表板 -->
      <div class="text-caption text-white opacity-70 q-mb-sm">即時生理數據</div>
      <div class="row q-gutter-sm q-mb-md">
        <BiometricCard
          icon="monitor_heart"
          label="心率"
          :value="biometrics?.heartRate ?? '--'"
          unit="bpm"
          :alert="(biometrics?.heartRate ?? 0) > 130"
          class="col"
        />
        <BiometricCard
          icon="directions_walk"
          label="步數"
          :value="biometrics?.steps?.toLocaleString() ?? '--'"
          unit="步"
          class="col"
        />
        <BiometricCard
          icon="terrain"
          label="海拔"
          :value="biometrics?.altitude ?? '--'"
          unit="m"
          class="col"
        />
      </div>

      <!-- 疲勞指數 -->
      <div class="text-caption text-white opacity-70 q-mb-sm">疲勞指數監測</div>
      <q-card class="fatigue-card q-mb-md">
        <q-card-section>
          <div class="row items-center q-mb-sm">
            <q-icon
              name="battery_alert"
              :color="fatigueColor"
              size="24px"
              class="q-mr-sm"
            />
            <div
              class="text-subtitle1 text-weight-bold"
              :class="`text-${fatigueColor}`"
            >
              疲勞指數 {{ hikeStore.fatigueIndex }}%
            </div>
            <q-space />
            <q-badge :color="fatigueColor" :label="fatigueLabel" />
          </div>
          <q-linear-progress
            :value="hikeStore.fatigueIndex / 100"
            :color="fatigueColor"
            track-color="grey-3"
            rounded
            size="12px"
            class="q-mb-sm"
          />
          <div class="row justify-between text-caption text-grey-6">
            <span>正常</span>
            <span>偏高</span>
            <span>危險</span>
          </div>

          <!-- 速度趨勢 -->
          <div class="q-mt-md">
            <div class="text-caption text-grey-6 q-mb-xs">
              速度趨勢（最近 6 筆）
            </div>
            <div class="speed-trend row items-end q-gutter-xs">
              <div
                v-for="(s, i) in hikeStore.speedHistory"
                :key="i"
                class="speed-bar"
                :style="`height:${Math.round((s / 4) * 40) + 4}px`"
                :class="
                  i === hikeStore.speedHistory.length - 1
                    ? 'speed-bar-current'
                    : ''
                "
              />
            </div>
            <div class="row justify-between text-caption text-grey-5 q-mt-xs">
              <span>早前</span>
              <span>{{ biometrics?.speed ?? 2.3 }} km/h（現在）</span>
            </div>
          </div>

          <q-banner
            v-if="hikeStore.fatigueIndex > 60"
            class="bg-negative text-white rounded-borders q-mt-sm"
            rounded
          >
            <template #avatar><q-icon name="warning" /></template>
            速度持續下降且心率偏高，建議立即休息補充能量
          </q-banner>
        </q-card-section>
      </q-card>

      <!-- AI 決策面板 -->
      <div class="text-caption text-white opacity-70 q-mb-sm">AI 分析建議</div>
      <q-card class="ai-panel q-mb-md">
        <q-card-section>
          <div class="row items-center q-mb-md">
            <div class="ai-action-icon" :class="`bg-${actionConfig.color}`">
              <q-icon :name="actionConfig.icon" color="white" size="28px" />
            </div>
            <div class="q-ml-md">
              <div
                class="text-h6 text-weight-bold"
                :class="`text-${actionConfig.color}`"
              >
                {{ actionConfig.label }}
              </div>
              <div class="text-caption text-grey-6">
                信心度 {{ aiDecision?.confidence }}%
              </div>
            </div>
            <q-space />
            <q-circular-progress
              :value="aiDecision?.confidence ?? 0"
              size="48px"
              :color="actionConfig.color"
              track-color="grey-3"
              show-value
              class="text-caption text-weight-bold"
            />
          </div>

          <q-linear-progress
            :value="(aiDecision?.riskScore ?? 0) / 100"
            :color="riskColor"
            track-color="grey-3"
            rounded
            size="8px"
            class="q-mb-xs"
          />
          <div class="row justify-between text-caption text-grey-6 q-mb-sm">
            <span>安全等級評分</span>
            <span :class="`text-${riskColor}`"
              >{{ aiDecision?.riskScore ?? 0 }}/100</span
            >
          </div>

          <div class="ai-reason text-body2 text-grey-8">
            {{ aiDecision?.reason }}
          </div>
        </q-card-section>
      </q-card>

      <!-- 家人守護 Banner -->
      <q-card class="family-banner q-mb-md">
        <q-card-section class="row items-center q-pa-md">
          <q-icon
            name="family_restroom"
            color="primary"
            size="24px"
            class="q-mr-md"
          />
          <div class="col">
            <div class="text-subtitle2 text-weight-bold">家人守護模式</div>
            <div class="text-caption text-grey-6">
              {{
                familyWatch
                  ? '位置分享已開啟，家人可即時追蹤'
                  : '開啟後家人可即時看到您的位置'
              }}
            </div>
          </div>
          <q-toggle
            v-model="familyWatch"
            color="primary"
            @update:model-value="hikeStore.toggleFamilyWatch"
          />
        </q-card-section>
        <q-slide-transition>
          <div v-if="familyWatch" class="q-px-md q-pb-sm">
            <q-linear-progress indeterminate color="primary" size="2px" />
            <div class="text-caption text-primary q-mt-xs">
              正在傳送位置給 3 位家人...
            </div>
          </div>
        </q-slide-transition>
      </q-card>

      <!-- 行程計時 -->
      <q-card class="hiking-card q-mb-md">
        <q-card-section class="row q-gutter-md text-center">
          <div class="col">
            <q-icon name="schedule" color="primary" />
            <div class="text-h6 text-weight-bold">{{ formatElapsed }}</div>
            <div class="text-caption text-grey-6">已行進</div>
          </div>
          <div class="col">
            <q-icon name="turn_slight_right" color="secondary" />
            <div class="text-h6 text-weight-bold">
              {{ hikeStore.deviationCount }}
            </div>
            <div class="text-caption text-grey-6">偏離次數</div>
          </div>
          <div class="col">
            <q-icon name="notifications" color="negative" />
            <div class="text-h6 text-weight-bold">
              {{ hikeStore.alertCount }}
            </div>
            <div class="text-caption text-grey-6">警報次數</div>
          </div>
        </q-card-section>
      </q-card>

      <!-- SOS 快捷 -->
      <q-btn
        unelevated
        size="lg"
        color="negative"
        icon="sos"
        label="緊急求救"
        class="full-width"
        @click="$router.push('/hike/sos')"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import BiometricCard from 'src/components/BiometricCard.vue';
import { useBiometric } from 'src/composables/useBiometric';
import { conditionIcon, conditionLabel } from 'src/mocks/weather';
import { useHikeStore } from 'src/stores/hike';
import { computed, ref } from 'vue';

const hikeStore = useHikeStore();
const { startSimulation } = useBiometric();
const familyWatch = ref(hikeStore.familyWatchEnabled);

const biometrics = computed(() => hikeStore.biometrics);
const aiDecision = computed(() => hikeStore.aiDecision);

const weatherIcon = computed(
  () => conditionIcon[hikeStore.liveWeather.condition] ?? 'wb_sunny',
);
const weatherRiskColor = computed(
  () =>
    ({ low: 'positive', medium: 'warning', high: 'negative' })[
      hikeStore.liveWeather.riskLevel
    ],
);
const weatherRiskLabel = computed(
  () =>
    ({ low: '低風險', medium: '中風險', high: '高風險' })[
      hikeStore.liveWeather.riskLevel
    ],
);

const fatigueColor = computed(() => {
  const f = hikeStore.fatigueIndex;
  if (f < 30) return 'positive';
  if (f < 60) return 'warning';
  return 'negative';
});
const fatigueLabel = computed(() => {
  const f = hikeStore.fatigueIndex;
  if (f < 30) return '良好';
  if (f < 60) return '偏高';
  return '危險';
});

const actionConfigs = {
  proceed: { label: '繼續前進', icon: 'trending_up', color: 'positive' },
  rest: { label: '建議休息', icon: 'self_improvement', color: 'warning' },
  retreat: { label: '建議折返', icon: 'trending_down', color: 'negative' },
};
const actionConfig = computed(
  () => actionConfigs[aiDecision.value?.action ?? 'rest'],
);
const riskColor = computed(() => {
  const s = aiDecision.value?.riskScore ?? 0;
  if (s < 30) return 'positive';
  if (s < 60) return 'warning';
  return 'negative';
});

const formatElapsed = computed(() => {
  const m = hikeStore.elapsedMinutes;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
});

function speakStatus() {
  if (!('speechSynthesis' in window)) return;
  const bio = biometrics.value;
  const f = hikeStore.fatigueIndex;
  const ai = aiDecision.value;
  const text = `目前心率${bio?.heartRate ?? 0}，疲勞指數${f}%，AI建議：${actionConfig.value.label}。${ai?.reason ?? ''}`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-TW';
  utterance.rate = 0.85;
  speechSynthesis.speak(utterance);
}

startSimulation();
</script>

<style lang="scss" scoped>
.hike-status-bg {
  background: linear-gradient(180deg, #04101c 0%, #081628 50%, #0c1e38 100%);
}

.weather-bar {
  background: rgba(255, 255, 255, 0.09);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  transition: background 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.13);
  }
}

.fatigue-card {
  border-radius: 20px !important;
  border: 1px solid rgba(230, 126, 34, 0.22) !important;
  background: rgba(255, 255, 255, 0.98) !important;
  overflow: hidden;
}

.speed-trend {
  height: 48px;
  align-items: flex-end;
  gap: 3px;
}
.speed-bar {
  width: 20px;
  border-radius: 5px 5px 0 0;
  background: rgba(26, 140, 85, 0.25);
  transition: height 0.45s cubic-bezier(0.34, 1.1, 0.64, 1);
}
.speed-bar-current {
  background: linear-gradient(180deg, #2ecc71, #1a8c55);
  box-shadow: 0 -2px 8px rgba(26, 140, 85, 0.5);
}

.ai-panel {
  border-radius: 20px !important;
  border: 1px solid rgba(26, 140, 85, 0.25) !important;
  background: rgba(255, 255, 255, 0.98) !important;
  overflow: hidden;
}

.ai-action-icon {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.ai-reason {
  background: rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  padding: 12px 14px;
  font-style: italic;
  font-size: 0.85rem;
  line-height: 1.5;
  letter-spacing: 0.06rem;
}

.family-banner {
  border-radius: 18px !important;
  border: 1px solid rgba(26, 140, 85, 0.2) !important;
  overflow: hidden;
}

/* Override hiking-card inside dark bg */
:deep(.hiking-card) {
  background: rgba(255, 255, 255, 0.97) !important;
}
</style>
