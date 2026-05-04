import { useAuthStore } from 'src/stores/auth'
import { ref } from 'vue'

const liffInitialized = ref(false)

export function useLiff() {
  const auth = useAuthStore()
  const loading = ref(false)

  async function initLiff(): Promise<void> {
    if (liffInitialized.value) return

    const liffId = import.meta.env.VITE_LIFF_ID

    // DEV 模式：直接 mock 登入
    if (!liffId || liffId === 'your_liff_id_here') {
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
        const profile = await liffAPI.getProfile()
        const token = liffAPI.getIDToken() ?? ''
        auth.setLoggedIn(
          {
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl ?? '',
            statusMessage: profile.statusMessage,
          },
          token
        )
      }
    } catch (e) {
      console.warn('[LIFF] init error, fallback to mock:', e)
      liffInitialized.value = true
      auth.setLiffReady()
    }
  }

  async function login(): Promise<void> {
    const liffId = import.meta.env.VITE_LIFF_ID

    if (!liffId || liffId === 'your_liff_id_here') {
      // Mock 登入
      auth.setLoggedIn(
        {
          userId: 'mock_user_001',
          displayName: '王小明',
          pictureUrl: 'https://i.pravatar.cc/150?img=32',
          statusMessage: '愛好登山',
        },
        'mock_id_token'
      )
      return
    }

    const liffAPI = await import('@line/liff').then(m => m.default)
    liffAPI.login()
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
    const liffId = import.meta.env.VITE_LIFF_ID
    if (liffId && liffId !== 'your_liff_id_here') {
      const liffAPI = await import('@line/liff').then(m => m.default)
      liffAPI.logout()
    }
    auth.logout()
  }

  async function shareResult(summary: { routeName: string; distance: string; duration: string }): Promise<void> {
    const liffId = import.meta.env.VITE_LIFF_ID

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
