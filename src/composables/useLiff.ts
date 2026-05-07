import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth'
import { ref } from 'vue'

const liffInitialized = ref(false)
const POST_LOGIN_REDIRECT_KEY = '__liff_post_login_redirect__'
const DEFAULT_LIFF_ID = '2009970633-zYGV9XSy'
const GOOGLE_SCRIPT_ID = 'google-identity-services'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string
            callback: (response: { credential?: string }) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          prompt: (momentListener?: (notification: unknown) => void) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

function getLiffId(): string {
  return import.meta.env.VITE_LIFF_ID || DEFAULT_LIFF_ID
}

function getLiffRedirectUri(): string {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  return url.toString()
}

function getGoogleClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
}

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google Identity Services 載入失敗')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = GOOGLE_SCRIPT_ID
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google Identity Services 載入失敗'))
    document.head.appendChild(script)
  })
}

export function useLiff() {
  const auth = useAuthStore()
  const loading = ref(false)

  async function authenticateWithBackend(idToken: string, accessToken?: string | null): Promise<void> {
    const { data } = await api.post<{
      jwt_token: string
      user_id: string
      display_name: string
      picture_url?: string | null
    }>('/auth/line', {
      id_token: idToken,
      access_token: accessToken ?? undefined,
    })

    auth.setLoggedIn(
      {
        userId: data.user_id,
        displayName: data.display_name,
        pictureUrl: data.picture_url ?? '',
      },
      data.jwt_token,
      'line'
    )
  }

  async function initLiff(): Promise<void> {
    if (liffInitialized.value) return

    const liffId = getLiffId()

    if (!liffId || liffId === 'your_liff_id_here') {
      console.warn('[LIFF] VITE_LIFF_ID 未設定，LINE 實際登入不可用')
      liffInitialized.value = true
      auth.setLiffReady()
      return
    }

    try {
      const liffAPI = await import('@line/liff').then(m => m.default)
      await liffAPI.init({ liffId })
      liffInitialized.value = true
      auth.setLiffReady()

      if (liffAPI.isLoggedIn()) {
        const idToken = liffAPI.getIDToken()
        if (!idToken) throw new Error('LIFF id_token 取得失敗')
        try {
          await authenticateWithBackend(idToken, liffAPI.getAccessToken())
        } catch {
          // 後端不可用時（如 GitHub Pages demo），直接用 LIFF profile 登入
          const profile = await liffAPI.getProfile()
          auth.setLoggedIn(
            {
              userId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl ?? '',
            },
            'liff_only',
            'line'
          )
        }
      }
    } catch (e) {
      console.warn('[LIFF] init error:', e)
      liffInitialized.value = true
      auth.setLiffReady()
    }
  }

  async function login(redirectPath = '/pre-departure'): Promise<void> {
    const liffId = getLiffId()

    if (!liffId || liffId === 'your_liff_id_here') {
      throw new Error('VITE_LIFF_ID 未設定，無法使用 LINE 實際登入')
    }

    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, redirectPath)
    const liffAPI = await import('@line/liff').then(m => m.default)
    if (!liffAPI.isLoggedIn()) {
      liffAPI.login({ redirectUri: getLiffRedirectUri() })
      return
    }

    const idToken = liffAPI.getIDToken()
    if (!idToken) throw new Error('LIFF id_token 取得失敗')
    try {
      await authenticateWithBackend(idToken, liffAPI.getAccessToken())
    } catch {
      const profile = await liffAPI.getProfile()
      auth.setLoggedIn(
        {
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl ?? '',
        },
        'liff_only',
        'line'
      )
    }
  }

  async function loginWithGoogle(): Promise<void> {
    const clientId = getGoogleClientId()
    if (!clientId) {
      throw new Error('VITE_GOOGLE_CLIENT_ID 未設定，無法使用 Google 實際登入')
    }

    await loadGoogleIdentityScript()

    await new Promise<void>((resolve, reject) => {
      let settled = false

      window.google?.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: async (response) => {
          if (!response.credential) {
            if (!settled) {
              settled = true
              reject(new Error('Google credential 取得失敗'))
            }
            return
          }

          try {
            const { data } = await api.post<{
              jwt_token: string
              user_id: string
              display_name: string
              picture_url?: string | null
              email?: string | null
            }>('/auth/google', {
              credential: response.credential,
            })

            auth.setLoggedIn(
              {
                userId: data.user_id,
                displayName: data.display_name,
                pictureUrl: data.picture_url ?? '',
              },
              data.jwt_token,
              'google'
            )
            if (!settled) {
              settled = true
              resolve()
            }
          } catch (e) {
            if (!settled) {
              settled = true
              reject(e)
            }
          }
        },
      })

      window.google?.accounts.id.prompt(() => {
        window.setTimeout(() => {
          if (!settled) {
            settled = true
            reject(new Error('Google 登入視窗未完成，請確認第三方 Cookie 或彈窗設定'))
          }
        }, 30000)
      })
    })
  }

  async function logout(): Promise<void> {
    const liffId = getLiffId()
    if (liffId && liffId !== 'your_liff_id_here') {
      const liffAPI = await import('@line/liff').then(m => m.default)
      liffAPI.logout()
    }
    window.google?.accounts.id.disableAutoSelect()
    auth.logout()
  }

  async function shareResult(summary: { routeName: string; distance: string; duration: string }): Promise<void> {
    const liffId = getLiffId()

    if (!liffId || liffId === 'your_liff_id_here') {
      console.log('[LIFF] shareResult stub:', summary)
      return
    }

    const liffAPI = await import('@line/liff').then(m => m.default)
    await liffAPI.shareTargetPicker([
      {
        type: 'flex',
        altText: `登山紀錄：${summary.routeName}`,
        contents: {
          type: 'bubble',
          hero: {
            type: 'image',
            url: 'https://picsum.photos/seed/hiking/400/250',
            size: 'full',
            aspectRatio: '20:13',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: summary.routeName, weight: 'bold', size: 'xl' },
              { type: 'text', text: `距離：${summary.distance}`, size: 'sm', color: '#666' },
              { type: 'text', text: `時間：${summary.duration}`, size: 'sm', color: '#666' },
            ],
          },
        },
      },
    ])
  }

  return { initLiff, login, loginWithGoogle, logout, shareResult, loading }
}
