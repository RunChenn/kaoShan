<template>
  <q-page padding class="q-pb-xl">
    <div class="text-h5 text-weight-bold text-primary q-mb-xs anim-slide-down" style="letter-spacing:-0.03em">體力評估</div>
    <div class="text-body2 text-grey-6 q-mb-lg anim-slide-down" style="animation-delay:0.04s;opacity:0.65">輸入您的身體狀況，AI 為您計算安全等級評分</div>

    <!-- 基本資料 -->
    <q-card class="hiking-card q-mb-md anim-slide-up" style="animation-delay:0s">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">基本資料</div>
        <div class="row q-gutter-sm">
          <q-input
            v-model.number="form.age"
            type="number"
            label="年齡"
            suffix="歲"
            outlined
            class="col"
            :rules="[v => (v && v > 0 && v < 120) || '請輸入有效年齡']"
          />
          <q-input
            v-model.number="form.weight"
            type="number"
            label="體重"
            suffix="kg"
            outlined
            class="col"
            :rules="[v => (v && v > 20 && v < 300) || '請輸入有效體重']"
          />
        </div>
        <q-input
          v-model.number="form.height"
          type="number"
          label="身高"
          suffix="cm"
          outlined
          class="q-mt-sm"
          :rules="[v => !v || (v > 100 && v < 250) || '請輸入有效身高']"
        />
      </q-card-section>
    </q-card>

    <!-- 登山經驗 -->
    <q-card class="hiking-card q-mb-md anim-slide-up" style="animation-delay:0.08s">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">登山經驗</div>
        <q-btn-toggle
          v-model="form.level"
          spread
          unelevated
          toggle-color="primary"
          color="grey-2"
          text-color="grey-8"
          :options="[
            { label: '新手（<5次）', value: 'beginner' },
            { label: '老手（5次以上）', value: 'experienced' },
          ]"
        />
      </q-card-section>
    </q-card>

    <!-- 體能狀態 -->
    <q-card class="hiking-card q-mb-md anim-slide-up" style="animation-delay:0.16s">
      <q-card-section>
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle1 text-weight-medium">體能狀態</div>
          <q-badge :color="fitnessColor" :label="fitnessLabel" />
        </div>
        <q-slider
          v-model="form.fitness"
          :min="1" :max="5" :step="1"
          snap color="primary" label markers
          class="q-px-sm"
        />
        <div class="row justify-between text-caption text-grey-5 q-mt-xs">
          <span>非常差</span>
          <span>普通</span>
          <span>非常好</span>
        </div>
      </q-card-section>
    </q-card>

    <!-- 坡度係數 -->
    <q-card class="hiking-card q-mb-md anim-slide-up" style="animation-delay:0.22s">
      <q-card-section>
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle1 text-weight-medium">坡度承受係數</div>
          <q-badge :color="slopeColor" :label="`${slopeLabels[form.slopeCoefficient]}`" />
        </div>
        <div class="text-caption text-grey-5 q-mb-sm">您能輕鬆應對的坡度程度（影響安全評分與路線推薦）</div>
        <q-slider
          v-model="form.slopeCoefficient"
          :min="1" :max="5" :step="1"
          snap color="secondary" label markers
          class="q-px-sm"
        />
        <div class="row justify-between text-caption text-grey-5 q-mt-xs">
          <span>緩坡</span>
          <span>中坡</span>
          <span>陡坡</span>
        </div>
      </q-card-section>
    </q-card>

    <!-- 目標天數 -->
    <q-card class="hiking-card q-mb-lg anim-slide-up" style="animation-delay:0.28s">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-md">目標天數</div>
        <q-select
          v-model="form.targetDays"
          :options="dayOptions"
          emit-value map-options outlined
          label="計畫天數"
        />
      </q-card-section>
    </q-card>

    <!-- 安全等級評分 -->
    <transition name="score-reveal">
      <q-card v-if="isValid && plan.safetyScore !== null" class="hiking-card q-mb-lg score-card anim-slide-up" style="animation-delay:0.34s">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold q-mb-md">
            <q-icon name="security" color="primary" class="q-mr-xs" />
            安全等級評分
          </div>
          <div class="row items-center q-gutter-lg">
            <!-- 圓形分數 -->
            <div class="score-circle-wrap">
              <q-circular-progress
                :value="displayedScore"
                size="120px"
                :thickness="0.15"
                :color="plan.safetyLevel?.color ?? 'primary'"
                track-color="grey-3"
                show-value
                class="score-progress"
              >
                <div class="text-center">
                  <div class="text-h4 text-weight-bold" :class="`text-${plan.safetyLevel?.color}`">
                    {{ displayedScore }}
                  </div>
                  <div class="text-caption text-grey-5">/ 100</div>
                </div>
              </q-circular-progress>
            </div>

            <!-- 評級說明 -->
            <div class="col">
              <div class="row items-center q-mb-xs">
                <q-icon :name="plan.safetyLevel?.icon" :color="plan.safetyLevel?.color" size="24px" class="q-mr-sm" />
                <span class="text-h6 text-weight-bold" :class="`text-${plan.safetyLevel?.color}`">
                  {{ plan.safetyLevel?.label }}
                </span>
              </div>
              <div class="score-breakdown text-caption text-grey-6 q-mb-sm">
                <div>體能：{{ form.fitness * 20 }} 分</div>
                <div>經驗：{{ form.level === 'experienced' ? '+15' : '+0' }} 分</div>
                <div>坡度係數：+{{ [0,0,0,5,10,15][form.slopeCoefficient] }} 分</div>
              </div>
              <q-linear-progress
                :value="(plan.safetyScore ?? 0) / 100"
                :color="plan.safetyLevel?.color"
                track-color="grey-3"
                rounded size="8px"
              />
            </div>
          </div>

          <!-- 建議訊息 -->
          <q-banner
            class="q-mt-md rounded-borders"
            :class="`bg-${plan.safetyLevel?.color}-1`"
            rounded
          >
            <template #avatar>
              <q-icon :name="plan.safetyLevel?.icon" :color="plan.safetyLevel?.color" />
            </template>
            <span class="text-body2">{{ scoreAdvice }}</span>
          </q-banner>
        </q-card-section>
      </q-card>
    </transition>

    <q-btn
      unelevated size="lg"
      color="primary"
      label="下一步：路線推薦"
      icon-right="arrow_forward"
      class="full-width anim-slide-up"
      style="animation-delay:0.4s"
      :disable="!isValid"
      @click="next"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanStore } from 'src/stores/plan'

const router = useRouter()
const plan = usePlanStore()
const form = plan.profileForm

const dayOptions = [
  { label: '當日來回', value: 1 },
  { label: '2 天 1 夜', value: 2 },
  { label: '3 天 2 夜', value: 3 },
  { label: '4 天以上', value: 4 },
]

const fitnessLabels = ['', '非常差', '差', '普通', '好', '非常好']
const fitnessColors = ['', 'negative', 'orange', 'warning', 'positive', 'positive']
const fitnessLabel = computed(() => fitnessLabels[form.fitness])
const fitnessColor = computed(() => fitnessColors[form.fitness])

const slopeLabels = ['', '緩坡適應', '中坡尚可', '中坡舒適', '陡坡適應', '陡坡精通']
const slopeColors = ['', 'grey', 'info', 'primary', 'warning', 'secondary']
const slopeColor = computed(() => slopeColors[form.slopeCoefficient])

const isValid = computed(() => !!(form.age && form.weight))

// 分數動畫
const displayedScore = ref(0)
watch(() => plan.safetyScore, (newVal) => {
  if (newVal === null) return
  displayedScore.value = 0
  const target = newVal
  const step = Math.ceil(target / 40)
  const timer = setInterval(() => {
    displayedScore.value = Math.min(displayedScore.value + step, target)
    if (displayedScore.value >= target) clearInterval(timer)
  }, 30)
}, { immediate: true })

const scoreAdvice = computed(() => {
  const s = plan.safetyScore ?? 0
  if (s >= 85) return '您的體能狀況優秀！適合挑戰高難度路線，仍請注意天氣與裝備。'
  if (s >= 70) return '體能狀況良好，可選擇中高難度路線。建議攜帶完整裝備。'
  if (s >= 50) return '建議選擇中等難度路線，並確保有人同行與充足的休息。'
  if (s >= 30) return '體能尚待加強，建議從容易路線開始，切勿獨行。'
  return '目前體能評估偏低，強烈建議先進行體能訓練後再規劃登山。'
})

function next() {
  router.push('/plan/routes')
}
</script>

<style lang="scss" scoped>
.score-card {
  border: 1px solid rgba(26,140,85,0.22) !important;
  animation: score-glow 3s ease-in-out infinite;
  background: linear-gradient(135deg,
    rgba(26,140,85,0.03) 0%,
    transparent 60%) !important;
}

.score-circle-wrap { flex-shrink: 0; }

.score-breakdown {
  line-height: 1.9;
  font-size: 0.78rem;
}

.score-reveal-enter-active { transition: all 0.5s cubic-bezier(0.34,1.1,0.64,1); }
.score-reveal-enter-from   { opacity: 0; transform: translateY(24px) scale(0.97); }
</style>
