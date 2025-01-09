// services/JobSearchService.ts
import axios from 'axios';
import { jobspikrConfig } from '@config/jobspikr';
import { jobQueries } from '@queries/jobQueries';
import { ApiResponse, SearchQuery } from '@localtypes/JobsPikr';
import { SavedQueryResult } from '@localtypes/JobSearch';

export class JobSearchService {
  async processAllQueries(): Promise<Record<string, SavedQueryResult>> {
    const results: Record<string, SavedQueryResult> = {};
    
    for (const [queryName, queryDef] of Object.entries(jobQueries)) {
      console.log(`Processing: ${queryDef.name}`);
      
      try {
        const searchDate = new Date();
        const result = await this.searchWithPresetQuery(
          queryName as keyof typeof jobQueries,
        );
        
        results[queryName] = {
          query: {
            name: queryDef.name,
            description: queryDef.description,
          },
          stats: {
            totalFound: result.total_count || 0,
            returned: result.job_data?.length || 0,
            searchDate: this.formatDate(searchDate),
          },
          jobs: result.job_data || [],
        };
        
        await this.delay(1000);
      } catch (error) {
        console.error(`Error processing query "${queryName}":`, error);
      }
    }
    
    return results;
  }

  private async searchWithPresetQuery(queryName: keyof typeof jobQueries): Promise<ApiResponse> {
    const queryDef = jobQueries[queryName];
    if (!queryDef) {
      throw new Error(`Query "${queryName}" not found`);
    }
    const response = await this.makeApiRequest(queryDef.buildQuery());
    return response.data;
  }

  private async makeApiRequest(query: SearchQuery) {
    try {
      return await axios.post<ApiResponse>(
        `${jobspikrConfig.API_BASE_URL}/data`,
        query,
        { headers: jobspikrConfig.headers },
      );
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  private handleApiError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
      return new Error(
        `JobsPikr API error: ${error.response?.data?.message || error.message}`,
      );
    }
    return error instanceof Error ? error : new Error('Unknown error occurred');
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
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}