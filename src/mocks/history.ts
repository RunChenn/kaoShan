export interface HikeHistory {
  id: string
  date: string
  routeName: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  distanceKm: number
  durationMin: number
  elevationGain: number
  calories: number
  maxRiskScore: number
  riskCurve: number[]
  // 事件回顧
  deviationCount?: number
  alertCount?: number
  maxHeartRate?: number
  lowestSpeed?: number
  restStops?: number
  routeScore?: number
  // 基線比較
  predictedDurationMin?: number
  predictedMaxHR?: number
}

export const mockHistory: HikeHistory[] = [
  {
    id: 'h1',
    date: '2026-04-15',
    routeName: '合歡山主峰',
    difficulty: 'medium',
    distanceKm: 4.4,
    durationMin: 198,
    elevationGain: 280,
    calories: 1240,
    maxRiskScore: 38,
    riskCurve: [12, 18, 22, 30, 35, 38, 32, 28, 22, 18, 15],
    deviationCount: 1,
    alertCount: 2,
    maxHeartRate: 142,
    lowestSpeed: 1.2,
    restStops: 3,
    routeScore: 8,
    predictedDurationMin: 210,
    predictedMaxHR: 135,
  },
  {
    id: 'h2',
    date: '2026-03-22',
    routeName: '阿里山森林遊樂步道',
    difficulty: 'easy',
    distanceKm: 5.2,
    durationMin: 145,
    elevationGain: 150,
    calories: 820,
    maxRiskScore: 20,
    riskCurve: [5, 8, 12, 15, 18, 20, 18, 12, 10, 8, 5],
    deviationCount: 0,
    alertCount: 0,
    maxHeartRate: 118,
    lowestSpeed: 2.1,
    restStops: 1,
    routeScore: 9,
    predictedDurationMin: 150,
    predictedMaxHR: 120,
  },
  {
    id: 'h3',
    date: '2026-02-14',
    routeName: '太魯閣砂卡礑步道',
    difficulty: 'easy',
    distanceKm: 4.4,
    durationMin: 128,
    elevationGain: 50,
    calories: 650,
    maxRiskScore: 15,
    riskCurve: [5, 8, 10, 12, 15, 13, 10, 8, 6, 5, 4],
    deviationCount: 0,
    alertCount: 1,
    maxHeartRate: 112,
    lowestSpeed: 2.4,
    restStops: 2,
    routeScore: 9,
    predictedDurationMin: 120,
    predictedMaxHR: 115,
  },
  {
    id: 'h4',
    date: '2026-01-05',
    routeName: '武陵四秀（雪山東峰）',
    difficulty: 'hard',
    distanceKm: 12.4,
    durationMin: 840,
    elevationGain: 1580,
    calories: 4200,
    maxRiskScore: 68,
    riskCurve: [15, 25, 35, 48, 55, 62, 68, 65, 58, 45, 30],
    deviationCount: 3,
    alertCount: 5,
    maxHeartRate: 165,
    lowestSpeed: 0.6,
    restStops: 7,
    routeScore: 6,
    predictedDurationMin: 780,
    predictedMaxHR: 150,
  },
  {
    id: 'h5',
    date: '2025-11-30',
    routeName: '玉山主峰',
    difficulty: 'expert',
    distanceKm: 19.7,
    durationMin: 960,
    elevationGain: 2150,
    calories: 5800,
    maxRiskScore: 75,
    riskCurve: [20, 30, 42, 55, 65, 72, 75, 70, 62, 48, 35],
    deviationCount: 4,
    alertCount: 6,
    maxHeartRate: 172,
    lowestSpeed: 0.5,
    restStops: 9,
    routeScore: 7,
    predictedDurationMin: 900,
    predictedMaxHR: 155,
  },
]

export const mockCurrentSummary: HikeHistory = {
  id: 'current',
  date: new Date().toISOString().split('T')[0],
  routeName: '玉山主峰',
  difficulty: 'expert',
  distanceKm: 9.8,
  durationMin: 485,
  elevationGain: 1120,
  calories: 2950,
  maxRiskScore: 55,
  riskCurve: [18, 24, 32, 40, 48, 52, 55, 50, 44, 38, 30],
  deviationCount: 2,
  alertCount: 3,
  maxHeartRate: 158,
  lowestSpeed: 0.8,
  restStops: 4,
  routeScore: 7,
  predictedDurationMin: 520,
  predictedMaxHR: 140,
}
