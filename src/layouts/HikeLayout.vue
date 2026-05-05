<template>
  <div id="app" :data-theme="appStore.config.theme">
    <!-- Top Nav -->
    <nav class="top-nav glass" v-if="route.path !== '/'">
      <div class="nav-logo">
        <svg width="24" height="22" viewBox="0 0 24 22" fill="none">
          <path
            d="M12 2L2 20h20L12 2z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path
            d="M7 20L12 11l5 9"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linejoin="round"
          />
        </svg>
        <span>KaoShan</span>
      </div>

      <div class="nav-tabs">
        <button
          v-for="tab in TABS"
          :key="tab.path"
          class="nav-tab"
          :class="{ active: route.path === tab.path }"
          @click="router.push(tab.path)"
        >
          {{ tab.icon }} {{ tab.label }}
        </button>
      </div>

      <div class="nav-actions">
        <button
          class="nav-icon-btn"
          @click="toggleTheme"
          :title="appStore.config.theme === 'dark' ? '切換亮色' : '切換暗色'"
        >
          {{ appStore.config.theme === 'dark' ? '☀' : '🌙' }}
        </button>
      </div>
    </nav>

    <!-- Offline banner -->
    <div v-if="appStore.config.signal === 'offline'" class="offline-banner">
      📵 離線模式 — 地圖使用快取資料，部分功能不可用
    </div>

    <!-- Page content -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Mobile Nav -->
    <div class="mobile-nav glass">
      <div class="mobile-nav-inner">
        <button
          v-for="tab in TABS"
          :key="tab.path"
          class="mobile-nav-btn"
          :class="{ active: route.path === tab.path }"
          @click="router.push(tab.path)"
        >
          <span class="icon">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <!-- Tweaks Panel (dev only) -->
    <!-- <TweaksPanel /> -->
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from 'src/stores/app';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();

const TABS = [
  { path: '/pre-departure', icon: '⛺', label: '出發前' },
  { path: '/active', icon: '🗺', label: '登山中' },
  { path: '/summary', icon: '📊', label: '登山後' },
  { path: '/line', icon: '💬', label: 'LINE' },
];

function toggleTheme() {
  appStore.updateConfig({
    theme: appStore.config.theme === 'dark' ? 'light' : 'dark',
  });
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);
  color: var(--text-primary);
  transition:
    background 0.3s ease,
    color 0.3s ease;
}
</style>
