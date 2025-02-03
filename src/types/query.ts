// types/query.ts
import { JobsPikrJob } from './job'

export interface QueryResult {
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

export interface QueryStats {
  name: string
  description: string
  jobCount: number
  remoteCount: number
  expiredCount: number
}

export interface Summary {
  timestamp: string
  queries: Record<string, QueryStats>
  totalJobs: number
  queryCount: number
}