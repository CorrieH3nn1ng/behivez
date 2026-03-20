import { configure } from 'quasar/wrappers';
import path from 'path';
import brand from '@behivez/theme/brand';

export default configure(() => {
  return {
    boot: [],

    css: ['app.scss'],

    extras: [
      'roboto-font',
      'material-icons',
    ],

    build: {
      target: {
        browser: ['es2022', 'chrome100', 'firefox100', 'safari15'],
        node: 'node20',
      },
      typescript: {
        strict: true,
        vueShim: true,
      },
      vueRouterMode: 'history',
      viteVuePluginOptions: {},
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    devServer: {
      port: 9004,
      open: false,
    },

    framework: {
      config: {
        brand,
        notify: {
          position: 'top-right',
          timeout: 3000,
        },
      },
      plugins: [
        'Notify',
        'Dialog',
        'Loading',
        'LocalStorage',
      ],
    },

    animations: [],
  };
});
