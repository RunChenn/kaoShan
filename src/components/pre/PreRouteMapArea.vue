<template>
  <div class="p1-map-area">
    <input
      ref="gpxFileInput"
      type="file"
      accept=".gpx"
      hidden
      @change="$emit('import-gpx', $event)"
    />
    <div class="p1-map-toolbar">
      <div class="route-label-pill">
        <span class="route-label-pill-title">{{ route.name }}</span>
        <span :class="['route-diff-badge', `diff-${difficultyKey}`]">
          {{ difficultyLabel }}
        </span>
      </div>
      <div class="p1-map-actions">
        <button class="custom-btn gpx-map-btn" @click="gpxFileInput?.click()">
          匯入 GPX
        </button>
        <button
          class="custom-btn gpx-map-btn"
          :disabled="!gpxTrack"
          @click="$emit('download-gpx')"
        >
          下載 GPX
        </button>
        <button class="custom-btn gpx-map-btn" @click="$emit('toggle-gpx')">
          {{ showGpxOverlay ? '關閉 GPX 疊圖' : '顯示 GPX 疊圖' }}
        </button>
      </div>
    </div>

    <div class="row gpx-map-status">
      <strong class="gpx-map-status-title">
        <span class="material-icons">route</span>
        {{ route.name }}
      </strong>
      <div v-if="routeGpxLoading" class="gpx-map-loading">
        <q-spinner size="18px" color="primary" />
        <span>正在取得 GPX...</span>
      </div>
      <div class="row justify-between gpx-map-meta">
        <div class="col-auto gpx-map-meta-label">海拔高度</div>
        <div class="col gpx-map-meta-value">{{ route.maxElevation || '—' }}</div>
      </div>
      <div class="row justify-between gpx-map-meta">
        <div class="col-auto gpx-map-meta-label">距離</div>
        <div class="col gpx-map-meta-value">{{ route.distance }}</div>
      </div>
      <div class="row justify-between gpx-map-meta">
        <div class="col-auto gpx-map-meta-label">爬升</div>
        <div class="col gpx-map-meta-value">{{ route.elevation }}</div>
      </div>
      <div class="row justify-between gpx-map-meta">
        <div class="col-auto gpx-map-meta-label">預計時間</div>
        <div class="col gpx-map-meta-value">{{ route.time }}</div>
      </div>
    </div>

    <MapPhase1
      :theme="theme"
      :gpx-track="gpxTrack"
      :route-location="routeMapLocation"
      :route-location-label="routeMapLocationLabel"
      :show-gpx-overlay="showGpxOverlay"
      class="p1-map-layer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import MapPhase1 from 'src/components/MapPhase1.vue';
import type { RecommendedRoute, GpxMapTrack } from 'src/types/pre';

const props = defineProps<{
  route: RecommendedRoute;
  gpxTrack?: GpxMapTrack | null;
  showGpxOverlay: boolean;
  theme: 'light' | 'dark';
  routeMapLocation?: [number, number] | null;
  routeMapLocationLabel?: string | null;
  routeGpxLoading: boolean;
}>();

defineEmits<{
  'import-gpx': [event: Event];
  'download-gpx': [];
  'toggle-gpx': [];
}>();

const gpxFileInput = ref<HTMLInputElement | null>(null);

const difficultyKey = computed(() =>
  props.route.risk === 'low' ? 'easy' : props.route.risk === 'mid' ? 'medium' : 'hard',
);

const difficultyLabel = computed(() =>
  ({ easy: '入門', medium: '中級', hard: '進階' }[difficultyKey.value]),
);
</script>
