import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'

export default defineNuxtPlugin(async () => {
  const { firebase: firebaseConfig } = useRuntimeConfig().public

  // Reuse the existing app (avoids duplicate-app errors during HMR / SSR)
  const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

  // Analytics only works in the browser
  if (import.meta.client && firebaseConfig.measurementId && (await isSupported())) {
    getAnalytics(firebaseApp)
  }

  return {
    provide: { firebaseApp },
  }
})
