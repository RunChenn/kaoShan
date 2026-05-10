<template>
  <q-page class="q-pb-xl">
    <!-- Header -->
    <div class="q-px-md q-pt-md q-pb-sm">
      <div
        class="text-h5 text-weight-bold anim-slide-down"
        style="letter-spacing: 0.06rem; opacity: 0.4; margin-top: 2px"
      >
        {{ history.length }} 筆登山紀錄
      </div>
    </div>

    <div class="q-px-md q-gutter-y-sm">
      <div
        v-for="(record, i) in history"
        :key="record.id"
        class="history-card anim-slide-up"
        :style="`animation-delay:${0.05 + i * 0.07}s`"
      >
        <!-- Card header (always visible) -->
        <div class="hcard-header" @click="toggleExpand(record.id)">
          <div class="hcard-icon-ring" :class="`diff-${record.difficulty}`">
            <q-icon
              name="landscape"
              size="18px"
              :color="difficultyColor(record.difficulty)"
            />
          </div>
          <div class="col">
            <div class="hcard-title">{{ record.routeName }}</div>
            <div class="hcard-date">{{ record.date }}</div>
          </div>
          <div class="hcard-right">
            <span class="diff-badge" :class="`dbadge-${record.difficulty}`">
              {{ difficultyLabel(record.difficulty) }}
            </span>
            <q-icon
              :name="expanded === record.id ? 'expand_less' : 'expand_more'"
              size="20px"
              style="opacity: 0.35; margin-left: 6px"
            />
          </div>
        </div>

        <!-- Expanded detail -->
        <transition name="expand-fade">
          <div v-if="expanded === record.id" class="hcard-detail">
            <div class="hcard-divider" />

            <!-- Stat chips -->
            <div class="stat-row q-mt-sm q-mb-md">
              <div
                class="hstat"
                v-for="s in recordStats(record)"
                :key="s.label"
              >
                <q-icon :name="s.icon" :color="s.color" size="15px" />
                <span class="hstat-val">{{ s.val }}</span>
                <span class="hstat-lbl">{{ s.label }}</span>
              </div>
            </div>

            <!-- Risk chart -->
            <div
              class="text-caption q-mb-xs"
              style="
                opacity: 0.4;
                font-size: 0.65rem;
                letter-spacing: 0.06rem;
                text-transform: uppercase;
              "
            >
              風險曲線
            </div>
            <RiskCurveChart :data="record.riskCurve" />
          </div>
        </transition>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import RiskCurveChart from 'src/components/RiskCurveChart.vue';
import { mockHistory } from 'src/mocks/history';
import { useAfterStore } from 'src/stores/after';
import { onMounted, ref } from 'vue';

const after = useAfterStore();
const expanded = ref<string | null>(null);

onMounted(() => {
  after.setHistory(mockHistory);
});

const history = after.history.length ? after.history : mockHistory;

function toggleExpand(id: string) {
  expanded.value = expanded.value === id ? null : id;
}

function formatDuration(min: number): string {
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function recordStats(r: (typeof history)[0]) {
  return [
    {
      icon: 'straighten',
      color: 'primary',
      val: `${r.distanceKm} km`,
      label: '距離',
    },
    {
      icon: 'schedule',
      color: 'primary',
      val: formatDuration(r.durationMin),
      label: '時間',
    },
    {
      icon: 'terrain',
      color: 'warning',
      val: `+${r.elevationGain}m`,
      label: '爬升',
    },
    {
      icon: 'local_fire_department',
      color: 'negative',
      val: `${r.calories}`,
      label: 'kcal',
    },
  ];
}

const diffMap = {
  easy: { label: '容易', color: 'positive' },
  medium: { label: '中等', color: 'warning' },
  hard: { label: '困難', color: 'secondary' },
  expert: { label: '專家', color: 'negative' },
};
function difficultyLabel(d: string) {
  return diffMap[d as keyof typeof diffMap]?.label ?? d;
}
function difficultyColor(d: string) {
  return diffMap[d as keyof typeof diffMap]?.color ?? 'grey';
}
</script>

<style lang="scss" scoped>
// ── History card ──────────────────────────────────────────
.history-card {
  background: white;
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: box-shadow 0.25s ease;

  &:hover {
    box-shadow: var(--shadow-md);
  }
}
:global(.body--dark) .history-card {
  background: var(--surface-raised) !important;
  border: 1px solid rgba(255, 255, 255, 0.055);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4) !important;
}

.hcard-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
  &:active {
    background: rgba(0, 0, 0, 0.03);
  }
}

.hcard-icon-ring {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.diff-easy {
  background: var(--risk-low);
}
.diff-medium {
  background: var(--risk-mid);
}
.diff-hard {
  background: var(--risk-high);
}
.diff-expert {
  background: rgba(217, 48, 37, 0.11);
}

.hcard-title {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.06rem;
}
.hcard-date {
  font-size: 0.7rem;
  opacity: 0.45;
  margin-top: 2px;
}

.hcard-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.diff-badge {
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06rem;
}
.dbadge-easy {
  background: rgba(46, 204, 113, 0.14);
  color: #27ae60;
}
.dbadge-medium {
  background: rgba(230, 126, 34, 0.14);
  color: #c0672a;
}
.dbadge-hard {
  background: rgba(200, 144, 42, 0.14);
  color: #a07020;
}
.dbadge-expert {
  background: rgba(217, 48, 37, 0.11);
  color: #c0392b;
}

// ── Detail section ────────────────────────────────────────
.hcard-detail {
  padding: 0 16px 16px;
}
.hcard-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin: 0 -16px 12px;
}
:global(.body--dark) .hcard-divider {
  background: rgba(255, 255, 255, 0.06);
}

.stat-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hstat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 52px;
}
.hstat-val {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06rem;
  line-height: 1.1;
}
.hstat-lbl {
  font-size: 0.6rem;
  opacity: 0.4;
  line-height: 1;
}

// ── Transition ────────────────────────────────────────────
.expand-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.1, 0.64, 1);
}
.expand-fade-leave-active {
  transition: all 0.2s ease;
}
.expand-fade-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.expand-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
