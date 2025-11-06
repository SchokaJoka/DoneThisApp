// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false }, 
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
  ],
  runtimeConfig: {
    // Private server-only token for Replicate
    replicateApiToken: process.env.REPLICATE_API_TOKEN
  },
})