// types/JobSearch.ts
import { JobsPikrJob } from './JobsPikr';

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
  title: string;
  company: string;
  city?: string;
  state?: string;
  country?: string;
  job_type: string;
  is_remote: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string;
  description: string;
  apply_url: string;
  contact_email: string;
  post_date: string;
  original_url: string;
}

export interface QuerySummaryStats {
  name: string;
  description: string;
  jobCount: number;
  locations: Record<string, number>;
  jobTypes: Record<string, number>;
  remoteCount: number;
  salaryStats: {
    min: number;
    max: number;
    currency: string;
    count: number;
  } | null;
  expiredCount: number;
}

export interface DailySummary {
  timestamp: string;
  queries: Record<string, QuerySummaryStats>;
  totalJobs: number;
  queryCount: number;
}