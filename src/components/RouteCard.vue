<template>
  <div class="route-card-outer" @click="$emit('click')">
    <q-card class="route-card hiking-card">

      <!-- Image + overlay -->
      <div class="card-img-wrap">
        <q-img :src="route.thumbnail" height="164px" class="card-img" />
        <div class="card-img-overlay" />
        <span class="difficulty-badge" :class="`badge-${route.difficulty}`">
          {{ difficultyLabel }}
        </span>
      </div>

      <!-- Content -->
      <q-card-section class="q-pa-md">
        <div class="route-name q-mb-xs">{{ route.name }}</div>
        <div class="route-location q-mb-sm">
          <q-icon name="location_on" size="13px" class="q-mr-xs" />
          {{ route.location }}
        </div>

        <div class="metrics-grid">
          <div class="metric" v-for="m in metrics" :key="m.label">
            <q-icon :name="m.icon" size="14px" :color="m.color" />
            <span class="metric-val">{{ m.val }}</span>
            <span class="metric-lbl">{{ m.label }}</span>
          </div>
        </div>
      </q-card-section>

      <!-- Chevron -->
      <q-icon name="chevron_right" size="18px" class="card-chevron" />
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { HikingRoute } from 'src/mocks/routes'

const props = defineProps<{ route: HikingRoute }>()
defineEmits<{ (e: 'click'): void }>()

const difficultyMap = {
  easy:   { label: '容易', color: 'positive' },
  medium: { label: '中等', color: 'warning'  },
  hard:   { label: '困難', color: 'secondary'},
  expert: { label: '專家', color: 'negative' },
}

const difficultyLabel = computed(() => difficultyMap[props.route.difficulty].label)

const metrics = computed(() => [
  { icon: 'straighten',    color: 'primary',   val: `${props.route.distanceKm} km`, label: '距離' },
  { icon: 'schedule',      color: 'primary',   val: `${props.route.estimatedHours}h`,label: '時間' },
  { icon: 'calendar_today',color: 'secondary', val: `${props.route.days} 天`,       label: '天數' },
  { icon: 'terrain',       color: 'warning',   val: `+${props.route.elevationGain}m`,label: '爬升' },
])
</script>

<style lang="scss" scoped>
.route-card-outer {
  cursor: pointer;
  transition: transform 0.28s cubic-bezier(0.34, 1.2, 0.64, 1);

  &:hover  { transform: translateY(-4px); }
  &:active { transform: scale(0.985); }
}

.route-card {
  border-radius: 22px !important;
  overflow: hidden;
  position: relative;
  transition: box-shadow 0.28s ease !important;

  .route-card-outer:hover & {
    box-shadow:
      0 12px 40px rgba(0,0,0,0.20),
      0  3px  8px rgba(0,0,0,0.10) !important;
  }
}

// ── Image ────────────────────────────────────────────────
.card-img-wrap {
  position: relative;
  overflow: hidden;
}

.card-img {
  transition: transform 0.5s ease;
  .route-card-outer:hover & { transform: scale(1.04); }
}

.card-img-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 40%,
    rgba(0,0,0,0.55) 100%
  );
}

.difficulty-badge {
  position: absolute;
  top: 10px; right: 10px;
  padding: 4px 11px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  backdrop-filter: blur(10px);

  &.badge-easy   { background: rgba(46,204,113,0.82); color: #fff; }
  &.badge-medium { background: rgba(230,126,34,0.85); color: #fff; }
  &.badge-hard   { background: rgba(200,144,42,0.88); color: #fff; }
  &.badge-expert { background: rgba(217,48,37,0.85);  color: #fff; }
}

// ── Content ──────────────────────────────────────────────
.route-name {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
  padding-right: 20px;
}

.route-location {
  display: flex;
  align-items: center;
  font-size: 0.72rem;
  opacity: 0.5;
}

.metrics-grid {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 40px;

  .metric-val {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }
  .metric-lbl {
    font-size: 0.62rem;
    opacity: 0.45;
    line-height: 1;
  }
}

// ── Chevron ───────────────────────────────────────────────
.card-chevron {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.22;
  transition: opacity 0.2s ease, transform 0.2s ease;

  .route-card-outer:hover & {
    opacity: 0.45;
    transform: translateY(-50%) translateX(2px);
  }
}
</style>
