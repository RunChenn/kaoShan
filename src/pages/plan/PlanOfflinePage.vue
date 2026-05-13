<template>
  <q-page class="offline-page column items-center justify-center q-px-lg q-pb-xl">

    <!-- Icon -->
    <div class="offline-icon-ring anim-scale" :class="`ring-${statusColor}`">
      <q-icon :name="statusIcon" :color="statusColor" size="3rem" />
    </div>

    <!-- Title -->
    <div class="text-h5 text-weight-bold q-mt-lg q-mb-xs anim-slide-up"
      style="letter-spacing: 0.06rem; opacity: 0.55; max-width: 280px; text-align: center">
      {{ statusTitle }}
    </div>
    <div class="text-caption q-mb-lg anim-slide-up"
      style="opacity: 0.4; max-width: 280px; text-align: center; animation-delay: 0.04s">
      {{ statusDesc }}
    </div>

    <!-- Progress card -->
    <q-card class="hiking-card offline-card full-width anim-slide-up" style="animation-delay: 0.08s; max-width: 400px">
      <q-card-section class="q-pa-lg">

        <!-- Progress bar -->
        <div class="row justify-between items-center q-mb-xs">
          <span class="text-caption text-weight-bold" style="opacity: 0.55; letter-spacing: 0.06rem; text-transform: uppercase">
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
          class="q-mb-xs"
        />
        <div class="text-caption q-mb-lg" style="opacity: 0.4; min-height: 1.2em">
          {{ currentLabel }}
        </div>

        <!-- Step list -->
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

    <!-- Route data card -->
    <q-card class="hiking-card offline-card full-width q-mt-md anim-slide-up" style="animation-delay: 0.12s; max-width: 400px">
      <q-card-section class="q-pa-lg">
        <div class="text-subtitle2 text-weight-bold q-mb-md">離線路線資料</div>
        <div class="route-data-grid">
          <div v-for="row in routeDataRows" :key="row.label" class="route-data-row">
            <span>{{ row.label }}</span>
            <strong>{{ row.value }}</strong>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Gear checklist card -->
    <q-card class="hiking-card offline-card full-width q-mt-md anim-slide-up" style="animation-delay: 0.14s; max-width: 400px">
      <q-card-section class="q-pa-lg">
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle2 text-weight-bold">離線裝備清單</div>
          <q-chip dense color="primary" text-color="white">
            {{ gearChecklist.length }} 項
          </q-chip>
        </div>
        <div class="gear-list">
          <q-chip
            v-for="item in gearChecklist"
            :key="item.label"
            dense
            :outline="item.type === 'optional'"
            :color="item.type === 'required' ? 'primary' : 'grey-6'"
            :text-color="item.type === 'required' ? 'white' : 'grey-8'"
          >
            {{ item.label }}
          </q-chip>
        </div>
      </q-card-section>
    </q-card>

    <!-- CTA buttons -->
    <div class="full-width q-mt-xl anim-slide-up q-gutter-y-sm" style="animation-delay: 0.15s; max-width: 400px">
      <!-- 已下載 -->
      <template v-if="status === 'already'">
        <div class="already-badge q-mb-sm">
          <q-icon name="check_circle" color="positive" size="18px" />
          <span class="text-body2 text-weight-bold text-positive">
            已有離線包（{{ existingDate }}）
          </span>
        </div>
        <q-btn
          unelevated size="lg"
          color="primary"
          icon="refresh"
          label="重新下載"
          class="full-width"
          style="border-radius: 16px; height: 54px; font-weight: 700"
          @click="startDownload"
        />
        <q-btn
          unelevated size="lg"
          outline
          color="primary"
          icon="download"
          label="下載 JSON 備份"
          class="full-width"
          style="border-radius: 16px; height: 50px; font-weight: 700"
          @click="onDownloadJson"
        />
      </template>

      <!-- 等待下載 -->
      <q-btn
        v-else-if="status === 'idle'"
        unelevated size="lg"
        color="primary"
        icon="download"
        label="開始下載離線包"
        class="full-width btn-glow-primary"
        style="border-radius: 16px; height: 54px; font-weight: 700"
        @click="startDownload"
      />

      <!-- 下載中 -->
      <q-btn
        v-else-if="status === 'downloading'"
        unelevated size="lg"
        color="grey-3"
        text-color="grey-6"
        label="下載中..."
        class="full-width"
        style="border-radius: 16px; height: 54px; font-weight: 700"
        disable
      />

      <!-- 完成 -->
      <template v-else-if="status === 'done'">
        <q-btn
          unelevated size="lg"
          color="positive"
          icon="check"
          label="完成！前往登山"
          class="full-width"
          style="border-radius: 16px; height: 54px; font-weight: 700; box-shadow: 0 4px 20px rgba(46,204,113,0.4)"
          @click="$router.push('/hike/map')"
        />
        <q-btn
          unelevated size="lg"
          outline
          color="primary"
          icon="download"
          label="下載 JSON 備份"
          class="full-width"
          style="border-radius: 16px; height: 50px; font-weight: 700"
          @click="onDownloadJson"
        />
      </template>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePlanStore } from 'src/stores/plan'
import OfflineItem from 'src/components/OfflineItem.vue'
import { mockRoutes } from 'src/mocks/routes'
import {
  buildAndSave,
  hasPackage,
  loadPackage,
  downloadAsJson,
} from 'src/composables/useOfflinePackage'
import type { OfflinePackage } from 'src/composables/useOfflinePackage'

const plan = usePlanStore()
const progress = ref(0)
const currentLabel = ref('')
const status = ref<'idle' | 'downloading' | 'done' | 'already'>('idle')
const offlinePkg = ref<OfflinePackage | null>(null)
const existingDate = ref<string | null>(null)

const selectedRoute = computed(() =>
  mockRoutes.find((r) => r.id === plan.selectedRouteId) ?? mockRoutes[0]!,
)

// ── 頁面進入：檢查是否已有離線包 ──────────────────────────
onMounted(async () => {
  if (!plan.selectedRouteId) return
  const alreadyHas = await hasPackage(plan.selectedRouteId)
  if (alreadyHas) {
    status.value = 'already'
    const pkg = await loadPackage(plan.selectedRouteId)
    if (pkg) {
      offlinePkg.value = pkg
      existingDate.value = pkg.createdAt.slice(0, 10)
    }
  }
})

// ── 開始下載 ──────────────────────────────────────────────
async function startDownload() {
  if (!plan.selectedRouteId) return
  status.value = 'downloading'
  progress.value = 0
  currentLabel.value = ''
  offlinePkg.value = null

  try {
    const pkg = await buildAndSave(plan.selectedRouteId, (pct, label) => {
      progress.value = pct
      currentLabel.value = label
    })
    offlinePkg.value = pkg
    status.value = 'done'
  } catch (err) {
    console.error('offline build failed', err)
    status.value = 'idle'
    currentLabel.value = '下載失敗，請重試'
  }
}

function onDownloadJson() {
  if (offlinePkg.value) downloadAsJson(offlinePkg.value)
}

// ── Computed display ──────────────────────────────────────
const statusIcon = computed(() => ({
  done: 'check_circle', downloading: 'downloading', idle: 'cloud_download', already: 'offline_pin',
}[status.value] ?? 'cloud_download'))

const statusColor = computed(() => ({
  done: 'positive', downloading: 'primary', idle: 'grey-5', already: 'positive',
}[status.value] ?? 'grey-5'))

const statusTitle = computed(() => ({
  done: '離線包已就緒',
  downloading: '下載中...',
  idle: '準備離線包',
  already: '離線包已存在',
}[status.value] ?? '準備離線包'))

const statusDesc = computed(() => ({
  done: '所有資料已快取，可在無網路環境使用',
  downloading: '正在下載地圖圖磚、路線資料與裝備清單',
  idle: '下載後可在無網路環境登山',
  already: '可重新下載以更新資料，或直接前往登山',
}[status.value] ?? ''))

const difficultyLabel: Record<string, string> = {
  easy: '入門', medium: '中級', hard: '進階', expert: '專家',
}

const slopeMetersPerKm = computed(() =>
  Math.round(selectedRoute.value.elevationGain / Math.max(selectedRoute.value.distanceKm, 1)),
)

const slopeLabel = computed(() => {
  const s = slopeMetersPerKm.value
  if (s >= 120) return '急陡坡'
  if (s >= 80) return '陡坡'
  if (s >= 45) return '中坡'
  return '緩坡'
})

const routeDataRows = computed(() => [
  { label: '路線', value: selectedRoute.value.name },
  { label: '地點', value: selectedRoute.value.location },
  { label: '時間', value: `${selectedRoute.value.estimatedHours} 小時 / ${selectedRoute.value.days} 天` },
  { label: '距離', value: `${selectedRoute.value.distanceKm} km` },
  { label: '坡度', value: `${slopeLabel.value}（${slopeMetersPerKm.value} m/km）` },
  { label: '爬升', value: `${selectedRoute.value.elevationGain} m` },
  { label: '難度', value: difficultyLabel[selectedRoute.value.difficulty] ?? selectedRoute.value.difficulty },
])

const gearChecklist = computed(() => [
  ...selectedRoute.value.gear.required.map((label) => ({ label, type: 'required' as const })),
  ...selectedRoute.value.gear.optional.map((label) => ({ label, type: 'optional' as const })),
])

// 對應實際下載步驟與進度閾值
const downloadItems = computed(() => [
  {
    name: '準備資料',
    size: '',
    threshold: 0,
    doneThreshold: 5,
    detail: '路線、裝備、安全評估資料',
  },
  {
    name: 'GPX 軌跡',
    size: '',
    threshold: 5,
    doneThreshold: 15,
    detail: '路線軌跡座標點',
  },
  {
    name: '天氣預報',
    size: '',
    threshold: 15,
    doneThreshold: 20,
    detail: '出發前天氣資料',
  },
  {
    name: '地圖圖磚',
    size: '~30 MB',
    threshold: 20,
    doneThreshold: 90,
    detail: `路線周邊 zoom 10–15，共約 300–800 張`,
  },
  {
    name: '寫入本機儲存',
    size: '',
    threshold: 90,
    doneThreshold: 100,
    detail: '存入 IndexedDB，可離線使用',
  },
])
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

.route-data-grid { display: grid; gap: 10px; }

.route-data-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.82rem;
}
.route-data-row span { opacity: 0.55; }
.route-data-row strong { text-align: right; font-size: 0.84rem; }

.gear-list { display: flex; flex-wrap: wrap; gap: 6px; }

.already-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(46, 204, 113, 0.1);
}

@keyframes breathe-green {
  0%, 100% { box-shadow: 0 0 0 8px rgba(26,140,85,0.04); }
  50%       { box-shadow: 0 0 0 14px rgba(26,140,85,0.10); }
}
</style>
