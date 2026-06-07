<template>
  <div
    v-if="pos.x >= 0"
    :style="{
      position: 'fixed',
      zIndex: 9999,
      left: pos.x + 'px',
      top: pos.y + 'px',
      minWidth: '220px',
      background: 'oklch(17% 0.025 240)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: '16px',
      boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
      userSelect: 'none',
      fontFamily: '\'Noto Sans TC\', sans-serif',
      overflow: 'hidden',
      cursor: dragging ? 'grabbing' : 'default',
    }"
  >
    <!-- Handle bar -->
    <div
      @mousedown="handleMouseDown"
      :style="{
        padding: '9px 14px',
        cursor: dragging ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.04)',
      }"
    >
      <div style="display: flex; align-items: center; gap: 6px">
        <span style="font-size: 14px">⚙</span>
        <span
          style="
            color: oklch(68% 0.18 148);
            font-weight: 700;
            font-size: 12px;
            letter-spacing: 0.06rem;
          "
        >
          Tweaks Panel
        </span>
      </div>
      <button
        @click="collapsed = !collapsed"
        style="
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.35);
          cursor: pointer;
          font-size: 13px;
          padding: 0 2px;
        "
      >
        {{ collapsed ? '▲' : '▼' }}
      </button>
    </div>

    <!-- Controls -->
    <div v-if="!collapsed" style="padding: 12px 14px 14px">
      <PanelRow label="主題模式">
        <SegControl
          :options="['dark', 'light']"
          :value="config.theme"
          @change="updateTheme"
        />
      </PanelRow>
      <PanelRow label="經驗等級">
        <SegControl
          :options="['beginner', 'experienced']"
          :value="config.experience"
          @change="updateExperience"
        />
      </PanelRow>
      <PanelRow label="訊號模式">
        <SegControl
          :options="['online', 'offline']"
          :value="config.signal"
          :colorMap="{
            online: 'oklch(62% 0.16 145)',
            offline: 'oklch(68% 0.18 72)',
          }"
          @change="updateSignal"
        />
      </PanelRow>
      <PanelRow label="風險等級">
        <SegControl
          :options="['low', 'mid', 'high']"
          :value="config.risk"
          :colorMap="{
            low: 'oklch(62% 0.16 145)',
            mid: 'oklch(68% 0.18 72)',
            high: 'oklch(60% 0.22 28)',
          }"
          @change="updateRisk"
        />
      </PanelRow>
      <PanelRow label="假資料模式">
        <button
          @click="toggleMock"
          :style="{
            width: '100%',
            padding: '6px 10px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: '\'Noto Sans TC\', sans-serif',
            fontSize: '11px',
            fontWeight: 700,
            background: config.useMock ? 'oklch(68% 0.22 72)' : 'rgba(255,255,255,0.07)',
            color: config.useMock ? '#fff' : 'rgba(255,255,255,0.4)',
            transition: 'all 0.18s ease',
            letterSpacing: '0.04em',
          }"
        >
          {{ config.useMock ? '🗂 Mock ON — 不打 API' : 'Mock OFF' }}
        </button>
      </PanelRow>

      <!-- Status readout -->
      <div
        :style="{
          marginTop: '4px',
          padding: '8px 10px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '10px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.3)',
          lineHeight: 1.7,
        }"
      >
        <div>
          主題
          <span style="color: rgba(255, 255, 255, 0.65); font-weight: 600">{{
            config.theme
          }}</span>
        </div>
        <div>
          訊號
          <span
            :style="{
              color:
                config.signal === 'offline'
                  ? 'oklch(68% 0.18 72)'
                  : 'oklch(62% 0.16 145)',
              fontWeight: 600,
            }"
            >{{ config.signal }}</span
          >
        </div>
        <div>
          風險
          <span :style="{ color: riskColors[config.risk], fontWeight: 600 }">{{
            config.risk
          }}</span>
        </div>
        <div>
          資料
          <span :style="{ color: config.useMock ? 'oklch(68% 0.22 72)' : 'oklch(62% 0.16 145)', fontWeight: 600 }">
            {{ config.useMock ? 'mock' : 'api' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppConfig } from 'src/stores/app';
import { useAppStore } from 'src/stores/app';
import type { VNodeChild } from 'vue';
import { computed, h, onMounted, onUnmounted, ref } from 'vue';

// ── Sub-components (render functions, no runtime compiler needed) ──

const SegControl = {
  props: ['options', 'value', 'colorMap'],
  emits: ['change'],
  setup(
    props: {
      options: string[];
      value: string;
      colorMap?: Record<string, string>;
    },
    { emit }: { emit: (e: 'change', v: string) => void },
  ) {
    return () =>
      h(
        'div',
        { style: 'display:flex;gap:3px' },
        props.options.map((opt: string) =>
          h(
            'button',
            {
              key: opt,
              onClick: () => emit('change', opt),
              style: {
                flex: 1,
                padding: '5px 2px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: "'Noto Sans TC', sans-serif",
                fontSize: '11px',
                fontWeight: 700,
                background:
                  props.value === opt
                    ? (props.colorMap?.[opt] ?? 'oklch(68% 0.18 148)')
                    : 'rgba(255,255,255,0.07)',
                color: props.value === opt ? '#fff' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.18s ease',
                letterSpacing: '0.01em',
              },
            },
            opt,
          ),
        ),
      );
  },
};

const PanelRow = {
  props: ['label'],
  setup(
    props: { label: string },
    {
      slots,
    }: { slots: Record<string, (() => VNodeChild | VNodeChild[]) | undefined> },
  ) {
    return () => {
      const slotContent = slots.default?.();
      const children = Array.isArray(slotContent)
        ? slotContent
        : slotContent
          ? [slotContent]
          : [];
      return h('div', { style: 'margin-bottom:10px' }, [
        h(
          'div',
          {
            style:
              'color:rgba(255,255,255,0.38);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing: 0.06rem;margin-bottom:5px',
          },
          props.label,
        ),
        ...children,
      ]);
    };
  },
};

const appStore = useAppStore();
const config = computed(() => appStore.config);

const riskColors: Record<string, string> = {
  low: 'oklch(62% 0.16 145)',
  mid: 'oklch(68% 0.18 72)',
  high: 'oklch(60% 0.22 28)',
};

const pos = ref({ x: -1, y: -1 });
const dragging = ref(false);
const collapsed = ref(false);
const dragRef = ref({ ox: 0, oy: 0, sx: 0, sy: 0 });

onMounted(() => {
  pos.value = { x: window.innerWidth - 236, y: window.innerHeight - 330 };
});

function handleMouseDown(e: MouseEvent) {
  dragging.value = true;
  dragRef.value = {
    ox: e.clientX,
    oy: e.clientY,
    sx: pos.value.x,
    sy: pos.value.y,
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

function onMove(e: MouseEvent) {
  const dx = e.clientX - dragRef.value.ox;
  const dy = e.clientY - dragRef.value.oy;
  pos.value = {
    x: Math.max(0, Math.min(window.innerWidth - 220, dragRef.value.sx + dx)),
    y: Math.max(0, Math.min(window.innerHeight - 48, dragRef.value.sy + dy)),
  };
}

function onUp() {
  dragging.value = false;
  window.removeEventListener('mousemove', onMove);
  window.removeEventListener('mouseup', onUp);
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onMove);
  window.removeEventListener('mouseup', onUp);
});

function update(patch: Partial<AppConfig>) {
  appStore.updateConfig(patch);
}
function updateTheme(v: string) { update({ theme: v as 'dark' | 'light' }) }
function updateExperience(v: string) { update({ experience: v as 'beginner' | 'experienced' }) }
function updateSignal(v: string) { update({ signal: v as 'online' | 'offline' }) }
function updateRisk(v: string) { update({ risk: v as 'low' | 'mid' | 'high' }) }
function toggleMock() { update({ useMock: !config.value.useMock }) }
</script>
