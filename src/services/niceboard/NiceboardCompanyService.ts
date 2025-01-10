// services/NiceboardCompanyService.ts
import axios from 'axios'
import { niceboardConfig } from '@config/niceboard'
import {
  CompanyResponse,
  CreateCompanyPayload,
  NiceboardConfig,
} from '@localtypes/Niceboard'

export class NiceboardCompanyService {
  private readonly config: NiceboardConfig
  private readonly companyCache: Map<string, number>

  constructor(config: Partial<NiceboardConfig> = {}) {
    this.config = { ...niceboardConfig, ...config }
    this.companyCache = new Map()
  }

  async getOrCreateCompany(companyName: string): Promise<number> {
    try {
      // Check cache first
      const cachedId = this.companyCache.get(companyName)
      if (cachedId) {
        console.log(`Using cached company ID for "${companyName}": ${cachedId}`)
        return cachedId
      }

      // Try to find existing company
      const existingCompany = await this.findCompany(companyName)
      if (existingCompany) {
        const companyId = existingCompany.id
        this.companyCache.set(companyName, companyId)
        console.log(
          `Found existing company "${companyName}" with ID: ${companyId}`,
        )
        return companyId
      }

      // Create new company if it doesn't exist
      const response = await this.createCompany({ name: companyName })
      const companyId = response.results.company.id
      this.companyCache.set(companyName, companyId)
      console.log(`Created new company "${companyName}" with ID: ${companyId}`)
      return companyId
    } catch (error) {
      console.error(`Failed to handle company "${companyName}". Error:`, error)
      return this.config.defaultCompanyId
    }
  }

  async fetchAllCompanies(): Promise<Map<string, number>> {
    const response = await axios.get(`${this.config.apiBaseUrl}/companies`, {
      params: { key: this.config.apiKey },
    });

    console.log('Companies response:', response.data);
  
    const companies = response.data?.results.companies || [];
    return new Map(companies.map((company: any) => company));
  }

  private async findCompany(
    companyName: string,
  ): Promise<{ id: number } | null> {
    try {
      const response = await axios.get(`${this.config.apiBaseUrl}/companies`, {
        params: {
          key: this.config.apiKey,
          name: companyName,
        },
      })

      const existingCompany = response.data.results.companies.find(
        (company: { name: string }) => company.name === companyName,
      )

      return existingCompany
    } catch (error) {
      console.warn(`Failed to search for company "${companyName}":`, error)
      return null
    }
  }

  private async createCompany(
    payload: CreateCompanyPayload,
  ): Promise<CompanyResponse> {
    try {
      const response = await axios.post<CompanyResponse>(
        `${this.config.apiBaseUrl}/companies`,
        payload,
        {
          params: { key: this.config.apiKey },
          headers: { 'Content-Type': 'application/json' },
        },
      )

      if ('error' in response.data) {
        throw new Error(JSON.stringify(response.data))
      }

      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error) && error.response) {
      return new Error(JSON.stringify(error.response.data))
    }
    return error instanceof Error ? error : new Error('Unknown error occurred')
  }
}
