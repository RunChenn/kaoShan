<template>
  <q-page class="q-pb-xl">

    <!-- Page header -->
    <div class="page-header q-px-md q-pt-md q-pb-sm anim-slide-down">
      <div class="text-h5 text-weight-bold page-title">路線推薦</div>
      <div class="text-body2 page-subtitle q-mt-xs">
        根據您的體力評估，為您篩選最適合的路線
      </div>
    </div>

    <!-- Filters -->
    <div class="q-px-md q-pb-sm">
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
        <RouteCard :route="route" @click="selectRoute(route.id)" />
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-if="filteredRoutes.length === 0"
      class="empty-state anim-scale"
      style="animation-delay:0.1s"
    >
      <div class="empty-icon-wrap">
        <q-icon name="search_off" size="2.5rem" color="grey-5" />
      </div>
      <div class="text-subtitle2 text-grey-5 q-mt-sm">沒有符合條件的路線</div>
      <div class="text-caption text-grey-4 q-mt-xs">試試調整篩選條件</div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { mockRoutes } from 'src/mocks/routes'
import { usePlanStore } from 'src/stores/plan'
import RouteCard from 'src/components/RouteCard.vue'

const router = useRouter()
const plan   = usePlanStore()

const selectedDifficulty = ref<string | null>(null)
const selectedDays       = ref<number | null>(null)

const difficulties = [
  { label: '容易', value: 'easy'   },
  { label: '中等', value: 'medium' },
  { label: '困難', value: 'hard'   },
  { label: '專家', value: 'expert' },
]

const dayFilters = [
  { label: '1 天', value: 1 },
  { label: '2 天', value: 2 },
  { label: '3 天以上', value: 3 },
]

function toggleDifficulty(v: string) {
  selectedDifficulty.value = selectedDifficulty.value === v ? null : v
}
function toggleDays(v: number) {
  selectedDays.value = selectedDays.value === v ? null : v
}

const filteredRoutes = computed(() =>
  mockRoutes.filter(r => {
    if (selectedDifficulty.value && r.difficulty !== selectedDifficulty.value) return false
    if (selectedDays.value) {
      if (selectedDays.value === 3 && r.days < 3) return false
      if (selectedDays.value !== 3 && r.days !== selectedDays.value) return false
    }
    return true
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

:global(.body--dark) .filter-chip {
  border-color: rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.75);
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
