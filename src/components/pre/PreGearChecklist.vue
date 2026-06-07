<template>
  <div class="card anim-slide-up">
    <div class="gear-header-row">
      <div class="section-label section-label-compact">裝備清單</div>
      <span
        class="gear-count"
        :class="{ 'gear-count-ok': items.length > 0 && checkedCount === items.length }"
      >{{ checkedCount }}/{{ items.length }}</span>
    </div>
    <div class="gear-add-row">
      <input
        v-model="newLabel"
        class="gear-add-input"
        placeholder="新增裝備，例如：手套"
        @keydown.enter="onAdd"
      />
      <button class="gear-add-btn" @click="onAdd">新增</button>
    </div>
    <div v-if="items.length === 0" class="gear-empty">
      尚未建立裝備清單。可自行新增，或使用 AI 裝備辨識自動加入。
    </div>
    <div v-else class="gear-grid">
      <div
        v-for="(item, i) in items"
        :key="item.id"
        :class="['gear-item', 'stagger-item', `stagger-${Math.min(i + 1, 12)}`, { checked: checked[item.id] }]"
        @click="$emit('toggle', item.id)"
      >
        <div class="gear-check">
          <svg v-if="checked[item.id]" width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2.5 2.5L8 3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </div>
        <span class="gear-label">{{ item.label }}</span>
        <button class="gear-remove-btn" title="刪除裝備" @click.stop="$emit('remove', item.id)">
          <span class="material-icons">delete</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { GearItem } from 'src/types/pre';

const props = defineProps<{
  items: GearItem[];
  checked: Record<string, boolean>;
}>();

const emit = defineEmits<{
  add: [label: string];
  remove: [id: string];
  toggle: [id: string];
}>();

const newLabel = ref('');

const checkedCount = computed(
  () => props.items.filter((item) => props.checked[item.id]).length,
);

function onAdd() {
  const label = newLabel.value.trim();
  if (!label) return;
  emit('add', label);
  newLabel.value = '';
}
</script>
