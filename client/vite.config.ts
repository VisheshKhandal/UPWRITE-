import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Brand colours shared by the manifest, the HTML splash screen and the install splash.
const BRAND_BACKGROUND = "#0f1020";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // The user decides when a new version takes over (see PwaUpdatePrompt), so a
      // reload never discards an unsaved draft without consent.
      registerType: "prompt",
      // Registration happens in React via `virtual:pwa-register/react`.
      injectRegister: false,
      strategies: "generateSW",
      filename: "sw.js",
      manifestFilename: "manifest.webmanifest",
      includeAssets: ["favicon-32x32.png", "favicon-16x16.png", "apple-touch-icon.png", "UPWRITE logo.png"],
      manifest: {
        // Matches the `id` of the manifest previously shipped from /manifest.json, so
        // anyone who already installed the app keeps the same installation identity.
        id: "/",
        name: "Upwrite",
        short_name: "Upwrite",
        description: "Upwrite is a calm knowledge-sharing platform to read, write, save, and review what you learn.",
        lang: "en",
        dir: "ltr",
        start_url: "/?source=pwa",
        scope: "/",
        display: "standalone",
        background_color: BRAND_BACKGROUND,
        theme_color: BRAND_BACKGROUND,
        categories: ["education", "productivity", "books"],
        icons: [
          { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/maskable-icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ],
        shortcuts: [
          { name: "Write", short_name: "Write", url: "/write", icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" }] },
          { name: "Learn", short_name: "Learn", url: "/learn", icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" }] }
        ]
      },
      workbox: {
        // Precache only the public, versioned app shell. API responses are never cached:
        // they are private/user-specific and live on a different origin in production.
        globPatterns: ["**/*.{js,css,html,svg,ico,woff2}"],
        // Duplicate legacy icon copies that nothing references.
        globIgnores: ["**/icon-*.png"],
        // Serve the cached SPA shell for in-scope navigations (works offline and on refresh)
        // but never for API calls, server-rendered share pages or file-like URLs.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/share\//, /\/[^/?]+\.[a-z0-9]+$/i],
        cleanupOutdatedCaches: true,
        // Wait for the user to accept the update prompt.
        skipWaiting: false,
        clientsClaim: false,
        runtimeCaching: []
      },
      devOptions: {
        // No service worker during `vite` dev, so stale caches never confuse development.
        enabled: false
      }
    })
  ],
  server: {
    port: 5173,
    host: "localhost",
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 4173,
    host: "localhost",
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
    }
  }
});
