<template>
  <q-page class="q-pb-xl">

    <!-- Stats hero banner -->
    <div class="stats-hero anim-fade">
      <div class="stats-hero-bg" />
      <div class="stats-hero-content q-pa-lg">
        <div class="text-caption text-white q-mb-xs" style="opacity:0.55;letter-spacing: 0.06rem;text-transform:uppercase">
          最近一次 · {{ latestSummary?.routeName ?? '--' }}
        </div>
        <div class="row q-gutter-md text-center q-mt-sm">
          <div class="col stat-hero-item">
            <div class="stat-hero-val text-primary">{{ latestSummary?.distanceKm ?? '--' }}</div>
            <div class="stat-hero-lbl">公里</div>
          </div>
          <div class="stat-hero-divider" />
          <div class="col stat-hero-item">
            <div class="stat-hero-val text-secondary">{{ formatDuration(latestSummary?.durationMin ?? 0) }}</div>
            <div class="stat-hero-lbl">時間</div>
          </div>
          <div class="stat-hero-divider" />
          <div class="col stat-hero-item">
            <div class="stat-hero-val text-negative">{{ latestSummary?.calories ?? '--' }}</div>
            <div class="stat-hero-lbl">kcal</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation cards -->
    <div class="q-px-md q-pt-md q-gutter-y-sm">
      <div
        v-for="(card, i) in navCards"
        :key="card.path"
        class="nav-card anim-slide-up"
        :style="`animation-delay:${0.05 + i * 0.06}s`"
        @click="$router.push(card.path)"
      >
        <div class="nav-card-icon" :class="`nci-${card.colorKey}`">
          <q-icon :name="card.icon" :color="card.color" size="22px" />
        </div>
        <div class="col">
          <div class="nav-card-title">{{ card.title }}</div>
          <div class="nav-card-desc" v-html="card.desc" />
        </div>
        <div class="nav-card-right">
          <q-badge v-if="card.badge" :color="card.badgeColor" :label="card.badge" class="q-mr-xs" />
          <q-icon name="chevron_right" size="20px" style="opacity:0.28" />
        </div>
      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAfterStore } from 'src/stores/after'
import { mockCurrentSummary, mockHistory } from 'src/mocks/history'

const after = useAfterStore()

onMounted(() => {
  after.setSummary(mockCurrentSummary)
  after.setHistory(mockHistory)
})

const latestSummary = computed(() => after.currentSummary ?? mockCurrentSummary)
const historyCount  = computed(() => after.history.length || mockHistory.length)

const recoveryDays = computed(() => {
  const s = latestSummary.value
  return Math.max(1, Math.min(7, Math.round(s.elevationGain / 1000 * 1.5 + s.durationMin / 60 * 0.5)))
})

function formatDuration(min: number): string {
  if (!min) return '--'
  return `${Math.floor(min / 60)}h${min % 60}m`
}

const navCards = computed(() => [
  {
    path: '/after/summary', icon: 'bar_chart', color: 'primary', colorKey: 'primary',
    title: '本次摘要',
    desc: '數據 · 風險曲線 · 能力基線 · 安全報告',
  },
  {
    path: '/after/summary', icon: 'bedtime', color: 'info', colorKey: 'info',
    title: '身體恢復評估',
    desc: `建議休息 <strong>${recoveryDays.value} 天</strong> · 能量補充建議`,
  },
  {
    path: '/after/summary', icon: 'summarize', color: 'warning', colorKey: 'warning',
    title: '安全報告',
    desc: `偏離 ${latestSummary.value?.deviationCount ?? 0} 次 · 警報 ${latestSummary.value?.alertCount ?? 0} 次 · 改善建議`,
  },
  {
    path: '/after/history', icon: 'history', color: 'secondary', colorKey: 'secondary',
    title: '歷史紀錄',
    desc: `${historyCount.value} 筆過往登山紀錄`,
  },
  {
    path: '/after/share', icon: 'share', color: 'positive', colorKey: 'positive',
    title: 'LINE 成果分享',
    desc: '平安返回通知 · 分享登山成果',
    badge: '平安返回', badgeColor: 'positive',
  },
])
</script>

<style lang="scss" scoped>
// ── Stats hero ────────────────────────────────────────────
.stats-hero {
  position: relative;
  overflow: hidden;
  border-radius: 0 0 28px 28px;
  margin-bottom: 4px;
}

.stats-hero-bg {
  position: absolute; inset: 0;
  background: linear-gradient(145deg, rgba(26,140,85,0.08), rgba(200,144,42,0.06));
  border-bottom: 1px solid rgba(26,140,85,0.12);
}

.stats-hero-content { position: relative; z-index: 1; }

.stat-hero-val {
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: 0.06rem;
  line-height: 1;
}
.stat-hero-lbl {
  font-size: 0.65rem;
  opacity: 0.45;
  font-weight: 600;
  letter-spacing: 0.06rem;
  margin-top: 3px;
}
.stat-hero-divider {
  width: 1px;
  background: rgba(0,0,0,0.08);
  align-self: stretch;
  margin: 4px 0;
  flex-shrink: 0;
}
:global(.body--dark) .stat-hero-divider { background: rgba(255,255,255,0.07); }

.stat-hero-item { min-width: 0; }

// ── Nav cards ─────────────────────────────────────────────
.nav-card {
  display: flex; align-items: center; gap: 14px;
  padding: 16px; border-radius: 20px;
  background: white;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.2, 0.64, 1);

  &:hover  { transform: translateX(3px); }
  &:active { transform: scale(0.98); }
}

:global(.body--dark) .nav-card {
  background: var(--surface-raised) !important;
  border: 1px solid rgba(255,255,255,0.055);
}

.nav-card-icon {
  width: 48px; height: 48px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.nci-primary   { background: rgba(26,140,85,0.11); }
.nci-info      { background: rgba(41,128,185,0.11); }
.nci-warning   { background: rgba(230,126,34,0.11); }
.nci-secondary { background: rgba(200,144,42,0.11); }
.nci-positive  { background: rgba(46,204,113,0.11); }

.nav-card-title {
  font-size: 0.92rem; font-weight: 700;
  letter-spacing: 0.06rem; line-height: 1.2;
}
.nav-card-desc {
  font-size: 0.72rem; opacity: 0.5;
  margin-top: 2px; line-height: 1.4;
}

.nav-card-right {
  display: flex; align-items: center;
  flex-shrink: 0; margin-left: auto;
}
</style>
