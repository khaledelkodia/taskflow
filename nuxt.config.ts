// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: {
    compatibilityVersion: 4
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@vueuse/nuxt',
    '@nuxtjs/i18n'
  ],

  supabase: {
    redirect: true,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/portal/*', '/login']
    }
  },

  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', file: 'en.json', dir: 'ltr' },
      { code: 'ar', iso: 'ar-EG', file: 'ar.json', dir: 'rtl' }
    ],
    defaultLocale: 'en',
    strategy: 'no_prefix',
    lazy: true,
    langDir: 'locales/'
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'TaskFlow — Enterprise Task Management',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'TaskFlow — Enterprise-grade task and project management platform for software development teams and clients.'
        },
        { name: 'theme-color', content: '#2563EB' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800&display=swap'
        }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' }
  },

  typescript: {
    strict: true,
    typeCheck: false
  },

  runtimeConfig: {
    public: {
      appName: 'TaskFlow',
      appVersion: '1.0.0'
    }
  },

  devtools: { enabled: true }
})
