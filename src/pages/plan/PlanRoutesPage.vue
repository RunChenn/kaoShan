<template>
  <q-page class="q-pb-xl">

    <!-- Page header -->
    <div class="page-header q-px-md q-pt-md q-pb-sm anim-slide-down">
      <div class="text-h5 text-weight-bold page-title">路線推薦</div>
      <div class="text-body2 page-subtitle q-mt-xs">
        {{ isRecommendMode ? 'AI 依您的體能評估，為您排序最適合的路線' : '根據難度與天數篩選全部路線' }}
      </div>
      <div v-if="isRecommendMode" class="ai-banner q-mt-sm">
        <q-icon name="auto_awesome" size="13px" class="q-mr-xs" />
        AI 推薦模式
      </div>
    </div>

    <!-- Filters -->
    <div class="q-px-md q-pb-sm">
      <!-- Fitness -->
      <div class="filter-section anim-slide-up" style="animation-delay:0.02s">
        <div class="filter-label">體能篩選</div>
        <div class="chip-row">
          <button
            v-for="f in fitnessFilters"
            :key="f.value"
            class="filter-chip"
            :class="{ 'chip-active chip-fitness': selectedFitness === f.value }"
            @click="toggleFitness(f.value)"
          >{{ f.label }}</button>
        </div>
      </div>

      <!-- Difficulty -->
      <div class="filter-section anim-slide-up" style="animation-delay:0.04s">
        <div class="filter-label">難度篩選</div>
        <div class="chip-row">
          <button
            v-for="d in difficulties"
            :key="d.value"
            class="filter-chip"
            :class="{ 'chip-active': selectedDifficulty === d.value }"
            @click="toggleDifficulty(d.value)"
          >{{ d.label }}</button>
        </div>
      </div>

      <!-- Days -->
      <div class="filter-section anim-slide-up" style="animation-delay:0.08s">
        <div class="filter-label">天數篩選</div>
        <div class="chip-row">
          <button
            v-for="d in dayFilters"
            :key="d.value"
            class="filter-chip"
            :class="{ 'chip-active chip-gold': selectedDays === d.value }"
            @click="toggleDays(d.value)"
          >{{ d.label }}</button>
        </div>
      </div>
    </div>

    <!-- Result count -->
    <div class="q-px-md q-mb-sm anim-fade" style="animation-delay:0.12s">
      <span class="result-count">{{ filteredRoutes.length }} 條路線</span>
    </div>

    <!-- Route list -->
    <div class="q-px-md q-gutter-y-md">
      <div
        v-for="(route, i) in filteredRoutes"
        :key="route.id"
        class="anim-slide-up"
        :style="`animation-delay:${0.1 + i * 0.06}s`"
      >
        <div
          v-if="isRecommendMode && route.matchLabel"
          class="match-badge q-mb-xs"
          :style="{ background: route.matchBg, color: route.matchColor }"
        >
          <q-icon name="auto_awesome" size="11px" class="q-mr-xs" />
          {{ route.matchLabel }}
          <span class="match-score">{{ Math.round(route.matchScore) }} 分</span>
        </div>
        <RouteCard :route="route" @click="selectRoute(route.id)" />
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="!loadingRoutes && filteredRoutes.length === 0"
      class="empty-state anim-scale"
      style="animation-delay:0.1s"
    >
      <div class="empty-icon-wrap">
        <q-icon name="search_off" size="2.5rem" color="grey-5" />
      </div>
      <div class="text-subtitle2 text-grey-5 q-mt-sm">沒有符合條件的路線</div>
      <div class="text-caption text-grey-4 q-mt-xs">試試調整篩選條件</div>
    </div>

    <div
      v-if="loadingRoutes"
      class="q-px-md q-mt-lg text-center text-caption text-grey-5"
    >
      正在載入資料庫路線...
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanStore } from 'src/stores/plan'
import RouteCard from 'src/components/RouteCard.vue'
import {
  fetchRoutes,
  fetchRecommendedRoutes,
  hydrateRoute,
  routeToRecommendation,
  type RouteRecommendation,
} from 'src/services/routes'

const router = useRouter()
const plan   = usePlanStore()

const selectedFitness    = ref<number | null>(plan.profileForm.fitness ?? null)
const selectedDifficulty = ref<string | null>(null)
const routes             = ref<RouteRecommendation[]>([])
const loadingRoutes      = ref(false)
const isRecommendMode    = ref(false)

const initialDays = plan.profileForm.targetDays
const selectedDays = ref<number | null>(
  initialDays >= 3 ? 3 : initialDays > 0 ? initialDays : null
)

const difficulties = [
  { label: '容易', value: 'easy'   },
  { label: '中等', value: 'medium' },
  { label: '困難', value: 'hard'   },
  { label: '專家', value: 'expert' },
]

const fitnessFilters = [
  { label: '不限', value: null },
  { label: '1 分', value: 1 },
  { label: '2 分', value: 2 },
  { label: '3 分', value: 3 },
  { label: '4 分', value: 4 },
  { label: '5 分', value: 5 },
]

const dayFilters = [
  { label: '1 天', value: 1 },
  { label: '2 天', value: 2 },
  { label: '3 天以上', value: 3 },
]

function toggleFitness(v: number | null) {
  selectedFitness.value = selectedFitness.value === v ? null : v
}
function toggleDifficulty(v: string) {
  selectedDifficulty.value = selectedDifficulty.value === v ? null : v
}
function toggleDays(v: number) {
  selectedDays.value = selectedDays.value === v ? null : v
}

onMounted(async () => {
  loadingRoutes.value = true
  const p = plan.profileForm
  const hasProfile = !!(p.age && p.weight)

  try {
    if (hasProfile) {
      isRecommendMode.value = true
      const data = await fetchRecommendedRoutes({
        age: Number(p.age),
        weight: Number(p.weight),
        level: p.level,
        fitness: p.fitness,
        target_days: p.targetDays,
        slopeCoeff: p.slopeCoefficient,
      })
      routes.value = data.map(routeToRecommendation)
    } else {
      isRecommendMode.value = false
      const data = await fetchRoutes()
      routes.value = data.map(r => ({
        ...hydrateRoute(r),
        matchScore: 0,
        matchLabel: '',
        matchBg: '',
        matchColor: '',
        reasons: [],
      }))
    }
  } catch (_) {
    routes.value = []
  } finally {
    loadingRoutes.value = false
  }
})

const filteredRoutes = computed(() =>
  routes.value
    .filter((r) => {
      if (selectedFitness.value != null && r.minFitness > selectedFitness.value) return false
      if (selectedDifficulty.value && (r as RouteRecommendation & { difficulty?: string }).difficulty !== selectedDifficulty.value) return false
      if (selectedDays.value) {
        if (selectedDays.value === 3 && r.minDays < 3) return false
        if (selectedDays.value !== 3 && r.minDays !== selectedDays.value) return false
      }
      return true
    })
    .sort((a, b) => {
      if (isRecommendMode.value) return b.matchScore - a.matchScore
      const fitness = selectedFitness.value ?? plan.profileForm.fitness ?? 3
      const aScore = Math.abs(a.minFitness - fitness) * 10 + a.minDays * 2 + a.elevationGain / 500
      const bScore = Math.abs(b.minFitness - fitness) * 10 + b.minDays * 2 + b.elevationGain / 500
      return aScore - bScore
    })
)

function selectRoute(id: string) {
  plan.selectRoute(id)
  router.push(`/plan/route/${id}`)
}
</script>

<style lang="scss" scoped>
.page-header {
  padding-top: 20px;
}
.page-title {
  letter-spacing: 0.06rem;
}
.page-subtitle {
  opacity: 0.5;
  font-size: 0.82rem;
}

// ── Filters ──────────────────────────────────────────────
.filter-section { margin-bottom: 10px; }

.filter-label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06rem;
  text-transform: uppercase;
  opacity: 0.4;
  margin-bottom: 7px;
}

.chip-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 6px 16px;
  border-radius: 24px;
  border: 1.5px solid rgba(0,0,0,0.1);
  background: rgba(0,0,0,0.04);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.34, 1.2, 0.64, 1);
  letter-spacing: 0.06rem;
  outline: none;

  &:active { transform: scale(0.95); }
}

.chip-active {
  background: #1A8C55 !important;
  border-color: #1A8C55 !important;
  color: white;
  box-shadow: 0 3px 12px rgba(26,140,85,0.42);
}

.chip-gold.chip-active {
  background: #C8902A !important;
  border-color: #C8902A !important;
  box-shadow: 0 3px 12px rgba(200,144,42,0.42);
}

.chip-fitness.chip-active {
  background: #2A6BC8 !important;
  border-color: #2A6BC8 !important;
  box-shadow: 0 3px 12px rgba(42,107,200,0.34);
}

:global(.body--dark) .filter-chip {
  border-color: rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.75);
}

// ── AI 推薦 banner ────────────────────────────────────────
.ai-banner {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(34, 197, 94, 0.12);
  color: var(--summit-accent, #1A8C55);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06rem;
}

// ── Match badge ───────────────────────────────────────────
.match-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05rem;

  .match-score {
    margin-left: 6px;
    opacity: 0.65;
    font-weight: 600;
  }
}

// ── Result count ─────────────────────────────────────────
.result-count {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.06rem;
  opacity: 0.35;
  text-transform: uppercase;
}

// ── Empty state ───────────────────────────────────────────
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 24px;
  text-align: center;
}

.empty-icon-wrap {
  width: 72px; height: 72px;
  border-radius: 24px;
  background: rgba(0,0,0,0.04);
  display: flex; align-items: center; justify-content: center;
}

:global(.body--dark) .empty-icon-wrap {
  background: rgba(255,255,255,0.05);
}
</style>
