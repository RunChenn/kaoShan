import { boot } from 'quasar/wrappers'
import axios from 'axios'

const CLOUD_RUN_API_BASE_URL = 'https://kaoshan-backend-552312681167.asia-east1.run.app/api/v1'

function getDefaultApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'runchenn.github.io') {
    return CLOUD_RUN_API_BASE_URL
  }
  return 'http://localhost:8000/api/v1'
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl()

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
})

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
