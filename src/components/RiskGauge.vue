<template>
  <div class="risk-gauge column items-center">
    <div class="gauge-ring-wrap">
      <q-circular-progress
        :value="value"
        size="76px"
        :thickness="0.18"
        :color="color"
        track-color="grey-3"
        show-value
      >
        <div class="column items-center" style="gap:1px">
          <q-icon :name="icon" :color="color" size="16px" />
          <div class="gauge-val text-weight-bold" :class="`text-${color}`">{{ value }}%</div>
        </div>
      </q-circular-progress>
    </div>
    <div class="gauge-label text-center">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: number; color: string; icon: string }>()
</script>

<style scoped>
.risk-gauge { gap: 6px; }

.gauge-ring-wrap {
  padding: 4px;
  border-radius: 50%;
  background: rgba(0,0,0,0.03);
}

.gauge-val { font-size: 0.72rem; letter-spacing: 0.06rem; line-height: 1; }

.gauge-label {
  font-size: 0.65rem;
  opacity: 0.55;
  font-weight: 600;
  letter-spacing: 0.06rem;
  max-width: 64px;
  line-height: 1.3;
}
</style>
