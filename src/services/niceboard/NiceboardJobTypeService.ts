import axios from 'axios'
import { niceboardConfig } from '@config/niceboard'
import { JobTypesResponse, NiceboardConfig } from '@localtypes/Niceboard'

export class NiceboardJobTypeService {
  private readonly config: NiceboardConfig
  private jobTypesCache: Map<string, number>
  private initialized: boolean = false
  private readonly FULL_TIME_ID = 19377

  constructor(config: Partial<NiceboardConfig> = {}) {
    this.config = { ...niceboardConfig, ...config }
    this.jobTypesCache = new Map()
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      try {
        const response = await axios.get<JobTypesResponse>(
          `${this.config.apiBaseUrl}/jobtypes`,
          {
            params: { key: this.config.apiKey },
          },
        )
        if (!response.data.error && response.data.results) {
          response.data.results.jobtypes.forEach((jobType) => {
            this.jobTypesCache.set(jobType.name.toLowerCase(), jobType.id)
          })
        }
      } catch (error) {
        console.warn('Failed to load job types, will default to full time')
      }
      this.initialized = true
    }
  }

  async getJobTypeId(jobType: string): Promise<number> {
    await this.initialize()
    const type = jobType?.toLowerCase()
    return this.jobTypesCache.get(type) || this.FULL_TIME_ID
  }
}