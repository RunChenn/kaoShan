<template>
  <q-page class="q-pb-xl column items-center q-px-md">
    <!-- Page header -->
    <div
      class="full-width q-pt-md q-pb-sm anim-slide-down"
      style="max-width: 380px"
    >
      <div class="text-h5 text-weight-bold" style="letter-spacing: 0.06rem; max-width: 380px; width: 100%"
    >
      <div class="safe-orb safe-orb-1" />
      <div class="safe-orb safe-orb-2" />
      <div class="safe-inner">
        <div class="safe-icon-ring">
          <q-icon name="verified_user" color="white" size="2rem" />
        </div>
        <div
          class="text-h6 text-white text-weight-bold q-mt-md"
          style="letter-spacing: 0.06rem; max-width: 380px"
    >
      <div class="section-label">分享成果卡片預覽</div>
    </div>

    <!-- Flex message preview -->
    <div
      class="flex-preview anim-slide-up"
      style="animation-delay: 0.12s; max-width: 380px; width: 100%"
    >
      <!-- Hero image -->
      <div class="flex-hero">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80"
          class="flex-hero-img"
        />
        <div class="flex-hero-overlay">
          <div class="flex-hero-badge">
            <span class="diff-pill" :class="`dpill-${summary.difficulty}`">{{
              difficultyLabel
            }}</span>
            <span class="done-pill">完成</span>
          </div>
          <div
            class="text-white text-h6 text-weight-bold"
            style="letter-spacing: 0.06rem; max-width: 380px"
    >
      <q-btn
        unelevated
        size="lg"
        class="full-width line-share-btn"
        icon="share"
        label="分享成果給 LINE 朋友"
        :loading="sharing"
        @click="share"
      />
      <q-btn
        flat
        color="grey-6"
        label="複製分享連結"
        icon="link"
        class="full-width"
        style="border-radius: 14px"
        @click="copyLink"
      />
    </div>

    <!-- Success dialog -->
    <q-dialog
      v-model="showSafeSuccess"
      transition-show="jump-up"
      transition-hide="jump-down"
    >
      <q-card class="success-dialog">
        <div class="success-dialog-header">
          <div class="success-ring">
            <q-icon name="check" size="2rem" color="white" />
          </div>
          <div
            class="text-h5 text-white text-weight-bold q-mt-md"
            style="letter-spacing: 0.06rem;
              height: 46px;
              font-weight: 700;
              margin: 0 auto;
            "
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-snackbar v-model="snackbar" message="連結已複製到剪貼簿" />
  </q-page>
</template>

<script setup lang="ts">
import { useLiff } from 'src/composables/useLiff';
import { useAfterStore } from 'src/stores/after';
import { computed, ref } from 'vue';

const after = useAfterStore();
const { shareResult } = useLiff();
const sharing = ref(false);
const sendingReturn = ref(false);
const showSafeSuccess = ref(false);
const snackbar = ref(false);

const summary = after.currentSummary ?? {
  id: '',
  date: '',
  routeName: '尚無資料',
  difficulty: 'easy' as const,
  distanceKm: 0,
  durationMin: 0,
  elevationGain: 0,
  calories: 0,
  maxRiskScore: 0,
  riskCurve: [],
};
const routeScore = computed(() => after.events?.routeScore ?? 7);

const diffMap = {
  easy: { label: '容易', color: 'positive' },
  medium: { label: '中等', color: 'warning' },
  hard: { label: '困難', color: 'secondary' },
  expert: { label: '專家', color: 'negative' },
};

const difficultyLabel = computed(
  () => diffMap[summary.difficulty]?.label ?? '',
);

function formatDuration(min: number): string {
  return `${Math.floor(min / 60)}h${min % 60}m`;
}

const previewStats = computed(() => [
  { val: `${summary.distanceKm}`, color: 'primary', label: '公里' },
  {
    val: formatDuration(summary.durationMin),
    color: 'secondary',
    label: '時間',
  },
  { val: `${summary.elevationGain}`, color: 'warning', label: '爬升(m)' },
]);

async function sendSafeReturn() {
  sendingReturn.value = true;
  await new Promise((r) => setTimeout(r, 1800));
  sendingReturn.value = false;
  showSafeSuccess.value = true;
}

async function share() {
  sharing.value = true;
  try {
    await shareResult({
      routeName: summary.routeName,
      distance: `${summary.distanceKm} km`,
      duration: formatDuration(summary.durationMin),
    });
  } finally {
    sharing.value = false;
  }
}

async function copyLink() {
  const text = `我完成了 ${summary.routeName}！${summary.distanceKm}km，${formatDuration(summary.durationMin)}，爬升 ${summary.elevationGain}m，消耗 ${summary.calories}kcal。已平安返回 ✅`;
  await navigator.clipboard.writeText(text);
  snackbar.value = true;
}
</script>

<style lang="scss" scoped>
// ── Section label ─────────────────────────────────────────
.section-label {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06rem;
  text-transform: uppercase;
  opacity: 0.38;
}

// ── Safe return card ──────────────────────────────────────
.safe-card {
  position: relative;
  border-radius: 28px;
  overflow: hidden;
  background: linear-gradient(145deg, #0c3820, #1a8c55);
  box-shadow:
    0 8px 36px rgba(26, 140, 85, 0.45),
    0 2px 8px rgba(0, 0, 0, 0.2);
}

.safe-orb {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
}
.safe-orb-1 {
  width: 200px;
  height: 200px;
  top: -60px;
  right: -50px;
}
.safe-orb-2 {
  width: 120px;
  height: 120px;
  bottom: -40px;
  left: -30px;
}

.safe-inner {
  position: relative;
  z-index: 1;
  padding: 28px 24px 24px;
}

.safe-icon-ring {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.3);
  animation: safe-ring 2.5s ease-in-out infinite;
}
@keyframes safe-ring {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(255, 255, 255, 0);
  }
}

.safe-btn {
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  border: 1.5px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 50px !important;
  font-weight: 700 !important;
  height: 48px;
  backdrop-filter: blur(8px);
}

// ── Preview card ──────────────────────────────────────────
.flex-preview {
  border-radius: 22px;
  overflow: hidden;
  background: white;
  box-shadow:
    0 6px 32px rgba(0, 0, 0, 0.14),
    0 1px 4px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}
:global(.body--dark) .flex-preview {
  background: var(--surface-raised);
  border-color: rgba(255, 255, 255, 0.07);
  box-shadow: 0 6px 32px rgba(0, 0, 0, 0.4);
}

.flex-hero {
  position: relative;
}
.flex-hero-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
}
.flex-hero-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.72));
  padding: 16px;
}
.flex-hero-badge {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.diff-pill,
.done-pill {
  padding: 2px 9px;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 700;
  color: white;
  backdrop-filter: blur(8px);
}
.dpill-easy {
  background: rgba(46, 204, 113, 0.78);
}
.dpill-medium {
  background: rgba(230, 126, 34, 0.82);
}
.dpill-hard {
  background: rgba(200, 144, 42, 0.85);
}
.dpill-expert {
  background: rgba(217, 48, 37, 0.82);
}
.done-pill {
  background: rgba(26, 140, 85, 0.82);
}

.flex-stats {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  gap: 8px;
}
.flex-stat {
  flex: 1;
  text-align: center;
}
.flex-stat-val {
  font-size: 1.3rem;
  font-weight: 800;
  letter-spacing: 0.06rem;
  line-height: 1;
}
.flex-stat-lbl {
  font-size: 0.62rem;
  opacity: 0.45;
  margin-top: 3px;
}

.flex-chips {
  display: flex;
  gap: 8px;
  padding-bottom: 4px;
}
.achiev-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
}
.chip-fire {
  background: rgba(217, 48, 37, 0.1);
  color: #c0392b;
}
.chip-star {
  background: rgba(230, 126, 34, 0.1);
  color: #c0672a;
}

.flex-footer {
  background: rgba(0, 0, 0, 0.03);
  text-align: center;
  padding: 8px;
  font-size: 0.62rem;
  opacity: 0.35;
}

// ── Share btn ─────────────────────────────────────────────
.line-share-btn {
  background: #06c755 !important;
  color: white !important;
  border-radius: 16px !important;
  font-weight: 700 !important;
  height: 52px;
  box-shadow: 0 4px 20px rgba(6, 199, 85, 0.45) !important;
}

// ── Dialog ────────────────────────────────────────────────
.success-dialog {
  border-radius: 24px !important;
  overflow: hidden;
  min-width: 300px;
}

.success-dialog-header {
  background: linear-gradient(135deg, #0c3820, #1a8c55);
  padding: 28px 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.success-ring {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: safe-ring 2s ease-in-out infinite;
}

.safe-message-preview {
  background: rgba(26, 140, 85, 0.06);
  border: 1px solid rgba(26, 140, 85, 0.15);
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 0.82rem;
  line-height: 1.8;
  opacity: 0.75;
}
</style>
