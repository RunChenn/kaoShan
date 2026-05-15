<template>
  <!-- 照片 Lightbox -->
  <Teleport to="body">
    <div
      v-if="gearPhotoLightbox && gearPhotoUrl"
      class="gear-photo-lightbox"
      @click="gearPhotoLightbox = false"
    >
      <img
        :src="gearPhotoUrl"
        class="gear-photo-lightbox-img"
        alt="裝備照片"
        @click.stop
      />
      <button
        class="gear-photo-lightbox-close"
        @click="gearPhotoLightbox = false"
      >
        ✕
      </button>
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
            <div class="line-bot-avatar">
              <img
                :src="logoUrl"
                alt="KaoShan logo"
                class="line-bot-avatar-image"
              />
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
              :title="
                aiChatMode === 'mock' ? '目前使用假資料' : '目前使用 Gemini'
              "
              @click="toggleAiChatMode"
            >
              {{ aiChatMode === 'mock' ? '假資料' : 'Gemini' }}
            </button>
            <button
              v-if="recommendationsVisible && !chatCollapsed"
              class="chat-small-btn chat-collapse-btn"
              title="收合"
              @click="toggleChatCollapsed"
            >
              <span class="material-icons">unfold_less</span>
              <span>收合</span>
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
            <div class="chat-collapsed-title">KaoShan 已完成需求統整</div>
            <!-- <div class="chat-collapsed-sub">
              {{ demandSummary.goal }} · {{ demandSummary.elevation }} ·
              {{ demandSummary.fitness }} · {{ demandSummary.risk }}
            </div> -->
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
              <div class="msg-bot-icon">
                <img
                  :src="logoUrl"
                  alt="KaoShan logo"
                  class="msg-bot-icon-image"
                />
              </div>
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
                  <!-- <span
                    :class="[
                      'route-source-badge',
                      cardOf(m).routeKind === 'peak'
                        ? 'source-peak'
                        : 'source-trail',
                    ]"
                  >
                    {{ cardOf(m).routeKind === 'peak' ? '百岳' : '步道' }}
                  </span>
                  <span
                    v-if="cardOf(m).source?.category"
                    :class="[
                      'route-category-badge',
                      cardOf(m).source?.category === 'small_peak'
                        ? 'category-small-peak'
                        : cardOf(m).source?.category === 'peak'
                          ? 'category-peak'
                          : 'category-trail',
                    ]"
                  >
                    {{
                      cardOf(m).source?.category === 'small_peak'
                        ? '小百岳'
                        : cardOf(m).source?.category === 'peak'
                          ? '百岳'
                          : '步道'
                    }}
                  </span> -->
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
                  <span>🏔 {{ cardOf(m).maxElevation || '—' }}</span>
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
                    @click="askMoreAboutRoute(cardOf(m))"
                  >
                    了解更多
                  </button>
                </div>
              </div>
            </div>

            <div v-else-if="m.type === 'weather-card'" class="msg-row bot">
              <div class="msg-bot-icon">
                <img
                  :src="logoUrl"
                  alt="KaoShan logo"
                  class="msg-bot-icon-image"
                />
              </div>
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
              <div class="msg-bot-icon">
                <img
                  :src="logoUrl"
                  alt="KaoShan logo"
                  class="msg-bot-icon-image"
                />
              </div>
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
              <div class="msg-bot-icon">
                <img
                  :src="logoUrl"
                  alt="KaoShan logo"
                  class="msg-bot-icon-image"
                />
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
                <div class="chat-progress-pct">
                  {{ (m.cardData as ProgressData).progress }}%
                </div>
              </div>
            </div>

            <div v-else-if="m.type === 'analysis-card'" class="msg-row bot">
              <div class="msg-bot-icon">
                <img
                  :src="logoUrl"
                  alt="KaoShan logo"
                  class="msg-bot-icon-image"
                />
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

            <div v-else class="msg-row" :class="m.role">
              <div v-if="m.role === 'bot'" class="msg-bot-icon">
                <img
                  :src="logoUrl"
                  alt="KaoShan logo"
                  class="msg-bot-icon-image"
                />
              </div>
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
            <div class="msg-bot-icon">
              <img
                :src="logoUrl"
                alt="KaoShan logo"
                class="msg-bot-icon-image"
              />
            </div>
            <div class="typing-bubble">
              <div class="typing-dot" />
              <div class="typing-dot" />
              <div class="typing-dot" />
            </div>
          </div>

          <div ref="msgEndEl" />
        </div>

        <!-- 快速按鈕 -->
        <!-- <div
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
        </div> -->

        <div v-if="!chatCollapsed" class="line-input-wrap">
          <!-- 錄音中狀態列 -->
          <div v-if="voiceRecording" class="voice-status-bar">
            <span class="voice-status-waves">
              <span v-for="i in 4" :key="i" class="voice-status-dot" />
            </span>
            <span class="voice-status-label">錄音中</span>
            <button class="voice-status-cancel" @click="cancelVoiceRecording">
              取消
            </button>
          </div>

          <div class="line-input-bar">
            <label class="input-icon-btn" title="上傳 GPX / JSON 紀錄">
              📎
              <input
                type="file"
                accept=".gpx,.json"
                @change="onFileUpload"
                hidden
              />
            </label>
            <!-- <button
              v-if="voiceSupported"
              class="input-icon-btn"
              :class="{ 'voice-btn-active': voiceRecording }"
              :title="voiceRecording ? '停止錄音' : '語音輸入'"
              @click="
                voiceRecording ? stopVoiceRecording() : openVoiceRecording()
              "
            >
              {{ voiceRecording ? '🔴' : '🎙' }}
            </button> -->
            <input
              class="line-input"
              :placeholder="
                voiceRecording ? '請說話...' : '傳訊息給 KaoShan...'
              "
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
      </div>

      <div
        v-if="recommendationsVisible"
        class="card recommendation-panel anim-slide-up"
      >
        <div class="section-label">需求統整</div>
        <div class="demand-grid">
          <!-- <div class="custom-advice-box weather-advice-box">
            {{ demandSummary }}
          </div> -->
          <div class="demand-item">
            <span>地區</span>
            <strong>{{ demandSummary.goal }}</strong>
          </div>
          <div class="demand-item">
            <span>行程天數</span>
            <strong>{{ demandSummary.days }}</strong>
          </div>
          <!-- <div class="demand-item">
            <span>海拔爬升</span>
            <strong>{{ demandSummary.elevation }}</strong>
          </div>
          <div class="demand-item">
            <span>最高海拔</span>
            <strong>{{ demandSummary.maxElevation }}</strong>
          </div> -->
          <div class="demand-item">
            <span>體能</span>
            <strong>{{ demandSummary.fitness }}</strong>
          </div>
          <div class="demand-item">
            <span>風險偏好</span>
            <strong>{{ demandSummary.risk }}</strong>
          </div>
        </div>

        <!-- <div class="demand-note">{{ demandSummary.note }}</div> -->

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
        <div
          v-if="visibleRecommendedRouteCards.length > 0"
          class="recommendation-list"
        >
          <div
            v-for="card in visibleRecommendedRouteCards"
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
                <div class="route-card-region">
                  <span class="material-icons region-icon">location_on</span>
                  {{ card.region }}
                </div>
              </div>
              <!-- <span
                :class="[
                  'route-source-badge',
                  card.routeKind === 'peak' ? 'source-peak' : 'source-trail',
                ]"
              >
                {{ card.routeKind === 'peak' ? '百岳' : '步道' }}
              </span>
              <span
                v-if="card.source?.category"
                :class="[
                  'route-category-badge',
                  card.source.category === 'small_peak'
                    ? 'category-small-peak'
                    : card.source.category === 'peak'
                      ? 'category-peak'
                      : 'category-trail',
                ]"
              >
                {{
                  card.source.category === 'small_peak'
                    ? '小百岳'
                    : card.source.category === 'peak'
                      ? '百岳'
                      : '步道'
                }}
              </span> -->
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
                <div class="route-card-meta-title">海拔高度</div>
                <div class="route-card-meta-data">
                  {{ card.maxElevation || '—' }}
                </div>
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
        <div v-else class="recommendation-empty">
          沒有符合目前體能、難度和天數條件的推薦路線
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
            :class="{ 'ai-mode-gemini': weatherMode === 'gemini' }"
            :title="
              weatherMode === 'mock' ? '目前使用假資料' : '目前使用 Gemini'
            "
            @click="toggleWeatherMode"
          >
            {{ weatherMode === 'mock' ? '假資料' : 'Gemini' }}
          </button>
        </div>
        <div v-if="weatherLoading" class="weather-loading">
          {{
            weatherMode === 'mock'
              ? '正在產生本地假天氣建議...'
              : '正在取得中央氣象署資料並呼叫 Gemini...'
          }}
        </div>
        <div class="weather-cols">
          <div v-for="w in displayedWeather" :key="w.label" class="weather-col">
            <div class="weather-icon">{{ w.icon }}</div>
            <div class="weather-temp">{{ w.temp }}</div>
            <div class="weather-label">{{ w.label }}</div>
          </div>
        </div>
        <div class="custom-advice-box weather-advice-box">
          {{ weatherAdvice }}
        </div>
        <div v-if="weatherFallbackReasonText" class="weather-fallback-note">
          {{ weatherFallbackReasonText }}
        </div>
        <div v-if="routeWeather?.source" class="weather-source">
          來源：{{ routeWeather.source }}
          <!-- <span v-if="weatherModelDisplay" class="weather-model-badge">{{
            weatherModelDisplay
          }}</span> -->
        </div>
        <!-- <div
          v-if="showWeatherModeToggle"
          class="weather-ai-status"
          :class="weatherAiStatusClass"
        >
          {{ weatherAiStatusLabel }}
        </div> -->
      </div>

      <!-- AI 裝備辨識 -->
      <div v-if="planningRevealed" class="card anim-slide-up">
        <div class="vision-header-row">
          <div class="section-label section-label-compact">AI 裝備辨識</div>
          <button
            v-if="showVisionMockToggle"
            class="vision-mock-toggle"
            :class="{ 'vision-mock-toggle-on': visionMockMode }"
            @click.stop="toggleVisionMockMode"
          >
            {{ visionMockMode ? '假資料' : 'Gemini' }}
          </button>
        </div>
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
            <!-- 照片縮圖（點擊放大）-->
            <div class="yolo-scanned-title">
              辨識完成
              <!-- Gemini 辨識完成，已自動加入且勾選 {{ detectedVisionCount }} 項 -->
            </div>
            <img
              v-if="gearPhotoUrl"
              :src="gearPhotoUrl"
              class="gear-photo-thumb"
              alt="裝備照片"
              @click.stop="gearPhotoLightbox = true"
            />
            <div
              v-if="visionRawText"
              class="vision-raw-text"
              v-html="renderVisionRawText(visionRawText)"
            />
            <!-- <button
              class="gear-assess-btn"
              :disabled="!canAssessGear || gearAssessing"
              @click.stop="assessGearList"
            >
              {{ gearAssessing ? 'AI 評估中...' : 'AI 評估清單' }}
            </button> -->

            <!-- AI 評估內容 -->
            <div class="section-label section-label-compact q-mt-md">
              評估清單
            </div>
            <div v-if="gearAssessment" class="gear-assessment-card">
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
                  <strong>{{ gearAssessment.score }}</strong>
                  <span>分</span>
                </div>
              </div>
              <div class="gear-assessment-copy">
                <div class="gear-assessment-title-row">
                  <div class="gear-assessment-title">
                    {{ gearAssessment.level }}
                  </div>
                  <!-- <span class="gear-assessment-model">
                    {{ gearAssessment.model_used }}
                  </span> -->
                </div>
                <div class="gear-assessment-text">
                  {{ gearAssessment.summary }}
                </div>
                <ul class="gear-assessment-list">
                  <li v-for="tip in gearAssessment.tips" :key="tip">
                    {{ tip }}
                  </li>
                </ul>
                <div
                  v-if="gearAssessment.suggested_items.length"
                  class="gear-suggested-box"
                >
                  <div class="gear-suggested-title">建議補充裝備</div>
                  <div class="gear-suggested-list">
                    <span
                      v-for="item in gearAssessment.suggested_items"
                      :key="item"
                      class="gear-suggested-chip"
                    >
                      {{ item }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button class="yolo-rescan-btn" @click.stop="resetGearScan">
              重新辨識清單
            </button>
          </div>
        </div>
      </div>

      <!-- 裝備清單 -->
      <div
        v-if="planningRevealed && showGearTodoList"
        class="card anim-slide-up"
      >
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
      </div>

      <!-- <div v-if="selectedRoute" class="offline-download-card">
        <div class="offline-download-title">離線下載包</div>
        <div class="offline-download-desc">
          會打包路線資料、正式 GPX、裝備清單、AI 風險評估與緊急求救資料，並先快取地圖圖磚。
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
      </div> -->
    </aside>

    <!-- Map area — only shown after route is selected -->
    <Transition name="p1-map">
      <div v-if="selectedRoute" class="p1-map-area">
        <input
          ref="mapGpxInput"
          type="file"
          accept=".gpx"
          hidden
          @change="onFileUpload"
        />
        <div class="p1-map-toolbar">
          <div class="route-label-pill">
            <!-- <span>{{ selectedRoute.emoji }}</span> -->
            <span class="route-label-pill-title">{{ selectedRoute.name }}</span>
            <span
              :class="[
                'route-diff-badge',
                `diff-${routeDifficulty(selectedRoute)}`,
              ]"
              >{{ routeDifficultyLabel(selectedRoute) }}</span
            >
          </div>
          <div class="p1-map-actions">
            <!-- <div
              v-if="routeGpxTracks.length && !uploadedGpxTrack"
              class="gpx-source-switcher"
            >
              <div class="gpx-source-tabs">
                <button
                  class="gpx-source-tab"
                  :class="{ active: gpxScopeFilter === 'all' }"
                  @click="gpxScopeFilter = 'all'"
                >
                  全部
                </button>
                <button
                  class="gpx-source-tab"
                  :class="{ active: gpxScopeFilter === 'trail' }"
                  @click="gpxScopeFilter = 'trail'"
                >
                  步道
                </button>
                <button
                  class="gpx-source-tab"
                  :class="{ active: gpxScopeFilter === 'peak' }"
                  @click="gpxScopeFilter = 'peak'"
                >
                  百岳
                </button>
              </div>
              <select
                v-model.number="selectedDbGpxTrackId"
                class="gpx-source-select"
              >
                <option
                  v-for="track in visibleRouteGpxTracks"
                  :key="track.gpx_track_id"
                  :value="track.gpx_track_id"
                >
                  {{ track.match_scope === 'trail' ? '步道' : '百岳' }} ·
                  {{ track.label }}
                  <template v-if="track.match_score != null">
                    · {{ Math.round(track.match_score) }} 分
                  </template>
                </option>
              </select>
            </div> -->
            <!-- <div
              class="map-gpx-badge"
              :class="{ 'map-gpx-badge-off': !showGpxOverlay }"
              :title="
                showGpxOverlay ? '目前顯示 GPX 疊圖' : '目前已關閉 GPX 疊圖'
              "
            >
              <span class="material-icons">{{
                showGpxOverlay ? 'route' : 'hide_source'
              }}</span>
              <span>{{ showGpxOverlay ? 'GPX 已顯示' : 'GPX 已關閉' }}</span>
            </div> -->
            <button class="custom-btn gpx-map-btn" @click="openMapGpxImport">
              匯入 GPX
            </button>
            <button
              class="custom-btn gpx-map-btn"
              :disabled="!gpxMapTrack"
              @click="downloadCurrentGpx"
            >
              下載 GPX
            </button>
            <button class="custom-btn gpx-map-btn" @click="toggleGpxOverlay">
              {{ showGpxOverlay ? '關閉 GPX 疊圖' : '顯示 GPX 疊圖' }}
            </button>
          </div>
        </div>
        <div v-if="selectedRoute" class="row gpx-map-status">
          <strong class="gpx-map-status-title">
            <span class="material-icons">route</span>
            {{ selectedRoute.name }}
          </strong>
          <div class="row justify-between gpx-map-meta">
            <div class="col-auto gpx-map-meta-label">海拔高度</div>
            <div class="col gpx-map-meta-value">
              {{ selectedRoute.maxElevation || '—' }}
            </div>
          </div>
          <div class="row justify-between gpx-map-meta">
            <div class="col-auto gpx-map-meta-label">距離</div>
            <div class="col gpx-map-meta-value">
              {{ selectedRoute.distance }}
            </div>
          </div>
          <div class="row justify-between gpx-map-meta">
            <div class="col-auto gpx-map-meta-label">爬升</div>
            <div class="col gpx-map-meta-value">
              {{ selectedRoute.elevation }}
            </div>
          </div>
          <div class="row justify-between gpx-map-meta">
            <div class="col-auto gpx-map-meta-label">預計時間</div>
            <div class="col gpx-map-meta-value">
              {{ selectedRoute.time }}
            </div>
          </div>
          <!-- <div
            class="map-gpx-badge"
            :class="{ 'map-gpx-badge-off': !showGpxOverlay }"
            :title="
              showGpxOverlay ? '目前顯示 GPX 疊圖' : '目前已關閉 GPX 疊圖'
            "
          >
            <span class="material-icons">{{
              showGpxOverlay ? 'route' : 'hide_source'
            }}</span>
            <span>{{ showGpxOverlay ? 'GPX 已顯示' : 'GPX 已關閉' }}</span>
          </div> -->
        </div>
        <MapPhase1
          :theme="appStore.config.theme"
          :gpx-track="gpxMapTrack"
          :show-gpx-overlay="showGpxOverlay"
          class="p1-map-layer"
        />
      </div>
    </Transition>
  </div>

  <!-- 路線詳情 Dialog -->
  <PreRouteDetailDialog
    v-if="dialogRouteCard"
    v-model="showRouteDialog"
    :route="dialogRouteCard"
    @select="onDialogSelectRoute"
  />
</template>

<script setup lang="ts">
import logoUrl from 'src/assets/img/logo.png';
import { api } from 'src/boot/axios';
import MapPhase1 from 'src/components/MapPhase1.vue';
import PreRouteDetailDialog from 'src/components/PreRouteDetailDialog.vue';
import { useAiRouter } from 'src/composables/useAiRouter';
import { cacheTilesForRoute, kaoshanDB } from 'src/composables/useMapTileCache';
import {
  FITNESS_LABELS,
  GEAR_ITEMS,
  type GearItem,
} from 'src/data/hikingRoutes';
import {
  fetchRecommendedRoutes,
  fetchRoutes,
  hydrateRoute,
  routeToRecommendation,
  type RouteApiResponse,
  type RouteRecommendation,
  type RouteRecommendationRequest,
  type RouteViewRoute,
} from 'src/services/routes';
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

type RecommendedRoute = RouteRecommendation;
type UserProfile = RouteRecommendationRequest;

const router = useRouter();
const appStore = useAppStore();
const aiRouter = useAiRouter();
const auth = useAuthStore();
const showAiModeToggle = false;
const aiChatMode = ref<'mock' | 'gemini'>('gemini');
const shouldUseOpenAiChat = computed(() => true);
const showWeatherModeToggle = false;
const weatherMode = ref<'mock' | 'gemini'>('gemini');
const shouldUseOpenAiWeather = computed(() => true);

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
  routeKind: 'trail' | 'peak';
  difficulty: 'easy' | 'medium' | 'hard';
  distance: string;
  elevation: string;
  maxElevation: string;
  time: string;
  trailShape: string;
  surface: string;
  bestSeason: string;
  tags: string[];
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
  elevation: string;
  maxElevation: string;
  fitness: string;
  risk: string;
  note: string;
}

interface GearAssessment {
  score: number;
  level: string;
  summary: string;
  tips: string[];
  suggested_items: string[];
  model_used: string;
  fallback?: boolean;
}

interface GearDetectItem {
  name: string;
  detected: boolean;
  confidence: number;
  brand?: string | null;
  model?: string | null;
  primary_use?: string | null;
  waterproof?: boolean | null;
  notes?: string | null;
}

interface GearDetectResponse {
  items: GearDetectItem[];
  missing_count: number;
  model_used: string;
  fallback?: boolean;
  shoe?: ShoeRecognition | null;
  raw_text?: string | null;
}

interface ShoeRecognition {
  item_type: string;
  brand: string | null;
  model: string | null;
  primary_use: string | null;
  terrain_suitability: string[];
  waterproof: boolean | null;
  ankle_support: string | null;
  confidence: number;
  notes: string | null;
}

interface GearAssessResponse {
  score: number;
  level: string;
  summary: string;
  tips: string[];
  suggested_items?: string[];
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
  fallback_stage?: string | null;
  fallback_reason?: string | null;
}

interface GpxMapTrack {
  name: string;
  points: [number, number][];
  segments?: [number, number][][];
  trackId?: number;
  matchScope?: 'trail' | 'peak';
  distanceKm: number;
  elevationGain: number;
  elevationLoss: number | null;
  durationMin: number | null;
  averageGradePct: number | null;
  source: 'uploaded-gpx' | 'database-gpx' | 'route-polyline';
  hintSegments: Array<{
    label: string;
    midpoint: [number, number];
    distanceKm: number;
    elevationDeltaM: number;
    gradePct: number | null;
  }>;
}

interface RouteGpxTrackOption {
  gpx_track_id: number;
  label: string;
  match_scope: 'trail' | 'peak';
  route_kind: 'trail' | 'peak';
  cluster_id: number | null;
  canonical: boolean;
  match_score: number | null;
  decision: 'auto_approved' | 'review' | 'rejected' | null;
  points: [number, number][];
  segments: [number, number][][];
  length_km: number | null;
  elevation_gain_m: number | null;
  quality_score: number | null;
}

interface RouteGpxResponse {
  route_id: string;
  route_kind: 'trail' | 'peak';
  route_name: string;
  tracks: RouteGpxTrackOption[];
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
  level: 'beginner' | 'experienced' | 'advanced';
  fitness: number;
  target_days: number;
  slopeCoeff: number;
}

interface RouteApiResponse {
  id: string;
  name: string;
  location: string;
  route_kind?: 'trail' | 'peak';
  category?: 'trail' | 'peak' | 'small_peak' | null;
  description?: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  days: number;
  distance_km: number;
  estimated_hours: number;
  elevation_gain: number;
  max_elevation: number;
  risks: {
    slip: number;
    lost: number;
    deviation: number;
  };
  match_score?: number | null;
  match_rank?: number | null;
  match_reason?: string | null;
  recommendation_source?: 'gemini' | 'heuristic' | 'mock' | null;
}

// ── LINE Chatbox ─────────────────────────────────
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
  displayStart: number;
} | null>(null);
const demandSummary = ref<DemandSummary>({
  goal: '尚未建立',
  days: '待確認',
  elevation: '待確認',
  maxElevation: '待確認',
  fitness: '待確認',
  risk: '待確認',
  note: '完成 AI 對話後，這裡會整理本次登山需求與推薦路線。',
});
const selectedRecFitness = ref<number | null>(null);
const selectedRecDifficulty = ref<'easy' | 'medium' | 'hard' | 'expert' | null>(
  null,
);
const selectedRecDays = ref<number | null>(null);

const fitnessFilters = [
  { label: '不限', value: null },
  { label: '1 分', value: 1 },
  { label: '2 分', value: 2 },
  { label: '3 分', value: 3 },
  { label: '4 分', value: 4 },
  { label: '5 分', value: 5 },
];

const difficultyFilters = [
  { label: '不限', value: null },
  { label: '容易', value: 'easy' as const },
  { label: '中等', value: 'medium' as const },
  { label: '困難', value: 'hard' as const },
  { label: '專家', value: 'expert' as const },
];

const dayFilters = [
  { label: '不限', value: null },
  { label: '1 天', value: 1 },
  { label: '2 天', value: 2 },
  { label: '3 天以上', value: 3 },
];

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
    text: `您好${auth.profile?.displayName ? '，' + auth.profile.displayName : ''}！我是 KaoShan 助理\n\n您可以用兩種方式開始規劃：\n1. 直接聊天：告訴我體力、登山經驗和想走幾天。\n2. 上傳紀錄：上傳 GPX / JSON 登山紀錄，我會分析距離、爬升與體能表現。\n我會依照這些資料幫您推薦適合的路線。`,
    // text: `您好${auth.profile?.displayName ? '，' + auth.profile.displayName : ''}！我是 KaoShan 助理\n\n您可以用三種方式開始規劃：\n1. 直接聊天：告訴我年齡、體力、登山經驗和想走幾天。\n2. 語音輸入：用說的描述這次想走的路線或體能狀況。\n3. 上傳紀錄：上傳 GPX / JSON 登山紀錄，我會分析距離、爬升與體能表現。\n\n我會依照這些資料幫您推薦適合的路線。`,
  },
]);

function createInitialMessages(): Message[] {
  return [
    {
      id: 1,
      role: 'bot',
      type: 'text',
      time: nowTime(),
      text: `您好${auth.profile?.displayName ? '，' + auth.profile.displayName : ''}！我是 KaoShan 助理\n\n您可以用兩種方式開始規劃：\n1. 直接聊天：告訴我體力、登山經驗和想走幾天。\n2. 上傳紀錄：上傳 GPX / JSON 登山紀錄，我會分析距離、爬升與體能表現。\n\n我會依照這些資料幫您推薦適合的路線。`,
      // text: `您好${auth.profile?.displayName ? '，' + auth.profile.displayName : ''}！我是 KaoShan 助理\n\n您可以用三種方式開始規劃：\n1. 直接聊天：告訴我年齡、體力、登山經驗和想走幾天。\n2. 語音輸入：用說的描述這次想走的路線或體能狀況。\n3. 上傳紀錄：上傳 GPX / JSON 登山紀錄，我會分析距離、爬升與體能表現。\n\n我會依照這些資料幫您推薦適合的路線。`,
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
  return;
}

function toggleChatCollapsed() {
  chatCollapsed.value = !chatCollapsed.value;
}

function resetChatConversation() {
  stopVoiceCapture();
  voiceRecording.value = false;

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
    elevation: '待確認',
    maxElevation: '待確認',
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
  visionItems.value = [];
  recognizedShoe.value = null;
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

function toggleRecommendedFitness(value: number | null) {
  selectedRecFitness.value = selectedRecFitness.value === value ? null : value;
}

function toggleRecommendedDifficulty(
  value: 'easy' | 'medium' | 'hard' | 'expert' | null,
) {
  selectedRecDifficulty.value =
    selectedRecDifficulty.value === value ? null : value;
}

function toggleRecommendedDays(value: number | null) {
  selectedRecDays.value = selectedRecDays.value === value ? null : value;
}

function filterRecommendationRoutes(routes: RecommendedRoute[]) {
  return routes.filter((route) => {
    if (
      selectedRecFitness.value != null &&
      route.minFitness > selectedRecFitness.value
    ) {
      return false;
    }
    if (
      selectedRecDifficulty.value &&
      route.difficulty !== selectedRecDifficulty.value
    ) {
      return false;
    }
    if (selectedRecDays.value != null) {
      if (selectedRecDays.value === 3 && route.minDays < 3) return false;
      if (
        selectedRecDays.value !== 3 &&
        route.minDays !== selectedRecDays.value
      )
        return false;
    }
    return true;
  });
}

function routeSortWeight(route: RecommendedRoute) {
  const fitnessTarget =
    selectedRecFitness.value ?? profileForm.value?.fitness ?? 3;
  const difficultyTarget = selectedRecDifficulty.value;
  const daysTarget =
    selectedRecDays.value ?? profileForm.value?.target_days ?? 1;
  const matchScore = route.matchScore ?? 0;
  const diffGap =
    difficultyTarget && route.difficulty !== difficultyTarget ? 4 : 0;
  const daysGap =
    selectedRecDays.value == null
      ? Math.abs(route.minDays - daysTarget)
      : selectedRecDays.value === 3
        ? Math.max(0, 3 - route.minDays)
        : Math.abs(route.minDays - daysTarget);
  return (
    -matchScore +
    Math.abs(route.minFitness - fitnessTarget) * 10 +
    diffGap * 6 +
    daysGap * 3 +
    route.minDays * 0.25
  );
}

function sortRecommendationRoutes(routes: RecommendedRoute[]) {
  return [...routes].sort((a, b) => routeSortWeight(a) - routeSortWeight(b));
}

const visibleRecommendedRouteCards = computed(() =>
  getRecommendationBatch(
    sortRecommendationRoutes(
      filterRecommendationRoutes(
        [...recommendedRouteCards.value]
          .map((card) => card.source)
          .filter((route): route is RecommendedRoute => !!route),
      ),
    ).map(toRouteCard),
    lastRecommendationContext.value?.displayStart ?? 0,
  ),
);

function buildRecommendationDialogueText(cards: RouteCard[]) {
  const topCards = cards.slice(0, 3);
  if (topCards.length === 0) return '';
  const lines = topCards.map((card, index) => {
    const reason = card.highlight?.trim() || '依您的條件做出的推薦。';
    return `${index + 1}. ${card.name}：${reason}`;
  });
  return `為您推薦以下路線：\n${lines.join('\n')}\n請在下方選擇一條路線，再進行裝備與天氣檢查。`;
}

function shouldRefreshRecommendations(msg: string) {
  return /換需求|加需求|重新推薦|重新規劃|換路線|改成|改為|調整|更輕鬆|更簡單|更難|縮短|拉長|增加|減少|不要/.test(
    msg,
  );
}

function showPlanningTools() {
  planningRevealed.value = true;
}

function buildDemandSummary(msg: string): DemandSummary {
  return {
    goal: /北部|中部|南部|東部/.test(msg)
      ? (msg.match(/(北部|中部|南部|東部)/)?.[1] ?? '待確認地區')
      : '待確認地區',
    days: '待確認',
    elevation: '待確認',
    maxElevation: '待確認',
    fitness: /進階|挑戰|百岳/.test(msg)
      ? '良好，可接受較長爬升'
      : /體能|分析|GPX|紀錄/.test(msg)
        ? '依上傳紀錄估算：普通至良好'
        : '普通，優先控制負荷',
    risk: /陡|挑戰|百岳/.test(msg) ? '可接受中風險' : '偏好低風險',
    note: '先以資料庫路線的天數、體能、坡度接受度與天氣風險篩選，選定路線後再展開裝備與天氣檢查。',
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
    days: '待確認',
    elevation: '待確認',
    maxElevation: '待確認',
    fitness: `${FITNESS_LABELS[profile.fitness]}（${profile.fitness}/5）`,
    risk:
      profile.level === 'experienced' && profile.fitness >= 4
        ? '可接受中風險'
        : '優先低風險',
    note: '已取得 ProfileForm，並透過資料庫路線推薦 API 取得推薦路線。',
  };
}

function publishRouteRecommendations(
  routes: RecommendedRoute[],
  sourceMessage: string,
  profile?: ProfileForm,
) {
  const normalizedRoutes = rotateRoutesByScore(
    getSimilarRouteCandidates(routes, profile),
  );
  lastRecommendationContext.value = {
    routes: normalizedRoutes,
    sourceMessage,
    profile,
    displayStart: 0,
  };
  const summary = profile
    ? buildDemandSummaryFromProfile(profile, sourceMessage)
    : buildDemandSummary(sourceMessage);
  const uniqueRegions = [
    ...new Set(normalizedRoutes.map((route) => route.region)),
  ];

  summary.goal =
    uniqueRegions.length > 0
      ? uniqueRegions.length === 1
        ? uniqueRegions[0]!
        : uniqueRegions.slice(0, 2).join('、')
      : '待確認地區';

  const maxDays = Math.max(...normalizedRoutes.map((r) => r.minDays ?? 1));
  summary.days = maxDays >= 2 ? `${maxDays} 天行程` : '1 日行程';

  const elevations = normalizedRoutes
    .map((r) => r.elevation_gain)
    .filter((v): v is number => typeof v === 'number' && v > 0);
  if (elevations.length > 0) {
    const avg = Math.round(
      elevations.reduce((a, b) => a + b, 0) / elevations.length,
    );
    summary.elevation = `⬆ ${avg} m`;
  }
  const maxElevNums = normalizedRoutes
    .map((r) => parseInt(r.maxElevation ?? ''))
    .filter((v) => !isNaN(v) && v > 0);
  if (maxElevNums.length > 0) {
    summary.maxElevation = `🏔 ${Math.max(...maxElevNums).toLocaleString()} m`;
  }
  demandSummary.value = summary;
  recommendedRouteCards.value = normalizedRoutes.map(toRouteCard);
  const displayCards = getRecommendationBatch(
    sortRecommendationRoutes(filterRecommendationRoutes(normalizedRoutes)).map(
      toRouteCard,
    ),
    0,
  );
  const recommendationText = buildRecommendationDialogueText(displayCards);
  const lastBotText = [...messages.value]
    .reverse()
    .find((message) => message.role === 'bot' && message.type === 'text')
    ?.text?.trim();
  if (recommendationText && recommendationText !== lastBotText) {
    messages.value.push({
      id: Date.now() + 1,
      role: 'bot',
      type: 'text',
      text: recommendationText,
      time: nowTime(),
    });
  }
  recommendationsVisible.value = true;
  chatCollapsed.value = true;
  quickReplies.value = [];
}

function rerollRecommendations() {
  const context = lastRecommendationContext.value;

  if (!context || rerollingRecommendations.value) return;
  rerollingRecommendations.value = true;
  try {
    const filteredRoutes = sortRecommendationRoutes(
      filterRecommendationRoutes(context.routes),
    );
    const nextStart =
      filteredRoutes.length <= 3
        ? 0
        : (context.displayStart + 3) % filteredRoutes.length;
    context.displayStart = nextStart;

    const recommendationText = buildRecommendationDialogueText(
      getRecommendationBatch(filteredRoutes.map(toRouteCard), nextStart),
    );
    const lastBotText = [...messages.value]
      .reverse()
      .find((message) => message.role === 'bot' && message.type === 'text')
      ?.text?.trim();
    if (recommendationText && recommendationText !== lastBotText) {
      messages.value.push({
        id: Date.now() + 1,
        role: 'bot',
        type: 'text',
        text: recommendationText,
        time: nowTime(),
      });
    }

    const visibleRouteIds = new Set(
      visibleRecommendedRouteCards.value.flatMap((card) =>
        card.source?.id ? [card.source.id] : [],
      ),
    );
    if (selectedRoute.value && !visibleRouteIds.has(selectedRoute.value.id)) {
      selectedRoute.value = null;
      planningRevealed.value = false;
      routeWeather.value = null;
    }
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
    age: Number(ageMatch?.[1] ?? 0),
    weight: Number(weightMatch?.[1] ?? 70),
    level: /新手|第一次|入門/.test(text)
      ? 'beginner'
      : /百岳|進階|高手|資深|多次/.test(text)
        ? 'advanced'
        : 'experienced',
    fitness: Math.min(
      5,
      Math.max(1, /進階|百岳|挑戰|體力好/.test(text) ? 4 : fitness),
    ),
    target_days: Math.min(5, Math.max(1, targetDays || 1)),
    slopeCoeff: /陡坡|挑戰|刺激|陡峭/.test(text)
      ? 4
      : /緩坡|平緩|輕鬆/.test(text)
        ? 2
        : 3,
  };
}

function profileToRecommendationInput(profile: ProfileForm): UserProfile {
  return {
    age: String(profile.age),
    weight: String(profile.weight),
    height: '',
    experience: profile.level,
    fitness: profile.fitness,
    slopeCoeff: profile.slopeCoeff ?? 3,
    targetDays: profile.target_days,
  };
}

function normalizeExtractedProfile(
  extracted: Record<string, unknown> | null | undefined,
  fallbackText: string,
): ProfileForm {
  const fallback = fallbackProfileFromText(fallbackText);
  const exp = String(
    extracted?.experience ?? extracted?.level ?? fallback.level,
  );
  const level: ProfileForm['level'] =
    exp === 'advanced'
      ? 'advanced'
      : exp === 'experienced'
        ? 'experienced'
        : 'beginner';
  return {
    age: Number(extracted?.age ?? fallback.age ?? 0),
    weight: Number(extracted?.weight ?? fallback.weight),
    level,
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
    slopeCoeff: Math.min(
      5,
      Math.max(1, Number(extracted?.slopeCoeff ?? fallback.slopeCoeff ?? 3)),
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
  return routeToRecommendation(route);
}

function buildRouteSkeleton(route: RouteApiResponse): RouteViewRoute {
  return hydrateRoute(route);
}

function getSimilarRouteCandidates(
  routes: RecommendedRoute[],
  profile?: ProfileForm,
): RecommendedRoute[] {
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  return routes.filter((route) => {
    const id = route.id;
    const name = route.name;
    if ((id && seenIds.has(id)) || seenNames.has(name)) return false;
    if (id) seenIds.add(id);
    seenNames.add(name);
    return true;
  });
}

function rotateRoutesByScore(routes: RecommendedRoute[]): RecommendedRoute[] {
  const buckets = new Map<number, RecommendedRoute[]>();
  for (const route of routes) {
    const key = Math.round((route.matchScore ?? 0) * 10);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(route);
    else buckets.set(key, [route]);
  }

  return [...buckets.entries()]
    .sort((a, b) => b[0] - a[0])
    .flatMap(([, bucket]) => {
      if (bucket.length <= 1) return bucket;
      const offset = Math.floor(Math.random() * bucket.length);
      return bucket.slice(offset).concat(bucket.slice(0, offset));
    });
}

function prioritizeRoutesByIds(
  routes: RecommendedRoute[],
  preferredIds?: string[],
): RecommendedRoute[] {
  if (!preferredIds || preferredIds.length === 0) return routes;
  const preferredOrder = new Map<string, number>();
  preferredIds.forEach((id, index) => {
    if (!preferredOrder.has(id)) {
      preferredOrder.set(id, index);
    }
  });
  return [...routes].sort((a, b) => {
    const aIndex = preferredOrder.get(a.id);
    const bIndex = preferredOrder.get(b.id);
    if (aIndex != null && bIndex != null) return aIndex - bIndex;
    if (aIndex != null) return -1;
    if (bIndex != null) return 1;
    return 0;
  });
}

function getRecommendationBatch(
  routes: RecommendedRoute[],
  startIndex: number,
): RecommendedRoute[] {
  if (routes.length <= 3) return routes;
  return Array.from({ length: 3 }, (_, index) => {
    const routeIndex = (startIndex + index) % routes.length;
    return routes[routeIndex]!;
  });
}

async function recommendRoutesFromProfile(
  profile: ProfileForm,
  sourceMessage: string,
  aiRouteIds?: string[],
) {
  profileForm.value = profile;

  // Gemini 直接指定路線 ID → 比對資料庫，有就用，沒有就找最相近的
  if (aiRouteIds && aiRouteIds.length > 0) {
    try {
      const { data: dbRoutes } = await api.post<RouteApiResponse[]>(
        '/routes/recommend',
        profile,
      );
      const dbMap = new Map(dbRoutes.map((r) => [r.id, r]));
      const normalizeKey = (value: string) =>
        value
          .toLowerCase()
          .replace(/[\s_\-]+/g, '')
          .replace(/[^0-9a-z\u4e00-\u9fff]+/gi, '');

      const candidateKeys = dbRoutes.map((route) => ({
        route,
        keys: [route.id, route.name, route.location, route.description ?? '']
          .map((value) => normalizeKey(value))
          .filter(Boolean),
      }));

      const matched: RouteApiResponse[] = [];
      const usedIds = new Set<string>();
      for (const id of aiRouteIds) {
        const normalizedId = normalizeKey(id);
        if (!normalizedId) continue;

        // 1. ID 完全吻合
        const byId = dbMap.get(id);
        if (byId && !usedIds.has(byId.id)) {
          matched.push(byId);
          usedIds.add(byId.id);
          continue;
        }

        // 2. 用資料庫候選集的 id / 名稱 / 地點 / 描述做文字匹配
        const byText = candidateKeys.find(({ route, keys }) => {
          if (usedIds.has(route.id)) return false;
          return keys.some(
            (key) =>
              key && (key.includes(normalizedId) || normalizedId.includes(key)),
          );
        })?.route;

        if (byText && !usedIds.has(byText.id)) {
          matched.push(byText);
          usedIds.add(byText.id);
        }
      }

      const aiRoutes = matched.map(apiRouteToRecommendedRoute);
      // 剩餘 DB 路線補進候選池供「換路線」使用
      const rest = dbRoutes
        .filter((r) => !usedIds.has(r.id))
        .map(apiRouteToRecommendedRoute);
      publishRouteRecommendations(
        rotateRoutesByScore(getSimilarRouteCandidates([...aiRoutes, ...rest])),
        sourceMessage,
        profile,
      );
      return;
    } catch (_) {
      // 抓失敗則 fallback 到一般推薦流程
    }
  }

  try {
    const { data } = await api.post<RouteApiResponse[]>(
      '/routes/recommend',
      profile,
    );
    publishRouteRecommendations(
      rotateRoutesByScore(data.map(apiRouteToRecommendedRoute)),
      sourceMessage,
      profile,
    );
  } catch (_) {
    try {
      const localRoutes = (
        await fetchRoutes({
          fitness: profile.fitness,
          target_days: profile.target_days,
        })
      ).map(routeToRecommendation);
      publishRouteRecommendations(localRoutes, sourceMessage, profile);
    } catch (err) {
      console.error('database route fallback failed', err);
    }
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
  let routes: RouteApiResponse[];
  try {
    routes = await fetchRecommendedRoutes(profile);
  } catch (_) {
    routes = await fetchRoutes({
      fitness: profile.fitness,
      target_days: profile.target_days,
    });
  }

  messages.value.push({
    id: Date.now() + 1,
    role: 'bot',
    type: 'text',
    text: '我已從資料庫整理出依目前對話推估出的推薦路線。',
    time: nowTime(),
  });
  publishRouteRecommendations(
    routes.map(apiRouteToRecommendedRoute),
    combinedText,
    profile,
  );
}

async function replyWithMockAi(msg: string) {
  await sleep(650);
  // typing 繼續顯示，直到各路徑真正拿到回覆才關閉

  // ── Mock 模式：關鍵字捷徑（不呼叫 API）─────────────────────────
  if (aiChatMode.value !== 'gemini') {
    if (/裝備|清單|gear/i.test(msg)) {
      if (!selectedRoute.value) {
        let routes: RouteApiResponse[];
        try {
          routes = await fetchRecommendedRoutes(
            profileToRecommendationInput(fallbackProfileFromText(msg, 2)),
          );
        } catch (_) {
          routes = await fetchRoutes({
            fitness: 2,
            target_days: 1,
          });
        }
        typing.value = false;
        messages.value.push({
          id: Date.now() + 1,
          role: 'bot',
          type: 'text',
          text: '我會先幫你整理路線需求。選定路線後，才會展開對應的裝備清單、AI 裝備辨識與明日天氣。',
          time: nowTime(),
        });
        setTimeout(
          () =>
            publishRouteRecommendations(
              routes.map(apiRouteToRecommendedRoute),
              msg,
            ),
          500,
        );
        return;
      }
      showPlanningTools();
      typing.value = false;
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
      let routes: RouteApiResponse[];
      try {
        routes = await fetchRecommendedRoutes(
          profileToRecommendationInput(
            fallbackProfileFromText(`${historyContext.value}\n${msg}`, 3),
          ),
        );
      } catch (_) {
        routes = await fetchRoutes({
          fitness: 3,
          target_days: 1,
        });
      }
      typing.value = false;
      messages.value.push({
        id: Date.now() + 1,
        role: 'bot',
        type: 'text',
        text: '我先依資料庫中的路線幫你估算：目前適合 1 日、低到中風險、爬升不要太連續的路線。接下來可以看推薦路線與出發前檢查。',
        time: nowTime(),
      });
      setTimeout(
        () =>
          publishRouteRecommendations(
            routes.map(apiRouteToRecommendedRoute),
            msg,
          ),
        500,
      );
      return;
    }
  }

  // ── Gemini API 呼叫（Gemini 模式永遠走這裡）─────────────────────
  let replyText =
    '我收到你的訊息了。可以再補充這次想走的地區、天數或體力狀況，我會依照你的回答慢慢整理規劃。';
  let ready = false;
  let extractedProfile: Record<string, unknown> | null | undefined = null;
  try {
    const { data } = await api.post<{
      reply: string;
      ready: boolean;
      extracted_profile?: Record<string, unknown> | null;
      raw_reply?: string | null;
    }>('/chat', {
      messages: buildChatRequestMessages(),
      history_context: historyContext.value,
    });
    replyText = data.reply;
    ready = data.ready;
    extractedProfile = data.extracted_profile;
  } catch (err) {
    console.error('[Gemini chat 失敗]', err);
  }

  typing.value = false;
  messages.value.push({
    id: Date.now() + 1,
    role: 'bot',
    type: 'text',
    text: replyText,
    time: nowTime(),
  });

  const combinedText = `${historyContext.value}\n${msg}`.trim();
  if (recommendationsVisible.value && shouldRefreshRecommendations(msg)) {
    const refreshedProfile = fallbackProfileFromText(
      combinedText,
      profileForm.value?.fitness ?? 3,
    );
    await recommendRoutesFromProfile(refreshedProfile, combinedText);
    return;
  }

  if (ready) {
    const aiRouteIds = Array.isArray(extractedProfile?.recommendedRouteIds)
      ? (extractedProfile!.recommendedRouteIds as string[])
      : undefined;
    const profile = extractedProfile
      ? normalizeExtractedProfile(extractedProfile, combinedText)
      : fallbackProfileFromText(combinedText, profileForm.value?.fitness ?? 3);
    await recommendRoutesFromProfile(profile, combinedText, aiRouteIds);
  } else if (
    aiChatMode.value === 'gemini' &&
    /裝備|清單|gear/i.test(msg) &&
    selectedRoute.value
  ) {
    // Gemini 提到裝備且已選路線 → 自動開啟出發前工具
    showPlanningTools();
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

  if (/天氣|氣象|下雨/.test(msg) && !shouldUseOpenAiChat.value) {
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
    routeKind: 'trail',
    difficulty: routeDifficulty(route),
    distance: route.distance,
    elevation: route.elevation,
    maxElevation: route.maxElevation ?? '',
    time: route.time,
    trailShape: route.trailShape,
    surface: getSurfaceLabel(route),
    bestSeason: getBestSeasonLabel(route),
    tags: getRouteTags(route),
    highlight: route.highlight,
    source: route,
  };
}

function getSurfaceLabel(route: RecommendedRoute): string {
  if (route.risk === 'low') return '石板路、石階';
  if (route.risk === 'mid') return '土石路、碎石';
  return '山徑、碎石、陡坡';
}

function getBestSeasonLabel(route: RecommendedRoute): string {
  const seasonMap: Record<string, string> = {
    qixing: '全年',
    baiyang: '全年',
    hehuan: '4-11月',
    hehuane: '5-10月',
    yushan: '4-5月、9-11月',
    xueshan: '5-10月',
    dawu: '10-3月',
    jiaming: '4-5月、9-11月',
  };
  return seasonMap[route.id] ?? '全年';
}

function getRouteTags(route: RecommendedRoute): string[] {
  const tagMap: Record<string, string[]> = {
    qixing: ['火山地形', '台北最高峰', '展望佳'],
    baiyang: ['太魯閣', '隧道步道', '水濂洞'],
    hehuan: ['高山步道', '雲海', '入門百岳'],
    hehuane: ['稜線視野', '花季', '合歡群峰'],
    yushan: ['百岳', '台灣最高峰', '需申請'],
    xueshan: ['聖稜線', '高山縱走', '雪景'],
    dawu: ['原始檜木林', '南台灣最高峰', '聖山'],
    jiaming: ['高山湖泊', '山屋行程', '中央山脈'],
  };
  return tagMap[route.id] ?? [route.highlight];
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
  messages.value.push({
    id: Date.now(),
    role: 'bot',
    type: 'text',
    time: nowTime(),
    text: `已選擇「${card.name}」，地圖與出發按鈕已顯示在右側。`,
  });
}

const showRouteDialog = ref(false);
const dialogRouteCard = ref<RouteCard | null>(null);

function askMoreAboutRoute(card: RouteCard) {
  dialogRouteCard.value = card;
  showRouteDialog.value = true;
}

function onDialogSelectRoute() {
  if (dialogRouteCard.value) {
    showRouteDialog.value = false;
    selectRecommendedRoute(dialogRouteCard.value);
  }
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

interface GpxTrackPoint {
  lat: number;
  lon: number;
  ele: number | null;
  time: number | null;
}

function buildTrackHintSegments(
  points: GpxTrackPoint[],
): GpxMapTrack['hintSegments'] {
  if (points.length < 2) return [];

  const segmentCount = Math.min(8, Math.max(1, points.length - 1));
  const segmentSize = Math.max(
    1,
    Math.ceil((points.length - 1) / segmentCount),
  );
  const segments: GpxMapTrack['hintSegments'] = [];

  for (let start = 0; start < points.length - 1; start += segmentSize) {
    const end = Math.min(points.length - 1, start + segmentSize);
    let segmentDistanceKm = 0;
    let segmentGainM = 0;
    let segmentLossM = 0;

    for (let i = start + 1; i <= end; i++) {
      const prev = points[i - 1]!;
      const curr = points[i]!;
      segmentDistanceKm += haversine(prev.lat, prev.lon, curr.lat, curr.lon);
      if (prev.ele != null && curr.ele != null) {
        const delta = curr.ele - prev.ele;
        if (delta > 0) segmentGainM += delta;
        else segmentLossM += Math.abs(delta);
      }
    }

    const midpoint = points[Math.floor((start + end) / 2)] ?? points[start]!;
    const elevationDeltaM = Math.round(segmentGainM - segmentLossM);
    const gradePct =
      segmentDistanceKm > 0 && elevationDeltaM !== 0
        ? Math.round(
            (elevationDeltaM / (segmentDistanceKm * 1000)) * 100 * 10,
          ) / 10
        : null;

    segments.push({
      label: `段落 ${segments.length + 1}`,
      midpoint: [midpoint.lat, midpoint.lon],
      distanceKm: Math.round(segmentDistanceKm * 10) / 10,
      elevationDeltaM,
      gradePct,
    });
  }

  return segments;
}

function buildGpxTrackFromPoints(
  name: string,
  points: GpxTrackPoint[],
  source: GpxMapTrack['source'],
): GpxMapTrack {
  let distanceKm = 0;
  let elevationGain = 0;
  let elevationLoss = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    distanceKm += haversine(prev.lat, prev.lon, curr.lat, curr.lon);

    if (prev.ele != null && curr.ele != null) {
      const delta = curr.ele - prev.ele;
      if (delta > 0) elevationGain += delta;
      else elevationLoss += Math.abs(delta);
    }
  }

  const timeValues = points
    .map((point) => point.time)
    .filter(
      (time): time is number => typeof time === 'number' && !Number.isNaN(time),
    );

  const durationMin =
    timeValues.length >= 2
      ? Math.max(
          1,
          Math.round(
            (timeValues[timeValues.length - 1]! - timeValues[0]!) / 60000,
          ),
        )
      : Math.max(1, Math.round(distanceKm * 30));

  const hasElevation = points.some((point) => point.ele != null);
  const averageGradePct =
    hasElevation && distanceKm > 0
      ? Math.round(
          ((elevationGain - elevationLoss) / (distanceKm * 1000)) * 100 * 10,
        ) / 10
      : null;

  return {
    name,
    points: points.map((point) => [point.lat, point.lon]),
    distanceKm: Math.round(distanceKm * 10) / 10,
    elevationGain: Math.round(elevationGain),
    elevationLoss: Math.round(elevationLoss),
    durationMin,
    averageGradePct,
    source,
    hintSegments: buildTrackHintSegments(points),
  };
}

function parseGpxTrack(text: string): {
  history: ParsedHistory;
  track: GpxMapTrack;
} {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const trkpts = [...doc.querySelectorAll('trkpt')];
  const name = doc.querySelector('name')?.textContent ?? 'GPX 路線';

  const points: GpxTrackPoint[] = trkpts.map((trkpt) => {
    const eleText = trkpt.querySelector('ele')?.textContent;
    const timeText = trkpt.querySelector('time')?.textContent;
    return {
      lat: Number.parseFloat(trkpt.getAttribute('lat') ?? '0'),
      lon: Number.parseFloat(trkpt.getAttribute('lon') ?? '0'),
      ele: eleText == null ? null : Number.parseFloat(eleText),
      time: timeText ? new Date(timeText).getTime() : null,
    };
  });

  if (!points.length) {
    throw new Error('GPX contains no valid track points');
  }

  const rawDate =
    doc.querySelector('metadata time')?.textContent?.split('T')[0] ??
    new Date().toISOString().split('T')[0]!;

  const track = buildGpxTrackFromPoints(name, points, 'uploaded-gpx');

  return {
    history: {
      name,
      distanceKm: track.distanceKm,
      elevationGain: track.elevationGain,
      durationMin: track.durationMin ?? 0,
      date: rawDate ?? '',
    },
    track,
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
  const isGpxUpload = file.name.endsWith('.gpx');

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
    if (isGpxUpload) {
      const parsed = parseGpxTrack(text);
      record = parsed.history;
      uploadedGpxTrack.value = parsed.track;
      showGpxOverlay.value = true;
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

  // 呼叫後端 Gemini 進行體能分析
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

  if (isGpxUpload) {
    return;
  }

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

// ── Voice Recording ────────────────────────────────
const voiceSupported = ref(false);
const voiceRecording = ref(false);
let mediaRecorder: MediaRecorder | null = null;
let mediaStream: MediaStream | null = null;
let mediaChunks: Blob[] = [];

onMounted(() => {
  voiceSupported.value = isVoiceInputSupported();
  scrollToBottom();
});

onBeforeUnmount(() => {
  stopVoiceCapture();
});

function isMediaRecorderSupported() {
  return Boolean(
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof window.MediaRecorder !== 'undefined',
  );
}

function isVoiceInputSupported() {
  return isMediaRecorderSupported();
}

function getSupportedAudioMimeType() {
  const types = ['audio/webm;codecs=opus', 'audio/webm'];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? '';
}

function openVoiceRecording() {
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
  voiceRecording.value = true;
  void startOverlayRecording();
}

async function startOverlayRecording() {
  if (mediaRecorder?.state === 'recording') return;
  const mimeType = getSupportedAudioMimeType();
  if (!isMediaRecorderSupported() || !mimeType) {
    voiceRecording.value = false;
    messages.value.push({
      id: Date.now(),
      role: 'bot',
      type: 'text',
      text: '目前瀏覽器不支援語音輸入，請改用文字輸入。',
      time: nowTime(),
    });
    return;
  }
  mediaChunks = [];
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) mediaChunks.push(event.data);
    };
    mediaRecorder.start(250);
  } catch (e) {
    console.warn('MediaRecorder error:', e);
    voiceRecording.value = false;
    messages.value.push({
      id: Date.now(),
      role: 'bot',
      type: 'text',
      text: '無法啟用麥克風，請確認瀏覽器權限。',
      time: nowTime(),
    });
  }
}

async function stopVoiceRecording() {
  if (!mediaRecorder || mediaRecorder.state !== 'recording') {
    voiceRecording.value = false;
    return;
  }

  // 在停止前先抓目前的對話歷史，避免計入新語音訊息
  const currentMessages = buildChatRequestMessages();

  const blobPromise = new Promise<Blob>((resolve) => {
    mediaRecorder!.onstop = () => {
      const mimeType = mediaChunks[0]?.type || 'audio/webm';
      resolve(new Blob(mediaChunks, { type: mimeType }));
      mediaStream?.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    };
  });

  mediaRecorder.stop();
  voiceRecording.value = false;

  const blob = await blobPromise;
  if (blob.size === 0) return;

  await sendVoiceBlob(blob, currentMessages);
}

function cancelVoiceRecording() {
  stopVoiceCapture();
  voiceRecording.value = false;
}

function stopVoiceCapture() {
  if (mediaRecorder?.state === 'recording') {
    mediaRecorder.stop();
  }
  mediaStream?.getTracks().forEach((track) => track.stop());
  mediaStream = null;
}

async function sendVoiceBlob(blob: Blob, currentMessages: ApiChatMessage[]) {
  quickReplies.value = [];
  typing.value = true;

  const formData = new FormData();
  formData.append('audio', blob, 'recording.webm');
  formData.append('messages', JSON.stringify(currentMessages));
  formData.append('history_context', historyContext.value);

  let transcribedText = '';
  let replyText = '語音辨識失敗，請再試一次。';
  let ready = false;
  let extractedProfile: Record<string, unknown> | null | undefined = null;

  try {
    const { data } = await api.post<{
      transcribed_text: string;
      reply: string;
      ready: boolean;
      extracted_profile?: Record<string, unknown> | null;
    }>('/ai/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    transcribedText = data.transcribed_text;
    replyText = data.reply;
    ready = data.ready;
    extractedProfile = data.extracted_profile;
  } catch (err) {
    console.error('[Voice API 失敗]', err);
    typing.value = false;
    messages.value.push({
      id: Date.now(),
      role: 'bot',
      type: 'text',
      text: '語音辨識失敗，請再試一次。',
      time: nowTime(),
    });
    return;
  }

  if (transcribedText.trim()) {
    messages.value.push({
      id: Date.now(),
      role: 'user',
      type: 'text',
      text: transcribedText,
      time: nowTime(),
    });
  }

  typing.value = false;
  messages.value.push({
    id: Date.now() + 1,
    role: 'bot',
    type: 'text',
    text: replyText,
    time: nowTime(),
  });

  const combinedText = `${historyContext.value}\n${transcribedText}`.trim();

  if (ready) {
    const aiRouteIds = Array.isArray(extractedProfile?.recommendedRouteIds)
      ? (extractedProfile!.recommendedRouteIds as string[])
      : undefined;
    const profile = extractedProfile
      ? normalizeExtractedProfile(extractedProfile, combinedText)
      : fallbackProfileFromText(combinedText, profileForm.value?.fitness ?? 3);
    await recommendRoutesFromProfile(profile, combinedText, aiRouteIds);
  }
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
const gearScoreColor = computed(() => {
  const score = gearAssessment.value?.score ?? 0;
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
});
const gearCount = computed(
  () => gearItems.value.filter((item) => gear[item.id]).length,
);
const canAssessGear = computed(
  () =>
    gearItems.value.length > 0 ||
    Boolean(visionRawText.value.trim()) ||
    Boolean(recognizedShoe.value),
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
  if (gearAssessing.value || !canAssessGear.value) return;
  if (visionMockMode.value) {
    applyMockGearAssessment();
    return;
  }
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
            distance_km: parseRouteNumber(selectedRoute.value.distance),
            estimated_hours: parseRouteNumber(selectedRoute.value.time),
            elevation_gain: Math.round(
              parseRouteNumber(selectedRoute.value.elevation),
            ),
            weather_risk: routeWeatherRisk.value,
          }
        : null,
      shoe: recognizedShoe.value,
      vision_raw_text: visionRawText.value || null,
      user_level: profileForm.value?.level ?? null,
      fitness: profileForm.value?.fitness ?? null,
      target_days: profileForm.value?.target_days ?? null,
    });
    gearAssessment.value = {
      score: data.score,
      level: data.level,
      summary: data.summary,
      tips: data.tips,
      suggested_items: data.suggested_items ?? [],
      model_used: data.model_used,
      fallback: data.fallback,
    };
  } catch (_) {
    assessGearListWithFallback();
  } finally {
    gearAssessing.value = false;
  }
}

function applyMockGearAssessment() {
  gearAssessment.value = {
    score: 65,
    level: '需要補強',
    summary:
      '裝備品質極佳且專業，但針對合歡東峰單日行程，攜帶過多露營裝備會增加不必要的負重與體能消耗，且缺乏關鍵的個人安全防護資訊。',
    tips: [
      '合歡東峰為單日往返行程，無需攜帶帳篷、睡袋、睡墊等過夜裝備，建議精簡背包以提升機動性與安全性。',
      '目前輸入資料中缺乏鞋款資訊，合歡東峰步道多為階梯與碎石，請務必確認穿著具備良好抓地力與支撐性的登山鞋或越野跑鞋。',
      '未見急救包(First Aid Kit)與離線地圖，即便路線熱門，仍需準備個人藥品、簡易包紮用品及下載離線地圖以防迷途。',
      '糧食攜帶量為2日份，對於單日行程而言過多，建議調整為高熱量行動糧即可。',
    ],
    suggested_items: [
      '個人急救包 (含個人藥品、OK繃、彈性繃帶)',
      '離線地圖 (如 Hikingbook 或 Gaia GPS)',
      '登山杖 (保護膝蓋，特別是下坡路段)',
      '身分證件與健保卡',
    ],
    model_used: 'gemini-2.0-flash',
    fallback: true,
  };
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
      : '請依路線天數、天氣與個人狀態再次檢查裝備。',
  ];

  gearAssessment.value = {
    score,
    level,
    summary: `目前 ${checkedItems.length}/${gearItems.value.length} 項已確認。這是本機保守 fallback 評估。`,
    tips,
    suggested_items: uncheckedItems.slice(0, 5).map((item) => item.label),
    model_used: 'local-fallback',
    fallback: true,
  };
}

const selectedRoute = ref<RecommendedRoute | null>(null);
const showGpxOverlay = ref(true);
const uploadedGpxTrack = ref<GpxMapTrack | null>(null);
const routeGpxTracks = ref<RouteGpxTrackOption[]>([]);
const routeGpxLoading = ref(false);
const selectedDbGpxTrackId = ref<number | null>(null);
const gpxScopeFilter = ref<'all' | 'trail' | 'peak'>('all');
const mapGpxInput = ref<HTMLInputElement | null>(null);

function toggleGpxOverlay() {
  showGpxOverlay.value = !showGpxOverlay.value;
}

function openMapGpxImport() {
  const input = mapGpxInput.value;
  if (!input) return;
  if (
    typeof (input as HTMLInputElement & { showPicker?: () => void })
      .showPicker === 'function'
  ) {
    (input as HTMLInputElement & { showPicker: () => void }).showPicker();
    return;
  }
  input.click();
}

function formatDuration(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const days = Math.floor(safeMinutes / (60 * 24));
  const hours = Math.floor((safeMinutes % (60 * 24)) / 60);
  const minutes = safeMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} 天`);
  if (hours > 0 || days > 0) parts.push(`${hours} 小時`);
  parts.push(`${minutes} 分`);

  return parts.join(' ');
}

function formatNullableDuration(totalMinutes: number | null) {
  return totalMinutes == null ? 'N/A' : formatDuration(totalMinutes);
}

const visibleRouteGpxTracks = computed(() =>
  routeGpxTracks.value.filter((track) => {
    if (gpxScopeFilter.value === 'all') return true;
    return track.match_scope === gpxScopeFilter.value;
  }),
);

function buildDatabaseTrack(track: RouteGpxTrackOption): GpxMapTrack {
  const routeDistanceKm =
    track.length_km ??
    track.points.reduce((sum, point, index) => {
      if (index === 0) return sum;
      const prev = track.points[index - 1]!;
      return sum + haversine(prev[0], prev[1], point[0], point[1]);
    }, 0);
  const elevationGain = track.elevation_gain_m ?? 0;
  let cumulativeDistance = 0;
  const syntheticPoints = track.points.map((point, index) => {
    if (index === 0) {
      return { lat: point[0], lon: point[1], ele: 0, time: null };
    }
    const prev = track.points[index - 1]!;
    cumulativeDistance += haversine(prev[0], prev[1], point[0], point[1]);
    return {
      lat: point[0],
      lon: point[1],
      ele:
        routeDistanceKm > 0
          ? (elevationGain * cumulativeDistance) / routeDistanceKm
          : null,
      time: null,
    };
  });

  const hintSegments = buildTrackHintSegments(syntheticPoints);
  return {
    name: track.label,
    trackId: track.gpx_track_id,
    matchScope: track.match_scope,
    points: track.points,
    segments: track.segments.length ? track.segments : [track.points],
    distanceKm: Math.round(routeDistanceKm * 10) / 10,
    elevationGain: Math.round(elevationGain),
    elevationLoss: null,
    durationMin: null,
    averageGradePct:
      routeDistanceKm > 0 && elevationGain
        ? Math.round((elevationGain / (routeDistanceKm * 1000)) * 100 * 10) / 10
        : null,
    source: 'database-gpx',
    hintSegments,
  };
}

const selectedDbGpxTrack = computed(() => {
  if (!visibleRouteGpxTracks.value.length) return null;
  const chosen =
    visibleRouteGpxTracks.value.find(
      (track) => track.gpx_track_id === selectedDbGpxTrackId.value,
    ) ?? visibleRouteGpxTracks.value[0];
  return chosen ?? null;
});

function buildPolylineFallbackTrack(route: RecommendedRoute): GpxMapTrack {
  const points = route.polyline as [number, number][];
  const distanceKm = parseFloat(route.distance) || 0;
  const elevationGain = parseInt(route.elevation) || 0;
  const durationMin = parseFloat(route.time) * 60 || null;
  return {
    name: route.name,
    points,
    segments: [points],
    matchScope: undefined,
    distanceKm,
    elevationGain,
    elevationLoss: null,
    durationMin,
    averageGradePct:
      distanceKm > 0 && elevationGain
        ? Math.round((elevationGain / (distanceKm * 1000)) * 100 * 10) / 10
        : null,
    source: 'route-polyline',
    hintSegments: [],
  };
}

const gpxMapTrack = computed<GpxMapTrack | null>(() => {
  if (uploadedGpxTrack.value) return uploadedGpxTrack.value;
  if (selectedDbGpxTrack.value)
    return buildDatabaseTrack(selectedDbGpxTrack.value);
  if (selectedRoute.value?.polyline?.length)
    return buildPolylineFallbackTrack(selectedRoute.value);
  return null;
});

async function loadRouteGpxTracks(route: RecommendedRoute | null) {
  routeGpxLoading.value = true;
  routeGpxTracks.value = [];
  selectedDbGpxTrackId.value = null;
  gpxScopeFilter.value = 'all';

  if (!route) {
    routeGpxLoading.value = false;
    return;
  }

  try {
    const { data } = await api.get<RouteGpxResponse>(`/routes/${route.id}/gpx`);
    routeGpxTracks.value = data.tracks;
    selectedDbGpxTrackId.value = data.tracks[0]?.gpx_track_id ?? null;
    if (
      !data.tracks.some((track) => track.match_scope === gpxScopeFilter.value)
    ) {
      gpxScopeFilter.value = 'all';
    }
  } catch (_) {
    routeGpxTracks.value = [];
  } finally {
    routeGpxLoading.value = false;
  }
}

watch(
  selectedRoute,
  async (route) => {
    uploadedGpxTrack.value = null;
    await loadRouteGpxTracks(route);
    if (!route) {
      gearAssessment.value = null;
      return;
    }

    await loadRouteWeather(route);
    if (canAssessGear.value) {
      await assessGearList();
    } else {
      gearAssessment.value = null;
    }
  },
  { immediate: true },
);

watch(
  visibleRouteGpxTracks,
  (tracks) => {
    if (!tracks.length) {
      selectedDbGpxTrackId.value = null;
      return;
    }
    if (
      !tracks.some((track) => track.gpx_track_id === selectedDbGpxTrackId.value)
    ) {
      selectedDbGpxTrackId.value = tracks[0]!.gpx_track_id;
    }
  },
  { immediate: true },
);

function parseRouteNumber(value: string) {
  const parsed = Number(value.replace(/,/g, '').match(/[\d.]+/)?.[0] ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

// ── Gemini vision scanner ─────────────────────────
const scanning = ref(false);
const scanned = ref(false);
const visionItems = ref<GearDetectItem[]>([]);
const visionRawText = ref('');
const showVisionMockToggle = false;
const visionMockMode = ref(false);
const showGearTodoList = false;
const gearPhotoInput = ref<HTMLInputElement>();
const gearPhotoUrl = ref('');
const gearPhotoLightbox = ref(false);
const lastDetectedGearIds = ref<Set<string>>(new Set());
const recognizedShoe = ref<ShoeRecognition | null>(null);

const MOCK_VISION_RAW_TEXT = `這是一張非常典型的長程徒步或登山裝備清單（Flat Lay），涵蓋了睡眠、衣物、烹飪與補給。以下為您辨識出的物品：

### 1. 睡眠與遮蔽系統
*   **睡袋 (右上角紅色/黑色)：** 壓縮袋裝的羽絨或化纖睡袋，品牌不明，用途為保暖睡眠。
*   **睡墊 (右下角黃色長條)：** **Big Agnes** 品牌，應為充氣式睡墊，適合高山露營。
*   **睡墊 (右下角銀色長條)：** **NEMO Switchback** 或類似的蛋巢式泡棉睡墊，提供基礎隔絕與緩衝。
*   **帳篷 (右下角黃色袋)：** **Big Agnes** 品牌，應為輕量化帳篷的外帳或營柱袋。

### 2. 衣物與配件
*   **帽子 (左上角)：** 深灰色棒球帽，品牌標誌疑似 **YAMA** (日本輕量化品牌)。
*   **雨衣/風衣 (右側橘黃色)：** **Arc'teryx (始祖鳥)** 的硬殼外套，具備極佳防水透氣性，適合惡劣氣候。
*   **毛帽 (右側橘紅色)：** **Fjällräven (小狐狸)** 針織帽，適合寒冷環境。
*   **底層衣物 (右側黑色)：** **Icebreaker** 美麗諾羊毛底層衣，具備控溫與抗臭功能。
*   **褲子 (右側黑色)：** **Montbell** 軟殼褲或登山褲，以及一件標示為 **Outdoor Rain Pants** 的防水雨褲。
*   **襪子 (中間)：** 兩雙羊毛登山襪，適合長途行走。
*   **手套 (右上)：** 黑色戶外手套，適合保暖或攀爬。

### 3. 烹飪與飲水
*   **爐具 (中間)：** **SOTO** 風魔爐或類似的瓦斯爐頭，搭配黑色鍋具。
*   **杯子 (中間下方)：** **Snow Peak** 鈦金屬杯。
*   **濾水器 (右下)：** **Sawyer Squeeze** 濾水器，用於過濾野外水源。
*   **水袋 (右下)：** **Platypus** 或類似品牌的軟式水袋。
*   **水瓶 (右側)：** 透明塑膠水瓶。

### 4. 雜項與電子設備
*   **頭燈 (左下)：** 黑色頭燈，品牌不明。
*   **行動電源/充電線 (左下)：** 黑色長方形行動電源與線材。
*   **雨傘 (中間)：** 黑色折疊傘，常見於輕量化徒步（如 Six Moon Designs 或 Montbell）。
*   **收納袋 (下方)：** 數個黑色網狀收納袋，用於分類裝備。
*   **毛巾 (中間)：** **Sea to Summit** Airlite 毛巾。
*   **頭巾 (中間)：** **Buff** 魔術頭巾。

### 5. 食物與補給
*   **乾燥食品 (左側)：** 包含多包乾燥飯、能量棒（Snickers）、Kid-O 餅乾、肉乾與麵條。這些是高熱量、輕量化的徒步補給。
*   **濕紙巾 (左側)：** 標示為「水潤」的濕紙巾。

---

### 不確定項目說明：
1.  **左上角藍色物體：** 摺疊得很整齊，可能是雨罩 (Rain Cover) 或輕便的風衣，因無明顯標誌無法確認。
2.  **中間的小公仔：** 是一個小型的金屬或塑膠擺飾，用途不明，可能是個人紀念品。
3.  **左側白色長條物：** 疑似是某種乾燥食品包裝或醫療包，因文字模糊無法確認內容物。

**總結：** 這是一套非常專業的「輕量化登山裝備」，適合多日高山縱走。裝備選擇多為戶外知名品牌（如 Arc'teryx, Big Agnes, Snow Peak, Icebreaker），具備良好的防水與保暖性能，適合台灣高山或國外長程步道（如 PCT, GR 系列）的環境。`;

const MOCK_VISION_ITEMS: GearDetectItem[] = [
  {
    name: '睡袋',
    detected: true,
    confidence: 0.92,
    brand: null,
    model: null,
    primary_use: '保暖睡眠',
    waterproof: null,
  },
  {
    name: '睡墊',
    detected: true,
    confidence: 0.9,
    brand: 'Big Agnes',
    model: null,
    primary_use: '高山露營睡眠隔絕',
    waterproof: null,
  },
  {
    name: '帳篷',
    detected: true,
    confidence: 0.86,
    brand: 'Big Agnes',
    model: null,
    primary_use: '遮蔽系統',
    waterproof: true,
  },
  {
    name: '雨衣',
    detected: true,
    confidence: 0.94,
    brand: "Arc'teryx",
    model: null,
    primary_use: '惡劣氣候防水防風',
    waterproof: true,
  },
  {
    name: '頭燈',
    detected: true,
    confidence: 0.84,
    brand: null,
    model: null,
    primary_use: '夜間照明',
    waterproof: null,
  },
  {
    name: '行動電源',
    detected: true,
    confidence: 0.82,
    brand: null,
    model: null,
    primary_use: '電子設備補電',
    waterproof: null,
  },
  {
    name: '濾水器',
    detected: true,
    confidence: 0.9,
    brand: 'Sawyer',
    model: 'Squeeze',
    primary_use: '野外水源過濾',
    waterproof: true,
  },
  {
    name: '水袋',
    detected: true,
    confidence: 0.88,
    brand: 'Platypus',
    model: null,
    primary_use: '補水',
    waterproof: true,
  },
  {
    name: '行動糧',
    detected: true,
    confidence: 0.9,
    brand: null,
    model: null,
    primary_use: '高熱量補給',
    waterproof: null,
  },
  {
    name: '手套',
    detected: true,
    confidence: 0.78,
    brand: null,
    model: null,
    primary_use: '保暖或攀爬',
    waterproof: null,
  },
];

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
  if (/^[{[]/.test(text)) {
    return `<pre><code>${escapeHtml(text)}</code></pre>`;
  }

  const lines = text.split(/\r?\n/);
  const html: string[] = [];
  let listOpen = false;
  let codeOpen = false;
  const paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
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
      flushParagraph();
      closeList();
      html.push(codeOpen ? '</code></pre>' : '<pre><code>');
      codeOpen = !codeOpen;
      continue;
    }
    if (codeOpen) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }
    if (!trimmed) {
      flushParagraph();
      closeList();
      continue;
    }
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1]!.length + 2;
      html.push(`<h${level}>${renderInlineMarkdown(heading[2]!)}</h${level}>`);
      continue;
    }
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      if (!listOpen) {
        html.push('<ul>');
        listOpen = true;
      }
      html.push(`<li>${renderInlineMarkdown(bullet[1]!)}</li>`);
      continue;
    }
    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (!listOpen) {
        html.push('<ul>');
        listOpen = true;
      }
      html.push(`<li>${renderInlineMarkdown(ordered[1]!)}</li>`);
      continue;
    }
    closeList();
    paragraph.push(line);
  }

  flushParagraph();
  closeList();
  if (codeOpen) html.push('</code></pre>');
  return html.join('');
}

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
  if (visionMockMode.value) {
    applyMockVisionResult();
    return;
  }
  gearPhotoInput.value?.click();
}

function toggleVisionMockMode() {
  return;
}

function applyMockVisionResult() {
  return;
}

function resetGearScan() {
  if (scanning.value) return;
  removeLastDetectedGearItems();
  scanned.value = false;
  visionItems.value = [];
  visionRawText.value = '';
  recognizedShoe.value = null;
  if (gearPhotoUrl.value.startsWith('blob:'))
    URL.revokeObjectURL(gearPhotoUrl.value);
  gearPhotoUrl.value = '';
  gearPhotoLightbox.value = false;
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
  if (!file || scanning.value) {
    input.value = '';
    return;
  }

  // 儲存照片預覽（釋放舊的）
  if (gearPhotoUrl.value) URL.revokeObjectURL(gearPhotoUrl.value);
  gearPhotoUrl.value = URL.createObjectURL(file);
  input.value = '';

  scanning.value = true;
  scanned.value = false;
  visionRawText.value = '';
  recognizedShoe.value = null;
  try {
    const form = new FormData();
    form.append('image', file);
    const { data } = await api.post<GearDetectResponse>('/gear/detect', form, {
      timeout: 30000,
    });

    recognizedShoe.value = data.shoe ?? null;
    visionRawText.value = data.raw_text?.trim() ?? '';
    const detectedItems = data.items.filter((item) => item.detected);
    detectedItems.forEach((item) => {
      addDetectedGearItem(gearItemFromDetectedLabel(item.name));
    });
    visionItems.value = detectedItems;
    if (visionItems.value.length === 0 && !visionRawText.value) {
      visionItems.value = [
        { name: '未偵測到裝備', detected: false, confidence: 0 },
      ];
    }
  } catch (_) {
    visionRawText.value = '';
    visionItems.value = [];
  } finally {
    scanning.value = false;
    scanned.value = true;
    void assessGearList();
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
    fallback_reason: '已切回本地假資料，未呼叫 Gemini / CWA。',
  };
}

const weather: WeatherPeriod[] = [];

const routeWeather = ref<RouteWeatherResponse | null>(null);
const weatherLoading = ref(false);
const weatherFallbackReason = ref<string | null>(null);
const offlinePackageDownloading = ref(false);
const displayedWeather = computed<WeatherPeriod[]>(() =>
  routeWeather.value?.periods?.length ? routeWeather.value.periods : [],
);
const weatherAdvice = computed(
  () =>
    routeWeather.value?.advice ??
    '目前沒有可用的天氣資料，請直接以最新官方預報與現場狀況為準。',
);
const routeWeatherRisk = computed<'low' | 'medium' | 'high'>(() => {
  const text = `${routeWeather.value?.advice ?? ''} ${displayedWeather.value
    .map((period) => `${period.condition} ${period.rain_probability ?? ''}`)
    .join(' ')}`;
  if (/雷|豪雨|大雨|高風險|推遲|延後/.test(text)) return 'high';
  if (/雨|霧|風|40%|50%|60%/.test(text)) return 'medium';
  return 'low';
});
const weatherAiStatusLabel = computed(() => {
  if (weatherLoading.value) return 'Gemini 檢查中...';
  if (!routeWeather.value) return '尚無天氣資料';
  if (
    routeWeather.value.fallback_stage === 'gemini' ||
    routeWeather.value.model_used === 'fallback'
  ) {
    return 'Gemini 失敗，無可用資料';
  }
  if (routeWeather.value.fallback_stage === 'cwa') {
    return 'CWA 暫不可用';
  }
  if (
    routeWeather.value.model_used &&
    routeWeather.value.model_used !== 'mock'
  ) {
    return 'Gemini 成功';
  }
  return 'Gemini 狀態未確認';
});
const weatherFallbackReasonText = computed(() =>
  (() => {
    if (!routeWeather.value) return weatherFallbackReason.value;
    if (routeWeather.value.fallback_stage === 'gemini') {
      return routeWeather.value.fallback_reason ?? weatherFallbackReason.value;
    }
    if (routeWeather.value.fallback_stage === 'cwa') {
      return 'CWA 暫時無法取得即時資料。';
    }
    return routeWeather.value.fallback_reason ?? weatherFallbackReason.value;
  })(),
);
const weatherModelDisplay = computed(() => {
  const m = routeWeather.value?.model_used;
  if (!m || m === 'fallback' || m === 'local-fallback') return null;
  if (m.startsWith('gemini')) return 'gemini';
  return m;
});
const weatherAiStatusClass = computed(() => ({
  success:
    weatherMode.value === 'gemini' &&
    !!routeWeather.value &&
    routeWeather.value.fallback_stage !== 'gemini' &&
    routeWeather.value.model_used !== 'fallback' &&
    routeWeather.value.model_used !== 'mock',
  warning:
    weatherMode.value === 'gemini' &&
    (!routeWeather.value ||
      routeWeather.value.fallback_stage === 'gemini' ||
      routeWeather.value.model_used === 'fallback' ||
      routeWeather.value.model_used === 'mock'),
  mock: weatherMode.value === 'mock',
}));

async function loadRouteWeather(route: RecommendedRoute) {
  weatherLoading.value = true;
  routeWeather.value = null;
  weatherFallbackReason.value = null;
  try {
    const { data } = await api.post<RouteWeatherResponse>('/weather/forecast', {
      route_name: route.name,
      location: route.region,
      risk: route.risk,
      difficulty: routeDifficulty(route),
      days: route.minDays,
    });
    routeWeather.value = data;
    weatherFallbackReason.value = data.fallback_reason ?? null;
  } catch (_) {
    routeWeather.value = null;
    weatherFallbackReason.value = 'Gemini / CWA 請求失敗，無法取得天氣資料。';
  } finally {
    weatherLoading.value = false;
  }
}

function toggleWeatherMode() {
  if (selectedRoute.value) {
    void (async () => {
      await loadRouteWeather(selectedRoute.value);
      if (canAssessGear.value) {
        await assessGearList();
      }
    })();
  }
}

watch(
  visibleRecommendedRouteCards,
  (cards) => {
    const visibleRouteIds = new Set(
      cards.flatMap((card) => (card.source?.id ? [card.source.id] : [])),
    );
    if (selectedRoute.value && !visibleRouteIds.has(selectedRoute.value.id)) {
      selectedRoute.value = null;
      planningRevealed.value = false;
      routeWeather.value = null;
    }
  },
  { immediate: true },
);

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildGpxXml(
  routeName: string,
  trackPoints: [number, number][],
  desc: string,
) {
  const gpxPoints = trackPoints
    .map(
      ([lat, lon], index) => `
        <trkpt lat="${lat}" lon="${lon}">
          <name>${escapeXml(routeName)}-${index + 1}</name>
        </trkpt>`,
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="KaoShan" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(routeName)} GPX</name>
    <desc>${escapeXml(desc)}</desc>
  </metadata>
  <trk>
    <name>${escapeXml(routeName)} GPX</name>
    <trkseg>${gpxPoints}
    </trkseg>
  </trk>
  </gpx>`;
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function downloadCurrentGpx() {
  const track = gpxMapTrack.value;
  if (!track || !selectedRoute.value) return;

  const xml = buildGpxXml(
    track.name || selectedRoute.value.name,
    track.points,
    selectedRoute.value.highlight,
  );
  const blob = new Blob([xml], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFileName(selectedRoute.value.name || selectedRoute.value.id)}.gpx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function buildTileManifest(trackPoints: [number, number][]) {
  if (!trackPoints.length) {
    return {
      source: 'browser-indexeddb',
      zoom_range: [10, 15],
      point_count: 0,
      bbox: null,
      center: null,
      tile_keys: [],
    };
  }

  const lats = trackPoints.map(([lat]) => lat);
  const lons = trackPoints.map(([, lon]) => lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const bbox = { minLat, maxLat, minLon, maxLon };
  const center = [
    Math.round(((minLat + maxLat) / 2) * 1e6) / 1e6,
    Math.round(((minLon + maxLon) / 2) * 1e6) / 1e6,
  ] as [number, number];

  const lon2tile = (lon: number, z: number) =>
    Math.floor(((lon + 180) / 360) * 2 ** z);
  const lat2tile = (lat: number, z: number) => {
    const rad = (lat * Math.PI) / 180;
    return Math.floor(
      ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
        2 ** z,
    );
  };

  const keys: string[] = [];
  for (let z = 10; z <= 15; z += 1) {
    const xMin = lon2tile(minLon, z);
    const xMax = lon2tile(maxLon, z);
    const yMin = lat2tile(maxLat, z);
    const yMax = lat2tile(minLat, z);
    for (let x = xMin; x <= xMax; x += 1) {
      for (let y = yMin; y <= yMax; y += 1) {
        keys.push(`${z}/${x}/${y}`);
        if (keys.length >= 1000) {
          return {
            source: 'browser-indexeddb',
            zoom_range: [10, 15],
            point_count: trackPoints.length,
            bbox,
            center,
            tile_keys: keys,
            truncated: true,
          };
        }
      }
    }
  }

  return {
    source: 'browser-indexeddb',
    zoom_range: [10, 15],
    point_count: trackPoints.length,
    bbox,
    center,
    tile_keys: keys,
    truncated: false,
  };
}

type OfflineZipEntry = {
  path: string;
  data: Uint8Array;
  date?: Date;
};

const textEncoder = new TextEncoder();

function toUtf8Bytes(value: string) {
  return textEncoder.encode(value);
}

function concatPath(...segments: string[]) {
  return segments
    .flatMap((segment) => segment.split('/'))
    .filter(Boolean)
    .join('/');
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let j = 0; j < 8; j += 1) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ bytes[i]!) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    (date.getSeconds() >> 1);
  const dosDate =
    ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

function buildZipLocalHeader(
  nameBytes: Uint8Array,
  crc: number,
  size: number,
  date: Date,
) {
  const header = new Uint8Array(30 + nameBytes.length);
  const view = new DataView(header.buffer);
  const { dosTime, dosDate } = dosDateTime(date);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, dosTime, true);
  view.setUint16(12, dosDate, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, size, true);
  view.setUint32(22, size, true);
  view.setUint16(26, nameBytes.length, true);
  view.setUint16(28, 0, true);
  header.set(nameBytes, 30);
  return header;
}

function buildZipCentralHeader(
  nameBytes: Uint8Array,
  crc: number,
  size: number,
  date: Date,
  offset: number,
) {
  const header = new Uint8Array(46 + nameBytes.length);
  const view = new DataView(header.buffer);
  const { dosTime, dosDate } = dosDateTime(date);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, dosTime, true);
  view.setUint16(14, dosDate, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, size, true);
  view.setUint32(24, size, true);
  view.setUint16(28, nameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, offset, true);
  header.set(nameBytes, 46);
  return header;
}

function buildZipEndRecord(
  entryCount: number,
  centralSize: number,
  centralOffset: number,
) {
  const footer = new Uint8Array(22);
  const view = new DataView(footer.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  view.setUint16(20, 0, true);
  return footer;
}

async function buildZipBlob(entries: OfflineZipEntry[]) {
  const parts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const normalizedPath = concatPath(entry.path);
    const nameBytes = toUtf8Bytes(normalizedPath);
    const data = entry.data;
    const date = entry.date ?? new Date();
    const crc = crc32(data);
    const localHeader = buildZipLocalHeader(nameBytes, crc, data.length, date);
    const centralHeader = buildZipCentralHeader(
      nameBytes,
      crc,
      data.length,
      date,
      offset,
    );

    parts.push(localHeader, data);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = buildZipEndRecord(entries.length, centralSize, offset);

  return new Blob([...parts, ...centralParts, endRecord], {
    type: 'application/zip',
  });
}

async function collectTileEntries(tileKeys: string[]) {
  if (!tileKeys.length) {
    return {
      entries: [] as OfflineZipEntry[],
      missingKeys: [] as string[],
    };
  }

  const tileRecords = await kaoshanDB.tiles.bulkGet(tileKeys);
  const entries: OfflineZipEntry[] = [];
  const missingKeys: string[] = [];

  for (let index = 0; index < tileKeys.length; index += 1) {
    const key = tileKeys[index]!;
    const record = tileRecords[index];
    if (!record?.blob) {
      missingKeys.push(key);
      continue;
    }
    entries.push({
      path: `tiles/${key}.png`,
      data: new Uint8Array(await record.blob.arrayBuffer()),
    });
  }

  return { entries, missingKeys };
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
    const track = gpxMapTrack.value;
    const routePoints = track?.points?.length
      ? track.points
      : (selectedRoute.value.polyline as [number, number][]);
    const tilePoints = routePoints.map(
      ([lat, lon]) => [lon, lat] as [number, number],
    );
    await cacheTilesForRoute(tilePoints);

    const gpxXml = buildGpxXml(
      selectedRoute.value.name,
      routePoints,
      selectedRoute.value.highlight,
    );
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
      route_id: selectedRoute.value.id,
      user_id: auth.profile?.userId ?? 'guest',
      created_at: new Date().toISOString(),
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
      tiles_manifest: buildTileManifest(routePoints),
    };

    const tileManifest = packagePayload.tiles_manifest as ReturnType<
      typeof buildTileManifest
    >;
    const { entries: tileEntries, missingKeys } = await collectTileEntries(
      tileManifest.tile_keys,
    );
    const baseEntries: OfflineZipEntry[] = [
      {
        path: 'manifest.json',
        data: toUtf8Bytes(
          JSON.stringify(
            {
              bundle_version: '1.0',
              route_id: packagePayload.route_id,
              user_id: packagePayload.user_id,
              created_at: packagePayload.created_at,
              files: [
                'manifest.json',
                'route.json',
                `gpx/${selectedRoute.value.id}.gpx`,
                'gear.json',
                'ai_risk_assessment.json',
                'emergency.json',
                'tiles_manifest.json',
              ],
              notes: [
                'GPX 與路線資料會隨包輸出。',
                '地圖圖磚會一併匯出為 tiles/*.png。',
              ],
            },
            null,
            2,
          ),
        ),
      },
      {
        path: 'route.json',
        data: toUtf8Bytes(JSON.stringify(packagePayload.route, null, 2)),
      },
      {
        path: `gpx/${selectedRoute.value.id}.gpx`,
        data: toUtf8Bytes(packagePayload.gpx.xml),
      },
      {
        path: 'gear.json',
        data: toUtf8Bytes(JSON.stringify(packagePayload.gear, null, 2)),
      },
      {
        path: 'ai_risk_assessment.json',
        data: toUtf8Bytes(
          JSON.stringify(packagePayload.ai_risk_assessment, null, 2),
        ),
      },
      {
        path: 'emergency.json',
        data: toUtf8Bytes(JSON.stringify(packagePayload.emergency, null, 2)),
      },
      {
        path: 'tiles_manifest.json',
        data: toUtf8Bytes(
          JSON.stringify(
            {
              ...tileManifest,
              cached_tile_count: tileEntries.length,
              missing_tile_count: missingKeys.length,
              missing_tile_keys: missingKeys,
              included_tile_count: tileEntries.length,
            },
            null,
            2,
          ),
        ),
      },
    ];
    const zipBlob = await buildZipBlob([...baseEntries, ...tileEntries]);
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kaoshan-offline-${selectedRoute.value.id}.zip`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  } finally {
    offlinePackageDownloading.value = false;
  }
}
</script>

<style scoped>
/* ── Voice Overlay ── */
/* Voice inline status bar */
.line-input-wrap {
  display: flex;
  flex-direction: column;
}

.voice-status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  background: rgba(6, 199, 85, 0.08);
  border-bottom: 1px solid rgba(6, 199, 85, 0.2);
}

.voice-status-waves {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 16px;
}

.voice-status-dot {
  display: block;
  width: 3px;
  border-radius: 2px;
  background: #06c755;
  animation: voice-status-bounce 0.7s ease-in-out infinite alternate;
  height: 8px;
}

.voice-status-dot:nth-child(1) {
  animation-duration: 0.5s;
}
.voice-status-dot:nth-child(2) {
  animation-duration: 0.8s;
}
.voice-status-dot:nth-child(3) {
  animation-duration: 0.6s;
}
.voice-status-dot:nth-child(4) {
  animation-duration: 0.9s;
}

@keyframes voice-status-bounce {
  from {
    height: 3px;
  }
  to {
    height: 14px;
  }
}

.voice-status-label {
  font-size: 0.75rem;
  color: #06c755;
  font-weight: 600;
  letter-spacing: 0.03rem;
  flex: 1;
}

.voice-status-cancel {
  background: none;
  border: none;
  color: #999;
  font-size: 0.72rem;
  font-family: inherit;
  cursor: pointer;
  padding: 0 2px;
}

.voice-status-cancel:hover {
  color: #e53935;
}

/* Mic button active state */
.voice-btn-active {
  animation: voice-btn-pulse 1.2s ease-in-out infinite;
}

@keyframes voice-btn-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
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
  /* min-height: clamp(520px, 72vh, 760px); */
  max-height: 82vh;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
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
  border-radius: 0 0 16px 16px;
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
  font-size: 0.8rem;
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
  font-size: 0.8rem;
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

.gear-assessment-card {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 14px;
  border: 1px solid rgba(6, 199, 85, 0.2);
  border-radius: 16px;
  background:
    linear-gradient(135deg, rgba(6, 199, 85, 0.1), rgba(14, 165, 233, 0.08)),
    var(--bg-card);
}

.gear-score-ring {
  position: relative;
  width: 96px;
  height: 96px;
  color: var(--gear-score-color, var(--summit-accent));
}

.gear-score-ring svg {
  width: 96px;
  height: 96px;
  transform: rotate(-90deg);
}

.gear-score-track,
.gear-score-bar {
  fill: none;
  stroke-width: 9;
}

.gear-score-track {
  stroke: rgba(148, 163, 184, 0.24);
}

.gear-score-bar {
  stroke: currentColor;
  stroke-linecap: round;
  transition:
    stroke-dashoffset 0.45s ease,
    stroke 0.2s ease;
}

.gear-score-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  line-height: 1;
  color: var(--text-primary);
}

.gear-score-label strong {
  font-size: 1.5rem;
  font-weight: 950;
}

.gear-score-label span {
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.68rem;
  font-weight: 800;
}

.gear-assessment-copy {
  min-width: 0;
}

.gear-assessment-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 5px;
}

.gear-assessment-title {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 900;
}

.gear-assessment-model {
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(6, 199, 85, 0.12);
  color: var(--summit-accent);
  font-size: 0.66rem;
  font-weight: 850;
}

.gear-assessment-text {
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.55;
}

.gear-assessment-list {
  margin: 9px 0 0;
  padding-left: 18px;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.55;
}

.gear-assessment-list li {
  margin-bottom: 4px;
}

.gear-suggested-box {
  margin-top: 12px;
}

.gear-suggested-title {
  margin-bottom: 12px;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 850;
}

.gear-suggested-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 8px;
}

.gear-suggested-chip {
  padding: 5px 10px;
  border-radius: 10px;
  background: rgba(251, 146, 60, 0.12);
  color: var(--risk-mid);
  font-size: 0.8rem;
  font-weight: 850;
}

@media (max-width: 420px) {
  .gear-assessment-card {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .gear-assessment-copy {
    width: 100%;
  }
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
  margin-top: 12px;
  padding: 8px 10px;
  background: rgba(251, 146, 60, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(251, 146, 60, 0.25);
  font-size: 0.9rem;
  color: var(--risk-mid);
  font-weight: 600;
}

.weather-fallback-note {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(217, 119, 6, 0.08);
  border: 1px solid rgba(217, 119, 6, 0.18);
  font-size: 0.72rem;
  line-height: 1.55;
  color: var(--text-muted);
}

.weather-source {
  margin-top: 10px;
  font-size: 0.66rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.weather-model-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(79, 172, 91, 0.15);
  color: #4fac5b;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.03em;
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
  font-size: 1.1rem;
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
  background: rgba(6, 199, 85, 0.08);
  border: 1px solid rgba(6, 199, 85, 0.22);
  color: var(--text-secondary);
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
  overflow: hidden;
  flex-shrink: 0;
}

.line-bot-avatar-image {
  width: 100%;
  height: 95%;
  display: block;
  object-fit: cover;
  margin-top: 3px;
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
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

.ai-mode-gemini {
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
  background: rgb(84 146 92);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  align-self: flex-end;
}

.msg-bot-icon-image {
  width: 100%;
  height: 88%;
  display: block;
  object-fit: cover;
  margin-top: 4px;
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

.vision-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.vision-mock-toggle {
  height: 30px;
  min-width: 72px;
  border: 1px solid rgba(6, 199, 85, 0.24);
  background: rgba(6, 199, 85, 0.08);
  color: var(--summit-accent);
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 850;
  padding: 0 10px;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}

.vision-mock-toggle:hover {
  background: rgba(6, 199, 85, 0.14);
}

.vision-mock-toggle-on {
  background: #06c755;
  border-color: #06c755;
  color: #fff;
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
  background: #0a1a0e;
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 12px;
  width: 100%;
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

.yolo-scanned-title {
  font-size: 0.8rem;
  color: var(--summit-accent);
  font-weight: 700;
  margin-bottom: 12px;
}

.gear-photo-thumb {
  display: block;
  width: 100%;
  max-height: 220px;
  object-fit: contain;
  border-radius: 10px;
  margin-bottom: 12px;
  cursor: zoom-in;
  border: 1px solid rgba(34, 197, 94, 0.25);
  transition: opacity 0.15s;
  padding: 10px 0;
}

.gear-photo-thumb:hover {
  opacity: 0.88;
}

.gear-photo-lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}

.gear-photo-lightbox-img {
  max-width: 92vw;
  max-height: 88vh;
  border-radius: 12px;
  object-fit: contain;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
  cursor: default;
}

.gear-photo-lightbox-close {
  position: absolute;
  top: 20px;
  right: 24px;
  background: rgba(255, 255, 255, 0.12);
  border: none;
  color: #fff;
  font-size: 1.2rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background 0.15s;
}

.gear-photo-lightbox-close:hover {
  background: rgba(255, 255, 255, 0.25);
}

.yolo-area-scanned {
  min-height: auto;
}

.vision-result-list {
  display: grid;
  gap: 10px;
}

@media (min-width: 768px) {
  .vision-result-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.vision-item-card {
  padding: 10px;
  border: 1px solid rgba(6, 199, 85, 0.18);
  border-radius: 14px;
  background: rgba(6, 199, 85, 0.06);
}

.vision-raw-text {
  padding: 12px;
  border: 1px solid rgba(6, 199, 85, 0.18);
  border-radius: 14px;
  background:
    linear-gradient(135deg, rgba(6, 199, 85, 0.1), rgba(14, 165, 233, 0.08)),
    var(--bg-card);
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.vision-raw-text :deep(p) {
  margin: 0 0 8px;
}

.vision-raw-text :deep(p:last-child) {
  margin-bottom: 0;
}

.vision-raw-text :deep(h3),
.vision-raw-text :deep(h4),
.vision-raw-text :deep(h5) {
  margin: 0 0 8px;
  color: var(--text-primary);
  font-size: 0.94rem;
  font-weight: 900;
  line-height: 1.35;
}

.vision-raw-text :deep(ul) {
  margin: 0 0 8px;
  padding-left: 18px;
}

.vision-raw-text :deep(li) {
  margin-bottom: 4px;
}

.vision-raw-text :deep(strong) {
  font-weight: 900;
}

.vision-raw-text :deep(code) {
  padding: 1px 4px;
  border-radius: 5px;
  background: rgba(15, 23, 42, 0.08);
  font-size: 0.78rem;
}

.vision-raw-text :deep(pre) {
  margin: 0;
  padding: 10px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.08);
  overflow-x: auto;
  white-space: pre-wrap;
}

.vision-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.vision-item-name {
  font-size: 0.9rem;
  font-weight: 900;
  color: var(--text-primary);
}

.vision-item-conf {
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 900;
  color: #06c755;
}

.vision-item-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 10px;
  row-gap: 5px;
  font-size: 0.76rem;
  line-height: 1.45;
}

.vision-item-grid span {
  color: var(--text-muted);
  font-weight: 700;
}

.vision-item-grid strong {
  min-width: 0;
  color: var(--text-primary);
  font-weight: 800;
  overflow-wrap: anywhere;
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

.route-source-badge {
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02rem;
  flex-shrink: 0;
}

.route-category-badge {
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.02rem;
  flex-shrink: 0;
}

.source-trail {
  background: rgba(26, 140, 85, 0.12);
  color: var(--summit-accent);
  border: 1px solid rgba(26, 140, 85, 0.22);
}

.source-peak {
  background: rgba(91, 76, 245, 0.12);
  color: var(--risk-mid);
  border: 1px solid rgba(91, 76, 245, 0.22);
}

.category-trail {
  background: rgba(26, 140, 85, 0.1);
  color: var(--summit-accent);
  border: 1px solid rgba(26, 140, 85, 0.18);
}

.category-small-peak {
  background: rgba(11, 147, 82, 0.12);
  color: #0b9352;
  border: 1px solid rgba(11, 147, 82, 0.22);
}

.category-peak {
  background: rgba(91, 76, 245, 0.12);
  color: var(--risk-mid);
  border: 1px solid rgba(91, 76, 245, 0.22);
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
  font-size: 0.9rem;
}

.route-action-btn:hover {
  opacity: 0.85;
}

.route-action-ghost {
  background: transparent !important;
  border: 1px solid rgb(12 48 42) !important;
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
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: 0.06rem;
  margin-bottom: 6px;
}

.offline-download-desc {
  font-size: 0.9rem;
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
