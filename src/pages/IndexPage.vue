<template>
  <div class="index-page">
    <!-- ── Layered Background ── -->
    <div class="bg-photo" />
    <div class="bg-gradient" />

    <!-- ── Floating Orbs (ambient glow) ── -->
    <div class="orb orb-green" />
    <div class="orb orb-teal" />

    <!-- ── Hero ── -->
    <div class="hero-section column items-center">
      <div class="logo-box anim-float">
        <q-icon name="landscape" size="48px" color="white" />
      </div>
      <div class="app-name anim-slide-up" style="animation-delay: 0.05s">
        靠山
      </div>
      <div class="app-tagline anim-slide-up" style="animation-delay: 0.12s">
        SMART HIKING ASSISTANT
      </div>
    </div>

    <!-- ── Bottom Action Area ── -->
    <div class="bottom-area q-px-md q-pb-xl">
      <!-- Unauthenticated -->
      <template v-if="!auth.isLoggedIn">
        <div class="login-card anim-slide-up" style="animation-delay: 0.1s">
          <div class="login-card-inner">
            <div
              class="text-h6 text-white text-weight-bold q-mb-xs"
              style="letter-spacing: 0.06rem"
            >
              安全上山，平安下山，有靠山，沒風險
            </div>
            <div
              class="text-body2 q-mb-lg"
              style="color: rgba(255, 255, 255, 0.62)"
            >
              AI 即時風險評估 · 緊急求救 · 家人守護
            </div>

            <div class="feature-row q-mb-xl">
              <span v-for="f in features" :key="f" class="feature-chip">{{
                f
              }}</span>
            </div>

            <q-btn
              unelevated
              size="lg"
              class="full-width line-btn"
              :loading="loading"
              @click="handleLogin"
            >
              <q-icon name="chat" size="20px" class="q-mr-sm" />
              使用 LINE 登入
            </q-btn>

            <div class="login-divider">
              <span>或</span>
            </div>

            <q-btn
              unelevated
              size="lg"
              class="full-width google-btn"
              :loading="loadingGoogle"
              @click="handleGoogleLogin"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 48 48"
                class="q-mr-sm"
                style="flex-shrink: 0"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              使用 Google 登入
            </q-btn>
          </div>
        </div>
      </template>

      <!-- Authenticated -->
      <template v-else>
        <!-- User row -->
        <div class="user-row anim-slide-up" style="animation-delay: 0.05s">
          <q-avatar size="48px" class="user-avatar">
            <img :src="auth.profile?.pictureUrl" />
          </q-avatar>
          <div class="q-ml-sm">
            <div
              class="text-subtitle2 text-white text-weight-bold"
              style="letter-spacing: 0.06rem"
            >
              {{ auth.profile?.displayName }}
            </div>
            <div class="text-caption" style="color: rgba(255, 255, 255, 0.55)">
              歡迎回來，準備好了嗎？
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="q-gutter-y-sm q-mt-sm">
          <button
            class="action-btn action-btn-primary anim-slide-up"
            style="animation-delay: 0.1s"
            @click="goToPrePlan"
          >
            <q-icon name="hiking" size="22px" />
            <span class="action-btn-label">出發前規劃</span>
            <q-icon
              name="chevron_right"
              size="20px"
              class="action-btn-chevron"
            />
          </button>

          <button
            class="action-btn action-btn-ghost anim-slide-up"
            style="animation-delay: 0.16s"
            @click="goToPlan"
          >
            <q-icon name="map" size="22px" />
            <span class="action-btn-label">登山中追蹤</span>
            <q-icon
              name="chevron_right"
              size="20px"
              class="action-btn-chevron"
            />
          </button>

          <button
            class="action-btn action-btn-ghost anim-slide-up"
            style="animation-delay: 0.22s"
            @click="goToReviewPlan"
          >
            <q-icon name="bar_chart" size="22px" />
            <span class="action-btn-label">登山後回顧</span>
            <q-icon
              name="chevron_right"
              size="20px"
              class="action-btn-chevron"
            />
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLiff } from 'src/composables/useLiff';
import { useAuthStore } from 'src/stores/auth';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const auth = useAuthStore();
const { login, loginWithGoogle } = useLiff();
const loading = ref(false);
const loadingGoogle = ref(false);

const features = ['AI 風險評估', '離線地圖', '緊急求救', '家人守護'];

function goToPrePlan() {
  if (!auth.isLoggedIn) return;
  router.push({ name: 'pre-departure' });
}

function goToPlan() {
  if (!auth.isLoggedIn) return;
  router.push({ name: 'active' });
}

function goToReviewPlan() {
  if (!auth.isLoggedIn) return;
  router.push({ name: 'summary' });
}

async function handleLogin() {
  loading.value = true;
  try {
    await login();
    router.push({ name: 'line' });
  } finally {
    loading.value = false;
  }
}

async function handleGoogleLogin() {
  loadingGoogle.value = true;
  try {
    await loginWithGoogle();
    router.push({ name: 'line' });
  } finally {
    loadingGoogle.value = false;
  }
}
</script>

<style lang="scss" scoped>
// ── Page shell ───────────────────────────────────────────
.index-page {
  min-height: 100dvh;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #04101c;
}

// ── Background layers ────────────────────────────────────
.bg-photo {
  position: absolute;
  inset: 0;
  background: url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=80')
    center / cover no-repeat;
  opacity: 0.38;
  transform: scale(1.04);
  transition: transform 12s ease;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(4, 16, 28, 0.25) 0%,
    rgba(6, 18, 32, 0.55) 35%,
    rgba(4, 16, 28, 0.88) 68%,
    rgba(4, 16, 28, 1) 100%
  );
}

// ── Ambient orbs ─────────────────────────────────────────
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}
.orb-green {
  width: 360px;
  height: 360px;
  background: rgba(26, 140, 85, 0.22);
  top: -120px;
  left: -80px;
  animation: float 7s ease-in-out infinite;
}
.orb-teal {
  width: 260px;
  height: 260px;
  background: rgba(0, 180, 120, 0.14);
  bottom: 40%;
  right: -60px;
  animation: float 9s ease-in-out 2s infinite;
}

// ── Hero ─────────────────────────────────────────────────
.hero-section {
  position: relative;
  z-index: 1;
  padding-top: max(72px, env(safe-area-inset-top, 0px) + 56px);
  gap: 10px;
}

.logo-box {
  width: 88px;
  height: 88px;
  border-radius: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    145deg,
    rgba(26, 140, 85, 0.55),
    rgba(14, 80, 48, 0.35)
  );
  border: 1px solid rgba(26, 140, 85, 0.45);
  box-shadow:
    0 8px 36px rgba(26, 140, 85, 0.42),
    0 2px 10px rgba(0, 0, 0, 0.35),
    0 1px 0 rgba(255, 255, 255, 0.1) inset;
  backdrop-filter: blur(12px);
}

.app-name {
  color: #fff;
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: 0.06rem;
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.45);
  line-height: 1;
}

.app-tagline {
  color: rgba(255, 255, 255, 0.38);
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.06rem;
}

// ── Bottom area ───────────────────────────────────────────
.bottom-area {
  position: relative;
  z-index: 1;
  padding-top: 16px;
}

// ── Login card ────────────────────────────────────────────
.login-card {
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 28px;
  box-shadow:
    0 10px 48px rgba(0, 0, 0, 0.42),
    0 1px 0 rgba(255, 255, 255, 0.09) inset;
  overflow: hidden;
}

.login-card-inner {
  padding: 28px 24px 24px;
}

.feature-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.feature-chip {
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(26, 140, 85, 0.22);
  border: 1px solid rgba(26, 140, 85, 0.38);
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.06rem;
  backdrop-filter: blur(8px);
}

.line-btn {
  position: relative;
  background: #06c755 !important;
  color: white !important;
  border-radius: 18px !important;
  font-size: 1rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.06rem;
  height: 54px;
  box-shadow:
    0 4px 24px rgba(6, 199, 85, 0.55),
    0 1px 4px rgba(0, 0, 0, 0.25) !important;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.18) 50%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: shimmer 2.8s linear infinite;
    pointer-events: none;
    border-radius: inherit;
  }

  &:active {
    transform: scale(0.97) !important;
  }
}

// ── Login divider ─────────────────────────────────────────
.login-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 14px 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.15);
  }

  span {
    color: rgba(255, 255, 255, 0.38);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.06rem;
  }
}

.google-btn {
  background: rgba(255, 255, 255, 0.92) !important;
  color: #1f1f1f !important;
  border-radius: 18px !important;
  font-size: 1rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.06rem;
  height: 54px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.25),
    0 1px 4px rgba(0, 0, 0, 0.15) !important;

  &:active {
    transform: scale(0.97) !important;
  }
}

// ── User row ─────────────────────────────────────────────
.user-row {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 12px 16px;
  backdrop-filter: blur(20px);
  margin-bottom: 12px;
}

.user-avatar {
  border: 2px solid rgba(26, 140, 85, 0.6);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  flex-shrink: 0;
}

// ── Action buttons ────────────────────────────────────────
.action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 18px;
  border: none;
  outline: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.06rem;
  transition: all 0.22s cubic-bezier(0.34, 1.2, 0.64, 1);

  &:active {
    transform: scale(0.97);
  }
}

.action-btn-label {
  flex: 1;
  text-align: left;
}

.action-btn-chevron {
  opacity: 0.35;
  margin-left: auto;
}

.action-btn-primary {
  background: linear-gradient(135deg, #1a8c55 0%, #0d6040 100%);
  color: white;
  box-shadow:
    0 5px 24px rgba(26, 140, 85, 0.52),
    0 1px 4px rgba(0, 0, 0, 0.2);

  &:hover {
    box-shadow:
      0 7px 32px rgba(26, 140, 85, 0.62),
      0 1px 4px rgba(0, 0, 0, 0.2);
  }
}

.action-btn-ghost {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.13) !important;
  backdrop-filter: blur(12px);

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
}
</style>
