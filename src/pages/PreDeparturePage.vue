<template>
  <div class="p1-grid">
    <!-- ── Sidebar ── -->
    <aside class="p1-sidebar">

      <!-- ① LINE AI 路線諮詢 -->
      <div class="card line-chat-card">
        <div class="line-chat-header">
          <div class="line-chat-avatar">⛰</div>
          <div>
            <div class="line-chat-name">Summit AI</div>
            <div class="line-chat-status"><span class="line-online-dot" />線上服務中</div>
          </div>
          <div style="margin-left:auto;font-size:0.65rem;color:rgba(255,255,255,0.75);font-weight:600;letter-spacing:0.04em;text-transform:uppercase">LINE AI 路線諮詢</div>
        </div>

        <div class="line-chat-messages" ref="chatMsgEndRef">
          <div v-for="m in chatMessages" :key="m.id" :class="['line-msg-row', m.role]">
            <div v-if="m.role === 'bot'" class="line-msg-icon">⛰</div>
            <div>
              <div :class="['line-msg-bubble', `line-msg-${m.role}`]">{{ m.text }}</div>
              <div class="line-msg-time" :style="{ textAlign: m.role === 'user' ? 'right' : 'left' }">{{ m.time }}</div>
            </div>
          </div>
          <div v-if="chatTyping" class="line-msg-row bot">
            <div class="line-msg-icon">⛰</div>
            <div class="line-typing-bubble">
              <div class="line-typing-dot" /><div class="line-typing-dot" /><div class="line-typing-dot" />
            </div>
          </div>
          <div ref="chatBottomRef" />
        </div>

        <!-- Quick replies -->
        <div class="line-quick-replies">
          <button
            v-for="q in quickReplies"
            :key="q.text"
            class="line-quick-btn"
            @click="sendQuickReply(q)"
          >{{ q.text }}</button>
        </div>

        <!-- Input bar -->
        <div class="line-input-bar">
          <input
            class="line-chat-input"
            placeholder="傳訊息給 Summit AI..."
            v-model="chatInput"
            @keydown.enter="sendChatMessage"
          />
          <button class="line-send-btn" @click="sendChatMessage">發送</button>
        </div>
      </div>

      <!-- ③ 個人資料與體能評估 -->
      <div class="card">
        <div class="section-label" style="margin-bottom: 12px">個人資料與體能評估</div>

        <!-- 語音快速填表 -->
        <div v-if="voiceSupported" :class="['voice-input-card', { listening: voiceActive, 'has-result': voiceParsed }]">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px 0">
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-size:13px">🎤</span>
              <span style="font-size:11px;font-weight:700;color:var(--text-secondary);letter-spacing:0.04em;text-transform:uppercase">語音快速填表</span>
            </div>
            <button
              v-if="voiceTranscript || voiceParsed"
              @click="resetVoice"
              style="background:none;border:none;cursor:pointer;font-size:11px;color:var(--text-muted);padding:2px 4px"
            >✕ 清除</button>
          </div>

          <div style="display:flex;align-items:center;gap:12px;padding:10px 12px 0">
            <div style="position:relative;flex-shrink:0">
              <div v-if="voiceActive" class="voice-ring" />
              <button
                :class="['voice-mic-btn', voiceActive ? 'active' : voiceParsed ? 'done' : 'idle']"
                @click="toggleVoice"
                :title="voiceActive ? '停止錄音' : '開始語音輸入'"
              >
                {{ voiceActive ? '⏹' : '🎙' }}
              </button>
            </div>

            <div v-if="voiceActive">
              <div class="voice-wave">
                <div v-for="i in 5" :key="i" class="voice-bar" :style="{ animationDelay: `${i * 0.12}s` }" />
              </div>
              <div style="font-size:10px;color:var(--text-muted);margin-top:4px">正在聆聽…請說出您的資料</div>
            </div>
            <div v-else-if="!voiceTranscript" style="font-size:11px;color:var(--text-muted);line-height:1.5">
              例：「我今年三十五歲，體重七十公斤，身高一百七十五，有登山經驗，體力不錯，可以走兩天」
            </div>
          </div>

          <!-- 辨識中文字 -->
          <div v-if="voiceTranscript" style="margin:8px 12px;background:rgba(255,255,255,0.05);border-radius:10px;padding:8px 10px;font-size:12px;color:var(--text-secondary);line-height:1.6;border:1px solid rgba(255,255,255,0.08)">
            <span style="color:var(--text-muted);font-size:10px;margin-right:4px">辨識：</span>{{ voiceTranscript }}
          </div>

          <!-- 解析結果 chips -->
          <div v-if="voiceParsed && voiceParsed.fields" style="padding:0 12px 8px">
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:5px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase">已解析欄位</div>
            <div style="display:flex;flex-wrap:wrap;gap:5px">
              <span v-if="voiceParsed.fields.age        != null" class="voice-chip">年齡 {{ voiceParsed.fields.age }}歲</span>
              <span v-if="voiceParsed.fields.weight     != null" class="voice-chip">體重 {{ voiceParsed.fields.weight }}kg</span>
              <span v-if="voiceParsed.fields.height     != null" class="voice-chip">身高 {{ voiceParsed.fields.height }}cm</span>
              <span v-if="voiceParsed.fields.experience != null" class="voice-chip">{{ { beginner: '🌱 新手', experienced: '🧗 有經驗', advanced: '🏆 進階' }[voiceParsed.fields.experience] }}</span>
              <span v-if="voiceParsed.fields.fitness    != null" class="voice-chip">體力 {{ FITNESS_LABELS[voiceParsed.fields.fitness] }}</span>
              <span v-if="voiceParsed.fields.slopeCoeff != null" class="voice-chip">坡度 {{ SLOPE_LABELS[voiceParsed.fields.slopeCoeff] }}</span>
              <span v-if="voiceParsed.fields.targetDays != null" class="voice-chip">天數 {{ voiceParsed.fields.targetDays }}天</span>
            </div>
          </div>

          <!-- 套用按鈕 -->
          <div v-if="voiceParsed" style="padding:0 12px 12px">
            <button class="btn btn-primary" style="width:100%;border-radius:12px;font-weight:700;font-size:13px" @click="applyVoiceAndAnalyze">
              ✨ 套用並分析推薦路線
            </button>
          </div>
          <div v-if="voiceFinal && !voiceParsed" style="font-size:11px;color:var(--risk-mid);text-align:center;padding:6px 12px 12px">
            ⚠️ 未能解析資料，請再說清楚一點
          </div>
        </div>

        <!-- OR 分隔 -->
        <div v-if="voiceSupported" style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <div style="flex:1;height:1px;background:var(--border)" />
          <span style="font-size:10px;color:var(--text-muted);font-weight:700;letter-spacing:0.06em">或手動填寫</span>
          <div style="flex:1;height:1px;background:var(--border)" />
        </div>

        <!-- 基本資料 -->
        <div style="margin-bottom:12px">
          <div class="form-label" style="margin-bottom:6px">基本資料</div>
          <div class="form-row">
            <div class="form-field">
              <label class="form-label">年齡</label>
              <input class="form-input" type="number" min="10" max="90" placeholder="歲" v-model="profile.age" />
            </div>
            <div class="form-field">
              <label class="form-label">體重</label>
              <input class="form-input" type="number" min="30" max="150" placeholder="kg" v-model="profile.weight" />
            </div>
            <div class="form-field">
              <label class="form-label">身高</label>
              <input class="form-input" type="number" min="100" max="220" placeholder="cm" v-model="profile.height" />
            </div>
          </div>
        </div>

        <!-- 登山經驗 -->
        <div style="margin-bottom:12px">
          <div class="form-label" style="margin-bottom:6px">登山經驗</div>
          <div class="toggle-group">
            <button
              v-for="opt in expOptions"
              :key="opt.val"
              :class="['toggle-btn', { active: profile.experience === opt.val }]"
              @click="profile.experience = opt.val"
            >
              <div>{{ opt.label }}</div>
              <div style="font-size:0.6rem;opacity:0.65;margin-top:1px">{{ opt.desc }}</div>
            </button>
          </div>
        </div>

        <!-- 體力評估 -->
        <div style="margin-bottom:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
            <div class="form-label">體力評估</div>
            <span class="range-value-pill">{{ FITNESS_LABELS[profile.fitness] }}（{{ profile.fitness }}/5）</span>
          </div>
          <div class="range-wrap">
            <input class="range-input" type="range" min="1" max="5" step="1" v-model.number="profile.fitness" />
            <div class="range-labels"><span>非常差</span><span>普通</span><span>非常好</span></div>
          </div>
        </div>

        <!-- 坡度承受係數 -->
        <div style="margin-bottom:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
            <div class="form-label">坡度承受係數</div>
            <span class="range-value-pill">{{ SLOPE_LABELS[profile.slopeCoeff] }}（{{ profile.slopeCoeff }}/5）</span>
          </div>
          <div class="range-wrap">
            <input class="range-input" type="range" min="1" max="5" step="1" v-model.number="profile.slopeCoeff" />
            <div class="range-labels"><span>緩坡</span><span>中坡</span><span>急陡坡</span></div>
          </div>
        </div>

        <!-- 目標天數 -->
        <div style="margin-bottom:16px">
          <div class="form-label" style="margin-bottom:6px">目標天數</div>
          <div class="toggle-group">
            <button
              v-for="opt in dayOptions"
              :key="opt.val"
              :class="['toggle-btn', { active: profile.targetDays === opt.val }]"
              @click="profile.targetDays = opt.val"
            >{{ opt.label }}</button>
          </div>
        </div>

        <button class="analyze-btn" :disabled="!profileOk || analyzing" @click="doAnalyze">
          {{ analyzing ? '🤖 AI 分析中...' : analyzed ? '🔄 重新分析推薦路線' : '🤖 AI 分析並推薦路線' }}
        </button>
        <div v-if="!profileOk" style="text-align:center;font-size:0.72rem;color:var(--text-muted);margin-top:6px">
          請先填寫年齡與體重
        </div>
      </div>

      <!-- ② AI 安全評分 -->
      <div v-if="analyzed" class="card stagger-item">
        <div class="section-label">AI 安全評分</div>
        <div style="display:flex;align-items:center;gap:16px">
          <RiskRing :score="safetyScore" :key="safetyScore" />
          <div style="flex:1">
            <div class="score-breakdown">
              <div class="score-breakdown-item"><span>體能指數</span><span class="score-breakdown-val">{{ profile.fitness * 12 }} 分</span></div>
              <div class="score-breakdown-item"><span>登山經驗</span><span class="score-breakdown-val">+{{ (EXP_MAP[profile.experience] - 1) * 10 }} 分</span></div>
              <div class="score-breakdown-item"><span>坡度承受力</span><span class="score-breakdown-val">+{{ Math.round((profile.slopeCoeff - 1) * 2) }} 分</span></div>
              <div class="score-breakdown-item"><span>裝備完成度</span><span class="score-breakdown-val">+{{ Math.round((gearCount / 10) * 12) }} 分</span></div>
            </div>
            <div style="margin-top:8px">
              <div class="readiness-track">
                <div class="readiness-fill" :style="{ width: `${safetyScore}%`, background: getRingColor(safetyScore) }" />
              </div>
              <div style="font-size:0.68rem;color:var(--text-muted);margin-top:4px">
                {{ safetyScore >= 70 ? '✅ 準備充足，可安全出發' : safetyScore >= 50 ? '⚠ 建議加強準備後再出發' : '🔴 體能或裝備不足，暫不建議出發' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ③ AI 推薦路線 -->
      <div v-if="analyzed" class="card stagger-item">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div class="section-label" style="margin-bottom:0">AI 推薦路線</div>
          <span style="font-size:0.7rem;color:var(--text-muted)">共 {{ recommendations.filter(r => r.matchScore >= 50).length }} 條適合</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div
            v-for="(r, i) in recommendations"
            :key="r.id"
            :class="['rec-card', 'stagger-item', { selected: selectedRoute?.id === r.id }]"
            :style="{ animationDelay: `${i * 0.05}s`, opacity: r.matchScore < 40 ? 0.55 : 1 }"
            @click="selectedRoute = r.matchScore >= 40 ? r : selectedRoute"
          >
            <div class="rec-card-top">
              <span style="font-size:20px">{{ r.emoji }}</span>
              <div style="flex:1">
                <div style="font-weight:800;font-size:0.88rem;letter-spacing:-0.02em">{{ r.name }}</div>
                <div style="font-size:0.65rem;color:var(--text-muted)">{{ r.region }}</div>
              </div>
              <span
                class="rec-match-badge"
                :style="{ background: r.matchBg, color: r.matchColor, border: `1px solid ${r.matchColor}33` }"
              >
                {{ i === 0 && r.matchScore >= 68 ? '🥇 ' : i === 1 && r.matchScore >= 68 ? '🥈 ' : '' }}{{ r.matchLabel }}
              </span>
            </div>

            <div class="rec-meta">
              <span>📏 {{ r.distance }}</span>
              <span>⬆ {{ r.elevation }}</span>
              <span>⏱ {{ r.time }}</span>
              <span>🏕 {{ r.minDays }}天</span>
              <span :class="['badge', `badge-${r.risk}`]">{{ riskLabel[r.risk] }}</span>
            </div>

            <div class="rec-highlight">{{ r.highlight }}</div>

            <button
              @click.stop="expandRec = expandRec === r.id ? null : r.id"
              style="margin-top:6px;background:none;border:none;cursor:pointer;font-size:0.7rem;color:var(--text-muted);font-family:inherit;padding:0;display:flex;align-items:center;gap:4px"
            >{{ expandRec === r.id ? '▲ 收起' : '▼' }} AI 分析理由</button>

            <div v-if="expandRec === r.id" style="margin-top:6px;display:flex;flex-direction:column;gap:4px">
              <div v-for="reason in r.reasons" :key="reason.text" style="display:flex;gap:6px;font-size:0.72rem;color:var(--text-secondary);line-height:1.4">
                <span style="flex-shrink:0">{{ reason.icon }}</span>
                <span>{{ reason.text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ④ 裝備清單 -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div class="section-label" style="margin-bottom:0">裝備清單</div>
          <span style="font-size:0.78rem;font-weight:700" :style="{ color: gearCount === 10 ? 'var(--risk-low)' : 'var(--text-muted)' }">{{ gearCount }}/10</span>
        </div>
        <div class="gear-grid">
          <div
            v-for="(item, i) in GEAR_ITEMS"
            :key="item.id"
            :class="['gear-item', 'stagger-item', { checked: gear[item.id] }]"
            :style="{ animationDelay: `${i * 0.03}s` }"
            @click="gear[item.id] = !gear[item.id]"
          >
            <span class="gear-icon">{{ item.icon }}</span>
            <span style="font-size:0.78rem;line-height:1.2">{{ item.label }}</span>
            <div class="gear-check">
              <svg v-if="gear[item.id]" width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- ⑤ AI 裝備辨識 -->
      <div class="card">
        <div class="section-label">AI 裝備辨識（YOLOv8）</div>
        <div class="yolo-area" @click="doScan" :style="{ minHeight: scanned ? 'auto' : '80px' }">
          <div v-if="!scanned && !scanning" style="text-align:center;padding:16px 0;pointer-events:none">
            <div style="font-size:28px;margin-bottom:4px">📷</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">點擊掃描裝備</div>
          </div>
          <template v-if="scanning">
            <div class="yolo-scanline" />
            <div style="color:var(--summit-accent);font-size:0.8rem;font-weight:700;padding:16px;z-index:1">辨識中...</div>
          </template>
          <div v-if="scanned" style="padding:10px;width:100%">
            <div style="font-size:0.75rem;color:var(--summit-accent);font-weight:700;margin-bottom:6px">✅ 辨識完成，已自動勾選 4 項</div>
            <div class="yolo-result">
              <span v-for="it in yoloItems" :key="it.label" class="yolo-chip">{{ it.label }} {{ it.conf }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ⑥ 天氣 -->
      <div class="card">
        <div class="section-label">明日天氣</div>
        <div class="weather-cols">
          <div v-for="w in weather" :key="w.label" class="weather-col">
            <div class="weather-icon">{{ w.icon }}</div>
            <div class="weather-temp">{{ w.temp }}</div>
            <div class="weather-label">{{ w.label }}</div>
          </div>
        </div>
        <div style="margin-top:10px;padding:8px 10px;background:rgba(251,146,60,0.1);border-radius:10px;border:1px solid rgba(251,146,60,0.25);font-size:0.78rem;color:var(--risk-mid);font-weight:600">
          ⚡ 建議 13:00 前下山，午後雷陣雨機率 75%
        </div>
      </div>

    </aside>

    <!-- ── Map area ── -->
    <div class="p1-map-area">
      <div class="p1-map-toolbar">
        <div v-if="selectedRoute" class="route-label-pill">
          <span>{{ selectedRoute.emoji }}</span>
          <span>{{ selectedRoute.name }}</span>
          <span :class="['badge', `badge-${selectedRoute.risk}`]">{{ riskLabel[selectedRoute.risk] }}</span>
        </div>
        <div v-else class="route-label-pill" style="opacity:0.55">← 請先完成評估並選擇路線</div>
        <button class="btn btn-primary" :disabled="!selectedRoute" @click="router.push('/active')">
          🥾 開始登山
        </button>
      </div>
      <MapPhase1
        :selected-route="selectedRoute ?? undefined"
        :theme="appStore.config.theme"
        style="position:absolute;inset:0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from 'src/stores/app'
import {
  GEAR_ITEMS, FITNESS_LABELS, SLOPE_LABELS, EXP_MAP,
  calcSafetyScore, getRecommendations, parseVoiceInput, getRingColor,
  type UserProfile, type RecommendedRoute,
} from 'src/data/hikingRoutes'
import RiskRing   from 'src/components/RiskRing.vue'
import MapPhase1  from 'src/components/MapPhase1.vue'

const router   = useRouter()
const appStore = useAppStore()

// ── LINE Chatbox ───────────────────────────
interface ChatMessage { id: number; role: 'bot' | 'user'; text: string; time: string }

const chatBottomRef = ref<HTMLDivElement>()
const chatInput     = ref('')
const chatTyping    = ref(false)

function nowTime() {
  return new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}

const chatMessages = ref<ChatMessage[]>([
  { id: 1, role: 'bot', text: '您好！我是 Summit AI 登山助理 🏔 請問您這次想走哪種路線？我可以依您的體能和偏好推薦最適合的山岳！', time: nowTime() },
])

const quickReplies = [
  { text: '幫我推薦路線', action: 'recommend' },
  { text: '分析我的體能', action: 'analyze' },
  { text: '查詢明日天氣', action: 'weather' },
  { text: '新手入門路線', action: 'beginner' },
]

const BOT_RESPONSES: Record<string, string[]> = {
  recommend: [
    '好的！根據您的資料，我會幫您分析最適合的路線。請先填寫下方的個人資料（年齡、體重），完成後按「AI 分析並推薦路線」，我會立即為您篩選！',
    '我可以依照您的體力等級、登山天數偏好來推薦路線。請在下方填寫基本資料後點擊分析，系統將從資料庫中找出最符合的行程。',
  ],
  analyze: [
    '體能分析需要您提供年齡、體重與登山經驗。請在「個人資料與體能評估」卡片中填寫，我會計算您的 AI 安全評分！',
    '我會綜合考量體能指數、坡度承受力和裝備完整度，給出 0~100 分的安全評分。請先填寫下方表單。',
  ],
  weather: [
    '明日天氣預報：早晨 12°C 多雲，中午 18°C 晴，下午 9°C 雷陣雨。⚡ 建議 13:00 前下山，午後雷陣雨機率 75%！',
    '根據中央氣象署資料：明天山區午後午後有明顯對流發展，建議提早出發，避開午後 13:00 後的危險時段。',
  ],
  beginner: [
    '新手推薦路線：\n① 象山步道（台北）- 1.5km，輕鬆級\n② 合歡山主峰（花蓮）- 2.9km，容易級\n③ 觀音山（新北）- 5.2km，入門級\n請選擇您有興趣的路線，我再提供詳細資訊！',
  ],
}

function scrollChat() {
  nextTick(() => chatBottomRef.value?.scrollIntoView({ behavior: 'smooth' }))
}

watch(chatMessages, scrollChat)
watch(chatTyping, scrollChat)

function sendQuickReply(q: { text: string; action: string }) {
  const time = nowTime()
  chatMessages.value.push({ id: Date.now(), role: 'user', text: q.text, time })
  chatTyping.value = true
  setTimeout(() => {
    chatTyping.value = false
    const replies = BOT_RESPONSES[q.action] ?? BOT_RESPONSES.recommend
    chatMessages.value.push({
      id: Date.now() + 1, role: 'bot', time: nowTime(),
      text: replies[Math.floor(Math.random() * replies.length)]!,
    })
  }, 1100)
}

function sendChatMessage() {
  const text = chatInput.value.trim()
  if (!text) return
  const time = nowTime()
  chatMessages.value.push({ id: Date.now(), role: 'user', text, time })
  chatInput.value = ''
  chatTyping.value = true
  setTimeout(() => {
    chatTyping.value = false
    // Simple keyword matching
    let action = 'recommend'
    if (/天氣|氣象|下雨/.test(text)) action = 'weather'
    else if (/體能|體力|評估|分析/.test(text)) action = 'analyze'
    else if (/新手|初學|入門/.test(text)) action = 'beginner'
    const replies = BOT_RESPONSES[action]!
    chatMessages.value.push({
      id: Date.now() + 1, role: 'bot', time: nowTime(),
      text: replies[Math.floor(Math.random() * replies.length)]!,
    })
  }, 1200)
}

// ── Profile form ──────────────────────────────
const profile = reactive<UserProfile>({
  age: '', weight: '', height: '',
  experience: 'beginner',
  fitness: 3, slopeCoeff: 3, targetDays: 1,
})

const expOptions = [
  { val: 'beginner',    label: '🌱 新手',   desc: '< 5次' },
  { val: 'experienced', label: '🧗 有經驗', desc: '5次以上' },
  { val: 'advanced',    label: '🏆 進階',   desc: '百岳/技術' },
]
const dayOptions = [
  { val: 1, label: '當日來回' },
  { val: 2, label: '2天1夜' },
  { val: 3, label: '3天2夜' },
  { val: 4, label: '4天以上' },
]

const profileOk = computed(() => !!(profile.age && profile.weight))
const analyzed  = ref(false)
const analyzing = ref(false)

function doAnalyze() {
  if (!profileOk.value) return
  analyzing.value = true
  setTimeout(() => { analyzing.value = false; analyzed.value = true; selectedRoute.value = null }, 900)
}

// ── Safety score & recommendations ───────────
const gear = reactive<Record<string, boolean>>({})
const gearCount = computed(() => Object.values(gear).filter(Boolean).length)

const safetyScore = computed(() =>
  analyzed.value ? calcSafetyScore(profile, gearCount.value) : 0
)
const recommendations = computed<RecommendedRoute[]>(() =>
  analyzed.value ? getRecommendations(profile) : []
)

const selectedRoute = ref<RecommendedRoute | null>(null)
const expandRec     = ref<string | null>(null)

const riskLabel: Record<string, string> = { low: '低風險', mid: '中風險', high: '高風險', sos: '極高風險' }

// ── YOLO scanner ──────────────────────────────
const scanning  = ref(false)
const scanned   = ref(false)
const yoloItems = ref<Array<{ label: string; conf: string }>>([])

function doScan() {
  if (scanning.value || scanned.value) return
  scanning.value = true
  setTimeout(() => {
    const autoItems = ['boots','poles','headlamp','rain']
    autoItems.forEach(k => { gear[k] = true })
    yoloItems.value = [
      { label: '登山鞋', conf: '97%' }, { label: '登山杖', conf: '93%' },
      { label: '頭燈',   conf: '89%' }, { label: '雨衣',   conf: '84%' },
    ]
    scanning.value = false; scanned.value = true
  }, 2000)
}

// ── Voice input ───────────────────────────────
const voiceSupported  = ref(false)
const voiceActive     = ref(false)
const voiceTranscript = ref('')
const voiceFinal      = ref('')
const voiceParsed     = ref<ReturnType<typeof parseVoiceInput> | null>(null)
let recognition: any = null

onMounted(() => {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SR) return
  voiceSupported.value = true
  const r = new SR()
  r.lang = 'zh-TW'; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1

  r.onresult = (e: any) => {
    let interim = '', final = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) final  += e.results[i][0].transcript
      else                      interim += e.results[i][0].transcript
    }
    voiceTranscript.value = interim
    if (final) { voiceFinal.value += final; voiceTranscript.value = '' }
  }
  r.onend = () => {
    voiceActive.value = false
    if (voiceFinal.value) voiceParsed.value = parseVoiceInput(voiceFinal.value)
  }
  r.onerror = (e: any) => {
    if (e.error !== 'no-speech') console.warn('Speech error:', e.error)
    voiceActive.value = false
  }
  recognition = r
})

function toggleVoice() {
  if (!recognition) return
  if (voiceActive.value) {
    recognition.stop()
  } else {
    voiceTranscript.value = ''; voiceFinal.value = ''; voiceParsed.value = null
    voiceActive.value = true
    try { recognition.start() } catch (_) {}
  }
}

function resetVoice() {
  voiceTranscript.value = ''; voiceFinal.value = ''; voiceParsed.value = null
}

function applyVoiceAndAnalyze() {
  if (!voiceParsed.value?.fields) return
  Object.assign(profile, voiceParsed.value.fields)
  if (profile.age && profile.weight) {
    analyzing.value = true
    setTimeout(() => { analyzing.value = false; analyzed.value = true; selectedRoute.value = null }, 900)
  }
}

// ── Static data ───────────────────────────────
const weather = [
  { icon: '⛅', temp: '12°C', label: '早晨' },
  { icon: '☀',  temp: '18°C', label: '中午' },
  { icon: '🌧', temp: '9°C',  label: '下午' },
]
</script>

<style scoped>
/* ── LINE Chat Card ── */
.line-chat-card {
  padding: 0;
  overflow: hidden;
}

.line-chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #06c755;
  border-radius: 16px 16px 0 0;
}

.line-chat-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.line-chat-name {
  font-size: 0.85rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.01em;
}

.line-chat-status {
  font-size: 0.65rem;
  color: rgba(255,255,255,0.82);
  display: flex;
  align-items: center;
  gap: 4px;
}

.line-online-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
  display: inline-block;
}

.line-chat-messages {
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-card);
}

.line-msg-row {
  display: flex;
  gap: 6px;
  align-items: flex-end;
}

.line-msg-row.user {
  flex-direction: row-reverse;
}

.line-msg-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #06c755;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.line-msg-bubble {
  max-width: 220px;
  padding: 7px 10px;
  border-radius: 12px;
  font-size: 0.78rem;
  line-height: 1.5;
  white-space: pre-line;
}

.line-msg-bot {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  color: var(--text-primary);
  border-bottom-left-radius: 4px;
}

.line-msg-user {
  background: #06c755;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.line-msg-time {
  font-size: 0.6rem;
  color: var(--text-muted);
  margin-top: 2px;
}

/* Typing indicator */
.line-typing-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  border-bottom-left-radius: 4px;
}

.line-typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
  animation: typing-bounce 1.2s ease-in-out infinite;
}

.line-typing-dot:nth-child(2) { animation-delay: 0.2s; }
.line-typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-5px); }
}

/* Quick replies */
.line-quick-replies {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px;
  border-top: 1px solid var(--border);
  background: var(--bg-card);
}

.line-quick-btn {
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid #06c755;
  background: transparent;
  color: #06c755;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}

.line-quick-btn:hover {
  background: #06c755;
  color: #fff;
}

/* Input bar */
.line-input-bar {
  display: flex;
  gap: 6px;
  padding: 8px 12px 12px;
  background: var(--bg-card);
}

.line-chat-input {
  flex: 1;
  padding: 7px 12px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.78rem;
  font-family: inherit;
  outline: none;
}

.line-chat-input:focus {
  border-color: #06c755;
}

.line-send-btn {
  padding: 7px 14px;
  border-radius: 20px;
  border: none;
  background: #06c755;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}
</style>
