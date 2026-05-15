<template>
  <q-page class="trail-detail-page q-pb-xl" v-if="trail">
    <!-- Hero image -->
    <div class="hero-wrap anim-fade">
      <img :src="trail.thumbnail" class="hero-img" :alt="trail.name" />
      <div class="hero-overlay" />
      <div class="hero-content q-pa-lg">
        <div class="hero-top-row q-mb-xl">
          <button class="back-btn" @click="$router.back()">
            <q-icon name="arrow_back_ios_new" size="16px" color="white" />
          </button>
          <div class="region-badge">{{ regionLabels[trail.region] }}</div>
        </div>

        <div class="diff-pill q-mb-sm" :class="`dpill-${trail.difficulty}`">
          {{ diffLabels[trail.difficulty] }}
        </div>
        <div
          class="text-h4 text-white text-weight-bold"
          style="letter-spacing: 0.06rem; line-height: 1.1"
        >
          {{ trail.name }}
        </div>
        <div class="text-body2 text-white q-mt-xs" style="opacity: 0.65">
          <q-icon name="location_on" size="13px" />
          {{ trail.location }}
        </div>

        <!-- Rating -->
        <div class="hero-rating q-mt-sm">
          <div class="stars">
            <q-icon
              v-for="s in 5"
              :key="s"
              name="star"
              size="14px"
              :color="s <= Math.round(trail.rating) ? 'warning' : 'grey-6'"
            />
          </div>
          <span class="rating-text text-white"
            >{{ trail.rating }} ·
            {{ trail.reviewCount.toLocaleString() }} 則評論</span
          >
        </div>
      </div>
    </div>

    <!-- Quick stats -->
    <div
      class="stats-row q-px-md q-mt-md anim-slide-up"
      style="animation-delay: 0.05s"
    >
      <div class="qstat hiking-card" v-for="s in quickStats" :key="s.label">
        <div class="qstat-ring" :class="`ring-${s.color}`">
          <q-icon :name="s.icon" :color="s.color" size="17px" />
        </div>
        <div class="qstat-val">{{ s.val }}</div>
        <div class="qstat-lbl">{{ s.label }}</div>
      </div>
    </div>

    <!-- Permits & Type badges -->
    <div
      class="q-px-md q-mt-md q-gutter-x-sm row anim-slide-up"
      style="animation-delay: 0.08s"
    >
      <div
        class="info-badge"
        :class="trail.permitRequired ? 'ibadge-warn' : 'ibadge-ok'"
      >
        <q-icon
          :name="trail.permitRequired ? 'assignment' : 'check_circle'"
          size="13px"
        />
        {{ trail.permitRequired ? '需申請入園許可' : '免申請' }}
      </div>
      <div class="info-badge ibadge-neutral">
        <q-icon name="route" size="13px" />
        {{ typeLabels[trail.type] }}路線
      </div>
    </div>

    <!-- Description -->
    <div class="q-px-md q-mt-lg anim-slide-up" style="animation-delay: 0.1s">
      <div class="section-label">步道介紹</div>
      <div class="desc-text q-mt-sm">{{ trail.description }}</div>
    </div>

    <!-- Highlights -->
    <div class="q-px-md q-mt-lg anim-slide-up" style="animation-delay: 0.12s">
      <div class="section-label">步道亮點</div>
      <div class="highlights-wrap q-mt-sm">
        <div class="highlight-item" v-for="h in trail.highlights" :key="h">
          <div class="highlight-dot" />
          <span>{{ h }}</span>
        </div>
      </div>
    </div>

    <!-- Best seasons -->
    <div class="q-px-md q-mt-lg anim-slide-up" style="animation-delay: 0.14s">
      <div class="section-label">最佳登山季節</div>
      <div class="season-grid q-mt-sm">
        <div
          v-for="(m, idx) in 12"
          :key="m"
          class="season-cell"
          :class="{ 'season-best': trail.bestSeasons.includes(m) }"
        >
          <div
            class="season-bar"
            :class="{ 'bar-active': trail.bestSeasons.includes(m) }"
          />
          <span class="season-lbl">{{ shortMonth[idx] }}</span>
        </div>
      </div>
    </div>

    <!-- Facilities -->
    <div class="q-px-md q-mt-lg anim-slide-up" style="animation-delay: 0.16s">
      <div class="section-label">設施資訊</div>
      <div class="facilities-wrap q-mt-sm">
        <div
          v-for="f in facilityList"
          :key="f.key"
          class="facility-item"
          :class="{
            'facility-on': trail.facilities[f.key],
            'facility-off': !trail.facilities[f.key],
          }"
        >
          <div class="facility-ring">
            <q-icon :name="f.icon" size="18px" />
          </div>
          <span class="facility-lbl">{{ f.label }}</span>
        </div>
      </div>
    </div>

    <!-- Tips -->
    <div class="q-px-md q-mt-lg anim-slide-up" style="animation-delay: 0.18s">
      <div class="tips-card">
        <div class="tips-header">
          <div class="tips-icon-ring">
            <q-icon name="lightbulb" size="16px" color="warning" />
          </div>
          <span class="tips-title">登山小撇步</span>
        </div>
        <div class="tips-text q-mt-sm">{{ trail.tips }}</div>
      </div>
    </div>

    <!-- CTA -->
    <div class="q-px-md q-mt-xl anim-slide-up" style="animation-delay: 0.2s">
      <q-btn
        unelevated
        class="full-width plan-btn"
        icon="hiking"
        label="加入登山計劃"
        size="lg"
        @click="addToPlan"
      />
    </div>
  </q-page>

  <!-- Loading fallback -->
  <q-page v-else class="flex flex-center">
    <q-spinner-dots color="primary" size="40px" />
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, onMounted, ref } from 'vue';
import { fetchRouteById, hydrateRoute, type RouteViewRoute } from 'src/services/routes';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

interface TrailDetailView extends RouteViewRoute {
  rating: number
  reviewCount: number
  bestSeasons: number[]
  facilities: {
    hut: boolean
    camping: boolean
    water: boolean
    toilet: boolean
  }
  highlights: string[]
  tips: string
  type: 'loop' | 'out-back' | 'one-way'
}

const regionLabels = {
  north: '北部',
  central: '中部',
  south: '南部',
  east: '東部',
}

function resolveTrailRegion(location: string): keyof typeof regionLabels {
  if (/臺北|台北|新北|基隆|宜蘭|桃園|新竹/.test(location)) return 'north'
  if (/苗栗|臺中|台中|彰化|南投|雲林/.test(location)) return 'central'
  if (/嘉義|臺南|台南|高雄|屏東/.test(location)) return 'south'
  return 'east'
}

const trail = ref<TrailDetailView | undefined>(undefined)

function toTrailDetail(routeData: RouteViewRoute): TrailDetailView {
  return {
    ...routeData,
    rating: Math.max(3.6, Math.min(4.9, 4.9 - (routeData.risk === 'high' ? 0.8 : routeData.risk === 'mid' ? 0.3 : 0))),
    reviewCount: Math.max(0, Math.round(routeData.distanceKm * 120)),
    bestSeasons: routeData.routeKind === 'peak' ? [4, 5, 9, 10] : [3, 4, 5, 10, 11],
    facilities: {
      hut: routeData.requiresPermit,
      camping: routeData.days >= 2,
      water: true,
      toilet: routeData.days <= 1,
    },
    highlights: [
      routeData.highlight,
      routeData.requiresPermit ? '需注意入山規定' : '申請需求低',
      `資料庫路線：${routeData.routeKind === 'peak' ? '百岳' : '步道'}`,
    ],
    tips: routeData.supply.notes,
    region: resolveTrailRegion(routeData.region),
    type: routeData.routeKind === 'peak'
      ? 'out-back'
      : routeData.trailShape.includes('環')
        ? 'loop'
        : 'out-back',
  }
}

onMounted(async () => {
  const routeId = route.params.id
  if (!routeId || Array.isArray(routeId)) return
  try {
    trail.value = toTrailDetail(hydrateRoute(await fetchRouteById(routeId)))
  } catch (_) {
    trail.value = undefined
  }
})

const diffLabels: Record<string, string> = {
  easy: '容易',
  medium: '中等',
  hard: '困難',
  expert: '專家',
};
const typeLabels: Record<string, string> = {
  loop: '環狀',
  'out-back': '來回',
  'one-way': '縱走',
};
const shortMonth = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
];

const quickStats = computed(() => {
  if (!trail.value) return [];
  return [
    {
      icon: 'straighten',
      color: 'primary',
      val: `${trail.value.distanceKm} km`,
      label: '距離',
    },
    {
      icon: 'schedule',
      color: 'primary',
      val: `${trail.value.estimatedHours}h`,
      label: '時間',
    },
    {
      icon: 'terrain',
      color: 'secondary',
      val: `+${trail.value.elevationGain}m`,
      label: '爬升',
    },
    {
      icon: 'landscape',
      color: 'warning',
      val: `${trail.value.maxElevation}m`,
      label: '最高點',
    },
  ];
});

const facilityList = [
  { key: 'hut' as const, icon: 'cottage', label: '山屋' },
  { key: 'camping' as const, icon: 'outdoor_grill', label: '營地' },
  { key: 'water' as const, icon: 'water_drop', label: '水源' },
  { key: 'toilet' as const, icon: 'wc', label: '廁所' },
];

function addToPlan() {
  $q.notify({
    message: `已將「${trail.value?.name}」加入規劃清單`,
    color: 'positive',
    icon: 'check_circle',
    position: 'bottom',
    timeout: 2200,
  });
}
</script>

<style lang="scss" scoped>
// ── Hero ──────────────────────────────────────────────────
.hero-wrap {
  position: relative;
  height: 340px;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.2) 0%,
    rgba(0, 0, 0, 0.1) 30%,
    rgba(0, 0, 0, 0.65) 70%,
    rgba(0, 0, 0, 0.82) 100%
  );
}

.hero-content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.hero-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  padding-top: max(16px, env(safe-area-inset-top, 0px));
}

.back-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease;
  &:active {
    transform: scale(0.9);
  }
}

.region-badge {
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06rem;
}

.diff-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.68rem;
  font-weight: 700;
}
.dpill-easy {
  background: rgba(39, 174, 96, 0.25);
  color: #7fffa8;
}
.dpill-medium {
  background: rgba(230, 126, 34, 0.3);
  color: #ffcb8a;
}
.dpill-hard {
  background: rgba(200, 144, 42, 0.3);
  color: #ffd080;
}
.dpill-expert {
  background: rgba(217, 48, 37, 0.3);
  color: #ffb0aa;
}

.hero-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.stars {
  display: flex;
  gap: 2px;
}
.rating-text {
  font-size: 0.78rem;
  opacity: 0.8;
}

// ── Quick stats ───────────────────────────────────────────
.stats-row {
  display: flex;
  gap: 10px;
}

.qstat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 14px 8px 12px;
  border-radius: 18px;
  background: white;
  box-shadow: var(--shadow-sm, 0 2px 10px rgba(0, 0, 0, 0.08));
  text-align: center;
  min-width: 0;
}

:global(.body--dark) .qstat {
  background: var(--surface-raised, #0e1f38);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.qstat-ring {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ring-primary {
  background: rgba(26, 140, 85, 0.12);
}
.ring-secondary {
  background: rgba(200, 144, 42, 0.12);
}
.ring-warning {
  background: rgba(230, 126, 34, 0.12);
}
.ring-negative {
  background: rgba(217, 48, 37, 0.1);
}

.qstat-val {
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.06rem;
  line-height: 1;
}
.qstat-lbl {
  font-size: 0.58rem;
  opacity: 0.42;
  font-weight: 600;
}

// ── Info badges ───────────────────────────────────────────
.info-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}
.ibadge-warn {
  background: rgba(217, 48, 37, 0.1);
  color: #c0392b;
}
.ibadge-ok {
  background: rgba(39, 174, 96, 0.1);
  color: #1e8449;
}
.ibadge-neutral {
  background: rgba(0, 0, 0, 0.06);
  color: inherit;
  opacity: 0.7;
}
:global(.body--dark) .ibadge-neutral {
  background: rgba(255, 255, 255, 0.08);
  opacity: 0.8;
}

// ── Section label ─────────────────────────────────────────
.section-label {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06rem;
  text-transform: uppercase;
  opacity: 0.38;
}

// ── Description ───────────────────────────────────────────
.desc-text {
  font-size: 0.88rem;
  line-height: 1.75;
  opacity: 0.72;
}

// ── Highlights ────────────────────────────────────────────
.highlights-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.highlight-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  opacity: 0.8;
}
.highlight-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #1a8c55;
  flex-shrink: 0;
}

// ── Season grid ───────────────────────────────────────────
.season-grid {
  display: flex;
  gap: 4px;
}
.season-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.season-bar {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.06);
  transition: background 0.2s ease;
}
:global(.body--dark) .season-bar {
  background: rgba(255, 255, 255, 0.07);
}
.bar-active {
  background: linear-gradient(180deg, #30d97a, #1a8c55) !important;
  box-shadow: 0 3px 10px rgba(26, 140, 85, 0.45);
}
.season-lbl {
  font-size: 0.55rem;
  opacity: 0.45;
  font-weight: 600;
}
.season-cell.season-best .season-lbl {
  opacity: 0.85;
  color: #1a8c55;
  font-weight: 700;
}
:global(.body--dark) .season-cell.season-best .season-lbl {
  color: #30d97a;
}

// ── Facilities ────────────────────────────────────────────
.facilities-wrap {
  display: flex;
  gap: 12px;
}
.facility-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: 16px;
  text-align: center;
}
.facility-on {
  background: rgba(26, 140, 85, 0.08);
}
.facility-off {
  background: rgba(0, 0, 0, 0.04);
  opacity: 0.35;
}
:global(.body--dark) .facility-on {
  background: rgba(48, 217, 122, 0.1);
}
:global(.body--dark) .facility-off {
  background: rgba(255, 255, 255, 0.04);
}

.facility-ring {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.facility-on .facility-ring {
  background: rgba(26, 140, 85, 0.15);
  color: #1a8c55;
}
.facility-off .facility-ring {
  background: rgba(0, 0, 0, 0.06);
  color: #9aaabb;
}
:global(.body--dark) .facility-on .facility-ring {
  background: rgba(48, 217, 122, 0.15);
  color: #30d97a;
}
.facility-lbl {
  font-size: 0.65rem;
  font-weight: 600;
}

// ── Tips card ─────────────────────────────────────────────
.tips-card {
  background: rgba(200, 144, 42, 0.07);
  border: 1px solid rgba(200, 144, 42, 0.2);
  border-radius: 18px;
  padding: 16px;
}
:global(.body--dark) .tips-card {
  background: rgba(200, 144, 42, 0.08);
  border-color: rgba(200, 144, 42, 0.22);
}
.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tips-icon-ring {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: rgba(200, 144, 42, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}
.tips-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #9a6a00;
  letter-spacing: 0.06rem;
}
:global(.body--dark) .tips-title {
  color: #e0b050;
}
.tips-text {
  font-size: 0.83rem;
  line-height: 1.7;
  opacity: 0.7;
}

// ── CTA ───────────────────────────────────────────────────
.plan-btn {
  background: linear-gradient(135deg, #1a8c55, #0c5c35) !important;
  color: white !important;
  border-radius: 18px !important;
  font-weight: 700 !important;
  height: 54px;
  box-shadow: 0 6px 24px rgba(26, 140, 85, 0.45) !important;
  letter-spacing: 0.06rem;
}
</style>
