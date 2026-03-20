import { configure } from 'quasar/wrappers'

export default configure(() => {
  return {
    boot: ['axios'],

    css: ['app.scss'],

    extras: [
      'roboto-font',
      'material-icons',
    ],

    build: {
      target: { browser: ['es2022', 'firefox115', 'chrome115', 'safari14'] },
      vueRouterMode: 'history',
      vitePlugins: [],
    },

    devServer: {
      port: 8093,
      open: true,
    },

    framework: {
      config: {},
      plugins: [
        'Notify',
        'Dialog',
        'Loading',
        'LocalStorage',
      ],
    },

    animations: [],

    ssr: {
      pwa: false,
      prodPort: 8093,
      middlewares: [
        'render',
      ],
    },
  }
})
