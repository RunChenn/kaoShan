<template>
  <div class="recovery-wrap hiking-card">
    <div class="recovery-icon-bg" :style="`--rc: ${colorHex}`">
      <q-avatar :color="color" text-color="white" size="44px">
        <q-icon :name="icon" size="22px" />
      </q-avatar>
    </div>
    <div class="recovery-text">
      <div class="text-subtitle2 text-weight-bold" style="letter-spacing:-0.015em">{{ label }}</div>
      <div class="text-caption" style="opacity:0.55;margin-top:2px;line-height:1.45">{{ desc }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ icon: string; label: string; desc: string; color: string }>()

const colorMap: Record<string, string> = {
  'orange-6': 'rgba(230,126,34,0.1)',
  'brown-4':  'rgba(121,85,72,0.1)',
  'blue-5':   'rgba(41,128,185,0.1)',
  'purple-5': 'rgba(142,68,173,0.1)',
}
const colorHex = computed(() => colorMap[props.color] ?? 'rgba(26,140,85,0.1)')
</script>

<style scoped>
.recovery-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 18px !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateX(2px);
  }
}

.recovery-icon-bg {
  flex-shrink: 0;
  border-radius: 14px;
  background: var(--rc, rgba(26,140,85,0.1));
  padding: 2px;
  display: flex;
}

.recovery-text {
  flex: 1;
  min-width: 0;
}
</style>
