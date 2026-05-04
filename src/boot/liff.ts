import { boot } from 'quasar/wrappers'
import { useLiff } from 'src/composables/useLiff'

export default boot(async () => {
  const { initLiff } = useLiff()
  await initLiff()
})
