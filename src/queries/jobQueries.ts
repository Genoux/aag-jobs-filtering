// queries/jobQueries.ts
import { SearchQuery } from '@localtypes/job'

export interface QueryDefinition {
  name: string
  description: string
  buildQuery: () => SearchQuery
}

export const jobQueries: Record<string, QueryDefinition> = {
  healthcareJobs: {
    name: 'Physician Jobs in US',
    description: 'Physician positions across the United States',
    buildQuery: () => ({
      format: "json",
      size: 50,
      dataset: ["job_board"],
      search_query_json: {
        bool: {
          must: [
            // Job titles with specializations
            {
              query_string: {
                fields: ['job_title'],
                query: `
                  ("Physician" OR "Doctor" OR "MD" OR "DO") AND 
                  (
                    "Family Medicine" OR
                    "Internal Medicine" OR
                    "Pediatric" OR
                    "OB GYN" OR "Obstetrics" OR "Gynecology" OR
                    "Surgery" OR "Surgeon" OR
                    "Cardiology" OR "Heart" OR
                    "Dermatology" OR "Skin" OR
                    "Oncology" OR "Cancer" OR
                    "Psychiatry" OR "Mental Health" OR
                    "Neurology" OR "Brain" OR
                    "Radiology" OR "Imaging" OR
                    "Anesthesiology" OR
                    "Emergency Medicine" OR "ER" OR
                    "Pathology" OR "Lab" OR
                    "Endocrinology" OR "Diabetes" OR
                    "Gastroenterology" OR "GI" OR
                    "Pulmonology" OR "Lung" OR
                    "Nephrology" OR "Kidney" OR
                    "Rheumatology" OR "Arthritis" OR
                    "ENT" OR "Ear Nose Throat" OR
                    "Geriatric" OR "Senior" OR
                    "Critical Care" OR "ICU" OR
                    "Hospitalist"
                  )
                `
              }
            },
            // Description must indicate it's a physician role
            {
              query_string: {
                fields: ['job_description'],
                query: `
                  (
                    "Medical Doctor" OR "Doctor of Medicine" OR "Doctor of Osteopathy" OR
                    "Board Certified" OR "Board Eligible" OR
                    "MD" OR "DO" OR "Medical License" OR "State License"
                  )
                  AND
                  (
                    "clinical practice" OR "patient care" OR "diagnose and treat" OR
                    "medical staff" OR "hospital privileges" OR "private practice" OR
                    "residency completed" OR "fellowship" OR "medical degree"
                  )
                `
              }
            },
            // Required fields
            {
              exists: {
                field: "job_type"
              }
            },
            {
              query_string: {
                default_field: 'company_name',
                query: '*'
              }
            },
            {
              query_string: {
                default_field: 'is_remote',
                query: '*'
              }
            },
            {
              exists: {
                field: "category"
              }
            },
            // Location filter
            {
              bool: {
                should: [
                  {
                    bool: {
                      must: [
                        {
                          query_string: {
                            fields: ['inferred_country'],
                            query: '"United States" OR "USA" OR "US"'
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            },
            // Date and status
            {
              range: {
                post_date: {
                  gte: new Date(new Date().setDate(new Date().getDate() - 14))
                    .toISOString()
                    .split('T')[0],
                  lte: new Date().toISOString().split('T')[0],
                }
              }
            },
            {
              query_string: {
                default_field: "has_expired",
                query: "false",
              }
            },
            // Contact requirements
            {
              bool: {
                should: [
                  { exists: { field: "contact_email" } },
                  { exists: { field: "apply_url" } }
                ]
              }
            }
          ],
          must_not: [
            {
              query_string: {
                default_field: 'job_board',
                query: 'company_website'
              }
            },
            {
              query_string: {
                default_field: 'company_name',
                query: 'Unspecified'
              }
            }
          ]
        }
      }
    })
  }
}