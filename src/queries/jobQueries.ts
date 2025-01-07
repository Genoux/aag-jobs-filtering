// queries/jobQueries.ts
import { SearchQuery } from '@localtypes/JobSearch';

export interface QueryDefinition {
  name: string;
  description: string;
  buildQuery: () => SearchQuery;
}

export const jobQueries: Record<string, QueryDefinition> = {
  techJobs: {
    name: "Tech Jobs in US",
    description: "Software positions in major US cities",
    buildQuery: () => ({
      size: 10,
      format: "json",
      search_query_json: {
        bool: {
          must: [
            {
              query_string: {
                fields: ["job_title"],
                query: '"software engineer" OR "software developer"'
              }
            },
            {
              exists: {
                field: "company_name"
              }
            },
            {
              bool: {
                must_not: {
                  term: {
                    company_name: ""
                  }
              }
            }
            }
          ]
        }
      }
    })
  }
};