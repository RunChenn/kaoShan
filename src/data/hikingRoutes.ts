export type RiskLevel = 'low' | 'mid' | 'high'
export type ExperienceLevel = 'beginner' | 'experienced' | 'advanced'

export interface HikingRoute {
  id: string
  emoji: string
  name: string
  distance: string
  elevation: string
  time: string
  risk: RiskLevel
  region: string
  minFitness: number
  minExp: ExperienceLevel
  minSlope: number
  minDays: number
  highlight: string
  center: [number, number]
  polyline: [number, number][]
  start: [number, number]
  end: [number, number]
}

export interface GearItem {
  id: string
  label: string
  icon: string
}

export interface TimelineNode {
  time: string
  place: string
  status: 'done' | 'active' | 'future'
  note?: string
}

export interface AlertConfig {
  type: 'info' | 'warn' | 'danger'
  icon: string
  text: string
}

export const ROUTES: HikingRoute[] = [
  {
    id: 'qixing', emoji: '🌋', name: '七星山主峰',
    distance: '5.5km', elevation: '280m', time: '3h', risk: 'low', region: '北部',
    minFitness: 1, minExp: 'beginner', minSlope: 1, minDays: 1,
    highlight: '北台灣最高峰，天氣好可遠眺台北盆地',
    center: [25.1660, 121.5398],
    polyline: [[25.1540,121.5280],[25.1580,121.5320],[25.1620,121.5360],[25.1660,121.5398]],
    start: [25.1540,121.5280], end: [25.1660,121.5398],
  },
  {
    id: 'baiyang', emoji: '💧', name: '白楊步道',
    distance: '4.4km', elevation: '120m', time: '2h', risk: 'low', region: '東部',
    minFitness: 1, minExp: 'beginner', minSlope: 1, minDays: 1,
    highlight: '太魯閣峽谷美景，穿越隧道見水濂洞',
    center: [24.1523, 121.4890],
    polyline: [[24.1490,121.4830],[24.1505,121.4855],[24.1515,121.4872],[24.1523,121.4890]],
    start: [24.1490,121.4830], end: [24.1523,121.4890],
  },
  {
    id: 'hehuan', emoji: '🌲', name: '合歡山主峰',
    distance: '4.2km', elevation: '325m', time: '2.5h', risk: 'low', region: '中部',
    minFitness: 1, minExp: 'beginner', minSlope: 2, minDays: 1,
    highlight: '全台最易抵達的三千公尺高峰，雲海壯觀',
    center: [24.1460, 121.2793],
    polyline: [[24.1420,121.2720],[24.1435,121.2745],[24.1450,121.2768],[24.1460,121.2793]],
    start: [24.1420,121.2720], end: [24.1460,121.2793],
  },
  {
    id: 'hehuane', emoji: '⛅', name: '合歡東峰',
    distance: '6.2km', elevation: '580m', time: '4h', risk: 'mid', region: '中部',
    minFitness: 2, minExp: 'beginner', minSlope: 2, minDays: 1,
    highlight: '寬闊稜線視野，可見南湖大山群峰',
    center: [24.1500, 121.3100],
    polyline: [[24.1440,121.2900],[24.1460,121.2960],[24.1480,121.3020],[24.1500,121.3100]],
    start: [24.1440,121.2900], end: [24.1500,121.3100],
  },
  {
    id: 'yushan', emoji: '🏔', name: '玉山主峰',
    distance: '8.5km', elevation: '1130m', time: '6h', risk: 'mid', region: '南部',
    minFitness: 3, minExp: 'experienced', minSlope: 3, minDays: 2,
    highlight: '台灣最高峰 3,952m，東北亞第一高峰',
    center: [23.4698, 120.9575],
    polyline: [[23.4550,120.9280],[23.4570,120.9350],[23.4610,120.9430],[23.4640,120.9490],[23.4698,120.9575]],
    start: [23.4550,120.9280], end: [23.4698,120.9575],
  },
  {
    id: 'xueshan', emoji: '❄', name: '雪山主峰',
    distance: '10.9km', elevation: '1340m', time: '8h', risk: 'high', region: '北部',
    minFitness: 4, minExp: 'experienced', minSlope: 4, minDays: 2,
    highlight: '台灣第二高峰，雪季積雪如夢似幻',
    center: [24.3865, 121.2762],
    polyline: [[24.3720,121.2600],[24.3760,121.2650],[24.3800,121.2700],[24.3840,121.2730],[24.3865,121.2762]],
    start: [24.3720,121.2600], end: [24.3865,121.2762],
  },
  {
    id: 'dawu', emoji: '🦅', name: '北大武山',
    distance: '12km', elevation: '1500m', time: '10h', risk: 'high', region: '南部',
    minFitness: 4, minExp: 'experienced', minSlope: 4, minDays: 2,
    highlight: '南台灣最高峰，原住民聖山，林相豐富',
    center: [22.5118, 120.7048],
    polyline: [[22.5000,120.6900],[22.5040,120.6960],[22.5080,120.7010],[22.5118,120.7048]],
    start: [22.5000,120.6900], end: [22.5118,120.7048],
  },
  {
    id: 'jiaming', emoji: '💎', name: '嘉明湖',
    distance: '15km', elevation: '1600m', time: '12h', risk: 'high', region: '東部',
    minFitness: 5, minExp: 'advanced', minSlope: 4, minDays: 3,
    highlight: '天使的眼淚，最美高山湖泊，需入山申請',
    center: [23.1300, 121.0000],
    polyline: [[23.1100,120.9750],[23.1160,120.9840],[23.1230,120.9930],[23.1300,121.0000]],
    start: [23.1100,120.9750], end: [23.1300,121.0000],
  },
]

export const GEAR_ITEMS: GearItem[] = [
  { id: 'boots',    label: '登山鞋',      icon: '👟' },
  { id: 'poles',    label: '登山杖',      icon: '🦯' },
  { id: 'headlamp', label: '頭燈',        icon: '🔦' },
  { id: 'firstaid', label: '急救包',      icon: '🩹' },
  { id: 'rain',     label: '雨衣',        icon: '🧥' },
  { id: 'warm',     label: '保暖層',      icon: '🧣' },
  { id: 'food',     label: '糧食(2日)',   icon: '🍱' },
  { id: 'water',    label: '水（2L）',    icon: '💧' },
  { id: 'map',      label: '地圖/指南針', icon: '🗺' },
  { id: 'sat',      label: '衛星電話',    icon: '📡' },
]

export const TIMELINE_NODES: TimelineNode[] = [
  { time: '06:00', place: '登山口',      status: 'done' },
  { time: '08:30', place: '第一休息點', status: 'done' },
  { time: '11:00', place: '山頂',        status: 'active', note: '★ 目前位置' },
  { time: '14:00', place: '下山',        status: 'future' },
]

export const ALERTS_BY_RISK: Record<string, AlertConfig> = {
  low:  { type: 'info',   icon: '✅', text: '天氣良好，注意午後雷陣雨，預計 16:00 前可下山。' },
  mid:  { type: 'warn',   icon: '⚠', text: '前方路段坡度較陡，建議放慢步伐並補充水分。' },
  high: { type: 'danger', icon: '🚨', text: '偵測到雷雨鋒面接近！強烈建議立即下山。' },
}

export const AI_REPLIES = [
  '目前海拔 2,340m，建議補水並稍作休息。',
  '前方 1.2km 有岔路，請注意路標，避免偏離主路線。',
  '您的步頻持續偏低，疲勞指數已達 62%，建議休息 10 分鐘。',
  '天氣預報顯示 14:00 後有陣雨，請在 13:30 前抵達避雨點。',
  '根據目前速度，預計 11:45 登頂，符合計畫時間。',
]

export const FITNESS_LABELS = ['', '非常差', '差', '普通', '好', '非常好']
export const SLOPE_LABELS   = ['', '緩坡', '中緩坡', '中坡', '陡坡', '急陡坡']
export const EXP_MAP: Record<string, number> = { beginner: 1, experienced: 2, advanced: 3 }

export function getRingColor(score: number): string {
  if (score >= 70) return 'var(--risk-low)'
  if (score >= 50) return 'var(--risk-mid)'
  return 'var(--risk-high)'
}

export function calcSafetyScore(profile: UserProfile, gearCount: number): number {
  const fit   = profile.fitness   || 3
  const exp   = EXP_MAP[profile.experience] || 1
  const slope = profile.slopeCoeff || 3
  const fitScore   = fit * 12
  const expBonus   = (exp - 1) * 10
  const slopeBonus = Math.round((slope - 1) * 2)
  const gearBonus  = Math.round((gearCount / 10) * 12)
  return Math.min(100, fitScore + expBonus + slopeBonus + gearBonus)
}

export interface UserProfile {
  age: string
  weight: string
  height: string
  experience: string
  fitness: number
  slopeCoeff: number
  targetDays: number
}

export interface RecommendedRoute extends HikingRoute {
  matchScore: number
  matchLabel: string
  matchBg: string
  matchColor: string
  reasons: Array<{ icon: string; text: string }>
}

export function getRecommendations(profile: UserProfile): RecommendedRoute[] {
  const userExp   = EXP_MAP[profile.experience] || 1
  const userFit   = profile.fitness    || 3
  const userSlope = profile.slopeCoeff || 3
  const userDays  = profile.targetDays || 1
  const userAge   = parseInt(profile.age) || 30

  return ROUTES.map(r => {
    const reqExp = EXP_MAP[r.minExp] || 1
    let score = 60
    const reasons: Array<{ icon: string; text: string }> = []

    const expDiff = userExp - reqExp
    if (expDiff < 0)      { score -= 40; reasons.push({ icon: '⚠', text: '經驗不足，建議先挑戰較易路線' }) }
    else if (expDiff === 0){ score += 15; reasons.push({ icon: '✅', text: '難度與您的經驗完全吻合' }) }
    else                   { score -= 5;  reasons.push({ icon: '💡', text: '偏簡單，適合輕鬆踏青' }) }

    const fitDiff = userFit - r.minFitness
    if (fitDiff < 0)      { score -= 25; reasons.push({ icon: '⚠', text: `體力需求${FITNESS_LABELS[r.minFitness]}，建議加強訓練` }) }
    else if (fitDiff === 0){ score += 10; reasons.push({ icon: '✅', text: '體力需求與您的評估完美匹配' }) }
    else if (fitDiff >= 2) { score -= 3;  reasons.push({ icon: '💡', text: '體力綽綽有餘' }) }

    const slopeDiff = userSlope - r.minSlope
    if (slopeDiff < 0)    { score -= 15; reasons.push({ icon: '⚠', text: `坡度較陡（${SLOPE_LABELS[r.minSlope]}），請評估膝蓋狀況` }) }
    else                   { reasons.push({ icon: '✅', text: '坡度在您承受範圍內' }) }

    if (r.minDays > userDays)         { score -= 30; reasons.push({ icon: '❌', text: `需要 ${r.minDays} 天，超過您的計劃天數` }) }
    else if (r.minDays === userDays)   { score += 8;  reasons.push({ icon: '✅', text: '天數規劃完全吻合' }) }

    if (userAge > 60 && r.risk === 'high') { score -= 15; reasons.push({ icon: '💡', text: '建議年長者選擇低風險路線' }) }
    if (userAge < 25 && r.risk === 'low' && userExp >= 2) { score -= 5; reasons.push({ icon: '💡', text: '年輕有活力，可挑戰更高難度' }) }

    let matchLabel: string, matchBg: string, matchColor: string
    if (score >= 85)      { matchLabel = '強烈推薦'; matchBg = 'rgba(34,197,94,0.15)';  matchColor = 'var(--risk-low)' }
    else if (score >= 68) { matchLabel = '推薦';     matchBg = 'rgba(34,197,94,0.10)';  matchColor = 'var(--summit-accent)' }
    else if (score >= 50) { matchLabel = '可考慮';   matchBg = 'rgba(251,146,60,0.12)'; matchColor = 'var(--risk-mid)' }
    else                  { matchLabel = '不建議';   matchBg = 'rgba(239,68,68,0.10)';  matchColor = 'var(--risk-high)' }

    return { ...r, matchScore: score, matchLabel, matchBg, matchColor, reasons: reasons.slice(0, 3) }
  }).sort((a, b) => b.matchScore - a.matchScore)
}

export function parseVoiceInput(text: string): { fields: Partial<UserProfile>; hints: string[] } {
  const result: Partial<UserProfile> = {}
  const hints: string[] = []

  const cnNum: Record<string, number> = { '零':0,'一':1,'二':2,'兩':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10 }
  function cn2num(str: string): number | null {
    if (/^\d+$/.test(str)) return parseInt(str)
    let n = 0
    if (str.includes('十')) {
      const parts = str.split('十')
      n = (parts[0] ? (cnNum[parts[0]] ?? 1) : 1) * 10 + (parts[1] ? (cnNum[parts[1]] ?? 0) : 0)
    } else { n = cnNum[str] ?? NaN }
    return isNaN(n) ? null : n
  }

  const ageM = text.match(/(\d{1,3})\s*歲/) || text.match(/我\s*(\d{1,3})/)
  if (ageM) { result.age = ageM[1]; hints.push(`年齡 ${ageM[1]} 歲`) }
  else {
    const cnAge = text.match(/([一二三四五六七八九十]{1,4})\s*歲/)
    if (cnAge) { const v = cn2num(cnAge[1]); if (v) { result.age = String(v); hints.push(`年齡 ${v} 歲`) } }
  }

  const wM = text.match(/(\d{2,3})\s*(?:公斤|kg|KG)/) || text.match(/體重\s*(\d{2,3})/)
  if (wM) { result.weight = wM[1]; hints.push(`體重 ${wM[1]} 公斤`) }

  const hM = text.match(/(\d{3})\s*(?:公分|cm|CM)/) || text.match(/身高\s*(\d{3})/)
  if (hM) { result.height = hM[1]; hints.push(`身高 ${hM[1]} 公分`) }

  if (/新手|初學|第一次|沒什麼經驗|沒有經驗|菜鳥|剛開始/.test(text)) {
    result.experience = 'beginner'; hints.push('新手')
  } else if (/進階|技術路線|百岳|很有經驗|非常有經驗|高手|資深/.test(text)) {
    result.experience = 'advanced'; hints.push('進階')
  } else if (/有經驗|爬過|登過|幾次|多次|老手/.test(text)) {
    result.experience = 'experienced'; hints.push('有經驗')
  }

  if (/體力(?:非常|超|很|極){1,2}好|體力很棒|體力超強/.test(text))         { result.fitness = 5; hints.push('體力非常好') }
  else if (/體力(?:不錯|好|佳|良好)|體能(?:不錯|好)/.test(text))           { result.fitness = 4; hints.push('體力好') }
  else if (/體力(?:普通|一般|中等)|體力還好/.test(text))                    { result.fitness = 3; hints.push('體力普通') }
  else if (/體力(?:不太好|不好|差|弱)|容易累/.test(text))                   { result.fitness = 2; hints.push('體力較差') }
  else if (/體力(?:非常|很|超)差|體力很弱|體力極差/.test(text))             { result.fitness = 1; hints.push('體力很差') }

  if (/坡度(?:都|完全|非常)?(?:沒問題|很棒|很好|很強)|不怕坡|最陡/.test(text)) { result.slopeCoeff = 5; hints.push('坡度耐受強') }
  else if (/坡度(?:還好|可以|不錯)|稍陡也行|坡度好/.test(text))              { result.slopeCoeff = 4; hints.push('坡度耐受中強') }
  else if (/坡度(?:普通|一般|中等)|坡度還可以/.test(text))                   { result.slopeCoeff = 3; hints.push('坡度耐受普通') }
  else if (/怕坡|坡度(?:不好|不行|差)|膝蓋不好/.test(text))                 { result.slopeCoeff = 2; hints.push('坡度耐受弱') }
  else if (/非常怕坡|膝蓋很差|坡度很差/.test(text))                          { result.slopeCoeff = 1; hints.push('坡度耐受很弱') }

  if (/當日|一日|一天|day\s*trip/.test(text))                    { result.targetDays = 1; hints.push('當日來回') }
  else if (/兩天|二天|2\s*天|2\s*日|一夜|一晚/.test(text))       { result.targetDays = 2; hints.push('2天1夜') }
  else if (/三天|3\s*天|3\s*日|兩夜|兩晚/.test(text))            { result.targetDays = 3; hints.push('3天2夜') }
  else if (/四天|4\s*天|多天|好幾天/.test(text))                  { result.targetDays = 4; hints.push('4天以上') }

  return { fields: result, hints }
}
