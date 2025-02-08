// services/JobSearchService.ts
import axios from 'axios'
import { jobspikrConfig } from '@config/jobspikr'
import { QueryResult } from '@localtypes/query'
import { jobQueries } from '@queries/jobQueries'
import { SearchQuery, JobsPikrApiResponse } from '@localtypes/job'

export class JobSearchService {
  async processAllQueries(): Promise<Record<string, QueryResult>> {
    const results: Record<string, QueryResult> = {}
    
    for (const [queryName, queryDef] of Object.entries(jobQueries)) {
      console.log(`Processing: ${queryDef.name}`)
      try {
        const searchDate = new Date()
        const apiResponse = await this.searchWithPresetQuery(
          queryName as keyof typeof jobQueries,
        )
        if (!apiResponse) {
          console.warn(`No data returned for query "${queryName}"`)
          continue
        }

        results[queryName] = {
          query: {
            name: queryDef.name,
            description: queryDef.description,
          },
          stats: {
            totalFound: apiResponse.total_count || 0,
            returned: apiResponse.job_data?.length || 0,
            searchDate: this.formatDate(searchDate),
          },
          jobs: apiResponse.job_data || [],
        }
        
      } catch (error) {
        console.error(`Error processing query "${queryName}":`, error)
      }
    }
    
    return results
  }
  private async searchWithPresetQuery(
    queryName: keyof typeof jobQueries
  ): Promise<JobsPikrApiResponse | null> {
    const queryDef = jobQueries[queryName]
    if (!queryDef) {
      throw new Error(`Query "${queryName}" not found`)
    }
    
    const response = await this.makeApiRequest(queryDef.buildQuery())
    // The response.data is the JobsPikrApiResponse
    return response.data 
  }

  private async makeApiRequest(query: SearchQuery) {
    try {
      return await axios.post<JobsPikrApiResponse>(
        `${jobspikrConfig.API_BASE_URL}/data`,
        query,
        { headers: jobspikrConfig.headers },
      )
    } catch (error) {
      throw this.handleApiError(error)
    }
  }

  private handleApiError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
      })
      return new Error(
        `JobsPikr API error: ${error.response?.data?.message || error.message}`,
      )
    }
    return error instanceof Error ? error : new Error('Unknown error occurred')
  }

  private formatDate(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }
}
