<template>
  <div class="line-page" :data-theme="appStore.config.theme">

    <!-- ── LINE Header ── -->
    <div class="line-header">
      <div class="line-header-bot">
        <div class="line-bot-avatar">⛰</div>
        <div>
          <div class="line-bot-name">Summit AI</div>
          <div class="line-bot-status"><span class="line-dot" />線上服務中</div>
        </div>
      </div>
      <div class="line-header-actions">
        <button class="line-icon-btn" title="撥打電話">📞</button>
        <button class="line-icon-btn" title="視訊">📹</button>
        <button class="line-icon-btn" @click="showContacts = !showContacts" :class="{ active: showContacts }" title="緊急聯絡人">👥</button>
      </div>
    </div>

    <!-- ── Emergency Contacts Panel ── -->
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
              <button class="contact-btn" @click="notifyContact(c)">📢 通知</button>
              <button class="contact-btn contact-btn-call">📞</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ── Messages ── -->
    <div class="line-messages" ref="msgListEl">
      <div class="line-date-divider">今天</div>

      <template v-for="m in messages" :key="m.id">

        <!-- SOS Card -->
        <div v-if="m.type === 'sos'" class="msg-sos">
          <div class="msg-sos-icon">🆘</div>
          <div>
            <div class="msg-sos-title">SOS 緊急求救訊號已發送</div>
            <div class="msg-sos-sub">位置：玉山主峰 23.469°N 120.957°E｜{{ m.time }}</div>
          </div>
        </div>

        <!-- Route Card -->
        <div v-else-if="m.type === 'route-card'" class="msg-row bot">
          <div class="msg-bot-icon">⛰</div>
          <div class="route-card">
            <div class="route-card-top">
              <span class="route-emoji">{{ cardOf(m).emoji }}</span>
              <div>
                <div class="route-card-name">{{ cardOf(m).name }}</div>
                <div class="route-card-region">{{ cardOf(m).region }}</div>
              </div>
              <span :class="['route-diff-badge', `diff-${cardOf(m).difficulty}`]">
                {{ { easy: '入門', medium: '中級', hard: '進階' }[cardOf(m).difficulty] }}
              </span>
            </div>
            <div class="route-card-meta">
              <span>📏 {{ cardOf(m).distance }}</span>
              <span>⬆ {{ cardOf(m).elevation }}</span>
              <span>⏱ {{ cardOf(m).days }}</span>
            </div>
            <div class="route-card-highlight">{{ cardOf(m).highlight }}</div>
            <div class="route-card-actions">
              <button class="route-action-btn" @click="goToPlan(cardOf(m))">出發前規劃</button>
              <button class="route-action-btn route-action-ghost" @click="sendUserMsg('告訴我更多關於 ' + cardOf(m).name)">了解更多</button>
            </div>
          </div>
        </div>

        <!-- Weather Card -->
        <div v-else-if="m.type === 'weather-card'" class="msg-row bot">
          <div class="msg-bot-icon">⛰</div>
          <div class="weather-card">
            <div class="weather-card-title">明日山區天氣預報</div>
            <div class="weather-cols">
              <div v-for="w in weatherData" :key="w.label" class="weather-col">
                <div class="weather-icon-lg">{{ w.icon }}</div>
                <div class="weather-temp">{{ w.temp }}</div>
                <div class="weather-label">{{ w.label }}</div>
              </div>
            </div>
            <div class="weather-warning">⚡ 午後雷陣雨機率 75%，建議 13:00 前下山</div>
          </div>
        </div>

        <!-- Normal Text Message -->
        <div v-else class="msg-row" :class="m.role">
          <div v-if="m.role === 'bot'" class="msg-bot-icon">⛰</div>
          <div>
            <div :class="['msg-bubble', `msg-${m.role}`]">{{ m.text }}</div>
            <div class="msg-time" :style="{ textAlign: m.role === 'user' ? 'right' : 'left' }">{{ m.time }}</div>
          </div>
        </div>

      </template>

      <!-- Typing Indicator -->
      <div v-if="typing" class="msg-row bot">
        <div class="msg-bot-icon">⛰</div>
        <div class="typing-bubble">
          <div class="typing-dot" /><div class="typing-dot" /><div class="typing-dot" />
        </div>
      </div>

      <div ref="msgEndEl" />
    </div>

    <!-- ── Quick Replies ── -->
    <div v-if="quickReplies.length" class="quick-reply-bar">
      <div class="quick-reply-scroll">
        <button
          v-for="q in quickReplies"
          :key="q.label"
          class="quick-reply-btn"
          @click="handleQuickReply(q)"
        >{{ q.label }}</button>
      </div>
    </div>

    <!-- ── Input Bar ── -->
    <div class="line-input-bar">
      <button class="input-icon-btn">🎙</button>
      <input
        class="line-input"
        placeholder="傳訊息給 Summit AI..."
        v-model="inputText"
        @keydown.enter="sendUserMsg(inputText)"
      />
      <button
        class="line-send-btn"
        :class="{ active: inputText.trim() }"
        @click="sendUserMsg(inputText)"
      >發送</button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from 'src/stores/app'
import { useAuthStore } from 'src/stores/auth'

const router   = useRouter()
const appStore = useAppStore()
const auth     = useAuthStore()

// ── Types ──────────────────────────────────
interface RouteCard {
  emoji: string; name: string; region: string
  difficulty: 'easy' | 'medium' | 'hard'
  distance: string; elevation: string; days: string; highlight: string
}

interface Message {
  id: number
  role: 'bot' | 'user'
  type: 'text' | 'sos' | 'route-card' | 'weather-card'
  text?: string
  card?: RouteCard
  time: string
}

interface QuickReply { label: string; action: string; payload?: string }

// ── State ──────────────────────────────────
const msgEndEl    = ref<HTMLDivElement>()
const inputText   = ref('')
const typing      = ref(false)
const showContacts = ref(false)
const conversationState = ref<'idle' | 'ask-days' | 'ask-difficulty' | 'done'>('idle')

function nowTime() {
  return new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}

const messages = ref<Message[]>([
  {
    id: 1, role: 'bot', type: 'text', time: nowTime(),
    text: `您好${auth.profile?.displayName ? '，' + auth.profile.displayName : ''}！我是 Summit AI 登山助理 🏔\n\n請問您這次想規劃什麼樣的登山行程？我可以依您的偏好推薦最適合的路線、查詢天氣，或協助緊急求救。`,
  },
])

// ── Quick Replies ──────────────────────────
const QUICK_IDLE: QuickReply[] = [
  { label: '規劃登山路線', action: 'plan' },
  { label: '查詢明日天氣', action: 'weather' },
  { label: '裝備提醒', action: 'gear' },
  { label: '緊急求救', action: 'sos' },
]

const QUICK_DAYS: QuickReply[] = [
  { label: '當日來回', action: 'select-days', payload: '1' },
  { label: '2天1夜', action: 'select-days', payload: '2' },
  { label: '3天以上', action: 'select-days', payload: '3+' },
]

const QUICK_DIFFICULTY: QuickReply[] = [
  { label: '新手入門', action: 'select-diff', payload: 'easy' },
  { label: '中級挑戰', action: 'select-diff', payload: 'medium' },
  { label: '進階技術', action: 'select-diff', payload: 'hard' },
]

const quickReplies = ref<QuickReply[]>(QUICK_IDLE)

// helper: assert m.card is defined (safe inside v-else-if="m.type === 'route-card'")
function cardOf(m: Message): RouteCard { return m.card! }

// ── Route Data ─────────────────────────────
const ROUTES: Record<string, RouteCard[]> = {
  '1-easy':  [
    { emoji: '🌿', name: '象山步道', region: '台北市信義區', difficulty: 'easy', distance: '2.2 km', elevation: '183 m', days: '2–3 小時', highlight: '俯瞰 101 夜景，台北市最親民的健行路線' },
    { emoji: '🏔', name: '合歡山主峰', region: '南投縣仁愛鄉', difficulty: 'easy', distance: '2.9 km', elevation: '峰頂 3,417m', days: '1–2 小時', highlight: '高山公路直通，最容易抵達的百岳之一' },
  ],
  '1-medium': [
    { emoji: '🌲', name: '阿里山眠月線', region: '嘉義縣阿里山鄉', difficulty: 'medium', distance: '15 km', elevation: '1,700 m', days: '全日', highlight: '百年鐵道廢線探秘，瀑布與神木交錯' },
    { emoji: '⛰', name: '桃山', region: '宜蘭縣大同鄉', difficulty: 'medium', distance: '9 km', elevation: '3,325 m', days: '6–8 小時', highlight: '百岳入門款，視野開闊俯瞰雪山群峰' },
  ],
  '1-hard': [
    { emoji: '🏔', name: '奇萊南峰', region: '花蓮縣秀林鄉', difficulty: 'hard', distance: '14 km', elevation: '3,358 m', days: '8–10 小時', highlight: '技術型百岳，高落差稜線挑戰' },
  ],
  '2-easy': [
    { emoji: '🌸', name: '武陵農場四秀', region: '台中市和平區', difficulty: 'easy', distance: '總計 16 km', elevation: '3,492 m', days: '2天1夜', highlight: '季節性高山花卉，賞景最佳路線' },
  ],
  '2-medium': [
    { emoji: '🦅', name: '雪山東峰→主峰', region: '苗栗縣泰安鄉', difficulty: 'medium', distance: '11 km', elevation: '3,886 m', days: '2天1夜', highlight: '台灣第二高峰，圈谷地形震撼人心' },
    { emoji: '🌺', name: '合歡群峰縱走', region: '南投縣仁愛鄉', difficulty: 'medium', distance: '13.5 km', elevation: '多峰連走', days: '2天1夜', highlight: '高原縱走，春賞杜鵑秋賞楓' },
  ],
  '2-hard': [
    { emoji: '🦁', name: '南湖大山', region: '宜蘭縣大同鄉', difficulty: 'hard', distance: '28 km', elevation: '3,742 m', days: '2天1夜', highlight: '帝王之山，百岳中最雄偉的高山群' },
  ],
  '3+-easy': [
    { emoji: '🌊', name: '能高越嶺道', region: '南投縣仁愛鄉', difficulty: 'easy', distance: '33 km', elevation: '歷史古道', days: '3天2夜', highlight: '橫貫中央山脈的百年越嶺道，古道秘境' },
  ],
  '3+-medium': [
    { emoji: '👑', name: '玉山主峰', region: '南投縣信義鄉', difficulty: 'medium', distance: '21 km', elevation: '3,952 m', days: '3天2夜', highlight: '台灣最高峰，東北亞最高點，一生必登' },
    { emoji: '🌙', name: '北一段縱走', region: '南投縣仁愛鄉', difficulty: 'medium', distance: '50 km', elevation: '多峰連走', days: '4–5天', highlight: '中央山脈北段精華，十三連峰壯觀縱走' },
  ],
  '3+-hard': [
    { emoji: '🔥', name: '秀馬奇萊O形', region: '花蓮縣秀林鄉', difficulty: 'hard', distance: '80 km', elevation: '三千公尺高稜', days: '5–7天', highlight: '台灣最具挑戰的O形縱走，極限考驗' },
  ],
}

function getRoutes(days: string, diff: string): RouteCard[] {
  return ROUTES[`${days}-${diff}`] ?? ROUTES['2-medium']!
}

// ── Bot Reply Logic ────────────────────────
let selectedDays = ''

function botReply(text?: string, type: Message['type'] = 'text', card?: RouteCard) {
  const msg: Message = { id: Date.now(), role: 'bot', type, time: nowTime() }
  if (text) msg.text = text
  if (card)  msg.card = card
  messages.value.push(msg)
}

function handleQuickReply(q: QuickReply) {
  sendUserMsg(q.label, false)
  processAction(q.action, q.payload)
}

function processAction(action: string, payload?: string) {
  typing.value = true
  setTimeout(() => {
    typing.value = false

    if (action === 'plan') {
      conversationState.value = 'ask-days'
      quickReplies.value = QUICK_DAYS
      botReply('好的！讓我幫您規劃行程 🗓\n\n請問您這次預計幾天的行程？')

    } else if (action === 'select-days') {
      selectedDays = payload ?? '2'
      conversationState.value = 'ask-difficulty'
      quickReplies.value = QUICK_DIFFICULTY
      const daysLabel: Record<string, string> = { '1': '當日來回', '2': '2天1夜', '3+': '3天以上' }
      botReply(`了解！${daysLabel[payload ?? '2']} 的行程 ✓\n\n請問您的登山經驗程度？這樣我可以推薦最適合的路線。`)

    } else if (action === 'select-diff') {
      conversationState.value = 'done'
      quickReplies.value = []
      const diffLabel: Record<string, string> = { easy: '新手入門', medium: '中級挑戰', hard: '進階技術' }
      botReply(`明白！以下是為您篩選的 ${diffLabel[payload ?? 'medium']} 路線 👇`)
      const routes = getRoutes(selectedDays, payload ?? 'medium')
      setTimeout(() => {
        routes.forEach((card, i) => {
          setTimeout(() => {
            messages.value.push({ id: Date.now() + i, role: 'bot', type: 'route-card', card, time: nowTime() })
          }, i * 400)
        })
        setTimeout(() => {
          botReply('以上是我的推薦！點選「出發前規劃」可進入完整的 AI 安全評估與裝備確認流程。需要查詢明日天氣嗎？')
          quickReplies.value = [
            { label: '查詢天氣', action: 'weather' },
            { label: '重新選擇', action: 'plan' },
            { label: '裝備清單', action: 'gear' },
          ]
        }, routes.length * 400 + 300)
      }, 200)

    } else if (action === 'weather') {
      messages.value.push({ id: Date.now(), role: 'bot', type: 'weather-card', time: nowTime() })
      setTimeout(() => {
        botReply('根據預報，明天適合早出發！記得穿著保暖層並攜帶雨具。需要我幫您規劃路線嗎？')
        quickReplies.value = [{ label: '規劃路線', action: 'plan' }, { label: '裝備提醒', action: 'gear' }]
      }, 300)

    } else if (action === 'gear') {
      botReply('以下是出發前必備裝備清單 🎒\n\n✅ 登山鞋（防水）\n✅ 登山杖\n✅ 頭燈 + 備用電池\n✅ 急救包\n✅ 保暖層（羽絨/抓絨）\n✅ 雨衣（非傘）\n✅ 行動糧食 1.5 倍份量\n✅ 飲水至少 2L\n✅ 無線電 / 衛星求救器\n\n完整裝備可在「出發前」頁面用 AI 辨識確認！')
      quickReplies.value = [{ label: '前往出發前規劃', action: 'go-plan' }, { label: '規劃路線', action: 'plan' }]

    } else if (action === 'sos') {
      messages.value.push({ id: Date.now(), role: 'bot', type: 'sos', time: nowTime() })
      setTimeout(() => {
        botReply('⚠ 已收到 SOS 訊號！您目前位置已通報救援單位。\n\n請保持冷靜、原地待援，並持續保持通訊。已同步通知您的緊急聯絡人。')
        quickReplies.value = QUICK_IDLE
      }, 500)

    } else if (action === 'go-plan') {
      router.push('/pre-departure')
    }
  }, 1100)
}

function sendUserMsg(text: string, clearInput = true) {
  const t = text.trim()
  if (!t) return
  messages.value.push({ id: Date.now(), role: 'user', type: 'text', text: t, time: nowTime() })
  if (clearInput) inputText.value = ''

  // Keyword matching for free-form input
  if (conversationState.value === 'idle' || conversationState.value === 'done') {
    if (/天氣|氣象|下雨|雨/.test(t))       processAction('weather')
    else if (/裝備|背包|清單/.test(t))     processAction('gear')
    else if (/路線|推薦|規劃|登山/.test(t)) processAction('plan')
    else if (/sos|求救|緊急/.test(t))      processAction('sos')
    else {
      typing.value = true
      setTimeout(() => {
        typing.value = false
        botReply('收到！我可以幫您規劃路線、查詢天氣，或裝備提醒。請問您需要哪種服務？')
        quickReplies.value = QUICK_IDLE
        conversationState.value = 'idle'
      }, 1000)
    }
  }
}

function notifyContact(c: { name: string }) {
  messages.value.push({
    id: Date.now(), role: 'bot', type: 'text', time: nowTime(),
    text: `已通知 ${c.name}，對方會收到您的目前行程與位置資訊。`,
  })
  showContacts.value = false
}

function goToPlan(card: RouteCard) {
  messages.value.push({
    id: Date.now(), role: 'bot', type: 'text', time: nowTime(),
    text: `好的！正在前往「${card.name}」的出發前規劃頁面...`,
  })
  setTimeout(() => router.push('/pre-departure'), 600)
}

// ── Data ───────────────────────────────────
const contacts = [
  { emoji: '👨', name: '王大明（父）', rel: '家人 · 追蹤中' },
  { emoji: '👩', name: '李小雯（友）', rel: '好友 · 已告知行程' },
]

const weatherData = [
  { icon: '⛅', temp: '12°C', label: '早晨' },
  { icon: '☀', temp: '18°C', label: '中午' },
  { icon: '🌧', temp: '9°C',  label: '下午' },
]

// ── Scroll ─────────────────────────────────
function scrollToBottom() {
  nextTick(() => msgEndEl.value?.scrollIntoView({ behavior: 'smooth' }))
}
watch(messages, scrollToBottom, { deep: true })
watch(typing, scrollToBottom)

onMounted(scrollToBottom)
</script>

<style scoped>
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
  background: #06c755;
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(6, 199, 85, 0.3);
}

.line-header-bot { display: flex; align-items: center; gap: 10px; }

.line-bot-avatar {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}

.line-bot-name {
  font-size: 1rem; font-weight: 800; color: #fff;
  letter-spacing: -0.015em;
}

.line-bot-status {
  font-size: 0.65rem; color: rgba(255,255,255,0.82);
  display: flex; align-items: center; gap: 4px; margin-top: 1px;
}

.line-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #fff; display: inline-block;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

.line-header-actions { display: flex; gap: 4px; }

.line-icon-btn {
  width: 36px; height: 36px;
  border: none; background: rgba(255,255,255,0.18);
  border-radius: 50%; cursor: pointer; font-size: 15px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}

.line-icon-btn:hover,
.line-icon-btn.active {
  background: rgba(255,255,255,0.35);
}

/* ── Contacts Panel ── */
.contacts-panel {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  padding: 12px 16px;
  flex-shrink: 0;
}

.contacts-title {
  font-size: 0.7rem; font-weight: 700; color: var(--text-muted);
  letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 8px;
}

.contacts-list { display: flex; flex-direction: column; gap: 8px; }

.contact-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.contact-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
}

.contact-info { flex: 1; }
.contact-name { font-size: 0.82rem; font-weight: 700; color: var(--text-primary); }
.contact-rel  { font-size: 0.68rem; color: var(--text-muted); margin-top: 1px; }

.contact-actions { display: flex; gap: 6px; }

.contact-btn {
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.7rem; font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: all 0.15s;
}

.contact-btn:hover { background: #06c755; color: #fff; border-color: #06c755; }
.contact-btn-call  { padding: 4px 8px; }

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
  font-size: 0.65rem;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 4px 0 8px;
}

/* ── Message rows ── */
.msg-row {
  display: flex;
  gap: 6px;
  align-items: flex-end;
}

.msg-row.user  { flex-direction: row-reverse; }
.msg-row.bot   { flex-direction: row; }

.msg-bot-icon {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: #06c755;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0;
  align-self: flex-end;
}

.msg-bubble {
  max-width: 260px;
  padding: 9px 12px;
  border-radius: 16px;
  font-size: 0.82rem;
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
  font-size: 0.6rem;
  color: var(--text-muted);
  margin-top: 3px;
}

/* ── SOS card ── */
.msg-sos {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  background: rgba(220, 38, 38, 0.12);
  border: 1px solid rgba(220, 38, 38, 0.35);
  border-radius: 14px;
  animation: sos-pulse 1.5s ease-in-out 3;
}

@keyframes sos-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.3); }
  50%       { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
}

.msg-sos-icon { font-size: 24px; }
.msg-sos-title { font-size: 0.82rem; font-weight: 800; color: #dc2626; }
.msg-sos-sub   { font-size: 0.68rem; color: var(--text-muted); margin-top: 2px; }

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
  display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
}

.route-emoji { font-size: 22px; flex-shrink: 0; }
.route-card-name   { font-size: 0.88rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.015em; }
.route-card-region { font-size: 0.65rem; color: var(--text-muted); margin-top: 1px; }

.route-diff-badge {
  margin-left: auto; padding: 2px 8px;
  border-radius: 20px; font-size: 0.65rem; font-weight: 700;
  flex-shrink: 0;
}

.diff-easy   { background: rgba(26,140,85,0.18);  color: #16a34a; border: 1px solid rgba(26,140,85,0.35); }
.diff-medium { background: rgba(251,146,60,0.18); color: #d97706; border: 1px solid rgba(251,146,60,0.35); }
.diff-hard   { background: rgba(220,38,38,0.12);  color: #dc2626; border: 1px solid rgba(220,38,38,0.3); }

.route-card-meta {
  display: flex; gap: 8px; flex-wrap: wrap;
  font-size: 0.68rem; color: var(--text-muted);
  margin-bottom: 6px;
}

.route-card-highlight {
  font-size: 0.72rem; color: var(--text-secondary);
  line-height: 1.5; margin-bottom: 10px;
}

.route-card-actions { display: flex; gap: 6px; }

.route-action-btn {
  flex: 1; padding: 6px;
  border: none; border-radius: 8px;
  background: #06c755; color: #fff;
  font-size: 0.72rem; font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: opacity 0.15s;
}

.route-action-btn:hover { opacity: 0.85; }

.route-action-ghost {
  background: transparent;
  border: 1px solid var(--border) !important;
  color: var(--text-secondary) !important;
}

/* ── Weather Card ── */
.weather-card {
  max-width: 260px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px; border-bottom-left-radius: 4px;
  padding: 12px;
}

.weather-card-title {
  font-size: 0.72rem; font-weight: 700; color: var(--text-muted);
  letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 10px;
}

.weather-cols { display: flex; gap: 0; }

.weather-col {
  flex: 1; text-align: center;
  padding: 6px 4px;
  border-right: 1px solid var(--border);
}

.weather-col:last-child { border-right: none; }

.weather-icon-lg { font-size: 22px; margin-bottom: 4px; }
.weather-temp    { font-size: 0.9rem; font-weight: 800; color: var(--text-primary); }
.weather-label   { font-size: 0.62rem; color: var(--text-muted); margin-top: 2px; }

.weather-warning {
  margin-top: 8px; padding: 6px 8px;
  background: rgba(251,146,60,0.12);
  border: 1px solid rgba(251,146,60,0.3);
  border-radius: 8px;
  font-size: 0.7rem; color: #d97706; font-weight: 600;
}

/* ── Typing indicator ── */
.typing-bubble {
  display: flex; align-items: center; gap: 4px;
  padding: 10px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px; border-bottom-left-radius: 4px;
}

.typing-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--text-muted);
  animation: typing-bounce 1.2s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30%            { transform: translateY(-6px); }
}

/* ── Quick replies ── */
.quick-reply-bar {
  flex-shrink: 0;
  padding: 6px 8px;
  border-top: 1px solid var(--border);
  background: var(--bg-surface);
}

.quick-reply-scroll {
  display: flex; gap: 6px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}
.quick-reply-scroll::-webkit-scrollbar { display: none; }

.quick-reply-btn {
  padding: 5px 12px;
  border: 1px solid #06c755;
  border-radius: 20px;
  background: transparent;
  color: #06c755;
  font-size: 0.75rem; font-weight: 700;
  cursor: pointer; white-space: nowrap;
  font-family: inherit;
  transition: all 0.15s;
  flex-shrink: 0;
}

.quick-reply-btn:hover { background: #06c755; color: #fff; }

/* ── Input bar ── */
.line-input-bar {
  flex-shrink: 0;
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px;
  padding-bottom: max(10px, env(safe-area-inset-bottom, 0px));
  background: var(--bg-surface);
  border-top: 1px solid var(--border);
}

.input-icon-btn {
  width: 36px; height: 36px;
  border: none; background: transparent;
  font-size: 18px; cursor: pointer; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-muted);
  transition: background 0.15s;
}
.input-icon-btn:hover { background: var(--bg-card); }

.line-input {
  flex: 1;
  padding: 8px 14px;
  border-radius: 22px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.82rem; font-family: inherit;
  outline: none; transition: border-color 0.15s;
}
.line-input:focus { border-color: #06c755; }

.line-send-btn {
  padding: 8px 16px;
  border: none; border-radius: 22px;
  background: var(--border);
  color: var(--text-muted);
  font-size: 0.78rem; font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: all 0.15s;
}
.line-send-btn.active { background: #06c755; color: #fff; }

/* ── Transitions ── */
.slide-down-enter-active,
.slide-down-leave-active { transition: all 0.25s ease; }
.slide-down-enter-from,
.slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
