import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Dark } from 'quasar'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  function toggle() {
    isDark.value = !isDark.value
    Dark.set(isDark.value)
  }

  return { isDark, toggle }
})
