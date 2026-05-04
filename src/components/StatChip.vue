<template>
  <div class="stat-chip row items-center q-gutter-xs bg-grey-2 rounded-borders q-px-sm q-py-xs">
    <q-icon :name="icon" size="14px" color="primary" />
    <span class="text-caption text-weight-medium">{{ value }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ icon: string; value: string }>()
</script>
