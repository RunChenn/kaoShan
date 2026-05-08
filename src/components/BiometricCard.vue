<template>
  <div class="biometric-outer" :class="{ 'alert-outer': alert }">
    <q-card class="biometric-card" :class="{ 'alert-card': alert }">
      <q-card-section class="q-pa-sm text-center">
        <div class="icon-ring" :class="alert ? 'ring-alert' : 'ring-normal'">
          <q-icon
            :name="icon"
            :color="alert ? 'negative' : 'primary'"
            size="19px"
          />
        </div>
        <div
          class="bio-value text-weight-bold q-mt-xs"
          :class="alert ? 'text-negative' : ''"
        >{{ value }}</div>
        <div class="bio-unit">{{ unit }}</div>
        <div class="bio-label">{{ label }}</div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string
  label: string
  value: string | number
  unit: string
  alert?: boolean
}>()
</script>

<style scoped>
.biometric-outer {
  flex: 1;
  min-width: 0;
}

.biometric-card {
  border-radius: 18px !important;
  background: rgba(255,255,255,0.97);
  overflow: hidden;
}

/* icon ring */
.icon-ring {
  width: 38px; height: 38px;
  border-radius: 13px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 2px;
  transition: background 0.3s ease;
}
.ring-normal { background: rgba(26,140,85,0.10); }
.ring-alert  {
  background: rgba(217,48,37,0.10);
  animation: ring-pulse-bg 2s ease-in-out infinite;
}

/* typography */
.bio-value {
  font-size: 1.18rem;
  letter-spacing: 0.06rem;
  line-height: 1.1;
}
.bio-unit  { font-size: 0.6rem; opacity: 0.45; margin-top: 1px; }
.bio-label { font-size: 0.62rem; opacity: 0.38; margin-top: 2px; }

/* alert card */
.alert-card {
  border: 1.5px solid rgba(217,48,37,0.45) !important;
  animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-border {
  0%, 100% { box-shadow: 0 0 0 0   rgba(217,48,37,0.3); }
  50%       { box-shadow: 0 0 0 5px rgba(217,48,37,0);   }
}

@keyframes ring-pulse-bg {
  0%, 100% { background: rgba(217,48,37,0.08); }
  50%       { background: rgba(217,48,37,0.20); }
}
</style>
