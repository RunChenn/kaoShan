<template>
  <!-- Voice Overlay -->
  <Teleport to="body">
    <div
      v-if="voiceOverlay"
      class="voice-overlay"
      @click.self="closeVoiceOverlay"
    >
      <div class="voice-overlay-panel">
        <template v-if="overlayPhase === 'recording'">
          <div class="voice-overlay-title">語音輸入</div>
          <div class="voice-wave-lg">
            <div
              v-for="i in 5"
              :key="i"
              class="voice-bar-lg"
              :style="{ animationDelay: `${i * 0.12}s` }"
            />
          </div>
          <div class="voice-overlay-live">
            <span class="voice-final-text">{{ overlayFinal }}</span>
            <span class="voice-interim-text">{{ overlayLive }}</span>
            <span v-if="!overlayFinal && !overlayLive" class="voice-placeholder"
              >請說話...</span
            >
          </div>
          <button class="voice-stop-btn" @click="stopOverlayRecording">
            停止錄音
          </button>
          <button class="voice-cancel-link" @click="closeVoiceOverlay">
            取消
          </button>
        </template>

        <template v-else-if="overlayPhase === 'confirming'">
          <div class="voice-overlay-title">確認訊息內容</div>
          <div class="voice-confirm-label">我聽到的是：</div>
          <textarea
            class="voice-confirm-textarea"
            v-model="overlayFinal"
            rows="4"
            placeholder="（可直接編輯文字）"
          />
          <div class="voice-confirm-actions">
            <button class="voice-btn-secondary" @click="retryOverlayRecording">
              重錄
            </button>
            <button
              class="voice-btn-primary"
              :disabled="!overlayFinal.trim()"
              @click="confirmOverlaySend"
            >
              確認送出
            </button>
          </div>
        </template>

        <template v-else>
          <div class="voice-overlay-title">傳送中...</div>
          <div class="voice-wave-lg">
            <div
              v-for="i in 5"
              :key="i"
              class="voice-bar-lg"
              :style="{ animationDelay: `${i * 0.12}s`, opacity: 0.4 }"
            />
          </div>
        </template>
      </div>
    </div>
  </Teleport>

  <div class="line-page" :data-theme="appStore.config.theme">
    <!-- Header -->
    <div class="line-header">
      <div class="line-header-bot">
        <div class="line-bot-avatar">
          <img :src="logoUrl" alt="KaoShan logo" class="line-bot-avatar-image" />
        </div>
        <div>
          <div class="line-bot-name">KaoShan</div>
          <div class="line-bot-status"><span class="line-dot" />線上服務中</div>
        </div>
      </div>
      <div class="line-header-actions">
        <button class="line-icon-btn" title="撥打電話">📞</button>
        <button class="line-icon-btn" title="視訊">📹</button>
        <button
          class="line-icon-btn"
          @click="showContacts = !showContacts"
          :class="{ active: showContacts }"
          title="緊急聯絡人"
        >
          👥
        </button>
      </div>
    </div>

    <!-- Emergency Contacts Panel -->
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
              <button class="contact-btn" @click="notifyContact(c)">
                📢 通知
              </button>
              <button class="contact-btn contact-btn-call">📞</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Messages -->
    <div class="line-messages" ref="msgListEl">
      <div class="line-date-divider">今天</div>

      <template v-for="m in messages" :key="m.id">
        <!-- SOS Card -->
        <div v-if="m.type === 'sos'" class="msg-sos">
          <div class="msg-sos-icon">🆘</div>
          <div>
            <div class="msg-sos-title">SOS 緊急求救訊號已發送</div>
            <div class="msg-sos-sub">
              位置：玉山主峰 23.469°N 120.957°E｜{{ m.time }}
            </div>
          </div>
        </div>

        <!-- Route Card -->
        <div v-else-if="m.type === 'route-card'" class="msg-row bot">
          <div class="msg-bot-icon">
            <img :src="logoUrl" alt="KaoShan logo" class="msg-bot-icon-image" />
          </div>
          <div class="route-card">
            <div class="route-card-top">
              <span class="route-emoji">{{ cardOf(m).emoji }}</span>
              <div>
                <div class="route-card-name">{{ cardOf(m).name }}</div>
                <div class="route-card-region">{{ cardOf(m).region }}</div>
              </div>
              <span
                :class="['route-diff-badge', `diff-${cardOf(m).difficulty}`]"
              >
                {{
                  { easy: '入門', medium: '中級', hard: '進階' }[
                    cardOf(m).difficulty
                  ]
                }}
              </span>
            </div>
            <div class="route-card-meta">
              <span>📏 {{ cardOf(m).distance }}</span>
              <span>⬆ {{ cardOf(m).elevation }}</span>
              <span>⏱ {{ cardOf(m).days }}</span>
            </div>
            <div class="route-card-highlight">{{ cardOf(m).highlight }}</div>
            <div class="route-card-actions">
              <button
                class="custom-btn route-action-btn"
                @click="goToPlan(cardOf(m))"
              >
                出發前規劃
              </button>
              <button
                class="custom-btn route-action-ghost route-action-btn"
                @click="sendUserMsg('告訴我更多關於 ' + cardOf(m).name)"
              >
                了解更多
              </button>
            </div>
          </div>
        </div>

        <!-- Weather Card -->
        <div v-else-if="m.type === 'weather-card'" class="msg-row bot">
          <div class="msg-bot-icon">
            <img :src="logoUrl" alt="KaoShan logo" class="msg-bot-icon-image" />
          </div>
          <div class="weather-card">
            <div class="weather-card-title">明日山區天氣預報</div>
            <div class="weather-cols">
              <div v-for="w in weatherData" :key="w.label" class="weather-col">
                <div class="weather-icon-lg">{{ w.icon }}</div>
                <div class="weather-temp">{{ w.temp }}</div>
                <div class="weather-label">{{ w.label }}</div>
              </div>
            </div>
            <div class="weather-warning">
              ⚡ 午後雷陣雨機率 75%，建議 13:00 前下山
            </div>
          </div>
        </div>

        <!-- History Card -->
        <div v-else-if="m.type === 'history-card'" class="msg-row bot">
          <div class="msg-bot-icon">
            <img :src="logoUrl" alt="KaoShan logo" class="msg-bot-icon-image" />
          </div>
          <div class="chat-history-card">
            <div class="chat-history-card-title">
              {{ (m.cardData as ParsedHistory).name }}
            </div>
            <div class="chat-history-card-meta">
              <span>📏 {{ (m.cardData as ParsedHistory).distanceKm }}km</span>
              <span>⬆ {{ (m.cardData as ParsedHistory).elevationGain }}m</span>
              <span>
                ⏱
                {{
                  Math.floor((m.cardData as ParsedHistory).durationMin / 60)
                }}h{{ (m.cardData as ParsedHistory).durationMin % 60 }}m
              </span>
            </div>
            <div class="chat-history-card-date">
              {{ (m.cardData as ParsedHistory).date }}
            </div>
          </div>
        </div>

        <!-- Analysis Progress -->
        <div v-else-if="m.type === 'analysis-progress'" class="msg-row bot">
          <div class="msg-bot-icon">
            <img :src="logoUrl" alt="KaoShan logo" class="msg-bot-icon-image" />
          </div>
          <div class="chat-progress-card">
            <div class="chat-progress-label">
              AI 分析「{{ (m.cardData as ProgressData).name }}」中...
            </div>
            <div class="chat-progress-track">
              <div
                class="chat-progress-fill"
                :style="{ width: `${(m.cardData as ProgressData).progress}%` }"
              />
            </div>
            <div class="chat-progress-pct">
              {{ (m.cardData as ProgressData).progress }}%
            </div>
          </div>
        </div>

        <!-- Analysis Card -->
        <div v-else-if="m.type === 'analysis-card'" class="msg-row bot">
          <div class="msg-bot-icon">
            <img :src="logoUrl" alt="KaoShan logo" class="msg-bot-icon-image" />
          </div>
          <div class="chat-analysis-card">
            <div class="chat-analysis-title">AI 體能分析</div>
            <div class="chat-analysis-row">
              <span>估計體力：</span>
              <span class="chat-analysis-val">
                {{
                  FITNESS_LABELS[
                    (m.cardData as AnalysisResult).fitnessEstimate
                  ]
                }}（{{ (m.cardData as AnalysisResult).fitnessEstimate }}/5）
              </span>
            </div>
            <div class="chat-analysis-row">
              <span>表現：</span>
              <span class="chat-analysis-val">{{
                (m.cardData as AnalysisResult).insight
              }}</span>
            </div>
            <div class="chat-analysis-insight">
              {{ (m.cardData as AnalysisResult).recommendation }}
            </div>
          </div>
        </div>

        <!-- Normal Text Message -->
        <div v-else class="msg-row" :class="m.role">
          <div v-if="m.role === 'bot'" class="msg-bot-icon">
            <img :src="logoUrl" alt="KaoShan logo" class="msg-bot-icon-image" />
          </div>
          <div>
            <div :class="['msg-bubble', `msg-${m.role}`]">{{ m.text }}</div>
            <div
              class="msg-time"
              :style="{ textAlign: m.role === 'user' ? 'right' : 'left' }"
            >
              {{ m.time }}
            </div>
          </div>
        </div>
      </template>

      <!-- Typing Indicator -->
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

    <!-- Quick Replies -->
    <div v-if="quickReplies.length" class="quick-reply-bar">
      <div class="quick-reply-scroll">
        <button
          v-for="q in quickReplies"
          :key="q.label"
          class="quick-reply-btn"
          @click="handleQuickReply(q)"
        >
          {{ q.label }}
        </button>
      </div>
    </div>

    <!-- Input Bar -->
    <div class="line-input-bar">
      <label class="input-icon-btn" title="上傳 GPX / JSON 紀錄">
        📎
        <input
          type="file"
          accept=".gpx,.json"
          @change="onFileUpload"
          style="display: none"
        />
      </label>
      <button
        v-if="voiceSupported"
        class="input-icon-btn"
        title="語音輸入"
        @click="openVoiceOverlay"
      >
        🎙
      </button>
      <input
        class="line-input"
        placeholder="傳訊息給 KaoShan..."
        v-model="inputText"
        @keydown.enter="sendUserMsg(inputText)"
      />
      <button
        class="line-send-btn"
        :class="{ active: inputText.trim() }"
        @click="sendUserMsg(inputText)"
      >
        發送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import logoUrl from 'src/assets/img/logo.png';
import { api } from 'src/boot/axios';
import { getRecommendations, type UserProfile } from 'src/data/hikingRoutes';
import { useAppStore } from 'src/stores/app';
import { useAuthStore } from 'src/stores/auth';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const appStore = useAppStore();
const auth = useAuthStore();

// ── Types ──────────────────────────────────
interface RouteCard {
  emoji: string;
  name: string;
  region: string;
  difficulty: 'easy' | 'medium' | 'hard';
  distance: string;
  elevation: string;
  days: string;
  highlight: string;
}

interface ParsedHistory {
  name: string;
  distanceKm: number;
  elevationGain: number;
  durationMin: number;
  date: string;
}

interface AnalysisResult extends ParsedHistory {
  fitnessEstimate: number;
  insight: string;
  recommendation: string;
}

interface ProgressData {
  progress: number;
  name: string;
}

interface Message {
  id: number;
  role: 'bot' | 'user';
  type:
    | 'text'
    | 'sos'
    | 'route-card'
    | 'weather-card'
    | 'history-card'
    | 'analysis-progress'
    | 'analysis-card';
  text?: string;
  card?: RouteCard;
  cardData?: ParsedHistory | AnalysisResult | ProgressData;
  time: string;
}

interface ApiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface QuickReply {
  label: string;
  action: string;
  payload?: string;
}

// ── State ──────────────────────────────────
const msgListEl = ref<HTMLDivElement>();
const msgEndEl = ref<HTMLDivElement>();
const inputText = ref('');
const typing = ref(false);
const showContacts = ref(false);
const historyContext = ref('');

const FITNESS_LABELS: Record<number, string> = {
  1: '非常差',
  2: '較差',
  3: '普通',
  4: '良好',
  5: '非常好',
};

function nowTime() {
  return new Date().toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const messages = ref<Message[]>([
  {
    id: 1,
    role: 'bot',
    type: 'text',
    time: nowTime(),
    text: `您好${auth.profile?.displayName ? '，' + auth.profile.displayName : ''}！我是 KaoShan 登山\n\n您可以用三種方式開始規劃：\n1. 直接聊天：告訴我年齡、體力、登山經驗和想走幾天。\n2. 語音輸入：用說的描述這次想走的路線或體能狀況。\n3. 上傳紀錄：上傳 GPX / JSON 登山紀錄，我會分析距離、爬升與體能表現。\n\n我會依照這些資料幫您推薦適合的路線。`,
  },
]);

// ── Quick Replies ──────────────────────────
const QUICK_IDLE: QuickReply[] = [
  { label: '規劃登山路線', action: 'plan' },
  { label: '查詢明日天氣', action: 'weather' },
  { label: '裝備提醒', action: 'gear' },
  { label: '緊急求救', action: 'sos' },
];

const quickReplies = ref<QuickReply[]>(QUICK_IDLE);

function cardOf(m: Message): RouteCard {
  return m.card!;
}

function buildChatRequestMessages(extraUserContent?: string): ApiChatMessage[] {
  const apiMessages = messages.value
    .filter((m) => m.id !== 1 && m.type === 'text' && m.text?.trim())
    .map<ApiChatMessage>((m) => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.text!.trim(),
    }));

  const extra = extraUserContent?.trim();
  const lastMessage = apiMessages.at(-1);
  if (
    extra &&
    !(lastMessage?.role === 'user' && lastMessage.content === extra)
  ) {
    apiMessages.push({ role: 'user', content: extra });
  }

  return apiMessages.slice(-16);
}

// ── AI Chat ────────────────────────
async function sendUserMsg(text: string, clearInput = true) {
  const t = text.trim();
  if (!t) return;

  messages.value.push({
    id: Date.now(),
    role: 'user',
    type: 'text',
    text: t,
    time: nowTime(),
  });
  if (clearInput) inputText.value = '';
  quickReplies.value = [];
  typing.value = true;

  // Special local actions
  if (/sos|求救|緊急/.test(t)) {
    typing.value = false;
    messages.value.push({
      id: Date.now(),
      role: 'bot',
      type: 'sos',
      time: nowTime(),
    });
    setTimeout(() => {
      messages.value.push({
        id: Date.now() + 1,
        role: 'bot',
        type: 'text',
        time: nowTime(),
        text: '⚠ 已收到 SOS 訊號！您目前位置已通報救援單位。\n\n請保持冷靜、原地待援，並持續保持通訊。已同步通知您的緊急聯絡人。',
      });
      quickReplies.value = QUICK_IDLE;
    }, 500);
    return;
  }

  if (/天氣|氣象|下雨/.test(t)) {
    typing.value = false;
    messages.value.push({
      id: Date.now(),
      role: 'bot',
      type: 'weather-card',
      time: nowTime(),
    });
    setTimeout(() => {
      messages.value.push({
        id: Date.now() + 1,
        role: 'bot',
        type: 'text',
        time: nowTime(),
        text: '根據預報，明天適合早出發！記得穿著保暖層並攜帶雨具。需要我幫您規劃路線嗎？',
      });
      quickReplies.value = [
        { label: '規劃路線', action: 'plan' },
        { label: '裝備提醒', action: 'gear' },
      ];
    }, 300);
    return;
  }

  try {
    const res = await api.post('/chat', {
      messages: buildChatRequestMessages(),
      history_context: historyContext.value,
    });

    const { reply, ready, extracted_profile } = res.data as {
      reply: string;
      ready: boolean;
      extracted_profile: Record<string, unknown> | null;
    };

    messages.value.push({
      id: Date.now() + 1,
      role: 'bot',
      type: 'text',
      text: reply,
      time: nowTime(),
    });

    if (ready && extracted_profile) {
      // Show route recommendations
      const profile = extracted_profile as unknown as UserProfile;
      const routes = getRecommendations(profile);
      setTimeout(() => {
        messages.value.push({
          id: Date.now() + 2,
          role: 'bot',
          type: 'text',
          time: nowTime(),
          text: `根據您的資料，以下是我為您推薦的路線 👇`,
        });
        routes.slice(0, 3).forEach((r, i) => {
          setTimeout(() => {
            messages.value.push({
              id: Date.now() + 10 + i,
              role: 'bot',
              type: 'route-card',
              time: nowTime(),
              card: {
                emoji: r.emoji,
                name: r.name,
                region: r.region,
                difficulty:
                  r.risk === 'low'
                    ? 'easy'
                    : r.risk === 'mid'
                      ? 'medium'
                      : 'hard',
                distance: r.distance,
                elevation: r.elevation,
                days: `${r.minDays}天`,
                highlight: r.highlight,
              },
            });
          }, i * 400);
        });
        setTimeout(
          () => {
            quickReplies.value = [
              { label: '查詢天氣', action: 'weather' },
              { label: '重新規劃', action: 'plan' },
              { label: '裝備清單', action: 'gear' },
            ];
          },
          routes.length * 400 + 500,
        );
      }, 400);
    } else {
      quickReplies.value = QUICK_IDLE;
    }
  } catch (_err) {
    messages.value.push({
      id: Date.now() + 1,
      role: 'bot',
      type: 'text',
      time: nowTime(),
      text: 'AI 服務暫時無法回應，請稍後再試。',
    });
    quickReplies.value = QUICK_IDLE;
  } finally {
    typing.value = false;
  }
}

function handleQuickReply(q: QuickReply) {
  if (q.action === 'plan') {
    void sendUserMsg('幫我規劃登山路線');
  } else if (q.action === 'weather') {
    void sendUserMsg('查詢明日天氣');
  } else if (q.action === 'gear') {
    void sendUserMsg('裝備清單提醒');
  } else if (q.action === 'sos') {
    void sendUserMsg('SOS 緊急求救');
  } else if (q.action === 'go-plan') {
    router.push('/pre-departure');
  }
}

// ── GPX / JSON Upload ────────────────────────────
function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseGpx(text: string): ParsedHistory {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const trkpts = [...doc.querySelectorAll('trkpt')];
  const name = doc.querySelector('name')?.textContent ?? 'GPX 路線';

  let distanceKm = 0;
  let elevationGain = 0;

  for (let i = 1; i < trkpts.length; i++) {
    const prev = trkpts[i - 1]!;
    const curr = trkpts[i]!;
    const lat1 = parseFloat(prev.getAttribute('lat') ?? '0');
    const lon1 = parseFloat(prev.getAttribute('lon') ?? '0');
    const lat2 = parseFloat(curr.getAttribute('lat') ?? '0');
    const lon2 = parseFloat(curr.getAttribute('lon') ?? '0');
    distanceKm += haversine(lat1, lon1, lat2, lon2);

    const ele1 = parseFloat(prev.querySelector('ele')?.textContent ?? '0');
    const ele2 = parseFloat(curr.querySelector('ele')?.textContent ?? '0');
    if (ele2 > ele1) elevationGain += ele2 - ele1;
  }

  const times = [...doc.querySelectorAll('trkpt time')]
    .map((t) => new Date(t.textContent ?? '').getTime())
    .filter((t) => !isNaN(t));

  const durationMin =
    times.length >= 2
      ? Math.round((times[times.length - 1]! - times[0]!) / 60000)
      : Math.round(distanceKm * 30);

  const rawDate =
    doc.querySelector('metadata time')?.textContent?.split('T')[0] ??
    new Date().toISOString().split('T')[0]!;

  return {
    name,
    distanceKm: Math.round(distanceKm * 10) / 10,
    elevationGain: Math.round(elevationGain),
    durationMin,
    date: rawDate ?? '',
  };
}

function analyzeHistory(record: ParsedHistory): AnalysisResult {
  const speedKmh =
    record.durationMin > 0 ? record.distanceKm / (record.durationMin / 60) : 2;
  const elevPerKm =
    record.distanceKm > 0 ? record.elevationGain / record.distanceKm : 0;

  let fitnessEstimate = 3;
  if (speedKmh > 3 && elevPerKm > 200) fitnessEstimate = 5;
  else if (speedKmh > 2.5 || elevPerKm > 150) fitnessEstimate = 4;
  else if (speedKmh < 1.5) fitnessEstimate = 2;

  const insight = `平均速度 ${speedKmh.toFixed(1)} km/h，每公里爬升 ${Math.round(elevPerKm)}m`;
  const recommendation =
    fitnessEstimate >= 4
      ? '體能狀況良好，可嘗試進階路線'
      : fitnessEstimate >= 3
        ? '建議繼續維持現有訓練強度'
        : '建議從較輕鬆的路線開始訓練';

  return { ...record, fitnessEstimate, insight, recommendation };
}

async function onFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  (e.target as HTMLInputElement).value = '';

  messages.value.push({
    id: Date.now(),
    role: 'bot',
    type: 'text',
    text: `正在讀取「${file.name}」紀錄...`,
    time: nowTime(),
  });
  typing.value = true;

  let record: ParsedHistory | null = null;
  try {
    const text = await file.text();
    if (file.name.endsWith('.gpx')) {
      record = parseGpx(text);
    } else if (file.name.endsWith('.json')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = JSON.parse(text) as any;
      record = {
        name: (data.routeName ?? data.name ?? '歷史路線') as string,
        distanceKm: Number(data.distanceKm ?? 0),
        elevationGain: Number(data.elevationGain ?? 0),
        durationMin: Number(data.durationMin ?? 0),
        date: (data.date ?? new Date().toISOString().split('T')[0]!) as string,
      };
    }
  } catch (_) {
    typing.value = false;
    messages.value.push({
      id: Date.now() + 1,
      role: 'bot',
      type: 'text',
      text: '無法解析檔案，請確認格式正確（支援 .gpx 或 .json）',
      time: nowTime(),
    });
    return;
  }

  if (!record) {
    typing.value = false;
    return;
  }

  typing.value = false;

  // History card
  messages.value.push({
    id: Date.now() + 1,
    role: 'bot',
    type: 'history-card',
    time: nowTime(),
    cardData: { ...record },
  });

  await sleep(500);

  // Progress card
  const progressEntry: Message = {
    id: Date.now() + 2,
    role: 'bot',
    type: 'analysis-progress',
    time: nowTime(),
    cardData: { progress: 0, name: record.name } as ProgressData,
  };
  messages.value.push(progressEntry);

  for (let p = 10; p <= 100; p += 10) {
    await sleep(180);
    (progressEntry.cardData as ProgressData).progress = p;
  }

  await sleep(300);

  // Replace progress with analysis card
  const idx = messages.value.indexOf(progressEntry);
  if (idx !== -1) {
    messages.value.splice(idx, 1, {
      id: Date.now() + 3,
      role: 'bot',
      type: 'analysis-card',
      time: nowTime(),
      cardData: analyzeHistory(record),
    });
  }

  // Store history context for AI analysis
  historyContext.value = `使用者上傳了一筆登山紀錄：${record.name}，距離 ${record.distanceKm}km，爬升 ${record.elevationGain}m，時間 ${Math.floor(record.durationMin / 60)}小時${record.durationMin % 60}分。`;

  // Auto-trigger AI analysis
  await sleep(800);
  typing.value = true;
  const analysisPrompt = `我上傳了一筆登山紀錄：${record.name}，距離 ${record.distanceKm}km，爬升 ${record.elevationGain}m，花費 ${Math.floor(record.durationMin / 60)}小時${record.durationMin % 60}分鐘。請幫我分析體能表現並給建議。`;
  try {
    const res = await api.post('/chat', {
      messages: buildChatRequestMessages(analysisPrompt),
      history_context: historyContext.value,
    });
    messages.value.push({
      id: Date.now() + 4,
      role: 'bot',
      type: 'text',
      text: (res.data as { reply: string }).reply,
      time: nowTime(),
    });
  } catch (_) {
    messages.value.push({
      id: Date.now() + 4,
      role: 'bot',
      type: 'text',
      text: `根據您的紀錄，${record.name} 距離 ${record.distanceKm}km、爬升 ${record.elevationGain}m，體能表現${record.elevationGain > 500 ? '相當不錯' : '良好'}！請問接下來想規劃什麼樣的路線？`,
      time: nowTime(),
    });
  } finally {
    typing.value = false;
    quickReplies.value = [
      { label: '規劃路線', action: 'plan' },
      { label: '裝備清單', action: 'gear' },
    ];
  }
}

// ── Voice Overlay ────────────────────────────────
const voiceSupported = ref(false);
const voiceOverlay = ref(false);
const overlayPhase = ref<'recording' | 'confirming' | 'sending'>('recording');
const overlayLive = ref('');
const overlayFinal = ref('');
let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let speechSocket: WebSocket | null = null;

onMounted(() => {
  voiceSupported.value = isMediaRecorderSupported();
  scrollToBottom();
});

onBeforeUnmount(() => {
  stopVoiceCapture();
});

function isMediaRecorderSupported() {
  return Boolean(
    navigator.mediaDevices?.getUserMedia &&
    typeof window.MediaRecorder !== 'undefined',
  );
}

function getSupportedAudioMimeType() {
  const types = ['audio/webm;codecs=opus', 'audio/webm'];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
}

function getSpeechStreamUrl() {
  const baseUrl =
    api.defaults.baseURL ??
    `${window.location.protocol}//${window.location.host}/api/v1`;
  const url = new URL(baseUrl, window.location.href);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = `${url.pathname.replace(/\/$/, '')}/chat/speech/stream`;
  return url.toString();
}

function openVoiceOverlay() {
  if (!voiceSupported.value) return;
  overlayFinal.value = '';
  overlayLive.value = '';
  overlayPhase.value = 'recording';
  voiceOverlay.value = true;
  void startOverlayRecognition();
}

async function startOverlayRecognition() {
  stopVoiceCapture();

  const mimeType = getSupportedAudioMimeType();
  if (!mimeType) {
    overlayLive.value = '';
    overlayFinal.value = '目前瀏覽器不支援即時語音輸入，請改用文字輸入。';
    overlayPhase.value = 'confirming';
    return;
  }

  overlayLive.value = '正在連線 Google 語音辨識...';
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
    speechSocket = new WebSocket(getSpeechStreamUrl());
    speechSocket.binaryType = 'arraybuffer';

    speechSocket.onopen = () => {
      overlayLive.value = '語音辨識中，文字會即時填入輸入框。';
      mediaRecorder?.start(250);
    };

    speechSocket.onmessage = (event) => {
      const payload = JSON.parse(String(event.data)) as {
        type: 'transcript' | 'error' | 'done';
        text?: string;
        is_final?: boolean;
        message?: string;
      };
      if (payload.type === 'error') {
        overlayLive.value = '';
        overlayFinal.value = payload.message || 'Google 語音辨識暫時無法使用。';
        overlayPhase.value = 'confirming';
        return;
      }
      if (payload.type !== 'transcript' || !payload.text) return;

      if (payload.is_final) {
        overlayFinal.value = `${overlayFinal.value}${payload.text}`.trim();
        overlayLive.value = '';
      } else {
        overlayLive.value = payload.text;
      }
      inputText.value = `${overlayFinal.value}${overlayLive.value}`.trim();
    };

    speechSocket.onerror = () => {
      overlayLive.value = '';
      overlayFinal.value = 'Google 語音辨識連線失敗，請稍後再試。';
      overlayPhase.value = 'confirming';
    };

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size <= 0) return;
      if (speechSocket?.readyState !== WebSocket.OPEN) return;
      void event.data.arrayBuffer().then((buffer) => {
        if (speechSocket?.readyState === WebSocket.OPEN) {
          speechSocket.send(buffer);
        }
      });
    };

    mediaRecorder.onstop = () => {
      mediaStream?.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    };
  } catch (e) {
    console.warn('MediaRecorder error:', e);
    overlayLive.value = '';
    overlayFinal.value = '無法啟用麥克風，請確認瀏覽器權限。';
    overlayPhase.value = 'confirming';
  }
}

function stopVoiceCapture() {
  if (
    speechSocket &&
    [WebSocket.CONNECTING, WebSocket.OPEN].includes(speechSocket.readyState)
  ) {
    speechSocket.close();
  }
  speechSocket = null;
  if (mediaRecorder?.state === 'recording') {
    mediaRecorder.stop();
  }
  mediaRecorder = null;
  mediaStream?.getTracks().forEach((track) => track.stop());
  mediaStream = null;
}

function stopOverlayRecording() {
  if (mediaRecorder?.state === 'recording') {
    mediaRecorder.stop();
    if (speechSocket?.readyState === WebSocket.OPEN) {
      speechSocket.send(JSON.stringify({ type: 'stop' }));
    }
    inputText.value = `${overlayFinal.value}${overlayLive.value}`.trim();
    window.setTimeout(() => {
      overlayLive.value = '';
      overlayPhase.value = 'confirming';
    }, 500);
    return;
  }
  overlayPhase.value = 'confirming';
  overlayLive.value = '';
}

function retryOverlayRecording() {
  overlayFinal.value = '';
  overlayLive.value = '';
  inputText.value = '';
  overlayPhase.value = 'recording';
  void startOverlayRecognition();
}

function confirmOverlaySend() {
  const text = overlayFinal.value.trim();
  if (!text) return;
  overlayPhase.value = 'sending';
  voiceOverlay.value = false;
  void sendUserMsg(text, false);
}

function closeVoiceOverlay() {
  stopVoiceCapture();
  voiceOverlay.value = false;
}

// ── Helpers ─────────────────────────────────
function notifyContact(c: { name: string }) {
  messages.value.push({
    id: Date.now(),
    role: 'bot',
    type: 'text',
    time: nowTime(),
    text: `已通知 ${c.name}，對方會收到您的目前行程與位置資訊。`,
  });
  showContacts.value = false;
}

function goToPlan(card: RouteCard) {
  messages.value.push({
    id: Date.now(),
    role: 'bot',
    type: 'text',
    time: nowTime(),
    text: `好的！正在前往「${card.name}」的出發前規劃頁面...`,
  });
  setTimeout(() => router.push('/pre-departure'), 600);
}

// ── Static data ─────────────────────────────
const contacts = [
  { emoji: '👨', name: '王大明（父）', rel: '家人 · 追蹤中' },
  { emoji: '👩', name: '李小雯（友）', rel: '好友 · 已告知行程' },
];

const weatherData = [
  { icon: '⛅', temp: '12°C', label: '早晨' },
  { icon: '☀', temp: '18°C', label: '中午' },
  { icon: '🌧', temp: '9°C', label: '下午' },
];

// ── Scroll ─────────────────────────────────
function scrollToBottom() {
  nextTick(() => msgEndEl.value?.scrollIntoView({ behavior: 'smooth' }));
}
watch(messages, scrollToBottom, { deep: true });
watch(typing, scrollToBottom);
</script>

<style scoped>
/* ── Voice Overlay ── */
.voice-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.voice-overlay-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 40px 32px;
  width: min(400px, 90vw);
}

.voice-overlay-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.06rem;
}

.voice-wave-lg {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 60px;
}

.voice-bar-lg {
  width: 6px;
  border-radius: 3px;
  background: #06c755;
  animation: voice-bounce 0.8s ease-in-out infinite alternate;
  height: 20px;
}

.voice-bar-lg:nth-child(1) {
  animation-duration: 0.7s;
}
.voice-bar-lg:nth-child(2) {
  animation-duration: 0.9s;
}
.voice-bar-lg:nth-child(3) {
  animation-duration: 0.6s;
}
.voice-bar-lg:nth-child(4) {
  animation-duration: 1s;
}
.voice-bar-lg:nth-child(5) {
  animation-duration: 0.75s;
}

@keyframes voice-bounce {
  from {
    height: 8px;
  }
  to {
    height: 52px;
  }
}

.voice-overlay-live {
  width: 100%;
  min-height: 80px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  font-size: 0.95rem;
  line-height: 1.6;
  text-align: center;
}

.voice-final-text {
  color: #fff;
  font-weight: 500;
}
.voice-interim-text {
  color: rgba(255, 255, 255, 0.45);
}
.voice-placeholder {
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
}

.voice-stop-btn {
  padding: 12px 32px;
  border-radius: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}
.voice-stop-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.6);
}

.voice-cancel-link {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
  font-family: inherit;
  cursor: pointer;
  padding: 0;
}
.voice-cancel-link:hover {
  color: rgba(255, 255, 255, 0.7);
}

.voice-confirm-label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.55);
  align-self: flex-start;
}

.voice-confirm-textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 0.9rem;
  font-family: inherit;
  line-height: 1.6;
  resize: none;
  outline: none;
  box-sizing: border-box;
}
.voice-confirm-textarea:focus {
  border-color: #06c755;
}

.voice-confirm-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}

.voice-btn-secondary {
  flex: 1;
  padding: 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.voice-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
}

.voice-btn-primary {
  flex: 2;
  padding: 12px;
  border-radius: 20px;
  border: none;
  background: #06c755;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.15s;
}
.voice-btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.voice-btn-primary:not(:disabled):hover {
  opacity: 0.88;
}

/* ── Chat Card Bubbles ── */
.chat-history-card {
  max-width: 260px;
  padding: 10px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  border-bottom-left-radius: 4px;
}

.chat-history-card-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.chat-history-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.chat-history-card-date {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.chat-progress-card {
  max-width: 220px;
  padding: 10px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  border-bottom-left-radius: 4px;
}

.chat-progress-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.chat-progress-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.chat-progress-fill {
  height: 100%;
  background: #06c755;
  border-radius: 3px;
  transition: width 0.15s ease;
}

.chat-progress-pct {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-align: right;
}

.chat-analysis-card {
  max-width: 260px;
  padding: 10px 12px;
  background: rgba(6, 199, 85, 0.08);
  border: 1px solid rgba(6, 199, 85, 0.3);
  border-radius: 16px;
  border-bottom-left-radius: 4px;
}

.chat-analysis-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: #06c755;
  letter-spacing: 0.06rem;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.chat-analysis-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
  gap: 8px;
}

.chat-analysis-val {
  font-weight: 600;
  color: var(--text-primary);
  text-align: right;
}

.chat-analysis-insight {
  margin-top: 6px;
  font-size: 0.72rem;
  color: var(--text-muted);
  font-style: italic;
}

/* ── Page shell ── */
.line-page {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 60px);
  background: var(--bg-base);
}

/* ── Header ── */
.line-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-green);
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(6, 199, 85, 0.3);
}

.line-header-bot {
  display: flex;
  align-items: center;
  gap: 10px;
}

.line-bot-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.line-bot-avatar-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.line-bot-name {
  font-size: 1rem;
  font-weight: 800;
  color: #fff;
}

.line-bot-status {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.82);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 1px;
}

.line-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  display: inline-block;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.line-header-actions {
  display: flex;
  gap: 4px;
}

.line-icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  cursor: pointer;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.line-icon-btn:hover,
.line-icon-btn.active {
  background: rgba(255, 255, 255, 0.35);
}

/* ── Contacts Panel ── */
.contacts-panel {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  padding: 12px 16px;
  flex-shrink: 0;
}

.contacts-title {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.06rem;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.contacts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.contact-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.contact-info {
  flex: 1;
}
.contact-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}
.contact-rel {
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 1px;
}
.contact-actions {
  display: flex;
  gap: 6px;
}

.contact-btn {
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.contact-btn:hover {
  background: #06c755;
  color: #fff;
  border-color: #06c755;
}
.contact-btn-call {
  padding: 4px 8px;
}

/* ── Messages area ── */
.line-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.line-date-divider {
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.06rem;
  padding: 4px 0 8px;
}

/* ── Message rows ── */
.msg-row {
  display: flex;
  gap: 6px;
  align-items: flex-end;
}
.msg-row.user {
  flex-direction: row-reverse;
}
.msg-row.bot {
  flex-direction: row;
}

.msg-bot-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  align-self: flex-end;
}

.msg-bot-icon-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.msg-bubble {
  max-width: 260px;
  padding: 9px 12px;
  border-radius: 16px;
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-line;
}

.msg-bot {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
}

.msg-user {
  background: #06c755;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.msg-time {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 3px;
}

/* ── SOS card ── */
.msg-sos {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(220, 38, 38, 0.12);
  border: 1px solid rgba(220, 38, 38, 0.35);
  border-radius: 14px;
  animation: sos-pulse 1.5s ease-in-out 3;
}

@keyframes sos-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.3);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(220, 38, 38, 0);
  }
}

.msg-sos-icon {
  font-size: 24px;
}
.msg-sos-title {
  font-size: 0.82rem;
  font-weight: 800;
  color: #dc2626;
}
.msg-sos-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 2px;
}

/* ── Route Card ── */
.route-card {
  max-width: 260px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  overflow: hidden;
  padding: 12px;
}

.route-card-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.route-emoji {
  font-size: 22px;
  flex-shrink: 0;
}
.route-card-name {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 0.06rem;
}
.route-card-region {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 1px;
}

.route-diff-badge {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 700;
  flex-shrink: 0;
}

.diff-easy {
  background: rgba(26, 140, 85, 0.18);
  color: var(--risk-low);
  border: 1px solid rgba(26, 140, 85, 0.35);
}
.diff-medium {
  background: rgba(251, 146, 60, 0.18);
  color: var(--risk-mid);
  border: 1px solid rgba(251, 146, 60, 0.35);
}
.diff-hard {
  background: rgba(220, 38, 38, 0.12);
  color: var(--risk-high);
  border: 1px solid rgba(220, 38, 38, 0.3);
}

.route-card-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.route-card-highlight {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 10px;
}
.route-card-actions {
  display: flex;
  gap: 6px;
}

.route-action-btn {
  flex: 1;
  padding: 6px;
  border: none;
  border-radius: 8px;
  background: #06c755;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;
}
.route-action-btn:hover {
  opacity: 0.85;
}

.route-action-ghost {
  background: transparent !important;
  border: 1px solid var(--border) !important;
  color: var(--text-secondary) !important;
}

/* ── Weather Card ── */
.weather-card {
  max-width: 260px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  padding: 12px;
}

.weather-card-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.06rem;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.weather-cols {
  display: flex;
}

.weather-col {
  flex: 1;
  text-align: center;
  padding: 6px 4px;
  border-right: 1px solid var(--border);
}
.weather-col:last-child {
  border-right: none;
}

.weather-icon-lg {
  font-size: 22px;
  margin-bottom: 4px;
}
.weather-temp {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-primary);
}
.weather-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-top: 2px;
  letter-spacing: 0.06rem;
}

.weather-warning {
  margin-top: 8px;
  padding: 6px 8px;
  background: rgba(251, 146, 60, 0.12);
  border: 1px solid rgba(251, 146, 60, 0.3);
  border-radius: 8px;
  font-size: 0.7rem;
  color: #d97706;
  font-weight: 600;
}

/* ── Typing indicator ── */
.typing-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  border-bottom-left-radius: 4px;
}

.typing-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: typing-bounce 1.2s ease-in-out infinite;
}
.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

/* ── Quick replies ── */
.quick-reply-bar {
  flex-shrink: 0;
  padding: 6px 8px;
  border-top: 1px solid var(--border);
  background: var(--bg-surface);
}

.quick-reply-scroll {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}
.quick-reply-scroll::-webkit-scrollbar {
  display: none;
}

.quick-reply-btn {
  padding: 5px 12px;
  border: 1px solid #06c755;
  border-radius: 20px;
  background: transparent;
  color: #06c755;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: all 0.15s;
  flex-shrink: 0;
}
.quick-reply-btn:hover {
  background: #06c755;
  color: #fff;
}

/* ── Input bar ── */
.line-input-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  padding-bottom: max(10px, env(safe-area-inset-bottom, 0px));
  background: var(--bg-surface);
  border-top: 1px solid var(--border);
}

.input-icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: background 0.15s;
  flex-shrink: 0;
}
.input-icon-btn:hover {
  background: var(--bg-card);
}

.line-input {
  flex: 1;
  padding: 8px 14px;
  border-radius: 22px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.82rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}
.line-input:focus {
  border-color: #06c755;
}

.line-send-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 22px;
  background: var(--border);
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.line-send-btn.active {
  background: #06c755;
  color: #fff;
}

/* ── Transitions ── */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
