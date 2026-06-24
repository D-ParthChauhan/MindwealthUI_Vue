export default defineNuxtConfig({
  compatibilityDate: '2025-05-25',
  devtools: { enabled: true },
  runtimeConfig: {
    apiBaseUrl: process.env.NUXT_API_BASE_URL || 'http://51.20.53.218:8506',
    apiKey: process.env.NUXT_API_KEY || '',
    /** Set NUXT_USE_MOCK_DATA=true to restore mock fallbacks when the API is unreachable */
    useMockData: process.env.NUXT_USE_MOCK_DATA === 'true',
    public: {
      adminMode: process.env.NUXT_PUBLIC_ADMIN_MODE === 'true',
    },
  },
  css: ['~/assets/css/main.css', '~/assets/css/mobile.css'],
  app: {
    head: {
      title: 'MindWealth · Alpha Terminal',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap',
        },
      ],
    },
  },
})
