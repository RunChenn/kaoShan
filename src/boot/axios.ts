import { boot } from 'quasar/wrappers'
import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
})

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
