import axios from 'axios';
import crypto from 'crypto';
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
import { NiceboardLocationService } from './NiceboardLocationService';

export class NiceboardService {
  private readonly config: NiceboardConfig;
  private readonly companyService: NiceboardCompanyService;
  private readonly jobTypeService: NiceboardJobTypeService;
  private readonly locationService: NiceboardLocationService;

  constructor(config: Partial<NiceboardConfig> = {}) {
    this.config = { ...niceboardConfig, ...config };
    this.companyService = new NiceboardCompanyService(config);
    this.jobTypeService = new NiceboardJobTypeService(config);
    this.locationService = new NiceboardLocationService(config);
  }

  async processJobs(jobs: JobsPikrJob[]): Promise<void> {
    for (const job of jobs) {
      try {
        const isDuplicate = await this.findDuplicateJob(job);
        if (isDuplicate) {
          console.log(`⚠ Skip duplicate job: ${job.job_title} at ${job.company_name} (${job.city || 'No location'})`);
          continue;
        }

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
            console.error(`  - ${error.message}`);
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

  private createJobSignature(job: JobsPikrJob): string {
    const elements = [
      job.job_title,
      job.company_name,
      job.city || '',
      job.state || '',
      job.country || '',
      job.job_type || '',
      job.post_date
    ].map(s => s.toLowerCase().trim());

    return crypto.createHash('md5').update(elements.join('|')).digest('hex');
  }

  private async findDuplicateJob(job: JobsPikrJob): Promise<boolean> {
    try {
      const signature = this.createJobSignature(job);
      
      const response = await axios.get(
        `${this.config.apiBaseUrl}/jobs`,
        {
          params: {
            key: this.config.apiKey,
            company: job.company_name,
            title: job.job_title
          }
        }
      );

      if (response.data?.results?.jobs) {
        return response.data.results.jobs.some((existingJob : any) => {
          const existingSignature = this.createJobSignature({
            job_title: existingJob.title,
            company_name: existingJob.company_name,
            city: existingJob.city,
            state: existingJob.state,
            country: existingJob.country,
            job_type: existingJob.job_type,
            post_date: existingJob.post_date,
            uniq_id: existingJob.id.toString()
          } as JobsPikrJob);

          return existingSignature === signature;
        });
      }

      return false;
    } catch (error) {
      console.warn('Failed to check for duplicate job:', error);
      return false;
    }
  }

  private async mapJobToPayload(job: JobsPikrJob): Promise<NiceboardJobPayload> {
    const [companyId, jobTypeId, locationId] = await Promise.all([
      this.companyService.getOrCreateCompany(job.company_name),
      this.jobTypeService.getOrCreateJobType(job.job_type || ''),
      this.locationService.getOrCreateLocation(job.city || '', job.state || '', job.country || '')
    ]);

    const basePayload: BaseNiceboardJobPayload = {
      company_id: companyId,
      jobtype_id: jobTypeId,
      title: job.job_title,
      description_html: this.sanitizeDescription(job),
      apply_by_form: false,
      is_published: true,
      remote_only: job.is_remote,
      location_id: locationId
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
    if (axios.isAxiosError(error) && error.response) {
      return new Error(JSON.stringify({
        status: error.response.status,
        ...(typeof error.response.data === 'object' ? error.response.data : {})
      }));
    }
    return error instanceof Error ? error : new Error('Unknown error occurred');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}