// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/i18n'],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'preconnect', href: 'https://images.unsplash.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@500;600&display=swap',
        },
      ],
    },
  },

  // Values are overridden at runtime by NUXT_PUBLIC_FIREBASE_* env vars (see .env.example)
  runtimeConfig: {
    public: {
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        measurementId: '',
      },
    },
  },

  // Admin panel depends on the browser's Firebase Auth session - render it client-side only
  routeRules: {
    '/admin': { ssr: false },
    '/admin/**': { ssr: false },
    '/en/admin': { ssr: false },
    '/en/admin/**': { ssr: false },
  },

  vite: {
    plugins: [tailwindcss()],
    // Pre-bundle Firebase so the dev server doesn't re-optimize and reload on first use
    optimizeDeps: {
      include: ['firebase/app', 'firebase/analytics', 'firebase/auth', 'firebase/firestore'],
    },
  },

  i18n: {
    // Used for hreflang/canonical links (Firebase Hosting URL). Override with NUXT_PUBLIC_I18N_BASE_URL
    // when using a custom domain.
    baseUrl: 'https://apointment-crm.web.app',
    defaultLocale: 'pl',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'pl', language: 'pl-PL', name: 'Polski', file: 'pl.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root',
    },
  },
})
