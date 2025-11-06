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
  hooks: {
    'vite:extendConfig': extendViteConfig,
  },
})

function extendViteConfig(config: import('vite').UserConfig) {
   const plugin = config.plugins?.find(plugin => isPlugin(plugin, 'nuxt:environments'))
   if (plugin) plugin.enforce = 'pre'
}

function isPlugin(plugin: unknown, name: string): plugin is import('vite').Plugin {
   return !!(plugin && typeof plugin === 'object' && 'name' in plugin && plugin.name === name)
}