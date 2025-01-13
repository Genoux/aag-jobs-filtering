// services/niceboard/NiceboardService.ts
// ✅

import { niceboardConfig } from '@config/niceboard'
import { JobsPikrJob } from '@localtypes/jobspikr'
import {
  NiceboardConfig,
  NiceboardJob,
  NiceboardJobPayload,
  NiceboardJobsResponse,
} from '@localtypes/niceboard'
import { delay, formatters, logger, validation } from '@utils'
import { BaseNiceboardService } from './base/BaseNiceboardService'
import { CompanyService } from './CompanyService'
import { JobTypeService } from './JobTypeService'
import { LocationService } from './LocationService'

interface ProcessingStats {
  total: number
  created: number
  skipped: number
  failed: number
}

export class NiceboardService extends BaseNiceboardService {
  private readonly companyService: CompanyService
  private readonly jobTypeService: JobTypeService
  private readonly locationService: LocationService

  constructor(config: Partial<NiceboardConfig> = {}) {
    const mergedConfig: NiceboardConfig = {
      ...niceboardConfig,
      ...config,
    }

    super(mergedConfig)
    this.companyService = new CompanyService(mergedConfig)
    this.jobTypeService = new JobTypeService(mergedConfig)
    this.locationService = new LocationService(mergedConfig)
  }

  async processJobs(jobs: JobsPikrJob[]): Promise<ProcessingStats> {
    const stats: ProcessingStats = {
      total: jobs.length,
      created: 0,
      skipped: 0,
      failed: 0,
    }

    try {
      const existingJobs = await this.fetchExistingJobs()

      for (const job of jobs) {
        console.log('Processing job:', job.company_name)
        try {
          logger.info(`Processing job: ${job.job_title} at ${job.company_name}`)
          await delay(this.config.requestDelay)

          if (await this.isJobDuplicate(job, existingJobs)) {
            logger.info(`Skipping duplicate job: ${job.job_title}`)
            stats.skipped++
            continue
          }

          await this.createJob(job)
          logger.info(`Successfully created job: ${job.job_title}`)
          stats.created++
        } catch (error) {
          logger.error(`Failed to process job "${job.job_title}"`, error)
          stats.failed++
        }
      }

      logger.info('Job processing completed', {
        stats: {
          total: stats.total,
          created: stats.created,
          skipped: stats.skipped,
          failed: stats.failed,
        },
      })

      return stats
    } catch (error) {
      logger.error('Failed to process jobs batch', error)
      throw error
    }
  }

  private async isJobDuplicate(
    job: JobsPikrJob,
    existingJobs: NiceboardJob[],
  ): Promise<boolean> {
    logger.info(`Checking ${existingJobs.length} existing jobs for duplicates`)

    const isDuplicate = existingJobs.some((existing) => {
      // Title match
      const titleMatch =
        existing.title?.toLowerCase() === job.job_title?.toLowerCase()
      logger.debug(`Title match: ${titleMatch}`, {
        newTitle: job.job_title,
        existingTitle: existing.title,
      })

      if (!titleMatch) return false

      const companyMatch =
        existing.company?.name?.toLowerCase() ===
        job.company_name?.toLowerCase()
      logger.debug(`Company match: ${companyMatch}`, {
        newCompany: job.company_name,
        existingCompany: existing.company?.name,
      })

      if (!companyMatch) return false

      // If we got here, it's a match
      logger.debug('Found match!', {
        match: {
          title: titleMatch,
          company: companyMatch,
        },
      })
      return true
    })

    logger.debug(`Final duplicate check result: ${isDuplicate}`)
    return isDuplicate
  }

  private async createJob(job: JobsPikrJob): Promise<void> {
    const [companyId, jobTypeId, locationId] = await Promise.all([
      this.companyService.getOrCreateCompany(job.company_name),
      this.jobTypeService.getJobTypeId(job.job_type),
      this.locationService.getLocationId(job.city, job.state, job.country),
    ])

    const payload = this.createJobPayload(job, companyId, jobTypeId, locationId)

    await this.makeRequest('/jobs', {
      method: 'POST',
      data: payload,
    })
  }

  private createJobPayload(
    job: JobsPikrJob,
    companyId: number,
    jobTypeId: number,
    locationId?: number,
  ): NiceboardJobPayload {
    const payload: NiceboardJobPayload = {
      company_id: companyId,
      jobtype_id: jobTypeId,
      title: job.job_title,
      description_html: formatters.sanitizeDescription(job),
      apply_by_form: true,
      is_published: true,
      remote_only: job.is_remote || false,
      location_id: locationId,
    }

    // Add application method
    if (job.apply_url && validation.isValidUrl(job.apply_url)) {
      payload.apply_by_form = false
      payload.apply_url = job.apply_url
    } else if (
      job.contact_email &&
      validation.isValidEmail(job.contact_email)
    ) {
      payload.apply_by_form = false
      payload.apply_email = job.contact_email
    }

    return payload
  }

  private async fetchExistingJobs(): Promise<NiceboardJob[]> {
    try {
      const response = await this.makeRequest<NiceboardJobsResponse>('/jobs', {
        method: 'GET',
      })
      return response.results.jobs
    } catch (error) {
      logger.error('Failed to fetch existing jobs', error)
      return []
    }
  }
}
