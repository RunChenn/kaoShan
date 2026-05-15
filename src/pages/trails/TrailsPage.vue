<template>
  <q-page class="q-pb-xl">

    <!-- Header hero -->
    <div class="trails-hero anim-fade">
      <div class="trails-hero-bg" />
      <div class="trails-hero-orb orb-1" />
      <div class="trails-hero-orb orb-2" />
      <div class="trails-hero-content q-px-md q-pt-md q-pb-lg">
        <div class="text-caption text-white q-mb-xs" style="opacity:0.55;letter-spacing: 0.06rem;text-transform:uppercase">
          Taiwan Trails
        </div>
        <div class="text-h4 text-white text-weight-bold" style="letter-spacing: 0.06rem;line-height:1.1">
          步道探索
        </div>
        <div class="text-body2 text-white q-mt-xs" style="opacity:0.65">
          {{ trails.length }} 條精選台灣步道等你挑戰
        </div>

        <!-- Search bar -->
        <div class="search-bar q-mt-md" @click="searchFocus = true">
          <q-icon name="search" size="18px" style="opacity:0.5" />
          <input
            v-model="search"
            class="search-input"
            placeholder="搜尋步道名稱或地區..."
            @blur="searchFocus = false"
          />
          <q-icon
            v-if="search"
            name="close"
            size="16px"
            style="opacity:0.5;cursor:pointer"
            @click.stop="search = ''"
          />
        </div>
      </div>
    </div>

    <!-- Region tabs -->
    <div class="region-tabs-wrap q-px-md q-pt-md anim-slide-up" style="animation-delay:0.06s">
      <div class="region-tabs">
        <button
          v-for="r in regions"
          :key="r.value"
          class="region-tab"
          :class="{ 'region-tab-active': selectedRegion === r.value }"
          @click="selectedRegion = r.value"
        >
          {{ r.label }}
        </button>
      </div>
    </div>

    <!-- Difficulty filter -->
    <div class="q-px-md q-mt-sm q-mb-md anim-slide-up" style="animation-delay:0.09s">
      <div class="chip-row">
        <button
          v-for="d in difficulties"
          :key="d.value"
          class="diff-chip"
          :class="[`diff-chip-${d.value}`, { 'diff-chip-active': selectedDiff === d.value }]"
          @click="toggleDiff(d.value)"
        >
          <span class="diff-dot" :class="`dot-${d.value}`" />
          {{ d.label }}
        </button>
      </div>
    </div>

    <!-- Result count -->
    <div class="q-px-md q-mb-sm anim-fade" style="animation-delay:0.1s">
      <span class="result-count">{{ filtered.length }} 條步道</span>
    </div>

    <!-- Trail cards -->
    <div class="q-px-md q-gutter-y-md">
      <div
        v-for="(trail, i) in filtered"
        :key="trail.id"
        class="trail-card anim-slide-up"
        :style="`animation-delay:${0.08 + i * 0.055}s`"
        @click="goDetail(trail.id)"
      >
        <!-- Image -->
        <div class="trail-img-wrap">
          <img :src="trail.thumbnail" class="trail-img" :alt="trail.name" />
          <div class="trail-img-overlay" />

          <!-- Permit badge -->
          <div v-if="trail.permitRequired" class="permit-badge">
            <q-icon name="assignment" size="11px" />
            需申請
          </div>

          <!-- Type badge -->
          <div class="type-badge">{{ typeLabels[trail.type] }}</div>
        </div>

        <!-- Content -->
        <div class="trail-body q-pa-md">
          <div class="row items-start no-wrap q-mb-xs">
            <div class="col">
              <div class="trail-name">{{ trail.name }}</div>
              <div class="trail-location">
                <q-icon name="location_on" size="11px" />
                {{ trail.location }}
              </div>
            </div>
            <div class="diff-pill" :class="`dpill-${trail.difficulty}`">
              {{ diffLabels[trail.difficulty] }}
            </div>
          </div>

          <!-- Stats -->
          <div class="trail-stats q-mt-sm">
            <div class="tstat">
              <q-icon name="straighten" color="primary" size="14px" />
              <span>{{ trail.distanceKm }} km</span>
            </div>
            <div class="tstat-divider" />
            <div class="tstat">
              <q-icon name="schedule" color="primary" size="14px" />
              <span>{{ trail.estimatedHours }}h</span>
            </div>
            <div class="tstat-divider" />
            <div class="tstat">
              <q-icon name="terrain" color="secondary" size="14px" />
              <span>+{{ trail.elevationGain }}m</span>
            </div>
            <div class="tstat-divider" />
            <div class="tstat">
              <q-icon name="landscape" color="warning" size="14px" />
              <span>{{ trail.maxElevation }}m</span>
            </div>
          </div>

          <!-- Rating & seasons -->
          <div class="trail-footer q-mt-sm">
            <div class="trail-rating">
              <q-icon name="star" color="warning" size="13px" />
              <span class="rating-val">{{ trail.rating }}</span>
              <span class="rating-cnt">({{ trail.reviewCount.toLocaleString() }})</span>
            </div>
            <div class="season-pills">
              <span
                v-for="m in trail.bestSeasons.slice(0, 4)"
                :key="m"
                class="season-pill"
              >{{ monthLabels[m - 1] }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="filtered.length === 0" class="empty-state anim-fade">
      <div class="empty-icon-ring">
        <q-icon name="hiking" size="2.4rem" color="grey-5" />
      </div>
      <div class="text-subtitle2 text-grey-5 q-mt-md">找不到符合的步道</div>
      <div class="text-caption text-grey-4 q-mt-xs">試試調整地區或難度篩選</div>
      <q-btn
        flat color="primary" label="清除篩選"
        class="q-mt-md" style="border-radius:12px"
        @click="clearFilters"
      />
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchRoutes, hydrateRoute, type RouteViewRoute } from 'src/services/routes'

const router = useRouter()
const search        = ref('')
const searchFocus   = ref(false)
const selectedRegion = ref<'all' | 'north' | 'central' | 'south' | 'east'>('all')
const selectedDiff   = ref<string | null>(null)

interface TrailCard {
  id: string
  name: string
  location: string
  region: 'north' | 'central' | 'south' | 'east'
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  distanceKm: number
  estimatedHours: number
  elevationGain: number
  maxElevation: number
  thumbnail: string
  rating: number
  reviewCount: number
  bestSeasons: number[]
  permitRequired: boolean
  type: 'loop' | 'out-back' | 'one-way'
}

const regionLabels = {
  all: '全部',
  north: '北部',
  central: '中部',
  south: '南部',
  east: '東部',
}

const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const regions = [
  { value: 'all'     as TrailRegion, label: regionLabels.all     },
  { value: 'north'   as TrailRegion, label: regionLabels.north   },
  { value: 'central' as TrailRegion, label: regionLabels.central },
  { value: 'south'   as TrailRegion, label: regionLabels.south   },
  { value: 'east'    as TrailRegion, label: regionLabels.east    },
]

const difficulties = [
  { value: 'easy',   label: '容易' },
  { value: 'medium', label: '中等' },
  { value: 'hard',   label: '困難' },
  { value: 'expert', label: '專家' },
]

const diffLabels: Record<string, string> = {
  easy: '容易', medium: '中等', hard: '困難', expert: '專家',
}
const typeLabels: Record<string, string> = {
  loop: '環狀', 'out-back': '來回', 'one-way': '縱走',
}

function toggleDiff(v: string) {
  selectedDiff.value = selectedDiff.value === v ? null : v
}

function clearFilters() {
  selectedRegion.value = 'all'
  selectedDiff.value   = null
  search.value         = ''
}

const trails = ref<TrailCard[]>([])

function resolveTrailRegion(location: string): TrailCard['region'] {
  if (/臺北|台北|新北|基隆|宜蘭|桃園|新竹/.test(location)) return 'north'
  if (/苗栗|臺中|台中|彰化|南投|雲林/.test(location)) return 'central'
  if (/嘉義|臺南|台南|高雄|屏東/.test(location)) return 'south'
  return 'east'
}

function routeToTrail(route: RouteViewRoute): TrailCard {
  const region = resolveTrailRegion(route.region)
  const type = route.routeKind === 'peak'
    ? 'out-back'
    : route.trailShape.includes('環') ? 'loop' : 'out-back'
  return {
    id: route.id,
    name: route.name,
    location: route.region,
    region,
    difficulty: route.difficulty,
    distanceKm: route.distanceKm,
    estimatedHours: route.estimatedHours,
    elevationGain: route.elevationGain,
    maxElevation: parseInt(route.maxElevation || '0', 10),
    thumbnail: route.thumbnail,
    rating: Math.max(3.6, Math.min(4.9, 4.9 - (route.risk === 'high' ? 0.8 : route.risk === 'mid' ? 0.3 : 0))),
    reviewCount: Math.max(0, Math.round(route.distanceKm * 120)),
    bestSeasons: route.routeKind === 'peak' ? [4, 5, 9, 10] : [3, 4, 5, 10, 11],
    permitRequired: route.requiresPermit,
    type,
  }
}

onMounted(async () => {
  try {
    trails.value = (await fetchRoutes()).map((route) => routeToTrail(hydrateRoute(route)))
  } catch (_) {
    trails.value = []
  }
})

const filtered = computed(() =>
  trails.value.filter(t => {
    if (selectedRegion.value !== 'all' && t.region !== selectedRegion.value) return false
    if (selectedDiff.value && t.difficulty !== selectedDiff.value) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      if (!t.name.toLowerCase().includes(q) && !t.location.toLowerCase().includes(q)) return false
    }
    return true
  })
)

function goDetail(id: string) {
  router.push(`/trails/${id}`)
}
</script>

<style lang="scss" scoped>
// ── Hero ──────────────────────────────────────────────────
.trails-hero {
  position: relative;
  overflow: hidden;
  border-radius: 0 0 32px 32px;
  margin-bottom: 0;
}

.trails-hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(145deg, #0C3820 0%, #1A6640 45%, #C8902A 100%);
}

.trails-hero-orb {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.07);
  pointer-events: none;
}
.orb-1 { width: 240px; height: 240px; top: -80px; right: -60px; }
.orb-2 { width: 140px; height: 140px; bottom: -50px; left: -30px; }

.trails-hero-content { position: relative; z-index: 1; }

// ── Search bar ────────────────────────────────────────────
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(20px);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 10px 14px;
  cursor: text;
  transition: background 0.2s ease;

  &:focus-within {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
  }
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: white;
  font-size: 0.88rem;
  font-weight: 500;

  &::placeholder { color: rgba(255, 255, 255, 0.5); }
}

// ── Region tabs ────────────────────────────────────────────
.region-tabs-wrap { overflow-x: auto; scrollbar-width: none; &::-webkit-scrollbar { display: none; } }

.region-tabs {
  display: flex;
  gap: 8px;
  padding-bottom: 4px;
  white-space: nowrap;
}

.region-tab {
  padding: 7px 18px;
  border-radius: 24px;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.04);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 0.06rem;
  transition: all 0.22s cubic-bezier(0.34, 1.2, 0.64, 1);
  white-space: nowrap;
  outline: none;

  &:active { transform: scale(0.95); }
}

.region-tab-active {
  background: #1A8C55 !important;
  border-color: #1A8C55 !important;
  color: white;
  box-shadow: 0 3px 14px rgba(26, 140, 85, 0.45);
}

:global(.body--dark) .region-tab {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.75);
}

// ── Difficulty chips ──────────────────────────────────────
.chip-row { display: flex; gap: 7px; flex-wrap: wrap; }

.diff-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 13px;
  border-radius: 20px;
  border: 1.5px solid rgba(0, 0, 0, 0.09);
  background: rgba(0, 0, 0, 0.035);
  font-size: 0.77rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;

  &:active { transform: scale(0.94); }
}

.diff-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
}
.dot-easy   { background: #27AE60; }
.dot-medium { background: #C0672A; }
.dot-hard   { background: #A07020; }
.dot-expert { background: #C0392B; }

.diff-chip-active {
  &.diff-chip-easy   { background: rgba(39,174,96,0.14)!important; border-color: rgba(39,174,96,0.5)!important; color:#1E8449; }
  &.diff-chip-medium { background: rgba(192,103,42,0.14)!important; border-color: rgba(192,103,42,0.5)!important; color:#A05525; }
  &.diff-chip-hard   { background: rgba(160,112,32,0.14)!important; border-color: rgba(160,112,32,0.5)!important; color:#8A6018; }
  &.diff-chip-expert { background: rgba(192,57,43,0.14)!important; border-color: rgba(192,57,43,0.5)!important; color:#B03228; }
}

:global(.body--dark) .diff-chip {
  border-color: rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.7);
}

// ── Result count ──────────────────────────────────────────
.result-count {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06rem;
  text-transform: uppercase;
  opacity: 0.35;
}

// ── Trail card ────────────────────────────────────────────
.trail-card {
  border-radius: 22px;
  overflow: hidden;
  background: white;
  box-shadow: var(--shadow-md, 0 4px 20px rgba(0,0,0,0.12));
  cursor: pointer;
  transition: transform 0.26s cubic-bezier(0.34, 1.2, 0.64, 1),
              box-shadow 0.26s ease;

  &:active { transform: scale(0.98); }
  &:hover  { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(0,0,0,0.18); }
}

:global(.body--dark) .trail-card {
  background: var(--surface-raised, #0E1F38);
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}

.trail-img-wrap {
  position: relative;
  height: 180px;
}

.trail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.trail-img-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5));
}

.permit-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 20px;
  background: rgba(217, 48, 37, 0.85);
  backdrop-filter: blur(8px);
  color: white;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06rem;
}

.type-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 3px 9px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  color: white;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06rem;
}

// ── Trail body ────────────────────────────────────────────
.trail-name {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.06rem;
  line-height: 1.2;
}

.trail-location {
  font-size: 0.7rem;
  opacity: 0.45;
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.diff-pill {
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: 8px;
}
.dpill-easy   { background: rgba(39,174,96,0.14);  color:#1E8449; }
.dpill-medium { background: rgba(192,103,42,0.14); color:#A05525; }
.dpill-hard   { background: rgba(160,112,32,0.14); color:#8A6018; }
.dpill-expert { background: rgba(192,57,43,0.14);  color:#B03228; }

// ── Trail stats ───────────────────────────────────────────
.trail-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.tstat {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.75;
  white-space: nowrap;
}

.tstat-divider {
  width: 1px;
  height: 12px;
  background: rgba(0,0,0,0.12);
  flex-shrink: 0;
}
:global(.body--dark) .tstat-divider { background: rgba(255,255,255,0.1); }

// ── Trail footer ──────────────────────────────────────────
.trail-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.trail-rating {
  display: flex;
  align-items: center;
  gap: 3px;
}
.rating-val { font-size: 0.82rem; font-weight: 700; }
.rating-cnt { font-size: 0.68rem; opacity: 0.4; }

.season-pills {
  display: flex;
  gap: 4px;
}
.season-pill {
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(26,140,85,0.1);
  color: #1A8C55;
  font-size: 0.6rem;
  font-weight: 700;
}
:global(.body--dark) .season-pill {
  background: rgba(48,217,122,0.14);
  color: #30D97A;
}

// ── Empty state ────────────────────────────────────────────
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 24px;
  text-align: center;
}
.empty-icon-ring {
  width: 80px; height: 80px;
  border-radius: 28px;
  background: rgba(0,0,0,0.04);
  display: flex; align-items: center; justify-content: center;
}
:global(.body--dark) .empty-icon-ring { background: rgba(255,255,255,0.05); }
</style>
