<template>
  <div class="offline-item" :class="{ 'item-done': done, 'item-active': started && !done }">
    <div class="item-icon-wrap" :class="done ? 'icon-done' : started ? 'icon-active' : 'icon-idle'">
      <q-icon
        :name="done ? 'check' : started ? 'downloading' : 'schedule'"
        :color="done ? 'positive' : started ? 'primary' : 'grey-4'"
        size="16px"
      />
    </div>
    <div class="col">
      <div class="row justify-between items-center">
        <span class="item-name">{{ item.name }}</span>
        <span class="item-size">{{ item.size }}</span>
      </div>
      <div v-if="item.detail" class="item-detail">{{ item.detail }}</div>
      <div v-if="started && !done" class="item-progress-bar q-mt-xs">
        <div class="item-progress-fill" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  item: { name: string; size: string; threshold: number; detail?: string }
  progress: number
}>()

const started = computed(() => props.progress >= props.item.threshold)
const done    = computed(() => props.progress >= props.item.threshold + 12 || props.progress >= 100)
</script>

<style scoped>
.offline-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  transition: opacity 0.3s ease;
}

.item-icon-wrap {
  width: 32px; height: 32px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: background 0.3s ease;
}
.icon-idle   { background: rgba(0,0,0,0.05); }
.icon-active { background: rgba(26,140,85,0.12); animation: breathe-green 1.5s ease-in-out infinite; }
.icon-done   { background: rgba(46,204,113,0.15); }

.item-name { font-size: 0.85rem; font-weight: 500; letter-spacing: -0.01em; }
.item-size { font-size: 0.7rem; opacity: 0.4; }
.item-detail {
  margin-top: 2px;
  font-size: 0.72rem;
  line-height: 1.35;
  opacity: 0.5;
}

.item-progress-bar {
  height: 3px;
  background: rgba(26,140,85,0.15);
  border-radius: 2px;
  overflow: hidden;
}
.item-progress-fill {
  height: 100%;
  width: 60%;
  background: linear-gradient(90deg, #1A8C55, #2ECC71);
  border-radius: 2px;
  animation: shimmer 1.5s linear infinite;
  background-size: 200% 100%;
}

@keyframes breathe-green {
  0%, 100% { background: rgba(26,140,85,0.10); }
  50%       { background: rgba(26,140,85,0.22); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
</style>
