// types/JobSearch.ts
export interface SearchQuery {
  size?: number;
  cursor?: number;
  format?: 'json' | 'xml';
  search_query_json: any;
  exclude_duplicates?: boolean;
  dataset?: ('job_board' | 'f500')[];
}

export interface SearchResponse {
  jobs: JobsPikrJob[];
  total: number;
  nextCursor?: number;
  error?: string;
  jobCreditsRemaining?: number;
}

export interface JobsPikrJob {
  // Mandatory fields according to the API blueprint
  crawl_timestamp: string;
  url: string;
  job_title: string;
  company_name: string;
  post_date: string;
  uniq_id: string;
  job_board: string;

  // Optional fields
  category?: string;
  city?: string;
  state?: string;
  country?: string;
  inferred_city?: string;
  inferred_state?: string;
  inferred_country?: string;
  job_description?: string;
  html_job_description?: string;
  job_type?: 'Full Time' | 'Part Time' | 'Contract' | 'Internship' | 'Volunteer';
  salary_offered?: string;
  cursor?: number;
  contact_email?: string;
  contact_phone_number?: string;
  valid_through?: string;
  has_expired?: boolean;
  latest_expiry_check_date?: string;
  duplicate_status?: 'NA' | 'true' | 'false';
  duplicate_of?: string;

  // ML-generated fields
  inferred_department_name?: string;
  inferred_department_score?: number; // 0-100
  inferred_job_title?: string;
  is_remote?: boolean;
  inferred_salary_currency?: string; // ISO 4217 code
  inferred_salary_time_unit?: 'yearly' | 'monthly' | 'weekly' | 'daily' | 'hourly';
  inferred_salary_from?: number;
  inferred_salary_to?: number;
  inferred_skills?: string[];
  inferred_company_type?: 'agency' | 'company';
  inferred_company_type_score?: number; // 0-100
  inferred_min_experience?: number;
  inferred_max_experience?: number;
  inferred_seniority_level?: 'Entry Level' | 'Mid Level' | 'Executive Level';
  inferred_iso3_lang_code?: string;
  
  // Additional fields
  apply_url?: string;
  logo_url?: string;
  is_salary_estimated?: boolean;
  inferred_education_level?: string;
  inferred_onet_soc_code?: string;
  inferred_onet_soc_job_title?: string;
  inferred_co_website_url?: string;
  extra_fields?: Record<string, any>;
}

export interface SavedQueryResult {
  query: {
    name: string;
    description: string;
  };
  stats: {
    totalFound: number;
    returned: number;
    searchDate: string;
  };
  jobs: JobsPikrJob[];
}

export interface ProcessedJob {
  title: string;         // maps to job_title
  company: string;       // maps to company_name
  city?: string;
  state?: string;
  country?: string;
  job_type: string;
  is_remote: string;     // "Yes" or "No" for CSV readability
  salary_min?: number;   // maps to inferred_salary_from
  salary_max?: number;   // maps to inferred_salary_to
  salary_currency?: string;
  salary_period?: string;
  description: string;   // maps to html_job_description or job_description
  apply_url: string;
  apply_email: string;
  post_date: string;
  original_url: string;  // maps to url
}
export interface QuerySummaryStats {
  name: string;
  description: string;
  jobCount: number;
  locations: Record<string, number>;
  jobTypes: Record<string, number>;
  remoteCount: number;
  salaryStats?: {
    min: number;
    max: number;
    currency: string;
    count: number;
  } | null;
}

export interface DailySummary {
  timestamp: string;
  queries: Record<string, QuerySummaryStats>;
  totalJobs: number;
  queryCount: number;
}

export interface ApiErrorResponse {
  status: 'error' | 'no_data';
  message: string;
}

export interface ApiSuccessResponse {
  status: 'success';
  message: string;
  next_cursor?: number;
  total_count: number;
  size: number;
  job_credit_remaining: number;
  job_data: JobsPikrJob[];
}

export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;