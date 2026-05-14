<template>
  <div id="app" :data-theme="appStore.config.theme">
    <!-- Top Nav -->
    <nav class="top-nav glass" v-if="route.path !== '/login'">
      <div class="nav-logo">
        <img :src="logoUrl" alt="KaoShan logo" class="nav-logo-image" />
        <span>KaoShan</span>
      </div>

      <!-- <div class="nav-tabs">
        <button
          v-for="tab in TABS"
          :key="tab.path"
          class="nav-tab"
          :class="{ active: route.path === tab.path }"
          @click="router.push(tab.path)"
        >
          {{ tab.icon }} {{ tab.label }}
        </button>
      </div> -->

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
import logoUrl from 'src/assets/img/logo.png';
import { useAppStore } from 'src/stores/app';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();

const TABS = [
  { path: '/pre-departure', icon: '⛺', label: '出發前' },
  { path: '/active', icon: '🗺', label: '登山中' },
  { path: '/summary', icon: '📊', label: '登山後' },
  // { path: '/line', icon: '💬', label: 'LINE' },
];

function toggleTheme() {
  appStore.updateConfig({
    theme: appStore.config.theme === 'dark' ? 'light' : 'dark',
  });
}
</script>

<style></style>
