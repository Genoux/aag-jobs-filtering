// types/CLI.ts
export interface FetchOptions {
  limit: number
}

export interface UploadOptions {
  dryRun: boolean
}

export interface CommandResult {
  success: boolean
  message: string
  error?: Error
}
