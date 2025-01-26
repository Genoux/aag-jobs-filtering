// types/JobSearch.ts
import { JobsPikrJob } from './jobspikr'

export interface SavedQueryResult {
  query: {
    name: string
    description: string
  }
  stats: {
    totalFound: number
    returned: number
    searchDate: string
  }
  jobs: JobsPikrJob[]
}

export interface ProcessedJob {
  title: string
  company_name: string
  city?: string
  state?: string
  country?: string
  job_type: string
  is_remote: string
  has_expired: string
  description: string
  apply_url: string
  contact_email: string
  post_date: string
  original_url: string
}

export interface QuerySummaryStats {
  name: string
  description: string
  jobCount: number
  locations: Record<string, number>
  jobTypes: Record<string, number>
  remoteCount: number
  expiredCount: number
}

export interface DailySummary {
  timestamp: string
  queries: Record<string, QuerySummaryStats>
  totalJobs: number
  queryCount: number
}

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

// types/common.ts
export interface ApiConfig {
  baseUrl: string
  apiKey: string
  headers?: Record<string, string>
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'DELETE'
  params?: Record<string, any>
  data?: any
  headers?: Record<string, string>
}

export interface ApiResponse<T> {
  error: boolean
  results: T
}
