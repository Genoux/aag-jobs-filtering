import axios from 'axios';
import { JobsPikrJob } from '@localtypes/JobSearch';
import { 
  BaseNiceboardJobPayload,
  NiceboardJobPayload, 
  NiceboardConfig,
  SalaryTimeframe,
  JobsPikrTimeUnit 
} from '@localtypes/Niceboard';
import { niceboardConfig } from '@config/niceboard';
import { NiceboardCompanyService } from './NiceboardCompanyService';
import { NiceboardJobTypeService } from './NiceboardJobTypeService';
export class NiceboardService {
  private readonly config: NiceboardConfig;
  private readonly companyService: NiceboardCompanyService;
  private readonly jobTypeService: NiceboardJobTypeService;

  constructor(config: Partial<NiceboardConfig> = {}) {
    this.config = { ...niceboardConfig, ...config };
    this.companyService = new NiceboardCompanyService(config);
    this.jobTypeService = new NiceboardJobTypeService(config);
  }

  async processJobs(jobs: JobsPikrJob[]): Promise<void> {
    for (const job of jobs) {
      try {
        await this.postJob(job);
        console.log(`✓ Successfully posted job: ${job.job_title}`);
        await this.delay(this.config.requestDelay);
      } catch (error) {
        console.error(`✗ Failed to post job "${job.job_title}":`);
        if (error instanceof Error) {
          try {
            const errorData = JSON.parse(error.message);
            Object.entries(errorData).forEach(([key, value]) => {
              if (value) console.error(`  - ${key}: ${value}`);
            });
          } catch {
            console.error(`  - Error: ${error.message}`);
          }
        }
      }
    }
}

  private async postJob(job: JobsPikrJob): Promise<any> {
    try {
      const payload = await this.mapJobToPayload(job);

      const response = await axios.post(
        `${this.config.apiBaseUrl}/jobs`,
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
          params: { key: this.config.apiKey }
        }
      );

      if (response.data && !response.data.error) {
        return response.data;
      }

      throw new Error(JSON.stringify(response.data));
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async mapJobToPayload(job: JobsPikrJob): Promise<NiceboardJobPayload> {
    const companyId = await this.companyService.getOrCreateCompany(job.company_name);
    
    const jobTypeId = await this.jobTypeService.getOrCreateJobType(
      job.job_type || 'Full Time'
    );

    const basePayload: BaseNiceboardJobPayload = {
      company_id: companyId,
      jobtype_id: jobTypeId, 
      title: job.job_title,
      description_html: this.sanitizeDescription(job),
      apply_by_form: false,
      is_published: true
    };

    let applicationPayload: NiceboardJobPayload;
    if (job.apply_url && this.isValidUrl(job.apply_url)) {
      applicationPayload = {
        ...basePayload,
        apply_by_form: false,
        apply_url: job.apply_url
      };
    } else if (job.contact_email && this.isValidEmail(job.contact_email)) {
      applicationPayload = {
        ...basePayload,
        apply_by_form: false,
        apply_email: job.contact_email
      };
    } else {
      throw new Error('Either valid apply_url or apply_email is required');
    }

    if (job.inferred_salary_from) 
      applicationPayload.salary_min = job.inferred_salary_from;
    if (job.inferred_salary_to) 
      applicationPayload.salary_max = job.inferred_salary_to;
    if (job.inferred_salary_time_unit) 
      applicationPayload.salary_timeframe = this.mapSalaryTimeframe(job.inferred_salary_time_unit);
    if (job.inferred_salary_currency) 
      applicationPayload.salary_currency = job.inferred_salary_currency;
    if (job.is_remote !== undefined) {
      applicationPayload.is_remote = job.is_remote;
      applicationPayload.remote_only = job.is_remote;
    }

    return applicationPayload;
  }

  private sanitizeDescription(job: JobsPikrJob): string {
    if (job.html_job_description) {
      return job.html_job_description;
    }
    if (job.job_description) {
      return `<p>${job.job_description}</p>`;
    }
    return '<p>No description provided</p>';
  }

  private mapSalaryTimeframe(timeUnit?: JobsPikrTimeUnit): SalaryTimeframe | undefined {
    const mapping: Record<JobsPikrTimeUnit, SalaryTimeframe> = {
      yearly: 'annually',
      monthly: 'monthly',
      weekly: 'weekly',
      hourly: 'hourly',
      daily: 'weekly'
    };

    return timeUnit ? mapping[timeUnit] : undefined;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || error.status;
      const data = error.response?.data;
      
      const errorDetails = {
        status,
        ...(typeof data === 'object' ? data : {})
      };

      return new Error(JSON.stringify(errorDetails));
    }
    return error instanceof Error ? error : new Error('Unknown error occurred');
}

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}