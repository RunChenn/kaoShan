<template>
  <div ref="mapEl" style="width: 100%; height: 100%" />
</template>

<script setup lang="ts">
import L from 'leaflet';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
  theme: 'dark' | 'light';
  gpxTrack?: {
    name: string;
    points: [number, number][];
    segments?: [number, number][][];
    distanceKm: number;
    elevationGain: number;
    elevationLoss: number | null;
    durationMin: number | null;
    averageGradePct: number | null;
    source: 'uploaded-gpx' | 'database-gpx' | 'route-polyline';
    hintSegments: Array<{
      label: string;
      midpoint: [number, number];
      distanceKm: number;
      elevationDeltaM: number;
      gradePct: number | null;
    }>;
  } | null;
  showGpxOverlay?: boolean;
}>();

const mapEl = ref<HTMLDivElement>();
let map: L.Map | null = null;
let routeLayer: L.LayerGroup | null = null; // 路線底線，永遠顯示
let gpxLayer: L.LayerGroup | null = null; // GPX 標記，隨 showGpxOverlay toggle
let hintLayer: L.LayerGroup | null = null;
let resizeObserver: ResizeObserver | null = null;
let tileLayers: {
  osm: L.TileLayer;
  dark: L.TileLayer;
} | null = null;
let activeBaseLayer: L.TileLayer | null = null;

const BASE_TILE_ATTRIBUTION = '© OpenStreetMap contributors';

function tileUrl(theme: string) {
  return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  // return theme === 'dark'
  //   ? 'https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png'
  //   : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
}

function syncBaseLayer() {
  if (!map || !tileLayers) return;

  const nextLayer = props.theme === 'dark' ? tileLayers.osm : tileLayers.osm;
  if (activeBaseLayer === nextLayer) return;

  if (activeBaseLayer && map.hasLayer(activeBaseLayer)) {
    map.removeLayer(activeBaseLayer);
  }
  activeBaseLayer = nextLayer.addTo(map);
}

function drawMap() {
  if (!map) return;
  map.invalidateSize();

  routeLayer?.clearLayers();
  gpxLayer?.clearLayers();
  hintLayer?.clearLayers();

  const bounds = L.latLngBounds([]);
  const track = props.gpxTrack;

  if (!track?.points.length) {
    map.setView([23.7, 121.0], 7);
    return;
  }

  const geometry = track.segments?.length ? track.segments : [track.points];

  const flatGeometry: [number, number][] = [];
  for (const segment of geometry) {
    for (const point of segment) {
      flatGeometry.push(point);
    }
  }
  flatGeometry.forEach((point) => bounds.extend(point));

  const gpxOn = props.showGpxOverlay !== false;

  // 路線底線：永遠顯示（GPX 開啟時橘色虛線，關閉時藍色實線）
  if (routeLayer) {
    L.polyline(geometry as [number, number][][], {
      color: gpxOn ? '#fb923c' : '#3b82f6',
      weight: gpxOn ? 4 : 3,
      opacity: 0.9,
      dashArray: gpxOn ? '8 6' : undefined,
    }).addTo(routeLayer);

    // 起終點標記：永遠顯示
    const firstPoint = geometry[0]?.[0] ?? track.points[0];
    const lastSegment = geometry[geometry.length - 1] ?? track.points;
    const lastPoint =
      lastSegment[lastSegment.length - 1] ??
      track.points[track.points.length - 1];

    if (firstPoint) {
      L.marker(firstPoint, {
        icon: L.divIcon({
          html: '<div class="gpx-marker gpx-marker-start"><span class="material-icons" style="font-size:14px;line-height:1">hiking</span></div>',
          iconSize: [28, 24],
          iconAnchor: [14, 12],
          className: '',
        }),
      }).addTo(routeLayer);
    }
    if (lastPoint) {
      L.marker(lastPoint, {
        icon: L.divIcon({
          html: '<div class="gpx-marker gpx-marker-end"><span class="material-icons" style="font-size:14px;line-height:1">location_on</span></div>',
          iconSize: [28, 24],
          iconAnchor: [14, 12],
          className: '',
        }),
      }).addTo(routeLayer);
    }
  }

  if (gpxOn && hintLayer && track.hintSegments.length) {
    track.hintSegments.forEach((segment) => {
      const marker = L.circleMarker(segment.midpoint, {
        radius: 6,
        color: '#fb923c',
        weight: 2,
        fillColor: '#fff7ed',
        fillOpacity: 1,
        opacity: 0.95,
      }).addTo(hintLayer!);
      const gradeLabel =
        segment.gradePct == null
          ? 'N/A'
          : `${segment.gradePct > 0 ? '+' : ''}${segment.gradePct}%`;
      marker.bindTooltip(
        `<div class="gpx-hint-tooltip">
          <strong>${segment.label}</strong>
          <div>距離 ${segment.distanceKm.toFixed(1)} km</div>
          <div>高程 ${segment.elevationDeltaM >= 0 ? '+' : ''}${segment.elevationDeltaM} m</div>
          <div>坡度 ${gradeLabel}</div>
        </div>`,
        {
          direction: 'top',
          sticky: true,
          opacity: 1,
          className: 'gpx-hint-tooltip-wrap',
        },
      );
    });
  }

  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [48, 48] });
  } else {
    map.setView([23.7, 121.0], 7);
  }
}

onMounted(() => {
  if (!mapEl.value) return;
  map = L.map(mapEl.value, {
    zoomControl: false,
    attributionControl: true,
    center: [23.7, 121.0],
    zoom: 7,
  });
  tileLayers = {
    osm: L.tileLayer(tileUrl('light'), {
      subdomains: 'abc',
      maxZoom: 18,
      attribution: BASE_TILE_ATTRIBUTION,
    }),
    dark: L.tileLayer(tileUrl('dark'), {
      subdomains: 'abc',
      maxZoom: 18,
      attribution: BASE_TILE_ATTRIBUTION,
    }),
  };

  activeBaseLayer = (
    props.theme === 'dark' ? tileLayers.dark : tileLayers.osm
  ).addTo(map);

  routeLayer = L.layerGroup().addTo(map);
  gpxLayer = L.layerGroup().addTo(map);
  hintLayer = L.layerGroup().addTo(map);

  // L.control
  //   .layers(
  //     {
  //       OpenStreetMap: tileLayers.osm,
  //       'OpenStreetMap 夜景': tileLayers.dark,
  //     },
  //     {},
  //     {
  //       collapsed: false,
  //       position: 'topright',
  //     },
  //   )
  //   .addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  map.on('baselayerchange', (event) => {
    activeBaseLayer = event.layer as L.TileLayer;
  });

  drawMap();

  // 修正灰色 tile：分多個時間點通知 Leaflet，覆蓋 CSS transition 各階段
  void nextTick(() => map?.invalidateSize());
  setTimeout(() => map?.invalidateSize(), 150);
  setTimeout(() => map?.invalidateSize(), 400);

  // 容器 resize（例如側欄展開）也補齊
  if (mapEl.value) {
    resizeObserver = new ResizeObserver(() => map?.invalidateSize());
    resizeObserver.observe(mapEl.value);
  }
});

watch([() => props.gpxTrack, () => props.showGpxOverlay], () => drawMap(), {
  deep: true,
});

watch(
  () => props.theme,
  () => syncBaseLayer(),
);

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  if (map) {
    map.remove();
    map = null;
  }
  routeLayer = null;
  gpxLayer = null;
  hintLayer = null;
  tileLayers = null;
  activeBaseLayer = null;
});
</script>

<style scoped>
:deep(.gpx-marker) {
  min-width: 42px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #111827;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.06rem;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);
}

:deep(.gpx-marker-start) {
  background: #fb923c;
}

:deep(.gpx-marker-end) {
  background: #fde68a;
}

:deep(.gpx-hint-tooltip-wrap) {
  background: transparent;
  border: none;
  box-shadow: none;
}

:deep(.gpx-hint-tooltip) {
  min-width: 140px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.95);
  color: #fff;
  border: 1px solid rgba(251, 146, 60, 0.2);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.25);
  font-size: 12px;
}

:deep(.gpx-hint-tooltip strong) {
  font-size: 12px;
  color: #fdba74;
}

:deep(.gpx-hint-tooltip span) {
  line-height: 1.25;
}
</style>
