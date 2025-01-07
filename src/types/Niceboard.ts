// types/Niceboard.ts
export interface BaseNiceboardJobPayload {
  company_id: number;
  jobtype_id: number;
  title: string;
  description_html: string;
  apply_by_form: boolean;
  is_published: boolean;
  salary_min?: number;
  salary_max?: number;
  salary_timeframe?: 'annually' | 'monthly' | 'hourly' | 'weekly';
  salary_currency?: string;
  is_remote?: boolean;
  remote_only?: boolean;
  category_id?: number;
  secondary_category_id?: number;
  location_id?: number;
  tags?: string;
  remote_required_location?: string;
  is_featured?: boolean;
  published_at?: string;
  expires_on?: string;
}

export interface FormApplicationJob extends BaseNiceboardJobPayload {
  apply_by_form: true;
  apply_url?: never;
  apply_email?: never;
}

export interface UrlApplicationJob extends BaseNiceboardJobPayload {
  apply_by_form: false;
  apply_url: string;
  apply_email?: never;
}

export interface EmailApplicationJob extends BaseNiceboardJobPayload {
  apply_by_form: false;
  apply_url?: never;
  apply_email: string;
}

export type NiceboardJobPayload = FormApplicationJob | UrlApplicationJob | EmailApplicationJob;

export interface NiceboardConfig {
  apiBaseUrl: string;
  apiKey: string;
  defaultCompanyId: number;
  defaultJobTypeId: number;
  requestDelay: number;
}

export interface CreateCompanyPayload {
  name: string;
  site_url?: string;
  twitter_handle?: string;
  linkedin_url?: string;
  facebook_url?: string;
  tagline?: string;
  description?: string;
  email?: string;
  password?: string;
  logo?: string;
}

export interface CompanyResponse {
  success: boolean;
  message: string;
  results: {
    company: {
      id: number;
      name: string;
      slug: string;
    };
  };
}

export interface JobType {
  id: number;
  name: string;
}

export interface JobTypesResponse {
  error: boolean;
  results: {
    total_count: number;
    jobtypes: JobType[];
  };
}

export interface CreateJobTypePayload {
  name: string;
}

export type SalaryTimeframe = 'annually' | 'monthly' | 'hourly' | 'weekly';
export type JobsPikrTimeUnit = 'yearly' | 'monthly' | 'weekly' | 'hourly' | 'daily';