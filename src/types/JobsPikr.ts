// types/JobsPikr.ts
export type JobsPikrTimeUnit =
  | 'yearly'
  | 'monthly'
  | 'weekly'
  | 'hourly'
  | 'daily'

export interface JobsPikrJob {
  crawl_timestamp: string;
  url: string;
  job_title: string;
  company_name: string;
  post_date: string;
  job_board: string;
  job_type?: 'Full Time' | 'Part Time' | 'Contract' | 'Internship' | 'Volunteer' | 'Not specified';
  category?: string;
  city?: string;
  state?: string;
  country?: string;
  inferred_city?: string;
  inferred_state?: string;
  inferred_country?: string;
  job_description?: string;
  html_job_description?: string;
  salary_offered?: string;
  contact_email?: string;
  contact_phone_number?: string;
  uniq_id?: string;
  valid_through?: string;
  has_expired?: boolean;
  latest_expiry_check_date?: string;
  apply_url?: string;
  is_remote?: boolean;
  inferred_salary_currency?: string;
  inferred_salary_time_unit?: JobsPikrTimeUnit;  // Updated this type
  inferred_salary_from?: number;
  inferred_salary_to?: number;
  cursor?: number;
}

export interface SearchQuery {
  size?: number;
  cursor?: string | number;
  format?: 'json' | 'xml';
  search_query_json: {
    query_string?: {
      default_field?: string;
      fields?: string[];
      query: string;
    };
    bool?: {
      must?: any[];
      must_not?: any[];
      should?: any[];
    };
    range?: {
      [key: string]: {
        gte?: string | number;
        lte?: string | number;
      };
    };
    exists?: {
      field: string;
    };
  };
}

export interface ApiResponse {
  status: 'success' | 'no_data' | 'error';
  message: string;
  total_count?: number;
  job_data?: JobsPikrJob[];
  next_cursor?: string;
  job_credit_remaining?: number;
}

export interface ApiConfig {
  API_BASE_URL: string;
  headers: {
    client_id: string;
    client_auth_key: string;
    'Content-Type': string;
  };
}