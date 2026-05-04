export interface WeatherPoint {
  time: string
  temp: number
  condition: 'sunny' | 'cloudy' | 'rainy' | 'foggy' | 'storm'
  windSpeed: number
  humidity: number
  alert: string
}

export const conditionIcon: Record<WeatherPoint['condition'], string> = {
  sunny: 'wb_sunny',
  cloudy: 'cloud',
  rainy: 'grain',
  foggy: 'foggy',
  storm: 'thunderstorm',
}

export const conditionLabel: Record<WeatherPoint['condition'], string> = {
  sunny: '晴天',
  cloudy: '多雲',
  rainy: '有雨',
  foggy: '起霧',
  storm: '雷雨',
}

export const conditionColor: Record<WeatherPoint['condition'], string> = {
  sunny: 'warning',
  cloudy: 'grey-5',
  rainy: 'info',
  foggy: 'grey-6',
  storm: 'negative',
}

export const mockWeatherForecast: WeatherPoint[] = [
  { time: '06:00', temp: 12, condition: 'cloudy', windSpeed: 15, humidity: 78, alert: '' },
  { time: '08:00', temp: 14, condition: 'sunny', windSpeed: 12, humidity: 72, alert: '' },
  { time: '10:00', temp: 16, condition: 'sunny', windSpeed: 10, humidity: 65, alert: '' },
  { time: '12:00', temp: 15, condition: 'cloudy', windSpeed: 18, humidity: 75, alert: '' },
  { time: '14:00', temp: 13, condition: 'rainy', windSpeed: 25, humidity: 88, alert: '雨勢增強，注意滑倒' },
  { time: '16:00', temp: 11, condition: 'storm', windSpeed: 35, humidity: 95, alert: '雷雨警報發布' },
  { time: '18:00', temp: 10, condition: 'foggy', windSpeed: 20, humidity: 92, alert: '濃霧，能見度低' },
]

export interface RouteWeather {
  temp: number
  condition: WeatherPoint['condition']
  windSpeed: number
  humidity: number
  riskLevel: 'low' | 'medium' | 'high'
  forecast: WeatherPoint[]
  departureSuggestion: string
  accidents: { year: number; type: string; desc: string }[]
}

export const mockRouteWeather: Record<string, RouteWeather> = {
  'yushan-main': {
    temp: 8, condition: 'cloudy', windSpeed: 22, humidity: 85, riskLevel: 'medium',
    forecast: mockWeatherForecast,
    departureSuggestion: '建議 06:00 前出發，14:00 前抵達山屋。下午有雷雨風險，請嚴格控制行程速度，心率過高須立即休息。',
    accidents: [
      { year: 2024, type: '滑倒', desc: '8月大雨後路面濕滑，登山者於排雲山莊附近滑落，輕傷' },
      { year: 2023, type: '迷路', desc: '起霧能見度不足，隊伍在主峰叉路口走岔，延誤 3 小時' },
      { year: 2023, type: '高山症', desc: '未充分適應直接衝頂，急性高山症發作，直升機後送' },
      { year: 2022, type: '落石', desc: '風雨後岩壁不穩，落石造成輕傷' },
    ],
  },
  'alishan-forest': {
    temp: 18, condition: 'sunny', windSpeed: 8, humidity: 60, riskLevel: 'low',
    forecast: mockWeatherForecast.slice(0, 5),
    departureSuggestion: '天氣狀況良好，全天皆適合出發。建議早晨 05:30 出發欣賞日出，午後風景亦佳。',
    accidents: [
      { year: 2024, type: '滑倒', desc: '雨後木棧道濕滑，遊客踩空輕傷' },
      { year: 2023, type: '迷路', desc: '夜間拍攝日出，路燈不足走錯步道' },
    ],
  },
  'hehuan-main': {
    temp: 10, condition: 'cloudy', windSpeed: 18, humidity: 78, riskLevel: 'medium',
    forecast: mockWeatherForecast,
    departureSuggestion: '下午可能有陣雨，建議 07:00 出發，12:00 前完成攻頂並開始下山。注意高山症徵狀。',
    accidents: [
      { year: 2024, type: '高山症', desc: '快速上升未適應，頭痛、嘔吐' },
      { year: 2023, type: '落石', desc: '冬季積雪融化後岩石鬆動，碎石滾落' },
      { year: 2022, type: '失溫', desc: '突變天氣，衣物不足導致輕度失溫' },
    ],
  },
  'taroko-shakadang': {
    temp: 24, condition: 'sunny', windSpeed: 5, humidity: 55, riskLevel: 'low',
    forecast: mockWeatherForecast.slice(0, 5),
    departureSuggestion: '天氣極佳，適合全天活動。注意峽谷午後氣溫較高，多補水。颱風後請確認步道開放狀態。',
    accidents: [
      { year: 2024, type: '滑倒', desc: '溪邊岩石青苔濕滑，遊客踩空落水，輕傷' },
      { year: 2023, type: '落石', desc: '颱風後崩塌，臨時封閉三週' },
    ],
  },
  'wuling-sixiu': {
    temp: 6, condition: 'rainy', windSpeed: 28, humidity: 92, riskLevel: 'high',
    forecast: mockWeatherForecast,
    departureSuggestion: '⚠️ 目前氣象條件不佳，風險等級高。強烈建議推遲出發，等待天氣窗口。如必須前往，務必攜帶衛星電話與完整保暖裝備。',
    accidents: [
      { year: 2024, type: '迷路', desc: '大霧能見度極低，隊伍迷失於七卡山莊附近，搜救隊出動' },
      { year: 2024, type: '滑倒', desc: '雪季路面結冰，滑倒骨折，直升機後送' },
      { year: 2023, type: '失溫', desc: '強風降溫過快，未攜帶足夠保暖層，輕度失溫' },
      { year: 2022, type: '落石', desc: '攀登東峰時落石，造成輕傷' },
    ],
  },
}
