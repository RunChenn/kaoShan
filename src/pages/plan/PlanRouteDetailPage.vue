<template>
  <q-page class="route-detail-page q-pb-xl">
    <!-- Premium tab bar -->
    <div class="tab-bar-wrap">
      <div class="tab-bar">
        <button
          v-for="t in tabs"
          :key="t.value"
          class="tab-item"
          :class="{ 'tab-active': tab === t.value }"
          @click="tab = t.value"
        >
          <q-icon :name="t.icon" size="16px" />
          <span>{{ t.label }}</span>
        </button>
      </div>
    </div>

    <!-- ① 路線資訊 -->
    <div v-if="tab === 'info'" class="q-pa-md">
      <div v-if="route">
        <!-- Hero image -->
        <div class="hero-img-wrap anim-fade">
          <q-img :src="route.thumbnail" height="200px" class="hero-img" />
          <div class="hero-img-overlay" />
          <div class="hero-img-content">
            <div
              class="text-h5 text-white text-weight-bold"
              style="letter-spacing: 0.06rem; line-height: 1.7"
        >
          {{ route.description }}
        </div>

        <!-- Stat row -->
        <div
          class="row q-gutter-sm q-mb-lg anim-slide-up"
          style="animation-delay: 0.04s"
        >
          <q-card class="stat-mini col hiking-card text-center">
            <q-card-section class="q-pa-sm">
              <div class="stat-ring ring-primary">
                <q-icon name="straighten" color="primary" size="18px" />
              </div>
              <div class="stat-mini-val">{{ route.distanceKm }} km</div>
              <div class="stat-mini-lbl">距離</div>
            </q-card-section>
          </q-card>
          <q-card class="stat-mini col hiking-card text-center">
            <q-card-section class="q-pa-sm">
              <div class="stat-ring ring-primary">
                <q-icon name="schedule" color="primary" size="18px" />
              </div>
              <div class="stat-mini-val">{{ route.estimatedHours }}h</div>
              <div class="stat-mini-lbl">預估</div>
            </q-card-section>
          </q-card>
          <q-card class="stat-mini col hiking-card text-center">
            <q-card-section class="q-pa-sm">
              <div class="stat-ring ring-secondary">
                <q-icon name="terrain" color="secondary" size="18px" />
              </div>
              <div class="stat-mini-val">+{{ route.elevationGain }}m</div>
              <div class="stat-mini-lbl">爬升</div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Risk gauges -->
        <div class="section-label anim-slide-up" style="animation-delay: 0.08s">
          風險評估
        </div>
        <q-card
          class="hiking-card q-mb-lg anim-slide-up"
          style="animation-delay: 0.1s"
        >
          <q-card-section>
            <div class="row justify-around">
              <RiskGauge
                label="滑倒"
                :value="route.risks.slip"
                color="secondary"
                icon="warning"
              />
              <RiskGauge
                label="迷路"
                :value="route.risks.lost"
                color="warning"
                icon="explore_off"
              />
              <RiskGauge
                label="偏離"
                :value="route.risks.deviation"
                color="primary"
                icon="gps_off"
              />
              <RiskGauge
                label="落石"
                :value="route.risks.rockfall ?? 40"
                color="orange"
                icon="landslide"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Accidents -->
        <div class="section-label anim-slide-up" style="animation-delay: 0.12s">
          <q-icon
            name="history_edu"
            color="negative"
            size="16px"
            class="q-mr-xs"
          />歷史事故
        </div>
        <div class="q-mb-lg anim-slide-up" style="animation-delay: 0.14s">
          <q-card
            v-for="(acc, i) in routeWeather?.accidents ?? []"
            :key="i"
            class="hiking-card q-mb-sm accident-card"
          >
            <q-expansion-item
              :label="`${acc.year} · ${acc.type}`"
              header-class="text-weight-medium"
              expand-icon-class="text-negative"
              dense
            >
              <template #header>
                <q-item-section avatar>
                  <div class="acc-icon-ring">
                    <q-icon
                      :name="accidentIcon(acc.type)"
                      color="negative"
                      size="16px"
                    />
                  </div>
                </q-item-section>
                <q-item-section>
                  <q-item-label
                    class="text-weight-bold"
                    style="font-size: 0.85rem; letter-spacing: 0.06rem; line-height: 1.6"
              >
                {{ acc.desc }}
              </div>
            </q-expansion-item>
          </q-card>
        </div>

        <q-btn
          unelevated
          color="primary"
          icon="download"
          label="下載離線包"
          class="full-width btn-glow-primary"
          style="border-radius: 16px; height: 50px; font-weight: 700"
          @click="downloadOfflinePackage"
        />
      </div>
    </div>

    <!-- ② 天氣預報 -->
    <div v-if="tab === 'weather'" class="q-pa-md">
      <div v-if="routeWeather">
        <!-- Current weather hero -->
        <div
          class="weather-hero hiking-card q-mb-lg anim-fade"
          :class="`weather-${routeWeather.condition}`"
        >
          <div class="weather-hero-inner">
            <div class="row items-center">
              <q-icon
                :name="conditionIcon[routeWeather.condition]"
                size="3.5rem"
                color="white"
              />
              <div class="q-ml-lg">
                <div
                  class="text-h3 text-white text-weight-bold"
                  style="letter-spacing: 0.06rem; line-height: 1"
                >
                  {{ routeWeather.temp }}°
                </div>
                <div class="text-subtitle1 text-white" style="opacity: 0.85">
                  {{ conditionLabel[routeWeather.condition] }}
                </div>
              </div>
              <q-space />
              <div class="text-right">
                <div class="weather-meta-chip q-mb-xs">
                  <q-icon name="air" size="13px" />
                  {{ routeWeather.windSpeed }} km/h
                </div>
                <div class="weather-meta-chip q-mb-xs">
                  <q-icon name="water_drop" size="13px" />
                  {{ routeWeather.humidity }}%
                </div>
                <div
                  class="risk-pill"
                  :class="`risk-${routeWeather.riskLevel}`"
                >
                  {{ riskLabel(routeWeather.riskLevel) }}風險
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hourly forecast scroll -->
        <div class="section-label anim-slide-up">逐時預報</div>
        <div
          class="forecast-scroll anim-slide-up"
          style="animation-delay: 0.05s"
        >
          <div
            v-for="pt in routeWeather.forecast"
            :key="pt.time"
            class="forecast-card hiking-card"
            :class="{ 'forecast-alert': !!pt.alert }"
          >
            <div class="text-caption" style="opacity: 0.5">{{ pt.time }}</div>
            <q-icon
              :name="conditionIcon[pt.condition]"
              :color="pt.alert ? 'negative' : conditionColor[pt.condition]"
              size="1.6rem"
            />
            <div class="forecast-temp">{{ pt.temp }}°</div>
            <div class="text-caption" style="opacity: 0.4; font-size: 0.62rem">
              {{ pt.windSpeed }}km/h
            </div>
            <q-badge
              v-if="pt.alert"
              color="negative"
              label="警報"
              class="q-mt-xs"
            />
          </div>
        </div>

        <!-- Alerts -->
        <div
          v-if="activeAlerts.length > 0"
          class="q-mb-lg anim-slide-up"
          style="animation-delay: 0.1s"
        >
          <div class="section-label">
            <q-icon
              name="warning_amber"
              color="negative"
              size="16px"
              class="q-mr-xs"
            />天氣警報
          </div>
          <div
            v-for="(alert, i) in activeAlerts"
            :key="i"
            class="alert-strip q-mb-sm"
          >
            <q-icon name="thunderstorm" color="white" size="18px" />
            <span class="text-white text-body2 text-weight-medium">{{
              alert
            }}</span>
          </div>
        </div>

        <!-- AI suggestion -->
        <div class="section-label anim-slide-up" style="animation-delay: 0.12s">
          <q-icon
            name="assistant"
            color="primary"
            size="16px"
            class="q-mr-xs"
          />AI 出發建議
        </div>
        <q-card
          class="hiking-card departure-card anim-slide-up"
          style="animation-delay: 0.14s"
        >
          <q-card-section>
            <div
              class="text-body2 q-mb-md"
              style="line-height: 1.75; opacity: 0.75"
            >
              {{ routeWeather.departureSuggestion }}
            </div>
            <div class="row q-gutter-sm">
              <div class="time-chip chip-green">
                <q-icon name="wb_sunny" size="14px" />最佳出發：08:00
              </div>
              <div class="time-chip chip-amber">
                <q-icon name="arrow_downward" size="14px" />注意：14:00
              </div>
              <div class="time-chip chip-blue">
                <q-icon name="home" size="14px" />入宿：16:00
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div v-else class="empty-state">
        <q-icon name="cloud_off" size="2.5rem" style="opacity: 0.3" />
        <div class="text-caption q-mt-sm" style="opacity: 0.4">無天氣資料</div>
      </div>
    </div>

    <!-- ③ 裝備確認 -->
    <div v-if="tab === 'gear'" class="q-pa-md">
      <!-- Camera preview -->
      <div class="camera-box anim-fade q-mb-md">
        <div
          v-if="!scanning"
          class="camera-idle column items-center justify-center"
        >
          <div class="camera-icon-ring">
            <q-icon name="photo_camera" size="2rem" color="grey-5" />
          </div>
          <div class="text-caption q-mt-sm" style="opacity: 0.45">
            點擊下方按鈕掃描裝備
          </div>
          <div
            class="text-caption"
            style="
              opacity: 0.28;
              font-size: 0.65rem;
              letter-spacing: 0.06rem;
              margin-top: 2px;
            "
          >
            點擊掃描裝備
          </div>
        </div>
        <div v-else class="camera-scanning column items-center justify-center">
          <div class="scan-ring">
            <div class="scan-ring-inner" />
          </div>
          <div class="text-caption text-primary q-mt-sm text-weight-bold">
            裝備辨識中...
          </div>
        </div>
      </div>

      <input
        ref="gearPhotoInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="onGearPhotoSelected"
      />

      <q-btn
        unelevated
        color="primary"
        icon="photo_camera"
        :label="scanning ? '辨識中...' : '拍照或從相簿上傳辨識裝備'"
        class="full-width btn-glow-primary q-mb-lg"
        style="border-radius: 16px; height: 50px; font-weight: 700"
        :loading="scanning"
        @click="scanGear"
      />

      <div v-if="gearScanned" class="anim-slide-up">
        <q-card v-if="recognizedShoe" class="hiking-card q-mb-md shoe-card">
          <q-card-section class="q-pa-md">
            <div class="row items-start no-wrap">
              <div class="shoe-icon-ring q-mr-md">
                <q-icon name="hiking" color="primary" size="22px" />
              </div>
              <div class="col">
                <div class="section-label q-mb-xs">鞋款辨識</div>
                <div class="shoe-title">
                  {{ recognizedShoe.brand || '品牌未知' }}
                  <span v-if="recognizedShoe.model">
                    · {{ recognizedShoe.model }}
                  </span>
                </div>
                <div class="shoe-meta">
                  {{ recognizedShoe.primary_use || '用途待確認' }}
                  <span v-if="recognizedShoe.waterproof !== null">
                    · {{ recognizedShoe.waterproof ? '防水' : '非防水/未見防水特徵' }}
                  </span>
                </div>
                <div v-if="recognizedShoe.notes" class="shoe-note">
                  {{ recognizedShoe.notes }}
                </div>
              </div>
              <q-badge
                :color="recognizedShoe.confidence >= 0.7 ? 'positive' : 'warning'"
                :label="`${Math.round(recognizedShoe.confidence * 100)}%`"
              />
            </div>
          </q-card-section>
        </q-card>

        <q-card v-if="routeSafety" class="hiking-card q-mb-md route-safety-card">
          <q-card-section class="q-pa-md">
            <div class="row items-center no-wrap q-gutter-md">
              <RiskRing :score="routeSafety.score" />
              <div class="col">
                <div class="section-label q-mb-xs">所選路線安全評估</div>
                <div class="safety-level">{{ routeSafety.level }}</div>
                <div class="safety-summary">{{ routeSafety.summary }}</div>
              </div>
            </div>
            <div class="safety-tips q-mt-md">
              <div
                v-for="tip in routeSafety.tips"
                :key="tip"
                class="safety-tip"
              >
                <q-icon name="task_alt" color="primary" size="15px" />
                <span>{{ tip }}</span>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <div class="section-label q-mb-sm">辨識結果</div>
        <div class="gear-chips q-mb-md">
          <div
            v-for="item in gearResults"
            :key="item.name"
            class="gear-chip"
            :class="item.detected ? 'gear-ok' : 'gear-missing'"
          >
            <q-icon :name="item.detected ? 'check' : 'close'" size="13px" />
            {{ item.name }}
          </div>
        </div>
        <q-btn
          unelevated
          outline
          color="primary"
          icon="refresh"
          label="重新辨識"
          class="full-width q-mb-md"
          style="border-radius: 14px; height: 44px; font-weight: 700"
          @click="resetGearScan"
        />

        <div v-if="missingItems.length > 0" class="alert-strip q-mb-md">
          <q-icon name="warning" color="white" size="18px" />
          <span class="text-white text-body2"
            >缺少 <strong>{{ missingItems.length }}</strong> 項：{{
              missingItems.map((i) => i.name).join('、')
            }}</span
          >
        </div>
        <div v-else class="success-strip q-mb-md">
          <q-icon name="check_circle" color="white" size="18px" />
          <span class="text-white text-body2 text-weight-bold"
            >所有必備裝備已確認！</span
          >
        </div>

        <!-- Body checks -->
        <div class="section-label q-mb-sm">
          <q-icon
            name="health_and_safety"
            color="primary"
            size="16px"
            class="q-mr-xs"
          />出發前身體狀態
        </div>
        <q-card class="hiking-card">
          <q-card-section class="q-pa-md">
            <div
              v-for="check in bodyChecks"
              :key="check.label"
              class="body-check-row"
            >
              <div
                class="check-dot"
                :class="check.ok ? 'dot-ok' : 'dot-fail'"
              />
              <span class="text-body2" :style="check.ok ? '' : 'opacity:0.5'">{{
                check.label
              }}</span>
              <q-icon
                :name="check.ok ? 'check' : 'close'"
                :color="check.ok ? 'positive' : 'negative'"
                size="16px"
                class="q-ml-auto"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- ④ 補給建議 -->
    <div v-if="tab === 'supply'" class="q-pa-md">
      <div v-if="route">
        <!-- Calculation card -->
        <q-card class="hiking-card supply-hero q-mb-lg anim-fade">
          <q-card-section class="q-pa-lg">
            <div class="section-label q-mb-md">
              <q-icon
                name="calculate"
                color="primary"
                size="16px"
                class="q-mr-xs"
              />依行程天數推算
            </div>
            <div class="row q-gutter-sm">
              <div class="supply-big col text-center">
                <div class="supply-icon-ring ring-info">
                  <q-icon name="water_drop" color="info" size="24px" />
                </div>
                <div
                  class="text-h4 text-weight-bold text-info q-mt-xs"
                  style="letter-spacing: 0.06rem; line-height: 1.6">
                {{ s.text }}
              </div>
            </div>
          </q-card-section>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { api } from 'src/boot/axios';
import RiskGauge from 'src/components/RiskGauge.vue';
import RiskRing from 'src/components/RiskRing.vue';
import type { GearItem } from 'src/mocks/gear';
import { mockGearResults } from 'src/mocks/gear';
import { mockRoutes } from 'src/mocks/routes';
import {
  conditionColor,
  conditionIcon,
  conditionLabel,
  mockRouteWeather,
} from 'src/mocks/weather';
import { usePlanStore } from 'src/stores/plan';
import type { ShoeRecognition, GearAssessResponse } from 'src/stores/plan';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const vRoute = useRoute();
const router = useRouter();
const plan = usePlanStore();
const tab = ref('info');
const scanning = ref(false);
const gearScanned = ref(false);
const gearResults = ref(mockGearResults);
const gearPhotoInput = ref<HTMLInputElement>();
const recognizedShoe = ref<ShoeRecognition | null>(null);
const routeSafety = ref<GearAssessResponse | null>(null);

interface GearDetectResponse {
  items: Array<{
    name: string;
    detected: boolean;
    confidence: number;
    brand?: string | null;
    model?: string | null;
    primary_use?: string | null;
    waterproof?: boolean | null;
    notes?: string | null;
  }>;
  missing_count: number;
  model_used: string;
  fallback?: boolean;
  shoe?: ShoeRecognition | null;
}

const route = computed(() => mockRoutes.find((r) => r.id === vRoute.params.id));
const routeWeather = computed(
  () => mockRouteWeather[vRoute.params.id as string] ?? null,
);

// 切換到天氣 tab 時，將資料儲存到 store 供離線包使用
watch(tab, (newTab) => {
  if (newTab === 'weather' && routeWeather.value && !plan.weatherData) {
    plan.setWeatherData({
      ...routeWeather.value,
      source: 'mock',
    })
  }
})
const missingItems = computed(() =>
  gearResults.value.filter((g) => !g.detected),
);
const activeAlerts = computed(
  () =>
    routeWeather.value?.forecast.filter((p) => p.alert).map((p) => p.alert) ??
    [],
);

const targetDays = computed(() => plan.profileForm.targetDays);
const weight = computed(() => plan.profileForm.weight ?? 65);
const waterLiters = computed(() => ((route.value?.days ?? 1) * 3.5).toFixed(1));
const caloriesToday = computed(
  () => 2000 + Math.round((route.value?.elevationGain ?? 0) * 0.5),
);

const supplyCards = computed(() => [
  {
    title: '食物建議',
    icon: 'restaurant',
    color: 'secondary',
    colorKey: 'secondary',
    text: route.value?.supply.food ?? '',
  },
  {
    title: '水量建議',
    icon: 'water_drop',
    color: 'info',
    colorKey: 'info',
    text: route.value?.supply.water ?? '',
  },
  {
    title: '注意事項',
    icon: 'info',
    color: 'primary',
    colorKey: 'primary',
    text: route.value?.supply.notes ?? '',
  },
]);

const bodyChecks = [
  { label: '昨晚睡眠充足（>7 小時）', ok: true },
  { label: '無感冒或發燒症狀', ok: true },
  { label: '未服用影響體力的藥物', ok: true },
  { label: '近期無肌肉拉傷', ok: false },
  { label: '已進食早餐', ok: true },
];

const tabs = [
  { value: 'info', icon: 'info', label: '路線' },
  { value: 'weather', icon: 'cloud', label: '天氣' },
  { value: 'gear', icon: 'backpack', label: '裝備' },
  { value: 'supply', icon: 'restaurant', label: '補給' },
];

function downloadOfflinePackage() {
  if (route.value) {
    plan.selectRoute(route.value.id);
  }
  void router.push('/plan/offline');
}

function accidentIcon(type: string) {
  return (
    (
      {
        滑倒: 'warning',
        迷路: 'explore_off',
        落石: 'landslide',
        高山症: 'medical_services',
        失溫: 'ac_unit',
      } as Record<string, string>
    )[type] ?? 'report_problem'
  );
}
function riskLabel(level: string) {
  return (
    ({ low: '低', medium: '中', high: '高' } as Record<string, string>)[
      level
    ] ?? level
  );
}

function scanGear() {
  if (scanning.value) return;
  gearPhotoInput.value?.click();
}

function resetGearScan() {
  if (scanning.value) return;
  gearScanned.value = false;
  recognizedShoe.value = null;
  routeSafety.value = null;
  gearPhotoInput.value?.click();
}

async function onGearPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || scanning.value) return;

  // 讀取 base64 供離線包使用
  const base64 = await new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

  scanning.value = true;
  gearScanned.value = false;
  routeSafety.value = null;
  try {
    const form = new FormData();
    form.append('image', file);
    const { data } = await api.post<GearDetectResponse>('/gear/detect', form, {
      timeout: 30000,
    });
    recognizedShoe.value = data.shoe ?? null;
    gearResults.value = mergeGearDetectionWithRouteChecklist(data.items);
  } catch (_) {
    recognizedShoe.value = null;
    gearResults.value = mockGearResults;
  } finally {
    scanning.value = false;
    gearScanned.value = true;
    plan.setGearResults(gearResults.value);
    plan.setGearPhoto(base64);
    plan.setGearShoe(recognizedShoe.value);
    await assessSelectedRouteSafety();
  }
}

async function assessSelectedRouteSafety() {
  if (!route.value) return;
  try {
    const { data } = await api.post<GearAssessResponse>('/gear/assess', {
      items: gearResults.value.map((item) => ({
        id: normalizeGearLabel(item.name),
        label: item.name,
        checked: item.detected,
      })),
      route: {
        name: route.value.name,
        risk: routeWeather.value?.riskLevel ?? route.value.difficulty,
        difficulty: route.value.difficulty,
        days: route.value.days,
        distance_km: route.value.distanceKm,
        estimated_hours: route.value.estimatedHours,
        elevation_gain: route.value.elevationGain,
        weather_risk: routeWeather.value?.riskLevel ?? null,
      },
      shoe: recognizedShoe.value,
      user_level: plan.profileForm.level,
      fitness: plan.profileForm.fitness,
      target_days: plan.profileForm.targetDays,
    });
    routeSafety.value = data;
    plan.setRouteSafety(data);
  } catch (_) {
    const fallback = buildLocalSafetyFallback();
    routeSafety.value = fallback;
    plan.setRouteSafety(fallback);
  }
}

function buildLocalSafetyFallback(): GearAssessResponse | null {
  if (!route.value) return null;
  const checked = gearResults.value.filter((item) => item.detected).length;
  const total = gearResults.value.length || 1;
  const difficultyPenalty = {
    easy: 4,
    medium: 12,
    hard: 24,
    expert: 32,
  }[route.value.difficulty];
  const weatherPenalty = {
    low: 0,
    medium: 10,
    high: 18,
  }[routeWeather.value?.riskLevel ?? 'low'];
  const missingPenalty = Math.round(((total - checked) / total) * 30);
  const score = Math.max(
    0,
    Math.min(100, 100 - difficultyPenalty - weatherPenalty - missingPenalty),
  );
  return {
    score,
    level: score >= 80 ? '準備充足' : score >= 60 ? '基本可出發' : score >= 40 ? '需要補強' : '不建議出發',
    summary: `目前 ${checked}/${total} 項裝備已確認，這是前端保守估算。`,
    tips: missingItems.value.length
      ? [`尚未確認：${missingItems.value.slice(0, 4).map((item) => item.name).join('、')}。`]
      : ['清單內裝備皆已確認，仍請出發前確認天氣與步道公告。'],
    model_used: 'local-route-safety',
    fallback: true,
  };
}

function mergeGearDetectionWithRouteChecklist(
  items: GearDetectResponse['items'],
): GearItem[] {
  const detected = new Map(
    items
      .filter((item) => item.detected)
      .map((item) => [normalizeGearLabel(item.name), item.confidence]),
  );
  const checklist = route.value
    ? [...route.value.gear.required, ...route.value.gear.optional]
    : items.map((item) => item.name);

  const merged = checklist.map((name) => {
    const normalizedName = normalizeGearLabel(name);
    const confidence = detected.get(normalizedName) ?? 0;
    return {
      name,
      detected: confidence > 0,
      confidence,
    };
  });

  items.forEach((item) => {
    if (!item.detected) return;
    const exists = merged.some(
      (existing) =>
        normalizeGearLabel(existing.name) === normalizeGearLabel(item.name),
    );
    if (!exists) merged.push(item);
  });

  return merged;
}

function normalizeGearLabel(label: string) {
  return label
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/防水外套/g, '雨衣')
    .replace(/登山靴/g, '登山鞋')
    .replace(/手電筒/g, '頭燈')
    .trim();
}
</script>

<style lang="scss" scoped>
// ── Tab bar ───────────────────────────────────────────────
.tab-bar-wrap {
  padding: 10px 16px 0;
  position: sticky;
  top: 56px;
  z-index: 5;
  background: inherit;

  &::after {
    content: '';
    display: block;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--glass-border, rgba(0, 0, 0, 0.08)),
      transparent
    );
    margin-top: 10px;
  }
}

.tab-bar {
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 14px;
  padding: 4px;
}

:global(.body--dark) .tab-bar {
  background: rgba(255, 255, 255, 0.05);
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 4px;
  border-radius: 10px;
  border: none;
  background: transparent;
  font-size: 0.76rem;
  font-weight: 600;
  opacity: 0.45;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.34, 1.2, 0.64, 1);
  letter-spacing: 0.06rem;
  &:active {
    transform: scale(0.95);
  }
}

.tab-active {
  background: white;
  opacity: 1;
  color: #1a8c55;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

:global(.body--dark) .tab-active {
  background: var(--surface-float);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

// ── Section label ─────────────────────────────────────────
.section-label {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06rem;
  text-transform: uppercase;
  opacity: 0.4;
  margin-bottom: 10px;
}

[data-theme='light'] .section-label {
  color: var(--text-primary);
}

// ── Stat mini cards ───────────────────────────────────────
.stat-mini {
  border-radius: 18px !important;
}
.stat-ring {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 4px;
}
.ring-primary {
  background: rgba(26, 140, 85, 0.11);
}
.ring-secondary {
  background: rgba(200, 144, 42, 0.11);
}
.stat-mini-val {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06rem;
  line-height: 1.2;
}
.stat-mini-lbl {
  font-size: 0.6rem;
  opacity: 0.4;
}

// ── Accident card ─────────────────────────────────────────
.accident-card {
  border-radius: 14px !important;
}
.acc-icon-ring {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: rgba(217, 48, 37, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

// ── Hero image ────────────────────────────────────────────
.hero-img-wrap {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
}
.hero-img {
  transition: transform 0.4s ease;
}
.hero-img-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 30%,
    rgba(0, 0, 0, 0.7) 100%
  );
}
.hero-img-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
}

// ── Weather ───────────────────────────────────────────────
.weather-hero {
  border-radius: 22px !important;
  overflow: hidden;
}
.weather-hero-inner {
  padding: 20px;
}

.weather-sunny {
  background: linear-gradient(135deg, #1565c0, #1e88e5);
}
.weather-cloudy {
  background: linear-gradient(135deg, #455a64, #607d8b);
}
.weather-rain {
  background: linear-gradient(135deg, #1a237e, #283593);
}
.weather-thunder {
  background: linear-gradient(135deg, #212121, #37474f);
}
.weather-snow {
  background: linear-gradient(135deg, #37474f, #546e7a);
}
.weather-fog {
  background: linear-gradient(135deg, #546e7a, #78909c);
}

.weather-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 0.72rem;
  color: white;
  font-weight: 500;
}

.risk-pill {
  display: inline-block;
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0.06rem;
}
.risk-low {
  background: rgba(46, 204, 113, 0.75);
}
.risk-medium {
  background: rgba(230, 126, 34, 0.82);
}
.risk-high {
  background: rgba(217, 48, 37, 0.85);
}

.forecast-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 20px;
  &::-webkit-scrollbar {
    display: none;
  }
}

.forecast-card {
  flex-shrink: 0;
  border-radius: 16px !important;
  padding: 10px;
  text-align: center;
  min-width: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.forecast-alert {
  border: 1.5px solid rgba(217, 48, 37, 0.5) !important;
}
.forecast-temp {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.06rem;
}

.alert-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #8b0000, #d93025);
  border-radius: 14px;
  padding: 12px 16px;
  box-shadow: 0 4px 16px rgba(217, 48, 37, 0.35);
}
.success-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #0d6040, #1a8c55);
  border-radius: 14px;
  padding: 12px 16px;
  box-shadow: 0 4px 16px rgba(26, 140, 85, 0.35);
}

.departure-card {
  border-left: 3px solid #1a8c55 !important;
}

.time-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 600;
}
.chip-green {
  background: rgba(26, 140, 85, 0.12);
  color: #1a8c55;
}
.chip-amber {
  background: rgba(200, 144, 42, 0.12);
  color: #c8902a;
}
.chip-blue {
  background: rgba(41, 128, 185, 0.12);
  color: #2980b9;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px;
}

// ── Gear ──────────────────────────────────────────────────
.camera-box {
  height: 190px;
  border: 1.5px dashed rgba(0, 0, 0, 0.12);
  border-radius: 20px;
  overflow: hidden;
}
:global(.body--dark) .camera-box {
  border-color: rgba(255, 255, 255, 0.1);
}

.camera-idle,
.camera-scanning {
  height: 100%;
  background: rgba(0, 0, 0, 0.03);
}
:global(.body--dark) .camera-idle,
:global(.body--dark) .camera-scanning {
  background: rgba(255, 255, 255, 0.03);
}
.camera-icon-ring {
  width: 64px;
  height: 64px;
  border-radius: 22px;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.scan-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid rgba(26, 140, 85, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: breathe-green 1.2s ease-in-out infinite;
}
.scan-ring-inner {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid #1a8c55;
  animation: breathe-green 1.2s ease-in-out infinite reverse;
}
@keyframes breathe-green {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.06);
    opacity: 1;
  }
}

.shoe-card,
.route-safety-card {
  border: 1px solid rgba(26, 140, 85, 0.16) !important;
}

.shoe-icon-ring {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(26, 140, 85, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.shoe-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.4;
}

.shoe-meta {
  margin-top: 3px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
}

.shoe-note,
.safety-summary {
  margin-top: 6px;
  font-size: 0.78rem;
  line-height: 1.7;
  color: var(--text-muted);
}

.safety-level {
  font-size: 1.15rem;
  font-weight: 900;
  color: #1a8c55;
  line-height: 1.4;
}

.safety-tips {
  display: grid;
  gap: 8px;
}

.safety-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border-radius: 12px;
  padding: 8px 10px;
  background: rgba(26, 140, 85, 0.07);
  color: var(--text-primary);
  font-size: 0.78rem;
  line-height: 1.65;
}

.gear-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.gear-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}
.gear-ok {
  background: rgba(46, 204, 113, 0.14);
  color: #27ae60;
}
.gear-missing {
  background: rgba(217, 48, 37, 0.1);
  color: #c0392b;
}

.body-check-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  &:last-child {
    border-bottom: none;
  }
}
.check-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-ok {
  background: #2ecc71;
}
.dot-fail {
  background: #d93025;
}

// ── Supply ────────────────────────────────────────────────
.supply-hero {
  background: linear-gradient(
    145deg,
    rgba(26, 140, 85, 0.05),
    rgba(200, 144, 42, 0.04)
  ) !important;
  border: 1px solid rgba(26, 140, 85, 0.12) !important;
}

.supply-big {
  padding: 16px 8px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.03);
}
:global(.body--dark) .supply-big {
  background: rgba(255, 255, 255, 0.04);
}

.supply-icon-ring {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}
.ring-info {
  background: rgba(41, 128, 185, 0.12);
}
.ring-negative {
  background: rgba(217, 48, 37, 0.1);
}

.supply-mini-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.05);
  font-size: 0.75rem;
  font-weight: 500;
}
:global(.body--dark) .supply-mini-chip {
  background: rgba(255, 255, 255, 0.07);
}

.supply-card-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sicon-secondary {
  background: rgba(200, 144, 42, 0.12);
}
.sicon-info {
  background: rgba(41, 128, 185, 0.12);
}
.sicon-primary {
  background: rgba(26, 140, 85, 0.12);
}
</style>
