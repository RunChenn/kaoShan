<template>
  <div class="risk-ring-wrap" style="position: relative">
    <svg width="130" height="130" class="risk-ring-svg">
      <circle class="risk-ring-track" cx="65" cy="65" :r="R" />
      <circle
        class="risk-ring-bar"
        cx="65" cy="65" :r="R"
        :stroke-dasharray="C"
        :stroke-dashoffset="offset"
        :stroke="ringColor"
      />
    </svg>
    <div class="risk-ring-label">
      <div :style="{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, color: ringColor }">
        {{ display }}
      </div>
      <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700">/ 100</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { getRingColor } from 'src/data/hikingRoutes'

const props = defineProps<{ score: number }>()

const R = 54
const C = 2 * Math.PI * R

const display = ref(0)
const offset  = computed(() => C - (C * display.value / 100))
const ringColor = computed(() => getRingColor(display.value))

function animateTo(target: number) {
  display.value = 0
  let cur = 0
  function step() {
    cur = Math.min(cur + 2, target)
    display.value = cur
    if (cur < target) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

onMounted(() => animateTo(props.score))
watch(() => props.score, (val) => animateTo(val))
</script>
