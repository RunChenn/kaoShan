<template>
  <div
    class="pre-line-panel line-page"
    :class="{ 'line-panel-collapsed': collapsed }"
    :data-theme="theme"
  >
    <!-- Header -->
    <div class="line-header">
      <div class="line-header-bot">
        <div class="line-bot-avatar">
          <img :src="logoUrl" alt="KaoShan logo" class="line-bot-avatar-image" />
        </div>
        <div>
          <div class="line-bot-name">KaoShan</div>
          <div class="line-bot-status">
            <span class="line-dot" />線上服務中
          </div>
        </div>
      </div>
      <div class="line-header-actions">
        <button
          v-if="showAiModeToggle"
          class="chat-small-btn ai-mode-toggle"
          :class="{ 'ai-mode-gemini': aiChatMode === 'gemini' }"
          :title="aiChatMode === 'mock' ? '目前使用假資料' : '目前使用 Gemini'"
          @click="$emit('toggle-ai-mode')"
        >
          {{ aiChatMode === 'mock' ? '假資料' : 'Gemini' }}
        </button>
        <button
          v-if="recommendationsVisible && !collapsed"
          class="chat-small-btn chat-collapse-btn"
          title="收合"
          @click="$emit('collapse')"
        >
          <span class="material-icons">unfold_less</span>
          <span>收合</span>
        </button>
        <button
          v-if="recommendationsVisible"
          class="chat-small-btn chat-reset-chat-btn"
          title="重新聊天"
          @click="$emit('reset')"
        >
          <span class="material-icons">restart_alt</span>
          <span>重新聊天</span>
        </button>
      </div>
    </div>

    <!-- Collapsed strip -->
    <div v-if="collapsed" class="chat-collapsed-strip">
      <div>
        <div class="chat-collapsed-title">KaoShan 已完成需求統整</div>
      </div>
      <button class="chat-expand-btn" @click="$emit('collapse')">查看對話</button>
    </div>

    <!-- Contacts panel -->
    <transition name="slide-down">
      <div v-if="showContacts" class="contacts-panel">
        <div class="contacts-title">緊急聯絡人</div>
        <div class="contacts-list">
          <div v-for="c in contacts" :key="c.name" class="contact-item">
            <div class="contact-avatar">{{ c.emoji }}</div>
            <div class="contact-info">
              <div class="contact-name">{{ c.name }}</div>
              <div class="contact-rel">{{ c.rel }}</div>
            </div>
            <div class="contact-actions">
              <button class="contact-btn" @click="$emit('notify-contact', c)">📢 通知</button>
              <button class="contact-btn contact-btn-call">📞</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Messages -->
    <div v-if="!collapsed" class="line-messages" ref="msgListEl">
      <div class="line-date-divider">今天</div>

      <template v-for="m in messages" :key="m.id">
        <!-- SOS -->
        <div v-if="m.type === 'sos'" class="msg-sos">
          <div class="msg-sos-icon">🆘</div>
          <div>
            <div class="msg-sos-title">SOS 緊急求救訊號已發送</div>
            <div class="msg-sos-sub">位置：玉山主峰 23.469°N 120.957°E｜{{ m.time }}</div>
          </div>
        </div>

        <!-- Route card in chat -->
        <div v-else-if="m.type === 'route-card'" class="msg-row bot">
          <div class="msg-bot-icon">
            <img :src="logoUrl" alt="KaoShan logo" class="msg-bot-icon-image" />
          </div>
          <PreRouteCard
            :card="m.card!"
            :selected="selectedRouteId === m.card?.source?.id"
            variant="chat"
            @select="$emit('select-route', $event)"
            @more="$emit('more-route', $event)"
          />
        </div>

        <!-- Weather card in chat -->
        <div v-else-if="m.type === 'weather-card'" class="msg-row bot">
          <div class="msg-bot-icon">
            <img :src="logoUrl" alt="KaoShan logo" class="msg-bot-icon-image" />
          </div>
          <div class="weather-card">
            <div class="weather-card-title">明日山區天氣預報</div>
            <div class="weather-cols">
              <div v-for="w in mockWeatherData" :key="w.label" class="weather-col">
                <div class="weather-icon-lg">{{ w.icon }}</div>
                <div class="weather-temp">{{ w.temp }}</div>
                <div class="weather-label">{{ w.label }}</div>
              </div>
            </div>
            <div class="weather-warning">⚡ 午後雷陣雨機率 75%，建議 13:00 前下山</div>
          </div>
        </div>

        <!-- History card -->
        <div v-else-if="m.type === 'history-card'" class="msg-row bot">
          <div class="msg-bot-icon">
            <img :src="logoUrl" alt="KaoShan logo" class="msg-bot-icon-image" />
          </div>
          <div class="chat-history-card">
            <div class="chat-history-card-title">{{ (m.cardData as ParsedHistory).name }}</div>
            <div class="chat-history-card-meta">
              <span>📏 {{ (m.cardData as ParsedHistory).distanceKm }}km</span>
              <span>⬆ {{ (m.cardData as ParsedHistory).elevationGain }}m</span>
              <span>
                ⏱ {{ Math.floor((m.cardData as ParsedHistory).durationMin / 60) }}h{{ (m.cardData as ParsedHistory).durationMin % 60 }}m
              </span>
            </div>
            <div class="chat-history-card-date">{{ (m.cardData as ParsedHistory).date }}</div>
          </div>
        </div>

        <!-- Analysis progress -->
        <div v-else-if="m.type === 'analysis-progress'" class="msg-row bot">
          <div class="msg-bot-icon">
            <img :src="logoUrl" alt="KaoShan logo" class="msg-bot-icon-image" />
          </div>
          <div class="chat-progress-card">
            <div class="chat-progress-label">
              AI 分析「{{ (m.cardData as ProgressData).name }}」中...
            </div>
            <q-linear-progress
              :value="(m.cardData as ProgressData).progress / 100"
              color="primary"
              track-color="grey-4"
              size="6px"
              rounded
              class="chat-progress-track"
            />
            <div class="chat-progress-pct">{{ (m.cardData as ProgressData).progress }}%</div>
          </div>
        </div>

        <!-- Analysis card -->
        <div v-else-if="m.type === 'analysis-card'" class="msg-row bot">
          <div class="msg-bot-icon">
            <img :src="logoUrl" alt="KaoShan logo" class="msg-bot-icon-image" />
          </div>
          <div class="chat-analysis-card">
            <div class="chat-analysis-title">AI 體能分析</div>
            <div class="chat-analysis-row">
              <span>估計體力：</span>
              <span class="chat-analysis-val">
                {{ fitnessLabels[(m.cardData as AnalysisResult).fitnessEstimate] }}（{{ (m.cardData as AnalysisResult).fitnessEstimate }}/5）
              </span>
            </div>
            <div class="chat-analysis-row">
              <span>表現：</span>
              <span class="chat-analysis-val">{{ (m.cardData as AnalysisResult).insight }}</span>
            </div>
            <div class="chat-analysis-insight">{{ (m.cardData as AnalysisResult).recommendation }}</div>
          </div>
        </div>

        <!-- Text / default -->
        <div v-else class="msg-row" :class="m.role">
          <div v-if="m.role === 'bot'" class="msg-bot-icon">
            <img :src="logoUrl" alt="KaoShan logo" class="msg-bot-icon-image" />
          </div>
          <div>
            <div :class="['msg-bubble', `msg-${m.role}`]">{{ m.text }}</div>
            <div
              class="msg-time"
              :class="{ 'msg-time-user': m.role === 'user', 'msg-time-bot': m.role === 'bot' }"
            >{{ m.time }}</div>
          </div>
        </div>
      </template>

      <!-- Typing indicator -->
      <div v-if="typing" class="msg-row bot">
        <div class="msg-bot-icon">
          <img :src="logoUrl" alt="KaoShan logo" class="msg-bot-icon-image" />
        </div>
        <div class="typing-bubble">
          <div class="typing-dot" />
          <div class="typing-dot" />
          <div class="typing-dot" />
        </div>
      </div>

      <div ref="msgEndEl" />
    </div>

    <!-- Input area -->
    <div v-if="!collapsed" class="line-input-wrap">
      <div v-if="voiceRecording" class="voice-status-bar">
        <span class="voice-status-waves">
          <span v-for="i in 4" :key="i" class="voice-status-dot" />
        </span>
        <span class="voice-status-label">錄音中</span>
        <button class="voice-status-cancel" @click="$emit('cancel-voice')">取消</button>
      </div>

      <div class="line-input-bar">
        <label class="input-icon-btn" title="上傳 GPX / JSON 紀錄">
          📎
          <input type="file" accept=".gpx,.json" @change="$emit('file-upload', $event)" hidden />
        </label>
        <input
          class="line-input"
          :placeholder="voiceRecording ? '請說話...' : '傳訊息給 KaoShan...'"
          v-model="inputText"
          @compositionstart="isComposing = true"
          @compositionend="isComposing = false"
          @keydown.enter.exact.prevent="!isComposing && onSend()"
        />
        <button
          class="line-send-btn"
          :class="{ active: inputText.trim() }"
          @click.prevent="onSend()"
        >
          發送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import PreRouteCard from 'src/components/pre/PreRouteCard.vue';
import type { Message, RouteCard, ParsedHistory, AnalysisResult, ProgressData } from 'src/types/pre';

interface Contact {
  emoji: string;
  name: string;
  rel: string;
}

const props = defineProps<{
  messages: Message[];
  typing: boolean;
  collapsed: boolean;
  logoUrl: string;
  voiceRecording: boolean;
  showAiModeToggle: boolean;
  aiChatMode: 'mock' | 'gemini';
  recommendationsVisible: boolean;
  showContacts: boolean;
  contacts: Contact[];
  selectedRouteId?: string;
  theme?: string;
}>();

const emit = defineEmits<{
  send: [text: string];
  reset: [];
  collapse: [];
  'file-upload': [event: Event];
  'cancel-voice': [];
  'toggle-ai-mode': [];
  'notify-contact': [contact: Contact];
  'select-route': [card: RouteCard];
  'more-route': [card: RouteCard];
}>();

const inputText = ref('');
const isComposing = ref(false);
const msgListEl = ref<HTMLDivElement>();
const msgEndEl = ref<HTMLDivElement>();

const fitnessLabels = ['', '非常差', '差', '普通', '好', '非常好'];

const mockWeatherData = [
  { icon: '⛅', temp: '12°C', label: '早晨' },
  { icon: '☀', temp: '18°C', label: '中午' },
  { icon: '🌧', temp: '9°C', label: '下午' },
];

function onSend() {
  const text = inputText.value.trim();
  if (!text) return;
  emit('send', text);
  inputText.value = '';
}

function scrollToBottom() {
  msgEndEl.value?.scrollIntoView({ behavior: 'smooth' });
}

watch(
  () => props.messages.length,
  () => nextTick(scrollToBottom),
);

watch(
  () => props.typing,
  (val) => { if (val) nextTick(scrollToBottom); },
);
</script>
