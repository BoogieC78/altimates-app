/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Active le branchement sur les émulateurs Firebase (mode E2E). Voir src/core/firebase/app.ts. */
  readonly VITE_USE_EMULATOR?: string
  /** Hôte des émulateurs (défaut 127.0.0.1). Utile en CI/conteneur. */
  readonly VITE_EMULATOR_HOST?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
