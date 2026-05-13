<template>
  <q-dialog
    v-model="open"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="detail-dialog">
      <!-- Hero image -->
      <div class="hero-wrap">
        <q-img :src="route.thumbnail" height="220px" class="hero-img" />
        <div class="hero-overlay" />

        <!-- Close button -->
        <q-btn
          flat
          round
          dense
          icon="close"
          class="close-btn"
          @click="emit('update:modelValue', false)"
        />

        <!-- Difficulty badge -->
        <span class="difficulty-badge" :class="`badge-${route.difficulty}`">
          {{ difficultyLabel }}
        </span>

        <!-- Title over image -->
        <div class="hero-title-wrap">
          <div class="hero-name">{{ route.name }}</div>
          <div class="hero-location">
            <q-icon name="location_on" size="13px" class="q-mr-xs" />
            {{ route.location }}
          </div>
        </div>
      </div>

      <!-- Scrollable content -->
      <q-scroll-area class="dialog-scroll">
        <div class="q-pa-md q-gutter-y-lg">
          <!-- Key metrics -->
          <div class="section">
            <div class="metrics-row">
              <div class="metric-tile" v-for="m in metrics" :key="m.label">
                <q-icon :name="m.icon" size="20px" :color="m.color" />
                <span class="tile-val">{{ m.val }}</span>
                <span class="tile-lbl">{{ m.label }}</span>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="section">
            <div class="section-title">路線簡介</div>
            <div class="section-body">{{ route.description }}</div>
          </div>

          <!-- Risk analysis -->
          <div class="section">
            <div class="section-title">風險分析</div>
            <div class="q-gutter-y-sm">
              <div v-for="risk in risks" :key="risk.label" class="risk-row">
                <div class="risk-header">
                  <span class="risk-label">{{ risk.label }}</span>
                  <span class="risk-val" :class="riskColor(risk.value)"
                    >{{ risk.value }}%</span
                  >
                </div>
                <q-linear-progress
                  :value="risk.value / 100"
                  :color="riskColor(risk.value)"
                  track-color="grey-2"
                  rounded
                  size="8px"
                  class="risk-bar"
                />
              </div>
            </div>
          </div>

          <!-- Required gear -->
          <div class="section">
            <div class="section-title">必備裝備</div>
            <div class="gear-grid">
              <div
                v-for="g in route.gear.required"
                :key="g"
                class="gear-chip gear-required"
              >
                <q-icon name="check_circle" size="13px" class="q-mr-xs" />
                {{ g }}
              </div>
            </div>
            <template v-if="route.gear.optional.length">
              <div class="section-subtitle q-mt-sm q-mb-xs">建議攜帶</div>
              <div class="gear-grid">
                <div
                  v-for="g in route.gear.optional"
                  :key="g"
                  class="gear-chip gear-optional"
                >
                  <q-icon
                    name="add_circle_outline"
                    size="13px"
                    class="q-mr-xs"
                  />
                  {{ g }}
                </div>
              </div>
            </template>
          </div>

          <!-- Supply -->
          <div class="section">
            <div class="section-title">補給資訊</div>
            <div class="supply-list">
              <div class="supply-item">
                <q-icon
                  name="restaurant"
                  size="16px"
                  color="orange-6"
                  class="supply-icon"
                />
                <div>
                  <div class="supply-key">食物</div>
                  <div class="supply-text">{{ route.supply.food }}</div>
                </div>
              </div>
              <div class="supply-item">
                <q-icon
                  name="water_drop"
                  size="16px"
                  color="blue-5"
                  class="supply-icon"
                />
                <div>
                  <div class="supply-key">飲水</div>
                  <div class="supply-text">{{ route.supply.water }}</div>
                </div>
              </div>
              <div class="supply-item">
                <q-icon
                  name="info_outline"
                  size="16px"
                  color="grey-6"
                  class="supply-icon"
                />
                <div>
                  <div class="supply-key">注意事項</div>
                  <div class="supply-text">{{ route.supply.notes }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <div class="section cta-section">
            <q-btn
              unelevated
              color="primary"
              label="開始規劃此路線"
              icon="hiking"
              class="cta-btn"
              @click="$emit('select')"
            />
          </div>
        </div>
      </q-scroll-area>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import type { HikingRoute } from 'src/mocks/routes';
import { computed } from 'vue';

const props = defineProps<{
  route: HikingRoute;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'select'): void;
}>();

const open = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const difficultyMap = {
  easy: { label: '容易' },
  medium: { label: '中等' },
  hard: { label: '困難' },
  expert: { label: '專家' },
};

const difficultyLabel = computed(
  () => difficultyMap[props.route.difficulty].label,
);

const metrics = computed(() => [
  {
    icon: 'straighten',
    color: 'primary',
    val: `${props.route.distanceKm} km`,
    label: '距離',
  },
  {
    icon: 'schedule',
    color: 'primary',
    val: `${props.route.estimatedHours} h`,
    label: '預估時間',
  },
  {
    icon: 'calendar_today',
    color: 'secondary',
    val: `${props.route.days} 天`,
    label: '行程天數',
  },
  {
    icon: 'terrain',
    color: 'warning',
    val: `+${props.route.elevationGain} m`,
    label: '累計爬升',
  },
]);

const risks = computed(() => {
  const r = props.route.risks;
  const list = [
    { label: '滑倒風險', value: r.slip },
    { label: '迷路風險', value: r.lost },
    { label: '偏離路線', value: r.deviation },
  ];
  if (r.rockfall !== undefined)
    list.push({ label: '落石風險', value: r.rockfall });
  return list;
});

function riskColor(val: number) {
  if (val >= 60) return 'negative';
  if (val >= 35) return 'warning';
  return 'positive';
}
</script>

<style lang="scss" scoped>
.detail-dialog {
  --dialog-bg: var(--q-color-surface, #fff);
  --dialog-text: #111;
  --dialog-border: rgba(0, 0, 0, 0.07);
  --dialog-control-bg: rgba(0, 0, 0, 0.38);
  --dialog-panel-bg: rgba(0, 0, 0, 0.04);
  --dialog-chip-bg: rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  background: var(--dialog-bg);
  color: var(--dialog-text);
  border-radius: 0;
  height: 100dvh;
}

// ── Hero ─────────────────────────────────────────────────
.hero-wrap {
  position: relative;
  flex-shrink: 0;
}

.hero-img {
  display: block;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.25) 0%,
    transparent 40%,
    rgba(0, 0, 0, 0.65) 100%
  );
}

.close-btn {
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--dialog-control-bg);
  color: #fff;
  backdrop-filter: blur(8px);
}

.difficulty-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 13px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06rem;
  backdrop-filter: blur(10px);

  &.badge-easy {
    background: rgba(46, 204, 113, 0.85);
    color: #fff;
  }
  &.badge-medium {
    background: rgba(230, 126, 34, 0.88);
    color: #fff;
  }
  &.badge-hard {
    background: rgba(200, 144, 42, 0.9);
    color: #fff;
  }
  &.badge-expert {
    background: rgba(217, 48, 37, 0.88);
    color: #fff;
  }
}

.hero-title-wrap {
  position: absolute;
  bottom: 14px;
  left: 16px;
  right: 16px;
  color: #fff;
}

.hero-name {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.04rem;
  line-height: 1.2;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
}

.hero-location {
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  opacity: 0.82;
  margin-top: 3px;
}

// ── Scroll area ───────────────────────────────────────────
.dialog-scroll {
  flex: 1;
  min-height: 0;
  height: 100%;
}

// ── Sections ─────────────────────────────────────────────
.section-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1rem;
  text-transform: uppercase;
  opacity: 0.42;
  margin-bottom: 10px;
}

.section-subtitle {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.06rem;
  text-transform: uppercase;
  opacity: 0.32;
}

.section-body {
  font-size: 0.88rem;
  line-height: 1.7;
  opacity: 0.72;
}

// ── Metrics ───────────────────────────────────────────────
.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.metric-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px;
  border-radius: 16px;
  background: var(--dialog-panel-bg);

  .tile-val {
    font-size: 0.82rem;
    font-weight: 800;
    letter-spacing: 0.04rem;
    line-height: 1.1;
  }

  .tile-lbl {
    font-size: 0.6rem;
    opacity: 0.42;
    text-align: center;
    line-height: 1.2;
  }
}

// ── Risk ─────────────────────────────────────────────────
.risk-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.risk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.risk-label {
  font-size: 0.82rem;
  font-weight: 600;
}

.risk-val {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04rem;
}

.risk-bar {
  border-radius: 4px;
}

// ── Gear ─────────────────────────────────────────────────
.gear-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.gear-chip {
  display: flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.03rem;
}

.gear-required {
  background: rgba(26, 140, 85, 0.12);
  color: #1a8c55;
}

.gear-optional {
  background: var(--dialog-chip-bg);
  opacity: 0.65;
}

// ── Supply ────────────────────────────────────────────────
.supply-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.supply-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--dialog-panel-bg);
}

.supply-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.supply-key {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.05rem;
  opacity: 0.45;
  margin-bottom: 2px;
}

.supply-text {
  font-size: 0.84rem;
  line-height: 1.55;
  opacity: 0.78;
}

// ── CTA ───────────────────────────────────────────────────
.cta-section {
  padding-bottom: 8px;
}

.cta-btn {
  width: 100%;
  border-radius: 14px;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.06rem;
  padding: 14px;
}

/* ── Theme variants ─────────────────────── */
:global([data-theme='dark']) .detail-dialog,
:global(.body--dark) .detail-dialog {
  --dialog-bg: #1a1a1a;
  --dialog-text: #f0f0f0;
  --dialog-border: rgba(255, 255, 255, 0.08);
  --dialog-control-bg: rgba(255, 255, 255, 0.12);
  --dialog-panel-bg: rgba(255, 255, 255, 0.07);
  --dialog-chip-bg: rgba(255, 255, 255, 0.08);
}

:global([data-theme='light']) .detail-dialog {
  --dialog-bg: #ffffff;
  --dialog-text: #111111;
  --dialog-border: rgba(0, 0, 0, 0.07);
  --dialog-control-bg: rgba(0, 0, 0, 0.38);
  --dialog-panel-bg: rgba(0, 0, 0, 0.04);
  --dialog-chip-bg: rgba(0, 0, 0, 0.05);
}
</style>
