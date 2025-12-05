// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  modules: ["@nuxtjs/supabase", "@nuxt/fonts", "nuxt-lottie"],
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