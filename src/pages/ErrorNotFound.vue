<template>
  <q-page class="column flex-center">
    <q-icon name="sentiment_dissatisfied" size="6rem" color="grey-4" />
    <div class="text-h5 text-grey-6 q-mt-md">404 頁面不存在</div>
    <q-btn
      class="q-mt-lg"
      unelevated
      color="primary"
      label="回首頁"
      icon="home"
      @click="$router.push('/')"
    />
  </q-page>
</template>

<script setup lang="ts">
</script>
