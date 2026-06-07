import { boot } from 'quasar/wrappers'
import axios from 'axios'

const CLOUD_RUN_API_BASE_URL = 'https://kaoshan-backend-552312681167.asia-east1.run.app/api/v1'

function getProductionApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'runchenn.github.io') {
    return CLOUD_RUN_API_BASE_URL
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
}

// dev 模式固定走相對路徑 /api/v1，讓 Vite proxy 轉發請求（解決跨 IP CORS 問題）
// prod 模式才讀 VITE_API_BASE_URL 或 Cloud Run URL
const apiBaseUrl = import.meta.env.DEV ? '/api/v1' : getProductionApiBaseUrl()

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
})

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
