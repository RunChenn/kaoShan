/* eslint-env node */
import { configure } from 'quasar/wrappers'

export default configure(function (/* ctx */) {
  return {
    eslint: false,

    boot: ['axios', 'pinia', 'liff'],

    css: ['app.scss'],

    extras: [
      'roboto-font',
      'material-icons',
      'mdi-v7',
    ],

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node24',
      },
      publicPath: process.env.QUASAR_PUBLIC_FOLDER
        ? `/${process.env.QUASAR_PUBLIC_FOLDER}/`
        : '/',
      vueRouterMode: 'hash',
    },

    devServer: {
      open: false,
    },

    framework: {
      config: {
        brand: {
          primary: '#2E7D32',
          secondary: '#FF6F00',
          accent: '#9C27B0',
          dark: '#1d1d1d',
          'dark-page': '#121212',
          positive: '#21BA45',
          negative: '#C62828',
          info: '#31CCEC',
          warning: '#F2C037',
        },
        dark: false,
        notify: { position: 'bottom' },
      },

      iconSet: 'material-icons',
      lang: 'zh-TW',

      plugins: [
        'BottomSheet',
        'Dialog',
        'Loading',
        'LoadingBar',
        'Notify',
      ],
    },

    animations: [],

    pwa: {
      workboxMode: 'generateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,

      workboxOptions: {
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: /\/api\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },

      manifest: {
        name: '登山助理',
        short_name: '登山助理',
        description: '智慧登山輔助系統',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#2E7D32',
        icons: [
          { src: 'icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-256x256.png', sizes: '256x256', type: 'image/png' },
          { src: 'icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        shortcuts: [
          {
            name: '開始登山',
            short_name: '登山',
            url: '/#/hike/map',
            icons: [{ src: 'icons/icon-192x192.png', sizes: '192x192' }],
          },
          {
            name: '緊急求救',
            short_name: 'SOS',
            url: '/#/hike/sos',
            icons: [{ src: 'icons/icon-192x192.png', sizes: '192x192' }],
          },
        ],
      },
    },
  }
})
