// services/niceboard/JobTypeService.ts
// ✅

import { logger } from '@utils'
import { BaseNiceboardService } from './base/BaseNiceboardService'

interface JobType {
  id: number
  name: string
  slug: string
  created_at: string
  updated_at: string
  secondary_lang_name: string | null
}

interface JobTypesApiResponse {
  total_count: number
  jobtypes: JobType[]
}

interface JobTypeApiResponse {
  error: boolean
  results: {
    jobtype: JobType
  }
}

interface CreateJobTypePayload {
  name: string
}

export class JobTypeService extends BaseNiceboardService {
  private readonly FULL_TIME_ID = 19377 // Default fallback ID

  async getJobTypeId(jobTypeName: string): Promise<number> {
    try {
      const cachedId = this.cache.get(jobTypeName)
      if (cachedId) {
        return cachedId
      }

      const response = await this.makeRequest<JobTypesApiResponse>(
        '/jobtypes',
        {
          method: 'GET',
          params: { name: jobTypeName },
        },
      )

      const jobType = response.results.jobtypes.find(
        (jt: JobType) => jt.name.toLowerCase() === jobTypeName.toLowerCase(),
      )

      if (jobType) {
        this.cache.set(jobTypeName, jobType.id)
        return jobType.id
      }

      logger.info(
        `Job type "${jobTypeName}" not found in Niceboard, using fallback ID: ${this.FULL_TIME_ID} (Full Time)`,
      )
      return this.FULL_TIME_ID
    } catch (error) {
      logger.error(`Failed to handle job type "${jobTypeName}"`, error)
      return this.FULL_TIME_ID
    }
  }

  async fetchAllJobTypes(): Promise<Map<string, number>> {
    const response = await this.makeRequest<JobTypesApiResponse>('/jobtypes', {
      method: 'GET',
    })

    const jobTypesMap = new Map<string, number>()
    response.results.jobtypes.forEach((jobType: JobType) => {
      jobTypesMap.set(jobType.name.toLowerCase(), jobType.id)
    })
    return jobTypesMap
  }
}
