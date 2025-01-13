// utils/logger.ts
export const logger = {
  info: (message: string, meta?: object) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '')
  },
  error: (message: string, error: unknown) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error)
  },
  warn: (message: string, meta?: object) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '')
  },
  debug: (message: string, meta?: object) => {
    console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '')
  },
}
