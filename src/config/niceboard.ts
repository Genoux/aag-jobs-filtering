// config/niceboard.ts
import dotenv from 'dotenv'
import { NiceboardConfig } from '../types/niceboard'

dotenv.config()

export const niceboardConfig: NiceboardConfig = {
  apiBaseUrl: process.env.NICEBOARD_API_URL || 'https://jobs.aag.health/api/v1',
  apiKey: process.env.NICEBOARD_API_KEY || '',
  defaultCompanyId: 1,
  requestDelay: 5000,
}
