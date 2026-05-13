<template>
  <q-layout view="hHh lpR fFf">

    <!-- Frosted-glass header -->
    <q-header class="premium-header" :class="theme.isDark ? 'text-white' : 'text-dark'">
      <q-toolbar class="q-px-md toolbar-inner">
        <transition name="back-slide">
          <q-btn
            v-if="canGoBack"
            flat round
            icon="arrow_back_ios_new"
            class="header-action-btn q-mr-xs"
            @click="$router.back()"
          />
        </transition>

        <q-toolbar-title class="header-title text-weight-bold">
          {{ pageTitle }}
        </q-toolbar-title>

        <q-btn
          flat round
          :icon="theme.isDark ? 'light_mode' : 'dark_mode'"
          class="header-action-btn"
          @click="theme.toggle()"
        />
        <q-btn
          flat round
          icon="account_circle"
          class="header-action-btn"
          @click="showProfile = true"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="page-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

    <!-- Floating pill bottom nav -->
    <q-footer class="footer-ghost">
      <div class="nav-float-wrapper q-pb-safe">
        <nav class="nav-pill" :class="theme.isDark ? 'nav-pill-dark' : 'nav-pill-light'">
          <div
            v-for="tab in tabs"
            :key="tab.name"
            class="nav-item"
            :class="{ active: activeTab === tab.name }"
            @click="$router.push(tab.path)"
          >
            <div class="nav-dot" v-if="activeTab === tab.name" />
            <q-icon
              :name="tab.icon"
              :size="activeTab === tab.name ? '24px' : '22px'"
            />
            <span class="nav-label">{{ tab.label }}</span>
          </div>
        </nav>
      </div>
    </q-footer>

    <!-- Premium profile dialog -->
  <q-dialog
      v-model="showProfile"
      transition-show="jump-up"
      transition-hide="jump-down"
    >
      <q-card class="profile-card-dialog">
        <!-- Header -->
        <div class="profile-dialog-header">
          <div class="profile-header-orb orb-1" />
          <div class="profile-header-orb orb-2" />
          <div class="text-center q-pt-lg q-pb-md" style="position:relative;z-index:1">
            <q-avatar size="76px" class="profile-avatar">
              <img :src="auth.profile?.pictureUrl || 'https://i.pravatar.cc/150'" />
            </q-avatar>
            <div class="text-h6 text-white text-weight-bold q-mt-sm" style="letter-spacing: 0.06rem">
              {{ auth.profile?.displayName }}
            </div>
            <div class="text-caption text-white" style="opacity:0.6">
              {{ auth.profile?.statusMessage }}
            </div>
          </div>
        </div>

        <!-- Actions -->
        <q-card-section class="q-pa-lg">
          <div class="row q-gutter-sm">
            <q-btn
              unelevated label="登出" color="negative"
              class="col dialog-action-btn"
              @click="handleLogout"
            />
            <q-btn
              flat label="關閉" color="primary"
              class="col dialog-action-btn"
              v-close-popup
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <Teleport to="body">
      <transition name="install-fade">
        <div
          v-if="showInstallBanner"
          class="install-banner-wrap"
          :class="{ 'install-banner-ios': isIosInstallHint }"
        >
          <q-card class="install-banner">
            <q-card-section class="row no-wrap items-start q-gutter-sm">
              <div class="install-banner-icon">
                <q-icon
                  :name="isIosInstallHint ? 'ios_share' : 'download_for_offline'"
                  size="22px"
                  color="primary"
                />
              </div>
              <div class="col">
                <div class="install-banner-title">
                  {{ installBannerTitle }}
                </div>
                <div class="install-banner-text">
                  {{ installBannerText }}
                </div>
              </div>
              <q-btn
                flat
                round
                dense
                icon="close"
                class="install-banner-close"
                @click="dismissInstallPrompt"
              />
            </q-card-section>
            <q-card-actions align="right" class="q-pt-none q-px-md q-pb-md">
              <q-btn
                v-if="canInstallPwa"
                unelevated
                color="primary"
                class="install-banner-action"
                label="安裝 App"
                @click="promptInstall"
              />
              <q-btn
                v-else
                flat
                color="primary"
                class="install-banner-action"
                label="知道了"
                @click="dismissInstallPrompt"
              />
            </q-card-actions>
          </q-card>
        </div>
      </transition>
    </Teleport>

  </q-layout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { useThemeStore } from 'src/stores/theme'
import { useLiff } from 'src/composables/useLiff'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const theme  = useThemeStore()
const { logout } = useLiff()
const showProfile = ref(false)
const installPromptEvent = ref<BeforeInstallPromptEvent | null>(null)
const installPromptVisible = ref(false)
const installPromptDismissed = ref(
  sessionStorage.getItem('kaoshan_install_prompt_dismissed') === '1',
)

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const tabs = [
  { name: 'plan',   path: '/plan',      icon: 'hiking',     label: '規劃' },
  { name: 'trails', path: '/trails',    icon: 'forest',     label: '步道' },
  { name: 'hike',   path: '/hike/map',  icon: 'map',        label: '登山' },
  { name: 'after',  path: '/after',     icon: 'bar_chart',  label: '回顧' },
]

const tabMap: Record<string, string> = {
  '/plan': 'plan', '/trails': 'trails', '/hike': 'hike', '/after': 'after',
}

const activeTab = computed(() => {
  for (const [prefix, tab] of Object.entries(tabMap)) {
    if (route.path.startsWith(prefix)) return tab
  }
  return 'plan'
})

const pageTitleMap: Record<string, string> = {
  '/plan/profile': '體力評估',
  '/plan/routes':  '路線選擇',
  '/plan/offline': '離線包下載',
  '/trails':       '步道探索',
  '/hike/status':  '登山狀態',
  '/after':        '登山後',
  '/after/summary':'本次摘要',
  '/after/history':'歷史紀錄',
  '/after/share':  'LINE 分享',
}

const pageTitle = computed(() => {
  if (route.path.startsWith('/plan/route/')) return '路線詳情'
  if (route.path.startsWith('/trails/') && route.path !== '/trails') return '步道詳情'
  return pageTitleMap[route.path] ?? '登山助理'
})

const canGoBack = computed(() =>
  route.path !== '/plan' && route.path !== '/trails' && route.path !== '/after'
)

const isStandalone = computed(
  () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari standalone
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
)
const isIosInstallHint = computed(() => {
  const ua = navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(ua) && !isStandalone.value
})
const canInstallPwa = computed(
  () => !!installPromptEvent.value && !isStandalone.value,
)
const showInstallBanner = computed(
  () =>
    !isStandalone.value &&
    !installPromptDismissed.value &&
    (installPromptVisible.value || isIosInstallHint.value),
)
const installBannerTitle = computed(() =>
  isIosInstallHint.value ? '加入主畫面' : '安裝登山助理',
)
const installBannerText = computed(() =>
  isIosInstallHint.value
    ? '在 Safari 點分享，再選「加入主畫面」，即可像 App 一樣開啟。'
    : '安裝到主畫面後，可更快開啟並離線使用部分內容。',
)

async function promptInstall() {
  if (!installPromptEvent.value) return
  await installPromptEvent.value.prompt()
  await installPromptEvent.value.userChoice
  installPromptEvent.value = null
  installPromptVisible.value = false
  dismissInstallPrompt()
}

function dismissInstallPrompt() {
  installPromptVisible.value = false
  installPromptDismissed.value = true
  sessionStorage.setItem('kaoshan_install_prompt_dismissed', '1')
}

function handleBeforeInstallPrompt(event: Event) {
  const promptEvent = event as BeforeInstallPromptEvent
  event.preventDefault()
  installPromptEvent.value = promptEvent
  if (!installPromptDismissed.value) {
    installPromptVisible.value = true
  }
}

function handleAppInstalled() {
  installPromptEvent.value = null
  installPromptVisible.value = false
  installPromptDismissed.value = true
  sessionStorage.setItem('kaoshan_install_prompt_dismissed', '1')
}

async function handleLogout() {
  await logout()
  showProfile.value = false
  await router.push('/')
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)
  if (isIosInstallHint.value && !installPromptDismissed.value) {
    window.setTimeout(() => {
      installPromptVisible.value = true
    }, 1800)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleAppInstalled)
})
</script>

<style lang="scss" scoped>
// ── Header ──────────────────────────────────────────────
.premium-header {
  background: transparent !important;
  box-shadow: none !important;
  position: relative;

  // 強制覆蓋 Quasar 預設的 inherit color，讓文字色由 text-dark / text-white 控制
  color: inherit !important;

  :deep(.q-btn__content),
  :deep(.q-toolbar__title) {
    color: inherit;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    z-index: -1;
  }
}

:global(.body--dark) .premium-header::before {
  background: rgba(8, 22, 40, 0.92);
  border-bottom-color: rgba(255, 255, 255, 0.07);
}

.toolbar-inner { height: 56px; min-height: 56px; }

.header-title {
  font-size: 1.05rem;
  letter-spacing: 0.06rem;
}

.header-action-btn {
  opacity: 0.65;
  transition: opacity 0.2s ease, transform 0.15s ease;
  &:hover  { opacity: 1; }
  &:active { transform: scale(0.9); }
}

// ── Footer ───────────────────────────────────────────────
.footer-ghost {
  background: transparent !important;
  box-shadow: none !important;
}

.nav-float-wrapper {
  display: flex;
  justify-content: center;
  padding: 8px 20px;
}

.q-pb-safe {
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}

.nav-pill {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 380px;
  padding: 6px 10px;
  border-radius: 36px;
  gap: 2px;
}

.nav-pill-light {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  box-shadow:
    0 6px 28px rgba(0, 0, 0, 0.14),
    0 1px  4px rgba(0, 0, 0, 0.08),
    0 0    0 1px rgba(0, 0, 0, 0.05);
}

.nav-pill-dark {
  background: rgba(10, 22, 44, 0.94);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  box-shadow:
    0 6px 28px rgba(0, 0, 0, 0.45),
    0 0    0 1px rgba(255, 255, 255, 0.07);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px 6px;
  border-radius: 28px;
  cursor: pointer;
  position: relative;
  gap: 2px;
  color: #9aaabb;
  transition: all 0.28s cubic-bezier(0.34, 1.2, 0.64, 1);

  .nav-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.06rem;
    line-height: 1;
  }

  &:active { transform: scale(0.9); }
}

.nav-item.active {
  color: #1A8C55;
  background: rgba(26, 140, 85, 0.13);
  .nav-label { font-weight: 700; }
}

:global(.body--dark) .nav-item.active {
  color: #30D97A;
  background: rgba(48, 217, 122, 0.14);
}

.nav-dot {
  position: absolute;
  top: 5px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
}

// ── Page transition ───────────────────────────────────────
.page-slide-enter-active,
.page-slide-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.page-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-slide-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

// ── Back button transition ────────────────────────────────
.back-slide-enter-active,
.back-slide-leave-active { transition: all 0.2s ease; }
.back-slide-enter-from,
.back-slide-leave-to     { opacity: 0; transform: translateX(-10px); }

// ── Profile dialog ────────────────────────────────────────
.profile-card-dialog {
  border-radius: 28px !important;
  overflow: hidden;
  min-width: 300px;
}

.profile-dialog-header {
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, #0C3820, #1A8C55);

  .profile-header-orb {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.09);
  }
  .orb-1 { width: 180px; height: 180px; top: -60px; right: -50px; }
  .orb-2 { width: 100px; height: 100px; bottom: -30px; left: -20px; }
}

.profile-avatar {
  border: 2.5px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 6px 24px rgba(0,0,0,0.35);
}

.dialog-action-btn {
  border-radius: 14px !important;
  height: 44px;
  font-weight: 600;
}

// ── PWA install banner ───────────────────────────────────
.install-banner-wrap {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: calc(88px + env(safe-area-inset-bottom));
  z-index: 1300;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.install-banner {
  width: min(100%, 420px);
  border-radius: 20px !important;
  backdrop-filter: blur(22px) saturate(160%);
  background: rgba(255, 255, 255, 0.94);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.18),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  pointer-events: auto;
}

:global(.body--dark) .install-banner {
  background: rgba(12, 22, 40, 0.95);
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.07);
}

.install-banner-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 140, 85, 0.12);
  flex-shrink: 0;
}

.install-banner-title {
  font-weight: 800;
  font-size: 0.92rem;
  letter-spacing: 0.04rem;
}

.install-banner-text {
  margin-top: 4px;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--text-muted, #6a7280);
}

.install-banner-close {
  margin-top: -4px;
}

.install-banner-action {
  min-width: 110px;
}

.install-fade-enter-active,
.install-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.install-fade-enter-from,
.install-fade-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (max-width: 600px) {
  .install-banner-wrap {
    bottom: calc(104px + env(safe-area-inset-bottom));
  }

  .install-banner {
    width: 100%;
  }
}
</style>
