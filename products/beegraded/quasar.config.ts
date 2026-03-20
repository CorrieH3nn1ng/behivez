import { configure } from 'quasar/wrappers'
import brand from '@behivez/theme/brand'

export default configure((/* ctx */) => {
  return {
    boot: ['axios'],

    css: ['app.scss'],

    extras: [
      'roboto-font',
      'material-icons',
    ],

    build: {
      target: { browser: ['es2022', 'firefox115', 'chrome115', 'safari14'] },
      vueRouterMode: 'hash',
      // publicPath: '/beegraded/',  // OLD: IP-based path routing
      // For domain-based hosting (beegraded.co.za), serve from root
      vitePlugins: [],
    },

    devServer: {
      port: 8090,
      open: true,
    },

    framework: {
      config: { brand },
      plugins: [
        'Notify',
        'Dialog',
        'Loading',
        'LocalStorage',
        'SessionStorage',
      ],
    },

    animations: [],

    ssr: { pwa: false },

    pwa: {
      workboxMode: 'GenerateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,
    },

    capacitor: { hideSplashscreen: true },
    electron: { builder: { appId: 'beegraded' } },
  }
})
