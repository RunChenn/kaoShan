import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface LineProfile {
  userId: string
  displayName: string
  pictureUrl: string
  statusMessage?: string
}

export type LoginMethod = 'line' | 'google' | 'guest'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const liffReady = ref(false)
  const profile = ref<LineProfile | null>(null)
  const idToken = ref<string | null>(null)
  const loginMethod = ref<LoginMethod | null>(null)

  function setLoggedIn(p: LineProfile, token: string, method: LoginMethod = 'line') {
    isLoggedIn.value = true
    profile.value = p
    idToken.value = token
    loginMethod.value = method
  }

  function setLiffReady() {
    liffReady.value = true
  }

  function logout() {
    isLoggedIn.value = false
    profile.value = null
    idToken.value = null
    loginMethod.value = null
  }

  return { isLoggedIn, liffReady, profile, idToken, loginMethod, setLoggedIn, setLiffReady, logout }
})
