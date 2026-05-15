<template>
  <q-page padding class="q-pb-xl">
    <div class="text-h5 text-weight-bold text-primary q-mb-xs anim-slide-down" style="letter-spacing: 0.06rem;opacity:0.55">{{ summary.date }} · {{ summary.routeName }}</div>

    <!-- 2x2 統計卡片 -->
    <div class="row q-gutter-sm q-mb-lg anim-slide-up">
      <StatCard icon="straighten"           label="距離" :value="`${summary.distanceKm} km`"           color="primary"  class="col" />
      <StatCard icon="schedule"             label="時間" :value="formatDuration(summary.durationMin)"   color="secondary" class="col" />
      <StatCard icon="terrain"              label="爬升" :value="`+${summary.elevationGain}m`"          color="warning"  class="col" />
      <StatCard icon="local_fire_department" label="熱量" :value="`${summary.calories} kcal`"          color="negative" class="col" />
    </div>

    <!-- 風險曲線 -->
    <q-card class="hiking-card q-mb-lg anim-slide-up" style="animation-delay:0.05s">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">風險曲線</div>
        <RiskCurveChart :data="summary.riskCurve" />
        <div class="row justify-between text-caption text-grey-5 q-mt-xs">
          <span>出發</span>
          <span>最高點</span>
          <span>返回</span>
        </div>
      </q-card-section>
    </q-card>

    <!-- 事件回顧 -->
    <div class="text-subtitle1 text-weight-bold q-mb-sm anim-slide-up" style="animation-delay:0.1s">
      <q-icon name="event_note" color="primary" class="q-mr-xs" />
      即時事件回顧
    </div>
    <div class="row q-gutter-sm q-mb-lg anim-slide-up" style="animation-delay:0.12s">
      <q-card class="col event-card text-center">
        <q-card-section class="q-pa-sm">
          <q-icon name="gps_off" color="warning" size="28px" />
          <div class="text-h5 text-weight-bold text-warning q-mt-xs">{{ after.events?.deviationCount ?? 0 }}</div>
          <div class="text-caption text-grey-6">偏離次數</div>
        </q-card-section>
      </q-card>
      <q-card class="col event-card text-center">
        <q-card-section class="q-pa-sm">
          <q-icon name="notifications_active" color="negative" size="28px" />
          <div class="text-h5 text-weight-bold text-negative q-mt-xs">{{ after.events?.alertCount ?? 0 }}</div>
          <div class="text-caption text-grey-6">警報次數</div>
        </q-card-section>
      </q-card>
      <q-card class="col event-card text-center">
        <q-card-section class="q-pa-sm">
          <q-icon name="monitor_heart" color="secondary" size="28px" />
          <div class="text-h5 text-weight-bold text-secondary q-mt-xs">{{ after.events?.maxHeartRate ?? '--' }}</div>
          <div class="text-caption text-grey-6">最高心率</div>
        </q-card-section>
      </q-card>
      <q-card class="col event-card text-center">
        <q-card-section class="q-pa-sm">
          <q-icon name="self_improvement" color="info" size="28px" />
          <div class="text-h5 text-weight-bold text-info q-mt-xs">{{ after.events?.restStops ?? 0 }}</div>
          <div class="text-caption text-grey-6">休息次數</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- 路線評分 -->
    <q-card class="hiking-card q-mb-lg anim-slide-up" style="animation-delay:0.15s">
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="text-subtitle1 text-weight-bold">路線回饋評分</div>
          <q-space />
          <div class="row items-center">
            <q-icon name="star" color="warning" v-for="i in 5" :key="i"
                    :class="i <= Math.ceil((after.events?.routeScore ?? 0) / 2) ? '' : 'opacity-30'" />
            <span class="text-h6 text-weight-bold text-warning q-ml-sm">{{ after.events?.routeScore ?? 0 }}/10</span>
          </div>
        </div>
        <q-linear-progress
          :value="(after.events?.routeScore ?? 0) / 10"
          color="warning" track-color="grey-3"
          rounded size="10px"
        />
        <div class="text-caption text-grey-6 q-mt-sm">
          根據偏離次數、警報頻率、完成率等自動計算
        </div>
      </q-card-section>
    </q-card>

    <!-- 能力基線更新 -->
    <div class="text-subtitle1 text-weight-bold q-mb-sm anim-slide-up" style="animation-delay:0.2s">
      <q-icon name="trending_up" color="primary" class="q-mr-xs" />
      能力基線更新
    </div>
    <q-card class="hiking-card q-mb-lg anim-slide-up" style="animation-delay:0.22s" v-if="after.baseline">
      <q-card-section>
        <div class="row items-center q-mb-md">
          <q-badge :color="performanceColor" :label="after.baseline.performanceLabel" size="lg" class="q-mr-sm" />
          <div class="text-body2 text-grey-7">實際表現 vs 預測</div>
        </div>
        <div class="row q-gutter-md">
          <div class="col baseline-item">
            <div class="text-caption text-grey-5">預測時間</div>
            <div class="text-h6 text-weight-bold text-grey-7">{{ formatDuration(after.baseline.predictedDurationMin) }}</div>
            <div class="text-caption text-grey-5">預測最高心率</div>
            <div class="text-subtitle2 text-grey-7">{{ after.baseline.predictedMaxHR }} bpm</div>
          </div>
          <q-separator vertical />
          <div class="col baseline-item">
            <div class="text-caption text-grey-5">實際時間</div>
            <div class="text-h6 text-weight-bold" :class="`text-${performanceColor}`">
              {{ formatDuration(after.baseline.actualDurationMin) }}
            </div>
            <div class="text-caption text-grey-5">實際最高心率</div>
            <div class="text-subtitle2" :class="`text-${after.baseline.actualMaxHR > after.baseline.predictedMaxHR ? 'negative' : 'positive'}`">
              {{ after.baseline.actualMaxHR }} bpm
            </div>
          </div>
        </div>
        <q-banner class="q-mt-md rounded-borders"
                  :class="`bg-${performanceColor}-1`" rounded>
          <template #avatar>
            <q-icon :name="after.baseline.performance === 'ahead' ? 'emoji_events' : after.baseline.performance === 'behind' ? 'arrow_downward' : 'check_circle'"
                    :color="performanceColor" />
          </template>
          <span class="text-body2">{{ baselineMessage }}</span>
        </q-banner>
      </q-card-section>
    </q-card>

    <!-- 身體恢復評估 -->
    <div class="text-subtitle1 text-weight-bold q-mb-sm anim-slide-up" style="animation-delay:0.25s">
      <q-icon name="bedtime" color="primary" class="q-mr-xs" />
      身體恢復評估
    </div>
    <q-card class="hiking-card q-mb-lg recovery-card anim-slide-up" style="animation-delay:0.27s">
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="recovery-days-badge">
            <div class="text-h3 text-weight-bold text-primary">{{ recoveryDays }}</div>
            <div class="text-caption text-grey-6">天</div>
          </div>
          <div class="col q-ml-lg">
            <div class="text-subtitle1 text-weight-bold q-mb-xs">建議休息天數</div>
            <div class="text-body2 text-grey-7">爬升 {{ summary.elevationGain }}m × 體重 × 時間計算</div>
            <q-linear-progress
              :value="Math.min(1, recoveryDays / 7)"
              color="primary" track-color="grey-3"
              rounded size="8px" class="q-mt-sm"
            />
          </div>
        </div>
        <q-list dense>
          <q-item v-for="tip in recoveryTips" :key="tip" class="q-px-none">
            <q-item-section avatar>
              <q-icon name="check" color="positive" size="18px" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-body2">{{ tip }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- 能量補充建議 -->
    <div class="text-subtitle1 text-weight-bold q-mb-sm anim-slide-up" style="animation-delay:0.3s">
      <q-icon name="restaurant" color="secondary" class="q-mr-xs" />
      能量補充建議（消耗 {{ summary.calories }} kcal）
    </div>
    <div class="q-gutter-y-sm q-mb-lg anim-slide-up" style="animation-delay:0.32s">
      <RecoveryCard icon="egg"        label="蛋白質補充" :desc="`建議攝取 ${proteinGrams}g 蛋白質，如雞胸肉 ${Math.round(proteinGrams/30)}塊、豆腐 ${Math.round(proteinGrams/8)}塊`" color="orange-6" />
      <RecoveryCard icon="rice_bowl"  label="碳水補充"   :desc="`補充 ${carbGrams}g 碳水，如白飯 ${Math.round(carbGrams/25)}碗或地瓜 ${Math.round(carbGrams/20)}根`" color="brown-4" />
      <RecoveryCard icon="water_drop" label="電解質補充" :desc="`補充水分 ${waterMl}ml，含鈉、鉀飲料或電解質水`"                                                          color="blue-5" />
      <RecoveryCard icon="bedtime"    label="充足睡眠"   :desc="`建議今晚睡眠 ${sleepHours} 小時，讓肌肉充分修復`"                                                         color="purple-5" />
    </div>

    <!-- 安全報告 -->
    <q-btn
      unelevated color="primary" icon="summarize"
      label="生成安全報告"
      class="full-width q-mb-md anim-slide-up"
      style="animation-delay:0.36s"
      @click="showReport = true"
    />

    <!-- 安全報告 Dialog -->
    <q-dialog v-model="showReport" maximized>
      <q-card>
        <q-card-section class="bg-primary text-white">
          <div class="row items-center">
            <q-icon name="summarize" size="24px" class="q-mr-sm" />
            <div class="text-h6 text-weight-bold">安全報告</div>
            <q-space />
            <q-btn flat round icon="close" color="white" v-close-popup />
          </div>
        </q-card-section>
        <q-card-section class="q-pa-lg">
          <div class="text-subtitle1 text-weight-bold q-mb-xs">{{ summary.routeName }}</div>
          <div class="text-caption text-grey-6 q-mb-lg">{{ summary.date }}</div>

          <div class="text-subtitle2 text-weight-bold q-mb-sm">風險事件摘要</div>
          <q-list bordered separator class="q-mb-lg rounded-borders">
            <q-item>
              <q-item-section avatar><q-icon name="gps_off" color="warning" /></q-item-section>
              <q-item-section>路線偏離</q-item-section>
              <q-item-section side>{{ after.events?.deviationCount ?? 0 }} 次</q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="notifications_active" color="negative" /></q-item-section>
              <q-item-section>安全警報</q-item-section>
              <q-item-section side>{{ after.events?.alertCount ?? 0 }} 次</q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="monitor_heart" color="secondary" /></q-item-section>
              <q-item-section>最高心率</q-item-section>
              <q-item-section side>{{ after.events?.maxHeartRate ?? '--' }} bpm</q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar><q-icon name="speed" color="info" /></q-item-section>
              <q-item-section>最低速度</q-item-section>
              <q-item-section side>{{ after.events?.lowestSpeed ?? '--' }} km/h</q-item-section>
            </q-item>
          </q-list>

          <div class="text-subtitle2 text-weight-bold q-mb-sm">下次改善建議</div>
          <q-list>
            <q-item v-for="sug in improvementSuggestions" :key="sug" class="q-px-none">
              <q-item-section avatar>
                <q-icon name="arrow_right" color="primary" />
              </q-item-section>
              <q-item-section><q-item-label>{{ sug }}</q-item-label></q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions class="q-pa-md">
          <q-btn unelevated color="primary" icon="share" label="分享報告" class="full-width"
                 @click="shareReport" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAfterStore } from 'src/stores/after'
import { usePlanStore } from 'src/stores/plan'
import StatCard from 'src/components/StatCard.vue'
import RiskCurveChart from 'src/components/RiskCurveChart.vue'
import RecoveryCard from 'src/components/RecoveryCard.vue'

const after = useAfterStore()
const plan = usePlanStore()
const showReport = ref(false)

const emptySummary = {
  id: '',
  date: '',
  routeName: '尚無資料',
  difficulty: 'easy' as const,
  distanceKm: 0,
  durationMin: 0,
  elevationGain: 0,
  calories: 0,
  maxRiskScore: 0,
  riskCurve: [],
}

const summary = computed(() => after.currentSummary ?? emptySummary)

function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h ${m}m`
}

// 恢復天數：爬升 × 時間加權公式
const recoveryDays = computed(() => {
  const s = summary.value
  if (!s) return 1
  const elevFactor = s.elevationGain / 1000 * 1.5
  const timeFactor = s.durationMin / 60 * 0.5
  return Math.max(1, Math.min(7, Math.round(elevFactor + timeFactor)))
})

const recoveryTips = computed(() => {
  const days = recoveryDays.value
  return [
    `前 ${Math.min(2, days)} 天避免劇烈運動，輕度伸展即可`,
    '每天補充足夠蛋白質（體重 × 1.6g）',
    '使用冷熱交替浴舒緩肌肉',
    days >= 3 ? '第 3 天後可進行輕度有氧（快走、游泳）' : '恢復良好可提早輕度運動',
    '注意膝蓋與腳踝是否有遲發性痠痛',
  ]
})

// 能量補充
const weight = computed(() => plan.profileForm.weight ?? 65)
const proteinGrams = computed(() => Math.round(weight.value * 1.6 + (summary.value?.calories ?? 0) / 100))
const carbGrams = computed(() => Math.round((summary.value?.calories ?? 0) * 0.55 / 4))
const waterMl = computed(() => Math.round((summary.value?.calories ?? 0) * 1.2))
const sleepHours = computed(() => Math.min(10, 7 + Math.ceil(recoveryDays.value / 3)))

// 基線表現
const performanceColor = computed(() => {
  const p = after.baseline?.performance
  return p === 'ahead' ? 'positive' : p === 'behind' ? 'negative' : 'primary'
})
const baselineMessage = computed(() => {
  const p = after.baseline?.performance
  if (p === 'ahead') return '您的表現超越預測！體能持續進步，下次可嘗試更高難度的路線。'
  if (p === 'behind') return '本次表現略低於預測，建議加強體能訓練或選擇較低難度路線。'
  return '表現符合預測，持續維持訓練節奏即可。'
})

// 改善建議
const improvementSuggestions = computed(() => {
  const ev = after.events
  const suggestions: string[] = []
  if ((ev?.deviationCount ?? 0) > 1) suggestions.push('加強地圖識別能力，隨時確認路標與路線')
  if ((ev?.alertCount ?? 0) > 2) suggestions.push('降低行進速度，提高安全餘裕度')
  if ((ev?.maxHeartRate ?? 0) > 160) suggestions.push('心率管理不足，建議攜帶心率錶並設定警示')
  if ((ev?.lowestSpeed ?? 1) < 1.0) suggestions.push('體力消耗過快，應提早補充食物與水分')
  if (suggestions.length === 0) suggestions.push('整體表現良好，繼續保持！')
  suggestions.push('下次攜帶緊急通訊設備（如衛星電話）')
  suggestions.push('出發前確認氣象預報，避免雷雨期間登山')
  return suggestions
})

function shareReport() {
  const text = `登山安全報告 - ${summary.value.routeName}（${summary.value.date || '--'}）\n偏離 ${after.events?.deviationCount ?? 0} 次，警報 ${after.events?.alertCount ?? 0} 次，路線評分 ${after.events?.routeScore ?? 0}/10`
  if (navigator.share) {
    navigator.share({ title: '登山安全報告', text })
  } else {
    navigator.clipboard.writeText(text)
  }
}
</script>

<style lang="scss" scoped>
.event-card {
  border-radius: 18px !important;
  box-shadow: 0 3px 16px rgba(0,0,0,0.10) !important;
  transition: transform 0.22s ease, box-shadow 0.22s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(0,0,0,0.14) !important;
  }
}

.recovery-card {
  border: 1px solid rgba(26,140,85,0.18) !important;
  background: linear-gradient(145deg,
    rgba(26,140,85,0.04) 0%, transparent 70%) !important;
}

.recovery-days-badge {
  text-align: center;
  width: 72px;
  flex-shrink: 0;
  background: rgba(26,140,85,0.10);
  border-radius: 18px;
  padding: 10px 8px;
}

.baseline-item { text-align: center; }
</style>
