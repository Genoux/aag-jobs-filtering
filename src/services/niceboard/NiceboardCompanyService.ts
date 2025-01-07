// services/NiceboardCompanyService.ts
import axios from 'axios';
import { CreateCompanyPayload, CompanyResponse, NiceboardConfig } from '@localtypes/Niceboard';
import { niceboardConfig } from '@config/niceboard';

export class NiceboardCompanyService {
  private readonly config: NiceboardConfig;
  private readonly companyCache: Map<string, number>;

  constructor(config: Partial<NiceboardConfig> = {}) {
    this.config = { ...niceboardConfig, ...config };
    this.companyCache = new Map();
  }

  async getOrCreateCompany(companyName: string): Promise<number> {
    try {
      const cachedId = this.companyCache.get(companyName);
      if (cachedId) {
        console.log(`Using cached company ID for "${companyName}": ${cachedId}`);
        return cachedId;
      }

      const response = await this.createCompany({ name: companyName });

      const companyId = response.results.company.id;
      
      this.companyCache.set(companyName, companyId);
      console.log(`Created new company "${companyName}" with ID: ${companyId}`);
      
      return companyId;
    } catch (error) {
      console.error(`Failed to create company "${companyName}". Error:`, error);
      return this.config.defaultCompanyId;
    }
  }

  private async createCompany(payload: CreateCompanyPayload): Promise<CompanyResponse> {
    try {
      const response = await axios.post<CompanyResponse>(
        `${this.config.apiBaseUrl}/companies`,
        payload,
        {
          params: { key: this.config.apiKey },
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if ('error' in response.data) {
        throw new Error(JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error) && error.response) {
      return new Error(JSON.stringify(error.response.data));
    }
    return error instanceof Error ? error : new Error('Unknown error occurred');
  }
}