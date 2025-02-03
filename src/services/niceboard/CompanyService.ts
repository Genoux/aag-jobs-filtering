// services/niceboard/CompanyService.ts
// ✅

import { logger } from '@utils'
import { BaseNiceboardService } from './base/BaseNiceboardService'

export interface Company {
  id: number
  name: string
}

export interface CompaniesApiResponse {
  total_count: number
  companies: Company[]
}

export interface CompanyApiResponse {
  error: boolean
  results: {
    company: Company
  }
}

export interface CreateCompanyPayload {
  name: string
}

export class CompanyService extends BaseNiceboardService {
  async getOrCreateCompany(companyName: string): Promise<number> {
    try {
      const cachedId = this.cache.get(companyName)
      if (cachedId) {
        logger.info(`Company "${companyName}" found in cache: ${cachedId}`)
        return cachedId
      }

      const response = await this.makeRequest<CompaniesApiResponse>(
        '/companies',
        {
          method: 'GET',
          params: { name: companyName },
        },
      )

      const company = response.results.companies.find(
        (c: Company) => c.name === companyName,
      )

      if (company) {
        this.cache.set(companyName, company.id)
        return company.id
      }

      // Create new company if not found
      const newResponse = await this.createCompany({ name: companyName })
      logger.info(`New company created: ${newResponse.results.company.id}`)
      const newCompany = newResponse.results.company
      this.cache.set(companyName, newCompany.id)
      return newCompany.id
    } catch (error) {
      logger.error(`Failed to handle company "${companyName}"`, error)
      return this.config.defaultCompanyId
    }
  }

  async fetchAllCompanies(): Promise<Map<string, number>> {
    const response = await this.makeRequest<CompaniesApiResponse>(
      '/companies',
      {
        method: 'GET',
      },
    )

    const companiesMap = new Map<string, number>()
    response.results.companies.forEach((company: Company) => {
      companiesMap.set(company.name, company.id)
    })
    return companiesMap
  }

  private async createCompany(
    payload: CreateCompanyPayload,
  ): Promise<CompanyApiResponse> {
    return this.makeRequest('/companies', {
      method: 'POST',
      data: payload,
    })
  }

  async removeCompany(companyId: number): Promise<CompanyApiResponse> {
    return this.makeRequest(`/companies/${companyId}`, {
      method: 'DELETE',
    })
  }
}
