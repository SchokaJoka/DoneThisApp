// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  modules: ["@nuxtjs/supabase", "@nuxt/fonts", "nuxt-lottie"],
  pwa: {
    meta: {
      name: 'DoneThis',
      author: 'DoneThis',
      description: 'Track and celebrate small wins',
      theme_color: '#0ea5a4',
      lang: 'en',
      mobileApp: true,
      mobileAppIOS: true,
      ogHost: 'https://your-domain.example'
    },
    manifest: {
      name: 'DoneThis',
      short_name: 'DoneThis',
      description: 'Track and celebrate small wins',
      theme_color: '#0ea5a4',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      lang: 'en',
      icons: [
        { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml' }
      ]
    },
    workbox: {
      enabled: true,
      navigateFallback: '/'
    }
  },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },
  fonts: {
    families: [
      { name: 'Baloo Chettan 2', provider: 'google' },
      { name: 'Arial Rounded MT Bold', provider: 'local', src: '/fonts/Arial Rounded MT Bold/arialroundedmtbold.ttf' },
    ]
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    replicateApiToken: process.env.REPLICATE_API_TOKEN,
  },
  hooks: {
    "vite:extendConfig": extendViteConfig,
  }
});

function extendViteConfig(config: import("vite").UserConfig) {
  const plugin = config.plugins?.find((plugin) =>
    isPlugin(plugin, "nuxt:environments")
  );
  if (plugin) plugin.enforce = "pre";
}

function isPlugin(
  plugin: unknown,
  name: string
): plugin is import("vite").Plugin {
  return !!(
    plugin &&
    typeof plugin === "object" &&
    "name" in plugin &&
    plugin.name === name
  );
}