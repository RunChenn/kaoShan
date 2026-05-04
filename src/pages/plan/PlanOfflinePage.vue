<template>
  <q-page class="offline-page column items-center justify-center q-px-lg q-pb-xl">

    <!-- Icon -->
    <div class="offline-icon-ring anim-scale" :class="`ring-${statusColor}`">
      <q-icon :name="statusIcon" :color="statusColor" size="3rem" />
    </div>

    <!-- Title -->
    <div class="text-h5 text-weight-bold q-mt-lg q-mb-xs anim-slide-up" style="letter-spacing:-0.03em">
      {{ statusTitle }}
    </div>
    <div class="text-body2 text-center q-mb-xl anim-slide-up" style="animation-delay:0.05s;opacity:0.55;max-width:280px">
      {{ statusDesc }}
    </div>

    <!-- Card -->
    <q-card class="hiking-card offline-card full-width anim-slide-up" style="animation-delay:0.08s;max-width:400px">
      <q-card-section class="q-pa-lg">

        <!-- Progress -->
        <div class="row justify-between items-center q-mb-xs">
          <span class="text-caption text-weight-bold" style="opacity:0.55;letter-spacing:0.04em;text-transform:uppercase">
            下載進度
          </span>
          <span class="text-subtitle2 text-weight-bold" :class="`text-${statusColor}`">
            {{ Math.round(progress) }}%
          </span>
        </div>
        <q-linear-progress
          :value="progress / 100"
          :color="statusColor"
          track-color="grey-3"
          size="8px"
          rounded
          class="q-mb-lg"
        />

        <!-- Item list -->
        <div class="q-gutter-y-xs">
          <OfflineItem
            v-for="item in downloadItems"
            :key="item.name"
            :item="item"
            :progress="progress"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- CTA -->
    <div class="full-width q-mt-xl anim-slide-up" style="animation-delay:0.15s;max-width:400px">
      <q-btn
        v-if="status === 'idle'"
        unelevated size="lg"
        color="primary"
        icon="download"
        label="開始下載離線包"
        class="full-width btn-glow-primary"
        style="border-radius:16px;height:54px;font-weight:700"
        @click="startDownload"
      />
      <q-btn
        v-else-if="status === 'done'"
        unelevated size="lg"
        color="positive"
        icon="check"
        label="完成！前往登山"
        class="full-width"
        style="border-radius:16px;height:54px;font-weight:700;box-shadow:0 4px 20px rgba(46,204,113,0.4)"
        @click="$router.push('/hike/map')"
      />
      <q-btn
        v-else
        unelevated size="lg"
        color="grey-3"
        text-color="grey-6"
        label="下載中..."
        class="full-width"
        style="border-radius:16px;height:54px;font-weight:700"
        disable
      />
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlanStore } from 'src/stores/plan'
import OfflineItem from 'src/components/OfflineItem.vue'

const plan     = usePlanStore()
const status   = computed(() => plan.offlineStatus)
const progress = computed(() => plan.offlineProgress)

const statusIcon = computed(() => ({
  done: 'check_circle', downloading: 'downloading', idle: 'cloud_download',
}[status.value] ?? 'cloud_download'))

const statusColor = computed(() => ({
  done: 'positive', downloading: 'primary', idle: 'grey-5',
}[status.value] ?? 'grey-5'))

const statusTitle = computed(() => ({
  done: '離線包已就緒', downloading: '下載中...', idle: '準備離線包',
}[status.value] ?? '準備離線包'))

const statusDesc = computed(() => ({
  done:        '所有資料已快取，可在無網路環境使用',
  downloading: '正在下載地圖圖磚、路線資料與 AI 模型',
  idle:        '下載後可在無網路環境登山，約 85 MB',
}[status.value] ?? ''))

const downloadItems = [
  { name: '地圖圖磚',    size: '42 MB', threshold: 0  },
  { name: '路線 GPX',   size: '3 MB',  threshold: 50 },
  { name: 'AI 風險模型', size: '28 MB', threshold: 60 },
  { name: '緊急求救資料', size: '12 MB', threshold: 88 },
]

function startDownload() { plan.startOfflineDownload() }
</script>

<style lang="scss" scoped>
.offline-page {
  min-height: 70vh;
  padding-top: 48px;
}

.offline-icon-ring {
  width: 96px; height: 96px;
  border-radius: 32px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.4s ease, box-shadow 0.4s ease;
}

.ring-grey-5   { background: rgba(0,0,0,0.05); }
.ring-primary  {
  background: rgba(26,140,85,0.12);
  box-shadow: 0 0 0 8px rgba(26,140,85,0.06);
  animation: breathe-green 2s ease-in-out infinite;
}
.ring-positive {
  background: rgba(46,204,113,0.15);
  box-shadow: 0 0 0 8px rgba(46,204,113,0.08);
}

.offline-card { border-radius: 24px !important; }

@keyframes breathe-green {
  0%, 100% { box-shadow: 0 0 0 8px rgba(26,140,85,0.04); }
  50%       { box-shadow: 0 0 0 14px rgba(26,140,85,0.10); }
}
</style>
