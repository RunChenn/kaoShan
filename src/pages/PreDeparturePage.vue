<template>
  <!-- Voice Overlay -->
  <Teleport to="body">
    <div
      v-if="voiceOverlay"
      class="voice-overlay"
      @click.self="closeVoiceOverlay"
    >
      <div class="voice-overlay-panel">
        <!-- Recording phase -->
        <template v-if="overlayPhase === 'recording'">
          <div class="voice-overlay-title">語音輸入</div>
          <div class="voice-wave-lg">
            <div v-for="i in 5" :key="i" class="voice-bar-lg" />
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

        <!-- Sending phase -->
        <template v-else>
          <div class="voice-overlay-title">轉文字中...</div>
          <div class="voice-wave-lg">
            <div v-for="i in 5" :key="i" class="voice-bar-lg" />
          </div>
          <div class="voice-overlay-live">
            <span class="voice-final-text">{{ overlayFinal }}</span>
            <span class="voice-placeholder">正在把語音放進輸入框...</span>
          </div>
        </template>
      </div>
    </div>
  </Teleport>

  <div class="p1-grid" :class="{ 'has-map': !!selectedRoute }">
    <!-- ── Sidebar ── -->
    <aside class="p1-sidebar">
      <!-- LINE AI 路線諮詢 -->
      <div
        class="pre-line-panel line-page"
        :class="{ 'line-panel-collapsed': chatCollapsed }"
        :data-theme="appStore.config.theme"
      >
        <div class="line-header">
          <div class="line-header-bot">
            <div class="line-bot-avatar">⛰</div>
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
              :class="{ 'ai-mode-openai': aiChatMode === 'openai' }"
              :title="
                aiChatMode === 'mock' ? '目前使用假資料' : '目前使用 OpenAI'
              "
              @click="toggleAiChatMode"
            >
              {{ aiChatMode === 'mock' ? '假資料' : 'OpenAI' }}
            </button>
            <button
              v-if="recommendationsVisible && !chatCollapsed"
              class="chat-small-btn chat-collapse-btn"
              title="收合對話"
              @click="toggleChatCollapsed"
            >
              <span class="material-icons">unfold_less</span>
              <span>收合對話</span>
            </button>
            <button
              v-if="recommendationsVisible"
              class="chat-small-btn chat-reset-chat-btn"
              title="重新聊天"
              @click="resetChatConversation"
            >
              <span class="material-icons">restart_alt</span>
              <span>重新聊天</span>
            </button>
            <!-- <button class="line-icon-btn" title="撥打電話">📞</button> -->
            <!-- <button class="line-icon-btn" title="視訊">📹</button> -->
            <!-- <button
              class="line-icon-btn"
              @click="showContacts = !showContacts"
              :class="{ active: showContacts }"
              title="緊急聯絡人"
            >
              👥
            </button> -->
          </div>
        </div>

        <div v-if="chatCollapsed" class="chat-collapsed-strip">
          <div>
            <div class="chat-collapsed-title">AI 已完成需求統整</div>
            <div class="chat-collapsed-sub">
              {{ demandSummary.goal }} · {{ demandSummary.days }} ·
              {{ demandSummary.fitness }}
            </div>
          </div>
          <button class="chat-expand-btn" @click="toggleChatCollapsed">
            查看對話
          </button>
        </div>

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

        <div v-if="!chatCollapsed" class="line-messages" ref="msgListEl">
          <div class="line-date-divider">今天</div>

          <template v-for="m in messages" :key="m.id">
            <div v-if="m.type === 'sos'" class="msg-sos">
              <div class="msg-sos-icon">🆘</div>
              <div>
                <div class="msg-sos-title">SOS 緊急求救訊號已發送</div>
                <div class="msg-sos-sub">
                  位置：玉山主峰 23.469°N 120.957°E｜{{ m.time }}
                </div>
              </div>
            </div>

            <div v-else-if="m.type === 'route-card'" class="msg-row bot">
              <div class="msg-bot-icon">⛰</div>
              <div
                class="route-card"
                :class="{
                  'route-card-selected':
                    selectedRoute?.id === cardOf(m).source?.id,
                }"
              >
                <div class="route-card-top">
                  <!-- <span class="route-emoji">{{ cardOf(m).emoji }}</span> -->
                  <div>
                    <div class="route-card-name">{{ cardOf(m).name }}</div>
                    <div class="route-card-region">{{ cardOf(m).region }}</div>
                  </div>
                  <span
                    :class="[
                      'route-diff-badge',
                      `diff-${cardOf(m).difficulty}`,
                    ]"
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
                <div class="route-card-highlight">
                  {{ cardOf(m).highlight }}
                </div>
                <div class="route-card-actions">
                  <button
                    class="custom-btn route-action-btn"
                    @click="selectRecommendedRoute(cardOf(m))"
                  >
                    {{
                      selectedRoute?.id === cardOf(m).source?.id
                        ? '已選擇'
                        : '出發前規劃'
                    }}
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

            <div v-else-if="m.type === 'weather-card'" class="msg-row bot">
              <div class="msg-bot-icon">⛰</div>
              <div class="weather-card">
                <div class="weather-card-title">明日山區天氣預報</div>
                <div class="weather-cols">
                  <div
                    v-for="w in weatherData"
                    :key="w.label"
                    class="weather-col"
                  >
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

            <div v-else-if="m.type === 'history-card'" class="msg-row bot">
              <div class="msg-bot-icon">⛰</div>
              <div class="chat-history-card">
                <div class="chat-history-card-title">
                  {{ (m.cardData as ParsedHistory).name }}
                </div>
                <div class="chat-history-card-meta">
                  <span
                    >📏 {{ (m.cardData as ParsedHistory).distanceKm }}km</span
                  >
                  <span
                    >⬆ {{ (m.cardData as ParsedHistory).elevationGain }}m</span
                  >
                  <span>
                    ⏱
                    {{
                      Math.floor(
                        (m.cardData as ParsedHistory).durationMin / 60,
                      )
                    }}h{{ (m.cardData as ParsedHistory).durationMin % 60 }}m
                  </span>
                </div>
                <div class="chat-history-card-date">
                  {{ (m.cardData as ParsedHistory).date }}
                </div>
              </div>
            </div>

            <div v-else-if="m.type === 'analysis-progress'" class="msg-row bot">
              <div class="msg-bot-icon">⛰</div>
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
                <div class="chat-progress-pct">
                  {{ (m.cardData as ProgressData).progress }}%
                </div>
              </div>
            </div>

            <div v-else-if="m.type === 'analysis-card'" class="msg-row bot">
              <div class="msg-bot-icon">⛰</div>
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

            <div v-else class="msg-row" :class="m.role">
              <div v-if="m.role === 'bot'" class="msg-bot-icon">⛰</div>
              <div>
                <div :class="['msg-bubble', `msg-${m.role}`]">{{ m.text }}</div>
                <div
                  class="msg-time"
                  :class="{
                    'msg-time-user': m.role === 'user',
                    'msg-time-bot': m.role === 'bot',
                  }"
                >
                  {{ m.time }}
                </div>
              </div>
            </div>
          </template>

          <div v-if="typing" class="msg-row bot">
            <div class="msg-bot-icon">⛰</div>
            <div class="typing-bubble">
              <div class="typing-dot" />
              <div class="typing-dot" />
              <div class="typing-dot" />
            </div>
          </div>

          <div ref="msgEndEl" />
        </div>

        <div
          v-if="!chatCollapsed && quickReplies.length"
          class="quick-reply-bar"
        >
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

        <div v-if="!chatCollapsed" class="line-input-bar">
          <label class="input-icon-btn" title="上傳 GPX / JSON 紀錄">
            📎
            <input
              type="file"
              accept=".gpx,.json"
              @change="onFileUpload"
              hidden
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
            @compositionstart="isComposing = true"
            @compositionend="isComposing = false"
            @keydown.enter.exact.prevent="
              !isComposing && sendUserMsg(inputText)
            "
          />
          <button
            class="line-send-btn"
            :class="{ active: inputText.trim() }"
            @click.prevent="sendUserMsg(inputText)"
          >
            發送
          </button>
        </div>
      </div>

      <div
        v-if="recommendationsVisible"
        class="card recommendation-panel anim-slide-up"
      >
        <div class="section-label">需求統整</div>
        <div class="demand-grid">
          <div class="demand-item">
            <span>地區</span>
            <strong>{{ demandSummary.goal }}</strong>
          </div>
          <div class="demand-item">
            <span>天數</span>
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
        <div class="demand-note">{{ demandSummary.note }}</div>

        <div class="recommendation-header">
          <div class="section-label recommendation-label">推薦路線</div>
          <button
            class="custom-btn recommendation-reroll-btn"
            title="重新推薦"
            :disabled="rerollingRecommendations"
            @click="rerollRecommendations"
          >
            <span class="material-icons">refresh</span>
            <span>換路線</span>
          </button>
        </div>
        <div class="recommendation-list">
          <div
            v-for="card in recommendedRouteCards"
            :key="card.source?.id ?? card.name"
            class="route-card route-card-full"
            :class="{
              'route-card-selected': selectedRoute?.id === card.source?.id,
            }"
          >
            <div class="route-card-top">
              <!-- <span class="route-emoji">{{ card.emoji }}</span> -->
              <div>
                <div class="route-card-name">{{ card.name }}</div>
                <div class="route-card-region">{{ card.region }}</div>
              </div>
              <span :class="['route-diff-badge', `diff-${card.difficulty}`]">
                {{
                  { easy: '入門', medium: '中級', hard: '進階' }[
                    card.difficulty
                  ]
                }}
              </span>
            </div>
            <div class="route-card-meta">
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
                <div class="route-card-meta-title">天數</div>
                <div class="route-card-meta-data">{{ card.days }}</div>
              </div>
            </div>
            <div class="route-card-highlight">{{ card.highlight }}</div>
            <div class="route-card-actions">
              <button
                class="custom-btn route-action-btn"
                @click="selectRecommendedRoute(card)"
              >
                {{
                  selectedRoute?.id === card.source?.id
                    ? '已選擇'
                    : '選擇此路線'
                }}
              </button>
              <button
                class="custom-btn route-action-ghost route-action-btn"
                @click="askMoreAboutRoute(card)"
              >
                了解更多
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- AI 裝備辨識 -->
      <div v-if="planningRevealed" class="card anim-slide-up">
        <div class="section-label">AI 裝備辨識</div>
        <input
          ref="gearPhotoInput"
          type="file"
          accept="image/*"
          hidden
          @change="onGearPhotoSelected"
        />
        <div
          class="yolo-area"
          @click="doScan"
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
            <div class="yolo-scanned-title">
              辨識完成，已自動加入且勾選 {{ yoloItems.length }} 項
            </div>
            <div class="yolo-result">
              <!-- <span v-for="it in yoloItems" :key="it.label" class="yolo-chip">{{ it.label }} {{ it.conf }}</span> -->
              <span v-for="it in yoloItems" :key="it.label" class="yolo-chip">{{
                it.label
              }}</span>
            </div>
            <button class="yolo-rescan-btn" @click.stop="resetGearScan">
              重新辨識
            </button>
          </div>
        </div>
      </div>

      <!-- 裝備清單 -->
      <div v-if="planningRevealed" class="card anim-slide-up">
        <div class="gear-header-row">
          <div class="section-label section-label-compact">裝備清單</div>
          <span
            class="gear-count"
            :class="{
              'gear-count-ok':
                gearItems.length > 0 && gearCount === gearItems.length,
            }"
            >{{ gearCount }}/{{ gearItems.length }}</span
          >
        </div>
        <div class="gear-add-row">
          <input
            v-model="newGearLabel"
            class="gear-add-input"
            placeholder="新增裝備，例如：手套"
            @keydown.enter="addCustomGear"
          />
          <button class="gear-add-btn" @click="addCustomGear">新增</button>
        </div>
        <div v-if="gearItems.length === 0" class="gear-empty">
          尚未建立裝備清單。可自行新增，或使用 AI 裝備辨識自動加入。
        </div>
        <div v-else class="gear-grid">
          <div
            v-for="(item, i) in gearItems"
            :key="item.id"
            :class="[
              'gear-item',
              'stagger-item',
              `stagger-${Math.min(i + 1, 12)}`,
              { checked: gear[item.id] },
            ]"
            @click="gear[item.id] = !gear[item.id]"
          >
            <div class="gear-check">
              <svg
                v-if="gear[item.id]"
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
              >
                <path
                  d="M2 5l2.5 2.5L8 3"
                  stroke="#fff"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <!-- <span class="gear-icon">{{ item.icon }}</span> -->
            <span class="gear-label">{{ item.label }}</span>
            <button
              class="gear-remove-btn"
              title="刪除裝備"
              @click.stop="removeGear(item.id)"
            >
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
        <button
          class="gear-assess-btn"
          :disabled="gearItems.length === 0 || gearAssessing"
          @click="assessGearList"
        >
          {{ gearAssessing ? 'AI 評估中...' : 'AI 評估清單' }}
        </button>
        <!-- AI 評估內容 -->
        <div v-if="gearAssessment" class="gear-assessment-card">
          <div class="gear-score-ring">
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
              <strong>{{ gearAssessment.score }}</strong>
              <span>分</span>
            </div>
          </div>
          <div class="gear-assessment-copy">
            <div class="gear-assessment-title">{{ gearAssessment.level }}</div>
            <div class="gear-assessment-text">{{ gearAssessment.summary }}</div>
            <ul class="gear-assessment-list">
              <li v-for="tip in gearAssessment.tips" :key="tip">{{ tip }}</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 天氣 -->
      <div v-if="planningRevealed" class="card anim-slide-up">
        <div class="section-label weather-section-header">
          <div class="weather-section-title">
            明日天氣
            <span v-if="routeWeather?.location_name" class="weather-location">
              {{ routeWeather.location_name }}
            </span>
          </div>
          <button
            v-if="showWeatherModeToggle"
            class="chat-small-btn weather-mode-toggle"
            :class="{ 'ai-mode-openai': weatherMode === 'openai' }"
            :title="
              weatherMode === 'mock' ? '目前使用假資料' : '目前使用 OpenAI'
            "
            @click="toggleWeatherMode"
          >
            {{ weatherMode === 'mock' ? '假資料' : 'OpenAI' }}
          </button>
        </div>
        <div v-if="weatherLoading" class="weather-loading">
          {{
            weatherMode === 'mock'
              ? '正在產生本地假天氣建議...'
              : '正在取得中央氣象署資料並呼叫 OpenAI...'
          }}
        </div>
        <div class="weather-cols">
          <div v-for="w in displayedWeather" :key="w.label" class="weather-col">
            <div class="weather-icon">{{ w.icon }}</div>
            <div class="weather-temp">{{ w.temp }}</div>
            <div class="weather-label">{{ w.label }}</div>
          </div>
        </div>
        <div class="weather-advice-box">
          {{ weatherAdvice }}
        </div>
        <div v-if="routeWeather?.source" class="weather-source">
          來源：{{ routeWeather.source }}
        </div>
        <div
          v-if="showWeatherModeToggle"
          class="weather-ai-status"
          :class="weatherAiStatusClass"
        >
          {{ weatherAiStatusLabel }}
        </div>
      </div>

      <div v-if="selectedRoute" class="offline-download-card">
        <div class="offline-download-title">離線下載包</div>
        <div class="offline-download-desc">
          會打包路線資料、路線 GPX 軌跡、裝備清單、AI 風險評估與緊急求救資料。
        </div>
        <button
          class="offline-download-btn"
          :disabled="offlinePackageDownloading"
          @click="downloadOfflinePackage"
        >
          <span class="material-icons">download</span>
          <span>{{
            offlinePackageDownloading ? '建立中...' : '離線下載包'
          }}</span>
        </button>
      </div>
    </aside>

    <!-- Map area — only shown after route is selected -->
    <Transition name="p1-map">
      <div v-if="selectedRoute" class="p1-map-area">
        <div class="p1-map-toolbar">
          <div class="route-label-pill">
            <span>{{ selectedRoute.emoji }}</span>
            <span>{{ selectedRoute.name }}</span>
            <span
              :class="[
                'route-diff-badge',
                `diff-${routeDifficulty(selectedRoute)}`,
              ]"
              >{{ routeDifficultyLabel(selectedRoute) }}</span
            >
          </div>
          <div class="p1-map-actions">
            <div class="map-gpx-badge" title="已自動載入推薦路線 GPX">
              <span class="material-icons">route</span>
              <span>GPX 已載入</span>
            </div>
            <button class="btn btn-primary" @click="router.push('/active')">
              開始登山
            </button>
          </div>
        </div>
        <div v-if="gpxMapTrack" class="gpx-map-status">
          <span class="material-icons">timeline</span>
          <strong>{{ gpxMapTrack.name }}</strong>
          <span>{{ gpxMapTrack.distanceKm.toFixed(1) }} km</span>
          <span>爬升 {{ Math.round(gpxMapTrack.elevationGain) }} m</span>
        </div>
        <MapPhase1
          :selected-route="selectedRoute"
          :theme="appStore.config.theme"
          :gpx-track="gpxMapTrack"
          class="p1-map-layer"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { api } from 'src/boot/axios';
import MapPhase1 from 'src/components/MapPhase1.vue';
import { useAiRouter } from 'src/composables/useAiRouter';
import {
  FITNESS_LABELS,
  GEAR_ITEMS,
  ROUTES,
  getRecommendations,
  type GearItem,
  type RecommendedRoute,
  type UserProfile,
} from 'src/data/hikingRoutes';
import { useAppStore } from 'src/stores/app';
import { useAuthStore } from 'src/stores/auth';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const appStore = useAppStore();
const aiRouter = useAiRouter();
const auth = useAuthStore();
const showAiModeToggle = import.meta.env.DEV;
const aiChatMode = ref<'mock' | 'openai'>(showAiModeToggle ? 'mock' : 'openai');
const shouldUseOpenAiChat = computed(
  () => !showAiModeToggle || aiChatMode.value === 'openai',
);
const showWeatherModeToggle = import.meta.env.DEV;
const weatherMode = ref<'mock' | 'openai'>(
  showWeatherModeToggle ? 'mock' : 'openai',
);
const shouldUseOpenAiWeather = computed(
  () => !showWeatherModeToggle || weatherMode.value === 'openai',
);

// ── Types ───────────────────────────────────────
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface SpeechRecognitionEventResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionEventResult[];
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
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

interface RouteCard {
  emoji: string;
  name: string;
  region: string;
  difficulty: 'easy' | 'medium' | 'hard';
  distance: string;
  elevation: string;
  time: string;
  days: string;
  highlight: string;
  source?: RecommendedRoute;
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
  time: string;
  cardData?: ParsedHistory | AnalysisResult | ProgressData;
}

interface ApiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface QuickReply {
  label: string;
  action: string;
}

interface DemandSummary {
  goal: string;
  days: string;
  fitness: string;
  risk: string;
  note: string;
}

interface GearAssessment {
  score: number;
  level: string;
  summary: string;
  tips: string[];
}

interface GearDetectItem {
  name: string;
  detected: boolean;
  confidence: number;
}

interface GearDetectResponse {
  items: GearDetectItem[];
  missing_count: number;
  model_used: string;
  fallback?: boolean;
}

interface GearAssessResponse {
  score: number;
  level: string;
  summary: string;
  tips: string[];
  model_used: string;
  fallback?: boolean;
}

interface WeatherPeriod {
  label: string;
  icon: string;
  temp: string;
  condition: string;
  rain_probability?: string | null;
}

interface RouteWeatherResponse {
  location_name: string;
  periods: WeatherPeriod[];
  advice: string;
  source: string;
  model_used: string;
  fallback?: boolean;
}

interface GpxMapTrack {
  name: string;
  points: [number, number][];
  distanceKm: number;
  elevationGain: number;
}

interface OfflinePackageMeta {
  success: boolean;
  task_id: string;
  estimated_size_mb: number;
  includes: Array<{
    name: string;
    description: string;
    estimated_size_mb: number;
  }>;
  message: string;
}

interface ProfileForm {
  age: number;
  weight: number;
  level: 'beginner' | 'experienced';
  fitness: number;
  target_days: number;
}

interface RouteApiResponse {
  id: string;
  name: string;
  location: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  days: number;
  distance_km: number;
  estimated_hours: number;
  elevation_gain: number;
  risks: {
    slip: number;
    lost: number;
    deviation: number;
  };
}

interface CachedRouteRecommendation {
  savedAt: number;
  routes: RouteApiResponse[];
}

// ── LINE Chatbox ─────────────────────────────────
const ROUTE_RECOMMEND_CACHE_PREFIX = 'kaoshan:routes:recommend:';
const ROUTE_RECOMMEND_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const msgListEl = ref<HTMLDivElement>();
const msgEndEl = ref<HTMLDivElement>();
const inputText = ref('');
const isComposing = ref(false);
const typing = ref(false);
const showContacts = ref(false);
const chatCollapsed = ref(false);
const recommendationsVisible = ref(false);
const planningRevealed = ref(false);
const historyContext = ref('');
const profileForm = ref<ProfileForm | null>(null);
const recommendedRouteCards = ref<RouteCard[]>([]);
const rerollingRecommendations = ref(false);
const lastRecommendationContext = ref<{
  routes: RecommendedRoute[];
  sourceMessage: string;
  profile?: ProfileForm;
} | null>(null);
const demandSummary = ref<DemandSummary>({
  goal: '尚未建立',
  days: '待確認',
  fitness: '待確認',
  risk: '待確認',
  note: '完成 AI 對話後，這裡會整理本次登山需求與推薦路線。',
});

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
    text: `您好${auth.profile?.displayName ? '，' + auth.profile.displayName : ''}！我是 KaoShan 助理\n\n您可以用三種方式開始規劃：\n1. 直接聊天：告訴我年齡、體力、登山經驗和想走幾天。\n2. 語音輸入：用說的描述這次想走的路線或體能狀況。\n3. 上傳紀錄：上傳 GPX / JSON 登山紀錄，我會分析距離、爬升與體能表現。\n\n我會依照這些資料幫您推薦適合的路線。`,
  },
]);

function createInitialMessages(): Message[] {
  return [
    {
      id: 1,
      role: 'bot',
      type: 'text',
      time: nowTime(),
      text: `您好${auth.profile?.displayName ? '，' + auth.profile.displayName : ''}！我是 KaoShan 助理\n\n您可以用三種方式開始規劃：\n1. 直接聊天：告訴我年齡、體力、登山經驗和想走幾天。\n2. 語音輸入：用說的描述這次想走的路線或體能狀況。\n3. 上傳紀錄：上傳 GPX / JSON 登山紀錄，我會分析距離、爬升與體能表現。\n\n我會依照這些資料幫您推薦適合的路線。`,
    },
  ];
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

function toggleAiChatMode() {
  aiChatMode.value = aiChatMode.value === 'mock' ? 'openai' : 'mock';
}

function toggleChatCollapsed() {
  chatCollapsed.value = !chatCollapsed.value;
}

function resetChatConversation() {
  stopVoiceCapture();
  voiceOverlay.value = false;
  voiceDraftSnapshot.value = '';
  voiceDraftCommitted.value = false;
  recordedVoiceBlob.value = null;
  overlayFinal.value = '';
  overlayLive.value = '';
  overlayPhase.value = 'recording';

  inputText.value = '';
  typing.value = false;
  showContacts.value = false;
  chatCollapsed.value = false;
  recommendationsVisible.value = false;
  planningRevealed.value = false;
  historyContext.value = '';
  profileForm.value = null;
  recommendedRouteCards.value = [];
  rerollingRecommendations.value = false;
  lastRecommendationContext.value = null;
  demandSummary.value = {
    goal: '尚未建立',
    days: '待確認',
    fitness: '待確認',
    risk: '待確認',
    note: '完成 AI 對話後，這裡會整理本次登山需求與推薦路線。',
  };

  selectedRoute.value = null;
  routeWeather.value = null;
  weatherLoading.value = false;

  gearItems.value = [];
  gearAssessment.value = null;
  scanned.value = false;
  scanning.value = false;
  yoloItems.value = [];
  lastDetectedGearIds.value = new Set();
  gearPhotoInput.value && (gearPhotoInput.value.value = '');
  for (const key of Object.keys(gear)) {
    delete gear[key];
  }

  messages.value = createInitialMessages();
  quickReplies.value = QUICK_IDLE;
  void nextTick(() => scrollToBottom());
}

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

function showPlanningTools() {
  planningRevealed.value = true;
}

function buildDemandSummary(msg: string): DemandSummary {
  return {
    goal: /北部|中部|南部|東部/.test(msg)
      ? (msg.match(/(北部|中部|南部|東部)/)?.[1] ?? '待確認地區')
      : '待確認地區',
    days: /兩天|2天/.test(msg)
      ? '2 天 1 夜'
      : /三天|3天/.test(msg)
        ? '3 天 2 夜'
        : '1 日行程',
    fitness: /進階|挑戰|百岳/.test(msg)
      ? '良好，可接受較長爬升'
      : /體能|分析|GPX|紀錄/.test(msg)
        ? '依上傳紀錄估算：普通至良好'
        : '普通，優先控制負荷',
    risk: /陡|挑戰|百岳/.test(msg) ? '可接受中風險' : '偏好低風險',
    note: '假資料模式：先以天數、體能、坡度接受度與天氣風險篩選，選定路線後再展開裝備與天氣檢查。',
  };
}

function buildDemandSummaryFromProfile(
  profile: ProfileForm,
  sourceMessage: string,
): DemandSummary {
  return {
    goal: /北部|中部|南部|東部/.test(sourceMessage)
      ? (sourceMessage.match(/(北部|中部|南部|東部)/)?.[1] ?? '待確認地區')
      : '待確認地區',
    days: `${profile.target_days} 日行程`,
    fitness: `${FITNESS_LABELS[profile.fitness]}（${profile.fitness}/5）`,
    risk:
      profile.level === 'experienced' && profile.fitness >= 4
        ? '可接受中風險'
        : '優先低風險',
    note: '已取得 ProfileForm，並透過 POST /api/v1/routes/recommend 取得推薦路線。',
  };
}

function publishRouteRecommendations(
  routes: RecommendedRoute[],
  sourceMessage: string,
  profile?: ProfileForm,
) {
  lastRecommendationContext.value = {
    routes,
    sourceMessage,
    profile,
  };
  const summary = profile
    ? buildDemandSummaryFromProfile(profile, sourceMessage)
    : buildDemandSummary(sourceMessage);
  const uniqueRegions = [...new Set(routes.map((route) => route.region))];
  summary.goal =
    uniqueRegions.length > 0
      ? uniqueRegions.length === 1
        ? uniqueRegions[0]!
        : uniqueRegions.slice(0, 2).join('、')
      : '待確認地區';
  demandSummary.value = summary;
  recommendedRouteCards.value = routes.slice(0, 3).map(toRouteCard);
  recommendationsVisible.value = true;
  chatCollapsed.value = true;
  messages.value.push({
    id: Date.now() + 2,
    role: 'bot',
    type: 'text',
    text: '我已完成需求統整，推薦路線已整理在下方區塊。請先選擇一條路線，再進入裝備與天氣檢查。',
    time: nowTime(),
  });
  quickReplies.value = [];
}

function rerollRecommendations() {
  const context = lastRecommendationContext.value;
  if (!context || rerollingRecommendations.value) return;
  rerollingRecommendations.value = true;
  try {
    publishRouteRecommendations(
      context.routes,
      context.sourceMessage,
      context.profile,
    );
  } finally {
    rerollingRecommendations.value = false;
  }
}

function hasMinimumProfileInfo(text: string) {
  const hasAge = /(\d{1,3})\s*歲/.test(text);
  const hasFitness =
    /體力|體能|新手|第一次|入門|進階|百岳|挑戰|體力好|普通|一般/.test(text);
  const hasDays = /(\d+)\s*(?:天|日)|一天|兩天|三天/.test(text);
  return hasAge && hasFitness && hasDays;
}

function fallbackProfileFromText(text: string, fitness = 3): ProfileForm {
  const ageMatch = text.match(/(\d{1,3})\s*歲/);
  const weightMatch = text.match(/(\d{2,3})\s*(?:公斤|kg|KG)/);
  const daysMatch = text.match(/(\d+)\s*(?:天|日)/);
  const targetDays = /兩天|2天/.test(text)
    ? 2
    : /三天|3天/.test(text)
      ? 3
      : Number(daysMatch?.[1] ?? 1);
  return {
    age: Number(ageMatch?.[1] ?? 30),
    weight: Number(weightMatch?.[1] ?? 70),
    level: /新手|第一次|入門/.test(text) ? 'beginner' : 'experienced',
    fitness: Math.min(
      5,
      Math.max(1, /進階|百岳|挑戰|體力好/.test(text) ? 4 : fitness),
    ),
    target_days: Math.min(5, Math.max(1, targetDays || 1)),
  };
}

function profileToRecommendationInput(profile: ProfileForm): UserProfile {
  return {
    age: String(profile.age),
    weight: String(profile.weight),
    height: '',
    experience: profile.level,
    fitness: profile.fitness,
    slopeCoeff: 3,
    targetDays: profile.target_days,
  };
}

function normalizeExtractedProfile(
  extracted: Record<string, unknown> | null | undefined,
  fallbackText: string,
): ProfileForm {
  const fallback = fallbackProfileFromText(fallbackText);
  const experience = String(
    extracted?.experience ?? extracted?.level ?? fallback.level,
  );
  return {
    age: Number(extracted?.age ?? fallback.age),
    weight: Number(extracted?.weight ?? fallback.weight),
    level: experience === 'beginner' ? 'beginner' : 'experienced',
    fitness: Math.min(
      5,
      Math.max(1, Number(extracted?.fitness ?? fallback.fitness)),
    ),
    target_days: Math.min(
      5,
      Math.max(
        1,
        Number(
          extracted?.targetDays ??
            extracted?.target_days ??
            fallback.target_days,
        ),
      ),
    ),
  };
}

async function extractProfileWithOpenAi(
  text: string,
): Promise<ProfileForm | null> {
  try {
    const { data } = await api.post<{
      reply: string;
      ready: boolean;
      extracted_profile?: Record<string, unknown> | null;
    }>('/chat', {
      messages: buildChatRequestMessages(text),
      history_context: historyContext.value,
    });
    if (!data.ready && !data.extracted_profile) return null;
    return normalizeExtractedProfile(data.extracted_profile, text);
  } catch (_) {
    if (!hasMinimumProfileInfo(text)) return null;
    return fallbackProfileFromText(text);
  }
}

function apiRouteToRecommendedRoute(route: RouteApiResponse): RecommendedRoute {
  const local =
    ROUTES.find((r) => r.id === route.id) ??
    ROUTES.find(
      (r) =>
        r.name === route.name ||
        route.name.includes(r.name) ||
        r.name.includes(route.name),
    );
  const risk =
    route.difficulty === 'easy'
      ? 'low'
      : route.difficulty === 'medium'
        ? 'mid'
        : 'high';
  return {
    ...(local ?? ROUTES[0]!),
    id: route.id,
    name: route.name,
    region: route.location,
    risk,
    distance: `${route.distance_km}km`,
    elevation: `${route.elevation_gain}m`,
    time: `${route.estimated_hours}h`,
    minDays: route.days,
    highlight: `滑倒風險 ${route.risks.slip}、迷路風險 ${route.risks.lost}、偏離風險 ${route.risks.deviation}`,
    matchScore: risk === 'low' ? 88 : risk === 'mid' ? 74 : 58,
    matchLabel:
      risk === 'low' ? '推薦' : risk === 'mid' ? '可考慮' : '需審慎評估',
    matchBg:
      risk === 'low'
        ? 'rgba(34,197,94,0.10)'
        : risk === 'mid'
          ? 'rgba(251,146,60,0.12)'
          : 'rgba(239,68,68,0.10)',
    matchColor:
      risk === 'low'
        ? 'var(--summit-accent)'
        : risk === 'mid'
          ? 'var(--risk-mid)'
          : 'var(--risk-high)',
    reasons: [
      { icon: '📏', text: `距離 ${route.distance_km}km` },
      { icon: '⬆', text: `累積爬升 ${route.elevation_gain}m` },
      { icon: '⏱', text: `預估 ${route.estimated_hours} 小時` },
    ],
  };
}

function getRouteRecommendCacheKey(profile: ProfileForm) {
  const normalized = {
    age: Math.round(profile.age),
    weight: Math.round(profile.weight),
    level: profile.level,
    fitness: Math.round(profile.fitness),
    target_days: Math.round(profile.target_days),
  };
  return `${ROUTE_RECOMMEND_CACHE_PREFIX}${JSON.stringify(normalized)}`;
}

function readCachedRouteRecommendations(
  profile: ProfileForm,
): RouteApiResponse[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getRouteRecommendCacheKey(profile));
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedRouteRecommendation;
    if (
      !Array.isArray(cached.routes) ||
      Date.now() - cached.savedAt > ROUTE_RECOMMEND_CACHE_TTL_MS
    ) {
      window.localStorage.removeItem(getRouteRecommendCacheKey(profile));
      return null;
    }
    return cached.routes;
  } catch (_) {
    return null;
  }
}

function writeCachedRouteRecommendations(
  profile: ProfileForm,
  routes: RouteApiResponse[],
) {
  if (typeof window === 'undefined') return;
  try {
    const cached: CachedRouteRecommendation = {
      savedAt: Date.now(),
      routes,
    };
    window.localStorage.setItem(
      getRouteRecommendCacheKey(profile),
      JSON.stringify(cached),
    );
  } catch (_) {
    // localStorage 可能因隱私模式或容量限制失敗，失敗時仍維持原本 API 流程。
  }
}

async function recommendRoutesFromProfile(
  profile: ProfileForm,
  sourceMessage: string,
) {
  profileForm.value = profile;
  const cachedRoutes = readCachedRouteRecommendations(profile);
  if (cachedRoutes) {
    publishRouteRecommendations(
      cachedRoutes.map(apiRouteToRecommendedRoute),
      sourceMessage,
      profile,
    );
    return;
  }

  try {
    const { data } = await api.post<RouteApiResponse[]>(
      '/routes/recommend',
      profile,
    );
    writeCachedRouteRecommendations(profile, data);
    publishRouteRecommendations(
      data.map(apiRouteToRecommendedRoute),
      sourceMessage,
      profile,
    );
  } catch (_) {
    const localRoutes = getRecommendations(
      profileToRecommendationInput(profile),
    );
    publishRouteRecommendations(localRoutes, sourceMessage, profile);
  }
}

async function completeProfileAndRecommend(sourceMessage: string, fitness = 3) {
  const extracted = await extractProfileWithOpenAi(sourceMessage);
  if (!extracted) return false;
  if (fitness !== 3) extracted.fitness = fitness;
  await recommendRoutesFromProfile(extracted, sourceMessage);
  return true;
}

async function replyWithLocalRouteRecommendations(msg: string) {
  await sleep(650);
  typing.value = false;

  if (/裝備|清單|gear/i.test(msg) && selectedRoute.value) {
    showPlanningTools();
    messages.value.push({
      id: Date.now() + 1,
      role: 'bot',
      type: 'text',
      text: '我已把出發前檢查區打開。先確認登山鞋、雨衣、頭燈、保暖層、水與離線地圖；如果要快速檢查裝備，可以點下面的 AI 裝備辨識。',
      time: nowTime(),
    });
    quickReplies.value = [
      { label: '查詢明日天氣', action: 'weather' },
      { label: '推薦路線', action: 'plan' },
    ];
    return;
  }

  const combinedText = `${historyContext.value}\n${msg}`.trim();
  const profile = fallbackProfileFromText(
    combinedText,
    /體能|分析|GPX|紀錄/i.test(msg) || historyContext.value ? 3 : undefined,
  );
  const routes = getRecommendations(profileToRecommendationInput(profile));

  messages.value.push({
    id: Date.now() + 1,
    role: 'bot',
    type: 'text',
    text: '開發模式先用假資料完成需求統整，以下是依目前對話推估出的推薦路線。',
    time: nowTime(),
  });
  publishRouteRecommendations(routes, combinedText, profile);
}

async function replyWithMockAi(msg: string) {
  await sleep(650);
  typing.value = false;

  if (/裝備|清單|gear/i.test(msg)) {
    if (!selectedRoute.value) {
      const routes = getRecommendations(
        profileToRecommendationInput(fallbackProfileFromText(msg, 2)),
      );
      messages.value.push({
        id: Date.now() + 1,
        role: 'bot',
        type: 'text',
        text: '我會先幫你整理路線需求。選定路線後，才會展開對應的裝備清單、AI 裝備辨識與明日天氣。',
        time: nowTime(),
      });
      setTimeout(() => publishRouteRecommendations(routes, msg), 500);
      return;
    }
    showPlanningTools();
    messages.value.push({
      id: Date.now() + 1,
      role: 'bot',
      type: 'text',
      text: '我已把出發前檢查區打開。先確認登山鞋、雨衣、頭燈、保暖層、水與離線地圖；如果要快速檢查裝備，可以點下面的 AI 裝備辨識。',
      time: nowTime(),
    });
    quickReplies.value = [
      { label: '查詢明日天氣', action: 'weather' },
      { label: '推薦路線', action: 'plan' },
    ];
    return;
  }

  if (/體能|分析|GPX|紀錄/i.test(msg) || historyContext.value) {
    const routes = getRecommendations(
      profileToRecommendationInput(
        fallbackProfileFromText(`${historyContext.value}\n${msg}`, 3),
      ),
    );
    messages.value.push({
      id: Date.now() + 1,
      role: 'bot',
      type: 'text',
      text: '我先用示範體能資料幫你估算：目前適合 1 日、低到中風險、爬升不要太連續的路線。接下來可以看推薦路線與出發前檢查。',
      time: nowTime(),
    });
    setTimeout(() => publishRouteRecommendations(routes, msg), 500);
    return;
  }

  let replyText =
    '我收到你的訊息了。可以再補充這次想走的地區、天數或體力狀況，我會依照你的回答慢慢整理規劃。';
  let ready = false;
  let extractedProfile: Record<string, unknown> | null | undefined = null;
  try {
    const { data } = await api.post<{
      reply: string;
      ready: boolean;
      extracted_profile?: Record<string, unknown> | null;
    }>('/chat', {
      messages: buildChatRequestMessages(),
      history_context: historyContext.value,
    });
    replyText = data.reply;
    ready = data.ready;
    extractedProfile = data.extracted_profile;
  } catch (_) {
    // 後端暫時不可用時保留自然回覆，不再固定要求同一組欄位。
  }

  messages.value.push({
    id: Date.now() + 1,
    role: 'bot',
    type: 'text',
    text: replyText,
    time: nowTime(),
  });

  if (ready && extractedProfile) {
    const combinedText = `${historyContext.value}\n${msg}`.trim();
    await recommendRoutesFromProfile(
      normalizeExtractedProfile(extractedProfile, combinedText),
      combinedText,
    );
  }
}

async function sendUserMsg(text: string, clearInput = true) {
  const msg = text.trim();
  if (!msg) return;

  messages.value.push({
    id: Date.now(),
    role: 'user',
    type: 'text',
    text: msg,
    time: nowTime(),
  });
  if (clearInput) inputText.value = '';
  quickReplies.value = [];
  typing.value = true;

  if (/sos|求救|緊急/i.test(msg)) {
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

  if (/天氣|氣象|下雨/.test(msg)) {
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

  if (shouldUseOpenAiChat.value) {
    await replyWithMockAi(msg);
  } else {
    await replyWithLocalRouteRecommendations(msg);
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
  }
}

function toRouteCard(route: RecommendedRoute): RouteCard {
  return {
    emoji: route.emoji,
    name: route.name,
    region: route.region,
    difficulty: routeDifficulty(route),
    distance: route.distance,
    elevation: route.elevation,
    time: route.time,
    days: `${route.minDays}天`,
    highlight: route.highlight,
    source: route,
  };
}

function routeDifficulty(route: RecommendedRoute): 'easy' | 'medium' | 'hard' {
  return route.risk === 'low'
    ? 'easy'
    : route.risk === 'mid'
      ? 'medium'
      : 'hard';
}

function routeDifficultyLabel(route: RecommendedRoute) {
  return { easy: '入門', medium: '中級', hard: '進階' }[routeDifficulty(route)];
}

function selectRecommendedRoute(card: RouteCard) {
  if (!card.source) return;
  showPlanningTools();
  selectedRoute.value = card.source;
  // 執行動作，不回傳結果
  void loadRouteWeather(card.source);
  messages.value.push({
    id: Date.now(),
    role: 'bot',
    type: 'text',
    time: nowTime(),
    text: `已選擇「${card.name}」，地圖與出發按鈕已顯示在右側。`,
  });
}

function askMoreAboutRoute(card: RouteCard) {
  chatCollapsed.value = false;
  messages.value.push({
    id: Date.now(),
    role: 'user',
    type: 'text',
    text: `告訴我更多關於 ${card.name}`,
    time: nowTime(),
  });
  messages.value.push({
    id: Date.now() + 1,
    role: 'bot',
    type: 'text',
    text: `${card.name} 的重點是 ${card.highlight}。距離 ${card.distance}、爬升 ${card.elevation}，建議先確認天氣與裝備，再決定是否開始登山。`,
    time: nowTime(),
  });
}

// ── GPX / JSON Upload ────────────────────────────
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

const gpxMapTrack = computed<GpxMapTrack | null>(() => {
  if (!selectedRoute.value?.polyline.length) return null;
  const points = selectedRoute.value.polyline;
  let distanceKm = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    distanceKm += haversine(prev[0], prev[1], curr[0], curr[1]);
  }

  return {
    name: `${selectedRoute.value.name} GPX`,
    points,
    distanceKm: Number.parseFloat(selectedRoute.value.distance) || distanceKm,
    elevationGain: Number.parseFloat(selectedRoute.value.elevation),
  };
});

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

  // Reading message
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
    time: nowTime(),
    type: 'history-card',
    cardData: { ...record },
  });

  await sleep(500);

  // Progress card
  const progressEntry: Message = {
    id: Date.now() + 2,
    role: 'bot',
    time: nowTime(),
    type: 'analysis-progress',
    cardData: { progress: 0, name: record.name } as ProgressData,
  };
  messages.value.push(progressEntry);

  // Animate progress
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
      time: nowTime(),
      type: 'analysis-card',
      cardData: analyzeHistory(record),
    });
  }

  // Set history context
  historyContext.value = `使用者上傳了一筆登山紀錄：${record.name}，距離 ${record.distanceKm}km，爬升 ${record.elevationGain}m，時間 ${Math.floor(record.durationMin / 60)}小時${record.durationMin % 60}分。`;

  // 呼叫後端 GPT-4o 進行體能分析
  await sleep(500);
  typing.value = true;

  let analysisReply = '根據你的紀錄，建議選擇爬升較緩的路線作為熱身。';
  try {
    const res = await aiRouter.hikingRecord(historyContext.value);
    analysisReply = res.reply;
  } catch (_) {
    // API 未啟動時保留預設文字
  }

  typing.value = false;
  messages.value.push({
    id: Date.now() + 10,
    role: 'bot',
    type: 'text',
    text: analysisReply,
    time: nowTime(),
  });

  await recommendRoutesFromProfile(
    fallbackProfileFromText(
      historyContext.value,
      analyzeHistory(record).fitnessEstimate,
    ),
    historyContext.value,
  );
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ── Voice Overlay ────────────────────────────────
const voiceSupported = ref(false);
const voiceOverlay = ref(false);
const overlayPhase = ref<'recording' | 'sending'>('recording');
const overlayLive = ref('');
const overlayFinal = ref('');
const recordedVoiceBlob = ref<Blob | null>(null);
const voiceDraftSnapshot = ref('');
const voiceDraftCommitted = ref(false);
let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let mediaChunks: Blob[] = [];
let speechRecognition: SpeechRecognitionInstance | null = null;

onMounted(() => {
  voiceSupported.value = isVoiceInputSupported();
  scrollToBottom();
});

onBeforeUnmount(() => {
  stopVoiceCapture();
});

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return (
    speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null
  );
}

function isMediaRecorderSupported() {
  return Boolean(
    navigator.mediaDevices?.getUserMedia &&
    typeof window.MediaRecorder !== 'undefined',
  );
}

function isVoiceInputSupported() {
  return (
    isMediaRecorderSupported() || Boolean(getSpeechRecognitionConstructor())
  );
}

function getSupportedAudioMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
  ];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
}

function openVoiceOverlay() {
  voiceSupported.value = isVoiceInputSupported();
  if (!voiceSupported.value) {
    messages.value.push({
      id: Date.now(),
      role: 'bot',
      type: 'text',
      text: '目前瀏覽器不支援語音輸入，請改用文字輸入。',
      time: nowTime(),
    });
    return;
  }
  voiceDraftSnapshot.value = inputText.value;
  voiceDraftCommitted.value = false;
  overlayFinal.value = '';
  overlayLive.value = '';
  recordedVoiceBlob.value = null;
  overlayPhase.value = 'recording';
  voiceOverlay.value = true;
  void startOverlayRecording();
}

async function startOverlayRecording() {
  if (mediaRecorder?.state === 'recording') return;
  if (!isMediaRecorderSupported()) {
    startSpeechRecognitionFallback();
    return;
  }
  mediaChunks = [];
  overlayLive.value = '錄音中，停止後會送至 Whisper 轉文字。';
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getSupportedAudioMimeType();
    mediaRecorder = new MediaRecorder(
      mediaStream,
      mimeType ? { mimeType } : undefined,
    );
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) mediaChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
      recordedVoiceBlob.value = new Blob(mediaChunks, {
        type: mediaRecorder?.mimeType || 'audio/webm',
      });
      mediaStream?.getTracks().forEach((track) => track.stop());
      mediaStream = null;
      overlayLive.value = '';
      overlayPhase.value = 'sending';
      if (recordedVoiceBlob.value) {
        void processVoiceBlob(recordedVoiceBlob.value);
      }
    };
    mediaRecorder.start();
  } catch (e) {
    console.warn('MediaRecorder error:', e);
    overlayLive.value = '';
    overlayFinal.value = '無法啟用麥克風，請確認瀏覽器權限。';
    overlayPhase.value = 'sending';
  }
}

function startSpeechRecognitionFallback() {
  const SpeechRecognition = getSpeechRecognitionConstructor();
  if (!SpeechRecognition) {
    overlayLive.value = '';
    overlayFinal.value = '目前瀏覽器不支援語音輸入，請改用文字輸入。';
    overlayPhase.value = 'sending';
    return;
  }

  speechRecognition = new SpeechRecognition();
  speechRecognition.lang = 'zh-TW';
  speechRecognition.continuous = true;
  speechRecognition.interimResults = true;
  overlayLive.value = '語音辨識中，文字會直接填入輸入框。';
  speechRecognition.onresult = (event) => {
    let finalText = '';
    let interimText = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i]?.[0]?.transcript ?? '';
      if (event.results[i]?.isFinal) finalText += transcript;
      else interimText += transcript;
    }
    if (finalText) overlayFinal.value += finalText;
    overlayLive.value = interimText;
    inputText.value = composeVoiceDraft(
      `${overlayFinal.value}${overlayLive.value}`,
    );
    voiceDraftCommitted.value = true;
  };
  speechRecognition.onerror = () => {
    overlayLive.value = '';
    if (!overlayFinal.value.trim()) {
      overlayFinal.value = '無法啟用語音辨識，請確認瀏覽器權限。';
    }
    overlayPhase.value = 'sending';
  };
  speechRecognition.onend = () => {
    overlayLive.value = '';
    overlayPhase.value = 'sending';
  };
  try {
    speechRecognition.start();
  } catch (_) {
    overlayLive.value = '';
    overlayFinal.value = '無法啟用語音辨識，請確認瀏覽器權限。';
    overlayPhase.value = 'sending';
  }
}

function stopOverlayRecording() {
  if (mediaRecorder?.state === 'recording') {
    mediaRecorder.stop();
  } else if (speechRecognition) {
    speechRecognition.stop();
  } else {
    overlayPhase.value = 'sending';
  }
}

function composeVoiceDraft(transcript: string) {
  const prefix = voiceDraftSnapshot.value.trim();
  const content = transcript.trim();
  if (!prefix) return content;
  if (!content) return prefix;
  return `${prefix} ${content}`.trim();
}

async function processVoiceBlob(blob: Blob) {
  messages.value.push({
    id: Date.now(),
    role: 'user',
    type: 'text',
    text: '已送出語音輸入',
    time: nowTime(),
  });
  typing.value = true;
  try {
    const res = await aiRouter.voice(blob, 'voice.webm');
    typing.value = false;
    if (res.transcribed_text) {
      overlayFinal.value = res.transcribed_text;
      inputText.value = composeVoiceDraft(res.transcribed_text);
      voiceDraftCommitted.value = true;
      messages.value.push({
        id: Date.now() + 1,
        role: 'bot',
        type: 'text',
        text: `Whisper 轉文字：${res.transcribed_text}`,
        time: nowTime(),
      });
    }
    messages.value.push({
      id: Date.now() + 2,
      role: 'bot',
      type: 'text',
      text: `${res.reply}\n\n模型路由：${res.model_used}`,
      time: nowTime(),
    });
    await completeProfileAndRecommend(res.transcribed_text || res.reply);
    closeVoiceOverlay();
  } catch (_) {
    typing.value = false;
    messages.value.push({
      id: Date.now() + 3,
      role: 'bot',
      type: 'text',
      text: '語音分析暫時無法使用，請改用文字輸入描述需求。',
      time: nowTime(),
    });
  }
}

function closeVoiceOverlay() {
  stopVoiceCapture();
  if (!voiceDraftCommitted.value) {
    inputText.value = voiceDraftSnapshot.value;
  }
  voiceOverlay.value = false;
}

function stopVoiceCapture() {
  speechRecognition?.stop();
  speechRecognition = null;
  if (mediaRecorder?.state === 'recording') {
    mediaRecorder.stop();
  }
  mediaStream?.getTracks().forEach((track) => track.stop());
  mediaStream = null;
}

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

function scrollToBottom() {
  nextTick(() => msgEndEl.value?.scrollIntoView({ behavior: 'smooth' }));
}

watch(messages, scrollToBottom, { deep: true });
watch(typing, scrollToBottom);

// ── Gear & route state ───────────────────────────
const gear = reactive<Record<string, boolean>>({});
const gearItems = ref<GearItem[]>([]);
const newGearLabel = ref('');
const gearAssessment = ref<GearAssessment | null>(null);
const gearAssessing = ref(false);
const gearScoreCircumference = 2 * Math.PI * 40;
const gearScoreDashOffset = computed(() =>
  gearAssessment.value
    ? gearScoreCircumference * (1 - gearAssessment.value.score / 100)
    : gearScoreCircumference,
);
const gearCount = computed(
  () => gearItems.value.filter((item) => gear[item.id]).length,
);

function normalizeGearId(label: string) {
  return `custom-${label.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
}

function addGearItem(item: GearItem, checked = false) {
  const existing = gearItems.value.find(
    (g) => g.id === item.id || g.label === item.label,
  );
  if (!existing) {
    gearItems.value.push(item);
  }
  if (checked) {
    gear[existing?.id ?? item.id] = true;
  }
  gearAssessment.value = null;
}

function addCustomGear() {
  const label = newGearLabel.value.trim();
  if (!label) return;
  addGearItem({ id: normalizeGearId(label), label, icon: '🎒' });
  newGearLabel.value = '';
}

function removeGear(id: string) {
  gearItems.value = gearItems.value.filter((item) => item.id !== id);
  delete gear[id];
  gearAssessment.value = null;
}

async function assessGearList() {
  if (gearAssessing.value || gearItems.value.length === 0) return;
  gearAssessing.value = true;
  try {
    const { data } = await api.post<GearAssessResponse>('/gear/assess', {
      items: gearItems.value.map((item) => ({
        id: item.id,
        label: item.label,
        checked: Boolean(gear[item.id]),
      })),
      route: selectedRoute.value
        ? {
            name: selectedRoute.value.name,
            risk: selectedRoute.value.risk,
            difficulty: routeDifficulty(selectedRoute.value),
            days: selectedRoute.value.minDays,
          }
        : null,
    });
    gearAssessment.value = {
      score: data.score,
      level: data.level,
      summary: data.summary,
      tips: data.tips,
    };
  } catch (_) {
    assessGearListWithFallback();
  } finally {
    gearAssessing.value = false;
  }
}

function assessGearListWithFallback() {
  const checkedItems = gearItems.value.filter((item) => gear[item.id]);
  const uncheckedItems = gearItems.value.filter((item) => !gear[item.id]);
  const checkedRatio = gearItems.value.length
    ? gearCount.value / gearItems.value.length
    : 0;
  const riskPenalty =
    selectedRoute.value?.risk === 'high'
      ? 15
      : selectedRoute.value?.risk === 'mid'
        ? 8
        : 0;
  const daysPenalty = (selectedRoute.value?.minDays ?? 1) >= 2 ? 8 : 0;
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(checkedRatio * 70) + 20 - riskPenalty - daysPenalty,
    ),
  );
  const level =
    score >= 85
      ? '準備充足'
      : score >= 65
        ? '基本可出發'
        : score >= 40
          ? '需要補強'
          : '不建議出發';
  const tips = [
    uncheckedItems.length
      ? `尚未確認：${uncheckedItems
          .slice(0, 4)
          .map((item) => item.label)
          .join('、')}。`
      : '清單內裝備皆已勾選確認。',
    selectedRoute.value?.risk === 'high'
      ? '高風險路線請額外確認保暖、雨具、離線地圖與緊急通訊。'
      : 'OpenAI 暫時不可用，請依路線天數、天氣與個人狀態再次檢查裝備。',
  ];

  gearAssessment.value = {
    score,
    level,
    summary: `目前 ${checkedItems.length}/${gearItems.value.length} 項已確認。OpenAI 暫時不可用，這是保守 fallback 評估。`,
    tips,
  };
}

const selectedRoute = ref<RecommendedRoute | null>(null);

// ── YOLO scanner ──────────────────────────────────
const scanning = ref(false);
const scanned = ref(false);
const yoloItems = ref<Array<{ label: string; conf: string }>>([]);
const gearPhotoInput = ref<HTMLInputElement>();
const lastDetectedGearIds = ref<Set<string>>(new Set());

const GEAR_LABEL_TO_ID: Record<string, string> = {
  登山鞋: 'boots',
  登山靴: 'boots',
  登山杖: 'poles',
  頭燈: 'headlamp',
  手電筒: 'headlamp',
  雨衣: 'rain',
  防水外套: 'rain',
  保暖層: 'warm',
  羽絨衣: 'warm',
  急救包: 'firstaid',
  水壺: 'water',
  水瓶: 'water',
  地圖: 'map',
  指南針: 'map',
  行動糧: 'food',
  糧食: 'food',
};

function gearItemFromDetectedLabel(label: string): GearItem {
  const knownId = GEAR_LABEL_TO_ID[label];
  const known = knownId ? GEAR_ITEMS.find((item) => item.id === knownId) : null;
  return known ?? { id: normalizeGearId(label), label, icon: '🎒' };
}

function doScan() {
  if (scanning.value) return;
  gearPhotoInput.value?.click();
}

function resetGearScan() {
  if (scanning.value) return;
  removeLastDetectedGearItems();
  scanned.value = false;
  yoloItems.value = [];
  gearPhotoInput.value?.click();
}

function removeLastDetectedGearItems() {
  if (lastDetectedGearIds.value.size === 0) return;
  gearItems.value = gearItems.value.filter((item) => {
    const shouldRemove = lastDetectedGearIds.value.has(item.id);
    if (shouldRemove) {
      delete gear[item.id];
    }
    return !shouldRemove;
  });
  lastDetectedGearIds.value = new Set();
  gearAssessment.value = null;
}

function addDetectedGearItem(item: GearItem) {
  const existed = gearItems.value.some(
    (gearItem) => gearItem.id === item.id || gearItem.label === item.label,
  );
  addGearItem(item, true);
  if (!existed) {
    lastDetectedGearIds.value.add(item.id);
  }
}

async function onGearPhotoSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || scanning.value) return;

  scanning.value = true;
  scanned.value = false;
  try {
    const form = new FormData();
    form.append('image', file);
    const { data } = await api.post<GearDetectResponse>('/gear/detect', form, {
      timeout: 30000,
    });

    const detectedItems = data.items.filter((item) => item.detected);
    detectedItems.forEach((item) => {
      addDetectedGearItem(gearItemFromDetectedLabel(item.name));
    });
    yoloItems.value = detectedItems.map((item) => ({
      label: item.name,
      conf: `${Math.round(item.confidence * 100)}%`,
    }));
    if (yoloItems.value.length === 0) {
      yoloItems.value = [{ label: '未偵測到裝備', conf: '' }];
    }
  } catch (_) {
    const fallbackLabels = ['登山鞋', '登山杖', '頭燈', '雨衣'];
    fallbackLabels.forEach((label) => {
      addDetectedGearItem(gearItemFromDetectedLabel(label));
    });
    yoloItems.value = fallbackLabels.map((label, index) => ({
      label,
      conf: `${[97, 93, 89, 84][index]}%`,
    }));
  } finally {
    scanning.value = false;
    scanned.value = true;
  }
}

// ── Static data ───────────────────────────────────
const contacts = [
  { emoji: '👨', name: '王大明（父）', rel: '家人 · 追蹤中' },
  { emoji: '👩', name: '李小雯（友）', rel: '好友 · 已告知行程' },
];

const weatherData = [
  { icon: '⛅', temp: '12°C', label: '早晨' },
  { icon: '☀', temp: '18°C', label: '中午' },
  { icon: '🌧', temp: '9°C', label: '下午' },
];

const weatherAdviceMock = {
  low: '天氣穩定，適合出發。建議早點上山，午後仍要預留雲霧與驟雨變化的彈性。',
  mid: '建議清晨出發、午前完成主要路段。午後天氣較不穩，雨具與保暖層要帶齊。',
  high: '風險偏高，建議延後或縮短行程。若仍要前往，務必保留折返時間並密切注意天候。',
} as const;

function buildMockRouteWeather(route: RecommendedRoute): RouteWeatherResponse {
  const riskKey =
    route.risk === 'low' ? 'low' : route.risk === 'mid' ? 'mid' : 'high';
  const periods =
    riskKey === 'high'
      ? [
          {
            icon: '⛅',
            temp: '9°C',
            label: '早晨',
            condition: '雲量偏多',
            rain_probability: '30%',
          },
          {
            icon: '🌧',
            temp: '12°C',
            label: '中午',
            condition: '午後轉雨',
            rain_probability: '70%',
          },
          {
            icon: '⛈',
            temp: '8°C',
            label: '下午',
            condition: '雷陣雨',
            rain_probability: '85%',
          },
        ]
      : riskKey === 'mid'
        ? [
            {
              icon: '⛅',
              temp: '11°C',
              label: '早晨',
              condition: '多雲',
              rain_probability: '20%',
            },
            {
              icon: '☀',
              temp: '16°C',
              label: '中午',
              condition: '晴時多雲',
              rain_probability: '35%',
            },
            {
              icon: '🌧',
              temp: '10°C',
              label: '下午',
              condition: '午後陣雨',
              rain_probability: '65%',
            },
          ]
        : [
            {
              icon: '⛅',
              temp: '13°C',
              label: '早晨',
              condition: '多雲',
              rain_probability: '15%',
            },
            {
              icon: '☀',
              temp: '18°C',
              label: '中午',
              condition: '晴時多雲',
              rain_probability: '20%',
            },
            {
              icon: '⛅',
              temp: '14°C',
              label: '下午',
              condition: '局部短暫雨',
              rain_probability: '40%',
            },
          ];

  return {
    location_name: `${route.region} · ${route.name}`,
    periods,
    advice: weatherAdviceMock[riskKey],
    source: '本地假資料',
    model_used: 'mock',
    fallback: true,
  };
}

const weather = [
  { icon: '⛅', temp: '12°C', label: '早晨', condition: '多雲' },
  { icon: '☀', temp: '18°C', label: '中午', condition: '晴時多雲' },
  { icon: '🌧', temp: '9°C', label: '下午', condition: '午後陣雨' },
];

const routeWeather = ref<RouteWeatherResponse | null>(null);
const weatherLoading = ref(false);
const offlinePackageDownloading = ref(false);
const displayedWeather = computed<WeatherPeriod[]>(() =>
  routeWeather.value?.periods?.length ? routeWeather.value.periods : weather,
);
const weatherAdvice = computed(
  () =>
    routeWeather.value?.advice ??
    '建議 13:00 前下山，午後雷陣雨機率偏高。請攜帶雨具與保暖層，若山區雲霧變厚應提前折返。',
);
const weatherAiStatusLabel = computed(() => {
  if (weatherMode.value === 'mock') return '本地假資料';
  if (weatherLoading.value) return 'OpenAI 檢查中...';
  if (!routeWeather.value) return 'OpenAI 未回應';
  if (
    routeWeather.value.fallback ||
    routeWeather.value.model_used === 'fallback'
  ) {
    return 'OpenAI 失敗，已切回假資料';
  }
  if (
    routeWeather.value.model_used &&
    routeWeather.value.model_used !== 'mock'
  ) {
    return 'OpenAI 成功';
  }
  return 'OpenAI 狀態未確認';
});
const weatherAiStatusClass = computed(() => ({
  success:
    weatherMode.value === 'openai' &&
    !!routeWeather.value &&
    !routeWeather.value.fallback &&
    routeWeather.value.model_used !== 'fallback' &&
    routeWeather.value.model_used !== 'mock',
  warning:
    weatherMode.value === 'openai' &&
    (!routeWeather.value ||
      routeWeather.value.fallback ||
      routeWeather.value.model_used === 'fallback' ||
      routeWeather.value.model_used === 'mock'),
  mock: weatherMode.value === 'mock',
}));

async function loadRouteWeather(route: RecommendedRoute) {
  weatherLoading.value = true;
  routeWeather.value = null;
  try {
    if (!shouldUseOpenAiWeather.value) {
      routeWeather.value = buildMockRouteWeather(route);
      return;
    }
    const { data } = await api.post<RouteWeatherResponse>('/weather/forecast', {
      route_name: route.name,
      location: route.region,
      risk: route.risk,
      difficulty: routeDifficulty(route),
      days: route.minDays,
    });
    routeWeather.value = data;
  } catch (_) {
    routeWeather.value = buildMockRouteWeather(route);
  } finally {
    weatherLoading.value = false;
  }
}

function toggleWeatherMode() {
  weatherMode.value = weatherMode.value === 'mock' ? 'openai' : 'mock';
  if (selectedRoute.value) {
    void loadRouteWeather(selectedRoute.value);
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildGpxXml(route: RecommendedRoute) {
  const trackPoints = route.polyline
    .map(
      ([lat, lon], index) => `
        <trkpt lat="${lat}" lon="${lon}">
          <name>${escapeXml(route.name)}-${index + 1}</name>
        </trkpt>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="KaoShan" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(route.name)} GPX</name>
    <desc>${escapeXml(route.highlight)}</desc>
  </metadata>
  <trk>
    <name>${escapeXml(route.name)} GPX</name>
    <trkseg>${trackPoints}
    </trkseg>
  </trk>
  </gpx>`;
}

function encodePdfUcs2(text: string) {
  let hex = 'FEFF';
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code <= 0xffff) {
      hex += code.toString(16).padStart(4, '0').toUpperCase();
    } else {
      const cp = code - 0x10000;
      const high = 0xd800 + ((cp >> 10) & 0x3ff);
      const low = 0xdc00 + (cp & 0x3ff);
      hex += high.toString(16).padStart(4, '0').toUpperCase();
      hex += low.toString(16).padStart(4, '0').toUpperCase();
    }
  }
  return hex;
}

function buildOfflinePackagePdf(
  route: RecommendedRoute,
  payload: {
    meta: OfflinePackageMeta | null;
    route: Record<string, unknown>;
    gpx: { file_name: string; format: string; xml: string };
    gear: {
      items: Array<{
        id: string;
        label: string;
        checked: boolean;
        source: string;
      }>;
      assessment: GearAssessment | null;
    };
    ai_risk_assessment: Record<string, unknown>;
    emergency: {
      contacts: Array<{ name: string; rel: string }>;
      numbers: string[];
      reminder: string;
    };
    created_at: string;
  },
) {
  const routeLines = [
    'KaoShan 離線下載包',
    '',
    `路線：${route.name}`,
    `地區：${route.region}`,
    `時間：${route.time}`,
    `距離：${route.distance}`,
    `坡度：${route.minSlope} 級`,
    `難度：${routeDifficultyLabel(route)}`,
    `風險：${route.risk}`,
    '',
    '包含內容',
    '1. 路線資料',
    '2. 路線 GPX 軌跡',
    '3. 裝備清單',
    '4. AI 風險評估',
    '5. 緊急求救資料',
    '',
    `AI 建議：${String((payload.ai_risk_assessment as { weather_advice?: string }).weather_advice ?? '')}`,
    '',
    `緊急電話：${payload.emergency.numbers.join(' / ')}`,
    `建立時間：${payload.created_at}`,
  ];

  const body = routeLines
    .map((line) => `<${encodePdfUcs2(line)}> Tj`)
    .map((line, index) => (index === 0 ? `${line}` : `0 -20 Td\n${line}`))
    .join('\n');

  const contentStream = `BT\n/F1 12 Tf\n50 790 Td\n${body}\nET`;
  const contentLength = contentStream.length;

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj',
    '4 0 obj\n<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [6 0 R] >>\nendobj',
    `5 0 obj\n<< /Length ${contentLength} >>\nstream\n${contentStream}\nendstream\nendobj`,
    '6 0 obj\n<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light /CIDSystemInfo << /Registry (Adobe) /Ordering (GB1) /Supplement 0 >> >>\nendobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += `${obj}\n`;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${offsets[i]!.toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

async function downloadOfflinePackage() {
  if (!selectedRoute.value) return;
  offlinePackageDownloading.value = true;
  try {
    const userId = auth.profile?.userId ?? 'guest';
    let meta: OfflinePackageMeta | null = null;

    try {
      const { data } = await api.post<OfflinePackageMeta>('/offline/package', {
        route_id: selectedRoute.value.id,
        user_id: userId,
      });
      meta = data;
    } catch (_) {
      meta = null;
    }

    const gpxXml = buildGpxXml(selectedRoute.value);
    const routeData = {
      id: selectedRoute.value.id,
      name: selectedRoute.value.name,
      region: selectedRoute.value.region,
      distance: selectedRoute.value.distance,
      elevation: selectedRoute.value.elevation,
      time: selectedRoute.value.time,
      difficulty: routeDifficulty(selectedRoute.value),
      risk: selectedRoute.value.risk,
      min_days: selectedRoute.value.minDays,
      min_fitness: selectedRoute.value.minFitness,
      min_experience: selectedRoute.value.minExp,
      min_slope: selectedRoute.value.minSlope,
      highlight: selectedRoute.value.highlight,
    };
    const gearList = gearItems.value.map((item) => ({
      id: item.id,
      label: item.label,
      checked: Boolean(gear[item.id]),
      source: lastDetectedGearIds.value.has(item.id) ? 'ai-detect' : 'manual',
    }));
    const packagePayload = {
      meta,
      route: routeData,
      gpx: {
        file_name: `${selectedRoute.value.id}.gpx`,
        format: 'GPX 1.1',
        xml: gpxXml,
      },
      gear: {
        items: gearList,
        assessment: gearAssessment.value,
      },
      ai_risk_assessment: {
        weather_advice: weatherAdvice.value,
        weather_source: routeWeather.value?.source ?? '本機快取',
        route_weather: routeWeather.value,
        route_risk: selectedRoute.value.risk,
        difficulty: routeDifficulty(selectedRoute.value),
      },
      emergency: {
        contacts,
        numbers: ['119', '110', '112'],
        reminder:
          '離線狀態請優先報平安、保留電量、回到可通訊位置後再送出位置。',
      },
      created_at: new Date().toISOString(),
    };

    const pdfBlob = buildOfflinePackagePdf(selectedRoute.value, packagePayload);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kaoshan-offline-${selectedRoute.value.id}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  } finally {
    offlinePackageDownloading.value = false;
  }
}
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

/* Wave bars */
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

/* Live text area */
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

/* Buttons */
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

/* Confirm phase */
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

/* ── Input bar icon buttons ── */
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  flex-shrink: 0;
  transition: background 0.15s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* ── Chat card type bubbles ── */
.chat-history-card {
  padding: 10px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
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
  padding: 10px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  border-bottom-left-radius: 4px;
  min-width: 180px;
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
  padding: 10px 12px;
  background: rgba(6, 199, 85, 0.08);
  border: 1px solid rgba(6, 199, 85, 0.3);
  border-radius: 12px;
  border-bottom-left-radius: 4px;
  min-width: 200px;
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
  background: rgba(255, 255, 255, 0.25);
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
  letter-spacing: 0.06rem;
}

.line-chat-status {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.82);
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
  max-height: clamp(280px, 42vh, 460px);
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
  max-width: 340px;
  padding: 7px 10px;
  border-radius: 12px;
  font-size: 1rem;
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

.line-typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}
.line-typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-5px);
  }
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

/* ── Chat Input Zone ── */
.chat-input-zone {
  border-top: 1px solid var(--border);
  background: var(--bg-card);
  padding: 8px 12px 12px;
}

.input-method-hints {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.method-hint {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.68rem;
  color: var(--text-muted);
  font-weight: 500;
}

.method-sep {
  font-size: 0.68rem;
  color: var(--border);
}

.chat-input-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 📎 Upload pill */
.upload-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  cursor: pointer;
  font-size: 0.72rem;
  color: var(--text-secondary);
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
  transition:
    border-color 0.15s,
    color 0.15s;
}

.upload-pill:hover {
  border-color: #06c755;
  color: #06c755;
}

.upload-pill-label {
  font-size: 0.7rem;
}

/* Text input */
.chat-text-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.8rem;
  font-family: inherit;
  outline: none;
  min-width: 0;
  transition: border-color 0.15s;
}

.chat-text-input:focus {
  border-color: #06c755;
}

.chat-text-input::placeholder {
  color: var(--text-muted);
  font-size: 0.75rem;
}

/* 🎤 Voice primary button */
.voice-primary-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #06c755;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    opacity 0.15s,
    transform 0.15s;
  box-shadow: 0 2px 8px rgba(6, 199, 85, 0.4);
}

.voice-primary-btn:hover {
  opacity: 0.88;
  transform: scale(1.06);
}

/* ↑ Send button */
.send-primary-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #06c755;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}

.send-primary-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.send-primary-btn:not(:disabled):hover {
  opacity: 0.88;
}

/* ── Chat Route Card ── */
.chat-route-card {
  padding: 10px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  border-bottom-left-radius: 4px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  min-width: 220px;
}

.chat-route-card:hover {
  border-color: #06c755;
  box-shadow: 0 2px 8px rgba(6, 199, 85, 0.15);
}

.chat-route-selected {
  border-color: #06c755 !important;
  background: rgba(6, 199, 85, 0.06);
}

.chat-route-top {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.chat-route-name {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 0.06rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-route-region {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.chat-route-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.chat-route-highlight {
  font-size: 0.72rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 8px;
}

.chat-route-select-btn {
  font-size: 0.72rem;
  font-weight: 700;
  color: #06c755;
  padding-top: 6px;
  border-top: 1px solid var(--border);
}

/* ── Embedded LINE Page ── */
.pre-line-panel {
  display: flex;
  flex-direction: column;
  min-height: clamp(520px, 72vh, 760px);
  max-height: 82vh;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: 16px;
}

.line-panel-collapsed {
  min-height: auto;
  max-height: none;
}

.chat-collapsed-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: var(--bg-surface);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.chat-collapsed-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 0.06rem;
}

.chat-collapsed-sub {
  margin-top: 2px;
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.chat-expand-btn {
  flex-shrink: 0;
  padding: 6px 10px;
  border: 1px solid #06c755;
  border-radius: 16px;
  background: transparent;
  color: #06c755;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
}

.chat-collapse-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 6px 10px;
  border: 1px solid var(--text-gray-light);
  border-radius: 16px;
  background: transparent;
  color: var(--text-gray-light);
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background 0.15s ease;
}

.chat-collapse-btn:hover {
  border-color: #06c755;
  background: rgba(6, 199, 85, 0.08);
}

.chat-collapse-btn .material-icons {
  font-size: 16px;
}

.recommendation-reroll-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 6px 10px;
  border: 1px solid var(--bg-orange);
  border-radius: 16px;
  background: var(--bg-orange);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background 0.15s ease,
    opacity 0.15s ease;
}

.recommendation-reroll-btn:hover:not(:disabled) {
  background: rgba(217, 119, 7, 0.6);
}

.recommendation-reroll-btn:disabled {
  opacity: 0.55;
  cursor: wait;
}

.recommendation-reroll-btn .material-icons {
  font-size: 16px;
}

.recommendation-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.gear-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  gap: 12px;
}

.section-label-compact {
  margin-bottom: 0;
}

.gear-count {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
}

.gear-count-ok {
  color: var(--risk-low);
}

.gear-label {
  font-size: 1rem;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: 0.06rem;
}

.weather-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.weather-section-title {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.weather-location {
  margin-left: 8px;
  opacity: 0.72;
}

.weather-loading {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.weather-advice-box {
  margin-top: 10px;
  padding: 8px 10px;
  background: rgba(251, 146, 60, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(251, 146, 60, 0.25);
  font-size: 0.78rem;
  color: var(--risk-mid);
  font-weight: 600;
}

.weather-source {
  margin-top: 6px;
  font-size: 0.66rem;
  color: var(--text-muted);
}

.weather-ai-status {
  display: inline-flex;
  align-items: center;
  margin-top: 8px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
}

.weather-ai-status.success {
  background: rgba(22, 163, 74, 0.14);
  color: #16a34a;
}

.weather-ai-status.warning {
  background: rgba(217, 119, 6, 0.14);
  color: #d97706;
}

.weather-ai-status.mock {
  background: rgba(107, 114, 128, 0.14);
  color: #6b7280;
}

.weather-mode-toggle {
  font-size: 0.72rem;
  flex-shrink: 0;
}

.p1-map-layer {
  position: absolute;
  inset: 0;
}

.demand-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.demand-item {
  padding: 9px 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg-surface);
}

.demand-item span {
  display: block;
  margin-bottom: 3px;
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 700;
}

.demand-item strong {
  display: block;
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.35;
}

[data-theme='light'] .demand-item strong {
  display: block;
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.35;
}

.demand-note {
  padding: 9px 10px;
  border-radius: 12px;
  background: rgba(6, 199, 85, 0.08);
  border: 1px solid rgba(6, 199, 85, 0.22);
  color: var(--text-secondary);
  font-size: 0.76rem;
  line-height: 1.55;
}

.recommendation-label {
  margin-top: 8px;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.route-card-full {
  max-width: none;
  position: relative;
  display: block;
  padding: 16px;
  border: 1px solid rgba(6, 199, 85, 0.18);
  border-radius: 16px;
  border-bottom-left-radius: 16px;
  background:
    linear-gradient(135deg, rgba(6, 199, 85, 0.08), rgba(200, 144, 42, 0.055)),
    var(--bg-card);
  box-shadow:
    0 10px 28px rgba(4, 16, 28, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.08) inset;
  overflow: hidden;
  transition:
    transform 0.2s var(--ease-out),
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.route-card-full::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: linear-gradient(180deg, #06c755, #c8902a);
}

.route-card-full::after {
  content: '';
  position: absolute;
  top: -48px;
  right: -48px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(6, 199, 85, 0.08);
  pointer-events: none;
}

.route-card-full:hover {
  transform: translateY(-2px);
  border-color: rgba(6, 199, 85, 0.42);
  box-shadow:
    0 16px 38px rgba(4, 16, 28, 0.14),
    0 0 0 3px rgba(6, 199, 85, 0.08);
}

.route-card-full.route-card-selected {
  border-color: #06c755;
  background:
    linear-gradient(135deg, rgba(6, 199, 85, 0.14), rgba(6, 199, 85, 0.055)),
    var(--bg-card);
  box-shadow:
    0 16px 40px rgba(6, 199, 85, 0.16),
    0 0 0 3px rgba(6, 199, 85, 0.12);
}

.route-card-full .route-card-top {
  position: relative;
  z-index: 1;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.route-card-full .route-emoji {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 199, 85, 0.12);
  border: 1px solid rgba(6, 199, 85, 0.18);
  font-size: 23px;
  box-shadow: 0 6px 16px rgba(6, 199, 85, 0.1);
}

.route-card-full .route-card-name {
  font-size: 1rem;
  line-height: 1.25;
}

.route-card-full .route-card-region {
  margin-top: 3px;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-muted);
}

.route-card-full .route-diff-badge {
  position: relative;
  z-index: 1;
  padding: 4px 9px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.route-card-full .route-card-meta {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 7px;
  margin-bottom: 10px;
}

.route-card-full .route-card-meta .route-card-meta-item {
  min-width: 0;
  padding: 7px 8px;
  border-radius: 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  text-align: center;
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--text-secondary);
}

.route-card-full .route-card-meta .route-card-meta-title {
  display: block;
  margin-bottom: 3px;
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 0.06rem;
}

.route-card-full .route-card-meta .route-card-meta-data {
  display: block;
  margin-bottom: 3px;
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-green-light);
  letter-spacing: 0.06rem;
}

.route-card-full .route-card-highlight {
  position: relative;
  z-index: 1;
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.42);
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
}

[data-theme='dark'] .route-card-full .route-card-highlight {
  background: rgba(255, 255, 255, 0.055);
  border-color: rgba(255, 255, 255, 0.08);
}

.route-card-full .route-card-actions {
  position: relative;
  z-index: 1;
  gap: 8px;
}

.route-card-full .route-action-btn {
  min-height: 38px;
  border-radius: 10px;
}

.route-card-full .route-action-ghost {
  box-shadow: none;
  background: var(--bg-surface) !important;
}

@media (max-width: 560px) {
  .route-card-full .route-card-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 360px) {
  .route-card-full .route-card-meta {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 768px) {
  .route-card-full .route-card-actions {
    flex-direction: row;
  }
}

.line-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--bg-green);
  flex-shrink: 0;
  box-shadow: 0 2px 12px rgba(6, 199, 85, 0.25);
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
  font-size: 20px;
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
  align-items: center;
  gap: 4px;
}

.chat-small-btn {
  height: 30px;
  min-width: 64px;
  border: 1px solid rgba(255, 255, 255, 0.34);
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0 10px;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.chat-small-btn:hover {
  background: rgba(255, 255, 255, 0.28);
}

.ai-mode-toggle {
  height: 30px;
  min-width: 64px;
  border: 1px solid rgba(255, 255, 255, 0.34);
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0 10px;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.ai-mode-toggle:hover {
  background: rgba(255, 255, 255, 0.28);
}

.ai-mode-openai {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(255, 255, 255, 0.92);
  color: #047a34;
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

.contacts-panel {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  padding: 12px 14px;
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

.msg-row {
  display: flex;
  gap: 6px;
  align-items: flex-end;
}

.msg-row.user {
  flex-direction: row-reverse;
}

.msg-bot-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-green);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
  align-self: flex-end;
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

.msg-time-user {
  text-align: right;
}

.msg-time-bot {
  text-align: left;
}

.yolo-empty-state {
  text-align: center;
  padding: 16px 0;
  pointer-events: none;
}

.yolo-empty-icon {
  font-size: 28px;
  margin-bottom: 4px;
}

.yolo-empty-copy {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.yolo-scanning-text {
  color: var(--summit-accent);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 16px;
  z-index: 1;
}

.yolo-scanned-wrap {
  padding: 10px;
  width: 100%;
}

.yolo-scanned-title {
  font-size: 0.8rem;
  color: var(--summit-accent);
  font-weight: 700;
  margin-bottom: 6px;
}

.yolo-area-scanned {
  min-height: auto;
}

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

.route-card {
  /* max-width: 280px; */
  max-width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  overflow: hidden;
  padding: 12px 12px 12px 16px;
}

.route-card-selected {
  border-color: #06c755;
  box-shadow: 0 0 0 2px rgba(6, 199, 85, 0.12);
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
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}

.diff-easy {
  background: rgba(26, 140, 85, 0.18);
  color: #16a34a;
  border: 1px solid rgba(26, 140, 85, 0.35);
}

.diff-medium {
  background: rgba(251, 146, 60, 0.18);
  color: #d97706;
  border: 1px solid rgba(251, 146, 60, 0.35);
}

.diff-hard {
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
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
  flex-direction: column;
  gap: 6px;
}

.route-action-btn {
  flex: 1;
}

.route-action-btn:hover {
  opacity: 0.85;
}

.route-action-ghost {
  background: transparent !important;
  border: 1px solid var(--border) !important;
  color: var(--text-secondary) !important;
}

.weather-card {
  max-width: 280px;
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

.weather-icon-lg {
  font-size: 22px;
  margin-bottom: 4px;
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

.offline-download-card {
  margin-top: 12px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(6, 199, 85, 0.22);
  background:
    linear-gradient(180deg, rgba(6, 199, 85, 0.08), rgba(6, 199, 85, 0.03)),
    var(--bg-card);
}

.offline-download-title {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 0.06rem;
  margin-bottom: 6px;
}

.offline-download-desc {
  font-size: 0.72rem;
  line-height: 1.55;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.offline-download-btn {
  width: 100%;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  border: 0;
  background: linear-gradient(135deg, #06c755, #1a8c55);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    filter 0.18s ease,
    opacity 0.18s ease;
}

.offline-download-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.03);
}

.offline-download-btn:disabled {
  cursor: wait;
  opacity: 0.72;
}

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
  min-width: 0;
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
  padding: 8px 14px;
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
