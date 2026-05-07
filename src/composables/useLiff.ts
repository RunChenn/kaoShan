import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth'
import { ref } from 'vue'

const liffInitialized = ref(false)
const POST_LOGIN_REDIRECT_KEY = '__liff_post_login_redirect__'
const DEFAULT_LIFF_ID = '2009970633-zYGV9XSy'

function getLiffId(): string {
  return import.meta.env.VITE_LIFF_ID || DEFAULT_LIFF_ID
}

function getLiffRedirectUri(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString()
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
    // Mock Google 登入
    auth.setLoggedIn(
      {
        userId: 'google_user_001',
        displayName: '陳小華',
        pictureUrl: 'https://i.pravatar.cc/150?img=47',
        statusMessage: '喜歡走步道',
      },
      'mock_google_token',
      'google'
    )
  }

  async function logout(): Promise<void> {
    const liffId = getLiffId()
    if (liffId && liffId !== 'your_liff_id_here') {
      const liffAPI = await import('@line/liff').then(m => m.default)
      liffAPI.logout()
    }
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
