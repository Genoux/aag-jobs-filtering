// types/niceboard.ts
export interface NiceboardJobsResponse {
  total_count: number
  jobs: NiceboardJob[]
}

export interface NiceboardJob {
  id?: number
  title: string
  company: {
    id: number
    name: string
  }
  location: {
    id: number
    city_short: string
    state_short: string
    country_long: string
  }
  jobtype: {
    id: number
    name: string
  }
  published_at?: string
}

export interface NiceboardJobPayload {
  company_id: number
  jobtype_id: number
  title: string
  category_id?: number
  description_html: string
  apply_by_form: boolean
  apply_url?: string
  apply_email?: string
  is_published: boolean
  remote_only: boolean
  location_id?: number
  salary_min?: number
  salary_max?: number
  salary_timeframe?: string
  salary_currency?: string
}

export interface NiceboardConfig {
  apiBaseUrl: string
  apiKey: string
  defaultCompanyId: number
  requestDelay: number
}
