export interface GearItem {
  name: string
  detected: boolean
  confidence: number
}

export const mockGearResults: GearItem[] = [
  { name: '登山杖', detected: true, confidence: 96 },
  { name: '頭燈', detected: true, confidence: 91 },
  { name: '保暖層（羽絨衣）', detected: true, confidence: 88 },
  { name: '雨衣', detected: true, confidence: 84 },
  { name: '急救包', detected: false, confidence: 0 },
  { name: '地圖', detected: false, confidence: 0 },
  { name: '指南針', detected: false, confidence: 0 },
  { name: '水壺（2L+）', detected: true, confidence: 79 },
  { name: '行動糧食', detected: true, confidence: 82 },
  { name: '備用電池', detected: false, confidence: 0 },
]

export const missingCount = mockGearResults.filter(g => !g.detected).length
