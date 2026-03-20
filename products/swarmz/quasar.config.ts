import { configure } from 'quasar/wrappers';
import brand from '@behivez/theme/brand';

export default configure(function () {
  return {
    eslint: {
      warnings: true,
      errors: true
    },

    boot: [
      'axios'
    ],

    css: [
      'app.scss'
    ],

    extras: [
      'roboto-font',
      'material-icons'
    ],

    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node18'
      },

      vueRouterMode: 'hash',

      vitePlugins: [
        ['vite-plugin-checker', {
          vueTsc: {
            tsconfigPath: 'tsconfig.vue-tsc.json'
          },
          eslint: {
            lintCommand: 'eslint "./**/*.{js,ts,mjs,cjs,vue}"'
          }
        }, { server: false }]
      ]
    },

    devServer: {
      port: 8092,
      open: true
    },

    framework: {
      config: { brand },

      plugins: [
        'Notify',
        'Dialog',
        'Loading',
        'LocalStorage',
        'SessionStorage',
        'BottomSheet'
      ]
    },

    animations: [],

    ssr: {
      pwa: false,
      prodPort: 3000,
      middlewares: [
        'render'
      ]
    },

    pwa: {
      workboxMode: 'generateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false
    },

    capacitor: {
      hideSplashscreen: true,
      capacitorCliPreparationParams: ['sync']
    },

    electron: {
      inspectPort: 5858,
      bundler: 'packager',
      packager: {},
      builder: {
        appId: 'swarmz'
      }
    },

    bex: {
      contentScripts: [
        'my-content-script'
      ]
    }
  };
});
