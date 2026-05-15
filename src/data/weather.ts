export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'foggy' | 'storm'

export const conditionIcon: Record<WeatherCondition, string> = {
  sunny: 'wb_sunny',
  cloudy: 'cloud',
  rainy: 'grain',
  foggy: 'foggy',
  storm: 'thunderstorm',
}

export const conditionLabel: Record<WeatherCondition, string> = {
  sunny: '晴天',
  cloudy: '多雲',
  rainy: '有雨',
  foggy: '起霧',
  storm: '雷雨',
}

export const conditionColor: Record<WeatherCondition, string> = {
  sunny: 'warning',
  cloudy: 'grey-5',
  rainy: 'info',
  foggy: 'grey-6',
  storm: 'negative',
}
