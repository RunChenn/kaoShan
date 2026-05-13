import Dexie, { type Table } from 'dexie'

const MAX_TILES = 1000
const OSM_BASE = 'https://tile.openstreetmap.org'

// ── IndexedDB schema ──────────────────────────────────────
interface TileRecord { key: string; blob: Blob }
interface PackageRecord { routeId: string; data: unknown }

class KaoshanDB extends Dexie {
  tiles!: Table<TileRecord, string>
  packages!: Table<PackageRecord, string>

  constructor() {
    super('kaoshan-offline')
    this.version(1).stores({
      tiles: 'key',
      packages: 'routeId',
    })
  }
}

export const kaoshanDB = new KaoshanDB()

// ── Tile math ─────────────────────────────────────────────
function lon2tile(lon: number, z: number): number {
  return Math.floor(((lon + 180) / 360) * 2 ** z)
}

function lat2tile(lat: number, z: number): number {
  const rad = (lat * Math.PI) / 180
  return Math.floor(
    (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * 2 ** z,
  )
}

// ── Cache tiles ───────────────────────────────────────────
/**
 * 依 GPX 座標計算 bbox，批次下載 OSM 圖磚存入 IndexedDB。
 * @param points  [lon, lat][] 陣列
 * @param onProgress  (已完成, 總數) callback
 */
export async function cacheTilesForRoute(
  points: [number, number][],
  onProgress?: (completed: number, total: number) => void,
): Promise<void> {
  if (points.length === 0) return

  const lons = points.map(([lon]) => lon)
  const lats = points.map(([, lat]) => lat)
  const lonSpan = Math.max(...lons) - Math.min(...lons)
  const latSpan = Math.max(...lats) - Math.min(...lats)
  const lonPad = lonSpan * 0.2 || 0.08
  const latPad = latSpan * 0.2 || 0.08
  const bbox = {
    minLon: Math.min(...lons) - lonPad,
    maxLon: Math.max(...lons) + lonPad,
    minLat: Math.min(...lats) - latPad,
    maxLat: Math.max(...lats) + latPad,
  }

  // 列舉 zoom 10-15 所有圖磚
  let keys: string[] = []
  for (let z = 10; z <= 15; z++) {
    const xMin = lon2tile(bbox.minLon, z)
    const xMax = lon2tile(bbox.maxLon, z)
    const yMin = lat2tile(bbox.maxLat, z)  // y 軸反向
    const yMax = lat2tile(bbox.minLat, z)
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        keys.push(`${z}/${x}/${y}`)
      }
    }
  }

  // 圖磚過多時降回 zoom 10-13
  if (keys.length > MAX_TILES) {
    keys = keys.filter((k) => Number(k.split('/')[0]) <= 13)
  }

  const total = keys.length
  let completed = 0
  const CONCURRENCY = 6

  for (let i = 0; i < keys.length; i += CONCURRENCY) {
    const batch = keys.slice(i, i + CONCURRENCY)
    await Promise.allSettled(
      batch.map(async (key) => {
        try {
          const existing = await kaoshanDB.tiles.get(key)
          if (!existing) {
            const res = await fetch(`${OSM_BASE}/${key}.png`)
            if (res.ok) {
              const blob = await res.blob()
              await kaoshanDB.tiles.put({ key, blob })
            }
          }
        } catch { /* 略過單張失敗 */ }
        onProgress?.(++completed, total)
      }),
    )
  }
}

// ── Read tile ─────────────────────────────────────────────
export async function getTile(z: number, x: number, y: number): Promise<Blob | null> {
  const record = await kaoshanDB.tiles.get(`${z}/${x}/${y}`)
  return record?.blob ?? null
}

// ── Register MapLibre custom protocol ─────────────────────
/**
 * 向 MapLibre GL 註冊 'cachedosm://' 協定：
 * 先查 IndexedDB，找不到才 fallback 到 OSM。
 */
export function registerCachedTileProtocol(ml: typeof import('maplibre-gl')): void {
  try {
    ml.addProtocol('cachedosm', async (params) => {
      const path = (params.url as string).replace('cachedosm://', '')
      const parts = path.split('/')
      if (parts.length === 3) {
        const [z, x, y] = parts.map(Number)
        try {
          const blob = await getTile(z, x, y)
          if (blob) return { data: await blob.arrayBuffer() }
        } catch { /* fall through */ }
      }
      const res = await fetch(`${OSM_BASE}/${path}.png`)
      if (!res.ok) throw new Error(`OSM tile ${path} failed: ${res.status}`)
      return { data: await res.arrayBuffer() }
    })
  } catch {
    // 已經註冊過則略過
  }
}
