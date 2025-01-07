// types/JobSearch.ts

// API-related types
export interface SearchQuery {
  size?: number;
  cursor?: number;
  format?: 'json' | 'xml';
  search_query_json: {
    bool: {
      must: Array<{
        query_string?: {
          fields: string[];
          query: string;
        };
      }>;
    };
  };
  exclude_duplicates?: boolean;
  dataset?: ('job_board' | 'f500')[];
}

export interface ApiResponse {
  status: 'success' | 'error' | 'no_data';
  message?: string;
  next_cursor?: number;
  total_count?: number;
  size?: number;
  job_credit_remaining?: number;
  job_data?: JobsPikrJob[];
}

// Core job data types
export interface JobBase {
  crawl_timestamp: string;
  url: string;
  job_title: string;
  company_name: string;
  post_date: string;
  uniq_id: string;
  job_board: string;
}

export interface JobMetadata {
  category?: string;
  city?: string;
  state?: string;
  country?: string;
  job_type?: 'Full Time' | 'Part Time' | 'Contract' | 'Internship' | 'Volunteer';
  salary_offered?: string;
  contact_email?: string;
  contact_phone_number?: string;
  valid_through?: string;
}

export interface JobInferredData {
  inferred_city?: string;
  inferred_state?: string;
  inferred_country?: string;
  inferred_department_name?: string;
  inferred_department_score?: number;
  is_remote?: boolean;
  inferred_salary_currency?: string;
  inferred_salary_from?: number;
  inferred_salary_to?: number;
  inferred_skills?: string[];
}

export type JobsPikrJob = JobBase & JobMetadata & JobInferredData;

export interface QueryResult {
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