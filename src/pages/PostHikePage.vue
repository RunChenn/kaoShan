<template>
  <div class="p3-content">
    <div class="p3-header">
      <div class="p3-title">🏆 登頂完成：玉山主峰</div>
      <div style="display: flex; gap: 8px">
        <button class="btn btn-ghost btn-sm">💾 儲存</button>
        <button class="btn btn-primary btn-sm">📤 分享</button>
      </div>
    </div>

    <!-- Stats row -->
    <div class="stats-row">
      <div v-for="s in stats" :key="s.lbl" class="stat-card stagger-item">
        <div class="stat-card-val">{{ s.val }}</div>
        <div class="stat-card-lbl">{{ s.lbl }}</div>
      </div>
    </div>

    <div class="p3-grid">
      <!-- Risk curve chart -->
      <div class="card chart-card">
        <div class="section-label" style="margin-bottom: 12px">風險曲線</div>
        <canvas ref="canvasEl" class="risk-chart" style="width: 100%; height: 220px" />
      </div>

      <!-- Achievements -->
      <div class="card">
        <div class="section-label">成就解鎖</div>
        <div
          v-for="(a, i) in achievements"
          :key="a.name"
          class="ach-item stagger-item"
          :style="{ animationDelay: `${i * 0.1}s` }"
        >
          <div class="ach-icon" :style="{ background: a.bg }">
            <span style="font-size: 18px">{{ a.emoji }}</span>
          </div>
          <div>
            <div class="ach-name">{{ a.name }}</div>
            <div class="ach-desc">{{ a.desc }}</div>
          </div>
        </div>
      </div>

      <!-- Share card -->
      <div class="card">
        <div class="section-label">分享卡片</div>
        <div class="share-card-outer">
          <div class="share-card-inner">
            <div class="share-card-pattern" />
            <div style="font-size: 36px; position: relative">🏔</div>
            <div class="share-elevation">3,952m</div>
            <div class="share-route">玉山主峰 · 2026.05.04</div>
            <div class="share-stats">
              <div class="share-stat">
                <div class="share-stat-val">8.5km</div>
                <div class="share-stat-lbl">距離</div>
              </div>
              <div class="share-stat">
                <div class="share-stat-val">5:42</div>
                <div class="share-stat-lbl">時長</div>
              </div>
              <div class="share-stat">
                <div class="share-stat-val">82</div>
                <div class="share-stat-lbl">安全分</div>
              </div>
            </div>
            <div style="position: relative; margin-top: 8px">
              <button
                class="btn btn-sm"
                style="background: #06C755; color: #fff; font-size: 0.78rem"
                @click="router.push('/line')"
              >
                📤 分享到 LINE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const canvasEl = ref<HTMLCanvasElement>()

const stats = [
  { val: '8.5km',  lbl: '總距離' },
  { val: '5:42',   lbl: '總時長' },
  { val: '+1130m', lbl: '累積爬升' },
  { val: '82',     lbl: '安全評分' },
  { val: '1247',   lbl: '消耗熱量(kcal)' },
]

const achievements = [
  { emoji: '🏔', name: '百岳征服者', desc: '成功攀登台灣百岳', bg: 'linear-gradient(135deg,#166534,#15803d)' },
  { emoji: '⚡', name: '速度達人',   desc: '全程均速超過 2.0 km/h', bg: 'linear-gradient(135deg,#92400e,#d97706)' },
  { emoji: '🛡', name: '零偏離',     desc: '全程未偏離規劃路線', bg: 'linear-gradient(135deg,#1e3a5f,#2563eb)' },
]

onMounted(() => {
  const cvs = canvasEl.value
  if (!cvs) return
  const ctx = cvs.getContext('2d')
  if (!ctx) return

  const W = cvs.offsetWidth * 2
  const H = 220 * 2
  cvs.width = W; cvs.height = H
  ctx.scale(2, 2)
  const w = W / 2, h = H / 2
  const pad = { t: 20, r: 20, b: 36, l: 40 }
  const gw = w - pad.l - pad.r, gh = h - pad.t - pad.b

  const hours   = ['06:00','07:30','09:00','10:30','12:00','13:30']
  const risk    = [12, 24, 38, 62, 80, 48]
  const fatigue = [8,  20, 42, 58, 74, 65]
  const altitude= [20, 38, 58, 75, 90, 72]

  const bgColor = document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'oklch(20% 0.03 240)' : '#fff'
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, w, h)

  // Grid lines
  ctx.strokeStyle = 'rgba(148,163,184,0.12)'; ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) {
    const y = pad.t + gh - (gh * i / 5)
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + gw, y); ctx.stroke()
  }
  for (let i = 0; i < hours.length; i++) {
    const x = pad.l + gw * i / (hours.length - 1)
    ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + gh); ctx.stroke()
  }

  // X labels
  ctx.fillStyle = 'rgba(148,163,184,0.6)'; ctx.font = '10px Noto Sans TC,sans-serif'; ctx.textAlign = 'center'
  hours.forEach((label, i) => {
    const x = pad.l + gw * i / (hours.length - 1)
    ctx.fillText(label, x, pad.t + gh + 18)
  })

  function drawLine(data: number[], color: string, fillRgba: string) {
    ctx.beginPath()
    data.forEach((v, i) => {
      const x = pad.l + gw * i / (data.length - 1)
      const y = pad.t + gh - (gh * v / 100)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke()

    // Fill gradient
    ctx.beginPath()
    data.forEach((v, i) => {
      const x = pad.l + gw * i / (data.length - 1)
      const y = pad.t + gh - (gh * v / 100)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.lineTo(pad.l + gw, pad.t + gh); ctx.lineTo(pad.l, pad.t + gh); ctx.closePath()
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + gh)
    grad.addColorStop(0, fillRgba.replace(')', ',0.25)'))
    grad.addColorStop(1, fillRgba.replace(')', ',0)'))
    ctx.fillStyle = grad; ctx.fill()

    // Peak dot
    const maxIdx = data.indexOf(Math.max(...data))
    const px = pad.l + gw * maxIdx / (data.length - 1)
    const py = pad.t + gh - (gh * data[maxIdx] / 100)
    ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2)
    ctx.fillStyle = color; ctx.fill()
    ctx.fillStyle = color; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText(data[maxIdx] + '%', px, py - 9)
  }

  drawLine(altitude, '#60a5fa', 'rgba(96,165,250')
  drawLine(fatigue,  '#22c55e', 'rgba(34,197,94')
  drawLine(risk,     '#f87171', 'rgba(248,113,113')

  // Legend
  const legend = [[' 風險','#f87171'],[' 疲勞','#22c55e'],[' 海拔','#60a5fa']] as const
  legend.forEach(([lbl, color], i) => {
    const lx = pad.l + i * 80
    ctx.fillStyle = color; ctx.fillRect(lx, 6, 16, 4)
    ctx.fillStyle = 'rgba(148,163,184,0.8)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'left'
    ctx.fillText(lbl, lx + 20, 11)
  })
})
</script>
