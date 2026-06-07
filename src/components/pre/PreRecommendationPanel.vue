<template>
  <div class="card recommendation-panel anim-slide-up">
    <div class="section-label">需求統整</div>
    <div class="demand-grid">
      <div class="demand-item">
        <span>地區</span>
        <strong>{{ demandSummary.goal }}</strong>
      </div>
      <div class="demand-item">
        <span>行程天數</span>
        <strong>{{ demandSummary.days }}</strong>
      </div>
      <div class="demand-item">
        <span>體能</span>
        <strong>{{ demandSummary.fitness }}</strong>
      </div>
      <div class="demand-item">
        <span>風險偏好</span>
        <strong>{{ demandSummary.risk }}</strong>
      </div>
    </div>

    <div class="recommendation-header">
      <div class="section-label recommendation-label">推薦路線</div>
      <button
        class="custom-btn recommendation-reroll-btn"
        title="重新推薦"
        :disabled="rerolling"
        @click="$emit('reroll')"
      >
        <span class="material-icons">refresh</span>
        <span>換路線</span>
      </button>
    </div>

    <div v-if="cards.length > 0" class="recommendation-list">
      <PreRouteCard
        v-for="card in cards"
        :key="card.source?.id ?? card.name"
        :card="card"
        :selected="selectedRouteId === card.source?.id"
        variant="full"
        @select="$emit('select', $event)"
        @more="$emit('more', $event)"
      />
    </div>
    <div v-else class="recommendation-empty">
      沒有符合目前體能、難度和天數條件的推薦路線
    </div>
  </div>
</template>

<script setup lang="ts">
import PreRouteCard from 'src/components/pre/PreRouteCard.vue';
import type { RouteCard, DemandSummary } from 'src/types/pre';

defineProps<{
  demandSummary: DemandSummary;
  cards: RouteCard[];
  selectedRouteId?: string;
  rerolling: boolean;
}>();

defineEmits<{
  select: [card: RouteCard];
  more: [card: RouteCard];
  reroll: [];
}>();
</script>
