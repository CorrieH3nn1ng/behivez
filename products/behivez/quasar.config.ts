import { configure } from 'quasar/wrappers'
import brand from '@behivez/theme/brand'

export default configure((/* ctx */) => {
  return {
    boot: ['auth'],

    css: ['app.scss'],

    extras: [
      'roboto-font',
      'material-icons',
    ],

    build: {
      target: { browser: ['es2022', 'firefox115', 'chrome115', 'safari14'] },
      vueRouterMode: 'hash',
      vitePlugins: [],
    },

    devServer: {
      port: 8095,
      open: true,
    },

    framework: {
      config: { brand },
      plugins: [
        'Notify',
        'Dialog',
        'Loading',
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
  }
})
