declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY: string;
    }
  }
}

export {};