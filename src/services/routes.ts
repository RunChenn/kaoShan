import { api } from 'src/boot/axios'
import { useAppStore } from 'src/stores/app'
import { mockRoutes } from 'src/mocks/routes'
import type { HikingRoute } from 'src/mocks/routes'

export type RouteDifficulty = 'easy' | 'medium' | 'hard' | 'expert'
export type RouteKind = 'trail' | 'peak'
export type RouteCategory = 'trail' | 'peak' | 'small_peak'
export type ExperienceLevel = 'beginner' | 'experienced' | 'advanced'

export interface RouteRiskScore {
  slip: number
  lost: number
  deviation: number
  rockfall?: number
}

export interface RouteApiResponse {
  id: string
  name: string
  location: string
  route_kind?: RouteKind
  category?: RouteCategory | null
  description?: string | null
  difficulty: RouteDifficulty
  days: number
  distance_km: number
  estimated_hours: number
  elevation_gain: number
  max_elevation: number
  risks: RouteRiskScore
  match_score?: number | null
  match_rank?: number | null
  match_reason?: string | null
  recommendation_source?: 'gemini' | 'heuristic' | null
}

export interface RouteRecommendationRequest {
  age: number
  weight: number
  level: ExperienceLevel
  fitness: number
  target_days: number
  slopeCoeff: number
}

export interface RouteListFilter {
  difficulty?: RouteDifficulty
  fitness?: number | null
  target_days?: number | null
}

export interface RouteSupply {
  food: string
  water: string
  notes: string
}

export interface RouteGear {
  required: string[]
  optional: string[]
}

export interface RouteViewRoute {
  id: string
  emoji: string
  name: string
  distance: string
  distanceKm: number
  elevation: string
  elevationGain: number
  maxElevation?: string
  time: string
  estimatedHours: number
  risk: 'low' | 'mid' | 'high'
  region: string
  routeKind: RouteKind
  category: RouteCategory
  trailShape: string
  minFitness: number
  minExp: ExperienceLevel
  minSlope: number
  minDays: number
  highlight: string
  requiresPermit: boolean
  permitNote?: string
  center: [number, number]
  polyline: [number, number][]
  start: [number, number]
  end: [number, number]
  description: string
  thumbnail: string
  risks: RouteRiskScore
  gear: RouteGear
  supply: RouteSupply
}

export interface RouteRecommendation extends RouteViewRoute {
  matchScore: number
  matchLabel: string
  matchBg: string
  matchColor: string
  reasons: Array<{ icon: string; text: string }>
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash || 1
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function formatDistance(distanceKm: number): string {
  return `${distanceKm.toFixed(1).replace(/\.0$/, '')}km`
}

function formatElevation(elevationGain: number): string {
  return `${Math.round(elevationGain)}m`
}

function buildThumbnail(id: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(id)}/400/250`
}

function buildRouteCenter(route: RouteApiResponse): [number, number] {
  const seed = hashString(`${route.id}:${route.name}:${route.location}`)
  const lat = 21.7 + (seed % 3600) / 1000
  const lon = 119.8 + ((seed >> 11) % 2200) / 1000
  return [Number(lat.toFixed(4)), Number(lon.toFixed(4))]
}

function buildRoutePolyline(
  route: RouteApiResponse,
  center: [number, number],
): [number, number][] {
  const seed = hashString(`${route.id}:${route.location}`)
  const count = clamp(route.days * 4 + 6, 8, 20)
  const latStep = 0.0015 + (seed % 7) * 0.0002
  const lonStep = 0.0013 + ((seed >> 3) % 7) * 0.0002
  const direction = seed % 2 === 0 ? 1 : -1
  const startLat = center[0] - latStep * count * 0.45
  const startLon = center[1] - lonStep * count * 0.35
  const polyline: [number, number][] = []
  for (let i = 0; i < count; i += 1) {
    const wobble = Math.sin((i + 1) * 0.8 + seed / 1000) * 0.0008
    polyline.push([
      Number((startLat + latStep * i + wobble).toFixed(4)),
      Number((startLon + lonStep * i * direction + wobble / 2).toFixed(4)),
    ])
  }
  return polyline
}

function buildRiskLabel(difficulty: RouteDifficulty): 'low' | 'mid' | 'high' {
  return difficulty === 'easy'
    ? 'low'
    : difficulty === 'medium'
      ? 'mid'
      : 'high'
}

function buildTrailShape(route: RouteApiResponse): string {
  if (route.route_kind === 'peak') {
    return route.days >= 2 ? '縱走' : '折返'
  }
  return route.days >= 2 ? '環線' : '折返'
}

function buildMinExp(difficulty: RouteDifficulty): ExperienceLevel {
  return difficulty === 'easy'
    ? 'beginner'
    : difficulty === 'medium'
      ? 'beginner'
      : difficulty === 'hard'
        ? 'experienced'
        : 'advanced'
}

function buildSupply(route: RouteApiResponse): RouteSupply {
  const dailyCalories =
    route.days >= 3
      ? '3,200'
      : route.days === 2
        ? '2,800'
        : '2,000'
  const water =
    route.route_kind === 'peak'
      ? route.days >= 2
        ? '建議 3 公升/天'
        : '建議 2 公升'
      : '建議 1.5-2 公升'
  return {
    food: `建議攜帶 ${dailyCalories} 大卡/天的高熱量行動糧`,
    water,
    notes:
      route.max_elevation >= 3000
        ? '高海拔路線請留意天候與高山症，並預留充足時間下山'
        : '請依天候調整裝備，注意午後變天與補水',
  }
}

function buildGear(route: RouteApiResponse): RouteGear {
  const required = ['登山鞋', '雨衣', '水壺']
  const optional = ['登山杖', '行動電源']

  if (route.route_kind === 'peak' || route.difficulty !== 'easy') {
    required.unshift('保暖層')
    required.push('頭燈')
  }
  if (route.days >= 2) {
    required.push('急救包', '地圖/指南針')
    optional.push('備用電池')
  }
  if (route.max_elevation >= 3000) {
    required.push('帽子', '手套')
    optional.push('衛星電話')
  }

  return {
    required: Array.from(new Set(required)),
    optional: Array.from(new Set(optional)),
  }
}

function buildPermitNote(route: RouteApiResponse): string | undefined {
  if (route.max_elevation >= 3000 || route.route_kind === 'peak') {
    return '請先確認入山、入園與山屋規定，熱門時段建議提前申請'
  }
  return undefined
}

export function hydrateRoute(route: RouteApiResponse): RouteViewRoute {
  const center = buildRouteCenter(route)
  const polyline = buildRoutePolyline(route, center)
  const difficulty = route.difficulty
  const risk = buildRiskLabel(difficulty)
  const category = route.category ?? (route.route_kind ?? 'trail')
  const estimatedHours = Number(route.estimated_hours ?? 0)
  const elevationGain = Number(route.elevation_gain ?? 0)
  const days = Number(route.days ?? 1)
  return {
    id: route.id,
    emoji:
      difficulty === 'easy'
        ? '🌿'
        : difficulty === 'medium'
          ? '⛰'
          : difficulty === 'hard'
            ? '🏔'
            : '❄',
    name: route.name,
    distance: formatDistance(Number(route.distance_km ?? 0)),
    distanceKm: Number(route.distance_km ?? 0),
    elevation: formatElevation(elevationGain),
    elevationGain,
    maxElevation: route.max_elevation > 0 ? formatElevation(route.max_elevation) : '',
    time: `${estimatedHours.toFixed(1).replace(/\.0$/, '')}h`,
    estimatedHours,
    risk,
    region: route.location,
    routeKind: route.route_kind ?? 'trail',
    category,
    trailShape: buildTrailShape(route),
    minFitness:
      difficulty === 'easy'
        ? 1
        : difficulty === 'medium'
          ? 2
          : difficulty === 'hard'
            ? 4
            : 5,
    minExp: buildMinExp(difficulty),
    minSlope:
      difficulty === 'easy'
        ? 1
        : difficulty === 'medium'
          ? 2
          : difficulty === 'hard'
            ? 3
            : 4,
    minDays: days,
    highlight:
      route.match_reason?.trim() ||
      route.description?.trim() ||
      `資料庫路線：${route.location}，請依難度與天數規劃`,
    requiresPermit: route.max_elevation >= 3000 || route.route_kind === 'peak',
    permitNote: buildPermitNote(route),
    center,
    polyline,
    start: polyline[0] ?? center,
    end: polyline[polyline.length - 1] ?? center,
    description: route.description?.trim() || '資料庫路線摘要',
    thumbnail: buildThumbnail(route.id),
    risks: route.risks,
    gear: buildGear(route),
    supply: buildSupply(route),
  }
}

export function routeToRecommendation(route: RouteApiResponse): RouteRecommendation {
  const base = hydrateRoute(route)
  const score =
    route.match_score ??
    (base.risk === 'low' ? 88 : base.risk === 'mid' ? 74 : 60)
  const categoryLabel =
    base.category === 'small_peak'
      ? '小百岳'
      : base.category === 'peak'
        ? '百岳'
        : '步道'
  const isGemini = route.recommendation_source === 'gemini'
  const matchLabel =
    route.match_score != null
      ? isGemini
        ? `${categoryLabel} 推薦`
        : `${categoryLabel} 依條件排序`
      : base.risk === 'low'
        ? '推薦'
        : base.risk === 'mid'
          ? '可考慮'
          : '需審慎評估'
  const matchBg =
    route.match_score != null
      ? 'rgba(34,197,94,0.10)'
      : base.risk === 'low'
        ? 'rgba(34,197,94,0.10)'
        : base.risk === 'mid'
          ? 'rgba(251,146,60,0.12)'
          : 'rgba(239,68,68,0.10)'
  const matchColor =
    route.match_score != null
      ? 'var(--summit-accent)'
      : base.risk === 'low'
        ? 'var(--summit-accent)'
        : base.risk === 'mid'
          ? 'var(--risk-mid)'
          : 'var(--risk-high)'
  const reasons = [
    { icon: '🗂', text: `${categoryLabel}` },
    ...(route.match_reason?.trim()
      ? [{ icon: '🤖', text: route.match_reason.trim() }]
      : []),
    { icon: '📏', text: `距離 ${base.distanceKm}km` },
    { icon: '⬆', text: `累積爬升 ${base.elevationGain}m` },
    { icon: '⏱', text: `預估 ${base.estimatedHours} 小時` },
  ]
  return {
    ...base,
    matchScore: score,
    matchLabel,
    matchBg,
    matchColor,
    reasons: reasons.slice(0, 4),
  }
}

function mockToApiResponse(m: HikingRoute): RouteApiResponse {
  return {
    id: m.id,
    name: m.name,
    location: m.location,
    route_kind: 'trail',
    category: 'trail',
    description: m.description,
    difficulty: m.difficulty,
    days: m.days,
    distance_km: m.distanceKm,
    estimated_hours: m.estimatedHours,
    elevation_gain: m.elevationGain,
    max_elevation: m.elevationGain + 800,
    risks: m.risks,
    match_score: null,
    match_rank: null,
    match_reason: null,
    recommendation_source: null,
  }
}

function isMockMode(): boolean {
  try {
    return useAppStore().config.useMock
  } catch {
    return false
  }
}

export async function fetchRoutes(
  filter: RouteListFilter = {},
): Promise<RouteApiResponse[]> {
  if (isMockMode()) {
    let results = mockRoutes.map(mockToApiResponse)
    if (filter.difficulty) results = results.filter((r) => r.difficulty === filter.difficulty)
    return results
  }
  const { data } = await api.get<RouteApiResponse[]>('/routes', {
    params: {
      difficulty: filter.difficulty,
      fitness: filter.fitness ?? undefined,
      target_days: filter.target_days ?? undefined,
    },
  })
  return data
}

export async function fetchRouteById(routeId: string): Promise<RouteApiResponse> {
  if (isMockMode()) {
    const found = mockRoutes.find((r) => r.id === routeId)
    if (found) return mockToApiResponse(found)
  }
  const { data } = await api.get<RouteApiResponse>(`/routes/${routeId}`)
  return data
}

export async function fetchRecommendedRoutes(
  profile: RouteRecommendationRequest,
): Promise<RouteApiResponse[]> {
  if (isMockMode()) {
    return mockRoutes
      .map(mockToApiResponse)
      .map((r, i) => ({ ...r, match_score: 90 - i * 5, recommendation_source: 'heuristic' as const }))
  }
  const { data } = await api.post<RouteApiResponse[]>('/routes/recommend', profile)
  return data
}
