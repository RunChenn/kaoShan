<template>
  <div class="risk-chart">
    <svg :viewBox="`0 0 ${width} ${height}`" class="full-width" style="display:block">
      <!-- 網格線 -->
      <line v-for="y in [25, 50, 75]" :key="y" x1="0" :y1="scaleY(y)" :x2="width" :y2="scaleY(y)"
        stroke="#eee" stroke-width="1" stroke-dasharray="4,4" />

      <!-- 填充區域 -->
      <path :d="fillPath" :fill="`url(#riskGrad)`" opacity="0.3" />

      <!-- 折線 -->
      <polyline :points="points" fill="none" stroke="#C62828" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />

      <!-- 數據點 -->
      <circle v-for="(pt, i) in pointCoords" :key="i" :cx="pt.x" :cy="pt.y" r="3.5"
        fill="white" stroke="#C62828" stroke-width="2" />

      <!-- 漸層定義 -->
      <defs>
        <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#C62828" />
          <stop offset="100%" stop-color="#C62828" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- Y 軸標籤 -->
      <text x="4" :y="scaleY(75) - 2" font-size="9" fill="#aaa">75</text>
      <text x="4" :y="scaleY(50) - 2" font-size="9" fill="#aaa">50</text>
      <text x="4" :y="scaleY(25) - 2" font-size="9" fill="#aaa">25</text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ data: number[] }>()

const width = 300
const height = 120
const paddingX = 20
const paddingY = 12

function scaleY(val: number): number {
  return paddingY + (1 - val / 100) * (height - paddingY * 2)
}

const pointCoords = computed(() =>
  props.data.map((v, i) => ({
    x: paddingX + (i / (props.data.length - 1)) * (width - paddingX * 2),
    y: scaleY(v),
  }))
)

const points = computed(() =>
  pointCoords.value.map(p => `${p.x},${p.y}`).join(' ')
)

const fillPath = computed(() => {
  const pts = pointCoords.value
  if (!pts.length) return ''
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const last = pts[pts.length - 1]
  const first = pts[0]
  return `${line} L${last.x},${height} L${first.x},${height} Z`
})
</script>

<style scoped>
.risk-chart { width: 100%; }
</style>
