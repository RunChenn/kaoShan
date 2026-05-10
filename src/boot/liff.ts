import { boot } from 'quasar/wrappers'
import { useLiff } from 'src/composables/useLiff'
import { useAuthStore } from 'src/stores/auth'

const POST_LOGIN_REDIRECT_KEY = '__liff_post_login_redirect__'
const LIFF_REDIRECT_PENDING_KEY = '__liff_redirect_pending__'
const PUBLIC_ROUTE_NAMES = new Set(['login'])
let authGuardInstalled = false

export default boot(async ({ router }) => {
  // LIFF SDK 在 init() 期間會清除 URL 參數，必須在 init 前先判斷
  const liffId = import.meta.env.VITE_LIFF_ID as string | undefined
  const searchParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null
  const isLiffEndpointPath = Boolean(
    typeof window !== 'undefined' &&
      liffId &&
      liffId !== 'your_liff_id_here' &&
      window.location.pathname.endsWith(`/${liffId}`)
  )
  const isLiffCallback = Boolean(
    searchParams &&
      (
        searchParams.has('liffClientId') ||
        searchParams.has('liffRedirectUri') ||
        searchParams.has('liff.state') ||
        (searchParams.has('code') && searchParams.has('state'))
      )
  )
  const shouldHandleLiffRedirect = Boolean(
    isLiffCallback ||
      isLiffEndpointPath ||
      (typeof window !== 'undefined' && sessionStorage.getItem(LIFF_REDIRECT_PENDING_KEY))
  )

  if (isLiffCallback || isLiffEndpointPath) {
    sessionStorage.setItem(LIFF_REDIRECT_PENDING_KEY, '1')
    if (!sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)) {
      sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, '/pre-departure')
    }
  }

  const { initLiff } = useLiff()
  await initLiff()
  const auth = useAuthStore()

  // if (!authGuardInstalled) {
  //   authGuardInstalled = true
  //   router.beforeEach((to) => {
  //     const isLiffEndpointRoute = Boolean(
  //       liffId &&
  //         liffId !== 'your_liff_id_here' &&
  //         to.path.endsWith(`/${liffId}`)
  //     )
  //     const isLiffCallbackRoute = Boolean(
  //       'liffClientId' in to.query ||
  //         'liffRedirectUri' in to.query ||
  //         'liff.state' in to.query ||
  //         ('code' in to.query && 'state' in to.query)
  //     )

  //     if (isLiffEndpointRoute || isLiffCallbackRoute) {
  //       return true
  //     }

  //     if (PUBLIC_ROUTE_NAMES.has(String(to.name))) {
  //       return true
  //     }

  //     if (!auth.isLoggedIn) {
  //       return {
  //         path: '/login',
  //         query: to.fullPath === '/' ? {} : { redirect: to.fullPath },
  //       }
  //     }

  //     return true
  //   })
  // }

  // 只有從 LINE OAuth 返回或停在 LIFF endpoint path 時才主動重導
  if (!shouldHandleLiffRedirect) return

  await router.isReady()
  const postLoginRedirect = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY) || '/pre-departure'
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
  sessionStorage.removeItem(LIFF_REDIRECT_PENDING_KEY)

  router.replace(auth.isLoggedIn ? postLoginRedirect : { path: '/login' })
})
