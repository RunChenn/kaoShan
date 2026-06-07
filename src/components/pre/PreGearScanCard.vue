<template>
  <!-- Lightbox -->
  <Teleport to="body">
    <div
      v-if="lightboxOpen && photoUrl"
      class="gear-photo-lightbox"
      @click="lightboxOpen = false"
    >
      <img
        :src="photoUrl"
        class="gear-photo-lightbox-img"
        alt="裝備照片"
        @click.stop
      />
      <button class="gear-photo-lightbox-close" @click="lightboxOpen = false">✕</button>
    </div>
  </Teleport>

  <div class="card anim-slide-up">
    <div class="vision-header-row">
      <div class="section-label section-label-compact">AI 裝備辨識</div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      hidden
      @change="$emit('select-file', $event)"
    />

    <div
      class="yolo-area"
      @click="triggerFileSelect"
      :class="{ 'yolo-area-scanned': scanned }"
    >
      <div v-if="!scanned && !scanning" class="yolo-empty-state">
        <div class="yolo-empty-icon">📷</div>
        <div class="yolo-empty-copy">點擊拍照或從相簿上傳裝備照片</div>
      </div>

      <template v-if="scanning">
        <div class="yolo-scanline" />
        <div class="yolo-scanning-text">裝備辨識中...</div>
      </template>

      <div v-if="scanned" class="yolo-scanned-wrap">
        <div class="yolo-scanned-title">辨識完成</div>
        <img
          v-if="photoUrl"
          :src="photoUrl"
          class="gear-photo-thumb"
          alt="裝備照片"
          @click.stop="lightboxOpen = true"
        />
        <div
          v-if="visionRawText"
          class="vision-raw-text"
          v-html="renderVisionRawText(visionRawText)"
        />

        <div class="section-label section-label-compact q-mt-md">評估清單</div>
        <div v-if="assessment" class="gear-assessment-card">
          <div
            class="gear-score-ring"
            :style="{ '--gear-score-color': gearScoreColor }"
          >
            <svg viewBox="0 0 96 96" aria-hidden="true">
              <circle class="gear-score-track" cx="48" cy="48" r="40" />
              <circle
                class="gear-score-bar"
                cx="48"
                cy="48"
                r="40"
                :stroke-dashoffset="gearScoreDashOffset"
                :stroke-dasharray="gearScoreCircumference"
              />
            </svg>
            <div class="gear-score-label">
              <strong>{{ assessment.score }}</strong>
              <span>分</span>
            </div>
          </div>
          <div class="gear-assessment-copy">
            <div class="gear-assessment-title-row">
              <div class="gear-assessment-title">{{ assessment.level }}</div>
            </div>
            <div class="gear-assessment-text">{{ assessment.summary }}</div>
            <ul class="gear-assessment-list">
              <li v-for="tip in assessment.tips" :key="tip">{{ tip }}</li>
            </ul>
            <div v-if="assessment.suggested_items.length" class="gear-suggested-box">
              <div class="gear-suggested-title">建議補充裝備</div>
              <div class="gear-suggested-list">
                <span
                  v-for="item in assessment.suggested_items"
                  :key="item"
                  class="gear-suggested-chip"
                >{{ item }}</span>
              </div>
            </div>
          </div>
        </div>

        <button class="yolo-rescan-btn" @click.stop="$emit('reset')">
          重新辨識清單
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { GearAssessment } from 'src/types/pre';

defineProps<{
  scanning: boolean;
  scanned: boolean;
  photoUrl?: string;
  assessment?: GearAssessment | null;
  visionRawText?: string;
  gearScoreCircumference: number;
  gearScoreDashOffset: number;
  gearScoreColor: string;
}>();

defineEmits<{
  'select-file': [event: Event];
  reset: [];
}>();

const fileInput = ref<HTMLInputElement>();
const lightboxOpen = ref(false);

function triggerFileSelect() {
  fileInput.value?.click();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function renderVisionRawText(value: string) {
  const text = value.trim();
  if (!text) return '';
  if (/^[{[]/.test(text)) return `<pre><code>${escapeHtml(text)}</code></pre>`;

  const lines = text.split(/\r?\n/);
  const html: string[] = [];
  let listOpen = false;
  let codeOpen = false;
  const paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${paragraph.map(renderInlineMarkdown).join('<br>')}</p>`);
    paragraph.length = 0;
  };
  const closeList = () => {
    if (!listOpen) return;
    html.push('</ul>');
    listOpen = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      flushParagraph(); closeList();
      html.push(codeOpen ? '</code></pre>' : '<pre><code>');
      codeOpen = !codeOpen;
      continue;
    }
    if (codeOpen) { html.push(`${escapeHtml(line)}\n`); continue; }
    if (!trimmed) { flushParagraph(); closeList(); continue; }
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph(); closeList();
      const level = heading[1]!.length + 2;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2]!)}</h${level}>`);
      continue;
    }
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      if (!listOpen) { html.push('<ul>'); listOpen = true; }
      html.push(`<li>${renderInlineMarkdown(bullet[1]!)}</li>`);
      continue;
    }
    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (!listOpen) { html.push('<ul>'); listOpen = true; }
      html.push(`<li>${renderInlineMarkdown(ordered[1]!)}</li>`);
      continue;
    }
    closeList();
    paragraph.push(line);
  }

  flushParagraph(); closeList();
  if (codeOpen) html.push('</code></pre>');
  return html.join('');
}
</script>
