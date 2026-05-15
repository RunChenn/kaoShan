import { api } from 'src/boot/axios'
import { usePlanStore } from 'src/stores/plan'
import type { GearItem, ShoeRecognition, GearAssessResponse, WeatherForecastData } from 'src/stores/plan'
import { cacheTilesForRoute, kaoshanDB } from 'src/composables/useMapTileCache'
import { fetchRouteById, hydrateRoute, type RouteViewRoute } from 'src/services/routes'

// ── Types ─────────────────────────────────────────────────
export interface OfflinePackage {
  version: '1.0'
  routeId: string
  createdAt: string
  route: RouteViewRoute
  gear: {
    items: GearItem[]
    shoe: ShoeRecognition | null
    photoBase64: string | null
  } | null
  safety: {
    profileScore: number
    routeScore: number
    level: string
    summary: string
    tips: string[]
  } | null
  weather: WeatherForecastData | null
  gpx: { tracks: { points: [number, number][]; name?: string }[] } | null
  mapTilesCached: boolean
}

interface GpxApiResponse {
  tracks?: { points: [number, number][]; name?: string }[]
}

// 各路線的近似 GPS 座標（無 GPX 時的 fallback）
const ROUTE_CENTERS: Record<string, [number, number]> = {
  'yushan-main':      [120.957, 23.469],
  'alishan-forest':   [120.806, 23.509],
  'hehuan-main':      [121.277, 24.141],
  'taroko-shakadang': [121.617, 24.157],
  'wuling-sixiu':     [121.330, 24.350],
}

// ── Build & Save ──────────────────────────────────────────
/**
 * 彙整 store 資料 → fetch GPX → 快取圖磚 → 寫入 IndexedDB。
 * @param routeId  路線 ID
 * @param onProgress  (進度 0-100, 標籤) callback
 */
export async function buildAndSave(
  routeId: string,
  onProgress: (pct: number, label: string) => void,
): Promise<OfflinePackage> {
  const plan = usePlanStore()
  const route = hydrateRoute(await fetchRouteById(routeId))

  // 0–5%：彙整 store 資料
  onProgress(0, '準備資料...')
  const gear =
    plan.gearResults.length > 0
      ? {
          items: plan.gearResults,
          shoe: plan.gearShoe,
          photoBase64: plan.gearPhoto,
        }
      : null

  const safety = plan.routeSafety
    ? {
        profileScore: plan.safetyScore ?? 0,
        routeScore: plan.routeSafety.score,
        level: plan.routeSafety.level,
        summary: plan.routeSafety.summary,
        tips: plan.routeSafety.tips,
      }
    : null
  onProgress(5, '準備完成')

  // 5–15%：取得 GPX
  onProgress(5, '取得 GPX 軌跡...')
  let gpx: OfflinePackage['gpx'] = null
  try {
    const { data } = await api.get<GpxApiResponse>(`/routes/${routeId}/gpx`, {
      timeout: 10000,
    })
    if (data.tracks?.length) {
      gpx = { tracks: data.tracks }
    }
  } catch { /* GPX 尚未實作或路線無資料，繼續 */ }
  onProgress(15, 'GPX 完成')

  // 15–20%：天氣資料（從 store 取）
  onProgress(15, '準備天氣資料...')
  const weather = plan.weatherData
  onProgress(20, '天氣完成')

  // 20–90%：快取地圖圖磚
  onProgress(20, '快取地圖圖磚...')
  let mapTilesCached = false
  try {
    const points: [number, number][] =
      gpx?.tracks.flatMap((t) => t.points) ??
      [ROUTE_CENTERS[routeId] ?? [121.0, 23.8]]

    await cacheTilesForRoute(points, (completed, total) => {
      const pct = 20 + Math.round((completed / total) * 70)
      onProgress(Math.min(pct, 89), `下載圖磚 ${completed}/${total}`)
    })
    mapTilesCached = true
  } catch { /* 圖磚快取失敗不中斷流程 */ }

  // 90–100%：儲存離線包
  onProgress(90, '儲存離線包...')
  const pkg: OfflinePackage = {
    version: '1.0',
    routeId,
    createdAt: new Date().toISOString(),
    route,
    gear,
    safety,
    weather,
    gpx,
    mapTilesCached,
  }
  await kaoshanDB.packages.put({ routeId, data: pkg })
  onProgress(100, '完成！')
  return pkg
}

// ── Load ──────────────────────────────────────────────────
export async function loadPackage(routeId: string): Promise<OfflinePackage | null> {
  const record = await kaoshanDB.packages.get(routeId)
  return record ? (record.data as OfflinePackage) : null
}

// ── Has ───────────────────────────────────────────────────
export async function hasPackage(routeId: string): Promise<boolean> {
  const record = await kaoshanDB.packages.get(routeId)
  return !!record
}

// ── Download as JSON ──────────────────────────────────────
/**
 * 觸發瀏覽器下載 JSON 備份檔案（不含圖磚 blob）。
 */
export function downloadAsJson(pkg: OfflinePackage): void {
  const json = JSON.stringify(pkg, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = pkg.createdAt.slice(0, 10).replace(/-/g, '')
  const name = pkg.route.name.replace(/\s+/g, '_')
  a.href = url
  a.download = `kaoshan_${name}_${date}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
