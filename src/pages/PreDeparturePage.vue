<template>
  <div class="p1-grid" :class="{ 'has-map': !!selectedRoute }">
    <aside class="p1-sidebar">
      <PreChatPanel
        :messages="messages"
        :typing="typing"
        :collapsed="chatCollapsed"
        :logo-url="logoUrl"
        :voice-recording="voiceRecording"
        :show-ai-mode-toggle="showAiModeToggle"
        :ai-chat-mode="aiChatMode"
        :recommendations-visible="recommendationsVisible"
        :show-contacts="showContacts"
        :contacts="contacts"
        :selected-route-id="selectedRoute?.id"
        :theme="appStore.config.theme"
        @send="sendUserMsg"
        @reset="resetChatConversation"
        @collapse="toggleChatCollapsed"
        @file-upload="onFileUpload"
        @cancel-voice="cancelVoiceRecording"
        @toggle-ai-mode="toggleAiChatMode"
        @notify-contact="notifyContact"
        @select-route="selectRecommendedRoute"
        @more-route="askMoreAboutRoute"
      />

      <PreRecommendationPanel
        v-if="recommendationsVisible"
        :demand-summary="demandSummary"
        :cards="visibleRecommendedRouteCards"
        :selected-route-id="selectedRoute?.id"
        :rerolling="rerollingRecommendations"
        @select="selectRecommendedRoute"
        @more="askMoreAboutRoute"
        @reroll="rerollRecommendations"
      />

      <PreWeatherCard
        v-if="planningRevealed"
        :periods="displayedWeather"
        :advice="weatherAdvice"
        :loading="weatherLoading"
        :location-name="routeWeather?.location_name"
        :source="routeWeather?.source"
        :fallback-reason-text="weatherFallbackReasonText"
      />

      <PreGearScanCard
        v-if="planningRevealed"
        :scanning="scanning"
        :scanned="scanned"
        :photo-url="gearPhotoUrl"
        :assessment="gearAssessment"
        :vision-raw-text="visionRawText"
        :gear-score-circumference="gearScoreCircumference"
        :gear-score-dash-offset="gearScoreDashOffset"
        :gear-score-color="gearScoreColor"
        @select-file="onGearPhotoSelected"
        @reset="resetGearScan"
      />

      <PreGearChecklist
        v-if="planningRevealed && showGearTodoList"
        :items="gearItems"
        :checked="gear"
        @add="onGearAdd"
        @remove="removeGear"
        @toggle="onGearToggle"
      />
    </aside>

    <Transition name="p1-map">
      <PreRouteMapArea
        v-if="selectedRoute"
        :route="selectedRoute"
        :gpx-track="gpxMapTrack"
        :show-gpx-overlay="showGpxOverlay"
        :theme="appStore.config.theme"
        :route-map-location="routeMapLocation"
        :route-map-location-label="routeMapLocationLabel"
        :route-gpx-loading="routeGpxLoading"
        @import-gpx="onFileUpload"
        @download-gpx="downloadCurrentGpx"
        @toggle-gpx="toggleGpxOverlay"
      />
    </Transition>
  </div>

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
import PreChatPanel from 'src/components/pre/PreChatPanel.vue';
import PreGearChecklist from 'src/components/pre/PreGearChecklist.vue';
import PreGearScanCard from 'src/components/pre/PreGearScanCard.vue';
import PreRecommendationPanel from 'src/components/pre/PreRecommendationPanel.vue';
import PreRouteMapArea from 'src/components/pre/PreRouteMapArea.vue';
import PreWeatherCard from 'src/components/pre/PreWeatherCard.vue';
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
  location_hint?: RouteLocationHint | null;
}

interface RouteLocationHint {
  label: string;
  lat: number;
  lon: number;
  source: 'database' | 'keyword' | 'gemini' | 'region';
  confidence?: number | null;
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
    text: `您好${auth.profile?.displayName ? '，' + auth.profile.displayName : ''}！我是 KaoShan 助理\n\n您可以用兩種方式開始規劃：\n1. 直接聊天：告訴我體力、登山經驗和想走幾天。\n2. 上傳紀錄：上傳 GPX / JSON 登山紀錄，我會分析距離、爬升與體能表現。\n\n我會依照這些資料幫您推薦適合的路線。`,
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
    diversifyByRegion(getSimilarRouteCandidates(routes, profile)),
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

  const targetDays = profile?.target_days ?? Math.min(...normalizedRoutes.map((r) => r.minDays ?? 1));
  summary.days = targetDays >= 2 ? `${targetDays} 天行程` : '1 日行程';

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

function diversifyByRegion(routes: RecommendedRoute[], maxPerRegion = 6): RecommendedRoute[] {
  const regionCount = new Map<string, number>();
  return routes.filter((route) => {
    const region = (route.region ?? '').split('｜')[0]?.trim() || '未知';
    const count = regionCount.get(region) ?? 0;
    if (count >= maxPerRegion) return false;
    regionCount.set(region, count + 1);
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

async function selectRecommendedRoute(card: RouteCard) {
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
    void selectRecommendedRoute(dialogRouteCard.value);
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
const routeGpxMissing = ref(false);
const routeGpxLocationHint = ref<RouteLocationHint | null>(null);
const selectedDbGpxTrackId = ref<number | null>(null);
const gpxScopeFilter = ref<'all' | 'trail' | 'peak'>('all');
const mapGpxInput = ref<HTMLInputElement | null>(null);
let routeGpxRequestSeq = 0;

const REGION_CENTER_FALLBACK: Array<[string, [number, number]]> = [
  ['台北市', [25.033, 121.5654]],
  ['新北市', [25.012, 121.465]],
  ['桃園市', [24.9936, 121.301]],
  ['新竹市', [24.8138, 120.9675]],
  ['新竹縣', [24.8389, 121.0119]],
  ['苗栗縣', [24.5602, 120.8214]],
  ['台中市', [24.1477, 120.6736]],
  ['彰化縣', [24.0685, 120.5579]],
  ['南投縣', [23.9097, 120.6858]],
  ['雲林縣', [23.7092, 120.4313]],
  ['嘉義市', [23.4801, 120.4491]],
  ['嘉義縣', [23.4518, 120.2552]],
  ['台南市', [23.0395, 120.2269]],
  ['高雄市', [22.6273, 120.3014]],
  ['屏東縣', [22.5516, 120.5487]],
  ['台東市', [22.7583, 121.1444]],
  ['台東縣', [22.7583, 121.1444]],
  ['花蓮市', [23.9871, 121.6019]],
  ['花蓮縣', [23.9872, 121.6015]],
  ['宜蘭市', [24.7512, 121.753]],
  ['宜蘭縣', [24.7021, 121.7378]],
  ['澎湖縣', [23.5659, 119.6151]],
  ['金門縣', [24.4381, 118.3188]],
  ['連江縣', [26.1591, 119.9515]],
];

function extractRegionKey(region: string | null | undefined) {
  if (!region) return '';
  return (
    region
      .split(/[｜|／/、,，\s]/)
      .map((part) => part.trim())
      .find(Boolean) ?? region.trim()
  );
}

function resolveRouteFallbackLocation(
  route: RecommendedRoute | null,
): [number, number] | null {
  if (!route) return null;
  if (route.center?.length === 2) return route.center;
  const regionKey = extractRegionKey(route.region);
  const entry = REGION_CENTER_FALLBACK.find(([key]) => regionKey.includes(key));
  return entry?.[1] ?? null;
}

function resolveRouteLocationLabel(route: RecommendedRoute | null) {
  if (!route) return null;
  if (!routeGpxMissing.value) return route.name;
  const regionKey = extractRegionKey(route.region);
  return regionKey || '路線所在位置或地區';
}

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

const gpxMapTrack = computed<GpxMapTrack | null>(() => {
  if (uploadedGpxTrack.value) return uploadedGpxTrack.value;
  if (selectedDbGpxTrack.value)
    return buildDatabaseTrack(selectedDbGpxTrack.value);
  return null;
});

const routeMapLocation = computed<[number, number] | null>(() => {
  if (!routeGpxMissing.value) return null;
  const hint = routeGpxLocationHint.value;
  if (hint) return [hint.lat, hint.lon];
  return resolveRouteFallbackLocation(selectedRoute.value);
});

const routeMapLocationLabel = computed<string | null>(() => {
  if (!routeGpxMissing.value) return selectedRoute.value?.name ?? null;
  const hint = routeGpxLocationHint.value;
  if (hint?.label) return hint.label;
  return resolveRouteLocationLabel(selectedRoute.value);
});

async function loadRouteGpxTracks(route: RecommendedRoute | null) {
  const requestSeq = ++routeGpxRequestSeq;
  routeGpxLoading.value = true;
  routeGpxMissing.value = false;
  routeGpxLocationHint.value = null;
  routeGpxTracks.value = [];
  selectedDbGpxTrackId.value = null;
  gpxScopeFilter.value = 'all';

  if (!route) {
    routeGpxLoading.value = false;
    return;
  }

  try {
    const { data } = await api.get<RouteGpxResponse>(`/routes/${route.id}/gpx`);
    if (requestSeq !== routeGpxRequestSeq) return;
    routeGpxTracks.value = data.tracks;
    selectedDbGpxTrackId.value = data.tracks[0]?.gpx_track_id ?? null;
    if (
      !data.tracks.some((track) => track.match_scope === gpxScopeFilter.value)
    ) {
      gpxScopeFilter.value = 'all';
    }
    routeGpxMissing.value = !data.tracks.length;
    routeGpxLocationHint.value = data.location_hint ?? null;
  } catch (_) {
    if (requestSeq !== routeGpxRequestSeq) return;
    routeGpxTracks.value = [];
    routeGpxMissing.value = true;
    routeGpxLocationHint.value = null;
  } finally {
    if (requestSeq !== routeGpxRequestSeq) return;
    routeGpxLoading.value = false;
  }
}

watch(
  selectedRoute,
  async (route) => {
    uploadedGpxTrack.value = null;
    await loadRouteGpxTracks(route);
    if (!route) {
      routeWeather.value = null;
      weatherFallbackReason.value = null;
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
    return '中央氣象署暫不可用';
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
      return '中央氣象署暫時無法取得即時資料。';
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

function extractCounty(region: string): string {
  const m = region.match(/[一-龥]{2,4}[縣市]/)
  return m ? m[0] : region
}

async function loadRouteWeather(route: RecommendedRoute) {
  weatherLoading.value = true;
  routeWeather.value = null;
  weatherFallbackReason.value = null;
  try {
    const { data } = await api.post<RouteWeatherResponse>('/weather/forecast', {
      route_name: route.name,
      location: extractCounty(route.region),
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
function onGearAdd(label: string) {
  addGearItem({ id: normalizeGearId(label), label, icon: '🏔' });
}

function onGearToggle(id: string) {
  gear[id] = !gear[id];
}

</script>

