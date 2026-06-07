<template>
  <div class="card anim-slide-up">
    <div class="section-label weather-section-header">
      <div class="weather-section-title">
        明日天氣
        <span v-if="locationName" class="weather-location">{{ locationName }}</span>
      </div>
    </div>
    <div v-if="loading" class="weather-loading">
      正在取得中央氣象署資料並呼叫 Gemini...
    </div>
    <div class="weather-cols">
      <div v-for="w in periods" :key="w.label" class="weather-col">
        <div class="weather-icon">{{ w.icon }}</div>
        <div class="weather-temp">{{ w.temp }}</div>
        <div class="weather-label">{{ w.label }}</div>
      </div>
    </div>
    <div v-if="advice" class="custom-advice-box weather-advice-box">{{ advice }}</div>
    <div v-if="fallbackReasonText" class="weather-fallback-note">{{ fallbackReasonText }}</div>
    <div v-if="source" class="weather-source">來源：{{ source }}</div>
  </div>
</template>

<script setup lang="ts">
import type { WeatherPeriod } from 'src/types/pre';

defineProps<{
  periods: WeatherPeriod[];
  advice: string;
  loading: boolean;
  locationName?: string;
  source?: string;
  fallbackReasonText?: string;
}>();
</script>
