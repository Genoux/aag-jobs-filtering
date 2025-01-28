export interface JobTransformer {
  toNiceboard(job: JobsPikrJob): NiceboardJob
  fromNiceboard(job: NiceboardJob): JobsPikrJob
}

export interface BaseJob {
  title: string
  company_name: string
  city?: string
  state?: string
  country?: string
  job_type: string
  category?: string
  is_remote: boolean
  has_expired?: boolean
  apply_url?: string
  contact_email?: string
  post_date?: string
  description?: string
}


export interface JobsPikrJob {
  uniq_id: number
  crawl_timestamp: string
  url: string
  job_title: string
  company_name: string
  post_date: string
  job_board: string
  job_type:
    | 'Full Time'
    | 'Part Time'
    | 'Contract'
    | 'Internship'
    | 'Volunteer'
    | 'Not specified'
  category: string
  city: string
  state: string
  country: string
  inferred_city?: string
  inferred_state?: string
  inferred_country?: string
  job_description?: string
  html_job_description?: string
  salary_offered?: string
  contact_email?: string
  contact_phone_number?: string
  valid_through?: string
  has_expired?: boolean
  latest_expiry_check_date?: string
  apply_url?: string
  is_remote: boolean
  inferred_salary_currency?: string
  inferred_salary_time_unit?: 'yearly' | 'monthly' | 'weekly' | 'hourly' | 'daily'
  inferred_salary_from?: number
  inferred_salary_to?: number
  cursor?: number
}

export interface JobsPikrApiResponse {
  status: 'success' | 'no_data' | 'error'
  message: string
  next_cursor?: number
  total_count: number
  size: number
  job_credit_remaining: number
  job_data: JobsPikrJob[]
}

export interface JobLocation {
  id: number
  city_short: string
  state_short: string
  country_long: string
}

export interface JobCompany {
  id: number
  name: string
}

export interface JobType {
  id: number
  name: string
}

// // What we get from Niceboard API
// export interface NiceboardJob {
//   id?: number
//   title: string
//   company: JobCompany
//   location?: JobLocation
//   jobtype: JobType
//   published_at?: string
// }

export interface NiceboardJob extends BaseJob {
  id?: number
  company: {
    id: number
    name: string
  }
  location?: {
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

export interface SerializedJob {
  title: string
  company_name: string
  city?: string
  state?: string
  country?: string
  job_type: string
  category?: string
  is_remote: boolean
  has_expired?: boolean
  apply_url?: string
  contact_email?: string
  post_date?: string
  description?: string
}

export interface SearchQueryField {
  query_string?: {
    default_field?: string
    fields?: string[]
    query: string
  }
  exists?: {
    field: string
  }
  bool?: {
    must?: SearchQueryField[]
    must_not?: SearchQueryField[]
    should?: SearchQueryField[]
  }
  range?: {
    [key: string]: {
      gte?: string | number
      lte?: string | number
    }
  }
}

export interface SearchQuery {
  format?: 'json' | 'xml'
  size?: number
  dataset?: string[]
  cursor?: string | number
  search_query_json: {
    bool?: {
      must?: SearchQueryField[]
      must_not?: SearchQueryField[]
      should?: SearchQueryField[]
    }
    query_string?: {
      default_field?: string
      fields?: string[]
      query: string
    }
    range?: {
      [key: string]: {
        gte?: string | number
        lte?: string | number
      }
    }
    exists?: {
      field: string
    }
  }
}