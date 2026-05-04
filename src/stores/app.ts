import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Phase = 'phase1' | 'phase2' | 'phase3' | 'line'

export interface AppConfig {
  theme: 'dark' | 'light'
  experience: 'beginner' | 'experienced'
  signal: 'online' | 'offline'
  risk: 'low' | 'mid' | 'high'
}

export const useAppStore = defineStore('app', () => {
  const phase = ref<Phase>('phase1')
  const config = ref<AppConfig>({
    theme: 'dark',
    experience: 'beginner',
    signal: 'online',
    risk: 'low',
  })

  // Apply theme to <html data-theme>
  watch(
    () => config.value.theme,
    (theme) => document.documentElement.setAttribute('data-theme', theme),
    { immediate: true },
  )

  function setPhase(p: Phase) {
    phase.value = p
  }

  function updateConfig(patch: Partial<AppConfig>) {
    config.value = { ...config.value, ...patch }
  }

  return { phase, config, setPhase, updateConfig }
})
