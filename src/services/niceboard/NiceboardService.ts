import crypto from 'crypto'
import axios from 'axios'
import { niceboardConfig } from '@config/niceboard'
import { JobsPikrJob, JobsPikrTimeUnit } from '@localtypes/JobsPikr'
import {
  BaseNiceboardJobPayload,
  NiceboardConfig,
  NiceboardJobPayload,
  SalaryTimeframe,
} from '@localtypes/Niceboard'
import { NiceboardCompanyService } from '@services/niceboard/NiceboardCompanyService'
import { NiceboardJobTypeService } from '@services/niceboard/NiceboardJobTypeService'
import { NiceboardLocationService } from '@services/niceboard/NiceboardLocationService'

export class NiceboardService {
  private readonly config: NiceboardConfig
  private readonly companyService: NiceboardCompanyService
  private readonly jobTypeService: NiceboardJobTypeService
  private readonly locationService: NiceboardLocationService

  constructor(config: Partial<NiceboardConfig> = {}) {
    this.config = { ...niceboardConfig, ...config }
    this.companyService = new NiceboardCompanyService(config)
    this.jobTypeService = new NiceboardJobTypeService(config)
    this.locationService = new NiceboardLocationService(config)
  }

  async processJobs(jobs: JobsPikrJob[]): Promise<void> {
    console.log("Fetching existing jobs...");
    const existingJobs = await this.fetchExistingJobs();
  
    console.log("Fetching existing companies and locations...");
    const existingCompanies = await this.companyService.fetchAllCompanies();
    const existingLocations = await this.locationService.fetchAllLocations();
  
    for (const job of jobs) {
      await this.delay(this.config.requestDelay);
  
      try {
        // Check for duplicates
        const isDuplicate = existingJobs.some(
          (existingJob) =>
            existingJob.job_title === job.job_title &&
            existingJob.company_name === job.company_name &&
            existingJob.city === job.city &&
            existingJob.state === job.state &&
            existingJob.country === job.country &&
            existingJob.job_type === job.job_type &&
            existingJob.post_date === job.post_date
        );
  
        if (isDuplicate) {
          console.log(
            `⚠ Skip duplicate job: ${job.job_title} at ${job.company_name} (${job.city || 'No location'})`
          );
          continue;
        }
  
        // Post the job using pre-fetched data
        await this.postJob(job, existingCompanies, existingLocations);
        console.log(`✓ Successfully posted job: ${job.job_title}`);
      } catch (error: unknown) {
        console.error(`✗ Failed to post job "${job.job_title}":`, error instanceof Error ? error.message : error);
      }
    }
  }

  private async fetchExistingJobs(): Promise<Partial<JobsPikrJob>[]> {
    try {
      const response = await axios.get(`${this.config.apiBaseUrl}/jobs`, {
        params: { key: this.config.apiKey },
      });
  
      if (response.data?.results?.jobs) {
        return response.data.results.jobs.map((job: any) => ({
          job_title: job.title,
          company_name: job.company_name,
          city: job.city,
          state: job.state,
          country: job.country,
          job_type: job.job_type,
          post_date: job.post_date,
        }));
      }
  
      return [];
    } catch (error) {
      console.error("Failed to fetch existing jobs:", error);
      return [];
    }
  }
  

  private async postJob(
    job: JobsPikrJob,
    existingCompanies: Map<string, number>, // Pre-fetched company data
    existingLocations: Map<string, number> // Pre-fetched location data
  ): Promise<any> {
    try {
      const companyId = existingCompanies.get(job.company_name) 
                       || (await this.companyService.getOrCreateCompany(job.company_name));
      const locationId = existingLocations.get(this.getLocationKey(job)) 
                        || (await this.locationService.getOrCreateLocation(
                            job.city || '',
                            job.state || '',
                            job.country || ''
                          ));
  
      const payload = await this.mapJobToPayload(job);
  
      const response = await axios.post(
        `${this.config.apiBaseUrl}/jobs`,
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
          params: { key: this.config.apiKey },
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
  
  private getLocationKey(job: JobsPikrJob): string {
    return `${job.city || ''},${job.state || ''},${job.country || ''}`.toLowerCase();
  }

  private async mapJobToPayload(
    job: JobsPikrJob,
  ): Promise<NiceboardJobPayload> {
    const [companyId, jobTypeId, locationId] = await Promise.all([
      this.companyService.getOrCreateCompany(job.company_name),
      this.jobTypeService.getJobTypeId(job.job_type || ''),
      this.locationService.getOrCreateLocation(
        job.city || '',
        job.state || '',
        job.country || '',
      ),
    ])

    const basePayload: Omit<BaseNiceboardJobPayload, 'apply_email' | 'apply_url'> = {
      company_id: companyId,
      jobtype_id: jobTypeId,
      title: job.job_title,
      description_html: this.sanitizeDescription(job),
      apply_by_form: true,
      is_published: true,
      remote_only: job.is_remote,
      location_id: locationId,
      salary_min: job.inferred_salary_from,
      salary_max: job.inferred_salary_to,
      salary_timeframe: this.mapSalaryTimeframe(job.inferred_salary_time_unit),
      salary_currency: job.inferred_salary_currency,
    }

    let applicationPayload = { ...basePayload } as NiceboardJobPayload

    if (job.apply_url && this.isValidUrl(job.apply_url)) {
      applicationPayload.apply_by_form = false
      applicationPayload.apply_url = job.apply_url
    } else if (job.contact_email && this.isValidEmail(job.contact_email)) {
      applicationPayload.apply_by_form = false
      applicationPayload.apply_email = job.contact_email
    }

    // if (job.inferred_salary_from)
    //   applicationPayload.salary_min = job.inferred_salary_from
    // if (job.inferred_salary_to)
    //   applicationPayload.salary_max = job.inferred_salary_to
    // if (job.inferred_salary_time_unit)
    //   applicationPayload.salary_timeframe = this.mapSalaryTimeframe(
    //     job.inferred_salary_time_unit,
    //   )
    // if (job.inferred_salary_currency)
    //   applicationPayload.salary_currency = job.inferred_salary_currency
    // if (job.is_remote !== undefined) {
    //   applicationPayload.is_remote = job.is_remote
    //   applicationPayload.remote_only = job.is_remote
    // }

    return applicationPayload
  }

  private sanitizeDescription(job: JobsPikrJob): string {
    if (job.html_job_description) {
      return job.html_job_description
    }
    if (job.job_description) {
      return `<p>${job.job_description}</p>`
    }
    return '<p>No description provided</p>'
  }

  private mapSalaryTimeframe(
    timeUnit?: JobsPikrTimeUnit,
  ): SalaryTimeframe | undefined {
    const mapping: Record<JobsPikrTimeUnit, SalaryTimeframe> = {
      yearly: 'annually',
      monthly: 'monthly',
      weekly: 'weekly',
      hourly: 'hourly',
      daily: 'weekly',
    }

    return timeUnit ? mapping[timeUnit] : undefined
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error) && error.response) {
      return new Error(
        JSON.stringify({
          status: error.response.status,
          ...(typeof error.response.data === 'object'
            ? error.response.data
            : {}),
        }),
      )
    }
    return error instanceof Error ? error : new Error('Unknown error occurred')
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
