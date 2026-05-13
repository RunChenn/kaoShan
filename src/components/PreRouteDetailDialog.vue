<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div
      class="dialog-root"
      :class="{ 'dialog-root-dark': appStore.config.theme === 'dark' }"
    >
      <!-- Header -->
      <div class="dialog-header">
        <button class="close-btn" @click="emit('update:modelValue', false)">
          <span class="material-icons">close</span>
        </button>
        <div class="header-badges">
          <span
            :class="[
              'kind-badge',
              route.routeKind === 'peak' ? 'badge-peak' : 'badge-trail',
            ]"
          >
            {{ route.routeKind === 'peak' ? '百岳' : '步道' }}
          </span>
          <span :class="['diff-badge', `diff-${route.difficulty}`]">
            {{
              { easy: '入門', medium: '中級', hard: '進階' }[route.difficulty]
            }}
          </span>
          <span v-if="source" :class="['risk-badge', `risk-${source.risk}`]">
            {{ { low: '低風險', mid: '中風險', high: '高風險' }[source.risk] }}
          </span>
        </div>
      </div>

      <!-- Scrollable body -->
      <div class="dialog-body">
        <!-- Title block -->
        <div class="title-block">
          <!-- <div class="route-emoji">{{ route.emoji }}</div> -->
          <div>
            <div class="route-name">{{ route.name }}</div>
            <div class="route-region">
              <span class="material-icons region-icon">location_on</span>
              {{ route.region }}
            </div>
          </div>
          <!-- Match score badge -->
          <div
            v-if="source"
            class="match-badge"
            :style="{ background: source.matchBg, color: source.matchColor }"
          >
            <div class="match-score">{{ source.matchScore }}</div>
            <div class="match-label">{{ source.matchLabel }}</div>
          </div>
        </div>

        <!-- Key metrics -->
        <div class="metrics-grid">
          <div class="metric-tile">
            <!-- <span class="material-icons metric-icon" style="color: #4a90d9"
              >straighten</span
            > -->
            <span class="metric-lbl">距離</span>
            <span class="metric-val">{{ route.distance }}</span>
          </div>
          <div class="metric-tile">
            <!-- <span class="material-icons metric-icon" style="color: #e67e22"
              >terrain</span
            > -->
            <span class="metric-lbl">爬升</span>
            <span class="metric-val">{{ route.elevation }}</span>
          </div>
          <div class="metric-tile">
            <!-- <span class="material-icons metric-icon" style="color: #4a90d9"
              >schedule</span
            > -->
            <span class="metric-lbl">預計時間</span>
            <span class="metric-val">{{ route.time }}</span>
          </div>
          <div class="metric-tile">
            <!-- <span class="material-icons metric-icon" style="color: #8b5cf6"
              >calendar_today</span
            > -->
            <span class="metric-lbl">行程天數</span>
            <span class="metric-val">{{ route.days }}</span>
          </div>
        </div>

        <!-- Highlight -->
        <div class="section">
          <div class="section-label">路線特色</div>
          <div class="highlight-text">{{ route.highlight }}</div>
        </div>

        <!-- Min requirements (from source) -->
        <!-- <div v-if="source" class="section">
          <div class="section-label">最低需求</div>
          <div class="req-grid">
            <div class="req-item">
              <span class="req-icon">💪</span>
              <div>
                <div class="req-key">體力需求</div>
                <div class="req-val">{{ fitnessLabel }}</div>
              </div>
            </div>
            <div class="req-item">
              <span class="req-icon">🧗</span>
              <div>
                <div class="req-key">經驗需求</div>
                <div class="req-val">{{ expLabel }}</div>
              </div>
            </div>
            <div class="req-item">
              <span class="req-icon">⛰️</span>
              <div>
                <div class="req-key">坡度耐受</div>
                <div class="req-val">{{ slopeLabel }}</div>
              </div>
            </div>
            <div class="req-item">
              <span class="req-icon">🌙</span>
              <div>
                <div class="req-key">最少天數</div>
                <div class="req-val">{{ source.minDays }} 天</div>
              </div>
            </div>
          </div>
        </div> -->

        <!-- AI match reasons (from source) -->
        <div v-if="source?.reasons?.length" class="section">
          <div class="section-label">配對分析</div>
          <div class="reasons-list">
            <div v-for="r in source.reasons" :key="r.text" class="reason-item">
              <span class="reason-icon">{{ r.icon }}</span>
              <span class="reason-text">{{ r.text }}</span>
            </div>
          </div>
        </div>

        <!-- Permit info -->
        <div class="section">
          <div class="section-label">入山申請</div>
          <div
            :class="[
              'permit-block',
              source?.requiresPermit ? 'permit-yes' : 'permit-no',
            ]"
          >
            <div class="permit-header">
              <span class="permit-icon">{{
                source?.requiresPermit ? '📋' : '✅'
              }}</span>
              <span class="permit-status">
                {{ source?.requiresPermit ? '需要申請' : '免申請，直接入山' }}
              </span>
            </div>
            <div
              v-if="source?.requiresPermit && source.permitNote"
              class="permit-note"
            >
              {{ source.permitNote }}
            </div>
          </div>
        </div>

        <!-- CTA buttons -->
        <div class="cta-row">
          <button class="cta-btn cta-primary" @click="emit('select')">
            <span class="material-icons">hiking</span>
            選擇此路線
          </button>
          <button
            class="cta-btn cta-ghost"
            @click="emit('update:modelValue', false)"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import type { RecommendedRoute } from 'src/data/hikingRoutes';
import { FITNESS_LABELS } from 'src/data/hikingRoutes';
import { useAppStore } from 'src/stores/app';
import { computed } from 'vue';

interface RouteCard {
  emoji: string;
  name: string;
  region: string;
  routeKind: 'trail' | 'peak';
  difficulty: 'easy' | 'medium' | 'hard';
  distance: string;
  elevation: string;
  time: string;
  days: string;
  highlight: string;
  source?: RecommendedRoute;
}

const props = defineProps<{
  modelValue: boolean;
  route: RouteCard;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'select'): void;
}>();

const appStore = useAppStore();
const source = computed(() => props.route.source);

const SLOPE_LABELS = ['', '緩坡', '中緩坡', '中坡', '陡坡', '急陡坡'];
const EXP_LABELS: Record<string, string> = {
  beginner: '新手',
  experienced: '有經驗',
  advanced: '進階',
};

const fitnessLabel = computed(() =>
  source.value ? (FITNESS_LABELS[source.value.minFitness] ?? '—') : '—',
);
const expLabel = computed(() =>
  source.value ? (EXP_LABELS[source.value.minExp] ?? '—') : '—',
);
const slopeLabel = computed(() =>
  source.value ? (SLOPE_LABELS[source.value.minSlope] ?? '—') : '—',
);
</script>

<style scoped>
.dialog-root {
  --dialog-bg: #fff;
  --dialog-text: #111;
  --dialog-border: rgba(0, 0, 0, 0.07);
  --dialog-control-bg: rgba(0, 0, 0, 0.06);
  --dialog-panel-bg: rgba(0, 0, 0, 0.04);
  --dialog-ghost-bg: rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  width: 85%;
  height: 100dvh;
  background: var(--dialog-bg);
  color: var(--dialog-text);
}

@media (max-width: 600px) {
  .dialog-root {
    width: 95%;
  }
}

/* ── Header ─────────────────────────────── */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--dialog-border);
  flex-shrink: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--dialog-control-bg);
  cursor: pointer;
  color: inherit;
  flex-shrink: 0;
}
.close-btn .material-icons {
  font-size: 18px;
}

.header-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-left: auto;
}

.kind-badge,
.diff-badge,
.risk-badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04rem;
}

.badge-peak {
  background: rgba(139, 92, 246, 0.14);
  color: #7c3aed;
}
.badge-trail {
  background: rgba(26, 140, 85, 0.14);
  color: #1a8c55;
}
.diff-easy {
  background: rgba(46, 204, 113, 0.14);
  color: #1e8a4a;
}
.diff-medium {
  background: rgba(230, 126, 34, 0.14);
  color: #c2641a;
}
.diff-hard {
  background: rgba(217, 48, 37, 0.14);
  color: #b91c1c;
}
.risk-low {
  background: rgba(46, 204, 113, 0.12);
  color: #1e8a4a;
}
.risk-mid {
  background: rgba(251, 146, 60, 0.14);
  color: #c2641a;
}
.risk-high {
  background: rgba(239, 68, 68, 0.14);
  color: #b91c1c;
}

/* ── Body ───────────────────────────────── */
.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Title ──────────────────────────────── */
.title-block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.route-emoji {
  font-size: 2.4rem;
  line-height: 1;
  flex-shrink: 0;
}

.route-name {
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.2;
}

.route-region {
  display: flex;
  align-items: center;
  font-size: 0.76rem;
  opacity: 0.5;
  margin-top: 3px;
}
.region-icon {
  font-size: 13px;
  margin-right: 2px;
}

.match-badge {
  margin-left: auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  border-radius: 12px;
  min-width: 56px;
}
.match-score {
  font-size: 1.2rem;
  font-weight: 900;
  line-height: 1;
}
.match-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.04rem;
  margin-top: 2px;
  opacity: 0.8;
}

/* ── Metrics ────────────────────────────── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.metric-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 4px;
  border-radius: 14px;
  background: var(--dialog-panel-bg);
}
.metric-icon {
  font-size: 20px;
}
.metric-val {
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.1;
  text-align: center;
  color: #da8000;
}
.metric-lbl {
  font-size: 0.9rem;
  opacity: 0.42;
  text-align: center;
}

/* ── Section ────────────────────────────── */

.highlight-text {
  font-size: 0.9rem;
  line-height: 1.7;
  opacity: 0.75;
}

/* ── Requirements ───────────────────────── */
.req-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.req-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--dialog-panel-bg);
}

.req-icon {
  font-size: 1.2rem;
}
.req-key {
  font-size: 0.64rem;
  opacity: 0.42;
  font-weight: 600;
  letter-spacing: 0.04rem;
}
.req-val {
  font-size: 0.82rem;
  font-weight: 700;
  margin-top: 1px;
}

/* ── Reasons ────────────────────────────── */
.reasons-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reason-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--dialog-panel-bg);
  font-size: 0.84rem;
  line-height: 1.5;
}

.reason-icon {
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 1px;
}
.reason-text {
  opacity: 0.78;
}

/* ── Permit ─────────────────────────────── */
.permit-block {
  border-radius: 12px;
  padding: 12px 14px;
}

.permit-yes {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.permit-no {
  background: rgba(46, 204, 113, 0.08);
  border: 1px solid rgba(46, 204, 113, 0.2);
}

.permit-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.permit-icon {
  font-size: 1.1rem;
}
.permit-status {
  font-size: 0.88rem;
  font-weight: 700;
}

.permit-note {
  font-size: 0.8rem;
  line-height: 1.6;
  opacity: 0.68;
  margin-top: 6px;
  padding-left: 26px;
}

/* ── CTA ─────────────────────────────────── */
.cta-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
}

.cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: none;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.04rem;
  cursor: pointer;
  transition:
    opacity 0.15s,
    transform 0.12s;
}
.cta-btn:active {
  transform: scale(0.97);
}
.cta-btn .material-icons {
  font-size: 18px;
}

.cta-primary {
  background: #1a8c55;
  color: #fff;
}
.cta-primary:hover {
  opacity: 0.9;
}
.cta-ghost {
  background: var(--dialog-ghost-bg);
  color: inherit;
  opacity: 0.65;
}
.cta-ghost:hover {
  opacity: 1;
}

/* ── Theme variants ─────────────────────── */
:global([data-theme='dark']) .dialog-root,
:global(.body--dark) .dialog-root,
.dialog-root-dark {
  --dialog-bg: #1a1a1a;
  --dialog-text: #f0f0f0;
  --dialog-border: rgba(255, 255, 255, 0.08);
  --dialog-control-bg: rgba(255, 255, 255, 0.08);
  --dialog-panel-bg: rgba(255, 255, 255, 0.07);
  --dialog-ghost-bg: rgba(255, 255, 255, 0.07);
}

:global([data-theme='light']) .dialog-root,
.dialog-root:not(.dialog-root-dark) {
  --dialog-bg: #ffffff;
  --dialog-text: #111111;
  --dialog-border: rgba(0, 0, 0, 0.07);
  --dialog-control-bg: rgba(0, 0, 0, 0.06);
  --dialog-panel-bg: rgba(0, 0, 0, 0.04);
  --dialog-ghost-bg: rgba(0, 0, 0, 0.05);
}
</style>
