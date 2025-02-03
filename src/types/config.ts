// types/config.ts

import { ApiConfig } from "./common"

export interface NiceboardConfig extends ApiConfig {
  defaultCompanyId: number
  requestDelay: number
}

export interface CommandOptions {
  limit?: number
  dryRun?: boolean
}

export interface CommandResult {
  success: boolean
  message: string
  error?: Error
}