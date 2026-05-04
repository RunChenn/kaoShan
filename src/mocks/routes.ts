export interface HikingRoute {
  id: string
  name: string
  location: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  days: number
  distanceKm: number
  estimatedHours: number
  elevationGain: number
  thumbnail: string
  risks: {
    slip: number    // 0-100
    lost: number
    deviation: number
    rockfall?: number
  }
  gear: {
    required: string[]
    optional: string[]
  }
  supply: {
    food: string
    water: string
    notes: string
  }
  description: string
}

export const mockRoutes: HikingRoute[] = [
  {
    id: 'yushan-main',
    name: '玉山主峰',
    location: '南投縣信義鄉',
    difficulty: 'expert',
    days: 2,
    distanceKm: 19.7,
    estimatedHours: 16,
    elevationGain: 2150,
    thumbnail: 'https://picsum.photos/seed/yushan/400/250',
    risks: { slip: 72, lost: 35, deviation: 28, rockfall: 55 },
    gear: {
      required: ['登山杖', '頭燈', '保暖層', '雨衣', '急救包', '地圖', '指南針'],
      optional: ['衛星電話', '備用電池', '雪爪'],
    },
    supply: {
      food: '建議攜帶 3,500 大卡/天，高熱量行動糧',
      water: '全程約需 3-4 公升/天，沿途有補水點',
      notes: '需申請入園證及山屋，提前 3 個月預訂',
    },
    description: '台灣第一高峰，海拔 3,952m，為百岳中的名峰。需體力充沛，建議有山屋過夜經驗。',
  },
  {
    id: 'alishan-forest',
    name: '阿里山森林遊樂步道',
    location: '嘉義縣阿里山鄉',
    difficulty: 'easy',
    days: 1,
    distanceKm: 5.2,
    estimatedHours: 2.5,
    elevationGain: 150,
    thumbnail: 'https://picsum.photos/seed/alishan/400/250',
    risks: { slip: 18, lost: 12, deviation: 8, rockfall: 10 },
    gear: {
      required: ['運動鞋', '雨衣', '水壺'],
      optional: ['登山杖', '相機'],
    },
    supply: {
      food: '建議攜帶 1,500 大卡，沿途有餐廳',
      water: '攜帶 1.5 公升即可',
      notes: '適合親子同行，步道平緩易行',
    },
    description: '享譽國際的森林步道，神木群、日出、雲海為三大奇景，適合初學者。',
  },
  {
    id: 'hehuan-main',
    name: '合歡山主峰',
    location: '南投縣仁愛鄉',
    difficulty: 'medium',
    days: 1,
    distanceKm: 4.4,
    estimatedHours: 3,
    elevationGain: 280,
    thumbnail: 'https://picsum.photos/seed/hehuan/400/250',
    risks: { slip: 42, lost: 22, deviation: 18, rockfall: 35 },
    gear: {
      required: ['登山鞋', '保暖層', '防風外套', '頭燈'],
      optional: ['登山杖', '太陽眼鏡'],
    },
    supply: {
      food: '建議攜帶 2,000 大卡',
      water: '攜帶 2 公升，沿途無補水點',
      notes: '高山症注意事項：適應期建議在松雪樓住一晚',
    },
    description: '台灣最容易親近的高山之一，海拔 3,417m，冬季可見雪景。',
  },
  {
    id: 'taroko-shakadang',
    name: '太魯閣砂卡礑步道',
    location: '花蓮縣秀林鄉',
    difficulty: 'easy',
    days: 1,
    distanceKm: 4.4,
    estimatedHours: 2,
    elevationGain: 50,
    thumbnail: 'https://picsum.photos/seed/taroko/400/250',
    risks: { slip: 25, lost: 10, deviation: 5, rockfall: 45 },
    gear: {
      required: ['運動鞋', '頭燈（隧道用）', '水壺'],
      optional: ['泳衣（溪邊戲水）'],
    },
    supply: {
      food: '攜帶輕食即可，步道口有攤販',
      water: '攜帶 1.5 公升',
      notes: '需先申請入園申請，颱風後暫停開放',
    },
    description: '蔚藍溪水與大理石峽谷相映，沿途風景如畫，適合各年齡層。',
  },
  {
    id: 'wuling-sixiu',
    name: '武陵四秀（雪山東峰）',
    location: '台中市和平區',
    difficulty: 'hard',
    days: 2,
    distanceKm: 12.4,
    estimatedHours: 14,
    elevationGain: 1580,
    thumbnail: 'https://picsum.photos/seed/wuling/400/250',
    risks: { slip: 58, lost: 45, deviation: 38, rockfall: 62 },
    gear: {
      required: ['登山靴', '頭燈', '保暖層', '雨衣', '急救包', '登山杖', '地圖'],
      optional: ['衛星電話', '備用糧食', '帳篷'],
    },
    supply: {
      food: '每天需 3,000 大卡，高能量食物優先',
      water: '全程約需 3 公升/天，七卡山莊有水源',
      notes: '需申請入園，冰雪期需技術裝備',
    },
    description: '武陵四秀之一，挑戰性高但視野壯闊，可見圈谷地形。',
  },
]
