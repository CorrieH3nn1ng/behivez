declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined
    VUE_ROUTER_BASE: string | undefined
  }
}

interface ImportMetaEnv {
  VITE_API_URL: string
  VITE_PAYFAST_MERCHANT_ID: string
  VITE_PAYFAST_MERCHANT_KEY: string
  VITE_PAYFAST_PASSPHRASE: string
  VITE_PAYFAST_URL: string
  VITE_PAYFAST_RETURN_URL: string
  VITE_PAYFAST_CANCEL_URL: string
  VITE_PAYFAST_NOTIFY_URL: string
}
