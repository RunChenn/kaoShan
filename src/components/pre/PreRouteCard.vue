<template>
  <div
    :class="['route-card', variant === 'full' && 'route-card-full', selected && 'route-card-selected']"
  >
    <div class="route-card-top">
      <div>
        <div class="route-card-name">{{ card.name }}</div>
        <div class="route-card-region">
          <template v-if="variant === 'full'">
            <span class="material-icons region-icon">location_on</span>
          </template>
          {{ card.region }}
        </div>
      </div>
      <span :class="['route-diff-badge', `diff-${card.difficulty}`]">
        {{ difficultyLabel }}
      </span>
    </div>

    <!-- Chat variant: flat meta -->
    <div v-if="variant === 'chat'" class="route-card-meta">
      <span>📏 {{ card.distance }}</span>
      <span>⬆ {{ card.elevation }}</span>
      <span>🏔 {{ card.maxElevation || '—' }}</span>
    </div>

    <!-- Full variant: grid meta -->
    <div v-else class="route-card-meta">
      <div class="route-card-meta-item">
        <div class="route-card-meta-title">距離</div>
        <div class="route-card-meta-data">{{ card.distance }}</div>
      </div>
      <div class="route-card-meta-item">
        <div class="route-card-meta-title">爬升</div>
        <div class="route-card-meta-data">{{ card.elevation }}</div>
      </div>
      <div class="route-card-meta-item">
        <div class="route-card-meta-title">預計時間</div>
        <div class="route-card-meta-data">{{ card.time }}</div>
      </div>
      <div class="route-card-meta-item">
        <div class="route-card-meta-title">海拔高度</div>
        <div class="route-card-meta-data">{{ card.maxElevation || '—' }}</div>
      </div>
    </div>

    <div class="route-card-highlight">{{ card.highlight }}</div>

    <div class="route-card-actions">
      <button class="custom-btn route-action-btn" @click="$emit('select', card)">
        {{ selected ? '已選擇' : selectLabel }}
      </button>
      <button
        class="custom-btn route-action-ghost route-action-btn"
        @click="$emit('more', card)"
      >
        了解更多
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RouteCard } from 'src/types/pre';

const props = withDefaults(
  defineProps<{
    card: RouteCard;
    selected: boolean;
    variant?: 'chat' | 'full';
  }>(),
  { variant: 'full' },
);

defineEmits<{
  select: [card: RouteCard];
  more: [card: RouteCard];
}>();

const selectLabel = props.variant === 'chat' ? '出發前規劃' : '選擇此路線';

const difficultyLabel = { easy: '入門', medium: '中級', hard: '進階' }[props.card.difficulty];
</script>
