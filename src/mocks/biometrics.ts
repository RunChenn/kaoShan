export interface BiometricSnapshot {
  timestamp: number
  heartRate: number
  steps: number
  altitude: number
  speed: number
}

export interface AiDecision {
  action: 'proceed' | 'rest' | 'retreat'
  confidence: number  // 0-100
  reason: string
  riskScore: number
}

function generateBiometrics(): BiometricSnapshot[] {
  const now = Date.now()
  const snapshots: BiometricSnapshot[] = []
  let baseAlt = 2800
  let baseSteps = 5000

  for (let i = 0; i < 60; i++) {
    baseAlt += Math.random() * 15 - 3
    baseSteps += Math.floor(Math.random() * 80 + 20)
    snapshots.push({
      timestamp: now - (60 - i) * 60 * 1000,
      heartRate: 72 + Math.floor(Math.random() * 40) + (i > 40 ? 20 : 0),
      steps: baseSteps,
      altitude: Math.round(baseAlt),
      speed: parseFloat((1.5 + Math.random() * 2).toFixed(1)),
    })
  }
  return snapshots
}

export const mockBiometrics: BiometricSnapshot[] = generateBiometrics()

export const mockCurrentBiometric: BiometricSnapshot = {
  timestamp: Date.now(),
  heartRate: 118,
  steps: 12450,
  altitude: 3245,
  speed: 2.3,
}

export const mockAiDecision: AiDecision = {
  action: 'rest',
  confidence: 78,
  reason: '偵測到心率持續偏高（118 bpm），建議休息 10 分鐘補充水分後再評估。當前天氣穩定，路況良好。',
  riskScore: 42,
}
