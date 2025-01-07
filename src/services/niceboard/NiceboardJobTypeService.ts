// services/NiceboardJobTypeService.ts
import axios from 'axios';
import { NiceboardConfig, JobTypesResponse } from '@localtypes/Niceboard';
import { niceboardConfig } from '@config/niceboard';

export class NiceboardJobTypeService {
  private readonly config: NiceboardConfig;
  private jobTypesCache: Map<string, number>;
  private initialized: boolean = false;

  constructor(config: Partial<NiceboardConfig> = {}) {
    this.config = { ...niceboardConfig, ...config };
    this.jobTypesCache = new Map();
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      try {
        await this.loadJobTypes();
      } catch (error) {
        console.warn('Failed to load job types, using default job type');

        this.jobTypesCache.set('full time', this.config.defaultJobTypeId);
        this.jobTypesCache.set('part time', this.config.defaultJobTypeId);
        this.jobTypesCache.set('contract', this.config.defaultJobTypeId);
      }
      this.initialized = true;
    }
  }

  private async loadJobTypes(): Promise<void> {
    try {
      const response = await axios.get<JobTypesResponse>(
        `${this.config.apiBaseUrl}/jobtypes`,
        {
          params: { key: this.config.apiKey }
        }
      );

      if (!response.data.error && response.data.results) {
        this.jobTypesCache.clear();
        response.data.results.jobtypes.forEach(jobType => {
          this.jobTypesCache.set(jobType.name.toLowerCase(), jobType.id);
        });

        console.log('Loaded job types:', Array.from(this.jobTypesCache.entries()));
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.warn(`Job types API error: ${error.response?.status} - Using default job type`);
      }
      throw error;
    }
  }

  async getOrCreateJobType(jobType: string): Promise<number> {
    await this.initialize();

    const matchedType = this.findMatchingJobType(jobType);
    if (matchedType) {
      return matchedType;
    }

    return this.config.defaultJobTypeId;
  }

  private findMatchingJobType(jobType: string): number | undefined {
    const type = jobType.toLowerCase();
    return this.jobTypesCache.get(type) || this.config.defaultJobTypeId;
  }
}