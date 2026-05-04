<template>
  <q-card class="stat-card hiking-card text-center">
    <q-card-section class="q-pa-sm">
      <div class="stat-icon-ring" :class="`ring-${color}`">
        <q-icon :name="icon" :color="color" size="20px" />
      </div>
      <div class="stat-value text-weight-bold q-mt-xs">{{ value }}</div>
      <div class="stat-label">{{ label }}</div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{ icon: string; label: string; value: string; color: string }>()
</script>

<style scoped>
.stat-card { min-width: 0; border-radius: 18px !important; }

.stat-icon-ring {
  width: 40px; height: 40px;
  border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto;
}
.ring-primary   { background: rgba(26,140,85,0.12); }
.ring-secondary { background: rgba(200,144,42,0.12); }
.ring-warning   { background: rgba(230,126,34,0.12); }
.ring-negative  { background: rgba(217,48,37,0.12); }
.ring-positive  { background: rgba(46,204,113,0.12); }
.ring-info      { background: rgba(41,128,185,0.12); }

.stat-value {
  font-size: 0.95rem;
  letter-spacing: -0.025em;
  line-height: 1.2;
}
.stat-label {
  font-size: 0.65rem;
  opacity: 0.45;
  margin-top: 1px;
}
</style>
