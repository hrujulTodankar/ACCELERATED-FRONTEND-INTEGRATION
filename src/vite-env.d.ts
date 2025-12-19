interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_BHIV_API_URL: string
  readonly VITE_BHIV_MCP_URL: string
  readonly VITE_BHIV_WEB_URL: string
  readonly VITE_USE_BHIV_ANALYTICS: string
  readonly VITE_USE_BHIV_NLP: string
  readonly VITE_USE_BHIV_TAGS: string
  readonly VITE_ENABLE_BHIV_FALLBACK: string
  readonly VITE_DEV_MODE: string
  readonly VITE_USE_MOCK_DATA_WHEN_BHIV_UNAVAILABLE: string
  readonly VITE_BHIV_TIMEOUT: string
  readonly VITE_BHIV_ANALYTICS_TIMEOUT: string
  readonly VITE_INSIGHTBRIDGE_API_URL: string
  readonly VITE_USE_INSIGHTBRIDGE_BACKEND: string
  readonly VITE_USE_INSIGHTBRIDGE_SECURITY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}